/**
 * Doctor-configured message office hours.
 * Each doctor chooses days, one or more local time windows per day,
 * timezone, and can pause messaging (vacation). Patients see this
 * schedule before writing. Outside windows (or while paused), messages queue.
 */

export interface DayTimeWindow {
  /** Minutes from local midnight, inclusive. 0–1439 */
  startMinutes: number;
  /** Minutes from local midnight, exclusive. 1–1440 */
  endMinutes: number;
}

export interface OfficeHoursSchedule {
  /** IANA timezone, e.g. America/Mexico_City */
  timeZone: string;
  /** Vacation / pause — no messages become actionable until cleared. */
  messagingPaused: boolean;
  /**
   * Windows keyed by weekday string "0"–"6" (Sun–Sat).
   * Missing or empty array = closed that day.
   */
  windowsByDay: Record<string, DayTimeWindow[]>;
}

/** @deprecated Legacy single-window shape — still accepted by normalizeOfficeHours. */
export interface LegacyOfficeHoursWindow {
  days: number[];
  startHour: number;
  endHour: number;
  timeZone: string;
  enabled: boolean;
}

/** Alias kept for older imports; prefer OfficeHoursSchedule. */
export type OfficeHoursWindow = OfficeHoursSchedule | LegacyOfficeHoursWindow;

export const DEFAULT_OFFICE_HOURS: OfficeHoursSchedule = {
  timeZone: 'America/Mexico_City',
  messagingPaused: false,
  windowsByDay: {
    '1': [{ startMinutes: 9 * 60, endMinutes: 18 * 60 }],
    '2': [{ startMinutes: 9 * 60, endMinutes: 18 * 60 }],
    '3': [{ startMinutes: 9 * 60, endMinutes: 18 * 60 }],
    '4': [{ startMinutes: 9 * 60, endMinutes: 18 * 60 }],
    '5': [{ startMinutes: 9 * 60, endMinutes: 18 * 60 }],
  },
};

const WEEKDAY_KEYS = ['0', '1', '2', '3', '4', '5', '6'] as const;

export function isLegacyOfficeHours(input: unknown): input is LegacyOfficeHoursWindow {
  return !!input && typeof input === 'object' && 'startHour' in (input as object) && 'days' in (input as object);
}

function clampInt(n: unknown, min: number, max: number): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.floor(v)));
}

function normalizeWindow(w: Partial<DayTimeWindow>): DayTimeWindow | null {
  let start = clampInt(w.startMinutes, 0, 1439);
  let end = clampInt(w.endMinutes, 1, 1440);
  if (end <= start) return null;
  return { startMinutes: start, endMinutes: end };
}

function mergeOverlaps(windows: DayTimeWindow[]): DayTimeWindow[] {
  const sorted = [...windows].sort((a, b) => a.startMinutes - b.startMinutes);
  const out: DayTimeWindow[] = [];
  for (const w of sorted) {
    const last = out[out.length - 1];
    if (!last || w.startMinutes > last.endMinutes) out.push({ ...w });
    else last.endMinutes = Math.max(last.endMinutes, w.endMinutes);
  }
  return out;
}

/** Accepts new schedule or legacy {days,startHour,endHour,enabled}. */
export function normalizeOfficeHours(
  input?: Partial<OfficeHoursSchedule> | LegacyOfficeHoursWindow | null
): OfficeHoursSchedule {
  if (isLegacyOfficeHours(input)) {
    const days = Array.isArray(input.days)
      ? [...new Set(input.days.filter((d) => d >= 0 && d <= 6))]
      : [1, 2, 3, 4, 5];
    const startHour = clampInt(input.startHour, 0, 23);
    let endHour = clampInt(input.endHour, 1, 24);
    if (endHour <= startHour) endHour = Math.min(24, startHour + 1);
    const windowsByDay: Record<string, DayTimeWindow[]> = {};
    for (const d of days) {
      windowsByDay[String(d)] = [
        { startMinutes: startHour * 60, endMinutes: endHour * 60 },
      ];
    }
    return {
      timeZone: String(input.timeZone || DEFAULT_OFFICE_HOURS.timeZone),
      // Legacy enabled:false meant "don't enforce"; map to not paused + empty? Keep accepting always.
      // New model: messagingPaused is explicit vacation. Legacy enabled:false → treat as not paused with windows.
      messagingPaused: false,
      windowsByDay: Object.keys(windowsByDay).length ? windowsByDay : { ...DEFAULT_OFFICE_HOURS.windowsByDay },
    };
  }

  const raw = (input || {}) as Partial<OfficeHoursSchedule>;
  const windowsByDay: Record<string, DayTimeWindow[]> = {};
  const source = raw.windowsByDay && typeof raw.windowsByDay === 'object' ? raw.windowsByDay : DEFAULT_OFFICE_HOURS.windowsByDay;
  for (const key of WEEKDAY_KEYS) {
    const list = Array.isArray(source[key]) ? source[key] : [];
    const normalized = mergeOverlaps(
      list.map(normalizeWindow).filter((w): w is DayTimeWindow => !!w)
    );
    if (normalized.length) windowsByDay[key] = normalized;
  }
  if (!Object.keys(windowsByDay).length) {
    Object.assign(windowsByDay, DEFAULT_OFFICE_HOURS.windowsByDay);
  }
  return {
    timeZone: String(raw.timeZone || DEFAULT_OFFICE_HOURS.timeZone),
    messagingPaused: raw.messagingPaused === true,
    windowsByDay,
  };
}

