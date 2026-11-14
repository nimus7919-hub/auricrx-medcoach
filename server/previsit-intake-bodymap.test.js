const assert = require('assert');
const {
  ALL_REGION_IDS,
  MAX_BODY_MARKERS,
  validateBodyPainMapPayload,
  sideFromRegionId,
} = require('./previsit-intake-bodymap');
const { getOpenAiKey, hasOpenAiKey, createOpenAiProvider, createProvider } = require('./previsit-intake-lib');
const { createMemoryStore } = require('./previsit-intake-store');
const { createMockProvider } = require('./previsit-intake-lib');
const { createIntakeService, IntakeError, mountPreVisitIntakeRoutes } = require('./previsit-intake');

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => console.log(`✓ ${name}`))
    .catch((err) => {
      console.error(`✗ ${name}`);
      throw err;
    });
}

function validMarker(overrides = {}) {
  return {
    layer: 'muscles',
    view: 'back',
    regionId: 'lower_back_left',
    regionLabel: 'Lower back, left side',
    layerLabel: 'Muscles',
    position: { x: 0.4, y: 0.42 },
    intensity: 6,
    feels: ['aching'],
    onset: 'days',
    note: 'Started after I lifted a box',
    ...overrides,
  };
}

function validMap(overrides = {}) {
  return {
    version: 1,
    locale: 'en',
    reportedAt: '2026-11-14T16:00:00.000Z',
    markers: [validMarker()],
    ...overrides,
  };
}

const PATIENT = 'patient-1';
const DOCTOR = 'doctor-1';
const APPT = 'appt-local-1';
const APPT_START = '2026-12-01T15:00:00.000Z';

function makeService() {
  const now = () => new Date('2026-11-14T10:00:00.000Z');
  const store = createMemoryStore({ now });
  const service = createIntakeService({
    store,
    provider: createMockProvider(),
    links: {
      async getActiveLink(patientId, doctorId) {
        return patientId === PATIENT && doctorId === DOCTOR
          ? { ok: true, displayName: 'Dra. Ana Torres', linkId: 'link-1' }
          : { ok: false };
      },
    },
    audit: async () => {},
    notify: async () => ({ skipped: true }),
    now,
  });
  return { service, store };
}

async function started(service) {
  return service.startSession(PATIENT, {
    appointmentId: APPT,
    appointmentStartIso: APPT_START,
    doctorId: DOCTOR,
    locale: 'en',
    consent: {
      acceptedAt: '2026-11-14T10:00:00.000Z',
      noticeVersion: '2026-11-14',
      emergencyDisclaimerVersion: '2026-11-14',
    },
  });
}

