/**
 * Pre-visit AI intake routes (patient + doctor) and service.
 *
 * Patient contract matches PR #36 httpPreVisitIntakeClient exactly:
 *   POST /api/patient/intake/start|turn|summarize|comment|confirm|discard|delete-chat
 *   GET  /api/patient/intake/list?appointmentId=
 *
 * Doctor:
 *   GET  /api/doctor/intake/list
 *   GET  /api/doctor/intake/:id
 *   POST /api/doctor/intake/:id/view
 *
 * Feature flag PREVISIT_INTAKE_ENABLED defaults to false (404 feature_disabled).
 * Provider defaults to mock. Do not run the Neon migration from this file.
 */

const {
  isPreVisitIntakeEnabled,
  getPreVisitIntakeProvider,
  MAX_COMMENT_LENGTH,
  RAW_CHAT_RETENTION_DAYS_AFTER_APPOINTMENT,
} = require('./previsit-intake-config');
const {
  computeRawChatDeleteAt,
  isRawChatExpired,
  questionFor,
  isInterviewDone,
  newId,
  trimMessage,
  createProvider,
  answersFromTurns,
  genericIntakePushCopy,
  QUESTION_KEYS,
} = require('./previsit-intake-lib');
const { createStore } = require('./previsit-intake-store');

class IntakeError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function publicTurns(row, turns) {
  if (row.rawChatDeletedAt || (row.rawChatDeleteAt && isRawChatExpired(row.rawChatDeleteAt))) {
    return [];
  }
  return (turns || []).map((t) => ({
    id: t.id,
    role: t.role,
    text: t.text,
    createdAt: t.createdAt,
  }));
}

function toSession(row, turns) {
  return {
    id: row.id,
    appointmentId: row.appointmentId,
    appointmentStartIso: row.appointmentStartIso,
    appointmentRequestId: row.appointmentRequestId ?? null,
    patientId: row.patientId,
    doctorId: row.doctorId,
    doctorDisplayName: row.doctorDisplayName,
    locale: row.locale,
    status: row.status,
    consent: row.consent,
    turns: publicTurns(row, turns),
    followUpsAsked: row.followUpsAsked,
    summary: row.summary,
    patientComment: row.patientComment,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    sharedAt: row.sharedAt,
    rawChatDeleteAt: row.rawChatDeleteAt,
    rawChatDeletedAt: row.rawChatDeletedAt,
  };
}

function makeTurn(role, text, at) {
  return { id: newId('turn'), intakeId: undefined, role, text, createdAt: at };
}