export function getZonedParts(
  date: Date,
  timeZone: string
): { weekday: number; hour: number; minute: number; minutesOfDay: number } {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const map: Record<string, string> = {};
    for (const p of fmt.formatToParts(date)) {
      if (p.type !== 'literal') map[p.type] = p.value;
    }
    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    let hour = Number(map.hour);
    if (hour === 24) hour = 0;
    const minute = Number(map.minute) || 0;
    const weekday = weekdayMap[map.weekday] ?? date.getUTCDay();
    return {
      weekday,
      hour: Number.isFinite(hour) ? hour : date.getUTCHours(),
      minute,
      minutesOfDay: (Number.isFinite(hour) ? hour : date.getUTCHours()) * 60 + minute,
    };
  } catch {
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    return {
      weekday: date.getUTCDay(),
      hour,
      minute,
      minutesOfDay: hour * 60 + minute,
    };
  }
}

export function isWithinOfficeHours(
  hours: Partial<OfficeHoursSchedule> | LegacyOfficeHoursWindow | null | undefined,
  now: Date = new Date()
): boolean {
  const h = normalizeOfficeHours(hours);
  if (h.messagingPaused) return false;
  const parts = getZonedParts(now, h.timeZone);
  const windows = h.windowsByDay[String(parts.weekday)] || [];
  return windows.some(
    (w) => parts.minutesOfDay >= w.startMinutes && parts.minutesOfDay < w.endMinutes
  );
}

/** Next instant strictly after `from` inside a window (1-min steps, max 14 days). Null if paused with no windows. */
export function nextOfficeOpenIso(
  hours: Partial<OfficeHoursSchedule> | LegacyOfficeHoursWindow | null | undefined,
  from: Date = new Date()
): string | null {
  const h = normalizeOfficeHours(hours);
  if (h.messagingPaused) return null;
  const stepMs = 60_000;
  const max = from.getTime() + 14 * 24 * 60 * 60 * 1000;
  for (let t = from.getTime() + stepMs; t <= max; t += stepMs) {
    if (isWithinOfficeHours(h, new Date(t))) return new Date(t).toISOString();
  }
  return null;
}

function formatMinutes(m: number, locale: 'en' | 'es'): string {
  const hh = Math.floor(m / 60) % 24;
  const mm = m % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (locale === 'en') {
    const h12 = ((hh + 11) % 12) + 1;
    const ampm = hh < 12 ? 'AM' : 'PM';
    return `${h12}:${pad(mm)} ${ampm}`;
  }
  return `${pad(hh)}:${pad(mm)}`;
}

const DAY_LABELS: Record<'en' | 'es', string[]> = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
};

/** Human-readable schedule for patients (before they write). */
export function formatOfficeHoursForPatient(
  hours: Partial<OfficeHoursSchedule> | LegacyOfficeHoursWindow | null | undefined,
  locale: 'en' | 'es' = 'es'
): string[] {
  const h = normalizeOfficeHours(hours);
  const lines: string[] = [];
  if (h.messagingPaused) {
    lines.push(
      locale === 'es'
        ? 'El médico pausó los mensajes (ausencia). Su mensaje se encolará.'
        : 'The doctor paused messaging (away). Your message will be queued.'
    );
    return lines;
  }
  lines.push(
    locale === 'es'
      ? `Zona horaria del médico: ${h.timeZone}`
      : `Doctor timezone: ${h.timeZone}`
  );
  const labels = DAY_LABELS[locale];
  for (let d = 0; d <= 6; d++) {
    const windows = h.windowsByDay[String(d)] || [];
    if (!windows.length) continue;
    const slots = windows
      .map((w) => `${formatMinutes(w.startMinutes, locale)}–${formatMinutes(w.endMinutes, locale)}`)
      .join(', ');
    lines.push(`${labels[d]}: ${slots}`);
  }
  if (lines.length === 1) {
    lines.push(locale === 'es' ? 'Sin ventanas configuradas.' : 'No windows configured.');
  }
  return lines;
}

export function minutesFromHhMm(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 24 || mm < 0 || mm > 59) return null;
  if (hh === 24 && mm !== 0) return null;
  return hh * 60 + mm;
}

export function hhMmFromMinutes(minutes: number): string {
  const m = clampInt(minutes, 0, 1440);
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
