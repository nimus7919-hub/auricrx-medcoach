import { PRE_VISIT_INTAKE_CONFIG } from '../../config/preVisitIntake';

const DAY_MS = 24 * 60 * 60 * 1000;

function validDays(days: number): number {
  if (!Number.isFinite(days) || days < 0) {
    throw new Error('invalid_retention_days');
  }
  return Math.floor(days);
}

/**
 * Raw chat auto-delete time = appointment start + N days (default from config).
 * If the appointment date is missing/invalid, fall back to `fallbackIso` (e.g. share time) so
 * the chat is never kept indefinitely.
 */
export function computeRawChatDeleteAt(
  appointmentStartIso: string,
  retentionDays: number = PRE_VISIT_INTAKE_CONFIG.RAW_CHAT_RETENTION_DAYS_AFTER_APPOINTMENT,
  fallbackIso: string = new Date().toISOString()
): string {
  const days = validDays(retentionDays);
  let base = Date.parse(appointmentStartIso);
  if (Number.isNaN(base)) base = Date.parse(fallbackIso);
  if (Number.isNaN(base)) throw new Error('invalid_retention_base');
  return new Date(base + days * DAY_MS).toISOString();
}

export function isRawChatExpired(rawChatDeleteAt: string, now: Date = new Date()): boolean {
  const t = Date.parse(rawChatDeleteAt);
  if (Number.isNaN(t)) return true; // fail closed: unknown deadline → treat as expired
  return now.getTime() >= t;
}

/** Whole days left before auto-delete (0 when due). */
export function daysUntilRawChatDeletion(rawChatDeleteAt: string, now: Date = new Date()): number {
  const t = Date.parse(rawChatDeleteAt);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.ceil((t - now.getTime()) / DAY_MS));
}
