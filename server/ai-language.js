/**
 * Language handling for the patient-facing AI endpoints (/ask, /ask-stream, /api/ai/drug-interactions)
 * and machine-readable error bodies.
 *
 * The patient app ships six UI languages (en, es, de, fr, pt, zh) and sends the active one as `language`.
 * Resolution order: body `language` -> Accept-Language header -> "es" (the app default).
 * Unsupported values (e.g. "ja", "*") are skipped, never guessed.
 */

const AI_LANGUAGES = ['en', 'es', 'de', 'fr', 'pt', 'zh'];
const AI_DEFAULT_LANGUAGE = 'es';

const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Mexican Spanish (español de México)',
  de: 'German (Deutsch)',
  fr: 'French (français)',
  pt: 'Portuguese (português)',
  zh: 'Simplified Chinese (简体中文)',
};

/** 'en-US' | 'ES_mx' | 'zh-Hans' -> 'en' | 'es' | 'zh'; anything unsupported -> null. */
function normalizeAiLanguage(raw) {
  if (typeof raw !== 'string') return null;
  const tag = raw.trim().toLowerCase().split(/[;,\s]/)[0];
  const base = tag.split(/[-_]/)[0];
  return AI_LANGUAGES.includes(base) ? base : null;
}

/** First supported language of an Accept-Language header, honouring q-values. */
function languageFromAcceptLanguage(header) {
  if (typeof header !== 'string' || !header.trim()) return null;
  const entries = header.split(',').map((part, index) => {
    const [tag, ...params] = part.trim().split(';');
    const q = params.map(p => /^\s*q\s*=\s*([0-9.]+)\s*$/i.exec(p)).find(Boolean);
    const weight = q ? Number(q[1]) : 1;
    return { tag, weight: Number.isFinite(weight) ? weight : 0, index };
  }).filter(e => e.tag && e.weight > 0);
  entries.sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const e of entries) {
    const lang = normalizeAiLanguage(e.tag);
    if (lang) return lang;
  }
  return null;
}

/**
 * @param {object} req express request (only headers are read)
 * @param {...unknown} explicit candidates in priority order, e.g. body.language, body.userData.language
 */
function resolveAiLanguage(req, ...explicit) {
  for (const candidate of explicit) {
    const lang = normalizeAiLanguage(candidate);
    if (lang) return lang;
  }
  const headers = (req && req.headers) || {};
  return languageFromAcceptLanguage(headers['accept-language']) || AI_DEFAULT_LANGUAGE;
}

/**
 * Server-owned system policy for health answers. Guardrails (not a doctor, no diagnosis, no starting /
 * stopping / changing medicines or doses, encourage a licensed professional, emergency -> 911, only use
 * information actually provided) are unchanged; the answer language is now explicit.
 */
function healthSafetyPrompt(language) {
  const lang = AI_LANGUAGES.includes(language) ? language : AI_DEFAULT_LANGUAGE;
  const name = LANGUAGE_NAMES[lang];
  return [
    'You are a general health-information assistant, not a doctor. Do not diagnose, name likely conditions, or tell users to start, stop or change medicines or doses. Encourage consulting a licensed professional. If emergency signs appear, tell the user to call 911. Use only information actually provided in the conversation.',
    `LANGUAGE: The app language is ${name}. Write your entire answer in ${name}, including every disclaimer, warning, severity label and summary, even if the conversation or the item names are in another language. Keep drug and supplement names as provided. If the user asks for JSON, keep the JSON keys exactly as requested and write every value in ${name}.`,
    `Whenever the answer mentions medicines or supplements, include a short reminder in ${name} that the information is educational and that a doctor or pharmacist should be consulted.`,
  ].join('\n');
}

/**
 * Machine-readable error body. `code` is the stable contract; `error` repeats it so older clients that
 * test `data.error` keep working. Never put English prose, provider messages or stack text in here.
 */
function errorBody(code, extra = {}) {
  return { ok: false, code, error: code, ...extra };
}

module.exports = {
  AI_LANGUAGES,
  AI_DEFAULT_LANGUAGE,
  LANGUAGE_NAMES,
  normalizeAiLanguage,
  languageFromAcceptLanguage,
  resolveAiLanguage,
  healthSafetyPrompt,
  errorBody,
};
