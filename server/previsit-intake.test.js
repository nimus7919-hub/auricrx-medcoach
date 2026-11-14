const assert = require('assert');
const { createMemoryStore } = require('./previsit-intake-store');
const { createMockProvider, computeRawChatDeleteAt, isRawChatExpired } = require('./previsit-intake-lib');
const { createIntakeService, IntakeError, mountPreVisitIntakeRoutes } = require('./previsit-intake');
const { MAX_FOLLOW_UPS } = require('./previsit-intake-config');

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => console.log(`✓ ${name}`))
    .catch((err) => {
      console.error(`✗ ${name}`);
      throw err;
    });
}

const PATIENT = 'patient-1';
const DOCTOR = 'doctor-1';
const OTHER_DOCTOR = 'doctor-unlinked';
const OTHER_PATIENT = 'patient-2';
const APPT = 'appt-local-1';
const APPT_START = '2026-12-01T15:00:00.000Z';

function linksFor(pairs) {
  const set = new Set(pairs.map(([p, d]) => `${p}::${d}`));
  return {
    async getActiveLink(patientId, doctorId) {
      if (set.has(`${patientId}::${doctorId}`)) {
        return { ok: true, displayName: 'Dra. Ana Torres', linkId: 'link-1' };
      }
      return { ok: false };
    },
  };
}

function makeService(opts = {}) {
  let t = Date.parse('2026-11-14T10:00:00.000Z');
  const now = opts.now || (() => new Date(t));
  const store = opts.store || createMemoryStore({ now });
  const audits = [];
  const service = createIntakeService({
    store,
    provider: createMockProvider(),
    links: opts.links || linksFor([[PATIENT, DOCTOR]]),
    audit: async (e) => audits.push(e),
    notify: opts.notify || (async () => ({ skipped: true })),
    now,
    retentionDays: opts.retentionDays || 30,
  });
  return { service, store, audits, now, advance: (ms) => { t += ms; } };
}

async function start(service, overrides = {}) {
  return service.startSession(overrides.patientId || PATIENT, {
    appointmentId: APPT,
    appointmentStartIso: APPT_START,
    doctorId: DOCTOR,
    locale: 'en',
    consent: {
      acceptedAt: '2026-11-14T10:00:00.000Z',
      noticeVersion: '2026-11-14',
      emergencyDisclaimerVersion: '2026-11-14',
    },
    ...overrides,
  });
}

