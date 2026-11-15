/**
 * OTA check/fetch via expo-updates. Skipped in __DEV__ and when Updates.isEnabled is false.
 * The Updates module is injected so unit tests never load the native module.
 */

export interface OtaUpdatesModule {
  isEnabled?: boolean;
  checkForUpdateAsync: () => Promise<{ isAvailable?: boolean; manifest?: { id?: string } | null }>;
  fetchUpdateAsync: () => Promise<unknown>;
  reloadAsync: () => Promise<void>;
}

export interface OtaUpdateResult {
  kind: 'ota';
  updateId: string;
}

export function shouldSkipOta(isDev: boolean, updates: OtaUpdatesModule | null | undefined): boolean {
  if (isDev) return true;
  if (!updates || updates.isEnabled === false) return true;
  return false;
}

export async function checkAndFetchOta(input: {
  isDev: boolean;
  updates: OtaUpdatesModule | null | undefined;
}): Promise<OtaUpdateResult | null> {
  const { isDev, updates } = input;
  if (shouldSkipOta(isDev, updates) || !updates) return null;
  try {
    const result = await updates.checkForUpdateAsync();
    if (!result?.isAvailable) return null;
    await updates.fetchUpdateAsync();
    const updateId =
      (result.manifest && typeof result.manifest.id === 'string' && result.manifest.id) || 'available';
    return { kind: 'ota', updateId };
  } catch {
    return null;
  }
}
