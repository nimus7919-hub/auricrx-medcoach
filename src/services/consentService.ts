import { auth } from '../config/firebase';
import { API_BASE } from '../config/api';

export const NOTICE_VERSION = '2026-11-02';
export type ConsentChoices = { terms: boolean; privacy: boolean; health: boolean };
export async function consentRequest(method = 'GET', choices?: ConsentChoices, provider?: string) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Please sign in again. / Inicia sesión de nuevo.');
  const response = await fetch(`${API_BASE}/api/consents`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: choices ? JSON.stringify({ ...choices, noticeVersion: NOTICE_VERSION, method: provider }) : undefined,
  });
  if (!response.ok) throw new Error('Consent could not be saved. / No se pudo guardar el consentimiento.');
  return response.json();
}

let prompt: ((method: string) => Promise<void>) | undefined;
export function registerConsentPrompt(handler: typeof prompt) { prompt = handler; }
export async function requireAccountConsent(method: string) {
  const current = await consentRequest();
  if (current.terms && current.privacy) return;
  if (!prompt) throw new Error('Consent screen unavailable');
  await prompt(method);
}
