/**
 * Secure in-app doctor↔patient messaging (Phase 1).
 * Structured patient requests only — not open chat, not WhatsApp.
 * Descriptive / administrative copy; not for emergencies.
 */

import {
  isWithinOfficeHours,
  normalizeOfficeHours,
  nextOfficeOpenIso,
  type OfficeHoursSchedule,
  type LegacyOfficeHoursWindow,
} from './officeHours';

export type OfficeHoursInput = Partial<OfficeHoursSchedule> | LegacyOfficeHoursWindow | null | undefined;

export type PatientRequestType = 'refill' | 'side_effect' | 'appointment' | 'general';

export type MessageDirection = 'patient_to_doctor' | 'doctor_to_patient' | 'system';

export type MessageStatus = 'queued' | 'pending_doctor' | 'answered' | 'closed';

export type DoctorQuickAction = 'approve_refill' | 'book_visit' | 'seen' | 'text_reply';

export interface DoctorPatientMessage {
  id: string;
  linkId: string;
  doctorId: string;
  patientId: string;
  direction: MessageDirection;
  requestType?: PatientRequestType;
  body: string;
  status: MessageStatus;
  createdAt: string;
  /** When the doctor inbox may show this (office-hours queue). */
  visibleToDoctorAt: string;
  doctorAction?: DoctorQuickAction;
  doctorReplyText?: string;
  answeredAt?: string;
  /** Patient UI: auto-notice when queued outside office hours or while doctor is away. */
  patientAutoNotice?: 'queued_outside_office_hours' | 'messaging_paused';
  updatedAt: string;
}

export const PATIENT_REQUEST_TYPES: PatientRequestType[] = [
  'refill',
  'side_effect',
  'appointment',
  'general',
];

export const DOCTOR_QUICK_ACTIONS: DoctorQuickAction[] = [
  'approve_refill',
  'book_visit',
  'seen',
  'text_reply',
];

export const MESSAGE_BODY_MAX = 500;

export interface CreatePatientRequestInput {
  id: string;
  linkId: string;
  doctorId: string;
  patientId: string;
  requestType: PatientRequestType;
  body: string;
  officeHours?: OfficeHoursInput;
  nowIso?: string;
}

export function createPatientStructuredRequest(input: CreatePatientRequestInput): DoctorPatientMessage {
  if (!PATIENT_REQUEST_TYPES.includes(input.requestType)) {
    throw new Error('invalid_request_type');
  }
  const body = String(input.body || '').trim().slice(0, MESSAGE_BODY_MAX);
  if (!body) throw new Error('message_body_required');
  const now = input.nowIso || new Date().toISOString();
  const nowDate = new Date(now);
  const hours = normalizeOfficeHours(input.officeHours || undefined);
  const inside = isWithinOfficeHours(hours, nowDate);
  const nextOpen = inside ? now : nextOfficeOpenIso(hours, nowDate);
  // While paused, queue with visibleToDoctorAt = createdAt; doctor unpause + promote opens them.
  const visibleToDoctorAt = inside ? now : nextOpen || now;
  const patientAutoNotice = hours.messagingPaused
    ? 'messaging_paused'
    : inside
      ? undefined
      : 'queued_outside_office_hours';
  return {
    id: input.id,
    linkId: input.linkId,
    doctorId: input.doctorId,
    patientId: input.patientId,
    direction: 'patient_to_doctor',
    requestType: input.requestType,
    body,
    status: inside ? 'pending_doctor' : 'queued',
    createdAt: now,
    visibleToDoctorAt,
    patientAutoNotice,
    updatedAt: now,
  };
}

/**
 * Promote queued messages whose visibleToDoctorAt has arrived.
 * Pass doctorOfficeHours so vacation pause keeps items queued.
 */
