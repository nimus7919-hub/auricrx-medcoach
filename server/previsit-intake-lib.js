/**
 * Pre-visit intake library: retention, fixed questions, schema validation,
 * banned-term / condition / advice filter, verbatim template fallback,
 * and the interviewer provider abstraction (mock default, optional OpenAI).
 *
 * Never logs secret values.
 */

const crypto = require('crypto');
const {
  RAW_CHAT_RETENTION_DAYS_AFTER_APPOINTMENT,
  MAX_FOLLOW_UPS,
  MAX_MESSAGE_LENGTH,
} = require('./previsit-intake-config');

const DAY_MS = 24 * 60 * 60 * 1000;

const QUESTION_KEYS = [
  'mainConcern',
  'location',
  'duration',
  'severity',
  'character',
  'betterWorse',
  'otherSensations',
  'medicinesMentioned',
  'questionsForDoctor',
];

const QUESTIONS = {
  en: {
    mainConcern: 'In your own words, what would you like your doctor to know about this visit?',
    location: 'Where do you notice it, if that applies to you?',
    duration: 'How long has this been going on?',
    severity: "If you'd like, on a scale from 1 to 10, what number would you give it?",
    character: 'How would you describe the feeling, in your own words?',
    betterWorse: 'Have you noticed anything that makes it better or worse?',
    otherSensations: "Is there anything else you've noticed that you'd like to mention?",
    medicinesMentioned: 'Are there any medicines, supplements or allergies you want your doctor to know about?',
    questionsForDoctor: 'Is there anything you want to ask your doctor?',
  },
  es: {
    mainConcern: 'Con tus propias palabras, ¿qué te gustaría que tu médico supiera sobre esta consulta?',
    location: '¿En qué parte lo notas, si aplica?',
    duration: '¿Desde hace cuánto tiempo pasa esto?',
    severity: 'Si quieres, en una escala del 1 al 10, ¿qué número le darías?',
    character: '¿Cómo describirías la sensación, con tus propias palabras?',
    betterWorse: '¿Has notado algo que lo haga sentir mejor o peor?',
    otherSensations: '¿Hay algo más que hayas notado y quieras mencionar?',
    medicinesMentioned: '¿Hay medicamentos, suplementos o alergias que quieras que tu médico sepa?',
    questionsForDoctor: '¿Hay algo que quieras preguntarle a tu médico?',
  },
};

const PRE_VISIT_INTAKE_PROMPT_VERSION = '2026-11-14.1';

const PRE_VISIT_INTAKE_RULES = [
  'You are a descriptive pre-visit interviewer for AuricRX. You only help the patient describe, in their own words, why they are seeing their doctor.',
  "Use the patient's language (English or Spanish, from the app locale). Ask one short question at a time.",
  'Allowed question types only: main concern; location; duration; patient-reported severity from 1 to 10; character of the sensation; what the patient says makes it better or worse; other sensations the patient has noticed; medicines, supplements or allergies the patient mentions; questions the patient wants to ask the doctor.',
  'Ask at most 8 follow-up questions after the opening question. Stop early if the patient says they are done.',
  'DO NOT diagnose, name, guess or suggest any condition or disease, and do not offer a differential, including casual labels.',
  'DO NOT screen for red flags or warning signs (datos de alarma), and never state that none are present.',
  'DO NOT triage, rank urgency, estimate seriousness, or produce any risk or urgency score.',
  'DO NOT interpret answers ("this sounds like", "consistent with", "getting worse", "likely", "could be").',
  'DO NOT give treatment, medication, dose, home-remedy, or "you should take / you should go to" advice.',
  'DO NOT produce emergency warnings based on what the patient wrote. A static emergency notice is already shown by the app to every patient.',
  'Severity is recorded only as the number the patient said (e.g. "Patient said 6 / 10"). It is never a score.',
  'The summary uses ONLY the patient\'s own words, organized into the fixed fields: mainConcern, location, duration, severityReported, alsoMentioned, questionsForDoctor. If a field was not discussed, return null ("Not mentioned"). Never fill gaps.',
  'Return JSON matching the fixed schema (next question OR summary fields). No free-form clinical prose.',
];

function buildPreVisitIntakeSystemPrompt(locale) {
  const language = locale === 'es' ? 'Spanish (Mexico)' : 'English';
  return [
    ...PRE_VISIT_INTAKE_RULES.map((rule, i) => `${i + 1}. ${rule}`),
    `Conversation language: ${language}.`,
  ].join('\n');
}

