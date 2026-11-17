const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { explicitAiLanguage, guessMessageLanguage, healthSafetyPrompt, errorBody, LEGACY_MESSAGES } = require('./ai-language');

// Exercise the registered production handler without starting other backend services.
function setup(create) {
  const source = fs.readFileSync(require('node:path').join(__dirname, 'index.js'), 'utf8');
  const start = source.indexOf("app.post(['/ask-stream', '/api/ai/stream']");
  const end = source.indexOf('// --- Medication Data Collection Endpoints ---', start);
  let handler;
  vm.runInNewContext(source.slice(start, end), {
    app: { post(paths, callback) { assert.deepEqual(Array.from(paths), ['/ask-stream', '/api/ai/stream']); handler = callback; } },
    client: { chat: { completions: { create } } }, explicitAiLanguage, guessMessageLanguage, healthSafetyPrompt, errorBody,
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
    assert.equal(options.messages[0].content, healthSafetyPrompt(null)); // no body language -> mirror the user's language
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
  assert.equal(res.body.code, 'AI_UNAVAILABLE'); assert.equal(res.body.error, 'AI_UNAVAILABLE');
  assert.equal(res.body.message, LEGACY_MESSAGES.AI_UNAVAILABLE); // legacy text for 1.0.0 (result.message || result.error)
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
test('no valid body language: no fixed-language directive, no es default, Accept-Language ignored; mirrors the user language', async () => {
  for (const req of [
    { body: { messages, stream: false }, headers: {} },
    { body: { messages, stream: false } },
    { body: { messages, stream: false, language: 'ja' }, headers: {} },
    { body: { messages, stream: false, language: 42 }, headers: {} },
    // A (possibly misleading) device locale header must not decide the language for old clients.
    { body: { messages, stream: false }, headers: { 'accept-language': 'en-US,en;q=0.9' } },
    { body: { messages, stream: false }, headers: { 'accept-language': 'de' } },
  ]) {
    const { forwarded } = await first(req);
    const sys = forwarded[0].content;
    assert.equal(forwarded[0].role, 'system');
    assert.equal(sys, healthSafetyPrompt(null));
    assert.match(sys, /same language the user's own messages are written in/);
    for (const name of ['Mexican Spanish', 'German', 'English (', 'French', 'Portuguese', 'Chinese']) assert.ok(!sys.includes(name), name);
    assert.doesNotMatch(sys, /app language is/);
    // guardrails still present
    assert.match(sys, /not a doctor/); assert.match(sys, /call 911/); assert.match(sys, /Do not diagnose/);
  }
});
test('explicit body language still forces the language, even against Accept-Language', async () => {
  const { forwarded } = await first({ body: { messages, stream: false, language: 'es-MX' }, headers: { 'accept-language': 'en' } });
  assert.equal(forwarded[0].content, healthSafetyPrompt('es'));
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
  assert.deepEqual(res.body, { ok: false, code: 'bad_request', error: 'bad_request' }); // no legacy message existed for this one
});