function createIntakeService({
  store,
  provider,
  links,
  audit,
  notify,
  now = () => new Date(),
  retentionDays = RAW_CHAT_RETENTION_DAYS_AFTER_APPOINTMENT,
} = {}) {
  if (!store) throw new Error('store_required');
  const interviewer = provider || createProvider({ name: 'mock' });
  const clock = () => now().toISOString();

  async function requireOwned(sessionId, patientId) {
    const row = await store.getIntake(sessionId);
    if (!row) throw new IntakeError('intake_not_found', 404);
    if (row.patientId !== patientId) throw new IntakeError('forbidden', 403);
    return row;
  }

  async function withTurns(row) {
    const turns = row.rawChatDeletedAt ? [] : await store.listTurns(row.id);
    return toSession(row, turns);
  }

  async function maybePurge(row) {
    if (row.status === 'confirmed' && !row.rawChatDeletedAt && isRawChatExpired(row.rawChatDeleteAt, now())) {
      await store.deleteTurns(row.id);
      return store.updateIntake(row.id, { rawChatDeletedAt: clock() });
    }
    return row;
  }

  async function writeAudit(entry) {
    if (!audit) return;
    try {
      await audit(entry);
    } catch (err) {
      console.error('previsit intake audit failed:', err && err.message);
    }
  }

  return {
    async startSession(patientId, input) {
      const doctorId = String(input?.doctorId || '');
      if (!doctorId) throw new IntakeError('doctor_not_linked', 403);
      const link = links ? await links.getActiveLink(patientId, doctorId) : { ok: true, displayName: doctorId };
      if (!link || !link.ok) throw new IntakeError('doctor_not_linked', 403);
      if (!input?.consent || !input.consent.acceptedAt) throw new IntakeError('consent_required', 400);
      const locale = input.locale === 'es' ? 'es' : 'en';
      if (!input.appointmentId || !input.appointmentStartIso) {
        throw new IntakeError('appointment_required', 400);
      }
      const createdAt = clock();
      const firstText = questionFor('mainConcern', locale);
      const first = { id: newId('turn'), role: 'assistant', text: firstText, createdAt };
      const row = {
        id: newId('intake'),
        patientId,
        doctorId,
        doctorDisplayName: link.displayName || doctorId,
        appointmentId: String(input.appointmentId),
        appointmentStartIso: String(input.appointmentStartIso),
        appointmentRequestId: input.appointmentRequestId ? String(input.appointmentRequestId) : null,
        locale,
        status: 'in_progress',
        consent: {
          acceptedAt: String(input.consent.acceptedAt),
          noticeVersion: String(input.consent.noticeVersion || ''),
          emergencyDisclaimerVersion: String(input.consent.emergencyDisclaimerVersion || ''),
        },
        followUpsAsked: 0,
        summary: null,
        patientComment: null,
        createdAt,
        updatedAt: createdAt,
        sharedAt: null,
        rawChatDeleteAt: computeRawChatDeleteAt(input.appointmentStartIso, retentionDays, createdAt),
        rawChatDeletedAt: null,
      };
      await store.insertIntake(row);
      await store.appendTurn({ ...first, intakeId: row.id });
      await writeAudit({
        actorId: patientId,
        actorRole: 'patient',
        action: 'intake_started',
        patientId,
        doctorId,
        detail: row.id,
        createdAt,
      });
      const session = toSession(row, [first]);
      return { session, firstMessage: { id: first.id, role: first.role, text: first.text, createdAt: first.createdAt } };
    },

    async sendMessage(patientId, sessionId, text) {
      const row = await requireOwned(sessionId, patientId);
      if (row.status !== 'in_progress') throw new IntakeError('intake_not_in_progress', 400);
      const clean = trimMessage(text);
      if (!clean) throw new IntakeError('empty_message', 400);
      const at = clock();
      const patientTurn = { id: newId('turn'), role: 'patient', text: clean, createdAt: at };
      await store.appendTurn({ ...patientTurn, intakeId: row.id });
      const nextIndex = row.followUpsAsked + 1;
      const done = isInterviewDone(nextIndex);
      let reply = null;
      let followUpsAsked = row.followUpsAsked;
      if (!done) {
        const turns = await store.listTurns(row.id);
        const result = await interviewer.nextTurn({
          locale: row.locale,
          followUpsAsked: nextIndex,
          turns,
        });
        const question = result.question || questionFor(QUESTION_KEYS[nextIndex], row.locale);
        if (question && result.done !== true) {
          reply = { id: newId('turn'), role: 'assistant', text: question, createdAt: clock() };
          await store.appendTurn({ ...reply, intakeId: row.id });
          followUpsAsked = nextIndex;
        }
      }
      const reallyDone = done || !reply;
      await store.updateIntake(row.id, { followUpsAsked: reallyDone ? row.followUpsAsked : followUpsAsked });
      await writeAudit({
        actorId: patientId,
        actorRole: 'patient',
        action: 'intake_turn',
        patientId,
        doctorId: row.doctorId,
        detail: row.id,
        createdAt: at,
      });
      return {
        patientTurn: { id: patientTurn.id, role: 'patient', text: clean, createdAt: at },
        reply: reply ? { id: reply.id, role: 'assistant', text: reply.text, createdAt: reply.createdAt } : null,
        done: reallyDone,
      };
    },

    async getSummary(patientId, sessionId) {
      const row = await requireOwned(sessionId, patientId);
      if (row.status === 'discarded') throw new IntakeError('intake_discarded', 400);
      if (row.summary && row.status !== 'in_progress') return row.summary;
      const turns = await store.listTurns(row.id);
      const generatedAt = clock();
      const result = await interviewer.summarize({
        answers: answersFromTurns(turns),
        turns,
        locale: row.locale,
        generatedAt,
      });
      const summary = result.summary;
      await store.updateIntake(row.id, { summary, status: 'awaiting_confirmation' });
      return summary;
    },

    async addComment(patientId, sessionId, comment, extra) {
      if (extra && extra.summary !== undefined) {
        throw new IntakeError('summary_is_read_only', 400);
      }
      const row = await requireOwned(sessionId, patientId);
      if (row.status !== 'awaiting_confirmation') throw new IntakeError('comment_locked', 403);
      const c = String(comment ?? '').trim().slice(0, MAX_COMMENT_LENGTH);
      const updated = await store.updateIntake(row.id, { patientComment: c || null });
      return withTurns(updated);
    },

    async confirmAndShare(patientId, sessionId, extra) {
      if (extra && extra.summary !== undefined) {
        throw new IntakeError('summary_is_read_only', 400);
      }
      const row = await requireOwned(sessionId, patientId);
      if (row.status !== 'awaiting_confirmation' || !row.summary) {
        throw new IntakeError('summary_not_ready', 400);
      }
      const stillLinked = links ? await links.getActiveLink(patientId, row.doctorId) : { ok: true };
      if (!stillLinked || !stillLinked.ok) throw new IntakeError('doctor_not_linked', 403);
      const sharedAt = clock();
      const updated = await store.updateIntake(row.id, { status: 'confirmed', sharedAt });
      await writeAudit({
        actorId: patientId,
        actorRole: 'patient',
        action: 'intake_confirmed',
        patientId,
        doctorId: row.doctorId,
        detail: row.id,
        createdAt: sharedAt,
      });
      if (notify) {
        try {
          await notify({
            doctorId: row.doctorId,
            patientId,
            intakeId: row.id,
            language: row.locale,
          });
        } catch (err) {
          console.error('previsit intake notify failed:', err && err.message);
        }
      }
      return withTurns(updated);
    },

    async discard(patientId, sessionId) {
      const row = await requireOwned(sessionId, patientId);
      if (row.status === 'confirmed') throw new IntakeError('already_shared', 400);
      await store.deleteIntake(row.id);
    },

    async deleteChat(patientId, sessionId) {
      const row = await requireOwned(sessionId, patientId);
      if (row.status !== 'confirmed') throw new IntakeError('use_discard_for_unsent', 400);
      await store.deleteTurns(row.id);
      const updated = await store.updateIntake(row.id, {
        rawChatDeletedAt: row.rawChatDeletedAt || clock(),
      });
      return withTurns(updated);
    },

    async listSessionsForAppointment(patientId, appointmentId) {
      if (!appointmentId) throw new IntakeError('appointment_required', 400);
      await store.purgeExpiredTurns(now());
      const rows = await store.listIntakes({
        patientId,
        appointmentId,
        status: 'confirmed',
      });
      const out = [];
      for (const row of rows) {
        const purged = await maybePurge(row);
        out.push(await withTurns(purged));
      }
      return out;
    },

    async doctorList(doctorId) {
      await store.purgeExpiredTurns(now());
      const rows = await store.listIntakes({ doctorId, status: 'confirmed' });
      const out = [];
      for (const row of rows) {
        const linked = links ? await links.getActiveLink(row.patientId, doctorId) : { ok: true };
        if (!linked || !linked.ok) continue;
        const purged = await maybePurge(row);
        out.push(await withTurns(purged));
      }
      return out;
    },

    async doctorGet(doctorId, sessionId) {
      const row = await store.getIntake(sessionId);
      if (!row) throw new IntakeError('intake_not_found', 404);
      if (row.doctorId !== doctorId) throw new IntakeError('forbidden', 403);
      if (row.status !== 'confirmed') throw new IntakeError('forbidden', 403);
      const linked = links ? await links.getActiveLink(row.patientId, doctorId) : { ok: true };
      if (!linked || !linked.ok) throw new IntakeError('forbidden', 403);
      const purged = await maybePurge(row);
      return withTurns(purged);
    },

    async doctorView(doctorId, sessionId) {
      const session = await this.doctorGet(doctorId, sessionId);
      await writeAudit({
        actorId: doctorId,
        actorRole: 'doctor',
        action: 'intake_viewed',
        patientId: session.patientId,
        doctorId,
        detail: session.id,
        createdAt: clock(),
      });
      return session;
    },

    async purgeExpired() {
      return store.purgeExpiredTurns(now());
    },
  };
}

