import { UPDATE_NOTICE_CONFIG } from '../../config/updateNotice';
import { isRemoteNewer } from './versionCompare';

export type StorePlatform = 'ios' | 'android';

export interface LatestStoreVersion {
  latestVersion: string;
  latestBuild?: string | null;
  minVersion?: string | null;
  storeUrl?: string | null;
  iosAppStoreId?: string | null;
  source: 'api' | 'env';
}

export interface StoreListing {
  primaryUrl: string;
  fallbackUrl: string;
}

export interface FetchLatestVersionInput {
  platform: StorePlatform;
  apiBase: string;
  envLatest?: string | null;
  envIosAppStoreId?: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  now?: () => number;
  appSlug?: string;
}

function joinUrl(base: string, path: string): string {
  const trimmed = (base || '').replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${trimmed}${suffix}`;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function pickVersion(body: Record<string, unknown>): string | null {
  return (
    asNonEmptyString(body.latestVersion) ||
    asNonEmptyString(body.latest_version) ||
    asNonEmptyString(body.version)
  );
}

/** Build Play Store / App Store deep link + https fallback. */
export function buildStoreListing(
  platform: StorePlatform,
  options: { androidPackage?: string; iosAppStoreId?: string | null; storeUrl?: string | null } = {},
): StoreListing {
  const androidPackage = options.androidPackage || UPDATE_NOTICE_CONFIG.ANDROID_PACKAGE;
  const custom = asNonEmptyString(options.storeUrl);
  if (platform === 'android') {
    const httpsUrl = custom || `https://play.google.com/store/apps/details?id=${androidPackage}`;
    return { primaryUrl: `market://details?id=${androidPackage}`, fallbackUrl: httpsUrl };
  }
  const storeId = asNonEmptyString(options.iosAppStoreId);
  if (custom) {
    const appStoreDeep = storeId ? `itms-apps://itunes.apple.com/app/id${storeId}` : custom;
    return { primaryUrl: appStoreDeep, fallbackUrl: custom };
  }
  if (storeId) {
    return {
      primaryUrl: `itms-apps://itunes.apple.com/app/id${storeId}`,
      fallbackUrl: `https://apps.apple.com/app/id${storeId}`,
    };
  }
  const query = encodeURIComponent('AuricRX MedCoach');
  return {
    primaryUrl: `https://apps.apple.com/search?term=${query}`,
    fallbackUrl: `https://apps.apple.com/search?term=${query}`,
  };
}

function parseApiBody(body: unknown, envIosAppStoreId?: string | null): LatestStoreVersion | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const latestVersion = pickVersion(record);
  if (!latestVersion) return null;
  return {
    latestVersion,
    latestBuild: asNonEmptyString(record.latestBuild) || asNonEmptyString(record.latest_build) || asNonEmptyString(record.build),
    minVersion: asNonEmptyString(record.minVersion) || asNonEmptyString(record.min_version),
    storeUrl: asNonEmptyString(record.storeUrl) || asNonEmptyString(record.store_url),
    iosAppStoreId: asNonEmptyString(record.iosAppStoreId) || asNonEmptyString(record.ios_app_store_id) || asNonEmptyString(envIosAppStoreId),
    source: 'api',
  };
}

/**
 * Optional GET /api/app/version?platform=&app=patient.
 * 404, 5xx, timeouts, and invalid JSON all fall through to EXPO_PUBLIC_LATEST_*.
 * Does not throw.
 */
export async function fetchLatestStoreVersion({
  platform,
  apiBase,
  envLatest,
  envIosAppStoreId,
  fetchImpl,
  timeoutMs = UPDATE_NOTICE_CONFIG.VERSION_FETCH_TIMEOUT_MS,
  appSlug = UPDATE_NOTICE_CONFIG.APP_SLUG,
}: FetchLatestVersionInput): Promise<LatestStoreVersion | null> {
  const fetchFn = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (fetchFn && apiBase) {
    const url = `${joinUrl(apiBase, UPDATE_NOTICE_CONFIG.VERSION_PATH)}?platform=${encodeURIComponent(platform)}&app=${encodeURIComponent(appSlug)}`;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const response = await fetchFn(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller?.signal,
      });
      if (response.ok) {
        const body = await response.json();
        const parsed = parseApiBody(body, envIosAppStoreId);
        if (parsed) return parsed;
      }
    } catch {
      // 404 / network / abort — use the env fallback below.
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  const fallback = envLatest ? envLatest.trim() : '';
  if (!fallback) return null;
  return {
    latestVersion: fallback,
    iosAppStoreId: envIosAppStoreId || null,
    source: 'env',
  };
}

export function isStoreUpdateAvailable(installedVersion: string | null | undefined, latest: LatestStoreVersion | null): boolean {
  if (!latest) return false;
  return isRemoteNewer(installedVersion, latest.latestVersion);
}
