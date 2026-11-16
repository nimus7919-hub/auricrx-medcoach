/** Pure helpers for check throttling and banner snooze. Unit tested. */

export function shouldRunCheck(
  lastCheckedAtMs: number | null | undefined,
  nowMs: number,
  intervalMs: number,
  force = false,
): boolean {
  if (force) return true;
  if (lastCheckedAtMs == null || !Number.isFinite(lastCheckedAtMs)) return true;
  if (!Number.isFinite(nowMs) || intervalMs <= 0) return true;
  return nowMs - lastCheckedAtMs >= intervalMs;
}

export function shouldShowBanner(
  snooze: { key: string; untilMs: number } | null | undefined,
  offerKey: string,
  nowMs: number,
): boolean {
  if (!snooze || snooze.key !== offerKey) return true;
  return nowMs >= snooze.untilMs;
}

export function parseTimestamp(raw: string | null | undefined): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function parseSnooze(raw: string | null | undefined): { key: string; untilMs: number } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { key?: unknown; untilMs?: unknown };
    if (typeof parsed?.key !== 'string' || !parsed.key) return null;
    if (typeof parsed.untilMs !== 'number' || !Number.isFinite(parsed.untilMs)) return null;
    return { key: parsed.key, untilMs: parsed.untilMs };
  } catch {
    return null;
  }
}

export function offerKey(kind: 'ota' | 'store', version: string): string {
  return `${kind}:${version}`;
}
