/**
 * Doctor Mode Phase 1 — shared types.
 * Kept framework-agnostic so the same model can power a future web portal.
 */

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type ConsentCategory =
  | 'bloodPressure'
  | 'glucose'
  | 'weight'
  | 'symptoms'
  | 'medicationList'
  | 'reminderAdherence';

export type BitacoraEntryType = 'blood_pressure' | 'glucose' | 'weight' | 'symptoms';

export type GlucoseTiming = 'fasting' | 'after_meal' | 'other';

export type LinkStatus = 'pending' | 'active' | 'revoked';

export type InviteRole = 'patient' | 'doctor';

export type AlertReadingType = 'systolic' | 'diastolic' | 'pulse' | 'glucose' | 'weight';

export type AlertComparator = 'gt' | 'gte' | 'lt' | 'lte';

/** Per-category consent. All default OFF. */
export type ConsentMap = Record<ConsentCategory, boolean>;

export const CONSENT_CATEGORIES: ConsentCategory[] = [
  'bloodPressure',
  'glucose',
  'weight',
  'symptoms',
  'medicationList',
  'reminderAdherence',
];

export function defaultConsent(): ConsentMap {
  return {
    bloodPressure: false,
    glucose: false,
    weight: false,
    symptoms: false,
    medicationList: false,
    reminderAdherence: false,
  };
}

/** Multi-window schedule; see packages/doctor-core/src/phase1/officeHours.ts */
export interface DoctorOfficeHours {
  timeZone: string;
  messagingPaused: boolean;
  windowsByDay: Record<string, Array<{ startMinutes: number; endMinutes: number }>>;
  /** @deprecated legacy fields — still read by normalizeOfficeHours */
  days?: number[];
  startHour?: number;
  endHour?: number;
  enabled?: boolean;
}

export interface DoctorProfile {
  uid: string;
  displayName: string;
  specialty: string;
  cedulaNumber: string;
  verificationStatus: VerificationStatus;
  verificationUpdatedAt?: string;
  verificationMessage?: string;
  /** Entitlement flag — seam for future IAP/Stripe doctor plan. */
  doctorPlan: boolean;
  doctorPlanSource?: 'mock' | 'iap' | 'stripe' | 'admin';
  doctorPlanUpdatedAt?: string;
  /** IANA timezone for agenda display and office hours. */
  timeZone?: string;
  /** When patient messages are expected; outside window is not for emergencies. */
  officeHours?: DoctorOfficeHours;
  /** AI insights waitlist only (feature disabled in Phase 1). */
  aiInsightsWaitlisted?: boolean;
  aiInsightsWaitlistedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** ISO string or Firestore Timestamp-like (kept SDK-agnostic). */
export type FirestoreTime =
  | string
  | Date
  | { toDate: () => Date; seconds?: number }
  | { seconds: number; nanoseconds?: number };

export interface DoctorInvite {
  code: string;
  createdBy: string;
  role: InviteRole;
  expiresAt: FirestoreTime;
  createdAt: string;
  consumed?: boolean;
  consumedBy?: string;
  consumedAt?: FirestoreTime;
}

export interface PatientDoctorLink {
  id: string;
  patientId: string;
  doctorId: string;
  patientDisplayName?: string;
  doctorDisplayName?: string;
  status: LinkStatus;
  consent: ConsentMap;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  revokedAt?: string;
  inviteCode?: string;
}

export interface BitacoraEntry {
  id: string;
  patientId: string;
  type: BitacoraEntryType;
  timestamp: string;
  note?: string;
  /** Blood pressure */
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  /** Glucose mg/dL */
  glucoseMgDl?: number;
  glucoseTiming?: GlucoseTiming;
  /** Weight kg */
  weightKg?: number;
  /** Free-text symptoms */
  symptomsText?: string;
  createdAt: string;
  updatedAt: string;
  source?: 'bitacora' | 'health_metrics';
}

export interface DoctorAlertLimit {
  id: string;
  doctorId: string;
  patientId: string;
  readingType: AlertReadingType;
  comparator: AlertComparator;
  value: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: 'patient' | 'doctor' | 'system';
  action:
    | 'link_created'
    | 'link_confirmed'
    | 'link_revoked'
    | 'consent_updated'
    | 'doctor_read'
    | 'alert_triggered'
    | 'verification_submitted'
    | 'verification_updated'
    | 'doctor_plan_updated'
    | 'appointment_request_sent'
    | 'office_hours_updated'
    | 'ai_waitlist_joined'
    | 'consent_revoked'
    | 'message_sent'
    | 'message_replied'
    | 'message_export';
  patientId?: string;
  doctorId?: string;
  linkId?: string;
  category?: ConsentCategory | AlertReadingType | string;
  detail?: string;
  createdAt: string;
}

export interface PushTokenRecord {
  uid: string;
  expoPushToken: string;
  updatedAt: string;
  platform?: string;
}

/** Maps bitácora / consent categories for rule checks. */
export const ENTRY_TYPE_TO_CONSENT: Record<BitacoraEntryType, ConsentCategory> = {
  blood_pressure: 'bloodPressure',
  glucose: 'glucose',
  weight: 'weight',
  symptoms: 'symptoms',
};

export const READING_TYPE_TO_CONSENT: Record<AlertReadingType, ConsentCategory> = {
  systolic: 'bloodPressure',
  diastolic: 'bloodPressure',
  pulse: 'bloodPressure',
  glucose: 'glucose',
  weight: 'weight',
};