async function defaultGetActiveLink(patientId, doctorId) {
  try {
    const { getDoctorFirestore } = require('./doctor-firestore');
    const db = getDoctorFirestore();
    const snap = await db
      .collection('doctorLinks')
      .where('patientId', '==', patientId)
      .where('doctorId', '==', doctorId)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    if (snap.empty) return { ok: false };
    const link = snap.docs[0].data();
    let displayName = link.doctorDisplayName || doctorId;
    try {
      const profileSnap = await db.collection('doctorProfiles').doc(doctorId).get();
      if (profileSnap.exists && profileSnap.data()?.displayName) {
        displayName = profileSnap.data().displayName;
      }
    } catch {
      /* use link name */
    }
    return { ok: true, displayName, linkId: link.id || snap.docs[0].id };
  } catch (err) {
    console.error('previsit link lookup failed:', err && err.message);
    return { ok: false };
  }
}

async function defaultAudit(entry) {
  const { getDoctorFirestore } = require('./doctor-firestore');
  const db = getDoctorFirestore();
  const id = newId('audit');
  await db.collection('doctorAuditLogs').doc(id).set({
    id,
    actorId: entry.actorId,
    actorRole: entry.actorRole,
    action: entry.action,
    patientId: entry.patientId || null,
    doctorId: entry.doctorId || null,
    linkId: entry.linkId || '',
    detail: String(entry.detail || '').slice(0, 2000),
    createdAt: entry.createdAt || new Date().toISOString(),
  });
}

