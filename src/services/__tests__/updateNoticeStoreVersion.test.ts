import { buildStoreListing, fetchLatestStoreVersion } from '../updateNotice/storeVersion';
import { checkAndFetchOta, shouldSkipOta } from '../updateNotice/otaUpdates';
import { runUpdateCheck } from '../updateNotice/orchestrator';
import { isPermissionGranted, maybeScheduleUpdateNotification } from '../updateNotice/localNotification';

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('store listing URLs', () => {
  it('opens Play with a market:// link and an https fallback', () => {
    const listing = buildStoreListing('android');
    expect(listing.primaryUrl).toBe('market://details?id=com.auricrx.medcoach');
    expect(listing.fallbackUrl).toBe('https://play.google.com/store/apps/details?id=com.auricrx.medcoach');
  });

  it('uses a custom store URL when the API provides one', () => {
    const listing = buildStoreListing('android', {
      storeUrl: 'https://play.google.com/apps/internaltest/123',
    });
    expect(listing.fallbackUrl).toBe('https://play.google.com/apps/internaltest/123');
    expect(listing.primaryUrl).toBe('market://details?id=com.auricrx.medcoach');
  });

  it('opens the App Store by id when configured, otherwise a search URL', () => {
    const withId = buildStoreListing('ios', { iosAppStoreId: '123456789' });
    expect(withId.primaryUrl).toBe('itms-apps://itunes.apple.com/app/id123456789');
    expect(withId.fallbackUrl).toBe('https://apps.apple.com/app/id123456789');
    const search = buildStoreListing('ios');
    expect(search.fallbackUrl).toContain('apps.apple.com/search');
    expect(search.fallbackUrl).toContain('AuricRX');
  });
});

describe('fetchLatestStoreVersion', () => {
  const apiBase = 'https://auricrx-medcoach.onrender.com';

  it('reads latestVersion from the optional public endpoint', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse(200, { latestVersion: '1.2.0', iosAppStoreId: '999', storeUrl: 'https://example.test/app' }),
    );
    const latest = await fetchLatestStoreVersion({
      platform: 'ios',
      apiBase,
      envLatest: '1.0.0',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(fetchImpl).toHaveBeenCalled();
    const url = String(fetchImpl.mock.calls[0][0]);
    expect(url).toContain('/api/app/version');
    expect(url).toContain('platform=ios');
    expect(url).toContain('app=patient');
    expect(latest).toMatchObject({ latestVersion: '1.2.0', source: 'api', iosAppStoreId: '999' });
  });

  it('falls back to EXPO_PUBLIC_LATEST_* when the endpoint is 404 or errors', async () => {
    const notFound = jest.fn().mockResolvedValue(jsonResponse(404, { error: 'not found' }));
    const fromEnv = await fetchLatestStoreVersion({
      platform: 'android',
      apiBase,
      envLatest: '1.1.0',
      fetchImpl: notFound as unknown as typeof fetch,
    });
    expect(fromEnv).toEqual({ latestVersion: '1.1.0', iosAppStoreId: null, source: 'env' });

    const boom = jest.fn().mockRejectedValue(new Error('network'));
    const afterError = await fetchLatestStoreVersion({
      platform: 'android',
      apiBase,
      envLatest: '1.1.0',
      fetchImpl: boom as unknown as typeof fetch,
    });
    expect(afterError?.source).toBe('env');

    const missing = await fetchLatestStoreVersion({
      platform: 'android',
      apiBase,
      envLatest: null,
      fetchImpl: notFound as unknown as typeof fetch,
    });
    expect(missing).toBeNull();
  });
});

describe('OTA skip and orchestrator priority', () => {
  it('skips OTA in __DEV__ and when Updates.isEnabled is false', () => {
    const enabled = { isEnabled: true, checkForUpdateAsync: jest.fn(), fetchUpdateAsync: jest.fn(), reloadAsync: jest.fn() };
    expect(shouldSkipOta(true, enabled)).toBe(true);
    expect(shouldSkipOta(false, { ...enabled, isEnabled: false })).toBe(true);
    expect(shouldSkipOta(false, enabled)).toBe(false);
    expect(shouldSkipOta(false, null)).toBe(true);
  });

  it('returns null when no OTA is available', async () => {
    const updates = {
      isEnabled: true,
      checkForUpdateAsync: jest.fn().mockResolvedValue({ isAvailable: false }),
      fetchUpdateAsync: jest.fn(),
      reloadAsync: jest.fn(),
    };
    await expect(checkAndFetchOta({ isDev: false, updates })).resolves.toBeNull();
    expect(updates.fetchUpdateAsync).not.toHaveBeenCalled();
  });

  it('fetches an available OTA and prefers a newer store binary over it', async () => {
    const updates = {
      isEnabled: true,
      checkForUpdateAsync: jest.fn().mockResolvedValue({ isAvailable: true, manifest: { id: 'ota-1' } }),
      fetchUpdateAsync: jest.fn().mockResolvedValue({}),
      reloadAsync: jest.fn(),
    };
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(200, { latestVersion: '1.2.0' }));
    const store = await runUpdateCheck({
      isDev: false,
      platform: 'android',
      installedVersion: '1.1.0',
      apiBase: 'https://example.test',
      updates,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(store).toMatchObject({ kind: 'store', version: '1.2.0' });
    expect(updates.checkForUpdateAsync).not.toHaveBeenCalled();

    const otaOnly = await runUpdateCheck({
      isDev: false,
      platform: 'android',
      installedVersion: '1.2.0',
      apiBase: 'https://example.test',
      envLatest: '1.2.0',
      updates,
      fetchImpl: jest.fn().mockResolvedValue(jsonResponse(200, { latestVersion: '1.2.0' })) as unknown as typeof fetch,
    });
    expect(otaOnly).toEqual({ kind: 'ota', version: 'ota-1' });
    expect(updates.fetchUpdateAsync).toHaveBeenCalled();
  });
});

describe('local update notification', () => {
  it('treats only an already-granted permission as enough', () => {
    expect(isPermissionGranted({ granted: true })).toBe(true);
    expect(isPermissionGranted({ status: 'granted' })).toBe(true);
    expect(isPermissionGranted({ granted: false, status: 'undetermined' })).toBe(false);
    expect(isPermissionGranted(null)).toBe(false);
  });

  it('does not prompt, and only schedules once per version when permission is already granted', async () => {
    const notifications = {
      getPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
      scheduleNotificationAsync: jest.fn(),
    };
    const denied = await maybeScheduleUpdateNotification({
      notifications,
      kind: 'store',
      version: '1.2.0',
      platform: 'android',
      title: 'AuricRX update available',
      body: 'A new version is available. Open the app to update.',
    });
    expect(denied.scheduled).toBe(false);
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();

    notifications.getPermissionsAsync.mockResolvedValue({ granted: true });
    notifications.setNotificationChannelAsync = jest.fn();
    const first = await maybeScheduleUpdateNotification({
      notifications,
      kind: 'store',
      version: '1.2.0',
      platform: 'android',
      title: 'AuricRX update available',
      body: 'A new version is available. Open the app to update.',
    });
    expect(first.scheduled).toBe(true);
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);

    const again = await maybeScheduleUpdateNotification({
      notifications,
      kind: 'store',
      version: '1.2.0',
      alreadyNotifiedKey: first.key,
      platform: 'android',
      title: 'AuricRX update available',
      body: 'A new version is available. Open the app to update.',
    });
    expect(again.scheduled).toBe(false);
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });
});
