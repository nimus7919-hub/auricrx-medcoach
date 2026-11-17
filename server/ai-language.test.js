const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeAiLanguage, explicitAiLanguage, guessMessageLanguage, healthSafetyPrompt, errorBody, LEGACY_MESSAGES,
} = require('./ai-language');

test('normalizeAiLanguage accepts the six app languages and regional variants only', () => {
  assert.equal(normalizeAiLanguage('en'), 'en');
  assert.equal(normalizeAiLanguage(' ES-mx '), 'es');
  assert.equal(normalizeAiLanguage('zh_Hans'), 'zh');
  assert.equal(normalizeAiLanguage('pt-BR'), 'pt');
  for (const bad of ['ja', '', null, undefined, 42, {}, '*', 'xx-es']) assert.equal(normalizeAiLanguage(bad), null);
});

test('explicitAiLanguage: first supported candidate, never a default', () => {
  assert.equal(explicitAiLanguage('en', 'es'), 'en');
  assert.equal(explicitAiLanguage('ja', 'es-MX'), 'es');
  assert.equal(explicitAiLanguage(undefined, 'de'), 'de');
  assert.equal(explicitAiLanguage(), null);
  assert.equal(explicitAiLanguage('ja', '', null, 7), null);
});

test('guessMessageLanguage keeps the old /ask heuristic', () => {
  assert.equal(guessMessageLanguage('Hola, tengo una pregunta'), 'es');
  assert.equal(guessMessageLanguage('Tengo dolor de cabeza'), 'es');
  assert.equal(guessMessageLanguage('Puedo tomar medicamento con comida?'), 'es');
  assert.equal(guessMessageLanguage('Can I take ibuprofen with food?'), 'en');
  assert.equal(guessMessageLanguage('Ich habe Kopfschmerzen'), 'en');
  assert.equal(guessMessageLanguage(undefined), 'en');
});
test('every localized safety prompt keeps the compliance guardrails and a localized medicine reminder', () => {
  const names = { en: 'English', es: 'Mexican Spanish', de: 'German', fr: 'French', pt: 'Portuguese', zh: 'Simplified Chinese' };
  for (const lang of ['en', 'es', 'de', 'fr', 'pt', 'zh']) {
    const p = healthSafetyPrompt(lang);
    assert.match(p, /not a doctor/, lang);
    assert.match(p, /Do not diagnose/, lang);
    assert.match(p, /licensed/, lang);
    assert.match(p, /911/, lang);
    assert.ok(p.includes(`Write your entire answer in ${names[lang]}`), lang);
    assert.match(p, new RegExp(`reminder in ${names[lang]}[^.]*doctor or pharmacist`), lang);
    assert.match(p, /JSON/, lang);
  }
  // No / unsupported language: mirror the user's language, never a fixed one.
  for (const none of [undefined, null, 'ja', '']) {
    const p = healthSafetyPrompt(none);
    assert.match(p, /same language the user's own messages are written in/);
    assert.match(p, /not a doctor/); assert.match(p, /911/); assert.match(p, /doctor or pharmacist/);
    assert.doesNotMatch(p, /app language is/);
  }
});

test('errorBody: code + code-valued error; deprecated legacy message only for codes old clients had text for', () => {
  assert.deepEqual(errorBody('bad_request'), { ok: false, code: 'bad_request', error: 'bad_request' });
  assert.deepEqual(errorBody('AI_UNAVAILABLE'), { ok: false, code: 'AI_UNAVAILABLE', error: 'AI_UNAVAILABLE', message: LEGACY_MESSAGES.AI_UNAVAILABLE });
  assert.deepEqual(errorBody('X', { reason: 'X', fields: ['a'] }), { ok: false, code: 'X', error: 'X', reason: 'X', fields: ['a'] });
  assert.equal(errorBody('UPGRADE_REQUIRED', { plan: 'free' }).message, 'This feature requires an active subscription.');
  for (const code of Object.keys(LEGACY_MESSAGES)) assert.equal(errorBody(code).error, code); // `error` is never prose
});
