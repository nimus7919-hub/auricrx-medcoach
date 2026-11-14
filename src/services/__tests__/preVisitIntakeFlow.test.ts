import {
  initialIntakeState,
  intakeReducer,
  isAppointmentEligible,
  normalizePatientText,
  requiresDiscardConfirmation,
  type IntakeFlowEvent,
  type IntakeFlowState,
} from '../preVisitIntake/flow';

const run = (s: IntakeFlowState, ...events: IntakeFlowEvent[]) => events.reduce(intakeReducer, s);

describe('pre-visit intake flow state machine', () => {
  it('follows appointment → doctor → offer → chat → review → done(shared)', () => {
    let s = initialIntakeState({ appointmentId: 'a1', mode: 'book' });
    expect(s.step).toBe('selectAppointment');
    s = run(s, { type: 'SELECT_APPOINTMENT', appointmentId: 'a1' });
    expect(s.step).toBe('selectDoctor');
    s = run(s, { type: 'SELECT_DOCTOR', doctorId: 'd1' });
    expect(s.step).toBe('offer');
    s = run(s, { type: 'SESSION_STARTED', sessionId: 'x' });
    expect(s.step).toBe('chat');
    s = run(s, { type: 'CHAT_FINISHED' }, { type: 'SHARED' });
    expect(s).toMatchObject({ step: 'done', outcome: 'shared', appointmentId: 'a1', doctorId: 'd1' });
    expect(run(s, { type: 'CLOSE' })).toMatchObject({ step: 'closed', outcome: 'shared' });
  });

  it('requires the appointment before the doctor, and the doctor before the offer', () => {
    const s = initialIntakeState({ mode: 'book' });
    expect(run(s, { type: 'SELECT_DOCTOR', doctorId: 'd1' }).step).toBe('selectAppointment');
    expect(run(s, { type: 'SESSION_STARTED', sessionId: 'x' }).step).toBe('selectAppointment');
    expect(run(s, { type: 'SELECT_APPOINTMENT', appointmentId: '' }).step).toBe('selectAppointment');
    const atDoctor = run(s, { type: 'SELECT_APPOINTMENT', appointmentId: 'a1' });
    expect(run(atDoctor, { type: 'SESSION_STARTED', sessionId: 'x' }).step).toBe('selectDoctor');
  });

  it('can never share without going through review', () => {
    const chat = run(initialIntakeState({ mode: 'book' }), { type: 'SELECT_APPOINTMENT', appointmentId: 'a' }, { type: 'SELECT_DOCTOR', doctorId: 'd' }, { type: 'SESSION_STARTED', sessionId: 's' });
    expect(run(chat, { type: 'SHARED' }).step).toBe('chat');
  });

  it('is optional: skip closes from every pre-chat step without side effects', () => {
    const a = initialIntakeState({ appointmentId: 'a1', mode: 'book' });
    const d = run(a, { type: 'SELECT_APPOINTMENT', appointmentId: 'a1' });
    const o = run(d, { type: 'SELECT_DOCTOR', doctorId: 'd1' });
    for (const s of [a, d, o]) {
      expect(run(s, { type: 'SKIP' })).toMatchObject({ step: 'closed', outcome: 'skipped', sessionId: null });
    }
  });

  it("don't send / leave discards from chat or review", () => {
    const chat = run(initialIntakeState({ mode: 'book' }), { type: 'SELECT_APPOINTMENT', appointmentId: 'a' }, { type: 'SELECT_DOCTOR', doctorId: 'd' }, { type: 'SESSION_STARTED', sessionId: 's' });
    expect(run(chat, { type: 'DISCARDED' })).toMatchObject({ step: 'done', outcome: 'discarded', sessionId: null });
    const review = run(chat, { type: 'CHAT_FINISHED' });
    expect(run(review, { type: 'DISCARDED' })).toMatchObject({ step: 'done', outcome: 'discarded' });
    expect(requiresDiscardConfirmation('chat')).toBe(true);
    expect(requiresDiscardConfirmation('review')).toBe(true);
    expect(requiresDiscardConfirmation('offer')).toBe(false);
  });

  it('BACK walks offer → doctor → appointment', () => {
    const o = run(initialIntakeState({ mode: 'book' }), { type: 'SELECT_APPOINTMENT', appointmentId: 'a' }, { type: 'SELECT_DOCTOR', doctorId: 'd' });
    const d = run(o, { type: 'BACK' });
    expect(d.step).toBe('selectDoctor');
    expect(run(d, { type: 'BACK' })).toMatchObject({ step: 'selectAppointment', doctorId: null });
  });

  it('history entry can start a new intake for the same appointment', () => {
    const h = initialIntakeState({ appointmentId: 'a9', mode: 'history' });
    expect(h.step).toBe('history');
    expect(run(h, { type: 'START_FROM_HISTORY' })).toMatchObject({ step: 'selectAppointment', appointmentId: 'a9' });
  });

  it('only future, active appointments are eligible', () => {
    const now = new Date('2026-11-14T12:00:00Z');
    expect(isAppointmentEligible({ id: '1', startDate: '2026-11-20T12:00:00Z', status: 'scheduled' }, now)).toBe(true);
    expect(isAppointmentEligible({ id: '2', startDate: '2026-11-10T12:00:00Z', status: 'scheduled' }, now)).toBe(false);
    expect(isAppointmentEligible({ id: '3', startDate: '2026-11-20T12:00:00Z', status: 'cancelled' }, now)).toBe(false);
    expect(isAppointmentEligible({ id: '4', startDate: 'nope' }, now)).toBe(false);
  });

  it('normalizes patient text', () => {
    expect(normalizePatientText('   ', 10)).toBeNull();
    expect(normalizePatientText('  hola  ', 10)).toBe('hola');
    expect(normalizePatientText('abcdefghijkl', 5)).toBe('abcde');
  });
});
