import { DEFAULT_APP_LANGUAGE, normalizeAppLanguage, type AppLanguage } from './language';

/**
 * The in-app language, readable from non-React code (API clients). App.tsx keeps it in sync with
 * i18next; services use it for Accept-Language, ?lang= and locale-dependent copy.
 */
let current: AppLanguage = DEFAULT_APP_LANGUAGE;

export function setCurrentLanguage(lang: unknown): AppLanguage {
  current = normalizeAppLanguage(lang);
  return current;
}

export function getCurrentLanguage(): AppLanguage {
  return current;
}
