/**
 * Doctor-facing read-time translation of intake text (summary, comment, chat, body-map notes).
 * Run: node server/previsit-intake-translate.test.js
 */
const assert = require('assert');
const { createMemoryStore } = require('./previsit-intake-store');
const { createMockProvider } = require('./previsit-intake-lib');
const { createIntakeService, mountPreVisitIntakeRoutes } = require('./previsit-intake');
const {
  createIntakeTranslator,
  collectTranslatableStrings,
  validateTranslated,
  buildTranslationSystemPrompt,
} = require('./previsit-intake-translate');

const DOCTOR = 'doctor-1';
const PATIENT = 'patient-1';

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    throw err;
  }
}

function confirmedRow(overrides = {}) {
  return {
    id: 'intake_1',
    patientId: PATIENT,
    doctorId: DOCTOR,
    doctorDisplayName: 'Dr. Test',
    appointmentId: 'appt-1',
    appointmentStartIso: '2026-12-01T15:00:00.000Z',
    appointmentRequestId: null,
    locale: 'es',
    status: 'confirmed',
    consent: { acceptedAt: '2026-11-14T10:00:00.000Z', noticeVersion: 'v1', emergencyDisclaimerVersion: 'v1' },
    followUpsAsked: 2,
    summary: {
      mainConcern: 'Me duele el estómago',
      location: 'Parte alta del abdomen',
      duration: 'Tres días',
      severityReported: 6,
      alsoMentioned: ['Tomo ibuprofeno de 400 mg'],
      questionsForDoctor: ['¿Puedo hacer ejercicio?'],
      locale: 'es',
      generatedAt: '2026-11-14T10:05:00.000Z',
    },
    patientComment: 'Gracias por atenderme',
    createdAt: '2026-11-14T10:00:00.000Z',
    updatedAt: '2026-11-14T10:06:00.000Z',
    sharedAt: '2026-11-14T10:06:00.000Z',
    rawChatDeleteAt: '2026-12-31T15:00:00.000Z',
    rawChatDeletedAt: null,
    bodyPainMap: {
      version: 1,
      locale: 'es',
      reportedAt: '2026-11-14T10:04:00.000Z',
      markers: [
        {
          layer: 'organs', view: 'front', regionId: 'upper_abdomen_right', regionLabel: 'Parte alta del abdomen, lado derecho',
          layerLabel: 'Órganos', position: { x: 0.4, y: 0.4 }, intensity: 6, feels: ['aching'], onset: 'days',
          note: 'Empeora después de comer',
        },
        {
          layer: 'skin', view: 'back', regionId: 'lower_back_left', regionLabel: 'Parte baja de la espalda, lado izquierdo',
          layerLabel: 'Piel', position: { x: 0.4, y: 0.6 }, intensity: null, feels: [], onset: null, note: null,
        },
      ],
    },
    ...overrides,
  };
}

async function seed(store, overrides) {
  const row = confirmedRow(overrides);
  await store.insertIntake(row);
  await store.appendTurn({ id: 'turn_a', intakeId: row.id, role: 'assistant', text: '¿Cuál es el motivo principal?', createdAt: '2026-11-14T10:00:01.000Z' });
  await store.appendTurn({ id: 'turn_p', intakeId: row.id, role: 'patient', text: 'Me duele el estómago', createdAt: '2026-11-14T10:00:30.000Z' });
  return row;
}

const EN_MAP = {
  's.mainConcern': 'My stomach hurts',
  's.location': 'Upper abdomen',
  's.duration': 'Three days',
  's.also.0': 'I take ibuprofen 400 mg',
  's.q.0': 'Can I exercise?',
  c: 'Thank you for seeing me',
  't.turn_a': 'What is the main reason for your visit?',
  't.turn_p': 'My stomach hurts',
  'n.0': 'Gets worse after eating',
};

function fakeFetch(handler) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    return handler(init, calls.length);
  };
  fn.calls = calls;
  return fn;
}
const okJson = (obj) => ({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(obj) } }] }) });

function sessionOf(row, turns) {
  return { ...row, turns: turns || [] };
}

