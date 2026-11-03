import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { parseReminderTime } from '../utils/reminderTime';

// A new ID avoids inheriting the old immutable, low-importance Android channel.
export const REMINDER_CHANNEL = 'medication-reminders-v2';
const OWNER = 'auricrx-reminders-v2';
let queue = Promise.resolve();
const serialized = (work) => {
  const result = queue.then(work);
  queue = result.catch(() => {});
  return result;
};
export async function initializeReminderNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'Recordatorios / Reminders', importance: Notifications.AndroidImportance.MAX,
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
  if (!permission.granted) throw new Error('Activa las notificaciones en Ajustes. / Enable notifications in Settings.');
  if (Platform.OS === 'android') {
    const channel = await Notifications.getNotificationChannelAsync(REMINDER_CHANNEL);
    if (channel?.importance === Notifications.AndroidImportance.NONE) {
      throw new Error('Activa el canal de recordatorios en Ajustes. / Enable the reminder channel in Settings.');
    }
  }
}
function triggersFor(reminder) {
  const { hour, minute } = parseReminderTime(reminder.time);
  const base = { hour, minute, channelId: REMINDER_CHANNEL };
  const types = Notifications.SchedulableTriggerInputTypes;
  const anchor = reminder.startDate ? new Date(reminder.startDate) : new Date();
  if (Number.isNaN(anchor.getTime())) throw new Error('Invalid reminder start date');
  switch (reminder.frequency || 'daily') {
    case 'daily': return [{ ...base, type: types.DAILY }];
    case 'weekly': return [{ ...base, type: types.WEEKLY, weekday: anchor.getDay() + 1 }];
    case 'monthly': return [{ ...base, type: types.MONTHLY, day: anchor.getDate() }];
    case 'custom': {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const selected = (reminder.customDays || []).map(day => days.indexOf(day) + 1);
      if (!selected.length || selected.some(day => day < 1)) throw new Error('Selecciona los dias. / Select reminder days.');
      return selected.map(weekday => ({ ...base, type: types.WEEKLY, weekday }));
    }
    default: throw new Error('Unsupported reminder frequency');
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
        content: { title: 'Recordatorio / Reminder', body: reminder.name, sound: 'default',
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
    await ensureReminderPermission(true);
    return upsert(reminder, await Notifications.getAllScheduledNotificationsAsync());
  });
}
export function reconcileReminderNotifications(reminders) {
  return serialized(async () => {
    await ensureReminderPermission(false);
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
  await ensureReminderPermission(true);
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: 'Recordatorio de prueba / Test reminder', body: 'AuricRX MedCoach', sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10, repeats: false, channelId: REMINDER_CHANNEL },
  });
  console.info('[Reminders] test scheduled', { id, seconds: 10, channelId: REMINDER_CHANNEL });
  return id;
}
