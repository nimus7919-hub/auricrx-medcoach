/**
 * AES-256-CBC helpers for Documents at-rest encryption.
 * Pure JS (aes-js) — no new native module. Key material is supplied by the caller
 * (expected to come from expo-secure-store).
 */
import aesjs from 'aes-js';
import * as Crypto from 'expo-crypto';

export const DOC_ENC_PREFIX = 'ARX1';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa is available in RN / Hermes for this binary string use-case
  return globalThis.btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function isEncryptedPayload(payload: string): boolean {
  return typeof payload === 'string' && payload.startsWith(`${DOC_ENC_PREFIX}:`);
}

export async function generateAesKeyBase64(): Promise<string> {
  const key = await Crypto.getRandomBytesAsync(KEY_LENGTH);
  return bytesToBase64(key);
}

export async function encryptBytesToPayload(plain: Uint8Array, keyBase64: string): Promise<string> {
  const key = base64ToBytes(keyBase64);
  if (key.length !== KEY_LENGTH) {
    throw new Error('Documents encryption key must be 32 bytes');
  }
  const iv = await Crypto.getRandomBytesAsync(IV_LENGTH);
  const padded = aesjs.padding.pkcs7.pad(plain);
  const aesCbc = new aesjs.ModeOfOperation.cbc(Array.from(key), Array.from(iv));
  const encrypted = aesCbc.encrypt(padded);
  const packed = new Uint8Array(iv.length + encrypted.length);
  packed.set(iv, 0);
  packed.set(encrypted, iv.length);
  return `${DOC_ENC_PREFIX}:${bytesToBase64(packed)}`;
}

export function decryptPayloadToBytes(payload: string, keyBase64: string): Uint8Array {
  if (!isEncryptedPayload(payload)) {
    throw new Error('Not an encrypted documents payload');
  }
  const key = base64ToBytes(keyBase64);
  if (key.length !== KEY_LENGTH) {
    throw new Error('Documents encryption key must be 32 bytes');
  }
  const packed = base64ToBytes(payload.slice(DOC_ENC_PREFIX.length + 1));
  if (packed.length <= IV_LENGTH) {
    throw new Error('Encrypted payload too short');
  }
  const iv = packed.slice(0, IV_LENGTH);
  const ciphertext = packed.slice(IV_LENGTH);
  const aesCbc = new aesjs.ModeOfOperation.cbc(Array.from(key), Array.from(iv));
  const decrypted = aesCbc.decrypt(ciphertext);
  return Uint8Array.from(aesjs.padding.pkcs7.strip(decrypted));
}

export function encryptBase64ToPayload(plainBase64: string, keyBase64: string): Promise<string> {
  return encryptBytesToPayload(base64ToBytes(plainBase64), keyBase64);
}

export function decryptPayloadToBase64(payload: string, keyBase64: string): string {
  return bytesToBase64(decryptPayloadToBytes(payload, keyBase64));
}

export { bytesToBase64, base64ToBytes };