(async () => {
  await test('start requires consent and a linked doctor', async () => {
    const { service } = makeService();
    await assert.rejects(() => start(service, { doctorId: OTHER_DOCTOR }), (e) => e instanceof IntakeError && e.code === 'doctor_not_linked');
    await assert.rejects(
      () => service.startSession(PATIENT, { appointmentId: APPT, appointmentStartIso: APPT_START, doctorId: DOCTOR, locale: 'en', consent: {} }),
      (e) => e.code === 'consent_required'
    );
  });

  await test('contract: start → 8 follow-ups → summarize → comment → confirm → list', async () => {
    const { service, audits } = makeService();
    const { session, firstMessage } = await start(service);
    assert.strictEqual(session.status, 'in_progress');
    assert.strictEqual(firstMessage.role, 'assistant');
    assert.ok(/own words/i.test(firstMessage.text));
    assert.strictEqual(session.appointmentRequestId, null);
    assert.strictEqual(session.turns.length, 1);

    const answers = [
      'My stomach hurts.',
      'in the pit of the stomach',
      'three days',
      '6',
      'a heavy feeling',
      'after I ate with my family',
      'nothing else',
      'none',
      'what should I ask?',
    ];
    let last;
    for (let i = 0; i < answers.length; i++) {
      last = await service.sendMessage(PATIENT, session.id, answers[i]);
      if (i < answers.length - 1) {
        assert.strictEqual(last.done, false, `done early at ${i}`);
        assert.ok(last.reply && last.reply.role === 'assistant');
      }
    }
    assert.strictEqual(last.done, true);
    assert.strictEqual(last.reply, null);
    assert.ok(answers.length - 1 === MAX_FOLLOW_UPS);

    const summary = await service.getSummary(PATIENT, session.id);
    assert.strictEqual(summary.mainConcern, 'My stomach hurts.');
    assert.strictEqual(summary.location, 'in the pit of the stomach');
    assert.strictEqual(summary.duration, 'three days');
    assert.strictEqual(summary.severityReported, 6);
    assert.ok(summary.alsoMentioned.includes('a heavy feeling'));
    assert.ok(summary.alsoMentioned.includes('after I ate with my family'));
    assert.deepStrictEqual(summary.questionsForDoctor, ['what should I ask?']);
    assert.strictEqual(summary.locale, 'en');

    const withComment = await service.addComment(PATIENT, session.id, 'Please look at this before Thursday.');
    assert.strictEqual(withComment.patientComment, 'Please look at this before Thursday.');
    assert.deepStrictEqual(withComment.summary, summary);

    const confirmed = await service.confirmAndShare(PATIENT, session.id);
    assert.strictEqual(confirmed.status, 'confirmed');
    assert.ok(confirmed.sharedAt);
    assert.strictEqual(confirmed.rawChatDeleteAt, computeRawChatDeleteAt(APPT_START, 30, confirmed.createdAt));

    const listed = await service.listSessionsForAppointment(PATIENT, APPT);
    assert.strictEqual(listed.length, 1);
    assert.strictEqual(listed[0].id, session.id);
    assert.ok(listed[0].turns.length > 0);
    assert.ok(audits.some((a) => a.action === 'intake_started'));
    assert.ok(audits.some((a) => a.action === 'intake_confirmed'));
  });

  await test('getSummary can be called mid-chat and locks further turns', async () => {
    const { service } = makeService();
    const { session } = await start(service);
    await service.sendMessage(PATIENT, session.id, 'My stomach hurts.');
    const summary = await service.getSummary(PATIENT, session.id);
    assert.strictEqual(summary.mainConcern, 'My stomach hurts.');
    assert.strictEqual(summary.duration, null);
    await assert.rejects(() => service.sendMessage(PATIENT, session.id, 'more'), (e) => e.code === 'intake_not_in_progress');
  });

  await test('patient cannot edit the summary via comment or confirm', async () => {
    const { service } = makeService();
    const { session } = await start(service);
    await service.sendMessage(PATIENT, session.id, 'My stomach hurts.');
    const original = await service.getSummary(PATIENT, session.id);
    await assert.rejects(
      () => service.addComment(PATIENT, session.id, 'hi', { summary: { ...original, mainConcern: 'I edited this' } }),
      (e) => e.code === 'summary_is_read_only' && e.status === 400
    );
    await assert.rejects(
      () => service.confirmAndShare(PATIENT, session.id, { summary: { mainConcern: 'hacked' } }),
      (e) => e.code === 'summary_is_read_only'
    );
    const confirmed = await service.confirmAndShare(PATIENT, session.id);
    assert.strictEqual(confirmed.summary.mainConcern, 'My stomach hurts.');
  });

  await test('comment is locked after confirm', async () => {
    const { service } = makeService();
    const { session } = await start(service);
    await service.sendMessage(PATIENT, session.id, 'My stomach hurts.');
    await service.getSummary(PATIENT, session.id);
    await service.confirmAndShare(PATIENT, session.id);
    await assert.rejects(() => service.addComment(PATIENT, session.id, 'late'), (e) => e.code === 'comment_locked');
  });

  await test('discard deletes an unsent draft; confirmed drafts cannot be discarded', async () => {
    const { service, store } = makeService();
    const { session } = await start(service);
    await service.discard(PATIENT, session.id);
    assert.strictEqual(await store.getIntake(session.id), null);
    const again = await start(service);
    await service.sendMessage(PATIENT, again.session.id, 'pain');
    await service.getSummary(PATIENT, again.session.id);
    await service.confirmAndShare(PATIENT, again.session.id);
    await assert.rejects(() => service.discard(PATIENT, again.session.id), (e) => e.code === 'already_shared');
  });

  await test('deleteChat purges turns but keeps summary and comment', async () => {
    const { service } = makeService();
    const { session } = await start(service);
    await service.sendMessage(PATIENT, session.id, 'My stomach hurts.');
    await service.getSummary(PATIENT, session.id);
    await service.addComment(PATIENT, session.id, 'a note');
    await service.confirmAndShare(PATIENT, session.id);
    const deleted = await service.deleteChat(PATIENT, session.id);
    assert.deepStrictEqual(deleted.turns, []);
    assert.strictEqual(deleted.summary.mainConcern, 'My stomach hurts.');
    assert.strictEqual(deleted.patientComment, 'a note');
    assert.ok(deleted.rawChatDeletedAt);
  });

  await test('retention purge auto-deletes raw chat after appointment start + N days', async () => {
    let nowMs = Date.parse('2026-11-14T10:00:00.000Z');
    const { service } = makeService({ now: () => new Date(nowMs), retentionDays: 30 });
    const { session } = await start(service);
    await service.sendMessage(PATIENT, session.id, 'My stomach hurts.');
    await service.getSummary(PATIENT, session.id);
    await service.confirmAndShare(PATIENT, session.id);
    const deleteAt = computeRawChatDeleteAt(APPT_START, 30);
    assert.strictEqual(isRawChatExpired(deleteAt, new Date(nowMs)), false);
    nowMs = Date.parse(deleteAt);
    const listed = await service.listSessionsForAppointment(PATIENT, APPT);
    assert.strictEqual(listed.length, 1);
    assert.deepStrictEqual(listed[0].turns, []);
    assert.ok(listed[0].rawChatDeletedAt);
    assert.strictEqual(listed[0].summary.mainConcern, 'My stomach hurts.');
  });

  await test('list is confirmed-only and scoped to the signed-in patient and appointment', async () => {
    const { service } = makeService({
      links: linksFor([[PATIENT, DOCTOR], [OTHER_PATIENT, DOCTOR]]),
    });
    const a = await start(service);
    await service.sendMessage(PATIENT, a.session.id, 'one');
    await service.getSummary(PATIENT, a.session.id);
    // not confirmed yet
    assert.deepStrictEqual(await service.listSessionsForAppointment(PATIENT, APPT), []);
    await service.confirmAndShare(PATIENT, a.session.id);
    const other = await start(service, { patientId: OTHER_PATIENT, appointmentId: 'other-appt' });
    await service.sendMessage(OTHER_PATIENT, other.session.id, 'two');
    await service.getSummary(OTHER_PATIENT, other.session.id);
    await service.confirmAndShare(OTHER_PATIENT, other.session.id);
    const mine = await service.listSessionsForAppointment(PATIENT, APPT);
    assert.strictEqual(mine.length, 1);
    assert.strictEqual(mine[0].id, a.session.id);
    assert.deepStrictEqual(await service.listSessionsForAppointment(PATIENT, 'other-appt'), []);
  });

  await test('authz: a doctor cannot read an unlinked patient intake', async () => {
    const { service } = makeService({
      links: linksFor([[PATIENT, DOCTOR]]),
    });
    const { session } = await start(service);
    await service.sendMessage(PATIENT, session.id, 'My stomach hurts.');
    await service.getSummary(PATIENT, session.id);
    await service.confirmAndShare(PATIENT, session.id);
    await assert.rejects(() => service.doctorGet(OTHER_DOCTOR, session.id), (e) => e.code === 'forbidden' && e.status === 403);
    const list = await service.doctorList(OTHER_DOCTOR);
    assert.deepStrictEqual(list, []);
    const visible = await service.doctorList(DOCTOR);
    assert.strictEqual(visible.length, 1);
    assert.strictEqual(visible[0].id, session.id);
  });

  await test('authz: a patient cannot read or mutate another patient session', async () => {
    const { service } = makeService();
    const { session } = await start(service);
    await assert.rejects(() => service.sendMessage(OTHER_PATIENT, session.id, 'hack'), (e) => e.code === 'forbidden');
    await assert.rejects(() => service.getSummary(OTHER_PATIENT, session.id), (e) => e.code === 'forbidden');
    await assert.rejects(() => service.discard(OTHER_PATIENT, session.id), (e) => e.code === 'forbidden');
  });

  await test('nullable appointmentRequestId is stored when provided', async () => {
    const { service } = makeService();
    const { session } = await start(service, { appointmentRequestId: 'req-99' });
    assert.strictEqual(session.appointmentRequestId, 'req-99');
  });

  // HTTP contract, including the feature flag and summary-edit rejection at the route layer.
  let express;
  try {
    express = require('express');
  } catch {
    express = null;
  }
  if (express) {
    const http = require('http');

    function listen(app) {
      const server = http.createServer(app);
      return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => {
          const { port } = server.address();
          resolve({
            server,
            url: `http://127.0.0.1:${port}`,
            close: () => new Promise((r) => server.close(() => r())),
          });
        });
      });
    }

    function authAs(uid, kind) {
      return (req, res, next) => {
        const header = req.headers.authorization || '';
        const token = header.replace(/^Bearer\s+/i, '');
        if (token !== `${kind}:${uid}`) return res.status(401).json({ ok: false, error: 'INVALID_TOKEN' });
        req.userId = uid;
        next();
      };
    }

    await test('HTTP contract matches PR #36 paths and payloads', async () => {
      const { service, store } = makeService();
      const app = express();
      app.use(express.json());
      let enabled = true;
      mountPreVisitIntakeRoutes(app, {
        verifyUser: authAs(PATIENT, 'p'),
        verifyDoctorAuth: authAs(DOCTOR, 'd'),
        service,
        store,
        enabled: () => enabled,
        links: linksFor([[PATIENT, DOCTOR]]),
      });
      const srv = await listen(app);
      const call = async (method, path, body, token) => {
        const res = await fetch(`${srv.url}${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: method === 'GET' ? undefined : JSON.stringify(body || {}),
        });
        const json = await res.json().catch(() => ({}));
        return { status: res.status, json };
      };

      enabled = false;
      const off = await call('POST', '/api/patient/intake/start', {}, 'p:' + PATIENT);
      assert.strictEqual(off.status, 404);
      assert.strictEqual(off.json.error, 'feature_disabled');
      enabled = true;

      const started = await call(
        'POST',
        '/api/patient/intake/start',
        {
          appointmentId: APPT,
          appointmentStartIso: APPT_START,
          doctorId: DOCTOR,
          locale: 'en',
          consent: { acceptedAt: '2026-11-14T10:00:00.000Z', noticeVersion: '2026-11-14', emergencyDisclaimerVersion: '2026-11-14' },
        },
        'p:' + PATIENT
      );
      assert.strictEqual(started.status, 200, JSON.stringify(started.json));
      assert.ok(started.json.session && started.json.firstMessage);
      const sessionId = started.json.session.id;

      const turn = await call('POST', '/api/patient/intake/turn', { sessionId, text: 'My stomach hurts.' }, 'p:' + PATIENT);
      assert.strictEqual(turn.status, 200);
      assert.strictEqual(turn.json.patientTurn.text, 'My stomach hurts.');
      assert.strictEqual(typeof turn.json.done, 'boolean');

      const summary = await call('POST', '/api/patient/intake/summarize', { sessionId }, 'p:' + PATIENT);
      assert.strictEqual(summary.status, 200);
      assert.strictEqual(summary.json.mainConcern, 'My stomach hurts.');
      assert.ok(!('session' in summary.json));

      const rejected = await call(
        'POST',
        '/api/patient/intake/comment',
        { sessionId, comment: 'note', summary: { mainConcern: 'edited' } },
        'p:' + PATIENT
      );
      assert.strictEqual(rejected.status, 400);
      assert.strictEqual(rejected.json.error, 'summary_is_read_only');

      const commented = await call('POST', '/api/patient/intake/comment', { sessionId, comment: 'note' }, 'p:' + PATIENT);
      assert.strictEqual(commented.status, 200);
      assert.strictEqual(commented.json.patientComment, 'note');

      const confirmed = await call('POST', '/api/patient/intake/confirm', { sessionId }, 'p:' + PATIENT);
      assert.strictEqual(confirmed.status, 200);
      assert.strictEqual(confirmed.json.status, 'confirmed');

      const listed = await call('GET', `/api/patient/intake/list?appointmentId=${APPT}`, undefined, 'p:' + PATIENT);
      assert.strictEqual(listed.status, 200);
      assert.ok(Array.isArray(listed.json));
      assert.strictEqual(listed.json[0].id, sessionId);

      const docList = await call('GET', '/api/doctor/intake/list', undefined, 'd:' + DOCTOR);
      assert.strictEqual(docList.status, 200);
      assert.strictEqual(docList.json.intakes.length, 1);

      const docGet = await call('GET', `/api/doctor/intake/${sessionId}`, undefined, 'd:' + DOCTOR);
      assert.strictEqual(docGet.status, 200);
      assert.strictEqual(docGet.json.intake.id, sessionId);

      await srv.close();
    });

    await test('HTTP authz: unlinked doctor is 403; unauthenticated is 401', async () => {
      const { service, store } = makeService();
      const { session } = await start(service);
      await service.sendMessage(PATIENT, session.id, 'My stomach hurts.');
      await service.getSummary(PATIENT, session.id);
      await service.confirmAndShare(PATIENT, session.id);

      const app = express();
      app.use(express.json());
      mountPreVisitIntakeRoutes(app, {
        verifyUser: authAs(PATIENT, 'p'),
        verifyDoctorAuth: (req, res, next) => {
          const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
          if (!token.startsWith('d:')) return res.status(401).json({ ok: false, error: 'INVALID_TOKEN' });
          req.userId = token.slice(2);
          next();
        },
        service,
        store,
        enabled: () => true,
      });
      const srv = await listen(app);
      const noAuth = await fetch(`${srv.url}/api/doctor/intake/list`);
      assert.strictEqual(noAuth.status, 401);
      const unlinked = await fetch(`${srv.url}/api/doctor/intake/${session.id}`, {
        headers: { Authorization: `Bearer d:${OTHER_DOCTOR}` },
      });
      assert.strictEqual(unlinked.status, 403);
      const body = await unlinked.json();
      assert.strictEqual(body.error, 'forbidden');
      await srv.close();
    });
  } else {
    console.log('↷ HTTP route tests skipped (express not installed in this environment)');
  }

  console.log('previsit-intake tests passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
