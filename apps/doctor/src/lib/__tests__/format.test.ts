import { formatDate, formatDateTime } from '../format';

describe('date formatting follows the in-app language, not the device', () => {
  const iso = '2026-11-16T15:30:00.000Z';

  it('formats month names in the chosen language', () => {
    expect(formatDate(iso, 'en', 'UTC')).toMatch(/Nov/);
    expect(formatDate(iso, 'es', 'UTC')).toMatch(/nov/i);
    expect(formatDate(iso, 'es', 'UTC')).not.toMatch(/Nov 16/);
  });

  it('includes the time for date-times', () => {
    expect(formatDateTime(iso, 'en', 'UTC')).toMatch(/3:30/);
    expect(formatDateTime(iso, 'es', 'UTC')).toMatch(/15:30|3:30/);
  });

  it('never prints a raw ISO string for valid input', () => {
    expect(formatDateTime(iso, 'en', 'UTC')).not.toContain('T15:30');
  });

  it('handles empty and invalid input safely', () => {
    expect(formatDateTime(null, 'en')).toBe('');
    expect(formatDate(undefined, 'es')).toBe('');
    expect(formatDateTime('not a date', 'en')).toBe('not a date');
  });
});
