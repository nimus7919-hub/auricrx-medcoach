/**
 * Doctor-app flag for pre-visit intake. OFF by default.
 * Turns on only when EXPO_PUBLIC_FEATURE_PREVISIT_INTAKE is "true" or "1".
 * The server flag PREVISIT_INTAKE_ENABLED must also be on for data to appear.
 */

export const PRE_VISIT_INTAKE_FLAG_ENV = 'EXPO_PUBLIC_FEATURE_PREVISIT_INTAKE';

function truthy(value: string | undefined | null): boolean {
  return value === 'true' || value === '1';
}

export function computePreVisitIntakeEnabled(flag?: string | null): boolean {
  return truthy(flag);
}

export function isPreVisitIntakeEnabled(): boolean {
  return computePreVisitIntakeEnabled(process.env.EXPO_PUBLIC_FEATURE_PREVISIT_INTAKE);
}
