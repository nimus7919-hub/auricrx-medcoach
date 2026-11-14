/**
 * Typed client contract for the patient-side pre-visit intake.
 * The server side (Render + Neon + Firestore) is owned by the doctor-app engineer; see PR #35.
 * The client never calls a model directly. All model output arrives from the server, already filtered.
 */

import type { BodyPainMapPayload } from '../../components/bodyMap/types';

export type { BodyPainMapPayload, BodyPainMarkerPayload } from '../../components/bodyMap/types';

export type IntakeLocale = 'en' | 'es';

export type IntakeSessionStatus =
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'confirmed' // confirmed by the patient and shared with the selected doctor
  | 'discarded';

export interface IntakeDoctor {
  /** Doctor uid (doctorLinks.doctorId). */
  id: string;
  displayName: string;
  /** doctorLinks id the share is authorized by. */
  linkId: string;
}

export interface IntakeConsent {
  acceptedAt: string;
  noticeVersion: string;
  emergencyDisclaimerVersion: string;
}

export interface IntakeTurn {
  id: string;
  role: 'patient' | 'assistant';
  text: string;
  createdAt: string;
}

/**
 * Fixed-field summary (PR #35 §6). Values are the patient's own words, or null for "Not mentioned".
 * No diagnosis / interpretation fields exist on purpose.
 */
export interface IntakeSummary {
  mainConcern: string | null;
  location: string | null;
  duration: string | null;
  /** Patient-reported 1–10 number, shown as "Patient said N / 10". Never a score. */
  severityReported: number | null;
  alsoMentioned: string[];
  questionsForDoctor: string[];
  /**
   * Patient-reported body map (layer + region + the patient's own descriptors), copied as-is.
   * Optional/nullable: servers that don't support it can omit it. Never interpreted.
   */
  bodyPainMap?: BodyPainMapPayload | null;
  locale: IntakeLocale;
  generatedAt: string;
}

export interface IntakeSession {
  id: string;
  appointmentId: string;
  appointmentStartIso: string;
  doctorId: string;
  doctorDisplayName: string;
  locale: IntakeLocale;
  status: IntakeSessionStatus;
  consent: IntakeConsent;
  turns: IntakeTurn[];
  followUpsAsked: number;
  summary: IntakeSummary | null;
  /** Patient's own comment shown with (not merged into) the read-only summary. */
  patientComment: string | null;
  createdAt: string;
  updatedAt: string;
  sharedAt: string | null;
  /** When the raw chat is auto-deleted (appointment start + retention days). */
  rawChatDeleteAt: string;
  rawChatDeletedAt: string | null;
  /** Patient-reported body map for this intake, or null/absent when skipped or unsupported. */
  bodyPainMap?: BodyPainMapPayload | null;
}

export interface StartSessionInput {
  appointmentId: string;
  appointmentStartIso: string;
  doctorId: string;
  locale: IntakeLocale;
  consent: IntakeConsent;
}

export interface StartSessionResult {
  session: IntakeSession;
  firstMessage: IntakeTurn;
}

export interface SendMessageResult {
  patientTurn: IntakeTurn;
  /** Next allowed question, or null when the interview is done. */
  reply: IntakeTurn | null;
  done: boolean;
}

export interface PreVisitIntakeClient {
  readonly mode: 'mock' | 'http';
  /** Doctors with an ACTIVE link to the signed-in patient (only they can receive an intake). */
  listEligibleDoctors(): Promise<IntakeDoctor[]>;
  startSession(input: StartSessionInput): Promise<StartSessionResult>;
  sendMessage(sessionId: string, text: string): Promise<SendMessageResult>;
  getSummary(sessionId: string): Promise<IntakeSummary>;
  addComment(sessionId: string, comment: string): Promise<IntakeSession>;
  confirmAndShare(sessionId: string): Promise<IntakeSession>;
  discard(sessionId: string): Promise<void>;
  deleteChat(sessionId: string): Promise<IntakeSession>;
  listSessionsForAppointment(appointmentId: string): Promise<IntakeSession[]>;
  /**
   * Attach (or clear with null) the patient-reported body map before the chat summary is built.
   * Optional so older clients/servers keep working; the flow skips it when absent.
   */
  submitBodyPainMap?(sessionId: string, payload: BodyPainMapPayload | null): Promise<IntakeSession>;
}
