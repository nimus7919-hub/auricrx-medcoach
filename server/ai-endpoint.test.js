const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Exercise the registered production handler without starting other backend services.
function setup(create) {
  const source = fs.readFileSync(require('node:path').join(__dirname, 'index.js'), 'utf8');
  const start = source.indexOf("app.post(['/ask-stream', '/api/ai/stream']");
  const end = source.indexOf('// --- Medication Data Collection Endpoints ---', start);
  let handler;
  vm.runInNewContext(source.slice(start, end), {
    app: { post(paths, callback) { assert.deepEqual(Array.from(paths), ['/ask-stream', '/api/ai/stream']); handler = callback; } },
    client: { chat: { completions: { create } } },
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
    assert.equal(options.messages[0].content, 'Hello');
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
  assert.equal(res.statusCode, 502); assert.equal(res.body.error, 'AI request failed');
});
