import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config/api';
import {
  UPDATE_NOTICE_CONFIG,
  getIosAppStoreId,
  getLatestVersionEnvFallback,
  isUpdateNoticeEnabled,
} from '../config/updateNotice';
import UpdateAvailableBanner, { type UpdateAvailableBannerKind } from '../components/UpdateAvailableBanner';
import { isUpdateNotificationData, maybeScheduleUpdateNotification, type UpdateNotificationApi } from '../services/updateNotice/localNotification';
import { runUpdateCheck, type UpdateOffer } from '../services/updateNotice/orchestrator';
import { offerKey, parseSnooze, parseTimestamp, shouldRunCheck, shouldShowBanner } from '../services/updateNotice/throttle';
import { USING_EXPO_GO } from '../utils/appStartup';

type UpdatesModule = typeof import('expo-updates');

function installedNativeVersion(): string | null {
  const native = Application.nativeApplicationVersion;
  if (native && String(native).trim()) return String(native).trim();
  const cfg = Constants.expoConfig?.version;
  if (cfg && String(cfg).trim()) return String(cfg).trim();
  return null;
}

function isDevBuild(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}

async function loadUpdatesModule(): Promise<UpdatesModule | null> {
  try {
    const updates = await import('expo-updates');
    return updates;
  } catch {
    return null;
  }
}

async function openStoreListing(primaryUrl: string, fallbackUrl: string): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL(primaryUrl);
    if (canOpen) {
      await Linking.openURL(primaryUrl);
      return;
    }
  } catch {
    // Fall through to the https URL.
  }
  await Linking.openURL(fallbackUrl);
}

/**
 * Checks for OTA and store updates on start and when returning to the foreground
 * (throttled). Renders the non-blocking banner and, when notification permission
 * is already granted, schedules a one-time local notification per version.
 */
