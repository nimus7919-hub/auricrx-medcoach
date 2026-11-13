/**
 * Firebase Identity Platform MFA for AuricRX Médicos.
 * Primary factor: TOTP. Optional backup: SMS (PhoneMultiFactorGenerator).
 */
import {
  multiFactor,
  TotpMultiFactorGenerator,
  PhoneMultiFactorGenerator,
  PhoneAuthProvider,
  getMultiFactorResolver,
  sendEmailVerification,
  type MultiFactorError,
  type MultiFactorResolver,
  type TotpSecret,
  type User,
  type MultiFactorInfo,
  type ApplicationVerifier,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { API_BASE } from '../config/api';
import { recordFullMfaSignIn } from './doctorSessionUnlock';

export type MfaFactorHint = {
  uid: string;
  factorId: string;
  displayName?: string | null;
};

export type TotpEnrollmentSession = {
  secret: TotpSecret;
  secretKey: string;
  qrCodeUrl: string;
};

function currentUserOrThrow(): User {
  const user = auth.currentUser;
  if (!user) throw new Error('not_authenticated');
  return user;
}

export function isMfaRequiredError(error: unknown): error is MultiFactorError {
  return !!(error && typeof error === 'object' && (error as any).code === 'auth/multi-factor-auth-required');
}

export function getEnrolledFactors(user?: User | null): MultiFactorInfo[] {
  const u = user || auth.currentUser;
  if (!u) return [];
  try {
    return multiFactor(u).enrolledFactors || [];
  } catch {
    return [];
  }
}

export function hasTotpEnrolled(user?: User | null): boolean {
  return getEnrolledFactors(user).some((f) => f.factorId === TotpMultiFactorGenerator.FACTOR_ID);
}

export function hasPhoneEnrolled(user?: User | null): boolean {
  return getEnrolledFactors(user).some((f) => f.factorId === PhoneMultiFactorGenerator.FACTOR_ID);
}

export async function ensureEmailVerified(user?: User | null): Promise<{ verified: boolean; sent: boolean }> {
  const u = user || currentUserOrThrow();
  await u.reload();
  if (u.emailVerified) return { verified: true, sent: false };
  await sendEmailVerification(u);
  return { verified: false, sent: true };
}

export async function startTotpEnrollment(appName = 'AuricRX Médicos'): Promise<TotpEnrollmentSession> {
  const user = currentUserOrThrow();
  if (!user.emailVerified) {
    throw new Error('email_not_verified');
  }
  const session = await multiFactor(user).getSession();
  const secret = await TotpMultiFactorGenerator.generateSecret(session);
  const qrCodeUrl = secret.generateQrCodeUrl(user.email || 'doctor', appName);
  return { secret, secretKey: secret.secretKey, qrCodeUrl };
}

export async function finishTotpEnrollment(secret: TotpSecret, code: string, displayName = 'Authenticator'): Promise<void> {
  const user = currentUserOrThrow();
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code.trim());
  await multiFactor(user).enroll(assertion, displayName);
}

export function resolverFromError(error: MultiFactorError): MultiFactorResolver {
  return getMultiFactorResolver(auth, error);
}

export function hintsFromResolver(resolver: MultiFactorResolver): MfaFactorHint[] {
  return (resolver.hints || []).map((h) => ({
    uid: h.uid,
    factorId: h.factorId,
    displayName: h.displayName,
  }));
}

export async function resolveTotpSignIn(resolver: MultiFactorResolver, enrollmentId: string, code: string) {
  const assertion = TotpMultiFactorGenerator.assertionForSignIn(enrollmentId, code.trim());
  const cred = await resolver.resolveSignIn(assertion);
  await recordFullMfaSignIn();
  return cred;
}

export async function resolvePhoneSignIn(resolver: MultiFactorResolver, verificationId: string, code: string) {
  const cred = PhoneAuthProvider.credential(verificationId, code.trim());
  const assertion = PhoneMultiFactorGenerator.assertion(cred);
  const result = await resolver.resolveSignIn(assertion);
  await recordFullMfaSignIn();
  return result;
}

/**
 * Start SMS second-factor challenge. Requires an ApplicationVerifier (web reCAPTCHA).
 * On native builds without a verifier this throws — TOTP remains the primary path.
 */
export async function startPhoneSignInChallenge(
  resolver: MultiFactorResolver,
  hintUid: string,
  verifier: ApplicationVerifier
): Promise<string> {
  const hint = resolver.hints.find((h) => h.uid === hintUid);
  if (!hint || hint.factorId !== PhoneMultiFactorGenerator.FACTOR_ID) {
    throw new Error('phone_factor_not_found');
  }
  const phoneInfoOptions = {
    multiFactorHint: hint,
    session: resolver.session,
  };
  const provider = new PhoneAuthProvider(auth);
  return provider.verifyPhoneNumber(phoneInfoOptions as any, verifier);
}

export async function startPhoneEnrollment(
  phoneNumber: string,
  verifier: ApplicationVerifier
): Promise<string> {
  const user = currentUserOrThrow();
  if (!hasTotpEnrolled(user)) {
    throw new Error('totp_required_before_sms');
  }
  const session = await multiFactor(user).getSession();
  const provider = new PhoneAuthProvider(auth);
  return provider.verifyPhoneNumber({ phoneNumber, session } as any, verifier);
}

export async function finishPhoneEnrollment(verificationId: string, code: string, displayName = 'SMS backup') {
  const user = currentUserOrThrow();
  const cred = PhoneAuthProvider.credential(verificationId, code.trim());
  const assertion = PhoneMultiFactorGenerator.assertion(cred);
  await multiFactor(user).enroll(assertion, displayName);
}

export async function generateRecoveryCodes(): Promise<string[]> {
  const user = currentUserOrThrow();
  const token = await user.getIdToken(true);
  const res = await fetch(`${API_BASE}/api/doctor/mfa/recovery/generate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `recovery_generate_failed_${res.status}`);
  }
  return data.codes as string[];
}

export async function redeemRecoveryCode(email: string, password: string, code: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/doctor/mfa/recovery/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password, code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `recovery_redeem_failed_${res.status}`);
  }
}

export { TotpMultiFactorGenerator, PhoneMultiFactorGenerator };
