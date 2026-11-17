const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { resolveSuccessLanguage, successText, renderSuccessPage } = require('./success-page');
const source = fs.readFileSync(require.resolve('./index'), 'utf8');

test('lang query: en/es (any case/region) else English default', () => {
  assert.equal(resolveSuccessLanguage({ lang: 'es' }), 'es');
  assert.equal(resolveSuccessLanguage({ lang: 'ES-mx' }), 'es');
  assert.equal(resolveSuccessLanguage({ lang: 'en' }), 'en');
  assert.equal(resolveSuccessLanguage({ lang: ['es', 'en'] }), 'es');
  for (const q of [{}, undefined, { lang: 'fr' }, { lang: '' }, { lang: 42 }, { lang: '<script>' }]) {
    assert.equal(resolveSuccessLanguage(q), 'en');
  }
});

test('page renders fully in one language, English identical to the previous copy', () => {
  const en = renderSuccessPage('en');
  assert.match(en, /<html lang="en">/);
  assert.match(en, /<title>Payment Successful<\/title>/);
  assert.match(en, /Payment Successful!/);
  assert.match(en, /Your subscription has been activated\./);
  assert.match(en, /You can now close this window and return to the app\./);
  assert.doesNotMatch(en, /Pago|suscripción/);
  const es = renderSuccessPage('es');
  assert.match(es, /<html lang="es">/);
  assert.match(es, /¡Pago exitoso!/);
  assert.match(es, /Tu suscripción fue activada\./);
  assert.doesNotMatch(es, /Payment|subscription has been/);
  assert.equal(renderSuccessPage('zz'), en);
});

function loadHandler(session, extra = {}) {
  const start = source.indexOf("app.get('/success'");
  const registration = source.slice(start, source.indexOf('\n});', start) + 4);
  let handler;
  vm.runInNewContext(registration, {
    app: { get(path, cb) { handler = cb; } },
    resolveSuccessLanguage, successText, renderSuccessPage,
    stripe: { checkout: { sessions: { retrieve: async () => { if (session instanceof Error) throw session; return session; } } } },
    neonClient: async () => [],
    console: { log() {}, warn() {}, error() {} }, Date, Math, ...extra,
  });
  return handler;
}
function res() {
  return { code: 200, headers: {}, set(k, v) { this.headers[k] = v; return this; }, status(n) { this.code = n; return this; }, send(b) { this.body = b; return this; } };
}

test('/success follows ?lang= for the page and for plain-text errors; never leaks internals', async () => {
  const paid = { id: 's', payment_status: 'paid', metadata: { firebase_uid: 'u' } };
  let r = res(); await loadHandler(paid)({ query: { session_id: 's', lang: 'es' } }, r);
  assert.equal(r.code, 200); assert.match(r.body, /¡Pago exitoso!/); assert.equal(r.headers['Content-Language'], 'es');
  r = res(); await loadHandler(paid)({ query: { session_id: 's' } }, r);
  assert.match(r.body, /Payment Successful!/); assert.equal(r.headers['Content-Language'], 'en');

  r = res(); await loadHandler(paid)({ query: { lang: 'es' } }, r);
  assert.equal(r.code, 400); assert.equal(r.body, 'Falta el parámetro session_id');
  r = res(); await loadHandler(paid)({ query: {} }, r);
  assert.equal(r.body, 'Missing session_id parameter');

  r = res(); await loadHandler({ id: 's', payment_status: 'unpaid', metadata: {} })({ query: { session_id: 's', lang: 'es' } }, r);
  assert.equal(r.code, 400); assert.equal(r.body, 'Tu pago aún no se ha completado.');
  r = res(); await loadHandler({ id: 's', payment_status: 'paid', metadata: {} })({ query: { session_id: 's' } }, r);
  assert.equal(r.code, 400); assert.equal(r.body, 'Session missing required metadata');

  r = res(); await loadHandler(new Error('stripe internal detail'))({ query: { session_id: 's', lang: 'es' } }, r);
  assert.equal(r.code, 500); assert.ok(!r.body.includes('stripe internal detail')); assert.match(r.body, /Algo salió mal/);
});

test('checkout success_url lang goes through normalizeAiLanguage (es-MX -> es), only en|es are carried', () => {
  const { normalizeAiLanguage } = require('./ai-language');
  const start = source.indexOf('const checkoutLanguage = ');
  const end = source.indexOf('\n', source.indexOf('const checkoutLang = ', start));
  const snippet = source.slice(start, end);
  const langParam = body => vm.runInNewContext(`${snippet}; checkoutLang`, { normalizeAiLanguage, req: { body } });
  assert.equal(langParam({ language: 'es-MX' }), '&lang=es');
  assert.equal(langParam({ language: 'ES' }), '&lang=es');
  assert.equal(langParam({ language: 'en-US' }), '&lang=en');
  assert.equal(langParam({ language: 'es' }), '&lang=es');
  for (const language of ['de', 'fr-CA', 'pt-BR', 'zh-Hans', 'ja', '', undefined, null, 5, '&lang=es']) assert.equal(langParam({ language }), '', String(language));
  assert.equal(langParam({}), '');
  assert.equal((source.match(/\$\{checkoutLang\}`/g) || []).length, 2); // both success_url sites use it
  assert.ok(!source.includes("includes(req.body.language)"));
});
