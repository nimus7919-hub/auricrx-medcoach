import { getRegion, US_CONSENT_VERSION, getStartupConsent, hasUSStartupConsent } from './region';
import uiI18n from "../i18n";
import { auth } from '../config/firebase';
import { API_BASE } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const NOTICE_VERSION = '2026-11-02';
export type ConsentChoices = { terms: boolean; privacy: boolean; health: boolean; share?: boolean };
const version = () => getRegion() === 'US' ? US_CONSENT_VERSION : NOTICE_VERSION;
const cacheKey = (uid: string) => `consent:${encodeURIComponent(uid)}:${version()}`;
const revisions = new Map<string, number>();
export function hasCurrentConsent(current: any): boolean {
  return current?.terms === true && current?.privacy === true && current?.health === true &&
    current?.notice_version === version() && (getRegion() !== 'US' || current?.share === true);
}
export async function readCachedConsent(uid: string): Promise<boolean> {
  try { return hasCurrentConsent(JSON.parse(await AsyncStorage.getItem(cacheKey(uid)) || 'null')); }
  catch { return false; }
}
export async function clearConsentCache(uid?: string) {
  if (!uid) return;
  revisions.set(uid, (revisions.get(uid) || 0) + 1);
  // Consent history and pending withdrawals survive sign-out for this account.
}
// Serialize per account/region so a delayed grant cannot overwrite a withdrawal.
const operations = new Map<string, Promise<any>>();
const localMessage = () => uiI18n.language?.startsWith('es')
  ? 'No se pudieron guardar tus preferencias en este dispositivo. Intenta de nuevo.'
  : 'Your preferences could not be saved on this device. Please retry.';
export async function consentRequest(method = 'GET', choices?: ConsentChoices, provider?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error(uiI18n.language?.startsWith('es') ? 'Inicia sesi?n de nuevo.' : 'Please sign in again.');
  const region = getRegion();
  const noticeVersion = version();
  const key = cacheKey(user.uid);
  const queueKey = `${key}:pending`;
  const previous = operations.get(key) || Promise.resolve();
  const operation = previous.catch(() => {}).then(async () => {
    let current = JSON.parse(await AsyncStorage.getItem(key) || 'null');
    let pending = JSON.parse(await AsyncStorage.getItem(queueKey) || '[]');
    const persist = async (value: any) => {
      pending.push(value);
      try { await AsyncStorage.multiSet([[queueKey, JSON.stringify(pending)], [key, JSON.stringify(value)]]); }
      catch { throw new Error(localMessage()); }
      current = value;
    };
    // Bind the original onboarding event once; never copy it to a different account
    // or use it to overwrite a recorded withdrawal.
    if (region === 'US' && !current && !pending.length) {
      const startup = getStartupConsent();
      const ownerKey = `us-startup-owner:${startup?.recordedAt}`;
      const owner = startup && await AsyncStorage.getItem(ownerKey);
      if (hasUSStartupConsent() && (!owner || owner === user.uid)) {
        await AsyncStorage.setItem(ownerKey, user.uid);
        await persist({ terms: startup.terms, privacy: startup.terms, health: startup.collect,
          share: startup.share, adult: startup.adult, notice_version: startup.version,
          recordedAt: startup.recordedAt, eventId: `startup:${startup.recordedAt}:${user.uid}`, method: provider });
      }
    }
    if (method !== 'GET' && choices) await persist({ ...choices, notice_version: noticeVersion,
      recordedAt: new Date().toISOString(), eventId: `${Date.now()}:${Math.random().toString(36).slice(2)}`, method: provider });
    const request = async (verb: string, value?: any) => {
      if (auth.currentUser?.uid !== user.uid) throw new Error('ACCOUNT_CHANGED');
      const token = await user.getIdToken();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(`${API_BASE}/api/consents`, { method: verb, signal: controller.signal,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Auric-Region': region },
          body: value ? JSON.stringify({ ...value, noticeVersion: value.notice_version }) : undefined });
        if (!response.ok) throw new Error(`CONSENT_HTTP_${response.status}`);
        return await response.json();
      } finally { clearTimeout(timeout); }
    };
    try {
      while (pending.length) {
        await request('POST', pending[0]);
        pending.shift();
        await AsyncStorage.setItem(queueKey, JSON.stringify(pending));
      }
      if (method === 'GET') {
        current = await request('GET');
        await AsyncStorage.setItem(key, JSON.stringify(current));
      }
    } catch {
      // A durable local choice remains valid locally; cloud endpoints still enforce
      // server consent. Never mistake an outage for a withdrawal or missing consent.
      if (!current && pending.length) current = pending[pending.length - 1];
      if (!current) throw new Error('CONSENT_SYNC_PENDING');
    }
    return current;
  });
  operations.set(key, operation);
  try { return await operation; }
  finally { if (operations.get(key) === operation) operations.delete(key); }
}

let prompt: ((method: string) => Promise<void>) | undefined;
export function registerConsentPrompt(handler: typeof prompt) { prompt = handler; }
export async function requireAccountConsent(method: string) {
  const current = await consentRequest();
  if (current.terms && current.privacy) return;
  if (getRegion() === 'US') throw new Error(uiI18n.language?.startsWith('es') ? 'Revisa tus preferencias de privacidad en Ajustes.' : 'Review your privacy preferences in Settings.');
  if (!prompt) throw new Error(uiI18n.t("ui.consentScreenUnavailable"));
  await prompt(method);
}
