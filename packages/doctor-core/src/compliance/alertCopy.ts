/**
 * Descriptive in-app alert copy. Never clinical judgment —
 * always names the doctor's configured rule and the observed value.
 */

import type { AlertComparator, AlertReadingType, DoctorAlertLimit } from '../types';
import { GENERIC_PUSH } from '../thresholds';

export type AlertCopyLocale = 'en' | 'es';

export interface DescriptiveAlertInput {
  readingType: AlertReadingType;
  observedValue: number;
  /** Optional second number for BP display (e.g. diastolic). */
  observedSecondary?: number;
  limit: Pick<DoctorAlertLimit, 'comparator' | 'value' | 'readingType'>;
  locale?: AlertCopyLocale;
  readingLabel?: string;
}

function aboveOrBelow(comparator: AlertComparator, locale: AlertCopyLocale): string {
  const above = comparator === 'gt' || comparator === 'gte';
  if (locale === 'es') return above ? 'por encima del' : 'por debajo del';
  return above ? 'above the' : 'below the';
}

function formatObserved(input: DescriptiveAlertInput): string {
  if (
    (input.readingType === 'systolic' || input.readingType === 'diastolic') &&
    typeof input.observedSecondary === 'number'
  ) {
    const sys = input.readingType === 'systolic' ? input.observedValue : input.observedSecondary;
    const dia = input.readingType === 'diastolic' ? input.observedValue : input.observedSecondary;
    return `${sys}/${dia}`;
  }
  return String(input.observedValue);
}

/**
 * Example (es): "Lectura 162/95 por encima del límite de 150 que usted configuró"
 * Example (en): "Reading 162/95 above the limit of 150 that you configured"
 */
export function formatDescriptiveAlertMessage(input: DescriptiveAlertInput): string {
  const locale: AlertCopyLocale = input.locale === 'en' ? 'en' : 'es';
  const observed = formatObserved(input);
  const relation = aboveOrBelow(input.limit.comparator, locale);
  const label = input.readingLabel?.trim();

  if (locale === 'es') {
    const subject = label ? `Lectura de ${label}` : 'Lectura';
    return `${subject} ${observed} ${relation} límite de ${input.limit.value} que usted configuró`;
  }

  const subject = label ? `${label} reading` : 'Reading';
  return `${subject} ${observed} ${relation} limit of ${input.limit.value} that you configured`;
}

/** Push / lock-screen must stay generic — no values. */
export function assertGenericPushSafe(title: string, body: string): void {
  const combined = `${title}\n${body}`;
  if (/\b\d{2,}\b/.test(combined)) {
    throw new Error('push_copy_must_not_include_numeric_health_values');
  }
  if (/\{\{/.test(combined)) {
    throw new Error('push_copy_must_not_include_interpolation_placeholders');
  }
}

export { GENERIC_PUSH };
