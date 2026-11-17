const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeAiLanguage, languageFromAcceptLanguage, resolveAiLanguage, healthSafetyPrompt, errorBody,
} = require('./ai-language');

test('normalizeAiLanguage accepts the six app languages and regional variants only', () => {
  assert.equal(normalizeAiLanguage('en'), 'en');
  assert.equal(normalizeAiLanguage(' ES-mx '), 'es');
  assert.equal(normalizeAiLanguage('zh_Hans'), 'zh');
  assert.equal(normalizeAiLanguage('pt-BR'), 'pt');
  for (const bad of ['ja', '', null, undefined, 42, {}, '*', 'xx-es']) assert.equal(normalizeAiLanguage(bad), null);
});

test('Accept-Language honours q-values, skips unsupported tags and q=0', () => {
  assert.equal(languageFromAcceptLanguage('en-US,en;q=0.9,es;q=0.8'), 'en');
  assert.equal(languageFromAcceptLanguage('es;q=0.4, fr;q=0.9'), 'fr');
  assert.equal(languageFromAcceptLanguage('ja, de;q=0.3'), 'de');
  assert.equal(languageFromAcceptLanguage('en;q=0, es;q=0.1'), 'es');
  assert.equal(languageFromAcceptLanguage('*'), null);
  assert.equal(languageFromAcceptLanguage(undefined), null);
});

test('resolveAiLanguage: explicit values first, then Accept-Language, then es', () => {
  const req = { headers: { 'accept-language': 'fr' } };
  assert.equal(resolveAiLanguage(req, 'en'), 'en');
  assert.equal(resolveAiLanguage(req, 'ja', 'de'), 'de');
  assert.equal(resolveAiLanguage(req, undefined), 'fr');
  assert.equal(resolveAiLanguage({ headers: {} }), 'es');
  assert.equal(resolveAiLanguage({}), 'es');
  assert.equal(resolveAiLanguage(undefined), 'es');
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
  assert.equal(healthSafetyPrompt('ja'), healthSafetyPrompt('es'));
});

test('errorBody is a stable machine code with a code-valued legacy error field', () => {
  assert.deepEqual(errorBody('AI_UNAVAILABLE'), { ok: false, code: 'AI_UNAVAILABLE', error: 'AI_UNAVAILABLE' });
  assert.deepEqual(errorBody('X', { reason: 'X', fields: ['a'] }), { ok: false, code: 'X', error: 'X', reason: 'X', fields: ['a'] });
});
