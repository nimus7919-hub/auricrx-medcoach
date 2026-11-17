import { DoctorApiError, extractErrorCode, localizeError, normalizeErrorCode } from '../errors';
import { resources } from '../../i18n/resources';

function makeT(lang: 'en' | 'es') {
  const tree = resources[lang].translation as any;
  return (key: string, opts?: Record<string, unknown>) => {
    const v = key.split('.').reduce((o: any, k) => (o ? o[k] : undefined), tree);
    return typeof v === 'string' ? v : ((opts && (opts.defaultValue as string)) ?? key);
  };
}

describe('error mapping', () => {
  it('normalizes Firebase and server codes', () => {
    expect(normalizeErrorCode('auth/invalid-credential')).toBe('auth_invalid_credential');
    expect(normalizeErrorCode('request_failed_500')).toBe('request_failed');
    expect(normalizeErrorCode('recovery_redeem_failed_401')).toBe('recovery_redeem_failed');
    expect(normalizeErrorCode('MFA_REQUIRED')).toBe('mfa_required');
  });

  it('extracts codes from Firebase errors, API errors, plain codes and network failures', () => {
    expect(extractErrorCode({ code: 'auth/wrong-password', message: 'Firebase: Error (auth/wrong-password).' })).toBe('auth_wrong_password');
    expect(extractErrorCode(new Error('Firebase: Error (auth/too-many-requests).'))).toBe('auth_too_many_requests');
    expect(extractErrorCode(new DoctorApiError('forbidden', 403))).toBe('forbidden');
    expect(extractErrorCode(new Error('doctor_not_ready'))).toBe('doctor_not_ready');
    expect(extractErrorCode(new TypeError('Network request failed'))).toBe('network_error');
    expect(extractErrorCode(new Error('Something free-form went wrong here'))).toBeNull();
    expect(extractErrorCode(null)).toBeNull();
  });

  it.each(['en', 'es'] as const)('never returns the raw Firebase/server English text (%s)', (lang) => {
    const t = makeT(lang);
    const raw = 'Firebase: Error (auth/invalid-credential).';
    const out = localizeError(new Error(raw), t);
    expect(out).not.toContain('Firebase');
    expect(out).not.toContain('auth/');
    expect(out).toBe((resources[lang].translation as any).errors.auth_invalid_credential);
  });

  it('uses the screen fallback for unknown errors instead of the raw message', () => {
    const t = makeT('es');
    const out = localizeError(new Error('Totally unexpected server prose'), t, 'doctorMode.onboarding.saveFailed');
    expect(out).toBe((resources.es.translation as any).doctorMode.onboarding.saveFailed);
    expect(out).not.toMatch(/unexpected/i);
  });

  it('falls back to the generic message when the fallback key is missing too', () => {
    const t = makeT('en');
    expect(localizeError({}, t, 'does.not.exist')).toBe((resources.en.translation as any).errors.generic);
  });

  it('every code the app or server can throw has a message in both languages', () => {
    const codes = [
      'doctor_not_ready', 'invalid_invite', 'expired_invite', 'invite_role_mismatch', 'cannot_link_self',
      'not_found', 'forbidden', 'doctor_profile_required', 'not_authenticated', 'request_failed',
      'appointment_request_needs_review', 'reply_text_required', 'plan_failed', 'office_hours_failed',
      'waitlist_failed', 'draft_failed', 'auth_invalid_credential', 'auth_user_not_found', 'auth_email_already_in_use',
      'auth_weak_password', 'auth_invalid_verification_code', 'email_not_verified', 'totp_not_enrolled',
      'invalid_recovery_code', 'mfa_required', 'invalid_submission', 'mock_grants_disabled',
    ];
    for (const lang of ['en', 'es'] as const) {
      const errs = (resources[lang].translation as any).errors;
      for (const c of codes) expect(typeof errs[c]).toBe('string');
    }
  });
});
