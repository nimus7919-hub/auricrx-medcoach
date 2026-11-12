/**
 * Doctor-app Firestore client (AuricRX Médicos).
 * Shares collections with the patient app; only doctor-facing operations live here.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  type BitacoraEntry,
  type DoctorAlertLimit,
  type DoctorInvite,
  type DoctorProfile,
  type PatientDoctorLink,
  type AlertReadingType,
  type AlertComparator,
  type AuditLogEntry,
  getCedulaVerificationProvider,
  setLocalDoctorPlan,
  type DoctorPlanSource,
  isDoctorEntitled,
  canDoctorSeePatientData,
  canDoctorReadCategory,
  generateInviteCode,
  inviteExpiresAt,
  isInviteExpired,
  normalizeInviteCode,
  defaultConsent,
} from '@auricrx/doctor-core';
import { auth, db } from '../config/firebase';

function uidOrThrow(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('not_authenticated');
  return uid;
}

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as T;
}

class DoctorAppService {
  private static instance: DoctorAppService;
  static getInstance() {
    if (!this.instance) this.instance = new DoctorAppService();
    return this.instance;
  }

  watchAuth(cb: (user: User | null) => void) {
    return onAuthStateChanged(auth, cb);
  }

  async signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }

  async register(email: string, password: string) {
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  }

  async signOut() {
    await fbSignOut(auth);
  }

  async getDoctorProfile(uid?: string): Promise<DoctorProfile | null> {
    const id = uid || auth.currentUser?.uid;
    if (!id) return null;
    const snap = await getDoc(doc(db, 'doctorProfiles', id));
    return snap.exists() ? (snap.data() as DoctorProfile) : null;
  }

  async saveDoctorProfile(input: {
    displayName: string;
    specialty: string;
    cedulaNumber: string;
  }): Promise<DoctorProfile> {
    const uid = uidOrThrow();
    const existing = await this.getDoctorProfile(uid);
    const ts = nowIso();
    const profile: DoctorProfile = {
      uid,
      displayName: input.displayName.trim(),
      specialty: input.specialty.trim(),
      cedulaNumber: input.cedulaNumber.trim(),
      verificationStatus: existing?.verificationStatus || 'unverified',
      verificationUpdatedAt: existing?.verificationUpdatedAt,
      verificationMessage: existing?.verificationMessage,
      doctorPlan: existing?.doctorPlan || false,
      doctorPlanSource: existing?.doctorPlanSource,
      doctorPlanUpdatedAt: existing?.doctorPlanUpdatedAt,
      createdAt: existing?.createdAt || ts,
      updatedAt: ts,
    };
    await setDoc(doc(db, 'doctorProfiles', uid), stripUndefined(profile as any), { merge: true });
    return profile;
  }

  async submitCedulaVerification(): Promise<DoctorProfile> {
    const uid = uidOrThrow();
    const profile = await this.getDoctorProfile(uid);
    if (!profile) throw new Error('doctor_profile_required');
    await updateDoc(doc(db, 'doctorProfiles', uid), {
      verificationStatus: 'pending',
      verificationUpdatedAt: nowIso(),
      updatedAt: nowIso(),
    });
    const result = await getCedulaVerificationProvider().submit({
      fullName: profile.displayName,
      cedulaNumber: profile.cedulaNumber,
      specialty: profile.specialty,
      country: 'MX',
    });
    const updated = {
      verificationStatus: result.status,
      verificationUpdatedAt: result.checkedAt,
      verificationMessage: result.message,
      updatedAt: nowIso(),
    };
    await updateDoc(doc(db, 'doctorProfiles', uid), updated);
    await this.writeAudit({
      actorId: uid,
      actorRole: 'doctor',
      action: 'verification_updated',
      doctorId: uid,
      detail: `${result.status}:${result.referenceId || ''}`,
    });
    return { ...profile, ...updated } as DoctorProfile;
  }

  async setDoctorPlan(enabled: boolean, source: DoctorPlanSource = 'mock'): Promise<DoctorProfile> {
    const uid = uidOrThrow();
    const local = await setLocalDoctorPlan(enabled, source);
    const profile = await this.getDoctorProfile(uid);
    const patch = {
      doctorPlan: enabled,
      doctorPlanSource: source,
      doctorPlanUpdatedAt: local.updatedAt,
      updatedAt: nowIso(),
    };
    if (!profile) {
      const stub: DoctorProfile = {
        uid,
        displayName: '',
        specialty: '',
        cedulaNumber: '',
        verificationStatus: 'unverified',
        createdAt: nowIso(),
        ...patch,
      };
      await setDoc(doc(db, 'doctorProfiles', uid), stub, { merge: true });
      return stub;
    }
    await updateDoc(doc(db, 'doctorProfiles', uid), patch);
    await this.writeAudit({
      actorId: uid,
      actorRole: 'doctor',
      action: 'doctor_plan_updated',
      doctorId: uid,
      detail: `${enabled}:${source}`,
    });
    return { ...profile, ...patch };
  }

  async createDoctorInvite(): Promise<DoctorInvite> {
    const createdBy = uidOrThrow();
    const profile = await this.getDoctorProfile(createdBy);
    if (!isDoctorEntitled(profile)) throw new Error('doctor_not_ready');
    const code = generateInviteCode('DR');
    const invite: DoctorInvite = {
      code,
      createdBy,
      role: 'doctor',
      expiresAt: inviteExpiresAt(30),
      createdAt: nowIso(),
      consumed: false,
    };
    await setDoc(doc(db, 'doctorInvites', code), invite);
    return invite;
  }

  async redeemPatientInvite(code: string, selfDisplayName?: string): Promise<PatientDoctorLink> {
    const doctorId = uidOrThrow();
    const profile = await this.getDoctorProfile(doctorId);
    if (!isDoctorEntitled(profile)) throw new Error('doctor_not_ready');
    const normalized = normalizeInviteCode(code);
    const snap = await getDoc(doc(db, 'doctorInvites', normalized));
    if (!snap.exists()) throw new Error('invalid_invite');
    const invite = snap.data() as DoctorInvite;
    if (invite.consumed) throw new Error('invalid_invite');
    if (isInviteExpired(invite.expiresAt)) throw new Error('expired_invite');
    if (invite.role !== 'patient') throw new Error('invite_role_mismatch');
    if (invite.createdBy === doctorId) throw new Error('cannot_link_self');

    const patientId = invite.createdBy;
    const linkId = newId('link');
    const ts = nowIso();
    const link: PatientDoctorLink = {
      id: linkId,
      patientId,
      doctorId,
      doctorDisplayName: selfDisplayName || profile?.displayName,
      status: 'active',
      consent: defaultConsent(),
      createdAt: ts,
      updatedAt: ts,
      confirmedAt: ts,
      inviteCode: invite.code,
    };
    await setDoc(doc(db, 'doctorLinks', linkId), stripUndefined(link as any));
    await setDoc(doc(db, 'doctorPatientAccess', `${doctorId}_${patientId}`), {
      accessId: `${doctorId}_${patientId}`,
      doctorId,
      patientId,
      linkId,
      status: link.status,
      consent: link.consent,
      updatedAt: ts,
    });
    await updateDoc(doc(db, 'doctorInvites', invite.code), {
      consumed: true,
      consumedBy: doctorId,
      consumedAt: ts,
    });
    await this.writeAudit({
      actorId: doctorId,
      actorRole: 'doctor',
      action: 'link_confirmed',
      patientId,
      doctorId,
      linkId,
      detail: invite.code,
    });
    return link;
  }

  async listPatients(): Promise<PatientDoctorLink[]> {
    const uid = uidOrThrow();
    const profile = await this.getDoctorProfile(uid);
    if (!isDoctorEntitled(profile)) return [];
    const snap = await getDocs(query(collection(db, 'doctorLinks'), where('doctorId', '==', uid)));
    return snap.docs
      .map((d) => d.data() as PatientDoctorLink)
      .filter((l) => l.status === 'active')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async listBitacoraForPatient(link: PatientDoctorLink): Promise<BitacoraEntry[]> {
    const uid = uidOrThrow();
    const profile = await this.getDoctorProfile(uid);
    if (!canDoctorSeePatientData(profile, link)) return [];
    const q = query(
      collection(db, 'bitacora', link.patientId, 'entries'),
      orderBy('timestamp', 'desc'),
      limit(200)
    );
    const snap = await getDocs(q);
    const entries = snap.docs.map((d) => d.data() as BitacoraEntry);
    const filtered = entries.filter((e) => {
      if (e.type === 'blood_pressure') return canDoctorReadCategory(profile, link, 'bloodPressure');
      if (e.type === 'glucose') return canDoctorReadCategory(profile, link, 'glucose');
      if (e.type === 'weight') return canDoctorReadCategory(profile, link, 'weight');
      if (e.type === 'symptoms') return canDoctorReadCategory(profile, link, 'symptoms');
      return false;
    });
    await this.writeAudit({
      actorId: uid,
      actorRole: 'doctor',
      action: 'doctor_read',
      patientId: link.patientId,
      doctorId: uid,
      linkId: link.id,
      detail: `bitacora:${filtered.length}`,
    });
    return filtered;
  }

  subscribeBitacora(
    patientId: string,
    onData: (entries: BitacoraEntry[]) => void,
    onError?: (e: Error) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'bitacora', patientId, 'entries'),
      orderBy('timestamp', 'desc'),
      limit(200)
    );
    return onSnapshot(
      q,
      (snap) => onData(snap.docs.map((d) => d.data() as BitacoraEntry)),
      (err) => onError?.(err as Error)
    );
  }

  async setAlertLimit(input: {
    patientId: string;
    readingType: AlertReadingType;
    comparator: AlertComparator;
    value: number;
    enabled?: boolean;
  }): Promise<DoctorAlertLimit> {
    const doctorId = uidOrThrow();
    const profile = await this.getDoctorProfile(doctorId);
    if (!isDoctorEntitled(profile)) throw new Error('doctor_not_ready');
    const id = `${doctorId}_${input.patientId}_${input.readingType}`;
    const existing = await getDoc(doc(db, 'doctorAlertLimits', id));
    const ts = nowIso();
    const limitDoc: DoctorAlertLimit = {
      id,
      doctorId,
      patientId: input.patientId,
      readingType: input.readingType,
      comparator: input.comparator,
      value: input.value,
      enabled: input.enabled !== false,
      createdAt: existing.exists() ? (existing.data() as DoctorAlertLimit).createdAt : ts,
      updatedAt: ts,
    };
    await setDoc(doc(db, 'doctorAlertLimits', id), limitDoc);
    return limitDoc;
  }

  async listAlertLimits(patientId: string): Promise<DoctorAlertLimit[]> {
    const doctorId = uidOrThrow();
    const snap = await getDocs(
      query(
        collection(db, 'doctorAlertLimits'),
        where('doctorId', '==', doctorId),
        where('patientId', '==', patientId)
      )
    );
    return snap.docs.map((d) => d.data() as DoctorAlertLimit);
  }

  /** Read-only medication list when consent.medicationList is on — stored under patient meds sync doc if present. */
  async getSharedMedications(link: PatientDoctorLink): Promise<Array<{ name: string; strength?: string }>> {
    const profile = await this.getDoctorProfile();
    if (!canDoctorReadCategory(profile, link, 'medicationList')) return [];
    const snap = await getDoc(doc(db, 'patientSharedMeds', link.patientId));
    if (!snap.exists()) return [];
    const data = snap.data() as { medications?: Array<{ name: string; strength?: string }> };
    return data.medications || [];
  }

  async getSharedAdherence(link: PatientDoctorLink): Promise<Array<{ name: string; adherenceRate?: number }>> {
    const profile = await this.getDoctorProfile();
    if (!canDoctorReadCategory(profile, link, 'reminderAdherence')) return [];
    const snap = await getDoc(doc(db, 'patientSharedAdherence', link.patientId));
    if (!snap.exists()) return [];
    const data = snap.data() as { items?: Array<{ name: string; adherenceRate?: number }> };
    return data.items || [];
  }

  async registerPushToken(expoPushToken: string, platform?: string) {
    const uid = uidOrThrow();
    await setDoc(doc(db, 'doctorPushTokens', uid), {
      uid,
      expoPushToken,
      platform,
      updatedAt: nowIso(),
    });
  }

  async writeAudit(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>) {
    const id = newId('audit');
    try {
      await setDoc(doc(db, 'doctorAuditLogs', id), {
        ...entry,
        id,
        createdAt: nowIso(),
      });
    } catch (e) {
      console.warn('audit write failed', e);
    }
  }
}

export default DoctorAppService;