async function defaultNotify({ doctorId, intakeId, language }) {
  const { getDoctorFirestore } = require('./doctor-firestore');
  const db = getDoctorFirestore();
  const { sendExpoPush } = require('./doctor-messaging');
  const tokenSnap = await db.collection('doctorPushTokens').doc(doctorId).get();
  const token = tokenSnap.exists ? tokenSnap.data()?.expoPushToken : null;
  if (!token) return { skipped: true, reason: 'no_token' };
  const copy = genericIntakePushCopy(language);
  return sendExpoPush(token, {
    title: copy.title,
    body: copy.body,
    data: { type: 'previsit_intake', intakeId: intakeId || '' },
  });
}

function sendErr(res, err) {
  if (err instanceof IntakeError) {
    return res.status(err.status).json({ ok: false, error: err.code });
  }
  console.error('previsit intake error:', err && err.message);
  return res.status(500).json({ ok: false, error: 'intake_failed' });
}

function featureGuard(enabled, req, res, next) {
  if (!enabled()) return res.status(404).json({ ok: false, error: 'feature_disabled' });
  return next();
}

function mountPreVisitIntakeRoutes(app, deps = {}) {
  const enabled = deps.enabled || isPreVisitIntakeEnabled;
  const now = deps.now || (() => new Date());
  const store = deps.store || createDefaultStore({ now });
  const provider = deps.provider || createProvider({ name: getPreVisitIntakeProvider(deps.env || process.env), env: deps.env || process.env, fetchImpl: deps.fetchImpl });
  const service = deps.service || createIntakeService({
    store,
    provider,
    links: deps.links || { getActiveLink: defaultGetActiveLink },
    audit: deps.audit || defaultAudit,
    notify: deps.notify || defaultNotify,
    now,
    retentionDays: deps.retentionDays,
  });

  const guard = (req, res, next) => featureGuard(enabled, req, res, next);

  app.post('/api/patient/intake/start', guard, deps.verifyUser, async (req, res) => {
    try {
      const result = await service.startSession(req.userId, req.body || {});
      return res.json(result);
    } catch (err) {
      return sendErr(res, err);
    }
  });

  app.post('/api/patient/intake/turn', guard, deps.verifyUser, async (req, res) => {
    try {
      const { sessionId, text } = req.body || {};
      const result = await service.sendMessage(req.userId, sessionId, text);
      return res.json(result);
    } catch (err) {
      return sendErr(res, err);
    }
  });

  app.post('/api/patient/intake/summarize', guard, deps.verifyUser, async (req, res) => {
    try {
      const summary = await service.getSummary(req.userId, req.body?.sessionId);
      return res.json(summary);
    } catch (err) {
      return sendErr(res, err);
    }
  });

  app.post('/api/patient/intake/comment', guard, deps.verifyUser, async (req, res) => {
    try {
      const { sessionId, comment, summary, ...rest } = req.body || {};
      const session = await service.addComment(req.userId, sessionId, comment, { summary, ...rest });
      return res.json(session);
    } catch (err) {
      return sendErr(res, err);
    }
  });

  app.post('/api/patient/intake/confirm', guard, deps.verifyUser, async (req, res) => {
    try {
      const { sessionId, summary, ...rest } = req.body || {};
      const session = await service.confirmAndShare(req.userId, sessionId, { summary, ...rest });
      return res.json(session);
    } catch (err) {
      return sendErr(res, err);
    }
  });

  app.post('/api/patient/intake/discard', guard, deps.verifyUser, async (req, res) => {
    try {
      await service.discard(req.userId, req.body?.sessionId);
      return res.status(200).json({ ok: true });
    } catch (err) {
      return sendErr(res, err);
    }
  });

  app.post('/api/patient/intake/delete-chat', guard, deps.verifyUser, async (req, res) => {
    try {
      const session = await service.deleteChat(req.userId, req.body?.sessionId);
      return res.json(session);
    } catch (err) {
      return sendErr(res, err);
    }
  });

  app.get('/api/patient/intake/list', guard, deps.verifyUser, async (req, res) => {
    try {
      const list = await service.listSessionsForAppointment(req.userId, req.query?.appointmentId);
      return res.json(list);
    } catch (err) {
      return sendErr(res, err);
    }
  });

  app.get('/api/doctor/intake/list', guard, deps.verifyDoctorAuth, async (req, res) => {
    try {
      const intakes = await service.doctorList(req.userId);
      return res.json({ ok: true, intakes });
    } catch (err) {
      return sendErr(res, err);
    }
  });

  app.get('/api/doctor/intake/:id', guard, deps.verifyDoctorAuth, async (req, res) => {
    try {
      const intake = await service.doctorGet(req.userId, req.params.id);
      return res.json({ ok: true, intake });
    } catch (err) {
      return sendErr(res, err);
    }
  });

  app.post('/api/doctor/intake/:id/view', guard, deps.verifyDoctorAuth, async (req, res) => {
    try {
      const intake = await service.doctorView(req.userId, req.params.id);
      return res.json({ ok: true, intake });
    } catch (err) {
      return sendErr(res, err);
    }
  });

  // Optional cron/manual purge. Protected by the same doctor auth when called from ops,
  // or by a dedicated secret if PREVISIT_INTAKE_PURGE_SECRET is set.
  app.post('/api/internal/intake/purge', async (req, res) => {
    if (!enabled()) return res.status(404).json({ ok: false, error: 'feature_disabled' });
    const secret = process.env.PREVISIT_INTAKE_PURGE_SECRET;
    const header = req.headers['x-intake-purge-secret'];
    if (secret) {
      if (!header || header !== secret) return res.status(401).json({ ok: false, error: 'unauthorized' });
    } else if (deps.verifyDoctorAuth) {
      return deps.verifyDoctorAuth(req, res, async () => {
        try {
          const result = await service.purgeExpired();
          return res.json({ ok: true, ...result });
        } catch (err) {
          return sendErr(res, err);
        }
      });
    } else {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
    try {
      const result = await service.purgeExpired();
      return res.json({ ok: true, ...result });
    } catch (err) {
      return sendErr(res, err);
    }
  });

  return { service, store, provider };
}

function createDefaultStore({ now } = {}) {
  if (process.env.DATABASE_URL) {
    try {
      const { neon } = require('@neondatabase/serverless');
      return createStore({ sql: neon(process.env.DATABASE_URL), now });
    } catch (err) {
      console.error('previsit neon store init failed, using memory:', err && err.message);
    }
  }
  return createStore({ now });
}

function startPurgeScheduler(service, { intervalMs = 60 * 60 * 1000, enabled = isPreVisitIntakeEnabled } = {}) {
  if (!enabled()) return null;
  const timer = setInterval(() => {
    service.purgeExpired().catch((err) => {
      console.error('previsit purge failed:', err && err.message);
    });
  }, intervalMs);
  if (typeof timer.unref === 'function') timer.unref();
  return timer;
}

module.exports = {
  IntakeError,
  createIntakeService,
  mountPreVisitIntakeRoutes,
  startPurgeScheduler,
  toSession,
  defaultGetActiveLink,
};
