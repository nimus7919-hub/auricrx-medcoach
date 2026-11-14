/**
 * Pre-visit intake (patient side) — feature flag + single config surface.
 *
 * Design: docs/doctor/pre-visit-intake.md (PR #35). Freddy's decisions, 14 Nov 2026:
 *  - Offered while booking, after the patient picks the appointment and then the doctor.
 *  - Optional; skipping never blocks booking.
 *  - Patient cannot edit the AI summary; they can add a comment shown with it.
 *  - Raw chat retention is configurable (default 30 days after the appointment).
 *  - Text input only for v1 (voice later, via INPUT_MODE seam).
 *
 * FLAG IS OFF BY DEFAULT. It only turns on when EXPO_PUBLIC_FEATURE_PREVISIT_INTAKE is
 * "true"/"1" at build time. A production build (!__DEV__) additionally refuses to run
 * against the mock client, so the mock can never reach real patients.
 */

export type PreVisitIntakeApiMode = 'mock' | 'http';
/** Input-mode seam. Only 'text' is implemented in v1; 'voice' is reserved, not built. */
export type PreVisitIntakeInputMode = 'text' | 'voice';

export const PRE_VISIT_INTAKE_FLAG_ENV = 'EXPO_PUBLIC_FEATURE_PREVISIT_INTAKE';
export const PRE_VISIT_INTAKE_API_MODE_ENV = 'EXPO_PUBLIC_PREVISIT_INTAKE_API';

export const PRE_VISIT_INTAKE_CONFIG = {
  /** Raw chat auto-delete window, counted from the appointment start. Lasting record = confirmed summary + comment. */
  RAW_CHAT_RETENTION_DAYS_AFTER_APPOINTMENT: 30,
  /** v1 is text only. Do not add 'voice' here until a voice design is approved. */
  INPUT_MODE: 'text' as PreVisitIntakeInputMode,
  SUPPORTED_INPUT_MODES: ['text'] as readonly PreVisitIntakeInputMode[],
  /** PR #35 §5: short opening prompt + at most eight follow-ups. */
  MAX_FOLLOW_UPS: 8,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_COMMENT_LENGTH: 1000,
  /** Bump when the static emergency notice or the consent/offer copy changes. */
  EMERGENCY_NOTICE_VERSION: '2026-11-14',
  CONSENT_NOTICE_VERSION: '2026-11-14',
} as const;

function truthy(value: string | undefined | null): boolean {
  return value === 'true' || value === '1';
}

export function resolvePreVisitIntakeApiMode(raw: string | undefined | null): PreVisitIntakeApiMode {
  return raw === 'http' ? 'http' : 'mock';
}

export interface PreVisitIntakeFlagInput {
  flag?: string | null;
  apiMode?: string | null;
  isDev?: boolean;
}

/** Pure gate — unit tested. */
export function computePreVisitIntakeEnabled({ flag, apiMode, isDev = false }: PreVisitIntakeFlagInput): boolean {
  if (!truthy(flag)) return false;
  const mode = resolvePreVisitIntakeApiMode(apiMode);
  if (!isDev && mode === 'mock') return false;
  return true;
}

const isDevBuild = (): boolean => typeof __DEV__ !== 'undefined' && __DEV__ === true;

// EXPO_PUBLIC_* values are inlined at build time, so they must be read with literal member access.
export function isPreVisitIntakeEnabled(): boolean {
  return computePreVisitIntakeEnabled({
    flag: process.env.EXPO_PUBLIC_FEATURE_PREVISIT_INTAKE,
    apiMode: process.env.EXPO_PUBLIC_PREVISIT_INTAKE_API,
    isDev: isDevBuild(),
  });
}

export function getPreVisitIntakeApiMode(): PreVisitIntakeApiMode {
  return resolvePreVisitIntakeApiMode(process.env.EXPO_PUBLIC_PREVISIT_INTAKE_API);
}

export function isInputModeSupported(mode: PreVisitIntakeInputMode): boolean {
  return PRE_VISIT_INTAKE_CONFIG.SUPPORTED_INPUT_MODES.includes(mode);
}