function validDays(days) {
  if (!Number.isFinite(days) || days < 0) throw new Error('invalid_retention_days');
  return Math.floor(days);
}

function computeRawChatDeleteAt(
  appointmentStartIso,
  retentionDays = RAW_CHAT_RETENTION_DAYS_AFTER_APPOINTMENT,
  fallbackIso = new Date().toISOString()
) {
  const days = validDays(retentionDays);
  let base = Date.parse(appointmentStartIso);
  if (Number.isNaN(base)) base = Date.parse(fallbackIso);
  if (Number.isNaN(base)) throw new Error('invalid_retention_base');
  return new Date(base + days * DAY_MS).toISOString();
}

function isRawChatExpired(rawChatDeleteAt, now = new Date()) {
  const t = Date.parse(rawChatDeleteAt);
  if (Number.isNaN(t)) return true;
  return now.getTime() >= t;
}

const { BANNED: BASE_BANNED } = require('./doctor-ai-summary-lib');

/** Extra phrases for this feature (condition-naming, red-flag, advice), EN + ES. */
const INTAKE_EXTRA_BANNED = {
  en: [
    'red flag',
    'red flags',
    'warning signs',
    'warning sign',
    'likely',
    'consistent with',
    'could be',
    'might be',
    'differential',
    'dyspepsia',
    'gastritis',
    'this is likely',
    'take an antacid',
    'take antacid',
    'you should take',
    'you should go',
    'not urgent',
    'no warning signs',
    'no red flags',
  ],
  es: [
    'datos de alarma',
    'dato de alarma',
    'bandera roja',
    'banderas rojas',
    'parece',
    'compatible con',
    'podría ser',
    'podria ser',
    'diferencial',
    'dispepsia',
    'gastritis',
    'tome un antiacido',
    'tome un antiácido',
    'debe tomar',
    'sin datos de alarma',
    'no es urgente',
  ],
};