export default function UpdateNoticeHost() {
  const { t } = useTranslation();
  const [offer, setOffer] = useState<UpdateOffer | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const runningRef = useRef(false);
  const offerRef = useRef<UpdateOffer | null>(null);
  const lastCheckRef = useRef<number | null>(null);
  const snoozeRef = useRef<{ key: string; untilMs: number } | null>(null);
  const notifiedRef = useRef<string | null>(null);

  const presentOffer = useCallback(
    async (next: UpdateOffer, now: number, options: { forceBanner?: boolean } = {}) => {
      offerRef.current = next;
      setOffer(next);
      const key = offerKey(next.kind, next.version);
      const show = options.forceBanner || shouldShowBanner(snoozeRef.current, key, now);
      setBannerVisible(show);

      if (USING_EXPO_GO) return;
      const title = t('updateNotice.notificationTitle');
      const body =
        next.kind === 'ota' ? t('updateNotice.notificationBodyOta') : t('updateNotice.notificationBodyStore');
      const result = await maybeScheduleUpdateNotification({
        notifications: Notifications as unknown as UpdateNotificationApi,
        kind: next.kind,
        version: next.version,
        alreadyNotifiedKey: notifiedRef.current,
        platform: Platform.OS,
        title,
        body,
      });
      if (result.scheduled) {
        notifiedRef.current = result.key;
        try {
          await AsyncStorage.setItem(UPDATE_NOTICE_CONFIG.STORAGE_NOTIFIED, result.key);
        } catch {
          // Non-fatal.
        }
      }
    },
    [t],
  );

  const runCheck = useCallback(
    async (force = false) => {
      if (!isUpdateNoticeEnabled()) return;
      if (runningRef.current) return;
      const now = Date.now();
      if (!shouldRunCheck(lastCheckRef.current, now, UPDATE_NOTICE_CONFIG.CHECK_THROTTLE_MS, force)) return;
      runningRef.current = true;
      lastCheckRef.current = now;
      try {
        await AsyncStorage.setItem(UPDATE_NOTICE_CONFIG.STORAGE_LAST_CHECK, String(now));
      } catch {
        // Non-fatal.
      }
      try {
        const platform = Platform.OS;
        const envLatest =
          platform === 'ios' || platform === 'android' ? getLatestVersionEnvFallback(platform) : null;
        const updates = await loadUpdatesModule();
        const next = await runUpdateCheck({
          isDev: isDevBuild(),
          platform,
          installedVersion: installedNativeVersion(),
          apiBase: API_BASE,
          envLatest,
          envIosAppStoreId: getIosAppStoreId(),
          updates,
        });
        if (next) await presentOffer(next, now, { forceBanner: force });
      } catch (error) {
        console.warn('[UpdateNotice] check failed', error);
      } finally {
        runningRef.current = false;
      }
    },
    [presentOffer],
  );

  useEffect(() => {
    if (!isUpdateNoticeEnabled()) return;
    let cancelled = false;

    (async () => {
      try {
        const [last, snooze, notified] = await Promise.all([
          AsyncStorage.getItem(UPDATE_NOTICE_CONFIG.STORAGE_LAST_CHECK),
          AsyncStorage.getItem(UPDATE_NOTICE_CONFIG.STORAGE_SNOOZE),
          AsyncStorage.getItem(UPDATE_NOTICE_CONFIG.STORAGE_NOTIFIED),
        ]);
        if (cancelled) return;
        lastCheckRef.current = parseTimestamp(last);
        snoozeRef.current = parseSnooze(snooze);
        notifiedRef.current = notified;
      } catch {
        // Start with empty persistence.
      }
      if (!cancelled) runCheck(false);
    })();

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') runCheck(false);
    };
    const appSub = AppState.addEventListener('change', onAppState);

    let responseSub: { remove: () => void } | undefined;
    if (!USING_EXPO_GO) {
      const handleResponse = (response: { notification?: { request?: { content?: { data?: unknown } } } } | null) => {
        const data = response?.notification?.request?.content?.data;
        if (!isUpdateNotificationData(data)) return;
        const current = offerRef.current;
        if (current && current.kind === data.kind && current.version === data.version) {
          setBannerVisible(true);
          return;
        }
        runCheck(true);
      };
      responseSub = Notifications.addNotificationResponseReceivedListener(handleResponse);
      Notifications.getLastNotificationResponseAsync?.()
        .then((response) => handleResponse(response))
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      appSub.remove();
      responseSub?.remove();
    };
  }, [runCheck]);

  const onLater = useCallback(async () => {
    const current = offerRef.current;
    setBannerVisible(false);
    if (!current) return;
    const snooze = {
      key: offerKey(current.kind, current.version),
      untilMs: Date.now() + UPDATE_NOTICE_CONFIG.BANNER_SNOOZE_MS,
    };
    snoozeRef.current = snooze;
    try {
      await AsyncStorage.setItem(UPDATE_NOTICE_CONFIG.STORAGE_SNOOZE, JSON.stringify(snooze));
    } catch {
      // Non-fatal.
    }
  }, []);

  const onUpdate = useCallback(async () => {
    const current = offerRef.current;
    if (!current) return;
    if (current.kind === 'store') {
      try {
        await openStoreListing(current.listing.primaryUrl, current.listing.fallbackUrl);
      } catch (error) {
        console.warn('[UpdateNotice] store listing unavailable', error);
      }
      return;
    }
    try {
      const updates = await loadUpdatesModule();
      if (updates?.reloadAsync) await updates.reloadAsync();
    } catch (error) {
      console.warn('[UpdateNotice] reload failed', error);
    }
  }, []);

  if (!isUpdateNoticeEnabled() || !offer) return null;

  const kind: UpdateAvailableBannerKind = offer.kind;
  return (
    <UpdateAvailableBanner
      visible={bannerVisible}
      kind={kind}
      title={t('updateNotice.title')}
      message={kind === 'ota' ? t('updateNotice.otaMessage') : t('updateNotice.storeMessage')}
      updateLabel={t('updateNotice.updateNow')}
      laterLabel={t('updateNotice.later')}
      onUpdate={onUpdate}
      onLater={onLater}
    />
  );
}
