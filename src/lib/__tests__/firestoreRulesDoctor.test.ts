/**
 * Mirrors the intent of firestore.rules for Doctor Mode.
 * Full emulator rules tests can be added later with @firebase/rules-unit-testing.
 */
import {
  canDoctorReadCategory,
  canDoctorSeePatientData,
  isDoctorEntitled,
} from '../../doctor/accessRules';
import { defaultConsent, type DoctorProfile, type PatientDoctorLink } from '../../doctor/types';

function accessMirror(link: PatientDoctorLink) {
  return {
    accessId: `${link.doctorId}_${link.patientId}`,
    doctorId: link.doctorId,
    patientId: link.patientId,
    linkId: link.id,
    status: link.status,
    consent: link.consent,
  };
}

describe('firestore doctor rules intent', () => {
  const readyDoctor: DoctorProfile = {
    uid: 'doc',
    displayName: 'Dr',
    specialty: 'IM',
    cedulaNumber: '999999',
    verificationStatus: 'verified',
    doctorPlan: true,
    createdAt: '',
    updatedAt: '',
  };

  const activeLink: PatientDoctorLink = {
    id: 'L1',
    patientId: 'P1',
    doctorId: 'doc',
    status: 'active',
    consent: { ...defaultConsent(), bloodPressure: true },
    createdAt: '',
    updatedAt: '',
  };

  it('patients own their data; doctors need ready+consent mirror', () => {
    expect(isDoctorEntitled(readyDoctor)).toBe(true);
    expect(canDoctorSeePatientData(readyDoctor, activeLink)).toBe(true);
    expect(canDoctorReadCategory(readyDoctor, activeLink, 'bloodPressure')).toBe(true);
    expect(canDoctorReadCategory(readyDoctor, activeLink, 'glucose')).toBe(false);

    const mirror = accessMirror(activeLink);
    expect(mirror.status).toBe('active');
    expect(mirror.consent.bloodPressure).toBe(true);

    const revoked = { ...activeLink, status: 'revoked' as const };
    expect(canDoctorSeePatientData(readyDoctor, revoked)).toBe(false);
    expect(accessMirror(revoked).status).toBe('revoked');
  });

  it('unverified or non-entitled doctors cannot read any category', () => {
    const unverified = { ...readyDoctor, verificationStatus: 'pending' as const };
    expect(canDoctorReadCategory(unverified, activeLink, 'bloodPressure')).toBe(false);
    const noPlan = { ...readyDoctor, doctorPlan: false };
    expect(canDoctorReadCategory(noPlan, activeLink, 'bloodPressure')).toBe(false);
  });
});
