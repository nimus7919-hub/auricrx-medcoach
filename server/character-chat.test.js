const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { z } = require('zod');
const { characterPrompt, appendSafety, detectUrgency, safetyText } = require('./characterPrompts');

function setup(create) {
  const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
  const start = source.indexOf("app.post('/ask',");
  const end = source.indexOf('// --- Streaming endpoint', start);
  let handler;
  vm.runInNewContext(source.slice(start, end), {
    app: { post(_path, callback) { handler = callback; } }, z,
    characterPrompt, appendCharacterSafety: appendSafety, detectCharacterUrgency: detectUrgency,
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
