// Local smart-notification engine. Native modules are optional on older APKs.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { parseReminderTime } from '../utils/reminderTime';
import { parseReminderDate, nextReminderOccurrence } from '../utils/reminderDate';
import i18n from '../i18n';
let Location = null, Tasks = null, Fetch = null, Notifications = null;
try { const { requireOptionalNativeModule } = require('expo-modules-core');
  if (requireOptionalNativeModule('ExpoLocation')) Location = require('expo-location');
  if (requireOptionalNativeModule('ExpoTaskManager')) Tasks = require('expo-task-manager');
  if (requireOptionalNativeModule('ExpoBackgroundFetch')) Fetch = require('expo-background-fetch');
  Notifications = require('expo-notifications');
} catch (_) { /* Old native binaries retain the local settings UI. */ }
const KEY = 'auricrx:smart:v2', GEO = 'auricrx-smart-geofence', WEATHER = 'auricrx-smart-weather';
const defaults = () => ({ refill: false, timing: false, location: false, weather: false, context: false, lead: 5,
  quietStart: '22:00', quietEnd: '07:00', places: [], alerts: [], logs: [], dismissed: {}, sent: {}, inside: [], meds: [], reminders: [] });
let queue = Promise.resolve();
export async function readSmart() { const raw = await AsyncStorage.getItem(KEY); return { ...defaults(), ...(raw ? JSON.parse(raw) : {}) }; }
export function updateSmart(patch) {
  const job = queue.then(async () => { const state = await readSmart(); const next = typeof patch === 'function' ? patch(state) : { ...state, ...patch }; await AsyncStorage.setItem(KEY, JSON.stringify(next)); return next; });
  queue = job.catch(() => {}); return job;
}
export const nativeCapabilities = () => ({ location: !!Location, tasks: !!Tasks, fetch: !!Fetch });
export function linkedReminders(med, reminders) { return reminders.filter(r => String(r.medicationId) === String(med.id) || String(r.id) === String(med.reminderId) || (r.type === 'medication' && (r.medicationName || r.name) === med.name)); }
export function occurrences(reminder, count = 64, now = new Date()) {
  try { return validOccurrences(reminder,count,now); } catch { return []; }
}
function validOccurrences(reminder, count, now) {
  if (reminder.enabled === false) return [];
  const { hour, minute } = parseReminderTime(reminder.time);
  const start = parseReminderDate(reminder.startDate, now);
  const end = reminder.endDate ? parseReminderDate(reminder.endDate) : null;
  if (end) end.setHours(23, 59, 59, 999);
  const names = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const days = (reminder.customDays || []).map(d => typeof d === 'number' ? d : names.findIndex(n => i18n.t(`reminders.${n}`) === d) + 1);
  if (reminder.frequency === 'custom' && (!days.length || days.includes(0))) return [];
  const result = []; let cursor = now;
  for (let n = 0; n < count; n++) {
    cursor = nextReminderOccurrence(start, hour, minute, reminder.frequency || 'daily', days, cursor);
    if (end && cursor > end) break;
    result.push(cursor);
  } return result;
}
export function daysRemaining(med, reminders, now = new Date()) {
  if (med.remainingQuantity === '' || med.remainingQuantity == null || !(Number(med.unitsPerDose) > 0)) return null;
  const quantity = Number(med.remainingQuantity); if (!Number.isFinite(quantity) || quantity < 0) return null;
  if (quantity === 0) return 0;
  const doses = Math.floor(quantity / Number(med.unitsPerDose));
  if (doses > 2000) return null;
  const dates = linkedReminders(med, reminders).flatMap(r => occurrences(r, doses + 1, now)).sort((a,b) => a-b);
  if (doses === 0) return 0;
  if (dates.length < doses) return null;
  return Math.max(0, Math.ceil((dates[doses - 1] - now) / 86400000));
}
export function quietDate(date, state) {
  const d = new Date(date); if (!state.context || state.quietStart === state.quietEnd) return d;
  const start = parseReminderTime(state.quietStart), end = parseReminderTime(state.quietEnd);
  const a = start.hour * 60 + start.minute, b = end.hour * 60 + end.minute, m = d.getHours()*60 + d.getMinutes();
  if (a < b ? m >= a && m < b : m >= a || m < b) {
    if (a > b && m >= a) d.setDate(d.getDate()+1);
    d.setHours(end.hour, end.minute, 0, 0);
  } return d;
}
export function contextualBody(reminder, state) {
  const place = state.context && state.location && state.places.find(p => p.enabled !== false && state.inside.includes(p.id) && (!p.reminderId || String(p.reminderId) === String(reminder.id)));
  return place?.message || reminder.name;
}
async function notify(body, state, id, date = new Date(), title = 'AuricRX MedCoach') {
  if (!Notifications || !(await Notifications.getPermissionsAsync()).granted) return false;
  const when = quietDate(date, state);
  await Notifications.scheduleNotificationAsync({ identifier: id, content: { title, body, sound: 'default', data: { owner: 'auricrx-smart' } },
    trigger: when > new Date() ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: 'medication-reminders-v2' } : null }); return true;
}
export async function recordDose(med, reminders, takenAt = new Date()) {
  const candidates = linkedReminders(med, reminders).flatMap(r => occurrences(r, 4, new Date(takenAt.getTime()-86400000)).map(date => ({ r, date }))).filter(x => x.date <= new Date(takenAt.getTime()+2*3600000)).sort((a,b) => Math.abs(a.date-takenAt)-Math.abs(b.date-takenAt));
  if (!candidates.length) return;
  const { r, date } = candidates[0];
  await updateSmart(s => {
    if (!s.logs.some(l => String(l.reminderId) === String(r.id) && l.scheduled === date.toISOString())) s.logs.push({ reminderId: String(r.id), scheduled: date.toISOString(), taken: takenAt.toISOString(), delay: (takenAt-date)/60000, time: r.time });
    s.logs = s.logs.slice(-1000); return s;
  });
}
export function suggestions(state, reminders) {
  if (!state.timing) return [];
  return reminders.flatMap(r => {
    const logs = state.logs.filter(l => l.reminderId === String(r.id) && l.time === r.time).slice(-20);
    if (logs.length < 5 || state.dismissed[r.id] === r.time) return [];
    const sorted = logs.map(l => l.delay).sort((a,b) => a-b), n = sorted.length;
    const median = n%2 ? sorted[(n-1)/2] : (sorted[n/2-1]+sorted[n/2])/2;
    if (median <= 20 || median > 720) return [];
    const t = parseReminderTime(r.time); const mins = (t.hour*60+t.minute+Math.round(median))%1440;
    return [{ reminder: r, time: `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}` }];
  });
}
export async function foregroundLocation() {
  if (!Location) throw new Error('Se necesita un nuevo APK para usar ubicación.');
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error('Permiso de ubicación denegado. Puedes habilitarlo en Ajustes.');
  return Location;
}
export async function currentCoordinates() {
  const loc = await foregroundLocation(); const result = await loc.getCurrentPositionAsync({ accuracy: loc.Accuracy.Balanced }); return result.coords;
}
export async function addressCoordinates(address) {
  const loc = await foregroundLocation(); const results = await loc.geocodeAsync(address);
  if (!results.length) throw new Error('No se encontró esa dirección.'); return results[0];
}
export async function backgroundPermission() {
  await foregroundLocation();
  if (!Tasks || !await Tasks.isAvailableAsync()) throw new Error('Se necesita un nuevo APK con tareas en segundo plano.');
  if (!(await Location.requestBackgroundPermissionsAsync()).granted) throw new Error('Ubicación en segundo plano denegada. Selecciona permitir siempre en Ajustes.');
}
export async function syncGeofences(state) {
  if (!Location || !Tasks || !await Tasks.isAvailableAsync()) return;
  const places = state.location ? state.places.filter(p => p.enabled !== false) : [];
  if (!places.length) { if (await Location.hasStartedGeofencingAsync(GEO)) await Location.stopGeofencingAsync(GEO); return; }
  if (!(await Location.getBackgroundPermissionsAsync()).granted) return;
  await Location.startGeofencingAsync(GEO, places.map(p => ({ identifier: p.id, latitude: p.latitude, longitude: p.longitude, radius: p.radius, notifyOnEnter: true, notifyOnExit: true })));
}
export async function checkWeather(background = false) {
  const s = await readSmart(); if (!s.weather || !s.weatherCoords || !s.alerts.length || !Notifications || !(await Notifications.getPermissionsAsync()).granted) return false;
  const now = new Date(), day = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
  if (background && now.getHours() < 7) return false;
  if (s.weatherChecked === day) return false;
  const { latitude, longitude } = s.weatherCoords;
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
  let response;
  try { response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation,uv_index&forecast_days=1&timezone=auto`, { signal: controller.signal }); } finally { clearTimeout(timeout); }
  if (!response.ok) throw new Error('No se pudo consultar el pronóstico.');
  const data = await response.json(), h = data.hourly;
  if (!h?.temperature_2m?.length) throw new Error('Pronóstico incompleto.');
  for (const alert of s.alerts.filter(a => a.enabled !== false)) {
    const values = h[({ heat: 'temperature_2m', cold: 'temperature_2m', rain: 'precipitation', humidity: 'relative_humidity_2m', uv: 'uv_index' })[alert.condition]] || [];
    const match = values.some(v => v != null && (alert.condition === 'cold' ? v < alert.threshold : alert.condition === 'rain' ? v > 0 : v > alert.threshold));
    if (match && s.sent[alert.id] !== day && await notify(alert.message, s, `smart-weather:${alert.id}:${day}`)) {
      await updateSmart(latest => { latest.sent[alert.id] = day; return latest; });
    }
  }
  await updateSmart({ weatherChecked: day }); return true;
}
let reconcileQueue = Promise.resolve();
export function reconcileSmart(meds, reminders) {
  const job = reconcileQueue.then(() => reconcileSmartNow(meds,reminders)); reconcileQueue = job.catch(() => {}); return job;
}
async function reconcileSmartNow(meds, reminders) {
  const s = await updateSmart({ meds, reminders });
  if (Notifications) {
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    const desired = new Set();
    if (s.refill) for (const med of meds.filter(m => m.status !== "stopped")) {
      const days = daysRemaining(med, reminders); if (days == null) continue;
      const id = `smart-refill:${med.id}`; desired.add(id);
      const fingerprint = JSON.stringify([med.remainingQuantity, med.unitsPerDose, linkedReminders(med, reminders), s.lead, s.context, s.quietStart, s.quietEnd]);
      const previous = pending.find(n => n.identifier === id);
      if (previous?.content.data?.fingerprint === fingerprint) continue;
      const planKey = fingerprint + ':' + med.id;
      if (s.refillPlans?.[med.id]?.key === planKey && new Date(s.refillPlans[med.id].date) <= new Date()) continue;
      const date = new Date(Date.now()+Math.max(0,days-s.lead)*86400000); date.setHours(9,0,0,0);
      const when = quietDate(new Date(Math.max(Date.now()+2000,date.getTime())),s);
      if ((await Notifications.getPermissionsAsync()).granted) { await updateSmart(latest => { latest.refillPlans = { ...latest.refillPlans, [med.id]: { key: planKey, date: when.toISOString() } }; return latest; }); await Notifications.scheduleNotificationAsync({ identifier: id, content: { title: 'Predicción de recarga', body: `Te quedan ~${Math.min(days,s.lead)} días de ${med.name}. Considera surtir tu receta.`, data: { owner: 'auricrx-smart', fingerprint }, sound: 'default' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: 'medication-reminders-v2' } }); }
    }
    for (const n of pending) if (n.identifier.startsWith('smart-refill:') && !desired.has(n.identifier)) await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
  if (Notifications) for (const n of await Notifications.getAllScheduledNotificationsAsync()) {
    if ((!s.weather && n.identifier.startsWith('smart-weather:')) || (!s.location && n.identifier.startsWith('smart-place:')) || (n.identifier.startsWith('smart-place:') && !s.places.some(p => n.identifier === 'smart-place:'+p.id)) || (n.identifier.startsWith('smart-weather:') && !s.alerts.some(a => n.identifier.startsWith('smart-weather:'+a.id+':')))) await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
  await syncGeofences(s);
  if (Tasks && Fetch && await Tasks.isAvailableAsync()) {
    if (s.weather && s.alerts.length) await Fetch.registerTaskAsync(WEATHER, { minimumInterval: 3600, stopOnTerminate: false, startOnBoot: true });
    else if (await Tasks.isTaskRegisteredAsync(WEATHER)) await Fetch.unregisterTaskAsync(WEATHER);
  }
  await checkWeather().catch(error => console.warn('[Smart weather]', error.message));
}
export async function smartStatus() {
  const s = await readSmart(); const permission = Notifications && (await Notifications.getPermissionsAsync()).granted;
  const pending = permission ? await Notifications.getAllScheduledNotificationsAsync() : [];
  const geo = !!(Location && Tasks && await Tasks.isAvailableAsync() && await Location.hasStartedGeofencingAsync(GEO) && (await Location.getBackgroundPermissionsAsync()).granted);
  const weather = !!(s.weather && s.alerts.length && s.weatherCoords && Fetch && Tasks && await Tasks.isAvailableAsync() && await Fetch.getStatusAsync() === Fetch.BackgroundFetchStatus.Available && await Tasks.isTaskRegisteredAsync(WEATHER));
  const timing = !!s.timing && s.reminders.some(r => r.enabled !== false);
  return { permission: !!permission, geo, weather, timing, active: timing || !!permission && (pending.some(n => n.identifier.startsWith('smart-refill:')) || (s.location && geo) || weather || (s.context && pending.some(n => n.content.data?.owner === 'auricrx-reminders-v2')) || suggestions(s,s.reminders).length > 0) };
}
// Definitions must run in module scope for headless execution.
if (Tasks) {
  try {
    Tasks.defineTask(GEO, async ({ data, error }) => {
      if (error || !data) return;
      const s = await readSmart(); if (!s.location) return;
      const place = s.places.find(p => p.id === data.region.identifier && p.enabled !== false); if (!place) return;
      const entering = data.eventType === Location.GeofencingEventType.Enter;
      const next = await updateSmart(latest => { latest.inside = latest.inside.filter(id => id !== place.id); if (entering) latest.inside.push(place.id); return latest; });
      if ((place.event || 'enter') === (entering ? 'enter' : 'exit')) await notify(place.message, next, `smart-place:${place.id}`);
      // Refresh tailored text for already scheduled reminders, using stored local data.
      const { reconcileReminderNotifications } = require('./reminderNotifications');
      await reconcileReminderNotifications(next.reminders);
    });
    Tasks.defineTask(WEATHER, async () => { try { return await checkWeather(true) ? Fetch.BackgroundFetchResult.NewData : Fetch.BackgroundFetchResult.NoData; } catch { return Fetch.BackgroundFetchResult.Failed; } });
  } catch (_) { /* Native task runtime unavailable. */ }
}
