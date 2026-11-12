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
  Timestamp,
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
  setLocalDoctorPlan,
  type DoctorPlanSource,
  isDoctorEntitled,
  canDoctorSeePatientData,
  canDoctorReadCategory,
  generateInviteCode,
  inviteExpiresDate,
  isInviteExpired,
  normalizeInviteCode,
  defaultConsent,
} from '@auricrx/doctor-core';
import { auth, db } from '../config/firebase';
import { API_BASE } from '../config/api';

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


async function doctorApi<T = any>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('not_authenticated');
  const token = await user.getIdToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `request_failed_${res.status}`);
  }
  return data as T;
}

const BITACORA_TYPES: Array<{ type: BitacoraEntry['type']; category: 'bloodPressure' | 'glucose' | 'weight' | 'symptoms' }> = [
  { type: 'blood_pressure', category: 'bloodPressure' },
  { type: 'glucose', category: 'glucose' },
  { type: 'weight', category: 'weight' },
  { type: 'symptoms', category: 'symptoms' },
];

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
    const data = await doctorApi<{ profile: DoctorProfile }>('/api/doctor/verification/submit');
    return (data.profile as DoctorProfile) || (await this.getDoctorProfile(uid))!;
  }

  async setDoctorPlan(enabled: boolean, source: DoctorPlanSource = 'mock'): Promise<DoctorProfile> {
    const uid = uidOrThrow();
    await setLocalDoctorPlan(enabled, source);
    const data = await doctorApi<{ profile: DoctorProfile }>('/api/doctor/plan/mock-grant', { enabled, source });
    return (data.profile as DoctorProfile) || (await this.getDoctorProfile(uid))!;
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
      expiresAt: Timestamp.fromDate(inviteExpiresDate(30)),
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
      consumedAt: Timestamp.now(),
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
    const allowed = BITACORA_TYPES.filter((row) => canDoctorReadCategory(profile, link, row.category));
    const chunks = await Promise.all(
      allowed.map(async (row) => {
        const q = query(
          collection(db, 'bitacora', link.patientId, 'entries'),
          where('type', '==', row.type),
          orderBy('timestamp', 'desc'),
          limit(200)
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => d.data() as BitacoraEntry);
      })
    );
    const filtered = chunks
      .flat()
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
      .slice(0, 200);
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
    link: PatientDoctorLink,
    onData: (entries: BitacoraEntry[]) => void,
    onError?: (e: Error) => void
  ): Unsubscribe {
    const profilePromise = this.getDoctorProfile();
    const allowedTypes = BITACORA_TYPES;
    const buckets = new Map<string, BitacoraEntry[]>();
    const unsubs: Unsubscribe[] = [];
    const emit = async () => {
      const profile = await profilePromise;
      const merged = Array.from(buckets.values())
        .flat()
        .filter((e) => {
          const row = BITACORA_TYPES.find((r) => r.type === e.type);
          return !!row && canDoctorReadCategory(profile, link, row.category);
        })
        .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
        .slice(0, 200);
      onData(merged);
    };
    for (const row of allowedTypes) {
      const q = query(
        collection(db, 'bitacora', link.patientId, 'entries'),
        where('type', '==', row.type),
        orderBy('timestamp', 'desc'),
        limit(200)
      );
      unsubs.push(
        onSnapshot(
          q,
          (snap) => {
            buckets.set(row.type, snap.docs.map((d) => d.data() as BitacoraEntry));
            void emit();
          },
          (err) => onError?.(err as Error)
        )
      );
    }
    return () => unsubs.forEach((u) => u());
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
