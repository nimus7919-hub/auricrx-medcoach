/**
 * Error mapping: raw Firebase / server / network errors never reach an Alert.
 * Every failure is turned into a stable code, and the code into an `errors.<code>` string in the
 * active language (EN or ES). Unknown codes use the caller's contextual fallback key.
 */

/** Thrown by the doctor API client; `message` stays the machine code for legacy callers. */
export class DoctorApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  constructor(code: string, status: number, details?: unknown) {
    super(code);
    this.name = 'DoctorApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/** 'auth/invalid-credential' → 'auth_invalid_credential'; 'request_failed_500' → 'request_failed'. */
export function normalizeErrorCode(raw: string): string {
  const base = String(raw)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base.replace(/^(request_failed|recovery_generate_failed|recovery_redeem_failed|doctor_language_failed)_\d+$/, '$1');
}

/** Pulls a stable code out of whatever was thrown. Returns null when nothing recognisable is found. */
export function extractErrorCode(error: unknown): string | null {
  if (error == null) return null;
  if (typeof error === 'string') return looksLikeCode(error) ? normalizeErrorCode(error) : null;
  const e = error as { code?: unknown; message?: unknown; name?: unknown };
  if (typeof e.code === 'string' && e.code) return normalizeErrorCode(e.code);
  const msg = typeof e.message === 'string' ? e.message : '';
  // "Firebase: Error (auth/invalid-credential)."
  const fb = msg.match(/\((auth\/[a-z0-9-]+)\)/i);
  if (fb) return normalizeErrorCode(fb[1]);
  if (/network request failed|failed to fetch|network error|timed out|timeout/i.test(msg)) return 'network_error';
  if (looksLikeCode(msg)) return normalizeErrorCode(msg);
  return null;
}

function looksLikeCode(s: string): boolean {
  return /^[a-z][a-z0-9_]*$/i.test(s.trim()) && s.trim().length <= 64;
}

type TFn = (key: string, opts?: Record<string, unknown>) => string;

/**
 * Localized, user-safe text for any thrown value. Never returns `error.message`.
 * `fallbackKey` is the screen's own "could not do X" string (defaults to the generic one).
 */
export function localizeError(error: unknown, t: TFn, fallbackKey = 'errors.generic'): string {
  const code = extractErrorCode(error);
  if (code) {
    const text = t(`errors.${code}`, { defaultValue: '' });
    if (text) return text;
  }
  return t(fallbackKey, { defaultValue: '' }) || t('errors.generic');
}
