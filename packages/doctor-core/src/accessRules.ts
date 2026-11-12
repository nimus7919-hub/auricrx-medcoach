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

export function isDoctorEntitled(profile: Pick<DoctorProfile, 'doctorPlan' | 'verificationStatus'> | null | undefined): boolean {
  if (!profile) return false;
  return profile.doctorPlan === true && profile.verificationStatus === 'verified';
}

export function canDoctorSeePatientData(
  profile: Pick<DoctorProfile, 'doctorPlan' | 'verificationStatus'> | null | undefined,
  link: PatientDoctorLink | null | undefined
): boolean {
  if (!isDoctorEntitled(profile)) return false;
  if (!link || link.status !== 'active') return false;
  return true;
}

export function canDoctorReadCategory(
  profile: Pick<DoctorProfile, 'doctorPlan' | 'verificationStatus'> | null | undefined,
  link: PatientDoctorLink | null | undefined,
  category: ConsentCategory
): boolean {
  if (!canDoctorSeePatientData(profile, link)) return false;
  return link!.consent?.[category] === true;
}

export function canDoctorReadEntryType(
  profile: Pick<DoctorProfile, 'doctorPlan' | 'verificationStatus'> | null | undefined,
  link: PatientDoctorLink | null | undefined,
  entryType: BitacoraEntryType
): boolean {
  const category = ENTRY_TYPE_TO_CONSENT[entryType];
  return canDoctorReadCategory(profile, link, category);
}

export function filterConsentedEntries<T extends { type: BitacoraEntryType }>(
  profile: Pick<DoctorProfile, 'doctorPlan' | 'verificationStatus'> | null | undefined,
  link: PatientDoctorLink | null | undefined,
  entries: T[]
): T[] {
  if (!canDoctorSeePatientData(profile, link)) return [];
  return entries.filter((e) => canDoctorReadEntryType(profile, link, e.type));
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

export function isVerificationStatus(value: string): value is VerificationStatus {
  return value === 'unverified' || value === 'pending' || value === 'verified' || value === 'rejected';
}
