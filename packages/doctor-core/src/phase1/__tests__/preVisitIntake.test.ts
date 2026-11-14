import { formatPatientReportedSeverity, formatPatientReportedSeverityEs } from '../preVisitIntake';

describe('pre-visit intake formatters', () => {
  it('formats a patient-stated 1-10 number and treats null as not mentioned', () => {
    expect(formatPatientReportedSeverity(6)).toBe('Patient said 6 / 10');
    expect(formatPatientReportedSeverity(null)).toBe('Not mentioned');
    expect(formatPatientReportedSeverity(0)).toBe('Not mentioned');
    expect(formatPatientReportedSeverity(11)).toBe('Not mentioned');
    expect(formatPatientReportedSeverityEs(6)).toBe('La persona indicó 6 / 10');
  });
});
