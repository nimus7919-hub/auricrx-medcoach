import uiI18n from "../i18n";
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { parseReminderTime } from '../utils/reminderTime';

// A new ID avoids inheriting the old immutable, low-importance Android channel.
export const REMINDER_CHANNEL = 'medication-reminders-v2';
const OWNER = 'auricrx-reminders-v2';
let queue = Promise.resolve();
const permissionListeners = new Set();
export const subscribeReminderPermission = (listener) => {
  permissionListeners.add(listener);
  return () => permissionListeners.delete(listener);
};
function publishPermission(granted) {
  permissionListeners.forEach(listener => listener(granted));
  return granted;
}
const serialized = (work) => {
  const result = queue.then(work);
  queue = result.catch(() => {});
  return result;
};
export async function initializeReminderNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: uiI18n.t("ui.recordatoriosReminders"), importance: Notifications.AndroidImportance.MAX,
      sound: 'default', enableVibrate: true, vibrationPattern: [0, 250, 250, 250],
    });
  }
}
export async function ensureReminderPermission(request = false) {
  await initializeReminderNotifications();
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && request && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!permission.granted) return publishPermission(false);
  if (Platform.OS === 'android') {
    const channel = await Notifications.getNotificationChannelAsync(REMINDER_CHANNEL);
    if (channel?.importance === Notifications.AndroidImportance.NONE) {
      return publishPermission(false);
    }
  }
  return publishPermission(true);
}
function triggersFor(reminder) {
  const { hour, minute } = parseReminderTime(reminder.time);
  const base = { hour, minute, channelId: REMINDER_CHANNEL };
  const types = Notifications.SchedulableTriggerInputTypes;
  const anchor = reminder.startDate ? new Date(reminder.startDate) : new Date();
  if (Number.isNaN(anchor.getTime())) throw new Error(uiI18n.t("ui.invalidReminderStartDate"));
  switch (reminder.frequency || 'daily') {
    case 'daily': return [{ ...base, type: types.DAILY }];
    case 'weekly': return [{ ...base, type: types.WEEKLY, weekday: anchor.getDay() + 1 }];
    case 'monthly': return [{ ...base, type: types.MONTHLY, day: anchor.getDate() }];
    case 'custom': {
      const days = [uiI18n.t("reminders.sunday"), uiI18n.t("reminders.monday"), uiI18n.t("reminders.tuesday"), uiI18n.t("reminders.wednesday"), uiI18n.t("reminders.thursday"), uiI18n.t("reminders.friday"), uiI18n.t("reminders.saturday")];
      const selected = (reminder.customDays || []).map(day => days.indexOf(day) + 1);
      if (!selected.length || selected.some(day => day < 1)) throw new Error(uiI18n.t("ui.seleccionaLosDiasSelectReminderDays"));
      return selected.map(weekday => ({ ...base, type: types.WEEKLY, weekday }));
    }
    default: throw new Error(uiI18n.t("ui.unsupportedReminderFrequency"));
  }
}
async function upsert(reminder, existing) {
  const triggers = triggersFor(reminder);
  const fingerprint = JSON.stringify({ name: reminder.name, triggers });
  const previous = existing.filter(n => n.content.data?.owner === OWNER && n.content.data?.reminderId === String(reminder.id));
  if (previous.length === triggers.length && previous.every(n => n.content.data?.fingerprint === fingerprint)) return previous.map(n => n.identifier);
  const ids = [];
  try {
    for (const [index, trigger] of triggers.entries()) {
      const id = await Notifications.scheduleNotificationAsync({
        identifier: `${OWNER}:${reminder.id}:${index}`,
        content: { title: uiI18n.t("ui.recordatorioReminder"), body: reminder.name, sound: 'default',
          data: { owner: OWNER, reminderId: String(reminder.id), fingerprint } }, trigger,
      });
      ids.push(id);
      console.info('[Reminders] scheduled', { id, trigger, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    }
    for (const old of previous) if (!ids.includes(old.identifier)) await Notifications.cancelScheduledNotificationAsync(old.identifier);
    return ids;
  } catch (error) { console.error('[Reminders] scheduling failed', { reminderId: reminder.id, error }); throw error; }
}
export function saveReminderNotification(reminder) {
  return serialized(async () => {
    if (!await ensureReminderPermission(false)) return [];
    return upsert(reminder, await Notifications.getAllScheduledNotificationsAsync());
  });
}
export function reconcileReminderNotifications(reminders) {
  return serialized(async () => {
    if (!await ensureReminderPermission(false)) return;
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    for (const reminder of reminders) await upsert(reminder, existing);
    const wanted = new Set(reminders.map(r => String(r.id)));
    for (const n of existing) {
      if (n.content.data?.owner === OWNER && !wanted.has(n.content.data?.reminderId)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  });
}
export async function testReminderNotification() {
  if (!await ensureReminderPermission(false)) return null;
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: uiI18n.t("ui.recordatorioDePruebaTestReminder"), body: uiI18n.t("ai.auricrxMedCoach"), sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10, repeats: false, channelId: REMINDER_CHANNEL },
  });
  console.info('[Reminders] test scheduled', { id, seconds: 10, channelId: REMINDER_CHANNEL });
  return id;
}