function normalizeForBanCheck(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function allBannedTerms() {
  return [...BASE_BANNED.en, ...BASE_BANNED.es, ...INTAKE_EXTRA_BANNED.en, ...INTAKE_EXTRA_BANNED.es];
}

function findIntakeBannedTerms(text) {
  const normalized = normalizeForBanCheck(text);
  if (!normalized.trim()) return [];
  const found = new Set();
  const sorted = allBannedTerms().sort((a, b) => b.length - a.length);
  for (const term of sorted) {
    const needle = normalizeForBanCheck(term);
    if (!needle) continue;
    if (needle.includes(' ')) {
      if (normalized.includes(needle)) found.add(term);
    } else {
      const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}(?:[^a-z0-9]|$)`, 'i');
      if (re.test(normalized)) found.add(term);
    }
  }
  return [...found];
}

const NONE_ANSWERS = new Set([
  'no', 'none', 'nothing', 'nope', 'n/a', 'na',
  'ninguna', 'ninguno', 'nada', 'no tengo', 'no sé', 'no se',
  "i don't know", 'idk',
]);

function isNoneAnswer(text) {
  return NONE_ANSWERS.has(String(text).trim().toLowerCase().replace(/[.!¡¿?]+$/g, ''));
}

/** Only accept a bare patient-stated number 1–10. Never inferred. */
function parseReportedSeverity(text) {
  const m = String(text).match(/\b(10|[1-9])(?:\s*(?:\/|de|of|out of)\s*10)?\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 10 ? n : null;
}

function keepAnswer(v) {
  return v && !isNoneAnswer(v) ? String(v).trim() : null;
}

function buildDescriptiveSummary(answers, locale, generatedAt) {
  const also = [];
  let severityReported = null;
  if (answers.severity) {
    severityReported = parseReportedSeverity(answers.severity);
    if (severityReported === null && keepAnswer(answers.severity)) also.push(answers.severity.trim());
  }
  for (const k of ['character', 'betterWorse', 'otherSensations', 'medicinesMentioned']) {
    const v = keepAnswer(answers[k]);
    if (v) also.push(v);
  }
  const q = keepAnswer(answers.questionsForDoctor);
  return {
    mainConcern: keepAnswer(answers.mainConcern),
    location: keepAnswer(answers.location),
    duration: keepAnswer(answers.duration),
    severityReported,
    alsoMentioned: also,
    questionsForDoctor: q ? [q] : [],
    locale: locale === 'es' ? 'es' : 'en',
    generatedAt,
  };
}

function answersFromTurns(turns) {
  const answers = {};
  const patientTurns = (turns || []).filter((t) => t.role === 'patient');
  patientTurns.forEach((t, i) => {
    const key = QUESTION_KEYS[i];
    if (key && answers[key] === undefined) answers[key] = t.text;
  });
  return answers;
}

function buildVerbatimTemplateSummary(turnsOrAnswers, locale, generatedAt) {
  const answers = Array.isArray(turnsOrAnswers)
    ? answersFromTurns(turnsOrAnswers)
    : turnsOrAnswers || {};
  return buildDescriptiveSummary(answers, locale, generatedAt);
}

function asNullableString(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function asStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v).trim()).filter(Boolean);
}

function asSeverity(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 10) return null;
  return n;
}

function validateSummaryShape(raw, locale, generatedAt) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    mainConcern: asNullableString(src.mainConcern),
    location: asNullableString(src.location),
    duration: asNullableString(src.duration),
    severityReported: asSeverity(src.severityReported),
    alsoMentioned: asStringArray(src.alsoMentioned),
    questionsForDoctor: asStringArray(src.questionsForDoctor),
    locale: locale === 'es' ? 'es' : 'en',
    generatedAt: generatedAt || (typeof src.generatedAt === 'string' ? src.generatedAt : new Date().toISOString()),
  };
}

function summaryTextForFilter(summary) {
  if (!summary) return '';
  return [
    summary.mainConcern,
    summary.location,
    summary.duration,
    ...(summary.alsoMentioned || []),
    ...(summary.questionsForDoctor || []),
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Filter model-produced text (a question or a summary). Returns
 * { ok, bannedMatches }. Does not rewrite.
 */
function filterModelText(text) {
  const bannedMatches = findIntakeBannedTerms(text);
  return { ok: bannedMatches.length === 0, bannedMatches };
}

function filterSummary(summary, turns, locale, generatedAt) {
  const shaped = validateSummaryShape(summary, locale, generatedAt);
  const { ok, bannedMatches } = filterModelText(summaryTextForFilter(shaped));
  if (!ok) {
    return {
      ok: false,
      summary: buildVerbatimTemplateSummary(turns, locale, shaped.generatedAt),
      source: 'template',
      bannedMatches,
    };
  }
  return { ok: true, summary: shaped, source: 'ai', bannedMatches: [] };
}

function questionFor(key, locale) {
  const loc = locale === 'es' ? 'es' : 'en';
  return QUESTIONS[loc][key];
}

function nextQuestionFor(followUpsAsked, locale) {
  const key = QUESTION_KEYS[followUpsAsked];
  return key ? questionFor(key, locale) : null;
}

function isInterviewDone(followUpsAskedAfterAnswer) {
  return followUpsAskedAfterAnswer >= QUESTION_KEYS.length || followUpsAskedAfterAnswer > MAX_FOLLOW_UPS;
}

function newId(prefix) {
  const rand = crypto.randomBytes(8).toString('hex');
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

function trimMessage(text) {
  return String(text ?? '').trim().slice(0, MAX_MESSAGE_LENGTH);
}

/**
 * MOCK interviewer — default provider. Fixed allowed questions; verbatim summary.
 * Never rewrites, labels, or interprets the patient's words.
 */
function createMockProvider() {
  return {
    name: 'mock',
    async nextTurn({ locale, followUpsAsked }) {
      const key = QUESTION_KEYS[followUpsAsked];
      if (!key) return { question: null, done: true, source: 'mock' };
      const text = questionFor(key, locale);
      const filtered = filterModelText(text);
      if (!filtered.ok) return { question: null, done: true, source: 'template', bannedMatches: filtered.bannedMatches };
      return { question: text, done: false, source: 'mock' };
    },
    async summarize({ answers, turns, locale, generatedAt }) {
      const summary = buildDescriptiveSummary(answers || answersFromTurns(turns), locale, generatedAt);
      return filterSummary(summary, turns, locale, generatedAt);
    },
  };
}

/**
 * Optional OpenAI provider. Used only when PREVISIT_INTAKE_PROVIDER=openai and a key
 * is present (OPENAI_API_KEY or DOCTOR_AI_API_KEY). On any failure, callers fall back
 * to the mock / verbatim template. Never logs the key.
 */
function hasOpenAiKey(env = process.env) {
  return Boolean(env.OPENAI_API_KEY || env.DOCTOR_AI_API_KEY);
}

function createOpenAiProvider({ fetchImpl, env = process.env } = {}) {
  const key = env.OPENAI_API_KEY || env.DOCTOR_AI_API_KEY;
  const model = env.PREVISIT_INTAKE_MODEL || env.DOCTOR_AI_SUMMARY_MODEL || 'gpt-4o-mini';
  const fetchFn = fetchImpl || fetch;

  async function callModel({ messages, locale }) {
    if (!key) return null;
    const res = await fetchFn('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildPreVisitIntakeSystemPrompt(locale) },
          ...messages,
        ],
      }),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => ({}));
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return null;
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  return {
    name: 'openai',
    async nextTurn({ locale, followUpsAsked, turns }) {
      try {
        const history = (turns || []).map((t) => ({
          role: t.role === 'assistant' ? 'assistant' : 'user',
          content: t.text,
        }));
        const parsed = await callModel({
          locale,
          messages: [
            ...history,
            {
              role: 'user',
              content: `Return JSON with keys nextQuestion (string or null) and done (boolean). followUpsAsked so far (not counting the opening question budget remainder): ${followUpsAsked}.`,
            },
          ],
        });
        const text = parsed && typeof parsed.nextQuestion === 'string' ? parsed.nextQuestion.trim() : '';
        const done = !text || parsed?.done === true || isInterviewDone(followUpsAsked + 1);
        if (!text || done) return { question: null, done: true, source: 'openai' };
        const filtered = filterModelText(text);
        if (!filtered.ok) {
          // Fall back to the next allowed fixed question rather than leaking a bad question.
          const fallback = nextQuestionFor(followUpsAsked, locale);
          return { question: fallback, done: !fallback, source: 'template', bannedMatches: filtered.bannedMatches };
        }
        return { question: text, done: false, source: 'openai' };
      } catch {
        const fallback = nextQuestionFor(followUpsAsked, locale);
        return { question: fallback, done: !fallback, source: 'mock' };
      }
    },
    async summarize({ answers, turns, locale, generatedAt }) {
      try {
        const transcript = (turns || [])
          .map((t) => `${t.role}: ${t.text}`)
          .join('\n');
        const parsed = await callModel({
          locale,
          messages: [
            {
              role: 'user',
              content: `Build the fixed-field summary from this interview. Use only the patient's words. Transcript:\n${transcript}`,
            },
          ],
        });
        const raw = parsed?.summary && typeof parsed.summary === 'object' ? parsed.summary : parsed;
        return filterSummary(raw, turns || answers, locale, generatedAt);
      } catch {
        return {
          ok: false,
          summary: buildVerbatimTemplateSummary(turns || answers, locale, generatedAt),
          source: 'template',
          bannedMatches: [],
        };
      }
    },
  };
}

