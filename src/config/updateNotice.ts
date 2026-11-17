/**
 * In-app "update available" notice (patient app).
 *
 * FLAG IS OFF BY DEFAULT. It only turns on when EXPO_PUBLIC_FEATURE_UPDATE_NOTICE is
 * "true"/"1" at bundle time (EAS env or an OTA that inlines the flag).
 *
 * Two kinds of update:
 *  - OTA (expo-updates): check/fetch on start and on return to foreground (throttled).
 *  - Store (new native version): compare the installed native version against
 *    GET /api/app/version?platform=… (optional; 404 is fine) or EXPO_PUBLIC_LATEST_*.
 *
 * No backend schema change ships in this PR. See the PR description for the
 * optional server route Atlas can add later.
 */

export const UPDATE_NOTICE_FLAG_ENV = 'EXPO_PUBLIC_FEATURE_UPDATE_NOTICE';

export const UPDATE_NOTICE_CONFIG = {
  /** How often to check for OTA + store updates while the app is used. */
  CHECK_THROTTLE_MS: 30 * 60 * 1000,
  /** After the patient taps "Later", don't re-show the banner for this long. */
  BANNER_SNOOZE_MS: 24 * 60 * 60 * 1000,
  /** Network timeout for the optional version endpoint. */
  VERSION_FETCH_TIMEOUT_MS: 8000,
  VERSION_PATH: '/api/app/version',
  ANDROID_PACKAGE: 'com.auricrx.medcoach',
  IOS_BUNDLE_ID: 'com.auricrx.medcoach',
  APP_SLUG: 'patient',
  NOTIFICATION_OWNER: 'auricrx-update-notice',
  ANDROID_CHANNEL_ID: 'auricrx-app-updates',
  STORAGE_LAST_CHECK: '@auricrx/update-notice:last-check-at',
  STORAGE_NOTIFIED: '@auricrx/update-notice:notified-key',
  STORAGE_SNOOZE: '@auricrx/update-notice:banner-snooze',
} as const;

function truthy(value: string | undefined | null): boolean {
  return value === 'true' || value === '1';
}

export interface UpdateNoticeFlagInput {
  flag?: string | null;
}

/** Pure gate — unit tested. */
export function computeUpdateNoticeEnabled({ flag }: UpdateNoticeFlagInput): boolean {
  return truthy(flag);
}

// EXPO_PUBLIC_* values are inlined at bundle time, so they must be read with literal member access.
export function isUpdateNoticeEnabled(): boolean {
  return computeUpdateNoticeEnabled({
    flag: process.env.EXPO_PUBLIC_FEATURE_UPDATE_NOTICE,
  });
}

export function getLatestVersionEnvFallback(platform: 'ios' | 'android'): string | null {
  const specific =
    platform === 'ios'
      ? process.env.EXPO_PUBLIC_LATEST_IOS
      : process.env.EXPO_PUBLIC_LATEST_ANDROID;
  const generic = process.env.EXPO_PUBLIC_LATEST_VERSION;
  const raw = (specific && specific.trim()) || (generic && generic.trim()) || '';
  return raw || null;
}

export function getIosAppStoreId(): string | null {
  const raw = process.env.EXPO_PUBLIC_IOS_APP_STORE_ID;
  const id = raw ? raw.trim() : '';
  return id || null;
}
