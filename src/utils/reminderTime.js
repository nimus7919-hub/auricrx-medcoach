// Wall-clock time in the device timezone; never convert a daily reminder to UTC.
export function parseReminderTime(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?\s*m\.?)?$/i);
  if (!match) throw new Error('Hora invalida / Invalid time');
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59 || (match[3] && Number(match[3]) > 59) || hour > (match[4] ? 12 : 23) || (match[4] && hour < 1)) throw new Error('Hora invalida / Invalid time');
  if (match[4]) hour = hour % 12 + (/^p/i.test(match[4]) ? 12 : 0);
  return { hour, minute, normalized: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` };
}
