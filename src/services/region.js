import AsyncStorage from '@react-native-async-storage/async-storage';
import { detectRegion } from '../region/detectRegion';
let region = 'MX';
let savedRegionChoice = false;
export const hasSavedRegionChoice = () => savedRegionChoice;
let startupConsent = null;
export const US_CONSENT_VERSION = 'US-2026-11-03';
export const getRegion = () => region;
export const getStartupConsent = () => startupConsent;
const listeners = new Set();
export const subscribeRegion = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export async function initializeRegion() {
  const saved = await AsyncStorage.getItem('AURIC_REGION');
  let locales = [], calendars = [], timeZone;
  try { locales = require('expo-localization').getLocales(); } catch {}
  try { calendars = require('expo-localization').getCalendars(); } catch {}
  try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}
  savedRegionChoice = saved === 'US' || saved === 'MX';
  region = detectRegion({ locales, calendars, timeZone, savedRegion: saved });
  try { startupConsent = JSON.parse(await AsyncStorage.getItem('AURIC_US_STARTUP_CONSENT') || 'null'); } catch { startupConsent = null; }
  return region;
}
export async function setRegion(value) {
  if (!['US', 'MX'].includes(value)) throw new Error('INVALID_REGION');
  await AsyncStorage.multiSet([['AURIC_REGION', value], ['AURIC_LANG', value === 'US' ? 'en' : 'es']]);
  region = value;
  savedRegionChoice = true;
  listeners.forEach(listener => listener(value));
}
export function hasUSStartupConsent() {
  return startupConsent?.version === US_CONSENT_VERSION && startupConsent.terms && startupConsent.collect && startupConsent.share && startupConsent.adult;
}
export async function saveUSStartupConsent(value) {
  const record = { ...value, version: US_CONSENT_VERSION, recordedAt: new Date().toISOString() };
  await AsyncStorage.setItem('AURIC_US_STARTUP_CONSENT', JSON.stringify(record));
  startupConsent = record;
}
