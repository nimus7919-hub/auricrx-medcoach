/**
 * One-tap appointment request. Doctor drafts → reviews → sends.
 * Administrative copy only. Does not write to calendar.
 */

export type AppointmentRequestStatus =
  | 'draft'
  | 'pending_doctor_review'
  | 'sent'
  | 'patient_accepted'
  | 'patient_counter'
  | 'cancelled';

export interface AppointmentRequest {
  id: string;
  doctorId: string;
  patientId: string;
  status: AppointmentRequestStatus;
  /** Optional proposed slots as ISO strings in UTC. */
  proposedSlotsIso: string[];
  message: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  sentAt?: string;
  patientReply?: string;
}

export interface AppointmentRequestDraftInput {
  id: string;
  doctorId: string;
  patientId: string;
  proposedSlotsIso?: string[];
  message?: string;
  nowIso?: string;
}

const DEFAULT_MESSAGE_EN =
  'Your doctor requests an appointment. Please reply with a time that works, or accept one of the proposed times.';
const DEFAULT_MESSAGE_ES =
  'Su médico solicita una cita. Responda con un horario que le convenga, o acepte uno de los horarios propuestos.';

export function createAppointmentRequestDraft(
  input: AppointmentRequestDraftInput,
  locale: 'en' | 'es' = 'es'
): AppointmentRequest {
  const now = input.nowIso || new Date().toISOString();
  return {
    id: input.id,
    doctorId: input.doctorId,
    patientId: input.patientId,
    status: 'draft',
    proposedSlotsIso: (input.proposedSlotsIso || []).filter(Boolean).slice(0, 3),
    message: (input.message || (locale === 'en' ? DEFAULT_MESSAGE_EN : DEFAULT_MESSAGE_ES)).trim(),
    createdAt: now,
    updatedAt: now,
  };
}

/** Doctor must explicitly mark reviewed before send. */
export function markAppointmentRequestReviewed(
  req: AppointmentRequest,
  nowIso = new Date().toISOString()
): AppointmentRequest {
  if (req.status === 'sent' || req.status === 'cancelled') return req;
  return {
    ...req,
    status: 'pending_doctor_review',
    reviewedAt: nowIso,
    updatedAt: nowIso,
  };
}

export function sendAppointmentRequest(
  req: AppointmentRequest,
  nowIso = new Date().toISOString()
): AppointmentRequest {
  if (req.status !== 'pending_doctor_review' && req.status !== 'draft') {
    throw new Error('appointment_request_not_ready');
  }
  if (!req.message.trim()) throw new Error('appointment_request_message_required');
  // Require explicit review step
  if (req.status === 'draft' || !req.reviewedAt) {
    throw new Error('appointment_request_needs_review');
  }
  return {
    ...req,
    status: 'sent',
    sentAt: nowIso,
    updatedAt: nowIso,
  };
}
