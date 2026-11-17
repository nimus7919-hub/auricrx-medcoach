import { uiLocale } from './language';

type DateInput = string | number | Date | null | undefined;

function toDate(v: DateInput): Date | null {
  if (v === null || v === undefined || v === '') return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date + time in the in-app language (not the device locale). Unparseable input is returned as-is. */
export function formatDateTime(v: DateInput, lang: unknown, timeZone?: string): string {
  const d = toDate(v);
  if (!d) return v == null ? '' : String(v);
  try {
    return d.toLocaleString(uiLocale(lang), { dateStyle: 'medium', timeStyle: 'short', ...(timeZone ? { timeZone } : {}) });
  } catch {
    return d.toLocaleString(uiLocale(lang));
  }
}

/** Date only, in the in-app language. */
export function formatDate(v: DateInput, lang: unknown, timeZone?: string): string {
  const d = toDate(v);
  if (!d) return v == null ? '' : String(v);
  try {
    return d.toLocaleDateString(uiLocale(lang), { dateStyle: 'medium', ...(timeZone ? { timeZone } : {}) });
  } catch {
    return d.toLocaleDateString(uiLocale(lang));
  }
}
