import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, NativeModules, Platform } from 'react-native';
import privacy from '../../modules/health-connect/privacy.json';

// LOCAL ONLY: never send Health Connect data or consent to our server, OpenAI,
// analytics, crash logs, or the Alfred/Mimi/Pawlmer chat context.
// Deliberately independent of the server-backed general consent mechanism.
export const HEALTH_CONNECT_ENABLED = true; // Future entitlement gate belongs here; free in v1.
export const GRANTED_TYPES = ['HeartRate', 'RestingHeartRate', 'Steps', 'ExerciseSession'];
export { privacy };
const native = () => Platform.OS === 'android' ? NativeModules.AuricHealthConnect : null;
const key = userId => `@auricrx/health-connect/${encodeURIComponent(userId)}/consent`;
let epoch = 0;
let storageQueue = Promise.resolve();
const disconnectedUsers = new Set();
function storeConsent(userId, record, revision) {
  storageQueue = storageQueue.catch(() => {}).then(async () => {
    if (revision !== epoch) return;
    if (record) await AsyncStorage.setItem(key(userId), JSON.stringify(record));
    else await AsyncStorage.removeItem(key(userId));
  });
  return storageQueue;
}

export async function connectionStatus(userId) {
  if (Platform.OS !== 'android') return 'ios';
  if (!native()) return 'native-missing';
  const status = await native().getStatus();
  if (status !== 'available') return status;
  if (!userId) return 'disconnected';
  if (disconnectedUsers.has(userId)) return 'disconnected';
  const stored = await AsyncStorage.getItem(key(userId));
  let consent;
  try { consent = stored ? JSON.parse(stored) : null; } catch { return 'disconnected'; }
  if (consent?.version !== privacy.version || consent?.userId !== userId) return 'disconnected';
  const granted = JSON.parse(await native().getPermissions());
  return GRANTED_TYPES.every(type => granted.includes(type) && consent.grantedTypes?.includes(type)) ? 'connected' : 'denied';
}

// Call ONLY from the explicit checked consent screen's accept action.
export async function connectHealth(userId) {
  if (!userId || !native()) throw new Error('unavailable');
  const revision = epoch;
  disconnectedUsers.delete(userId);
  const record = { userId, timestamp: new Date().toISOString(), version: privacy.version, grantedTypes: [] };
  // Persist express consent before launching Android; recording a consent never grants read access.
  await storeConsent(userId, record, revision);
  if (revision !== epoch) return 'disconnected';
  const granted = JSON.parse(await native().requestPermissions());
  if (revision !== epoch) return 'disconnected';
  record.grantedTypes = GRANTED_TYPES.filter(type => granted.includes(type));
  await storeConsent(userId, record, revision);
  if (revision !== epoch) return 'disconnected';
  return GRANTED_TYPES.every(type => granted.includes(type)) ? 'connected' : 'denied';
}

export async function readHealth(userId) {
  const revision = epoch;
  if (await connectionStatus(userId) !== 'connected') throw new Error('denied');
  const result = JSON.parse(await native().readSnapshot());
  if (revision !== epoch || await connectionStatus(userId) !== 'connected') throw new Error('denied');
  // No persistent imported-data cache: only this screen's memory, cleared on background/unmount.
  return result;
}

export async function disconnectHealth(userId) {
  epoch += 1;
  if (userId) disconnectedUsers.add(userId);
  let storageError;
  try { if (userId) await storeConsent(userId, null, epoch); }
  catch (error) { storageError = error; }
  let revoked = false;
  try { if (native()) { await native().revokePermissions(); revoked = true; } }
  catch { /* Still clear local consent; UI directs user to system settings. */ }
  if (storageError) throw storageError;
  return revoked;
}
export async function openHealthSettings() {
  if (native()) return native().openSettings();
  return Linking.openSettings();
}
export async function openHealthStore() {
  try { await Linking.openURL('market://details?id=com.google.android.apps.healthdata'); }
  catch { await Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata'); }
}

export const statusText = {
  loading: 'Consultando conexión…', connected: 'Health Connect conectado', disconnected: 'Health Connect sin conectar',
  denied: 'Permisos denegados o incompletos. Puedes cambiarlos en Health Connect.',
  install: 'Instala o actualiza Health Connect para continuar.', unavailable: 'Health Connect no está disponible en este teléfono.',
  'native-missing': 'Esta versión no incluye el módulo Health Connect. Requiere una nueva compilación Android; no está disponible en Expo Go.',
  ios: 'Próximamente', error: 'No se pudo consultar Health Connect. Intenta de nuevo.',
};
