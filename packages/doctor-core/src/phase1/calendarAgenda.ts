/**
 * Read-only today's agenda from Google/Outlook.
 * Real OAuth is behind a feature flag; without credentials we stub and fail closed.
 */

export type CalendarProvider = 'google' | 'outlook' | 'stub';

export interface CalendarAppointment {
  id: string;
  title: string;
  startIso: string; // UTC
  endIso: string; // UTC
  provider: CalendarProvider;
}

export interface CalendarAgendaResult {
  ok: boolean;
  appointments: CalendarAppointment[];
  /** Doctor-local display timezone */
  timeZone: string;
  lastSyncedAt?: string;
  stale: boolean;
  failClosed: boolean;
  overlaps: Array<{ aId: string; bId: string }>;
  warning?: 'stale_sync' | 'unavailable' | 'oauth_stub';
  featureFlagEnabled: boolean;
}

/** Max age before agenda is considered stale (fail closed). */
export const CALENDAR_STALE_MS = 5 * 60 * 1000;

export const CALENDAR_OAUTH_FEATURE_FLAG = 'DOCTOR_CALENDAR_OAUTH';

export function isCalendarOAuthEnabled(env: Record<string, string | undefined> = processEnv()): boolean {
  const v = String(env[CALENDAR_OAUTH_FEATURE_FLAG] || env.EXPO_PUBLIC_DOCTOR_CALENDAR_OAUTH || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function processEnv(): Record<string, string | undefined> {
  try {
    // eslint-disable-next-line no-undef
    return typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : {};
  } catch {
    return {};
  }
}

export function findOverlappingAppointments(
  appointments: CalendarAppointment[]
): Array<{ aId: string; bId: string }> {
  const sorted = [...appointments].sort((a, b) => a.startIso.localeCompare(b.startIso));
  const overlaps: Array<{ aId: string; bId: string }> = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      if (b.startIso >= a.endIso) break;
      if (a.startIso < b.endIso && b.startIso < a.endIso) {
        overlaps.push({ aId: a.id, bId: b.id });
      }
    }
  }
  return overlaps;
}

export function evaluateCalendarAgenda(input: {
  appointments: CalendarAppointment[];
  lastSyncedAt?: string;
  timeZone: string;
  nowMs?: number;
  featureFlagEnabled?: boolean;
  providerAvailable?: boolean;
}): CalendarAgendaResult {
  const now = input.nowMs ?? Date.now();
  const flag = input.featureFlagEnabled ?? isCalendarOAuthEnabled();
  const available = input.providerAvailable !== false;

  if (!flag) {
    return {
      ok: false,
      appointments: [],
      timeZone: input.timeZone,
      lastSyncedAt: input.lastSyncedAt,
      stale: true,
      failClosed: true,
      overlaps: [],
      warning: 'oauth_stub',
      featureFlagEnabled: false,
    };
  }

  if (!available || !input.lastSyncedAt) {
    return {
      ok: false,
      appointments: [],
      timeZone: input.timeZone,
      lastSyncedAt: input.lastSyncedAt,
      stale: true,
      failClosed: true,
      overlaps: [],
      warning: 'unavailable',
      featureFlagEnabled: true,
    };
  }

  const synced = Date.parse(input.lastSyncedAt);
  const stale = !Number.isFinite(synced) || now - synced > CALENDAR_STALE_MS;
  if (stale) {
    return {
      ok: false,
      appointments: [],
      timeZone: input.timeZone,
      lastSyncedAt: input.lastSyncedAt,
      stale: true,
      failClosed: true,
      overlaps: [],
      warning: 'stale_sync',
      featureFlagEnabled: true,
    };
  }

  const appointments = [...input.appointments].sort((a, b) => a.startIso.localeCompare(b.startIso));
  return {
    ok: true,
    appointments,
    timeZone: input.timeZone,
    lastSyncedAt: input.lastSyncedAt,
    stale: false,
    failClosed: false,
    overlaps: findOverlappingAppointments(appointments),
    featureFlagEnabled: true,
  };
}

/** Format an instant in the doctor's timezone for display. */
export function formatInTimeZone(iso: string, timeZone: string, locale = 'es-MX'): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
