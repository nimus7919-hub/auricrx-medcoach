import {
  compareValue,
  evaluateThresholdCrossings,
  extractReadings,
  GENERIC_PUSH,
} from '../../doctor/thresholds';
import type { BitacoraEntry, DoctorAlertLimit } from '../../doctor/types';

const baseEntry = (over: Partial<BitacoraEntry> = {}): BitacoraEntry => ({
  id: 'bit_1',
  patientId: 'patient_1',
  type: 'blood_pressure',
  timestamp: '2026-11-12T10:00:00.000Z',
  createdAt: '2026-11-12T10:00:00.000Z',
  updatedAt: '2026-11-12T10:00:00.000Z',
  systolic: 160,
  diastolic: 95,
  pulse: 88,
  ...over,
});

const limit = (over: Partial<DoctorAlertLimit> = {}): DoctorAlertLimit => ({
  id: 'lim_1',
  doctorId: 'doc_1',
  patientId: 'patient_1',
  readingType: 'systolic',
  comparator: 'gt',
  value: 150,
  enabled: true,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  ...over,
});

describe('doctor thresholds', () => {
  it('compares gt/gte/lt/lte correctly', () => {
    expect(compareValue(151, 'gt', 150)).toBe(true);
    expect(compareValue(150, 'gt', 150)).toBe(false);
    expect(compareValue(150, 'gte', 150)).toBe(true);
    expect(compareValue(149, 'lt', 150)).toBe(true);
    expect(compareValue(150, 'lte', 150)).toBe(true);
  });

  it('extracts raw readings without clinical labels', () => {
    expect(extractReadings(baseEntry())).toEqual({
      systolic: 160,
      diastolic: 95,
      pulse: 88,
    });
    expect(
      extractReadings(
        baseEntry({ type: 'glucose', glucoseMgDl: 180, systolic: undefined, diastolic: undefined, pulse: undefined })
      )
    ).toEqual({ glucose: 180 });
  });

  it('reports crossings only for enabled matching limits', () => {
    const crossings = evaluateThresholdCrossings(baseEntry(), [
      limit(),
      limit({ id: 'lim_2', readingType: 'diastolic', value: 100, comparator: 'gt' }),
      limit({ id: 'lim_3', enabled: false, value: 100 }),
      limit({ id: 'lim_4', patientId: 'other', value: 100 }),
    ]);
    expect(crossings).toHaveLength(1);
    expect(crossings[0].readingType).toBe('systolic');
    expect(crossings[0].observedValue).toBe(160);
    expect(crossings[0].inAppMessageKey).toBe('doctorMode.alerts.crossedLimitDetail');
  });

  it('keeps push copy keys generic (no names/values in key contract)', () => {
    expect(GENERIC_PUSH.titleKey).toBe('doctorMode.alerts.pushTitle');
    expect(GENERIC_PUSH.bodyKey).toBe('doctorMode.alerts.pushBody');
  });
});
