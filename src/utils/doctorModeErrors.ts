// Maps machine error codes thrown by doctorModeService to translated, user-facing text.
// Raw codes (link_not_found, doctor_not_ready, ...) and server error strings are never shown to patients.
type Translate = (key: string, options?: any) => string;

export function doctorModeErrorMessage(error: any, t: Translate, fallbackKey: string): string {
  const code = typeof error?.message === 'string' ? error.message.trim() : '';
  if (/^[a-z][a-z0-9_]*$/.test(code)) {
    const key = `doctorMode.errors.${code}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }
  return t(fallbackKey);
}
