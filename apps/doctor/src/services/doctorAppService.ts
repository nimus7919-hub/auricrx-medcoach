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
  type DoctorOfficeHours,
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
  buildMorningDigest,
  type DigestExceptionEvent,
  type MorningDigestItem,
  buildPreVisitOnePager,
  type PreVisitOnePager,
  createAppointmentRequestDraft,
  markAppointmentRequestReviewed,
  sendAppointmentRequest,
  type AppointmentRequest,
  normalizeOfficeHours,
  evaluateCalendarAgenda,
  type CalendarAgendaResult,
  evaluateThresholdCrossings,
  formatDescriptiveAlertMessage,
  listNeedsActionToday,
  applyDoctorQuickReply,
  buildMessageSummaryExport,
  promoteDueMessages,
  type DoctorPatientMessage,
  type DoctorQuickAction,
  type MessageThreadExport,
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
    legalFullName: string;
    specialty: string;
    country: 'MX' | 'US';
    cedulaNumber?: string;
    specialtyCedulaNumber?: string;
    npiNumber?: string;
    licenseNumber?: string;
    licenseState?: string;
  }): Promise<DoctorProfile> {
    const uid = uidOrThrow();
    const existing = await this.getDoctorProfile(uid);
    const ts = nowIso();
    // Clients never write verified / evidence / expiry — preserve server fields.
    const profile: DoctorProfile = {
      uid,
      displayName: input.displayName.trim(),
      legalFullName: input.legalFullName.trim(),
      specialty: input.specialty.trim(),
      country: input.country,
      cedulaNumber: (input.cedulaNumber || '').trim(),
      specialtyCedulaNumber: (input.specialtyCedulaNumber || '').trim() || undefined,
      npiNumber: (input.npiNumber || '').replace(/\D/g, '') || undefined,
      licenseNumber: (input.licenseNumber || '').trim() || undefined,
      licenseState: (input.licenseState || '').trim().toUpperCase() || undefined,
      verificationStatus: existing?.verificationStatus || 'unverified',
      verificationUpdatedAt: existing?.verificationUpdatedAt,
      verificationMessage: existing?.verificationMessage,
      verifiedAt: existing?.verifiedAt,
      expiresAt: existing?.expiresAt,
      identityProvider: existing?.identityProvider,
      identitySessionId: existing?.identitySessionId,
      identityStatus: existing?.identityStatus,
      doctorPlan: existing?.doctorPlan || false,
      doctorPlanSource: existing?.doctorPlanSource,
      doctorPlanUpdatedAt: existing?.doctorPlanUpdatedAt,
      createdAt: existing?.createdAt || ts,
      updatedAt: ts,
    };
    await setDoc(doc(db, 'doctorProfiles', uid), stripUndefined(profile as any), { merge: true });
    return profile;
  }

  async submitCedulaVerification(): Promise<{
    profile: DoctorProfile;
    result?: {
      status: string;
      identity?: { launchUrl?: string; status?: string; message?: string };
      message?: string;
    };
  }> {
    const uid = uidOrThrow();
    const profile = await this.getDoctorProfile(uid);
    if (!profile) throw new Error('doctor_profile_required');
    // Mark pending locally; server sets pending_review after registry + identity.
    await updateDoc(doc(db, 'doctorProfiles', uid), {
      verificationStatus: 'pending',
      verificationUpdatedAt: nowIso(),
      updatedAt: nowIso(),
    });
    const data = await doctorApi<{
      profile: DoctorProfile;
      result?: {
        status: string;
        identity?: { launchUrl?: string; status?: string; message?: string };
        message?: string;
      };
    }>('/api/doctor/verification/submit', {
      country: profile.country || 'MX',
      legalFullName: profile.legalFullName || profile.displayName,
      specialty: profile.specialty,
      cedulaNumber: profile.cedulaNumber,
      specialtyCedulaNumber: profile.specialtyCedulaNumber,
      npiNumber: profile.npiNumber,
      licenseNumber: profile.licenseNumber,
      licenseState: profile.licenseState,
    });
    return {
      profile: (data.profile as DoctorProfile) || (await this.getDoctorProfile(uid))!,
      result: data.result,
    };
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

  async saveOfficeHours(hours: Partial<DoctorOfficeHours>, timeZone?: string): Promise<DoctorProfile> {
    const uid = uidOrThrow();
    const normalized = normalizeOfficeHours(hours);
    if (timeZone) normalized.timeZone = timeZone;
    const ts = nowIso();
    await updateDoc(doc(db, 'doctorProfiles', uid), {
      officeHours: normalized,
      timeZone: normalized.timeZone,
      updatedAt: ts,
    });
    const dayCount = Object.keys(normalized.windowsByDay).length;
    await this.writeAudit({
      actorId: uid,
      actorRole: 'doctor',
      action: 'office_hours_updated',
      doctorId: uid,
      detail: `tz:${normalized.timeZone};days:${dayCount};paused:${normalized.messagingPaused}`,
    });
    return (await this.getDoctorProfile(uid))!;
  }

  async joinAiInsightsWaitlist(): Promise<DoctorProfile> {
    const uid = uidOrThrow();
    const ts = nowIso();
    await updateDoc(doc(db, 'doctorProfiles', uid), {
      aiInsightsWaitlisted: true,
      aiInsightsWaitlistedAt: ts,
      updatedAt: ts,
    });
    await this.writeAudit({
      actorId: uid,
      actorRole: 'doctor',
      action: 'ai_waitlist_joined',
      doctorId: uid,
    });
    return (await this.getDoctorProfile(uid))!;
  }

  /**
   * Exception-first digest across linked patients (descriptive events only).
   * sinceIso defaults to start of local day.
   */
  async buildExceptionDigest(sinceIso?: string): Promise<MorningDigestItem[]> {
    const uid = uidOrThrow();
    const profile = await this.getDoctorProfile(uid);
    if (!isDoctorEntitled(profile)) return [];
    const since =
      sinceIso ||
      (() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      })();
    const patients = await this.listPatients();
    const events: DigestExceptionEvent[] = [];

    for (const link of patients) {
      const label = link.patientDisplayName || link.patientId.slice(0, 8);
      const [entries, limits, adherence] = await Promise.all([
        this.listBitacoraForPatient(link),
        this.listAlertLimits(link.patientId),
        this.getSharedAdherence(link),
      ]);
      for (const entry of entries) {
        if (entry.timestamp < since) continue;
        if (entry.type === 'symptoms') {
          events.push({
            patientId: link.patientId,
            patientLabel: label,
            kind: 'new_symptom',
            at: entry.timestamp,
            detail: entry.symptomsText,
          });
        }
        const crossings = evaluateThresholdCrossings(entry, limits);
        for (const c of crossings) {
          events.push({
            patientId: link.patientId,
            patientLabel: label,
            kind: 'limit_crossed',
            at: entry.timestamp,
            detail: formatDescriptiveAlertMessage({
              readingType: c.readingType,
              observedValue: c.observedValue,
              observedSecondary:
                entry.type === 'blood_pressure'
                  ? c.readingType === 'systolic'
                    ? entry.diastolic
                    : entry.systolic
                  : undefined,
              limit: c.limit,
              locale: 'es',
            }),
          });
        }
      }
      for (const a of adherence) {
        if (typeof a.adherenceRate === 'number' && a.adherenceRate < 100) {
          events.push({
            patientId: link.patientId,
            patientLabel: label,
            kind: 'missed_dose',
            at: nowIso(),
            detail: `${a.name}${typeof a.adherenceRate === 'number' ? ` · ${a.adherenceRate}%` : ''}`,
          });
        }
      }
      // Documents: Phase 2 sharing — surface zero unless a stub collection appears
      try {
        const docsSnap = await getDocs(
          query(collection(db, 'patientSharedDocuments', link.patientId, 'files'), orderBy('addedAt', 'desc'), limit(5))
        );
        for (const d of docsSnap.docs) {
          const data = d.data() as { name?: string; addedAt?: string };
          if (data.addedAt && data.addedAt >= since) {
            events.push({
              patientId: link.patientId,
              patientLabel: label,
              kind: 'new_document',
              at: data.addedAt,
              detail: data.name || d.id,
            });
          }
        }
      } catch {
        // Collection may not exist yet — ignore
      }
    }

    return buildMorningDigest(events);
  }

  async buildPreVisit(link: PatientDoctorLink, sinceIso?: string): Promise<PreVisitOnePager> {
    const entries = await this.listBitacoraForPatient(link);
    const adherence = await this.getSharedAdherence(link);
    const doseLogs = adherence.map((a) => ({
      name: a.name,
      logged: typeof a.adherenceRate === 'number' ? Math.round(a.adherenceRate) : 0,
      expected: 100,
    }));
    return buildPreVisitOnePager({
      patientLabel: link.patientDisplayName || link.patientId.slice(0, 8),
      entries,
      doseLogs,
      patientQuestions: [],
      documents: [],
      sinceIso,
    });
  }

  async saveAppointmentRequestDraft(input: {
    patientId: string;
    proposedSlotsIso?: string[];
    message?: string;
    locale?: 'en' | 'es';
  }): Promise<AppointmentRequest> {
    const doctorId = uidOrThrow();
    const id = newId('apptreq');
    const draft = createAppointmentRequestDraft(
      {
        id,
        doctorId,
        patientId: input.patientId,
        proposedSlotsIso: input.proposedSlotsIso,
        message: input.message,
      },
      input.locale || 'es'
    );
    await setDoc(doc(db, 'doctorAppointmentRequests', id), draft);
    return draft;
  }

  async reviewAppointmentRequest(id: string): Promise<AppointmentRequest> {
    const snap = await getDoc(doc(db, 'doctorAppointmentRequests', id));
    if (!snap.exists()) throw new Error('not_found');
    const updated = markAppointmentRequestReviewed(snap.data() as AppointmentRequest);
    await setDoc(doc(db, 'doctorAppointmentRequests', id), updated);
    return updated;
  }

  async sendAppointmentRequest(id: string): Promise<AppointmentRequest> {
    const doctorId = uidOrThrow();
    const snap = await getDoc(doc(db, 'doctorAppointmentRequests', id));
    if (!snap.exists()) throw new Error('not_found');
    const updated = sendAppointmentRequest(snap.data() as AppointmentRequest);
    await setDoc(doc(db, 'doctorAppointmentRequests', id), updated);
    await this.writeAudit({
      actorId: doctorId,
      actorRole: 'doctor',
      action: 'appointment_request_sent',
      doctorId,
      patientId: updated.patientId,
      detail: updated.id,
    });
    return updated;
  }

  /** Read-only agenda — OAuth stubbed unless feature flag is on with fresh sync. */
  getTodayAgendaStub(timeZone?: string): CalendarAgendaResult {
    return evaluateCalendarAgenda({
      appointments: [],
      timeZone: timeZone || 'America/Mexico_City',
      lastSyncedAt: undefined,
      featureFlagEnabled: false,
      providerAvailable: false,
    });
  }

  async requestDescriptiveSummary(facts: Record<string, unknown>, language: string) {
    return doctorApi('/api/doctor/summary/descriptive', { facts, language });
  }

  async listMessagesForDoctor(): Promise<DoctorPatientMessage[]> {
    const doctorId = uidOrThrow();
    const profile = await this.getDoctorProfile(doctorId);
    if (!isDoctorEntitled(profile)) return [];
    const snap = await getDocs(
      query(collection(db, 'doctorPatientMessages'), where('doctorId', '==', doctorId), orderBy('createdAt', 'desc'), limit(100))
    );
    const raw = snap.docs.map((d) => d.data() as DoctorPatientMessage);
    // Promote due queued items locally when a doctor window is open and not paused
    const promoted = promoteDueMessages(raw, nowIso(), profile?.officeHours);
    for (let i = 0; i < raw.length; i++) {
      if (raw[i].status === 'queued' && promoted[i].status === 'pending_doctor') {
        try {
          await updateDoc(doc(db, 'doctorPatientMessages', raw[i].id), {
            status: 'pending_doctor',
            updatedAt: nowIso(),
          });
        } catch {
          /* rules may block status-only promote without action — list still shows via client filter */
        }
      }
    }
    return promoted;
  }

  async listNeedsActionInbox(): Promise<DoctorPatientMessage[]> {
    const doctorId = uidOrThrow();
    const profile = await this.getDoctorProfile(doctorId);
    const all = await this.listMessagesForDoctor();
    return listNeedsActionToday(all, nowIso(), profile?.officeHours);
  }

  async replyToMessage(
    messageId: string,
    action: DoctorQuickAction,
    replyText?: string,
    language: string = 'es'
  ): Promise<DoctorPatientMessage> {
    const doctorId = uidOrThrow();
    const snap = await getDoc(doc(db, 'doctorPatientMessages', messageId));
    if (!snap.exists()) throw new Error('not_found');
    const current = snap.data() as DoctorPatientMessage;
    if (current.doctorId !== doctorId) throw new Error('forbidden');
    const updated = applyDoctorQuickReply(current, action, replyText);
    await setDoc(doc(db, 'doctorPatientMessages', messageId), updated);
    await this.writeAudit({
      actorId: doctorId,
      actorRole: 'doctor',
      action: 'message_replied',
      doctorId,
      patientId: updated.patientId,
      linkId: updated.linkId,
      detail: action,
    });
    try {
      await doctorApi('/api/doctor/messages/notify', {
        toUserId: updated.patientId,
        role: 'patient',
        language,
        messageId,
        channel: 'push',
      });
    } catch {
      /* notify is best-effort */
    }
    return updated;
  }

  async exportMessageSummaryForPatient(
    patientId: string,
    locale: 'en' | 'es' = 'es'
  ): Promise<MessageThreadExport> {
    const doctorId = uidOrThrow();
    const snap = await getDocs(
      query(
        collection(db, 'doctorPatientMessages'),
        where('doctorId', '==', doctorId),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'asc'),
        limit(200)
      )
    );
    const messages = snap.docs.map((d) => d.data() as DoctorPatientMessage);
    const exported = buildMessageSummaryExport(messages, {
      locale,
      doctorLabel: (await this.getDoctorProfile(doctorId))?.displayName,
    });
    await this.writeAudit({
      actorId: doctorId,
      actorRole: 'doctor',
      action: 'message_export',
      doctorId,
      patientId,
      detail: `lines:${exported.lines.length}`,
    });
    return exported;
  }
}

export default DoctorAppService;
