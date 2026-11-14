/**
 * In-memory MOCK of the pre-visit intake API. Dev / preview only — the feature flag refuses
 * to enable the feature in production builds while the API mode is 'mock'.
 *
 * The mock interviewer asks a FIXED list of allowed, descriptive question types and builds the
 * summary by copying the patient's own answers verbatim into the fixed fields. It never rewrites,
 * labels or interprets anything.
 */
import { PRE_VISIT_INTAKE_CONFIG } from '../../config/preVisitIntake';
import { computeRawChatDeleteAt, isRawChatExpired } from './retention';
import { parseBodyPainMapPayload } from '../../components/bodyMap/payload';
import type {
  BodyPainMapPayload,
  IntakeDoctor,
  IntakeSession,
  IntakeSummary,
  IntakeTurn,
  PreVisitIntakeClient,
  SendMessageResult,
  StartSessionInput,
  StartSessionResult,
} from './types';

/** Opening question + 8 follow-ups (PR #35 §5). Keys live in i18n under preVisitIntake.mockQuestions. */
export const MOCK_QUESTION_KEYS = [
  'mainConcern',
  'location',
  'duration',
  'severity',
  'character',
  'betterWorse',
  'otherSensations',
  'medicinesMentioned',
  'questionsForDoctor',
] as const;
export type MockQuestionKey = (typeof MOCK_QUESTION_KEYS)[number];

export const MOCK_DOCTORS: IntakeDoctor[] = [
  { id: 'mock-doctor-1', displayName: 'Dra. Ana Torres (demo)', linkId: 'mock-link-1' },
  { id: 'mock-doctor-2', displayName: 'Dr. Luis Méndez (demo)', linkId: 'mock-link-2' },
];

export interface MockClientOptions {
  /** Returns the localized question text for a key (`preVisitIntake.mockQuestions.<key>`). */
  translateQuestion: (key: MockQuestionKey, locale: 'en' | 'es') => string;
  doctors?: IntakeDoctor[];
  now?: () => Date;
  retentionDays?: number;
  latencyMs?: number;
}

const NONE_ANSWERS = new Set(['no', 'none', 'nothing', 'nope', 'n/a', 'na', 'ninguna', 'ninguno', 'nada', 'no tengo', 'no sé', 'no se', "i don't know", 'idk']);

function isNoneAnswer(text: string): boolean {
  return NONE_ANSWERS.has(text.trim().toLowerCase().replace(/[.!¡¿?]+$/g, ''));
}

