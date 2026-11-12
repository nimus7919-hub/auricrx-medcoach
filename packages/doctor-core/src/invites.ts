/** Short-lived invite codes for patient↔doctor linking. */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

export function generateInviteCode(prefix = 'DR', length = 6): string {
  let body = '';
  for (let i = 0; i < length; i++) {
    body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${prefix}${body}`;
}

export function inviteExpiresAt(ttlMinutes = 30): string {
  return new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
}

export function isInviteExpired(expiresAt: string, now = new Date()): boolean {
  return new Date(expiresAt).getTime() <= now.getTime();
}

export function normalizeInviteCode(code: string): string {
  return (code || '').trim().toUpperCase().replace(/\s+/g, '');
}
