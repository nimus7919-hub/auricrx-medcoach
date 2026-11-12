/**
 * Pure access helpers mirroring Firestore security rules.
 * Used by unit tests and client-side gating (rules remain authoritative).
 */

import type {
  ConsentCategory,
  ConsentMap,
  DoctorProfile,
  PatientDoctorLink,
  VerificationStatus,
} from './types';
import { ENTRY_TYPE_TO_CONSENT, type BitacoraEntryType } from './types';
import { isVerificationExpired } from './verification/verificationExpiry';

export type DoctorEntitlementProfile = Pick<
  DoctorProfile,
  'doctorPlan' | 'verificationStatus' | 'expiresAt'
>;

export function isDoctorEntitled(
  profile: DoctorEntitlementProfile | null | undefined,
  now: Date = new Date()
): boolean {
  if (!profile) return false;
  if (profile.doctorPlan !== true) return false;
  if (profile.verificationStatus !== 'verified') return false;
  if (isVerificationExpired(profile, now)) return false;
  return true;
}

export function canDoctorSeePatientData(
  profile: DoctorEntitlementProfile | null | undefined,
  link: PatientDoctorLink | null | undefined,
  now: Date = new Date()
): boolean {
  if (!isDoctorEntitled(profile, now)) return false;
  if (!link || link.status !== 'active') return false;
  return true;
}

export function canDoctorReadCategory(
  profile: DoctorEntitlementProfile | null | undefined,
  link: PatientDoctorLink | null | undefined,
  category: ConsentCategory,
  now: Date = new Date()
): boolean {
  if (!canDoctorSeePatientData(profile, link, now)) return false;
  return link!.consent?.[category] === true;
}

export function canDoctorReadEntryType(
  profile: DoctorEntitlementProfile | null | undefined,
  link: PatientDoctorLink | null | undefined,
  entryType: BitacoraEntryType,
  now: Date = new Date()
): boolean {
  const category = ENTRY_TYPE_TO_CONSENT[entryType];
  return canDoctorReadCategory(profile, link, category, now);
}

export function filterConsentedEntries<T extends { type: BitacoraEntryType }>(
  profile: DoctorEntitlementProfile | null | undefined,
  link: PatientDoctorLink | null | undefined,
  entries: T[],
  now: Date = new Date()
): T[] {
  if (!canDoctorSeePatientData(profile, link, now)) return [];
  return entries.filter((e) => canDoctorReadEntryType(profile, link, e.type, now));
}

export function patientOwnsLink(uid: string, link: PatientDoctorLink): boolean {
  return link.patientId === uid;
}

export function doctorOwnsLink(uid: string, link: PatientDoctorLink): boolean {
  return link.doctorId === uid;
}

/** Revocation cuts access immediately — status must be active AND consent on. */
export function effectiveConsent(
  link: PatientDoctorLink | null | undefined,
  category: ConsentCategory
): boolean {
  if (!link || link.status !== 'active') return false;
  return link.consent?.[category] === true;
}

export function mergeConsent(base: ConsentMap, updates: Partial<ConsentMap>): ConsentMap {
  return { ...base, ...updates };
}

const VERIFICATION_STATUSES: VerificationStatus[] = [
  'unverified',
  'pending',
  'pending_review',
  'verified',
  'rejected',
  'suspended',
  'expired',
];

export function isVerificationStatus(value: string): value is VerificationStatus {
  return (VERIFICATION_STATUSES as string[]).includes(value);
}
