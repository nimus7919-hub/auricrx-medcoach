import {
  createPatientStructuredRequest,
  listNeedsActionToday,
  applyDoctorQuickReply,
  buildMessageSummaryExport,
  normalizeOfficeHours,
  isWithinOfficeHours,
  formatOfficeHoursForPatient,
  nextOfficeOpenIso,
  genericMessagePushCopy,
  containsBannedClinicalTerms,
} from '../../doctor';

describe('doctor structured messaging + office hours', () => {
  const multiWindow = normalizeOfficeHours({
    timeZone: 'America/Mexico_City',
    messagingPaused: false,
    windowsByDay: {
      '1': [
        { startMinutes: 9 * 60, endMinutes: 13 * 60 },
        { startMinutes: 16 * 60, endMinutes: 20 * 60 },
      ],
      '3': [{ startMinutes: 10 * 60, endMinutes: 14 * 60 }],
    },
  });

  it('supports multiple windows per day and vacation pause', () => {
    expect(multiWindow.windowsByDay['1']).toHaveLength(2);
    expect(formatOfficeHoursForPatient(multiWindow, 'es').some((l) => l.includes('Lun'))).toBe(true);

    const paused = normalizeOfficeHours({ ...multiWindow, messagingPaused: true });
    expect(isWithinOfficeHours(paused, new Date('2026-11-16T16:00:00.000Z'))).toBe(false);
    expect(nextOfficeOpenIso(paused, new Date('2026-11-16T16:00:00.000Z'))).toBeNull();
    expect(formatOfficeHoursForPatient(paused, 'en')[0]).toMatch(/paused|away/i);
  });

  it('queues patient requests outside windows with auto-notice', () => {
    // Sunday — closed in schedule
    const msg = createPatientStructuredRequest({
      id: 'm1',
      linkId: 'l1',
      doctorId: 'd1',
      patientId: 'p1',
      requestType: 'refill',
      body: 'Necesito surtir',
      officeHours: multiWindow,
      nowIso: '2026-11-15T18:00:00.000Z', // Sunday
    });
    expect(msg.status).toBe('queued');
    expect(msg.patientAutoNotice).toBe('queued_outside_office_hours');
    expect(msg.visibleToDoctorAt > msg.createdAt).toBe(true);
  });

  it('queues while messaging is paused', () => {
    const msg = createPatientStructuredRequest({
      id: 'm2',
      linkId: 'l1',
      doctorId: 'd1',
      patientId: 'p1',
      requestType: 'general',
      body: 'Pregunta',
      officeHours: { ...multiWindow, messagingPaused: true },
      nowIso: '2026-11-16T17:00:00.000Z',
    });
    expect(msg.status).toBe('queued');
    expect(msg.patientAutoNotice).toBe('messaging_paused');
  });

  it('builds needs-action list and one-tap replies', () => {
    const open = createPatientStructuredRequest({
      id: 'm3',
      linkId: 'l1',
      doctorId: 'd1',
      patientId: 'p1',
      requestType: 'appointment',
      body: 'Quisiera una cita',
      officeHours: {
        timeZone: 'UTC',
        messagingPaused: false,
        windowsByDay: {
          '0': [{ startMinutes: 0, endMinutes: 24 * 60 }],
          '1': [{ startMinutes: 0, endMinutes: 24 * 60 }],
          '2': [{ startMinutes: 0, endMinutes: 24 * 60 }],
          '3': [{ startMinutes: 0, endMinutes: 24 * 60 }],
          '4': [{ startMinutes: 0, endMinutes: 24 * 60 }],
          '5': [{ startMinutes: 0, endMinutes: 24 * 60 }],
          '6': [{ startMinutes: 0, endMinutes: 24 * 60 }],
        },
      },
      nowIso: '2026-11-12T12:00:00.000Z',
    });
    expect(open.status).toBe('pending_doctor');
    const needs = listNeedsActionToday([open], '2026-11-12T12:01:00.000Z');
    expect(needs).toHaveLength(1);
    const replied = applyDoctorQuickReply(open, 'book_visit', 'Martes 10:00');
    expect(replied.status).toBe('answered');
    expect(replied.doctorAction).toBe('book_visit');
  });

  it('exports a one-page summary without banned clinical terms', () => {
    const exported = buildMessageSummaryExport(
      [
        {
          id: 'm1',
          linkId: 'l1',
          doctorId: 'd1',
          patientId: 'p1',
          direction: 'patient_to_doctor',
          requestType: 'side_effect',
          body: 'Noté mareo después de la dosis',
          status: 'answered',
          createdAt: '2026-11-12T10:00:00.000Z',
          visibleToDoctorAt: '2026-11-12T10:00:00.000Z',
          updatedAt: '2026-11-12T11:00:00.000Z',
          doctorAction: 'seen',
          doctorReplyText: 'Recibido',
        },
      ],
      { locale: 'es', patientLabel: 'Ana' }
    );
    const text = exported.lines.join('\n');
    expect(text).toContain('Ana');
    expect(text).toMatch(/no es para emergencias/i);
    expect(containsBannedClinicalTerms(text)).toBe(false);
  });

  it('keeps message push copy generic', () => {
    const es = genericMessagePushCopy('es');
    const en = genericMessagePushCopy('en');
    expect(es.body).not.toMatch(/\d{2,}/);
    expect(en.body).not.toMatch(/refill|symptom|glucose/i);
  });

  it('migrates legacy single-window office hours', () => {
    const migrated = normalizeOfficeHours({
      days: [1, 2, 3],
      startHour: 9,
      endHour: 14,
      timeZone: 'America/Mexico_City',
      enabled: true,
    });
    expect(migrated.windowsByDay['1'][0].startMinutes).toBe(9 * 60);
    expect(migrated.windowsByDay['1'][0].endMinutes).toBe(14 * 60);
    expect(migrated.messagingPaused).toBe(false);
  });
});