export function promoteDueMessages(
  messages: DoctorPatientMessage[],
  nowIso = new Date().toISOString(),
  doctorOfficeHours?: OfficeHoursInput
): DoctorPatientMessage[] {
  const hours = doctorOfficeHours ? normalizeOfficeHours(doctorOfficeHours) : null;
  if (hours?.messagingPaused) return messages;
  return messages.map((m) => {
    if (m.status === 'queued' && m.visibleToDoctorAt <= nowIso) {
      return { ...m, status: 'pending_doctor', updatedAt: nowIso, patientAutoNotice: undefined };
    }
    return m;
  });
}

export function listNeedsActionToday(
  messages: DoctorPatientMessage[],
  nowIso = new Date().toISOString(),
  doctorOfficeHours?: OfficeHoursInput
): DoctorPatientMessage[] {
  const hours = doctorOfficeHours ? normalizeOfficeHours(doctorOfficeHours) : null;
  if (hours?.messagingPaused) return [];
  return promoteDueMessages(messages, nowIso, doctorOfficeHours)
    .filter(
      (m) =>
        m.direction === 'patient_to_doctor' &&
        m.status === 'pending_doctor' &&
        m.visibleToDoctorAt <= nowIso
    )
    .sort((a, b) => a.visibleToDoctorAt.localeCompare(b.visibleToDoctorAt));
}

export function applyDoctorQuickReply(
  message: DoctorPatientMessage,
  action: DoctorQuickAction,
  replyText?: string,
  nowIso = new Date().toISOString()
): DoctorPatientMessage {
  if (message.status !== 'pending_doctor' && message.status !== 'queued') {
    throw new Error('message_not_actionable');
  }
  if (!DOCTOR_QUICK_ACTIONS.includes(action)) throw new Error('invalid_doctor_action');
  const text = String(replyText || '').trim().slice(0, MESSAGE_BODY_MAX);
  if (action === 'text_reply' && !text) throw new Error('reply_text_required');
  return {
    ...message,
    status: 'answered',
    doctorAction: action,
    doctorReplyText: text || undefined,
    answeredAt: nowIso,
    updatedAt: nowIso,
  };
}

export interface MessageThreadExport {
  patientId: string;
  doctorId: string;
  generatedAt: string;
  lines: string[];
}

const EXPORT_LABELS = {
  es: {
    title: 'Resumen de mensajes (solo lectura — registros propios del médico)',
    patient: 'Paciente',
    doctor: 'Médico',
    system: 'Sistema',
    notEmergency: 'Este canal no es para emergencias. No sustituye el criterio clínico.',
    reply: 'Respuesta',
    none: 'Sin mensajes.',
    requestTypes: {
      refill: 'Solicitud de surtido',
      side_effect: 'Pregunta sobre efecto secundario',
      appointment: 'Cita',
      general: 'Pregunta general',
    } as Record<string, string>,
    actions: {
      approve_refill: 'Aprobar surtido',
      book_visit: 'Agendar visita',
      seen: 'Visto',
      text_reply: 'Respuesta de texto',
    } as Record<string, string>,
  },
  en: {
    title: 'Message summary (read-only — doctor’s own records)',
    patient: 'Patient',
    doctor: 'Doctor',
    system: 'System',
    notEmergency: 'This channel is not for emergencies. It does not replace clinical judgment.',
    reply: 'Reply',
    none: 'No messages.',
    requestTypes: {
      refill: 'Refill request',
      side_effect: 'Side-effect question',
      appointment: 'Appointment',
      general: 'General question',
    } as Record<string, string>,
    actions: {
      approve_refill: 'Approve refill',
      book_visit: 'Book a visit',
      seen: 'Seen',
      text_reply: 'Text reply',
    } as Record<string, string>,
  },
};

function formatExportTimestamp(iso: string, locale: 'en' | 'es'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleString(locale === 'en' ? 'en-US' : 'es-MX');
  } catch {
    return iso;
  }
}

/**
 * One-page descriptive export for the doctor's own records (no clinical judgment).
 * Every label (speaker, request type, action, timestamp) is rendered in `opts.locale`;
 * message bodies and reply text are the authors' own words.
 */
