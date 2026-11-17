/**
 * User-facing support / privacy-rights contact addresses.
 * Spanish uses soporte@, Chinese uses zhichi@, all other languages use support@.
 */
export const SUPPORT_EMAIL_ES = 'soporte@auricrx.com.mx';
export const SUPPORT_EMAIL_ZH = 'zhichi@auricrx.com.mx';
export const SUPPORT_EMAIL_DEFAULT = 'support@auricrx.com.mx';
/** Business / partnerships contact. Shown on the Help screen in every language. */
export const BUSINESS_EMAIL = 'admin@auricrx.com.mx';

const KNOWN_SUPPORT_EMAILS = [
  SUPPORT_EMAIL_ES,
  SUPPORT_EMAIL_ZH,
  SUPPORT_EMAIL_DEFAULT,
  'Auricrx.ltd@gmail.com',
];

export const SUPPORT_EMAIL_PATTERN = new RegExp(
  KNOWN_SUPPORT_EMAILS.map((email) => email.replace(/\./g, '\\.')).join('|'),
  'gi',
);

export function getSupportEmail(language?: string | null): string {
  const lang = (language || '').toLowerCase().split(/[-_]/)[0];
  if (lang === 'es') return SUPPORT_EMAIL_ES;
  if (lang === 'zh') return SUPPORT_EMAIL_ZH;
  return SUPPORT_EMAIL_DEFAULT;
}

/** Swap any known contact address in legal/privacy text to the one for `language`. */
export function applySupportEmail(text: string, language?: string | null): string {
  return text.replace(SUPPORT_EMAIL_PATTERN, getSupportEmail(language));
}
