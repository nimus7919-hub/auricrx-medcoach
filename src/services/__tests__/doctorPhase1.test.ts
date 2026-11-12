import {
  buildMorningDigest,
  buildPreVisitOnePager,
  createAppointmentRequestDraft,
  markAppointmentRequestReviewed,
  sendAppointmentRequest,
  isWithinOfficeHours,
  normalizeOfficeHours,
  evaluateCalendarAgenda,
  findOverlappingAppointments,
  CALENDAR_STALE_MS,
} from '../../doctor';
import type { BitacoraEntry } from '../../doctor';

describe('doctor phase-1 time-saving helpers', () => {
  it('builds exception digest sorted by recency only', () => {
    const items = buildMorningDigest([
      {
        patientId: 'p1',
        patientLabel: 'Ana',
        kind: 'new_symptom',
        at: '2026-11-12T08:00:00.000Z',
        detail: 'dolor',
      },
      {
        patientId: 'p2',
        patientLabel: 'Luis',
        kind: 'limit_crossed',
        at: '2026-11-12T10:00:00.000Z',
        detail: 'Lectura 160 por encima del límite de 150 que usted configuró',
      },
      {
        patientId: 'p1',
        kind: 'missed_dose',
        at: '2026-11-12T09:00:00.000Z',
      },
    ]);
    expect(items[0].patientId).toBe('p2');
    expect(items[1].patientId).toBe('p1');
    expect(items[1].kinds).toEqual(expect.arrayContaining(['new_symptom', 'missed_dose']));
  });

  it('builds descriptive pre-visit one-pager', () => {
    const entries: BitacoraEntry[] = [
      {
        id: '1',
        patientId: 'p1',
        type: 'blood_pressure',
        timestamp: '2026-11-11T12:00:00.000Z',
        createdAt: '2026-11-11T12:00:00.000Z',
        updatedAt: '2026-11-11T12:00:00.000Z',
        systolic: 130,
        diastolic: 80,
      },
      {
        id: '2',
        patientId: 'p1',
        type: 'symptoms',
        timestamp: '2026-11-11T13:00:00.000Z',
        createdAt: '2026-11-11T13:00:00.000Z',
        updatedAt: '2026-11-11T13:00:00.000Z',
        symptomsText: 'cansancio',
      },
    ];
    const page = buildPreVisitOnePager({
      patientLabel: 'Ana',
      entries,
      doseLogs: [{ name: 'Metformin', logged: 5, expected: 7 }],
      patientQuestions: ['¿Puedo mover la cita?'],
    });
    expect(page.readings.find((r) => r.type === 'symptoms')?.count).toBe(1);
    expect(page.symptomTexts).toContain('cansancio');
    expect(page.doseLogs[0]).toEqual({ name: 'Metformin', logged: 5, expected: 7 });
  });

  it('requires doctor review before sending appointment request', () => {
    const draft = createAppointmentRequestDraft({
      id: 'r1',
      doctorId: 'd1',
      patientId: 'p1',
      proposedSlotsIso: ['2026-11-20T16:00:00.000Z'],
    });
    expect(draft.status).toBe('draft');
    expect(() => sendAppointmentRequest(draft)).toThrow(/needs_review/);
    const reviewed = markAppointmentRequestReviewed(draft);
    const sent = sendAppointmentRequest(reviewed);
    expect(sent.status).toBe('sent');
  });

  it('evaluates office hours with pause', () => {
    const hours = normalizeOfficeHours({
      days: [1, 2, 3, 4, 5],
      startHour: 9,
      endHour: 18,
      timeZone: 'America/Mexico_City',
      enabled: true,
    });
    expect(hours.windowsByDay['1']).toBeTruthy();
    expect(isWithinOfficeHours({ ...hours, messagingPaused: true }, new Date('2026-11-12T16:00:00.000Z'))).toBe(
      false
    );
  });

  it('calendar agenda fails closed when OAuth stubbed or stale', () => {
    const stub = evaluateCalendarAgenda({
      appointments: [],
      timeZone: 'America/Mexico_City',
      featureFlagEnabled: false,
    });
    expect(stub.failClosed).toBe(true);
    expect(stub.warning).toBe('oauth_stub');
    expect(stub.appointments).toHaveLength(0);

    const stale = evaluateCalendarAgenda({
      appointments: [
        {
          id: 'a1',
          title: 'Consulta',
          startIso: '2026-11-12T15:00:00.000Z',
          endIso: '2026-11-12T15:30:00.000Z',
          provider: 'google',
        },
      ],
      timeZone: 'America/Mexico_City',
      featureFlagEnabled: true,
      providerAvailable: true,
      lastSyncedAt: new Date(Date.now() - CALENDAR_STALE_MS - 1000).toISOString(),
    });
    expect(stale.failClosed).toBe(true);
    expect(stale.warning).toBe('stale_sync');
    expect(stale.appointments).toHaveLength(0);
  });

  it('flags overlapping appointments', () => {
    const overlaps = findOverlappingAppointments([
      {
        id: 'a',
        title: 'A',
        startIso: '2026-11-12T15:00:00.000Z',
        endIso: '2026-11-12T16:00:00.000Z',
        provider: 'google',
      },
      {
        id: 'b',
        title: 'B',
        startIso: '2026-11-12T15:30:00.000Z',
        endIso: '2026-11-12T16:30:00.000Z',
        provider: 'google',
      },
    ]);
    expect(overlaps).toEqual([{ aId: 'a', bId: 'b' }]);
  });
});
