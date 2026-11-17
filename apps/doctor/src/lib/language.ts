/**
 * The doctor app speaks exactly two languages: Spanish and English.
 * Everything language-related (picker, device detection, fallback chain, API headers,
 * date formatting) goes through this module so the two can never drift apart.
 */
export type AppLanguage = 'en' | 'es';

export const APP_LANGUAGES: readonly AppLanguage[] = ['es', 'en'] as const;
export const DEFAULT_APP_LANGUAGE: AppLanguage = 'es';

/** 'en-US', 'EN', 'es_MX' → 'en' | 'es'. Anything else (fr, de, pt, zh, garbage) → null. */
export function parseAppLanguage(raw: unknown): AppLanguage | null {
  if (typeof raw !== 'string') return null;
  const base = raw.trim().toLowerCase().split(/[-_]/)[0];
  return base === 'en' || base === 'es' ? base : null;
}

/** Same as parseAppLanguage but never null: unsupported device languages fall back to Spanish. */
export function normalizeAppLanguage(raw: unknown): AppLanguage {
  return parseAppLanguage(raw) || DEFAULT_APP_LANGUAGE;
}

/** Initial UI language from the device language code (e.g. Localization.getLocales()[0].languageCode). */
export function resolveInitialLanguage(deviceLanguageCode: unknown): AppLanguage {
  return normalizeAppLanguage(deviceLanguageCode);
}

/** BCP-47 locale for Intl / toLocale*String. */
export function uiLocale(lang: unknown): 'en-US' | 'es-MX' {
  return normalizeAppLanguage(lang) === 'en' ? 'en-US' : 'es-MX';
}
