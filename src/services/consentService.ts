import { getRegion, US_CONSENT_VERSION } from './region';
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
  await AsyncStorage.removeItem(cacheKey(uid));
}
export async function consentRequest(method = 'GET', choices?: ConsentChoices, provider?: string) {
  const user = auth.currentUser;
  const uid = user?.uid;
  if (uid && method !== 'GET') revisions.set(uid, (revisions.get(uid) || 0) + 1);
  const revision = uid ? revisions.get(uid) || 0 : 0;
  const token = await user?.getIdToken();
  if (!token) throw new Error(uiI18n.t("ui.pleaseSignInAgainIniciaSesionDeNuevo"));
  const response = await fetch(`${API_BASE}/api/consents`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Auric-Region': getRegion() },
    body: choices ? JSON.stringify({ ...choices, noticeVersion: version(), method: provider }) : undefined,
  });
  if (!response.ok) throw new Error(uiI18n.t("ui.consentCouldNotBeSavedNoSePudoGuardarElConsentimiento"));
  const result = await response.json();
  if (uid && auth.currentUser?.uid === uid && (revisions.get(uid) || 0) === revision) {
    const current = method === 'GET' ? result : { ...choices, notice_version: version() };
    // Cache failures must not turn a successful server operation into a failure.
    try {
      if (hasCurrentConsent(current)) await AsyncStorage.setItem(cacheKey(uid), JSON.stringify(current));
      else await clearConsentCache(uid);
    } catch {}
  }
  return result;
}

let prompt: ((method: string) => Promise<void>) | undefined;
export function registerConsentPrompt(handler: typeof prompt) { prompt = handler; }
export async function requireAccountConsent(method: string) {
  const current = await consentRequest();
  if (current.terms && current.privacy) return;
  if (!prompt) throw new Error(uiI18n.t("ui.consentScreenUnavailable"));
  await prompt(method);
}
