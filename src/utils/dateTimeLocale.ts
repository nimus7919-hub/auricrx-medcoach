import i18n from '../i18n';

const LOCALE_MAP: Record<string, string> = {
  es: 'es-MX',
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-BR',
  zh: 'zh-CN',
};

/** BCP-47 locale for DateTimePicker / toLocaleDateString. Spanish uses es-MX. */
export function getDateTimePickerLocale(language?: string): string {
  const lang = (language || i18n.resolvedLanguage || i18n.language || 'es').split('-')[0];
  return LOCALE_MAP[lang] || LOCALE_MAP.es;
}