export function buildMessageSummaryExport(
  messages: DoctorPatientMessage[],
  opts: { patientLabel?: string; doctorLabel?: string; locale?: 'en' | 'es' } = {}
): MessageThreadExport {
  const locale: 'en' | 'es' = opts.locale === 'en' ? 'en' : 'es';
  const L = EXPORT_LABELS[locale];
  const sorted = [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const lines: string[] = [];
  lines.push(L.title);
  lines.push(`${L.patient}: ${opts.patientLabel || sorted[0]?.patientId || '—'}`);
  lines.push(`${L.doctor}: ${opts.doctorLabel || sorted[0]?.doctorId || '—'}`);
  lines.push(L.notEmergency);
  lines.push('');
  for (const m of sorted) {
    const who =
      m.direction === 'patient_to_doctor' ? L.patient : m.direction === 'doctor_to_patient' ? L.doctor : L.system;
    const type = m.requestType ? ` [${L.requestTypes[m.requestType] || L.requestTypes.general}]` : '';
    const action = m.doctorAction ? ` → ${L.actions[m.doctorAction] || L.actions.seen}` : '';
    lines.push(`${formatExportTimestamp(m.createdAt, locale)} · ${who}${type}${action}`);
    lines.push(m.body);
    if (m.doctorReplyText) lines.push(`  ${L.reply}: ${m.doctorReplyText}`);
    lines.push('');
  }
  if (!sorted.length) {
    lines.push(L.none);
  }
  return {
    patientId: sorted[0]?.patientId || '',
    doctorId: sorted[0]?.doctorId || '',
    generatedAt: new Date().toISOString(),
    lines,
  };
}

/** Pluggable notification channel — push now; WhatsApp later. */
export type NotifyChannelKind = 'push' | 'whatsapp' | 'email';

export interface NotifyPayload {
  toUserId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  channel?: NotifyChannelKind;
}

export interface NotificationChannel {
  kind: NotifyChannelKind;
  send(payload: NotifyPayload): Promise<{ ok: boolean; skipped?: boolean; reason?: string }>;
}

/** Generic lock-screen copy — no health content. */
export function genericMessagePushCopy(locale: 'en' | 'es' = 'es'): { title: string; body: string } {
  if (locale === 'en') {
    return {
      title: 'AuricRX',
      body: 'You have a new message. Open the app for details.',
    };
  }
  return {
    title: 'AuricRX',
    body: 'Tiene un mensaje nuevo. Abra la app para ver el detalle.',
  };
}

export class PushNotificationChannel implements NotificationChannel {
  kind: NotifyChannelKind = 'push';
  constructor(
    private sendPush: (token: string, copy: { title: string; body: string; data?: Record<string, string> }) => Promise<unknown>,
    private resolveToken: (userId: string) => Promise<string | null>
  ) {}
  async send(payload: NotifyPayload) {
    const token = await this.resolveToken(payload.toUserId);
    if (!token) return { ok: false, skipped: true, reason: 'no_token' };
    await this.sendPush(token, {
      title: payload.title,
      body: payload.body,
      data: payload.data,
    });
    return { ok: true };
  }
}

/** Stub for a later WhatsApp channel — never used in Phase 1. */
export class WhatsAppNotificationChannelStub implements NotificationChannel {
  kind: NotifyChannelKind = 'whatsapp';
  async send() {
    return { ok: false, skipped: true, reason: 'whatsapp_not_enabled' };
  }
}

export async function dispatchNotification(
  channels: NotificationChannel[],
  payload: NotifyPayload
): Promise<Array<{ kind: NotifyChannelKind; ok: boolean; skipped?: boolean; reason?: string }>> {
  const preferred = payload.channel;
  const list = preferred ? channels.filter((c) => c.kind === preferred) : channels.filter((c) => c.kind === 'push');
  const results = [];
  for (const ch of list) {
    results.push({ kind: ch.kind, ...(await ch.send(payload)) });
  }
  return results;
}
