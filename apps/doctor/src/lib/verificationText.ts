/** The server sends verification status as a machine code; this maps it to an i18n key. */
export const VERIFICATION_MESSAGE_CODES = [
  'queued_registry_unavailable',
  'queued_manual_review',
  'expired',
  'approved',
  'rejected',
  'suspended',
  'revoked',
] as const;

export type VerificationMessageCode = (typeof VERIFICATION_MESSAGE_CODES)[number];

export function verificationMessageKey(code: unknown): string | null {
  return typeof code === 'string' && (VERIFICATION_MESSAGE_CODES as readonly string[]).includes(code)
    ? `doctorMode.verification.messages.${code}`
    : null;
}
