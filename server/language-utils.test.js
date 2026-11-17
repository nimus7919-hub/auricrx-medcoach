/**
 * Language helpers, recipient-language push copy, verification message codes, intake/body-map locale alignment.
 * Run: node server/language-utils.test.js
 */
const assert = require('assert');
const {
  normalizeLanguage,
  languageFromAcceptHeader,
  languageFromRequest,
  normalizeIntakeLocale,
  resolveRecipientLanguage,
} = require('./language-utils');
const { notifyMessageRecipient, genericMessagePushCopy } = require('./doctor-messaging');
const { evaluateDoctorAlertsForEntry, genericPushCopy } = require('./doctor-alerts');
const { messageFields, submissionMessage, VERIFICATION_MESSAGE_CODES } = require('./doctor-verification');
const { createMemoryStore } = require('./previsit-intake-store');
const { createMockProvider } = require('./previsit-intake-lib');
const { createIntakeService } = require('./previsit-intake');
const { validateBodyPainMapPayload } = require('./previsit-intake-bodymap');

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    throw err;
  }
}

/** Tiny Firestore double: collection(name).doc(id).get()/set(); where() chain for the alert query. */
function fakeDb(data) {
  const store = JSON.parse(JSON.stringify(data));
  const doc = (col, id) => ({
    async get() {
      const d = store[col] && store[col][id];
      return { exists: d !== undefined, data: () => d, id };
    },
    async set(v) {
      store[col] = store[col] || {};
      store[col][id] = { ...(store[col][id] || {}), ...v };
    },
    collection(sub) {
      return collectionRef(`${col}/${id}/${sub}`);
    },
  });
  function collectionRef(col) {
    const filters = [];
    const ref = {
      doc: (id) => doc(col, id),
      where(f, op, v) {
        filters.push([f, v]);
        return ref;
      },
      async get() {
        const all = Object.entries(store[col] || {}).filter(([, d]) => filters.every(([f, v]) => d[f] === v));
        return { docs: all.map(([id, d]) => ({ id, data: () => d })) };
      },
    };
    return ref;
  }
  return { collection: collectionRef, _store: store };
}

