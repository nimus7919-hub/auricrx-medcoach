import uiI18n from '../i18n';

// Custom reminder days used to be stored as localized names ("Lunes", "Monday"...).
// These helpers resolve a stored value in ANY app language to a weekday number
// (1 = Sunday ... 7 = Saturday) so a language change never breaks scheduling.
export const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const LANGUAGES = ['en', 'es', 'pt', 'fr', 'de', 'zh'];
const clean = value => String(value ?? '').trim().toLowerCase();

export function weekdayNumber(day) {
  if (typeof day === 'number') return day >= 1 && day <= 7 ? day : 0;
  const wanted = clean(day);
  if (!wanted) return 0;
  for (let index = 0; index < WEEKDAY_KEYS.length; index++) {
    for (const lng of LANGUAGES) {
      const label = uiI18n.t(`reminders.${WEEKDAY_KEYS[index]}`, { lng });
      if (clean(label) === wanted) return index + 1;
    }
  }
  return 0;
}

/** Name of a stored custom day in the current app language (falls back to the stored text). */
export function localizeWeekday(day) {
  const number = weekdayNumber(day);
  return number ? uiI18n.t(`reminders.${WEEKDAY_KEYS[number - 1]}`) : String(day);
}
