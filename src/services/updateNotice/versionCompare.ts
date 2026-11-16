/**
 * Compare dotted app versions (major.minor.patch[+build]).
 * Pre-release / build suffixes are ignored. Non-numeric segments count as 0.
 */

export function parseVersionParts(raw: string | null | undefined): number[] | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const core = trimmed.split(/[-+]/)[0];
  if (!core) return null;
  const parts = core.split('.').map((part) => {
    const match = part.match(/^\d+/);
    if (!match) return NaN;
    return Number(match[0]);
  });
  if (!parts.length || parts.some((n) => !Number.isFinite(n))) return null;
  return parts;
}

/** Negative if `a` < `b`, 0 if equal, positive if `a` > `b`. Invalid versions compare as null. */
export function compareVersions(a: string | null | undefined, b: string | null | undefined): number | null {
  const left = parseVersionParts(a);
  const right = parseVersionParts(b);
  if (!left || !right) return null;
  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i += 1) {
    const lv = left[i] ?? 0;
    const rv = right[i] ?? 0;
    if (lv !== rv) return lv - rv;
  }
  return 0;
}

/** True when `latest` is a valid version strictly newer than `installed`. */
export function isRemoteNewer(installed: string | null | undefined, latest: string | null | undefined): boolean {
  const cmp = compareVersions(installed, latest);
  return cmp != null && cmp < 0;
}
