import {
  canDoctorReadCategory,
  canDoctorSeePatientData,
  effectiveConsent,
  filterConsentedEntries,
  isDoctorEntitled,
  mergeConsent,
} from '../../doctor/accessRules';
import { defaultConsent, type DoctorProfile, type PatientDoctorLink } from '../../doctor/types';

const profile = (over: Partial<DoctorProfile> = {}): DoctorProfile => ({
  uid: 'doc_1',
  displayName: 'Dr. Test',
  specialty: 'GP',
  cedulaNumber: '123456',
  verificationStatus: 'verified',
  doctorPlan: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

const link = (over: Partial<PatientDoctorLink> = {}): PatientDoctorLink => ({
  id: 'link_1',
  patientId: 'pat_1',
  doctorId: 'doc_1',
  status: 'active',
  consent: { ...defaultConsent(), bloodPressure: true, glucose: false },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

describe('doctor access rules', () => {
  it('requires doctorPlan + verified for entitlement', () => {
    expect(isDoctorEntitled(profile())).toBe(true);
    expect(isDoctorEntitled(profile({ doctorPlan: false }))).toBe(false);
    expect(isDoctorEntitled(profile({ verificationStatus: 'pending' }))).toBe(false);
    expect(isDoctorEntitled(profile({ verificationStatus: 'rejected' }))).toBe(false);
    expect(isDoctorEntitled(null)).toBe(false);
  });

  it('blocks patient data when unverified even if linked', () => {
    expect(canDoctorSeePatientData(profile({ verificationStatus: 'unverified' }), link())).toBe(false);
    expect(canDoctorSeePatientData(profile(), link({ status: 'revoked' }))).toBe(false);
    expect(canDoctorSeePatientData(profile(), link())).toBe(true);
  });

  it('enforces per-category consent and immediate revoke', () => {
    expect(canDoctorReadCategory(profile(), link(), 'bloodPressure')).toBe(true);
    expect(canDoctorReadCategory(profile(), link(), 'glucose')).toBe(false);
    expect(effectiveConsent(link({ status: 'revoked' }), 'bloodPressure')).toBe(false);
  });

  it('filters bitácora entries by consented categories', () => {
    const entries = [
      { id: '1', type: 'blood_pressure' as const },
      { id: '2', type: 'glucose' as const },
      { id: '3', type: 'weight' as const },
    ];
    const filtered = filterConsentedEntries(profile(), link(), entries);
    expect(filtered.map((e) => e.id)).toEqual(['1']);
  });

  it('merges consent updates without enabling unspecified categories', () => {
    const merged = mergeConsent(defaultConsent(), { glucose: true });
    expect(merged.glucose).toBe(true);
    expect(merged.bloodPressure).toBe(false);
    expect(merged.medicationList).toBe(false);
  });
});
