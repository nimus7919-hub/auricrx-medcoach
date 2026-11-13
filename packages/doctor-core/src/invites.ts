/** Short-lived invite codes for patient↔doctor linking. */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
const DEFAULT_LENGTH = 10; // prefix + 10 chars ≈ 50 bits of entropy

function randomBody(length: number): string {
  const bytes = new Uint8Array(length);
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
    throw new Error('secure_random_unavailable');
  }
  cryptoObj.getRandomValues(bytes);
  let body = '';
  // Rejection sampling to avoid modulo bias
  const max = 256 - (256 % ALPHABET.length);
  let i = 0;
  while (body.length < length) {
    if (i === bytes.length) {
      cryptoObj.getRandomValues(bytes);
      i = 0;
    }
    const b = bytes[i++];
    if (b < max) body += ALPHABET[b % ALPHABET.length];
  }
  return body;
}

export function generateInviteCode(prefix = 'DR', length = DEFAULT_LENGTH): string {
  return `${prefix}${randomBody(length)}`;
}

export function inviteExpiresAt(ttlMinutes = 30): string {
  return inviteExpiresDate(ttlMinutes).toISOString();
}

export function inviteExpiresDate(ttlMinutes = 30): Date {
  return new Date(Date.now() + ttlMinutes * 60 * 1000);
}

export function isInviteExpired(
  expiresAt: string | Date | { toDate?: () => Date; seconds?: number } | null | undefined,
  now = new Date()
): boolean {
  if (!expiresAt) return true;
  let date: Date;
  if (expiresAt instanceof Date) date = expiresAt;
  else if (typeof expiresAt === 'string') date = new Date(expiresAt);
  else if (typeof expiresAt.toDate === 'function') date = expiresAt.toDate();
  else if (typeof expiresAt.seconds === 'number') date = new Date(expiresAt.seconds * 1000);
  else return true;
  return date.getTime() <= now.getTime();
}

export function normalizeInviteCode(code: string): string {
  return (code || '').trim().toUpperCase().replace(/\s+/g, '');
}