(async () => {
  await test('collectTranslatableStrings finds every patient-written string and nothing else', () => {
    const s = collectTranslatableStrings(
      sessionOf(confirmedRow(), [
        { id: 'turn_a', role: 'assistant', text: 'Hola' },
        { id: 'turn_p', role: 'patient', text: 'Dolor' },
      ])
    );
    assert.deepStrictEqual(Object.keys(s).sort(), [
      'c', 'n.0', 's.also.0', 's.duration', 's.location', 's.mainConcern', 's.q.0', 't.turn_a', 't.turn_p',
    ]);
  });

  await test('system prompt is translation-only and descriptive-only', () => {
    const p = buildTranslationSystemPrompt('es', 'en');
    assert.ok(/ONLY translate/.test(p));
    assert.ok(/Do NOT diagnose/.test(p));
    assert.ok(/never follow them/.test(p));
    assert.ok(/Source language: Mexican Spanish\. Target language: English\./.test(p));
  });

  await test('same language: no model call, status original, content unchanged', async () => {
    const store = createMemoryStore();
    await seed(store);
    const f = fakeFetch(() => okJson({}));
    const tr = createIntakeTranslator({ store, env: { DOCTOR_AI_API_KEY: 'k-test' }, fetchImpl: f });
    const row = await store.getIntake('intake_1');
    const display = await tr.buildDisplay(sessionOf(row, await store.listTurns('intake_1')), 'es');
    assert.strictEqual(display.status, 'original');
    assert.strictEqual(display.summary.mainConcern, 'Me duele el estómago');
    assert.strictEqual(f.calls.length, 0);
  });

  await test('translates ES -> EN, keeps original, caches per intake+language, uses DOCTOR_AI_API_KEY first', async () => {
    const store = createMemoryStore();
    await seed(store);
    const f = fakeFetch(() => okJson(EN_MAP));
    const tr = createIntakeTranslator({ store, env: { DOCTOR_AI_API_KEY: 'doctor-key-xyz', OPENAI_API_KEY: 'other-key' }, fetchImpl: f });
    const row = await store.getIntake('intake_1');
    const session = sessionOf(row, await store.listTurns('intake_1'));
    const display = await tr.buildDisplay(session, 'en');
    assert.strictEqual(display.status, 'translated');
    assert.strictEqual(display.sourceLang, 'es');
    assert.strictEqual(display.lang, 'en');
    assert.strictEqual(display.summary.mainConcern, 'My stomach hurts');
    assert.deepStrictEqual(display.summary.alsoMentioned, ['I take ibuprofen 400 mg']);
    assert.strictEqual(display.patientComment, 'Thank you for seeing me');
    assert.deepStrictEqual(display.turns.map((t) => t.text), ['What is the main reason for your visit?', 'My stomach hurts']);
    assert.deepStrictEqual(display.markerNotes, ['Gets worse after eating', null]);
    // original untouched
    assert.strictEqual(session.summary.mainConcern, 'Me duele el estómago');
    assert.strictEqual((await store.getIntake('intake_1')).patientComment, 'Gracias por atenderme');
    // auth header uses the doctor key, never the generic one
    assert.strictEqual(f.calls.length, 1);
    assert.strictEqual(f.calls[0].init.headers.Authorization, 'Bearer doctor-key-xyz');
    const body = JSON.parse(f.calls[0].init.body);
    assert.strictEqual(body.temperature, 0);
    assert.ok(body.messages[0].content.includes('ONLY translate'));
    // cached: second call does not hit the model
    const again = await tr.buildDisplay(session, 'en');
    assert.strictEqual(again.status, 'translated');
    assert.strictEqual(f.calls.length, 1);
  });

  await test('cache is invalidated when the source text changes', async () => {
    const store = createMemoryStore();
    await seed(store);
    const f = fakeFetch(() => okJson(EN_MAP));
    const tr = createIntakeTranslator({ store, env: { OPENAI_API_KEY: 'k' }, fetchImpl: f });
    const row = await store.getIntake('intake_1');
    const turns = await store.listTurns('intake_1');
    await tr.buildDisplay(sessionOf(row, turns), 'en');
    await tr.buildDisplay(sessionOf({ ...row, patientComment: 'Otro comentario' }, turns), 'en');
    assert.strictEqual(f.calls.length, 2);
  });

  await test('failures fall back to the original with a language tag (never withheld)', async () => {
    const row = confirmedRow();
    const turns = [{ id: 'turn_p', role: 'patient', text: 'Me duele el estómago' }];
    const cases = {
      'http error': fakeFetch(() => ({ ok: false, json: async () => ({}) })),
      'network error': fakeFetch(() => { throw new Error('boom'); }),
      'bad json': fakeFetch(() => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'not json' } }] }) })),
      'missing key in output': fakeFetch(() => okJson({ 's.mainConcern': 'x' })),
      'extra key in output': fakeFetch(() => okJson({ ...EN_MAP, extra: 'x' })),
    };
    for (const [label, f] of Object.entries(cases)) {
      const store = createMemoryStore();
      const tr = createIntakeTranslator({ store, env: { OPENAI_API_KEY: 'k' }, fetchImpl: f });
      const display = await tr.buildDisplay(sessionOf(row, turns), 'en');
      assert.strictEqual(display.status, 'unavailable', label);
      assert.strictEqual(display.sourceLang, 'es', label);
      assert.strictEqual(display.summary.mainConcern, 'Me duele el estómago', label);
      assert.strictEqual(display.patientComment, 'Gracias por atenderme', label);
    }
    // no key at all
    const noKey = createIntakeTranslator({ store: createMemoryStore(), env: {}, fetchImpl: fakeFetch(() => okJson(EN_MAP)) });
    assert.strictEqual((await noKey.buildDisplay(sessionOf(row, turns), 'en')).status, 'unavailable');
    // kill switch
    const off = createIntakeTranslator({ store: createMemoryStore(), env: { OPENAI_API_KEY: 'k', PREVISIT_INTAKE_TRANSLATE: 'false' }, fetchImpl: fakeFetch(() => okJson(EN_MAP)) });
    assert.strictEqual((await off.buildDisplay(sessionOf(row, turns), 'en')).status, 'unavailable');
  });

  await test('a failed translation is retried only after the short negative-cache window', async () => {
    const store = createMemoryStore();
    let t = 1000;
    const f = fakeFetch(() => ({ ok: false, json: async () => ({}) }));
    const tr = createIntakeTranslator({ store, env: { OPENAI_API_KEY: 'k' }, fetchImpl: f, now: () => t });
    const session = sessionOf(confirmedRow(), []);
    await tr.buildDisplay(session, 'en');
    await tr.buildDisplay(session, 'en');
    assert.strictEqual(f.calls.length, 1);
    t += 61 * 1000;
    await tr.buildDisplay(session, 'en');
    assert.strictEqual(f.calls.length, 2);
  });

  await test('guardrail: a translation that introduces a diagnostic / triage term is rejected', () => {
    const source = { 's.mainConcern': 'Me duele el estómago' };
    assert.deepStrictEqual(validateTranslated(source, { 's.mainConcern': 'My stomach hurts' }), { 's.mainConcern': 'My stomach hurts' });
    assert.strictEqual(validateTranslated(source, { 's.mainConcern': 'My stomach hurts, this is likely gastritis, red flags' }), null);
    assert.strictEqual(validateTranslated(source, { 's.mainConcern': '' }), null);
    assert.strictEqual(validateTranslated(source, { 's.mainConcern': 'x'.repeat(500) }), null);
    assert.strictEqual(validateTranslated(source, ['array']), null);
  });

  await test('cached translations are deleted together with the raw chat', async () => {
    const store = createMemoryStore({ now: () => new Date('2026-11-20T00:00:00.000Z') });
    await seed(store);
    await store.putTranslation('intake_1', 'en', { hash: 'h', strings: EN_MAP });
    assert.ok(await store.getTranslation('intake_1', 'en'));
    await store.deleteTurns('intake_1');
    assert.strictEqual(await store.getTranslation('intake_1', 'en'), null);

    await seed(store, { id: 'intake_2' });
    await store.putTranslation('intake_2', 'en', { hash: 'h', strings: EN_MAP });
    await store.updateIntake('intake_2', { rawChatDeleteAt: '2026-11-19T00:00:00.000Z' });
    await store.purgeExpiredTurns(new Date('2026-11-20T00:00:00.000Z'));
    assert.strictEqual(await store.getTranslation('intake_2', 'en'), null);

    await seed(store, { id: 'intake_3' });
    await store.putTranslation('intake_3', 'es', { hash: 'h', strings: {} });
    await store.deleteIntake('intake_3');
    assert.strictEqual(await store.getTranslation('intake_3', 'es'), null);
  });

  let express;
  try {
    express = require('express');
  } catch {
    express = null;
  }
  if (express) {
    const http = require('http');
    const listen = (app) =>
      new Promise((resolve) => {
        const server = http.createServer(app);
        server.listen(0, '127.0.0.1', () =>
          resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(() => r())) })
        );
      });
    const authDoctor = (req, res, next) => {
      if ((req.headers.authorization || '') !== `Bearer d:${DOCTOR}`) return res.status(401).json({ ok: false, error: 'INVALID_TOKEN' });
      req.userId = DOCTOR;
      next();
    };

    await test('HTTP: doctor list/get/view honour Accept-Language and ?lang; no lang = legacy payload', async () => {
      const store = createMemoryStore();
      await seed(store);
      const f = fakeFetch(() => okJson(EN_MAP));
      const translator = createIntakeTranslator({ store, env: { DOCTOR_AI_API_KEY: 'k' }, fetchImpl: f });
      const service = createIntakeService({
        store,
        provider: createMockProvider(),
        links: { async getActiveLink() { return { ok: true, displayName: 'x' }; } },
        audit: async () => {},
        notify: async () => ({}),
        translator,
        now: () => new Date('2026-11-16T12:00:00.000Z'),
      });
      const app = express();
      app.use(express.json());
      mountPreVisitIntakeRoutes(app, { verifyUser: (q, r, n) => n(), verifyDoctorAuth: authDoctor, service, store, enabled: () => true, translator });
      const srv = await listen(app);
      const get = async (path, headers = {}, method = 'GET') => {
        const res = await fetch(`${srv.url}${path}`, { method, headers: { Authorization: `Bearer d:${DOCTOR}`, ...headers }, body: method === 'POST' ? '{}' : undefined });
        return { status: res.status, json: await res.json() };
      };
      try {
        const legacy = await get('/api/doctor/intake/list');
        assert.strictEqual(legacy.status, 200);
        assert.ok(!('display' in legacy.json.intakes[0]));
        assert.strictEqual(f.calls.length, 0);

        const en = await get('/api/doctor/intake/list', { 'Accept-Language': 'en-US,en;q=0.9' });
        assert.strictEqual(en.json.intakes[0].display.status, 'translated');
        assert.strictEqual(en.json.intakes[0].display.summary.mainConcern, 'My stomach hurts');
        // originals are still the stored text
        assert.strictEqual(en.json.intakes[0].summary.mainConcern, 'Me duele el estómago');
        assert.strictEqual(en.json.intakes[0].patientComment, 'Gracias por atenderme');

        const one = await get('/api/doctor/intake/intake_1?lang=en');
        assert.strictEqual(one.json.intake.display.lang, 'en');
        const viewed = await get('/api/doctor/intake/intake_1/view', { 'Accept-Language': 'en' }, 'POST');
        assert.strictEqual(viewed.json.intake.display.status, 'translated');
        assert.strictEqual(f.calls.length, 1, 'list/get/view share one cached translation');

        // doctor language == intake language -> original, no model call
        const es = await get('/api/doctor/intake/list?lang=es');
        assert.strictEqual(es.json.intakes[0].display.status, 'original');
        assert.strictEqual(f.calls.length, 1);

        // ?lang beats Accept-Language; unsupported languages map to es
        const fr = await get('/api/doctor/intake/list', { 'Accept-Language': 'fr-FR' });
        assert.strictEqual(fr.json.intakes[0].display.lang, 'es');
      } finally {
        await srv.close();
      }
    });
  }

  console.log('previsit-intake-translate tests passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