function createProvider({ name, fetchImpl, env = process.env } = {}) {
  if (name === 'openai' && hasOpenAiKey(env)) {
    return createOpenAiProvider({ fetchImpl, env });
  }
  return createMockProvider();
}

function genericIntakePushCopy(language = 'es') {
  const es = language === 'es' || language === 'es-MX';
  if (es) {
    return { title: 'AuricRX', body: 'Tiene una entrevista previa a la consulta. Abra la app para ver el detalle.' };
  }
  return { title: 'AuricRX', body: 'You have a new pre-visit intake. Open the app for details.' };
}

module.exports = {
  QUESTION_KEYS,
  QUESTIONS,
  PRE_VISIT_INTAKE_PROMPT_VERSION,
  PRE_VISIT_INTAKE_RULES,
  buildPreVisitIntakeSystemPrompt,
  computeRawChatDeleteAt,
  isRawChatExpired,
  findIntakeBannedTerms,
  parseReportedSeverity,
  buildDescriptiveSummary,
  buildVerbatimTemplateSummary,
  answersFromTurns,
  validateSummaryShape,
  filterModelText,
  filterSummary,
  questionFor,
  nextQuestionFor,
  isInterviewDone,
  newId,
  trimMessage,
  createMockProvider,
  createOpenAiProvider,
  createProvider,
  hasOpenAiKey,
  genericIntakePushCopy,
  INTAKE_EXTRA_BANNED,
};