/** Only accept a bare patient-stated number 1–10 (e.g. "6", "6/10", "un 7"). Never inferred. */
export function parseReportedSeverity(text: string): number | null {
  const m = String(text).match(/\b(10|[1-9])(?:\s*(?:\/|de|of|out of)\s*10)?\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 10 ? n : null;
}

/** Verbatim mapping of answers → fixed fields. Exported for tests. */
export function buildDescriptiveSummary(
  answers: Partial<Record<MockQuestionKey, string>>,
  locale: 'en' | 'es',
  generatedAt: string
): IntakeSummary {
  const keep = (v?: string) => (v && !isNoneAnswer(v) ? v.trim() : null);
  const also: string[] = [];
  let severityReported: number | null = null;
  if (answers.severity) {
    severityReported = parseReportedSeverity(answers.severity);
    if (severityReported === null && keep(answers.severity)) also.push(answers.severity.trim());
  }
  for (const k of ['character', 'betterWorse', 'otherSensations', 'medicinesMentioned'] as const) {
    const v = keep(answers[k]);
    if (v) also.push(v);
  }
  const q = keep(answers.questionsForDoctor);
  return {
    mainConcern: keep(answers.mainConcern),
    location: keep(answers.location),
    duration: keep(answers.duration),
    severityReported,
    alsoMentioned: also,
    questionsForDoctor: q ? [q] : [],
    locale,
    generatedAt,
  };
}

let counter = 0;
const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${(counter++).toString(36)}`;

export function createMockPreVisitIntakeClient(opts: MockClientOptions): PreVisitIntakeClient {
  const sessions = new Map<string, IntakeSession>();
  const answers = new Map<string, Partial<Record<MockQuestionKey, string>>>();
  const now = opts.now ?? (() => new Date());
  const doctors = opts.doctors ?? MOCK_DOCTORS;
  const latency = opts.latencyMs ?? 0;
  const wait = () => (latency > 0 ? new Promise((r) => setTimeout(r, latency)) : Promise.resolve());

  const get = (id: string): IntakeSession => {
    const s = sessions.get(id);
    if (!s) throw new Error('intake_not_found');
    return s;
  };
  const save = (s: IntakeSession): IntakeSession => {
    const next = { ...s, updatedAt: now().toISOString() };
    sessions.set(s.id, next);
    return next;
  };
  const turn = (role: IntakeTurn['role'], text: string): IntakeTurn => ({
    id: newId('turn'),
    role,
    text,
    createdAt: now().toISOString(),
  });
  /** Retention: auto-delete raw chat once past rawChatDeleteAt; summary + comment are kept. */
  const purgeExpired = () => {
    for (const s of sessions.values()) {
      if (s.status === 'confirmed' && !s.rawChatDeletedAt && isRawChatExpired(s.rawChatDeleteAt, now())) {
        sessions.set(s.id, { ...s, turns: [], rawChatDeletedAt: now().toISOString() });
        answers.delete(s.id);
      }
    }
  };

  return {
    mode: 'mock',

    async listEligibleDoctors() {
      await wait();
      return doctors.slice();
    },

    async startSession(input: StartSessionInput): Promise<StartSessionResult> {
      await wait();
      const doctor = doctors.find((d) => d.id === input.doctorId);
      if (!doctor) throw new Error('doctor_not_linked');
      if (!input.consent?.acceptedAt) throw new Error('consent_required');
      const createdAt = now().toISOString();
      const first = turn('assistant', opts.translateQuestion('mainConcern', input.locale));
      const session: IntakeSession = {
        id: newId('intake'),
        appointmentId: input.appointmentId,
        appointmentStartIso: input.appointmentStartIso,
        doctorId: doctor.id,
        doctorDisplayName: doctor.displayName,
        locale: input.locale,
        status: 'in_progress',
        consent: input.consent,
        turns: [first],
        followUpsAsked: 0,
        summary: null,
        patientComment: null,
        createdAt,
        updatedAt: createdAt,
        sharedAt: null,
        rawChatDeleteAt: computeRawChatDeleteAt(input.appointmentStartIso, opts.retentionDays, createdAt),
        rawChatDeletedAt: null,
        bodyPainMap: null,
      };
      sessions.set(session.id, session);
      answers.set(session.id, {});
      return { session, firstMessage: first };
    },

    async sendMessage(sessionId: string, text: string): Promise<SendMessageResult> {
      await wait();
      const s = get(sessionId);
      if (s.status !== 'in_progress') throw new Error('intake_not_in_progress');
      const clean = String(text ?? '').trim().slice(0, PRE_VISIT_INTAKE_CONFIG.MAX_MESSAGE_LENGTH);
      if (!clean) throw new Error('empty_message');
      const patientTurn = turn('patient', clean);
      const a = answers.get(sessionId) ?? {};
      const currentKey = MOCK_QUESTION_KEYS[s.followUpsAsked];
      if (currentKey && a[currentKey] === undefined) a[currentKey] = clean;
      answers.set(sessionId, a);
      const nextIndex = s.followUpsAsked + 1;
      const done = nextIndex >= MOCK_QUESTION_KEYS.length || nextIndex > PRE_VISIT_INTAKE_CONFIG.MAX_FOLLOW_UPS;
      const reply = done ? null : turn('assistant', opts.translateQuestion(MOCK_QUESTION_KEYS[nextIndex], s.locale));
      save({
        ...s,
        turns: [...s.turns, patientTurn, ...(reply ? [reply] : [])],
        followUpsAsked: done ? s.followUpsAsked : nextIndex,
      });
      return { patientTurn, reply, done };
    },

    async getSummary(sessionId: string): Promise<IntakeSummary> {
      await wait();
      const s = get(sessionId);
      if (s.status === 'discarded') throw new Error('intake_discarded');
      if (s.summary && s.status !== 'in_progress') return s.summary;
      const summary: IntakeSummary = {
        ...buildDescriptiveSummary(answers.get(sessionId) ?? {}, s.locale, now().toISOString()),
        // Copied verbatim from what the patient marked; the mock never rewrites or interprets it.
        bodyPainMap: s.bodyPainMap ?? null,
      };
      save({ ...s, summary, status: 'awaiting_confirmation' });
      return summary;
    },

    async addComment(sessionId: string, comment: string) {
      await wait();
      const s = get(sessionId);
      if (s.status !== 'awaiting_confirmation') throw new Error('comment_locked');
      const c = String(comment ?? '').trim().slice(0, PRE_VISIT_INTAKE_CONFIG.MAX_COMMENT_LENGTH);
      return save({ ...s, patientComment: c || null });
    },

    async confirmAndShare(sessionId: string) {
      await wait();
      const s = get(sessionId);
      if (s.status !== 'awaiting_confirmation' || !s.summary) throw new Error('summary_not_ready');
      return save({ ...s, status: 'confirmed', sharedAt: now().toISOString() });
    },

    async discard(sessionId: string) {
      await wait();
      const s = get(sessionId);
      if (s.status === 'confirmed') throw new Error('already_shared');
      // Nothing was sent: drop the draft completely.
      sessions.delete(sessionId);
      answers.delete(sessionId);
    },

    async deleteChat(sessionId: string) {
      await wait();
      const s = get(sessionId);
      if (s.status !== 'confirmed') throw new Error('use_discard_for_unsent');
      answers.delete(sessionId);
      return save({ ...s, turns: [], rawChatDeletedAt: s.rawChatDeletedAt ?? now().toISOString() });
    },

    async submitBodyPainMap(sessionId: string, payload: BodyPainMapPayload | null) {
      await wait();
      const s = get(sessionId);
      if (s.status !== 'in_progress') throw new Error('body_map_locked');
      return save({ ...s, bodyPainMap: parseBodyPainMapPayload(payload) });
    },

    async listSessionsForAppointment(appointmentId: string) {
      await wait();
      purgeExpired();
      return Array.from(sessions.values())
        .filter((s) => s.appointmentId === appointmentId && s.status === 'confirmed')
        .sort((x, y) => (y.sharedAt ?? '').localeCompare(x.sharedAt ?? ''));
    },
  };
}
