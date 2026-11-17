/**
 * Pure threshold evaluation for doctor alert limits.
 * The app never interprets readings as high/low/dangerous —
 * it only reports that a doctor-set limit was crossed.
 */

import type { AlertComparator, AlertReadingType, BitacoraEntry, DoctorAlertLimit } from './types';

export interface ThresholdCrossing {
  limit: DoctorAlertLimit;
  readingType: AlertReadingType;
  observedValue: number;
  /** Neutral in-app detail — no clinical judgement. */
  inAppMessageKey: 'doctorMode.alerts.crossedLimitDetail';
}

export function compareValue(observed: number, comparator: AlertComparator, limit: number): boolean {
  switch (comparator) {
    case 'gt':
      return observed > limit;
    case 'gte':
      return observed >= limit;
    case 'lt':
      return observed < limit;
    case 'lte':
      return observed <= limit;
    default:
      return false;
  }
}

/** Extract numeric readings from a bitácora entry (raw values only). */
export function extractReadings(entry: BitacoraEntry): Partial<Record<AlertReadingType, number>> {
  const out: Partial<Record<AlertReadingType, number>> = {};
  if (entry.type === 'blood_pressure') {
    if (typeof entry.systolic === 'number') out.systolic = entry.systolic;
    if (typeof entry.diastolic === 'number') out.diastolic = entry.diastolic;
    if (typeof entry.pulse === 'number') out.pulse = entry.pulse;
  }
  if (entry.type === 'glucose' && typeof entry.glucoseMgDl === 'number') {
    out.glucose = entry.glucoseMgDl;
  }
  if (entry.type === 'weight' && typeof entry.weightKg === 'number') {
    out.weight = entry.weightKg;
  }
  return out;
}

/**
 * Evaluate which enabled doctor limits were crossed by a new entry.
 * Returns crossings only — never labels severity or clinical meaning.
 */
export function evaluateThresholdCrossings(
  entry: BitacoraEntry,
  limits: DoctorAlertLimit[]
): ThresholdCrossing[] {
  const readings = extractReadings(entry);
  const crossings: ThresholdCrossing[] = [];

  for (const limit of limits) {
    if (!limit.enabled) continue;
    if (limit.patientId !== entry.patientId) continue;
    const observed = readings[limit.readingType];
    if (typeof observed !== 'number' || Number.isNaN(observed)) continue;
    if (compareValue(observed, limit.comparator, limit.value)) {
      crossings.push({
        limit,
        readingType: limit.readingType,
        observedValue: observed,
        inAppMessageKey: 'doctorMode.alerts.crossedLimitDetail',
      });
    }
  }

  return crossings;
}

/** Lock-screen / push copy must stay generic — no names or values. */
export const GENERIC_PUSH = {
  titleKey: 'doctorMode.alerts.pushTitle',
  bodyKey: 'doctorMode.alerts.pushBody',
} as const;
