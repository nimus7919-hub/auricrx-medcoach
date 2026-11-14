/**
 * Shared types and formatters for the doctor-app view of a confirmed
 * pre-visit intake (descriptive only). Mirrors the PR #36 patient contract.
 */

export type IntakeLocale = 'en' | 'es';

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
