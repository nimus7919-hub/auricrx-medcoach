/**
 * Patient-app Doctor linking + Bitácora orchestration (Phase 1).
 * Live shared data lives in Firebase. Doctor clinical UI is in apps/doctor.
 * Pure access rules: packages/doctor-core (re-exported via src/doctor).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
import {
  type BitacoraEntry,
  type BitacoraEntryType,
  type ConsentMap,
  type DoctorAlertLimit,
  type DoctorInvite,
  type DoctorProfile,
  type PatientDoctorLink,
  type AuditLogEntry,
  type AlertReadingType,
  type AlertComparator,
  type GlucoseTiming,
  defaultConsent,
  CONSENT_CATEGORIES,
} from '../doctor/types';
import { getCedulaVerificationProvider } from '../doctor/verification/MockCedulaProvider';
import {
  getLocalDoctorPlan,
  setLocalDoctorPlan,
  type DoctorPlanSource,
} from '../doctor/entitlements/doctorPlanEntitlement';
import { generateInviteCode, inviteExpiresAt, isInviteExpired, normalizeInviteCode } from '../doctor/invites';
import { canDoctorReadCategory, canDoctorSeePatientData, isDoctorEntitled } from '../doctor/accessRules';
import { evaluateThresholdCrossings } from '../doctor/thresholds';
import { API_BASE } from '../config/api';
import { authenticatedFetch } from './authenticatedFetch';

const LOCAL_BITACORA = 'doctorMode:bitacora';
const INVITE_TTL_MINUTES = 30;

function uidOrThrow(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('not_authenticated');
  return uid;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

class DoctorModeService {
  private static instance: DoctorModeService;

  static getInstance(): DoctorModeService {
    if (!DoctorModeService.instance) {
      DoctorModeService.instance = new DoctorModeService();
    }
    return DoctorModeService.instance;
  }

  // ─── Doctor profile / entitlement / verification ─────────────────

  async getDoctorProfile(uid?: string): Promise<DoctorProfile | null> {
    const id = uid || auth.currentUser?.uid;
    if (!id) return null;
    const snap = await getDoc(doc(db, 'doctorProfiles', id));
    return snap.exists() ? (snap.data() as DoctorProfile) : null;
  }

  async enableDoctorMode(input: {
    displayName: string;
    specialty: string;
    cedulaNumber: string;
  }): Promise<DoctorProfile> {
    const uid = uidOrThrow();
    const existing = await this.getDoctorProfile(uid);
    const localPlan = await getLocalDoctorPlan();
    const doctorPlan = existing?.doctorPlan ?? localPlan?.doctorPlan ?? false;
    const ts = nowIso();

    const profile: DoctorProfile = {
      uid,
      displayName: input.displayName.trim(),
      specialty: input.specialty.trim(),
      cedulaNumber: input.cedulaNumber.trim(),
      verificationStatus: existing?.verificationStatus || 'unverified',
      verificationUpdatedAt: existing?.verificationUpdatedAt,
      verificationMessage: existing?.verificationMessage,
      doctorPlan,
      doctorPlanSource: existing?.doctorPlanSource || localPlan?.source,
      doctorPlanUpdatedAt: existing?.doctorPlanUpdatedAt || localPlan?.updatedAt,
      createdAt: existing?.createdAt || ts,
      updatedAt: ts,
    };

    await setDoc(doc(db, 'doctorProfiles', uid), stripUndefined(profile as unknown as Record<string, unknown>), {
      merge: true,
    });
    await this.writeAudit({
      actorId: uid,
      actorRole: 'doctor',
      action: 'verification_submitted',
      doctorId: uid,
      detail: 'doctor_profile_saved',
    });
    return profile;
  }

  async submitCedulaVerification(): Promise<DoctorProfile> {
    const uid = uidOrThrow();
    const profile = await this.getDoctorProfile(uid);
    if (!profile) throw new Error('doctor_profile_required');

    const provider = getCedulaVerificationProvider();
    // Mark pending immediately
    await updateDoc(doc(db, 'doctorProfiles', uid), {
      verificationStatus: 'pending',
      verificationUpdatedAt: nowIso(),
      verificationMessage: 'Submitted',
      updatedAt: nowIso(),
    });

    const result = await provider.submit({
      fullName: profile.displayName,
      cedulaNumber: profile.cedulaNumber,
      specialty: profile.specialty,
      country: 'MX',
    });

    const updated: Partial<DoctorProfile> = {
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

  /**
   * Mock doctor-plan grant. Clean seam for future IAP/Stripe.
   */
  async setDoctorPlan(enabled: boolean, source: DoctorPlanSource = 'mock'): Promise<DoctorProfile> {
    const uid = uidOrThrow();
    const local = await setLocalDoctorPlan(enabled, source);
    const profile = await this.getDoctorProfile(uid);
    if (!profile) {
      // Allow setting plan before full profile — store stub
      const stub: DoctorProfile = {
        uid,
        displayName: '',
        specialty: '',
        cedulaNumber: '',
        verificationStatus: 'unverified',
        doctorPlan: enabled,
        doctorPlanSource: source,
        doctorPlanUpdatedAt: local.updatedAt,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      await setDoc(doc(db, 'doctorProfiles', uid), stub, { merge: true });
      return stub;
    }
    const updated = {
      doctorPlan: enabled,
      doctorPlanSource: source,
      doctorPlanUpdatedAt: local.updatedAt,
      updatedAt: nowIso(),
    };
    await updateDoc(doc(db, 'doctorProfiles', uid), updated);
    await this.writeAudit({
      actorId: uid,
      actorRole: 'doctor',
      action: 'doctor_plan_updated',
      doctorId: uid,
      detail: `${enabled}:${source}`,
    });
    return { ...profile, ...updated };
  }

  async isDoctorReady(): Promise<boolean> {
    const profile = await this.getDoctorProfile();
    return isDoctorEntitled(profile);
  }

  // ─── Invites & linking ───────────────────────────────────────────

  async createInvite(role: 'patient' | 'doctor'): Promise<DoctorInvite> {
    const createdBy = uidOrThrow();
    const code = generateInviteCode(role === 'doctor' ? 'DR' : 'PT');
    const invite: DoctorInvite = {
      code,
      createdBy,
      role,
      expiresAt: inviteExpiresAt(INVITE_TTL_MINUTES),
      createdAt: nowIso(),
      consumed: false,
    };
    await setDoc(doc(db, 'doctorInvites', code), invite);
    return invite;
  }

  async getInvite(code: string): Promise<DoctorInvite | null> {
    const normalized = normalizeInviteCode(code);
    if (!normalized) return null;
    const snap = await getDoc(doc(db, 'doctorInvites', normalized));
    if (!snap.exists()) return null;
    return snap.data() as DoctorInvite;
  }

  /**
   * Patient confirms link after scanning/entering a doctor code (or doctor uses patient code).
   * Consent toggles default OFF — patient must opt in per category.
   */
  async confirmLinkWithInvite(
    code: string,
    opts: {
      actingAs: 'patient' | 'doctor';
      otherDisplayName?: string;
      selfDisplayName?: string;
      consent?: Partial<ConsentMap>;
    }
  ): Promise<PatientDoctorLink> {
    const uid = uidOrThrow();
    const invite = await this.getInvite(code);
    if (!invite || invite.consumed) throw new Error('invalid_invite');
    if (isInviteExpired(invite.expiresAt)) throw new Error('expired_invite');
    if (invite.createdBy === uid) throw new Error('cannot_link_self');

    let patientId: string;
    let doctorId: string;
    if (opts.actingAs === 'patient') {
      // Patient redeeming a doctor invite
      if (invite.role !== 'doctor') throw new Error('invite_role_mismatch');
      patientId = uid;
      doctorId = invite.createdBy;
    } else {
      // Doctor redeeming a patient invite
      if (invite.role !== 'patient') throw new Error('invite_role_mismatch');
      doctorId = uid;
      patientId = invite.createdBy;
      const doctorProfile = await this.getDoctorProfile(doctorId);
      if (!isDoctorEntitled(doctorProfile)) throw new Error('doctor_not_ready');
    }

    const linkId = newId('link');
    const consent = { ...defaultConsent(), ...(opts.consent || {}) };
    const ts = nowIso();
    const link: PatientDoctorLink = {
      id: linkId,
      patientId,
      doctorId,
      patientDisplayName: opts.actingAs === 'patient' ? opts.selfDisplayName : opts.otherDisplayName,
      doctorDisplayName: opts.actingAs === 'doctor' ? opts.selfDisplayName : opts.otherDisplayName,
      status: 'active',
      consent,
      createdAt: ts,
      updatedAt: ts,
      confirmedAt: ts,
      inviteCode: invite.code,
    };

    await setDoc(doc(db, 'doctorLinks', linkId), stripUndefined(link as unknown as Record<string, unknown>));
    await this.syncPatientAccessMirror(link);
    await updateDoc(doc(db, 'doctorInvites', invite.code), {
      consumed: true,
      consumedBy: uid,
      consumedAt: ts,
    });
    await this.writeAudit({
      actorId: uid,
      actorRole: opts.actingAs,
      action: 'link_confirmed',
      patientId,
      doctorId,
      linkId,
      detail: invite.code,
    });
    return link;
  }

  /** Denormalized mirror so Firestore rules can authorize doctor category reads. */
  private async syncPatientAccessMirror(link: PatientDoctorLink): Promise<void> {
    const accessId = `${link.doctorId}_${link.patientId}`;
    await setDoc(doc(db, 'doctorPatientAccess', accessId), {
      accessId,
      doctorId: link.doctorId,
      patientId: link.patientId,
      linkId: link.id,
      status: link.status,
      consent: link.consent,
      updatedAt: nowIso(),
    });
  }

  async listLinksForCurrentUser(): Promise<PatientDoctorLink[]> {
    const uid = uidOrThrow();
    const [asPatient, asDoctor] = await Promise.all([
      getDocs(query(collection(db, 'doctorLinks'), where('patientId', '==', uid))),
      getDocs(query(collection(db, 'doctorLinks'), where('doctorId', '==', uid))),
    ]);
    const map = new Map<string, PatientDoctorLink>();
    asPatient.forEach((d) => map.set(d.id, d.data() as PatientDoctorLink));
    asDoctor.forEach((d) => map.set(d.id, d.data() as PatientDoctorLink));
    return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getLink(linkId: string): Promise<PatientDoctorLink | null> {
    const snap = await getDoc(doc(db, 'doctorLinks', linkId));
    return snap.exists() ? (snap.data() as PatientDoctorLink) : null;
  }

  async updateConsent(linkId: string, consentUpdates: Partial<ConsentMap>): Promise<PatientDoctorLink> {
    const uid = uidOrThrow();
    const link = await this.getLink(linkId);
    if (!link) throw new Error('link_not_found');
    if (link.patientId !== uid) throw new Error('only_patient_updates_consent');
    if (link.status !== 'active') throw new Error('link_not_active');

    const consent = { ...link.consent, ...consentUpdates };
    // Ensure only known keys
    for (const key of Object.keys(consent) as (keyof ConsentMap)[]) {
      if (!CONSENT_CATEGORIES.includes(key)) delete (consent as any)[key];
    }
    const updatedAt = nowIso();
    await updateDoc(doc(db, 'doctorLinks', linkId), { consent, updatedAt });
    const updated = { ...link, consent, updatedAt };
    await this.syncPatientAccessMirror(updated);
    await this.writeAudit({
      actorId: uid,
      actorRole: 'patient',
      action: 'consent_updated',
      patientId: link.patientId,
      doctorId: link.doctorId,
      linkId,
      detail: JSON.stringify(consentUpdates),
    });
    return updated;
  }

  async revokeLink(linkId: string): Promise<PatientDoctorLink> {
    const uid = uidOrThrow();
    const link = await this.getLink(linkId);
    if (!link) throw new Error('link_not_found');
    if (link.patientId !== uid && link.doctorId !== uid) throw new Error('not_link_participant');
    const revokedAt = nowIso();
    await updateDoc(doc(db, 'doctorLinks', linkId), {
      status: 'revoked',
      revokedAt,
      updatedAt: revokedAt,
    });
    const updated = { ...link, status: 'revoked' as const, revokedAt, updatedAt: revokedAt };
    await this.syncPatientAccessMirror(updated);
    await this.writeAudit({
      actorId: uid,
      actorRole: link.patientId === uid ? 'patient' : 'doctor',
      action: 'link_revoked',
      patientId: link.patientId,
      doctorId: link.doctorId,
      linkId,
    });
    return updated;
  }

  /** Active linked patients visible to an entitled+verified doctor. */
  async listDoctorPatients(): Promise<PatientDoctorLink[]> {
    const uid = uidOrThrow();
    const profile = await this.getDoctorProfile(uid);
    if (!isDoctorEntitled(profile)) return [];
    const links = await this.listLinksForCurrentUser();
    return links.filter((l) => l.doctorId === uid && l.status === 'active');
  }

  // ─── Bitácora ────────────────────────────────────────────────────

  private async loadLocalBitacora(patientId: string): Promise<BitacoraEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(`${LOCAL_BITACORA}:${patientId}`);
      return raw ? (JSON.parse(raw) as BitacoraEntry[]) : [];
    } catch {
      return [];
    }
  }

  private async saveLocalBitacora(patientId: string, entries: BitacoraEntry[]): Promise<void> {
    await AsyncStorage.setItem(`${LOCAL_BITACORA}:${patientId}`, JSON.stringify(entries));
  }

  async addBitacoraEntry(input: {
    type: BitacoraEntryType;
    timestamp?: string;
    note?: string;
    systolic?: number;
    diastolic?: number;
    pulse?: number;
    glucoseMgDl?: number;
    glucoseTiming?: GlucoseTiming;
    weightKg?: number;
    symptomsText?: string;
  }): Promise<BitacoraEntry> {
    const patientId = uidOrThrow();
    const ts = nowIso();
    const entry: BitacoraEntry = stripUndefined({
      id: newId('bit'),
      patientId,
      type: input.type,
      timestamp: input.timestamp || ts,
      note: input.note,
      systolic: input.systolic,
      diastolic: input.diastolic,
      pulse: input.pulse,
      glucoseMgDl: input.glucoseMgDl,
      glucoseTiming: input.glucoseTiming,
      weightKg: input.weightKg,
      symptomsText: input.symptomsText,
      createdAt: ts,
      updatedAt: ts,
      source: 'bitacora',
    }) as BitacoraEntry;

    // Local first
    const local = await this.loadLocalBitacora(patientId);
    local.unshift(entry);
    await this.saveLocalBitacora(patientId, local);

    // Firestore
    await setDoc(
      doc(db, 'bitacora', patientId, 'entries', entry.id),
      stripUndefined(entry as unknown as Record<string, unknown>)
    );

    // Notify Render backend to evaluate doctor alert thresholds
    try {
      await authenticatedFetch(`${API_BASE}/api/doctor/alerts/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: entry.id, patientId }),
      });
    } catch (err) {
      console.warn('Doctor alert evaluate call failed (non-blocking):', err);
    }

    return entry;
  }

  async listBitacoraEntries(patientId?: string, max = 200): Promise<BitacoraEntry[]> {
    const id = patientId || uidOrThrow();
    try {
      const q = query(
        collection(db, 'bitacora', id, 'entries'),
        orderBy('timestamp', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      const remote = snap.docs.map((d) => d.data() as BitacoraEntry);
      if (remote.length) {
        if (id === auth.currentUser?.uid) await this.saveLocalBitacora(id, remote);
        return remote;
      }
    } catch (err) {
      console.warn('Bitácora remote list failed, using local:', err);
    }
    return this.loadLocalBitacora(id);
  }

  subscribeBitacora(
    patientId: string,
    onData: (entries: BitacoraEntry[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'bitacora', patientId, 'entries'),
      orderBy('timestamp', 'desc'),
      limit(200)
    );
    return onSnapshot(
      q,
      (snap) => {
        const entries = snap.docs.map((d) => d.data() as BitacoraEntry);
        onData(entries);
      },
      (err) => onError?.(err as Error)
    );
  }

  /**
   * Doctor-safe read: filters by consent client-side; rules also enforce.
   */
  async listBitacoraForDoctor(linkId: string): Promise<BitacoraEntry[]> {
    const uid = uidOrThrow();
    const link = await this.getLink(linkId);
    const profile = await this.getDoctorProfile(uid);
    if (!canDoctorSeePatientData(profile, link) || !link) return [];

    const entries = await this.listBitacoraEntries(link.patientId);
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
      linkId,
      detail: `bitacora:${filtered.length}`,
    });

    return filtered;
  }

  // ─── Alert limits ────────────────────────────────────────────────

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

    const links = await this.listLinksForCurrentUser();
    const link = links.find(
      (l) => l.doctorId === doctorId && l.patientId === input.patientId && l.status === 'active'
    );
    if (!link) throw new Error('no_active_link');

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

  async deleteAlertLimit(limitId: string): Promise<void> {
    const doctorId = uidOrThrow();
    const snap = await getDoc(doc(db, 'doctorAlertLimits', limitId));
    if (!snap.exists()) return;
    const data = snap.data() as DoctorAlertLimit;
    if (data.doctorId !== doctorId) throw new Error('not_owner');
    await updateDoc(doc(db, 'doctorAlertLimits', limitId), { enabled: false, updatedAt: nowIso() });
  }

  /** Pure helper exposed for tests / server parity. */
  evaluateEntryAgainstLimits(entry: BitacoraEntry, limits: DoctorAlertLimit[]) {
    return evaluateThresholdCrossings(entry, limits);
  }

  // ─── Push token ──────────────────────────────────────────────────

  async registerPushToken(expoPushToken: string, platform?: string): Promise<void> {
    const uid = uidOrThrow();
    await setDoc(doc(db, 'doctorPushTokens', uid), {
      uid,
      expoPushToken,
      platform: platform || undefined,
      updatedAt: nowIso(),
    });
  }

  // ─── Audit ───────────────────────────────────────────────────────

  async writeAudit(
    entry: Omit<AuditLogEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
  ): Promise<void> {
    const id = entry.id || newId('audit');
    const docData: AuditLogEntry = {
      ...entry,
      id,
      createdAt: entry.createdAt || nowIso(),
    };
    try {
      await setDoc(doc(db, 'doctorAuditLogs', id), stripUndefined(docData as unknown as Record<string, unknown>));
    } catch (err) {
      console.warn('Audit log write failed:', err);
    }
  }

  async listAuditLogs(opts: { patientId?: string; doctorId?: string; max?: number } = {}): Promise<AuditLogEntry[]> {
    const uid = uidOrThrow();
    // Patients see their logs; doctors see theirs
    const field = opts.patientId ? 'patientId' : 'doctorId';
    const value = opts.patientId || opts.doctorId || uid;
    const snap = await getDocs(
      query(collection(db, 'doctorAuditLogs'), where(field, '==', value), orderBy('createdAt', 'desc'), limit(opts.max || 100))
    );
    return snap.docs.map((d) => d.data() as AuditLogEntry);
  }
}

export default DoctorModeService;
