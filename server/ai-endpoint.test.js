const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { resolveAiLanguage, healthSafetyPrompt, errorBody } = require('./ai-language');

// Exercise the registered production handler without starting other backend services.
function setup(create) {
  const source = fs.readFileSync(require('node:path').join(__dirname, 'index.js'), 'utf8');
  const start = source.indexOf("app.post(['/ask-stream', '/api/ai/stream']");
  const end = source.indexOf('// --- Medication Data Collection Endpoints ---', start);
  let handler;
  vm.runInNewContext(source.slice(start, end), {
    app: { post(paths, callback) { assert.deepEqual(Array.from(paths), ['/ask-stream', '/api/ai/stream']); handler = callback; } },
    client: { chat: { completions: { create } } }, resolveAiLanguage, healthSafetyPrompt, errorBody,
    process: { env: {} }, console: { error() {} },
  });
  const res = {
    statusCode: 200, headersSent: false, body: '',
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    type(value) { this.contentType = value; return this; },
    send(value) { this.body = value; return this; },
    writeHead() { this.headersSent = true; },
    write(value) { this.body += value; }, end() { this.ended = true; },
  };
  return { handler, res };
}
const messages = [{ role: 'user', content: 'Hello' }];
test('non-streaming returns plain text and uses server model', async () => {
  const { handler, res } = setup(async options => {
    assert.equal(options.model, 'gpt-4o-mini');
    assert.equal(options.messages[0].role, 'system');
    assert.equal(options.messages[0].content, healthSafetyPrompt('es'));
    assert.equal(options.messages[1].content, 'Hello');
    return { choices: [{ message: { content: 'Reply' } }] };
  });
  await handler({ body: { messages, stream: false } }, res);
  assert.equal(res.body, 'Reply');
  assert.equal(res.contentType, 'text/plain');
});
test('streaming sends raw tokens in order', async () => {
  const { handler, res } = setup(async function* () {
    yield { choices: [{ delta: { content: 'A' } }] };
    yield { choices: [{ delta: { content: 'B' } }] };
  });
  await handler({ body: { messages } }, res);
  assert.equal(res.body, 'AB'); assert.equal(res.ended, true);
});
test('invalid requests never call OpenAI', async () => {
  for (const body of [{}, { messages: [] }, { messages: [null] }, { messages: [{ role: 'user', content: 42 }] }]) {
    const { handler, res } = setup(() => { throw new Error('must not call provider'); });
    await handler({ body }, res); assert.equal(res.statusCode, 400);
  }
});
test('provider errors return a generic error without provider details', async () => {
  const { handler, res } = setup(async () => { throw new Error('provider detail'); });
  await handler({ body: { messages, stream: false } }, res);
  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.body, { ok: false, code: 'AI_UNAVAILABLE', error: 'AI_UNAVAILABLE' });
  assert.ok(!JSON.stringify(res.body).includes('provider detail'));
});

const first = async (req) => {
  let forwarded;
  const { handler, res } = setup(async options => { forwarded = options.messages; return { choices: [{ message: { content: 'ok' } }] }; });
  await handler(req, res);
  return { forwarded, res };
};
test('answers in the body language (en, es, de, fr, pt, zh) with the server safety policy first', async () => {
  const names = { en: 'English', es: 'Mexican Spanish', de: 'German', fr: 'French', pt: 'Portuguese', zh: 'Simplified Chinese' };
  for (const [language, name] of Object.entries(names)) {
    const { forwarded } = await first({ body: { messages, stream: false, language }, headers: { 'accept-language': 'fr' } });
    assert.equal(forwarded[0].role, 'system');
    assert.ok(forwarded[0].content.includes(`Write your entire answer in ${name}`), language);
    assert.match(forwarded[0].content, /not a doctor/);
    assert.match(forwarded[0].content, /Do not diagnose/);
    assert.match(forwarded[0].content, /start, stop or change medicines or doses/);
    assert.match(forwarded[0].content, /call 911/);
  }
});
test('falls back to Accept-Language (with q-values), then to Spanish', async () => {
  let r = await first({ body: { messages, stream: false }, headers: { 'accept-language': 'en-US,en;q=0.9,es;q=0.8' } });
  assert.ok(r.forwarded[0].content.includes('Write your entire answer in English'));
  r = await first({ body: { messages, stream: false }, headers: { 'accept-language': 'ja;q=1, de;q=0.5' } });
  assert.ok(r.forwarded[0].content.includes('German'));
  r = await first({ body: { messages, stream: false, language: 'ja' }, headers: {} });
  assert.ok(r.forwarded[0].content.includes('Mexican Spanish'));
  r = await first({ body: { messages, stream: false }, headers: { 'accept-language': '*' } });
  assert.ok(r.forwarded[0].content.includes('Mexican Spanish'));
});
test('single-message path and client system prompts keep the server policy first', async () => {
  let r = await first({ body: { message: 'hi', stream: false, language: 'en' } });
  assert.equal(r.forwarded.length, 2);
  assert.equal(r.forwarded[0].role, 'system');
  assert.equal(r.forwarded[1].content, 'hi');
  r = await first({ body: { messages: [{ role: 'system', content: 'client persona' }, { role: 'user', content: 'hi' }], stream: false, language: 'es' } });
  assert.equal(r.forwarded[0].content, healthSafetyPrompt('es'));
  assert.equal(r.forwarded[1].content, 'client persona');
});
test('validation errors are machine codes only', async () => {
  const { handler, res } = setup(() => { throw new Error('must not call provider'); });
  await handler({ body: {} }, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { ok: false, code: 'bad_request', error: 'bad_request' });
});
