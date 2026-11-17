// Language selection is independent from region.
// - The user's saved language (AURIC_LANG) always wins.
// - First launch: derive from the device locale (es* -> es, otherwise en).
// - Region (MX/US) never changes the language; it only drives region features.

export const SUPPORTED_LANGUAGES = ['en', 'es', 'zh', 'pt', 'fr', 'de'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

type LocaleLike = { languageCode?: string | null; languageTag?: string | null } | string | null | undefined;

export function normalizeLanguage(value: unknown): SupportedLanguage | null {
  if (typeof value !== 'string') return null;
  const base = value.trim().toLowerCase().replace('_', '-').split('-')[0];
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(base) ? (base as SupportedLanguage) : null;
}

/** First launch default: Spanish-language devices get es, everything else gets en. */
export function languageFromDeviceLocales(locales: LocaleLike[] | null | undefined): 'en' | 'es' {
  const first = Array.isArray(locales) ? locales[0] : null;
  const code = typeof first === 'string' ? first : first?.languageCode || first?.languageTag || '';
  return String(code).toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function readDeviceLocales(): LocaleLike[] {
  try {
    const mod = require('expo-localization');
    const locales = mod.getLocales?.();
    if (Array.isArray(locales) && locales.length) return locales;
    if (mod.locale) return [mod.locale];
  } catch {
    // Native module unavailable: fall through to Intl.
  }
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale;
    if (tag) return [tag];
  } catch {}
  return [];
}

export function resolveInitialLanguage(savedLanguage: string | null | undefined, locales: LocaleLike[] | null | undefined): SupportedLanguage {
  return normalizeLanguage(savedLanguage) || languageFromDeviceLocales(locales);
}
