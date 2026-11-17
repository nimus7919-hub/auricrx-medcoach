import { formatPatientReportedSeverity, formatPatientReportedSeverityEs, sideFromRegionId } from '../preVisitIntake';

describe('pre-visit intake formatters', () => {
  it('formats a patient-stated 1-10 number and treats null as not mentioned', () => {
    expect(formatPatientReportedSeverity(6)).toBe('Patient said 6 / 10');
    expect(formatPatientReportedSeverity(null)).toBe('Not mentioned');
    expect(formatPatientReportedSeverity(0)).toBe('Not mentioned');
    expect(formatPatientReportedSeverity(11)).toBe('Not mentioned');
    expect(formatPatientReportedSeverityEs(6)).toBe('La persona indicó 6 / 10');
  });
});

describe('body map side helper', () => {
  it('reads left/right from the region id and leaves midline regions unsided', () => {
    expect(sideFromRegionId('lower_back_left')).toBe('left');
    expect(sideFromRegionId('heel_right')).toBe('right');
    expect(sideFromRegionId('navel')).toBeNull();
  });
});
