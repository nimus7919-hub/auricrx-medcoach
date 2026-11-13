/**
 * Device unlock after a full MFA sign-in.
 * Biometrics (or device PIN) unlock the app on the same device for 30 days.
 * New device, sign-out, or expiry → full 2FA again.
 */
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { auth } from '../config/firebase';

const KEY_FULL_MFA_AT = 'doctor_full_mfa_at';
const KEY_DEVICE_ID = 'doctor_device_id';
const KEY_UNLOCKED = 'doctor_unlocked_session';

export const FULL_MFA_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function randomId() {
  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_DEVICE_ID);
  if (existing) return existing;
  const id = randomId();
  await SecureStore.setItemAsync(KEY_DEVICE_ID, id);
  return id;
}

export async function recordFullMfaSignIn(): Promise<void> {
  await getOrCreateDeviceId();
  await SecureStore.setItemAsync(KEY_FULL_MFA_AT, String(Date.now()));
  await SecureStore.setItemAsync(KEY_UNLOCKED, '1');
}

export async function clearUnlockSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_FULL_MFA_AT);
  await SecureStore.deleteItemAsync(KEY_UNLOCKED);
}

export async function markSessionLocked(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_UNLOCKED);
}

export async function isSessionUnlocked(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEY_UNLOCKED)) === '1';
}

export async function tokenHasSecondFactor(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    const result = await user.getIdTokenResult(true);
    const factor = (result.claims as any)?.firebase?.sign_in_second_factor;
    return typeof factor === 'string' && factor.length > 0;
  } catch {
    return false;
  }
}

export async function canUseBiometricUnlock(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  if (!(await tokenHasSecondFactor())) return false;
  const at = await SecureStore.getItemAsync(KEY_FULL_MFA_AT);
  if (!at) return false;
  const age = Date.now() - Number(at);
  if (!Number.isFinite(age) || age < 0 || age > FULL_MFA_MAX_AGE_MS) return false;
  if (await isSessionUnlocked()) return true;
  return true;
}

export async function needsFullMfaAgain(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return true;
  if (!(await tokenHasSecondFactor())) return true;
  const at = await SecureStore.getItemAsync(KEY_FULL_MFA_AT);
  if (!at) return true;
  const age = Date.now() - Number(at);
  return !Number.isFinite(age) || age < 0 || age > FULL_MFA_MAX_AGE_MS;
}

export async function authenticateWithBiometrics(promptMessage: string, fallbackLabel: string): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!hasHardware || !enrolled) {
    // Device PIN / passcode fallback via system UI when biometrics unavailable.
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel,
      disableDeviceFallback: false,
    });
    return result.success;
  }
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel,
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function unlockWithBiometrics(promptMessage: string, fallbackLabel: string): Promise<boolean> {
  const ok = await authenticateWithBiometrics(promptMessage, fallbackLabel);
  if (ok) await SecureStore.setItemAsync(KEY_UNLOCKED, '1');
  return ok;
}
