/**
 * Pure state machine for the patient pre-visit intake flow.
 *
 *   selectAppointment → selectDoctor → offer → chat → review → done
 *                                        │        │       │
 *                                        └─ skip / leave / don't send ─→ closed (booking unaffected)
 *   history (past summaries for one appointment) is a separate entry.
 *
 * The appointment is always saved BEFORE this flow opens, so no transition here can block booking.
 */

export type IntakeStep =
  | 'selectAppointment'
  | 'selectDoctor'
  | 'offer'
  | 'chat'
  | 'review'
  | 'done'
  | 'history'
  | 'closed';

export type IntakeOutcome = 'shared' | 'discarded' | 'skipped' | null;

export interface IntakeFlowState {
  step: IntakeStep;
  appointmentId: string | null;
  doctorId: string | null;
  sessionId: string | null;
  outcome: IntakeOutcome;
}

export type IntakeFlowEvent =
  | { type: 'SELECT_APPOINTMENT'; appointmentId: string }
  | { type: 'SELECT_DOCTOR'; doctorId: string }
  | { type: 'SESSION_STARTED'; sessionId: string }
  | { type: 'CHAT_FINISHED' }
  | { type: 'SHARED' }
  | { type: 'DISCARDED' }
  | { type: 'SKIP' }
  | { type: 'BACK' }
  | { type: 'OPEN_HISTORY'; appointmentId: string }
  | { type: 'START_FROM_HISTORY' }
  | { type: 'CLOSE' };

export function initialIntakeState(opts: { appointmentId?: string | null; mode?: 'book' | 'history' } = {}): IntakeFlowState {
  const appointmentId = opts.appointmentId ?? null;
  if (opts.mode === 'history' && appointmentId) {
    return { step: 'history', appointmentId, doctorId: null, sessionId: null, outcome: null };
  }
  // Step one is always "pick the appointment" (pre-selected when coming from a just-saved booking).
  return { step: 'selectAppointment', appointmentId, doctorId: null, sessionId: null, outcome: null };
}

const closed = (s: IntakeFlowState, outcome: IntakeOutcome): IntakeFlowState => ({
  ...s,
  step: 'closed',
  sessionId: null,
  outcome,
});

export function intakeReducer(state: IntakeFlowState, event: IntakeFlowEvent): IntakeFlowState {
  switch (event.type) {
    case 'SELECT_APPOINTMENT':
      if (state.step !== 'selectAppointment' || !event.appointmentId) return state;
      return { ...state, appointmentId: event.appointmentId, doctorId: null, step: 'selectDoctor' };
    case 'SELECT_DOCTOR':
      if (state.step !== 'selectDoctor' || !state.appointmentId || !event.doctorId) return state;
      return { ...state, doctorId: event.doctorId, step: 'offer' };
    case 'SESSION_STARTED':
      if (state.step !== 'offer' || !state.appointmentId || !state.doctorId || !event.sessionId) return state;
      return { ...state, sessionId: event.sessionId, step: 'chat' };
    case 'CHAT_FINISHED':
      if (state.step !== 'chat' || !state.sessionId) return state;
      return { ...state, step: 'review' };
    case 'SHARED':
      if (state.step !== 'review' || !state.sessionId) return state;
      return { ...state, step: 'done', outcome: 'shared' };
    case 'DISCARDED':
      if (state.step !== 'chat' && state.step !== 'review') return state;
      return { ...state, step: 'done', sessionId: null, outcome: 'discarded' };
    case 'SKIP':
      // Optional at every pre-chat step. Never affects the saved appointment.
      if (state.step === 'selectAppointment' || state.step === 'selectDoctor' || state.step === 'offer') {
        return closed(state, 'skipped');
      }
      return state;
    case 'BACK':
      if (state.step === 'selectDoctor') return { ...state, step: 'selectAppointment', doctorId: null };
      if (state.step === 'offer') return { ...state, step: 'selectDoctor' };
      return state;
    case 'OPEN_HISTORY':
      return { step: 'history', appointmentId: event.appointmentId, doctorId: null, sessionId: null, outcome: null };
    case 'START_FROM_HISTORY':
      if (state.step !== 'history' || !state.appointmentId) return state;
      return { step: 'selectAppointment', appointmentId: state.appointmentId, doctorId: null, sessionId: null, outcome: null };
    case 'CLOSE':
      return closed(state, state.outcome);
    default:
      return state;
  }
}

/** Leaving mid-interview must ask before throwing away the draft. */
export function requiresDiscardConfirmation(step: IntakeStep): boolean {
  return step === 'chat' || step === 'review';
}

export interface AppointmentLike {
  id: string;
  startDate: string;
  status?: string;
}

/** Only future, non-cancelled appointments can get an intake. */
export function isAppointmentEligible(appt: AppointmentLike, now: Date = new Date()): boolean {
  if (appt.status === 'cancelled' || appt.status === 'completed') return false;
  const t = Date.parse(appt.startDate);
  return !Number.isNaN(t) && t > now.getTime();
}

/** Trim + length-cap patient input; empty → null (cannot send). */
export function normalizePatientText(text: string, maxLength: number): string | null {
  const trimmed = String(text ?? '').replace(/\s+$/g, '').replace(/^\s+/g, '');
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}
