import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
let region = 'MX';
let startupConsent = null;
export const US_CONSENT_VERSION = 'US-2026-11-03';
export const getRegion = () => region;
export const getStartupConsent = () => startupConsent;
const listeners = new Set();
export const subscribeRegion = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export async function initializeRegion() {
  const saved = await AsyncStorage.getItem('AURIC_REGION');
  let country;
  try { country = require('expo-localization').getLocales()?.[0]?.regionCode; } catch {}
  const locale = NativeModules.SettingsManager?.settings?.AppleLocale || NativeModules.I18nManager?.localeIdentifier || Intl.DateTimeFormat().resolvedOptions().locale;
  region = saved === 'US' || saved === 'MX' ? saved : ((country ? country === 'US' : /[-_]US\b/i.test(locale)) ? 'US' : 'MX');
  try { startupConsent = JSON.parse(await AsyncStorage.getItem('AURIC_US_STARTUP_CONSENT') || 'null'); } catch { startupConsent = null; }
  return region;
}
export async function setRegion(value) {
  if (!['US', 'MX'].includes(value)) throw new Error('INVALID_REGION');
  await AsyncStorage.multiSet([['AURIC_REGION', value], ['AURIC_LANG', value === 'US' ? 'en' : 'es']]);
  region = value;
  listeners.forEach(listener => listener(value));
}
export function hasUSStartupConsent() {
  return startupConsent?.version === US_CONSENT_VERSION && startupConsent.terms && startupConsent.collect && startupConsent.share && startupConsent.adult;
}
export async function saveUSStartupConsent(value) {
  startupConsent = { ...value, version: US_CONSENT_VERSION, recordedAt: new Date().toISOString() };
  await AsyncStorage.setItem('AURIC_US_STARTUP_CONSENT', JSON.stringify(startupConsent));
}