(async () => {
  await test('catalog has Nova\'s 67 region ids', () => {
    assert.strictEqual(ALL_REGION_IDS.size, 67);
    assert.ok(ALL_REGION_IDS.has('lower_back_left'));
    assert.ok(ALL_REGION_IDS.has('heel_left'));
    assert.ok(ALL_REGION_IDS.has('navel'));
  });

  await test('accepts a valid version-1 payload and derives side from region id', () => {
    const result = validateBodyPainMapPayload(validMap());
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.payload.markers.length, 1);
    assert.strictEqual(result.payload.markers[0].intensity, 6);
    assert.strictEqual(sideFromRegionId('lower_back_left'), 'left');
    assert.strictEqual(sideFromRegionId('head'), null);
  });

  await test('null or empty markers clear the map', () => {
    assert.strictEqual(validateBodyPainMapPayload(null).payload, null);
    assert.strictEqual(validateBodyPainMapPayload({ version: 1, locale: 'en', markers: [] }).payload, null);
  });

  await test('rejects more than 10 markers, bad version, layer, view, position, intensity, feels, onset, note length, region', () => {
    const tooMany = validMap({ markers: Array.from({ length: MAX_BODY_MARKERS + 1 }, () => validMarker()) });
    assert.strictEqual(validateBodyPainMapPayload(tooMany).error, 'too_many_body_markers');
    assert.strictEqual(validateBodyPainMapPayload(validMap({ version: 2 })).error, 'invalid_body_pain_map_version');
    assert.strictEqual(validateBodyPainMapPayload(validMap({ markers: [validMarker({ layer: 'tissue' })] })).error, 'invalid_body_layer');
    assert.strictEqual(validateBodyPainMapPayload(validMap({ markers: [validMarker({ view: 'side' })] })).error, 'invalid_body_view');
    assert.strictEqual(validateBodyPainMapPayload(validMap({ markers: [validMarker({ position: { x: 1.2, y: 0.2 } })] })).error, 'invalid_body_position');
    assert.strictEqual(validateBodyPainMapPayload(validMap({ markers: [validMarker({ intensity: 11 })] })).error, 'invalid_body_intensity');
    assert.strictEqual(validateBodyPainMapPayload(validMap({ markers: [validMarker({ intensity: 6.5 })] })).error, 'invalid_body_intensity');
    assert.strictEqual(validateBodyPainMapPayload(validMap({ markers: [validMarker({ feels: ['sharp', 'stabbing'] })] })).error, 'invalid_body_feels');
    assert.strictEqual(validateBodyPainMapPayload(validMap({ markers: [validMarker({ onset: 'few_days' })] })).error, 'invalid_body_onset');
    assert.strictEqual(validateBodyPainMapPayload(validMap({ markers: [validMarker({ onset: 'not_sure' })] })).error, 'invalid_body_onset');
    assert.ok(validateBodyPainMapPayload(validMap({ markers: [validMarker({ onset: 'unsure', intensity: 0 })] })).ok);
    assert.strictEqual(validateBodyPainMapPayload(validMap({ markers: [validMarker({ note: 'x'.repeat(301) })] })).error, 'body_note_too_long');
    assert.strictEqual(validateBodyPainMapPayload(validMap({ markers: [validMarker({ regionId: 'liver' })] })).error, 'invalid_body_region');
    assert.strictEqual(
      validateBodyPainMapPayload(validMap({ markers: [validMarker({ layer: 'organs', view: 'front', regionId: 'lower_leg_left' })] })).error,
      'invalid_body_region_for_layer'
    );
  });

  await test('strips a diagnostic / treatment note but keeps the rest of the marker', () => {
    const result = validateBodyPainMapPayload(
      validMap({ markers: [validMarker({ note: 'This is likely gastritis. No red flags. Take an antacid.' })] })
    );
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.payload.markers[0].note, null);
    assert.strictEqual(result.notesStripped, 1);
    assert.strictEqual(result.payload.markers[0].regionId, 'lower_back_left');
  });

  await test('service stores the map on the owning session and includes it on doctor GET and summarize', async () => {
    const { service } = makeService();
    const { session } = await started(service);
    const saved = await service.submitBodyPainMap(PATIENT, session.id, validMap());
    assert.strictEqual(saved.bodyPainMap.markers[0].regionId, 'lower_back_left');
    const summary = await service.getSummary(PATIENT, session.id);
    assert.strictEqual(summary.bodyPainMap.markers[0].intensity, 6);
    await service.confirmAndShare(PATIENT, session.id);
    const doctor = await service.doctorGet(DOCTOR, session.id);
    assert.ok(doctor.bodyPainMap);
    assert.strictEqual(doctor.bodyPainMap.markers[0].feels[0], 'aching');
    await assert.rejects(
      () => service.submitBodyPainMap(PATIENT, session.id, validMap()),
      (e) => e instanceof IntakeError && e.code === 'already_shared'
    );
  });

  await test('authz: another patient cannot write the body map; null clears it', async () => {
    const { service } = makeService();
    const { session } = await started(service);
    await assert.rejects(
      () => service.submitBodyPainMap('patient-2', session.id, validMap()),
      (e) => e.code === 'forbidden'
    );
    await service.submitBodyPainMap(PATIENT, session.id, validMap());
    const cleared = await service.submitBodyPainMap(PATIENT, session.id, null);
    assert.strictEqual(cleared.bodyPainMap, null);
  });

  await test('openai provider prefers DOCTOR_AI_API_KEY over OPENAI_API_KEY and never logs values', async () => {
    assert.strictEqual(getOpenAiKey({ DOCTOR_AI_API_KEY: 'prefer-this', OPENAI_API_KEY: 'fallback-this' }), 'prefer-this');
    assert.strictEqual(getOpenAiKey({ OPENAI_API_KEY: 'fallback-this' }), 'fallback-this');
    assert.strictEqual(hasOpenAiKey({}), false);
    const env = { DOCTOR_AI_API_KEY: 'prefer-this', OPENAI_API_KEY: 'fallback-this' };
    let used;
    const provider = createOpenAiProvider({
      env,
      fetchImpl: async (_url, init) => {
        used = init.headers.Authorization;
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: JSON.stringify({ nextQuestion: 'How long has this been going on?', done: false }) } }],
          }),
        };
      },
    });
    const result = await provider.nextTurn({ locale: 'en', followUpsAsked: 1, turns: [] });
    assert.strictEqual(used, 'Bearer prefer-this');
    assert.ok(result.question);
    // Fail the test if any accidental leak of a key-like value is printed by this assertion path.
    assert.ok(!JSON.stringify(result).includes('prefer-this'));
    const fallbackProvider = createProvider({ name: 'openai', env: {} });
    assert.strictEqual(fallbackProvider.name, 'mock');
  });

  let express;
  try {
    express = require('express');
  } catch {
    express = null;
  }
  if (express) {
    const http = require('http');
    await test('HTTP POST /api/patient/intake/body-map matches the PR #39 client', async () => {
      const { service, store } = makeService();
      const app = express();
      app.use(express.json());
      mountPreVisitIntakeRoutes(app, {
        verifyUser: (req, res, next) => {
          const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
          if (token !== 'p:patient-1') return res.status(401).json({ ok: false, error: 'INVALID_TOKEN' });
          req.userId = PATIENT;
          next();
        },
        verifyDoctorAuth: (_req, res) => res.status(401).json({ ok: false, error: 'INVALID_TOKEN' }),
        service,
        store,
        enabled: () => true,
      });
      const server = http.createServer(app);
      await new Promise((r) => server.listen(0, '127.0.0.1', r));
      const { port } = server.address();
      const { session } = await started(service);
      const res = await fetch(`http://127.0.0.1:${port}/api/patient/intake/body-map`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer p:patient-1' },
        body: JSON.stringify({ sessionId: session.id, bodyPainMap: validMap() }),
      });
      const json = await res.json();
      assert.strictEqual(res.status, 200, JSON.stringify(json));
      assert.strictEqual(json.bodyPainMap.markers[0].regionId, 'lower_back_left');
      await new Promise((r) => server.close(r));
    });
  }

  console.log('previsit-intake-bodymap tests passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