(async () => {
  await test('normalizeLanguage / Accept-Language / query', () => {
    assert.strictEqual(normalizeLanguage('en-US'), 'en');
    assert.strictEqual(normalizeLanguage('es-MX'), 'es');
    assert.strictEqual(normalizeLanguage('fr'), 'es', 'unsupported -> es');
    assert.strictEqual(normalizeLanguage('*'), null);
    assert.strictEqual(normalizeLanguage(''), null);
    assert.strictEqual(normalizeLanguage(undefined), null);
    assert.strictEqual(languageFromAcceptHeader('en-GB,es;q=0.5'), 'en');
    assert.strictEqual(languageFromAcceptHeader('*'), null);
    assert.strictEqual(languageFromRequest({ query: { lang: 'en' }, headers: { 'accept-language': 'es-MX' } }), 'en');
    assert.strictEqual(languageFromRequest({ query: {}, headers: { 'accept-language': 'es-MX' } }), 'es');
    assert.strictEqual(languageFromRequest({ query: {}, headers: {} }), null);
  });

  await test('intake and body-map locale defaults agree (es) and inherit explicit locale', async () => {
    assert.strictEqual(normalizeIntakeLocale(undefined), 'es');
    assert.strictEqual(normalizeIntakeLocale('en'), 'en');
    assert.strictEqual(normalizeIntakeLocale('en-US'), 'en');
    const store = createMemoryStore();
    const service = createIntakeService({ store, provider: createMockProvider(), links: { async getActiveLink() { return { ok: true, displayName: 'D' }; } }, audit: async () => {} });
    const base = { appointmentId: 'a', appointmentStartIso: '2026-12-01T15:00:00.000Z', doctorId: 'd', consent: { acceptedAt: '2026-11-16T10:00:00.000Z' } };
    const noLocale = await service.startSession('p', base);
    assert.strictEqual(noLocale.session.locale, 'es');
    const en = await service.startSession('p', { ...base, locale: 'en' });
    assert.strictEqual(en.session.locale, 'en');
    const marker = (extra = {}) => ({
      version: 1, reportedAt: '2026-11-16T10:00:00.000Z',
      markers: [{ layer: 'skin', view: 'back', regionId: 'lower_back_left', regionLabel: 'Lower back, left side', layerLabel: 'Skin', position: { x: 0.4, y: 0.6 }, intensity: 3, feels: [], onset: null, note: null }],
      ...extra,
    });
    const mapped = await service.submitBodyPainMap('p', en.session.id, marker());
    assert.strictEqual(mapped.bodyPainMap.locale, 'en', 'body map inherits the session locale');
    assert.strictEqual(validateBodyPainMapPayload(marker()).payload.locale, 'es', 'standalone default is es, same as sessions');
  });

  await test('resolveRecipientLanguage reads the RECIPIENT, defaults to es', async () => {
    const db = fakeDb({
      doctorLanguagePrefs: { 'doc-en': { language: 'en' } },
      doctorPushTokens: { 'doc-tok': { expoPushToken: 'ExponentPushToken[x]', language: 'en' } },
      patientPushTokens: { 'pat-en': { language: 'en-US' }, 'pat-none': { expoPushToken: 'ExponentPushToken[y]' } },
    });
    assert.strictEqual(await resolveRecipientLanguage(db, 'doctor', 'doc-en'), 'en');
    assert.strictEqual(await resolveRecipientLanguage(db, 'doctor', 'doc-tok'), 'en');
    assert.strictEqual(await resolveRecipientLanguage(db, 'doctor', 'unknown'), 'es');
    assert.strictEqual(await resolveRecipientLanguage(db, 'patient', 'pat-en'), 'en');
    assert.strictEqual(await resolveRecipientLanguage(db, 'patient', 'pat-none'), 'es');
    assert.strictEqual(await resolveRecipientLanguage(null, 'patient', 'x'), 'es');
  });

  await test('message push copy follows the recipient language, not the sender language', async () => {
    const db = fakeDb({
      doctorPushTokens: { 'doc-1': { expoPushToken: 'ExponentPushToken[doc]' } },
      doctorLanguagePrefs: { 'doc-1': { language: 'en' } },
      patientPushTokens: { 'pat-1': { expoPushToken: 'ExponentPushToken[pat]', language: 'es' } },
    });
    const sent = [];
    const sendPush = async (token, copy) => { sent.push({ token, copy }); return { ok: true }; };
    // patient (writing in ES) -> doctor whose app is EN
    await notifyMessageRecipient({ toUserId: 'doc-1', role: 'doctor', language: 'es', messageId: 'm1', sendPush, db });
    // doctor (EN) -> patient whose app is ES
    await notifyMessageRecipient({ toUserId: 'pat-1', role: 'patient', language: 'en', messageId: 'm2', sendPush, db });
    assert.deepStrictEqual(sent[0].copy.body, genericMessagePushCopy('en').body);
    assert.deepStrictEqual(sent[1].copy.body, genericMessagePushCopy('es').body);
  });

  await test('doctor threshold push + in-app alert use the doctor language (patient request language ignored)', async () => {
    const entry = { type: 'blood_pressure', systolic: 170, diastolic: 95, patientId: 'pat-1' };
    const db = fakeDb({
      bitacora: {},
      doctorLinks: { l1: { id: 'l1', patientId: 'pat-1', doctorId: 'doc-1', status: 'active', consent: { bloodPressure: true } } },
      doctorProfiles: { 'doc-1': { doctorPlan: true, verificationStatus: 'verified' } },
      doctorAlertLimits: { a1: { doctorId: 'doc-1', patientId: 'pat-1', enabled: true, readingType: 'systolic', comparator: 'gt', value: 150 } },
      doctorPushTokens: { 'doc-1': { expoPushToken: 'ExponentPushToken[doc]' } },
      doctorLanguagePrefs: { 'doc-1': { language: 'en' } },
      doctorAuditLogs: {},
      doctorInAppAlerts: {},
    });
    // bitacora/{patientId}/entries/{entryId}
    db._store['bitacora/pat-1/entries'] = { e1: entry };
    const sent = [];
    const result = await evaluateDoctorAlertsForEntry({ patientId: 'pat-1', entryId: 'e1', language: 'es', db, sendPush: async (t, c) => { sent.push(c); return { ok: true }; } });
    assert.strictEqual(result.ok, true, JSON.stringify(result));
    assert.strictEqual(result.pushed, 1);
    assert.strictEqual(sent[0].body, genericPushCopy('en').body);
    const inApp = Object.values(db._store.doctorInAppAlerts)[0];
    assert.ok(/^Reading 170 above the limit of 150/.test(inApp.message), inApp.message);
  });

  await test('verification status is sent as a code; admin free text goes to the reviewer note', () => {
    const q = submissionMessage({ outcome: 'lookup_unavailable' }, { status: 'x' });
    assert.strictEqual(q.code, 'queued_registry_unavailable');
    assert.strictEqual(submissionMessage({ outcome: 'ok' }, { status: 'pending' }).code, 'queued_manual_review');
    assert.deepStrictEqual(messageFields('approved', ''), { verificationMessageCode: 'approved', verificationReviewerNote: null });
    assert.deepStrictEqual(messageFields('rejected', ' bad scan '), { verificationMessageCode: 'rejected', verificationReviewerNote: 'bad scan' });
    for (const c of ['queued_registry_unavailable', 'queued_manual_review', 'expired', 'approved', 'rejected', 'suspended', 'revoked']) {
      assert.ok(VERIFICATION_MESSAGE_CODES.includes(c), c);
    }
  });

  console.log('language-utils tests passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
