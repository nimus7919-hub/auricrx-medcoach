import { UPDATE_NOTICE_CONFIG } from '../../config/updateNotice';
import { checkAndFetchOta, type OtaUpdatesModule } from './otaUpdates';
import {
  buildStoreListing,
  fetchLatestStoreVersion,
  isStoreUpdateAvailable,
  type StoreListing,
  type StorePlatform,
} from './storeVersion';

export type UpdateOffer =
  | { kind: 'ota'; version: string }
  | { kind: 'store'; version: string; listing: StoreListing };

export interface RunUpdateCheckInput {
  isDev: boolean;
  platform: StorePlatform | 'web' | string;
  installedVersion: string | null;
  apiBase: string;
  envLatest?: string | null;
  envIosAppStoreId?: string | null;
  updates: OtaUpdatesModule | null;
  fetchImpl?: typeof fetch;
}

/**
 * Prefer a store (native) update when the installed native version is behind.
 * Otherwise, if an OTA is available and fetched, offer a reload.
 * Never throws.
 */
export async function runUpdateCheck(input: RunUpdateCheckInput): Promise<UpdateOffer | null> {
  const platform: StorePlatform | null = input.platform === 'ios' || input.platform === 'android' ? input.platform : null;

  if (platform) {
    try {
      const latest = await fetchLatestStoreVersion({
        platform,
        apiBase: input.apiBase,
        envLatest: input.envLatest,
        envIosAppStoreId: input.envIosAppStoreId,
        fetchImpl: input.fetchImpl,
      });
      if (isStoreUpdateAvailable(input.installedVersion, latest) && latest) {
        return {
          kind: 'store',
          version: latest.latestVersion,
          listing: buildStoreListing(platform, {
            androidPackage: UPDATE_NOTICE_CONFIG.ANDROID_PACKAGE,
            iosAppStoreId: latest.iosAppStoreId || input.envIosAppStoreId,
            storeUrl: latest.storeUrl,
          }),
        };
      }
    } catch {
      // Fall through to the OTA check.
    }
  }

  const ota = await checkAndFetchOta({ isDev: input.isDev, updates: input.updates });
  if (ota) return { kind: 'ota', version: ota.updateId };
  return null;
}
