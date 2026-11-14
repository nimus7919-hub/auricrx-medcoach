/**
 * Shared types and formatters for the doctor-app view of a confirmed
 * pre-visit intake (descriptive only). Mirrors the PR #36 patient contract.
 */

export type IntakeLocale = 'en' | 'es';

export const BODY_LAYERS = ['skin', 'muscles', 'vessels', 'bones', 'organs'] as const;
export type BodyLayer = (typeof BODY_LAYERS)[number];
export const BODY_VIEWS = ['front', 'back'] as const;
export type BodyView = (typeof BODY_VIEWS)[number];
export const PAIN_FEELS = ['sharp', 'dull', 'burning', 'throbbing', 'tingling', 'aching'] as const;
export type PainFeel = (typeof PAIN_FEELS)[number];
/** Wire values from PR #39 (today | days | weeks | months | unsure). */
export const PAIN_ONSETS = ['today', 'days', 'weeks', 'months', 'unsure'] as const;
export type PainOnset = (typeof PAIN_ONSETS)[number];

export interface BodyPainMarkerPayload {
  layer: BodyLayer;
  view: BodyView;
  regionId: string;
  regionLabel: string;
  layerLabel: string;
  position: { x: number; y: number };
  intensity: number | null;
  feels: PainFeel[];
  onset: PainOnset | null;
  note: string | null;
}

export interface BodyPainMapPayload {
  version: 1;
  locale: IntakeLocale;
  reportedAt: string;
  markers: BodyPainMarkerPayload[];
}

export function sideFromRegionId(regionId: string): 'left' | 'right' | null {
  if (String(regionId).endsWith('_left')) return 'left';
  if (String(regionId).endsWith('_right')) return 'right';
  return null;
}


export type IntakeSessionStatus =
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'discarded';

export interface IntakeSummary {
  mainConcern: string | null;
  location: string | null;
  duration: string | null;
  /** Patient-reported 1–10 number, shown as "Patient said N / 10". Never a score. */
  severityReported: number | null;
  alsoMentioned: string[];
  questionsForDoctor: string[];
  bodyPainMap?: BodyPainMapPayload | null;
  locale: IntakeLocale;
  generatedAt: string;
}

export interface IntakeTurn {
  id: string;
  role: 'patient' | 'assistant' | 'system';
  text: string;
  createdAt: string;
}

export interface IntakeConsent {
  acceptedAt: string;
  noticeVersion: string;
  emergencyDisclaimerVersion: string;
}

export interface IntakeSession {
  id: string;
  appointmentId: string;
  appointmentStartIso: string;
  appointmentRequestId?: string | null;
  patientId: string;
  doctorId: string;
  doctorDisplayName: string;
  locale: IntakeLocale;
  status: IntakeSessionStatus;
  consent: IntakeConsent;
  turns: IntakeTurn[];
  followUpsAsked: number;
  summary: IntakeSummary | null;
  patientComment: string | null;
  createdAt: string;
  updatedAt: string;
  sharedAt: string | null;
  rawChatDeleteAt: string;
  rawChatDeletedAt: string | null;
  bodyPainMap?: BodyPainMapPayload | null;
}

/** Display helper — never treat this number as a risk score. */
export function formatPatientReportedSeverity(
  n: number | null | undefined,
  notMentioned = 'Not mentioned'
): string {
  if (n == null || !Number.isInteger(n) || n < 1 || n > 10) return notMentioned;
  return `Patient said ${n} / 10`;
}

export function formatPatientReportedSeverityEs(
  n: number | null | undefined,
  notMentioned = 'No se mencionó'
): string {
  if (n == null || !Number.isInteger(n) || n < 1 || n > 10) return notMentioned;
  return `La persona indicó ${n} / 10`;
}
