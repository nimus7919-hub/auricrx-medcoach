// Calendar dates stay in the device timezone, including when DST changes.
export function formatReminderDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseReminderDate(value, fallback = new Date(), locale) {
  if (value == null || String(value).trim() === '') return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error('Invalid calendar date');
    return parseReminderDate(formatReminderDate(value));
  }
  const text = String(value).trim().replace(/[\u200e\u200f\u202a-\u202e]/g, '');
  let year, month, day;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/);
  const local = text.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (iso) [, year, month, day] = iso.map(Number);
  else if (local) {
    const first = Number(local[1]), second = Number(local[2]);
    const dayFirst = new Intl.DateTimeFormat(locale).formatToParts(new Date(2000, 10, 22)).find(p => p.type === 'day' || p.type === 'month').type === 'day';
    year = Number(local[3]);
    [month, day] = first > 12 ? [second, first] : second > 12 ? [first, second] : dayFirst ? [second, first] : [first, second];
  } else throw new Error('Invalid calendar date');
  const result = new Date(0);
  result.setFullYear(year, month - 1, day);
  result.setHours(0, 0, 0, 0);
  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day) throw new Error('Invalid calendar date');
  return result;
}

export function normalizeReminderDates(reminder, now = new Date(), locale) {
  const es = locale?.startsWith('es');
  let start, end;
  try { start = parseReminderDate(reminder.startDate, now); }
  catch { throw new Error(es ? 'Elige una fecha de inicio válida en el calendario.' : 'Please choose a valid start date in the calendar.'); }
  try { end = reminder.endDate ? parseReminderDate(reminder.endDate, now) : null; }
  catch { throw new Error(es ? 'Elige una fecha de fin válida en el calendario.' : 'Please choose a valid end date in the calendar.'); }
  if (end && end < start) throw new Error(es ? 'La fecha de fin debe ser igual o posterior a la fecha de inicio.' : 'The end date must be on or after the start date.');
  return { startDate: formatReminderDate(start), endDate: end ? formatReminderDate(end) : '' };
}

export function nextReminderOccurrence(start, hour, minute, frequency, weekdays = [], now = new Date()) {
  const date = new Date(Math.max(start.getTime(), new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()));
  date.setHours(hour, minute, 0, 0);
  // Monthly dates such as the 31st skip months without that calendar day.
  while (date <= now || (frequency === 'weekly' && date.getDay() !== start.getDay()) ||
    (frequency === 'monthly' && date.getDate() !== start.getDate()) ||
    (frequency === 'custom' && !weekdays.includes(date.getDay() + 1))) {
    date.setDate(date.getDate() + 1);
    date.setHours(hour, minute, 0, 0);
  }
  return date;
}
