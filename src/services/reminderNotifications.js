import { readSmart, quietDate, contextualBody, occurrences } from './smartNotificationEngine';
import uiI18n from "../i18n";
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { parseReminderTime } from '../utils/reminderTime';
import { normalizeReminderDates, parseReminderDate, nextReminderOccurrence } from '../utils/reminderDate';

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
  const now = new Date();
  const dates = normalizeReminderDates(reminder, now, uiI18n.language);
  const anchor = parseReminderDate(dates.startDate);
  const end = dates.endDate ? parseReminderDate(dates.endDate) : null;
  if (end) end.setHours(23, 59, 59, 999);
  let recurring;
  let selected = [];
  switch (reminder.frequency || 'daily') {
    case 'daily': recurring = [{ ...base, type: types.DAILY }]; break;
    case 'weekly': recurring = [{ ...base, type: types.WEEKLY, weekday: anchor.getDay() + 1 }]; break;
    case 'monthly': recurring = [{ ...base, type: types.MONTHLY, day: anchor.getDate() }]; break;
    case 'custom': {
      const days = [uiI18n.t("reminders.sunday"), uiI18n.t("reminders.monday"), uiI18n.t("reminders.tuesday"), uiI18n.t("reminders.wednesday"), uiI18n.t("reminders.thursday"), uiI18n.t("reminders.friday"), uiI18n.t("reminders.saturday")];
      selected = (reminder.customDays || []).map(day => days.indexOf(day) + 1);
      if (!selected.length || selected.some(day => day < 1)) throw new Error(uiI18n.t("ui.seleccionaLosDiasSelectReminderDays"));
      recurring = selected.map(weekday => ({ ...base, type: types.WEEKLY, weekday })); break;
    }
    default: throw new Error(uiI18n.t("ui.unsupportedReminderFrequency"));
  }
  const frequency = reminder.frequency || 'daily';
  const next = nextReminderOccurrence(anchor, hour, minute, frequency, selected, now);
  // Native repeating triggers cannot express a future start or an end date.
  // Reconciliation replenishes this bounded queue when the app becomes active.
  const today = parseReminderDate('', now);
  if (!end && anchor <= today) return recurring;
  const triggers = [];
  let occurrence = next;
  while (triggers.length < 32 && (!end || occurrence <= end)) {
    triggers.push({ type: types.DATE, date: occurrence, channelId: REMINDER_CHANNEL });
    occurrence = nextReminderOccurrence(anchor, hour, minute, frequency, selected, occurrence);
  }
  return triggers;
}
async function upsert(reminder, existing) {
  const state = await readSmart();
  const body = contextualBody(reminder, state);
  // A bounded queue can express quiet hours, unlike repeating native triggers.
  const triggers = reminder.enabled === false ? [] : state.context ? occurrences(reminder, 32).map(date => ({ type: Notifications.SchedulableTriggerInputTypes.DATE, date: quietDate(date, state), channelId: REMINDER_CHANNEL })) : triggersFor(reminder);
  const fingerprint = JSON.stringify({ name: body, triggers });
  const previous = existing.filter(n => n.content.data?.owner === OWNER && n.content.data?.reminderId === String(reminder.id));
  if (previous.length === triggers.length && previous.every(n => n.content.data?.fingerprint === fingerprint)) return previous.map(n => n.identifier);
  const ids = [];
  try {
    for (const [index, trigger] of triggers.entries()) {
      const id = await Notifications.scheduleNotificationAsync({
        identifier: `${OWNER}:${reminder.id}:${index}`,
        content: { title: uiI18n.t("ui.recordatorioReminder"), body, sound: 'default',
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
