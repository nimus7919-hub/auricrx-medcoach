import { UPDATE_NOTICE_CONFIG } from '../../config/updateNotice';
import { offerKey } from './throttle';

export type UpdateKind = 'ota' | 'store';

export interface NotificationPermission {
  granted?: boolean;
  status?: string;
}

export type UpdateNotificationApi = {
  getPermissionsAsync: () => Promise<NotificationPermission>;
  scheduleNotificationAsync: (request: {
    identifier?: string;
    content: {
      title: string;
      body: string;
      sound?: string | boolean;
      data?: Record<string, string>;
      channelId?: string;
    };
    trigger: null;
  }) => Promise<string>;
  setNotificationChannelAsync?: (
    id: string,
    opts: { name: string; importance?: number; sound?: string },
  ) => Promise<unknown>;
  AndroidImportance?: { DEFAULT?: number };
};

export interface ScheduleUpdateNotificationInput {
  notifications: UpdateNotificationApi;
  kind: UpdateKind;
  version: string;
  alreadyNotifiedKey?: string | null;
  platform: 'ios' | 'android' | 'web' | string;
  title: string;
  body: string;
  /** Localized Android channel name shown in system notification settings. */
  channelName?: string;
  /** When false, skip. Never request a new permission. */
  requestPermission?: false;
}

export function isPermissionGranted(permission: NotificationPermission | null | undefined): boolean {
  if (!permission) return false;
  if (permission.granted === true) return true;
  return permission.status === 'granted';
}

export function isUpdateNotificationData(data: unknown): data is { owner: string; kind: UpdateKind; version: string } {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;
  return (
    record.owner === UPDATE_NOTICE_CONFIG.NOTIFICATION_OWNER &&
    (record.kind === 'ota' || record.kind === 'store') &&
    typeof record.version === 'string' &&
    record.version.length > 0
  );
}

/**
 * Schedule a local "update available" notification only if permission is already granted
 * and this version has not been notified yet. Never prompts.
 */
export async function maybeScheduleUpdateNotification({
  notifications,
  kind,
  version,
  alreadyNotifiedKey,
  platform,
  title,
  body,
  channelName,
}: ScheduleUpdateNotificationInput): Promise<{ scheduled: boolean; key: string }> {
  const key = offerKey(kind, version);
  if (alreadyNotifiedKey === key) return { scheduled: false, key };
  try {
    const permission = await notifications.getPermissionsAsync();
    if (!isPermissionGranted(permission)) return { scheduled: false, key };
    if (platform === 'android' && notifications.setNotificationChannelAsync) {
      await notifications.setNotificationChannelAsync(UPDATE_NOTICE_CONFIG.ANDROID_CHANNEL_ID, {
        name: channelName || 'App updates',
        importance: notifications.AndroidImportance?.DEFAULT,
        sound: 'default',
      });
    }
    await notifications.scheduleNotificationAsync({
      identifier: `${UPDATE_NOTICE_CONFIG.NOTIFICATION_OWNER}:${key}`,
      content: {
        title,
        body,
        sound: 'default',
        data: {
          owner: UPDATE_NOTICE_CONFIG.NOTIFICATION_OWNER,
          kind,
          version,
        },
        ...(platform === 'android' ? { channelId: UPDATE_NOTICE_CONFIG.ANDROID_CHANNEL_ID } : {}),
      },
      trigger: null,
    });
    return { scheduled: true, key };
  } catch {
    return { scheduled: false, key };
  }
}
