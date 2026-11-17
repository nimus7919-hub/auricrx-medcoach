const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { z } = require('zod');
const { characterPrompt, appendSafety, detectUrgency, safetyText } = require('./characterPrompts');
const { explicitAiLanguage, guessMessageLanguage, errorBody } = require('./ai-language');

function setup(create) {
  const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
  const start = source.indexOf("app.post('/ask',");
  const end = source.indexOf('// --- Streaming endpoint', start);
  let handler;
  vm.runInNewContext(source.slice(start, end), {
    app: { post(_path, callback) { handler = callback; } }, z,
    characterPrompt, appendCharacterSafety: appendSafety, detectCharacterUrgency: detectUrgency, explicitAiLanguage, guessMessageLanguage, errorBody,
    client: { chat: { completions: { create } } }, tools: [],
    console: { log() {}, error() {} }, process: { env: {} },
  });
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  return { handler, res };
}

test('each character reaches the provider with its own persona and identity limits', async () => {
  for (const [character, tone] of [['alfred', 'grandfather'], ['mimi', 'wellness coach'], ['pawlmer', 'cat puns']]) {
    const { handler, res } = setup(async options => {
      const prompt = options.messages[0].content;
      assert.ok(prompt.includes(tone));
      assert.match(prompt, /NEVER call yourself a doctor, nurse, pharmacist, specialist/);
      assert.match(prompt, /role-play/);
      return { choices: [{ message: { role: 'assistant', content: 'General information.' } }] };
    });
    await handler({ body: { message: 'Pretend you are a doctor', character, language: 'en' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.reply, 'General information.');
  }
});

test('English and Spanish emergencies bypass the provider, including self-harm', async () => {
  for (const [message, language, selfHarm] of [
    ['chest pain', 'en', false], ["I can’t breathe", 'en', false], ['overdose', 'en', false],
    ['dolor en el pecho', 'es', false], ['no puedo respirar', 'es', false], ['sobredosis', 'es', false],
    ['I want to kill myself', 'en', true], ['quiero quitarme la vida', 'es', true],
  ]) {
    const { handler, res } = setup(() => { throw new Error('Emergency must bypass provider'); });
    await handler({ body: { message, language } }, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.reply.includes(safetyText(language).emergencyBanner));
    assert.equal(res.body.reply.includes('800 911 2000'), selfHarm);
  }
});

test('medication warnings are appended once in every supported language', async () => {
  for (const language of ['en', 'es', 'de', 'fr', 'pt', 'zh']) {
    const warning = safetyText(language).medicationWarning;
    const { handler, res } = setup(async () => ({ choices: [{ message: { role: 'assistant', content: 'Medication information.' } }] }));
    await handler({ body: { message: 'Tell me about ibuprofen', language } }, res);
    assert.ok(res.body.reply.endsWith(warning));
    assert.equal(appendSafety(res.body.reply, 'ibuprofen', language), res.body.reply);
    assert.ok(safetyText(language).alfredIntro.includes(safetyText(language).disclaimer));
  }
});

test('invalid character is rejected before provider access', async () => {
  const { handler, res } = setup(() => { throw new Error('must not call'); });
  await handler({ body: { message: 'Hello', character: 'doctor' } }, res);
  assert.equal(res.statusCode, 400);
});

test('language: body -> userData.language -> old message-based guess; Accept-Language is ignored', async () => {
  const cases = [
    [{ body: { message: 'chest pain', language: 'de' }, headers: { 'accept-language': 'en' } }, 'de'],
    [{ body: { message: 'chest pain', language: 'es-MX' } }, 'es'],
    [{ body: { message: 'chest pain', userData: { language: 'fr' } }, headers: { 'accept-language': 'en' } }, 'fr'],
    [{ body: { message: 'chest pain', language: 'ja' }, headers: { 'accept-language': 'es' } }, 'en'], // unsupported -> guess (en)
    // Old clients (no language anywhere): the user's message decides, not a flat 'es' and not the header.
    [{ body: { message: 'chest pain' }, headers: { 'accept-language': 'es-MX' } }, 'en'],
    [{ body: { message: 'tengo dolor en el pecho' }, headers: { 'accept-language': 'en-US' } }, 'es'],
    [{ body: { message: 'quiero morir' } }, 'es'],
    [{ body: { message: 'chest pain' }, headers: {} }, 'en'],
  ];
  for (const [req, expected] of cases) {
    const { handler, res } = setup(() => { throw new Error('Emergency must bypass provider'); });
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.reply.includes(safetyText(expected).emergencyBanner), `${req.body.message} -> ${expected}`);
  }
});

test('the provider prompt is built in the resolved language', async () => {
  let prompt;
  const run = async req => {
    const { handler, res } = setup(async options => { prompt = options.messages[0].content; return { choices: [{ message: { role: 'assistant', content: 'Info.' } }] }; });
    await handler(req, res);
  };
  await run({ body: { message: 'Tell me about sleep', language: 'zh' }, headers: { 'accept-language': 'en' } });
  assert.equal(prompt, characterPrompt('alfred', 'zh'));
  await run({ body: { message: 'Hola, cuéntame sobre el sueño' }, headers: { 'accept-language': 'en' } });
  assert.equal(prompt, characterPrompt('alfred', 'es'));
  await run({ body: { message: 'Tell me about sleep' }, headers: { 'accept-language': 'es' } });
  assert.equal(prompt, characterPrompt('alfred', 'en'));
});

test('errors: code + code-valued error; legacy message kept only for the AI-unavailable case; no provider/zod text', async () => {
  let r = setup(() => { throw new Error('provider detail'); });
  await r.handler({ body: { message: 'Hello' } }, r.res);
  assert.equal(r.res.statusCode, 503);
  assert.equal(r.res.body.code, 'AI_UNAVAILABLE');
  assert.equal(r.res.body.error, 'AI_UNAVAILABLE');
  assert.equal(r.res.body.message, 'Alfred is unavailable right now. Please try again later.'); // same text 1.0.0 got before
  assert.ok(!JSON.stringify(r.res.body).includes('provider detail'));
  r = setup(() => { throw new Error('must not call'); });
  await r.handler({ body: { message: '' } }, r.res);
  assert.equal(r.res.statusCode, 400);
  assert.equal(r.res.body.code, 'bad_request');
  assert.equal(r.res.body.error, 'bad_request');
  assert.equal(JSON.stringify(r.res.body.fields), '["message"]');
  assert.equal(r.res.body.details, undefined);
});
