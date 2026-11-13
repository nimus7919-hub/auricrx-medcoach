/**
 * Map technical/network/auth failures to friendly, translated user messages.
 * Raw status codes, tokens, stacks, and server bodies stay in console only.
 */
import uiI18n from '../i18n';

export const ERROR_CATEGORY = {
  NOT_SIGNED_IN: 'notSignedIn',
  SESSION_EXPIRED: 'sessionExpired',
  NO_CONNECTION: 'noConnection',
  SERVER_UNAVAILABLE: 'serverUnavailable',
  GENERIC: 'generic',
};

const STATUS_CODE_RE = /\b(401|403|404|408|429|500|502|503|504)\b/;
const HTTP_STATUS_RE = /(?:status\s*code|http)\s*[:=]?\s*(\d{3})\b/i;
const REQUEST_FAILED_RE = /request failed with status code\s*(\d{3})/i;
const INVALID_TOKEN_RE = /invalid token|no token provided|token expired|id[- ]?token|jwt|unauthoriz|forbidden|not authenticated|auth\/id-token/i;
const NETWORK_RE = /network\s*request\s*failed|failed to fetch|network error|timeout|timed out|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|abort|offline|no internet|connection/i;
const SERVER_RE = /server error|internal server|bad gateway|service unavailable|temporarily unavailable|subscription_check_failed|sync failed|non-?json/i;

function extractStatus(error) {
  if (error == null) return null;
  if (typeof error === 'number' && error >= 100 && error < 600) return error;
  if (typeof error?.status === 'number') return error.status;
  if (typeof error?.statusCode === 'number') return error.statusCode;
  if (typeof error?.response?.status === 'number') return error.response.status;
  const text = String(error?.message || error || '');
  const fromRequest = text.match(REQUEST_FAILED_RE);
  if (fromRequest) return Number(fromRequest[1]);
  const fromHttp = text.match(HTTP_STATUS_RE);
  if (fromHttp) return Number(fromHttp[1]);
  const bare = text.match(STATUS_CODE_RE);
  if (bare && /status|http|error|failed|code/i.test(text)) return Number(bare[1]);
  return null;
}

function collectText(error) {
  if (error == null) return '';
  if (typeof error === 'string') return error;
  const parts = [
    error.message,
    error.code,
    error.error,
    error.reason,
    error.name,
    typeof error === 'object' ? JSON.stringify(error).slice(0, 400) : '',
  ];
  return parts.filter(Boolean).join(' ');
}

/**
 * @returns {keyof typeof ERROR_CATEGORY extends string ? string : never}
 */
export function categorizeError(error) {
  if (error?.category && Object.values(ERROR_CATEGORY).includes(error.category)) {
    return error.category;
  }
  if (error?.isSessionExpired || error?.code === 'SESSION_EXPIRED') {
    return ERROR_CATEGORY.SESSION_EXPIRED;
  }
  if (error?.isAuthRequired || error?.code === 'NOT_SIGNED_IN' || error?.code === 'auth/not-authenticated') {
    return ERROR_CATEGORY.NOT_SIGNED_IN;
  }

  const status = extractStatus(error);
  const text = collectText(error);

  if (status === 401 || status === 403) {
    return ERROR_CATEGORY.SESSION_EXPIRED;
  }
  if (INVALID_TOKEN_RE.test(text) || /auth\/user-token-expired|auth\/id-token-expired|auth\/invalid-user-token/i.test(text)) {
    return ERROR_CATEGORY.SESSION_EXPIRED;
  }
  if (/not authenticated|please sign in|no current user|signed out/i.test(text)) {
    return ERROR_CATEGORY.NOT_SIGNED_IN;
  }
  if (status === 408 || status === 0 || NETWORK_RE.test(text)) {
    return ERROR_CATEGORY.NO_CONNECTION;
  }
  if ((status != null && status >= 500) || status === 429 || SERVER_RE.test(text)) {
    return ERROR_CATEGORY.SERVER_UNAVAILABLE;
  }
  if (STATUS_CODE_RE.test(text) || REQUEST_FAILED_RE.test(text) || /stack|exception|TypeError|ReferenceError/i.test(text)) {
    return ERROR_CATEGORY.GENERIC;
  }
  return ERROR_CATEGORY.GENERIC;
}

export function getUserFacingMessage(error, t = (...args) => uiI18n.t(...args)) {
  const category = categorizeError(error);
  const key = `errors.${category}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;
  return t('errors.generic');
}

/** True when the technical text looks unsafe to show to users. */
export function looksTechnical(text) {
  if (!text || typeof text !== 'string') return true;
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (STATUS_CODE_RE.test(trimmed)) return true;
  if (REQUEST_FAILED_RE.test(trimmed)) return true;
  if (HTTP_STATUS_RE.test(trimmed)) return true;
  if (INVALID_TOKEN_RE.test(trimmed)) return true;
  if (/^\s*Error:/i.test(trimmed)) return true;
  if (/at\s+\S+\s*\(/.test(trimmed)) return true; // stack frame
  if (/[{}\[\]]/.test(trimmed) && /"?(status|error|message|code)"?\s*:/.test(trimmed)) return true;
  return false;
}

/**
 * Prefer an already-friendly translated message; otherwise map by category.
 * Never returns status codes / token text.
 */
export function toUserFacingError(error, fallbackKey = 'errors.generic', t = (...args) => uiI18n.t(...args)) {
  const candidate =
    (typeof error === 'string' && error) ||
    (typeof error?.userMessage === 'string' && error.userMessage) ||
    (typeof error?.friendlyMessage === 'string' && error.friendlyMessage) ||
    null;

  if (candidate && !looksTechnical(candidate)) {
    // Already a product string (often from i18n) — keep it.
    if (!STATUS_CODE_RE.test(candidate) && !INVALID_TOKEN_RE.test(candidate)) {
      return candidate;
    }
  }

  const mapped = getUserFacingMessage(error, t);
  if (mapped) return mapped;
  const fallback = t(fallbackKey);
  return fallback && fallback !== fallbackKey ? fallback : t('errors.generic');
}

export function createUserFacingError(category, detailsForLog) {
  const message = getUserFacingMessage({ category });
  const err = new Error(message);
  err.category = category;
  err.userMessage = message;
  if (category === ERROR_CATEGORY.SESSION_EXPIRED) {
    err.isSessionExpired = true;
    err.code = 'SESSION_EXPIRED';
  }
  if (category === ERROR_CATEGORY.NOT_SIGNED_IN) {
    err.isAuthRequired = true;
    err.code = 'NOT_SIGNED_IN';
  }
  if (detailsForLog != null) {
    console.warn('[userFacingError]', category, detailsForLog);
  }
  return err;
}

export function logTechnicalError(context, error) {
  try {
    const status = extractStatus(error);
    console.warn(`[${context}]`, {
      status,
      category: categorizeError(error),
      message: error?.message || String(error),
      code: error?.code,
    });
  } catch (logError) {
    console.warn(`[${context}] failed to log error`, logError);
  }
}
