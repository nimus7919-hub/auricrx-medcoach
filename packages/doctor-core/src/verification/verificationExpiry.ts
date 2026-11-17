/** Annual re-verification window. */

export const VERIFICATION_VALIDITY_MONTHS = 12;

export function addMonthsIso(fromIso: string, months: number): string {
  const d = new Date(fromIso);
  if (Number.isNaN(d.getTime())) {
    throw new Error('invalid_date');
  }
  const out = new Date(d.getTime());
  out.setUTCMonth(out.getUTCMonth() + months);
  return out.toISOString();
}

export function computeExpiryFromVerifiedAt(verifiedAt: string): string {
  return addMonthsIso(verifiedAt, VERIFICATION_VALIDITY_MONTHS);
}

export function isVerificationExpired(
  profile: { verificationStatus?: string; expiresAt?: string | null } | null | undefined,
  now: Date = new Date()
): boolean {
  if (!profile) return true;
  if (profile.verificationStatus === 'expired') return true;
  if (profile.verificationStatus !== 'verified') return false;
  if (!profile.expiresAt) return false;
  const exp = new Date(profile.expiresAt).getTime();
  if (Number.isNaN(exp)) return false;
  return exp <= now.getTime();
}

/** Due for recheck within `withinDays` of expiry (default 30). */
export function isVerificationDueForRecheck(
  profile: { verificationStatus?: string; expiresAt?: string | null } | null | undefined,
  withinDays = 30,
  now: Date = new Date()
): boolean {
  if (!profile || profile.verificationStatus !== 'verified' || !profile.expiresAt) return false;
  const exp = new Date(profile.expiresAt).getTime();
  if (Number.isNaN(exp)) return false;
  const windowMs = withinDays * 24 * 60 * 60 * 1000;
  const remaining = exp - now.getTime();
  return remaining <= windowMs;
}
