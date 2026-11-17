/**
 * Language handling for the patient-facing AI endpoints (/ask, /ask-stream, /api/ai/drug-interactions)
 * and machine-readable error bodies.
 *
 * The patient app ships six UI languages (en, es, de, fr, pt, zh) and sends the active one as `language`.
 * Only an explicit, supported body `language` forces the answer language. Old clients (1.0.0) send none:
 * the AI endpoints then tell the model to answer in the language of the user's own message, and /ask keeps
 * its old message-based guess. The Accept-Language header is deliberately NOT used: iOS adds the device
 * locale automatically, which can differ from the in-app language, so it would be misleading.
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

/** First supported language among the candidates (e.g. body.language, userData.language), else null. */
function explicitAiLanguage(...candidates) {
  for (const candidate of candidates) {
    const lang = normalizeAiLanguage(candidate);
    if (lang) return lang;
  }
  return null;
}

/** The old /ask heuristic for clients that send no language: Spanish keywords -> 'es', otherwise 'en'. */
function guessMessageLanguage(message) {
  return /\b(hola|dolor|medicamento|no puedo|sobredosis|quiero morir)\b/i.test(String(message || '')) ? 'es' : 'en';
}

/**
 * Server-owned system policy for health answers. Guardrails (not a doctor, no diagnosis, no starting /
 * stopping / changing medicines or doses, encourage a licensed professional, emergency -> 911, only use
 * information actually provided) are unchanged; the answer language is now explicit.
 */
function healthSafetyPrompt(language) {
  const forced = AI_LANGUAGES.includes(language) ? LANGUAGE_NAMES[language] : null;
  const guardrails = 'You are a general health-information assistant, not a doctor. Do not diagnose, name likely conditions, or tell users to start, stop or change medicines or doses. Encourage consulting a licensed professional. If emergency signs appear, tell the user to call 911. Use only information actually provided in the conversation.';
  if (forced) {
    return [
      guardrails,
      `LANGUAGE: The app language is ${forced}. Write your entire answer in ${forced}, including every disclaimer, warning, severity label and summary, even if the conversation or the item names are in another language. Keep drug and supplement names as provided. If the user asks for JSON, keep the JSON keys exactly as requested and write every value in ${forced}.`,
      `Whenever the answer mentions medicines or supplements, include a short reminder in ${forced} that the information is educational and that a doctor or pharmacist should be consulted.`,
    ].join('\n');
  }
  // No explicit app language (older clients): mirror the user's own language instead of forcing one.
  const mirror = "the same language the user's own messages are written in (not the language of these instructions)";
  return [
    guardrails,
    `LANGUAGE: Write your entire answer in ${mirror}, including every disclaimer, warning, severity label and summary, even if item names are in another language. If the user's language is unclear, use Spanish. Keep drug and supplement names as provided. If the user asks for JSON, keep the JSON keys exactly as requested and write every value in that language.`,
    `Whenever the answer mentions medicines or supplements, include a short reminder in ${mirror} that the information is educational and that a doctor or pharmacist should be consulted.`,
  ].join('\n');
}

/**
 * DEPRECATED English text kept ONLY in the legacy `message` field. Old clients (1.0.0) display
 * `result.message || result.error`. New clients must key off `code` (or the HTTP status) and never show
 * `message`. Remove together with 1.0.0 support.
 */
const LEGACY_MESSAGES = {
  AI_UNAVAILABLE: 'AI is unavailable right now. Please try again later.',
  RATE_LIMITED: 'Too many requests, please slow down.',
  SUBSCRIPTION_EXPIRED: 'Your subscription has expired. Please upgrade to continue.',
  ACCOUNT_DELETED: 'Your account has been deleted after grace period.',
  INVALID_TOKEN: 'Invalid or expired authentication token.',
  UPGRADE_REQUIRED: 'This feature requires an active subscription.',
};

/**
 * Machine-readable error body. `code` is the stable contract; `error` repeats it so clients that test
 * `data.error` keep working and is never prose. `message` is the deprecated legacy text above (only for
 * codes old clients already received a message for). Never put provider messages or stack text in here.
 */
function errorBody(code, extra = {}) {
  const body = { ok: false, code, error: code };
  if (LEGACY_MESSAGES[code]) body.message = LEGACY_MESSAGES[code];
  return { ...body, ...extra };
}

module.exports = {
  AI_LANGUAGES,
  AI_DEFAULT_LANGUAGE,
  LANGUAGE_NAMES,
  normalizeAiLanguage,
  explicitAiLanguage,
  guessMessageLanguage,
  LEGACY_MESSAGES,
  healthSafetyPrompt,
  errorBody,
};
