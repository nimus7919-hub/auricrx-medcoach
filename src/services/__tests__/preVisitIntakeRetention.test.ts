import { computeRawChatDeleteAt, daysUntilRawChatDeletion, isRawChatExpired } from '../preVisitIntake/retention';
import { PRE_VISIT_INTAKE_CONFIG } from '../../config/preVisitIntake';

describe('pre-visit intake raw chat retention', () => {
  const appt = '2026-11-20T16:00:00.000Z';

  it('defaults to 30 days after the appointment, from one config constant', () => {
    expect(PRE_VISIT_INTAKE_CONFIG.RAW_CHAT_RETENTION_DAYS_AFTER_APPOINTMENT).toBe(30);
    expect(computeRawChatDeleteAt(appt)).toBe('2026-12-20T16:00:00.000Z');
  });

  it('honours a configured window', () => {
    expect(computeRawChatDeleteAt(appt, 7)).toBe('2026-11-27T16:00:00.000Z');
    expect(computeRawChatDeleteAt(appt, 0)).toBe(appt);
    expect(computeRawChatDeleteAt(appt, 2.9)).toBe('2026-11-22T16:00:00.000Z');
  });

  it('rejects invalid windows', () => {
    expect(() => computeRawChatDeleteAt(appt, -1)).toThrow('invalid_retention_days');
    expect(() => computeRawChatDeleteAt(appt, Number.NaN)).toThrow('invalid_retention_days');
  });

  it('falls back to the provided base when the appointment date is invalid (never keeps forever)', () => {
    expect(computeRawChatDeleteAt('not-a-date', 30, '2026-11-14T00:00:00.000Z')).toBe('2026-12-14T00:00:00.000Z');
  });

  it('expires at (not after) the deadline and fails closed on bad input', () => {
    const del = '2026-12-20T16:00:00.000Z';
    expect(isRawChatExpired(del, new Date('2026-12-20T15:59:59.000Z'))).toBe(false);
    expect(isRawChatExpired(del, new Date(del))).toBe(true);
    expect(isRawChatExpired('garbage', new Date())).toBe(true);
  });

  it('counts whole days left', () => {
    const del = '2026-12-20T16:00:00.000Z';
    expect(daysUntilRawChatDeletion(del, new Date('2026-12-19T16:00:00.000Z'))).toBe(1);
    expect(daysUntilRawChatDeletion(del, new Date('2026-12-19T17:00:00.000Z'))).toBe(1);
    expect(daysUntilRawChatDeletion(del, new Date('2026-12-21T00:00:00.000Z'))).toBe(0);
  });
});
