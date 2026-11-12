import {
  decryptPayloadToBase64,
  encryptBase64ToPayload,
  generateAesKeyBase64,
  isEncryptedPayload,
} from '../documentCrypto';

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async (n: number) => Uint8Array.from({ length: n }, (_, i) => (i * 7 + 3) % 256)),
}));

describe('documentCrypto', () => {
  it('marks encrypted payloads with ARX1 prefix', async () => {
    const key = await generateAesKeyBase64();
    const plain = globalThis.btoa('hello-documents');
    const payload = await encryptBase64ToPayload(plain, key);
    expect(isEncryptedPayload(payload)).toBe(true);
    expect(payload.startsWith('ARX1:')).toBe(true);
  });

  it('round-trips base64 document bytes', async () => {
    const key = await generateAesKeyBase64();
    const plain = globalThis.btoa(JSON.stringify({ id: 'doc-1', name: 'Lab result' }));
    const payload = await encryptBase64ToPayload(plain, key);
    const restored = decryptPayloadToBase64(payload, key);
    expect(restored).toBe(plain);
    expect(globalThis.atob(restored)).toContain('Lab result');
  });

  it('produces different ciphertext for the same plaintext (random IV)', async () => {
    const Crypto = require('expo-crypto');
    let call = 0;
    Crypto.getRandomBytesAsync.mockImplementation(async (n: number) => {
      call += 1;
      return Uint8Array.from({ length: n }, (_, i) => (i + call * 13) % 256);
    });

    const key = await generateAesKeyBase64();
    const plain = globalThis.btoa('same-bytes');
    const a = await encryptBase64ToPayload(plain, key);
    const b = await encryptBase64ToPayload(plain, key);
    expect(a).not.toBe(b);
    expect(decryptPayloadToBase64(a, key)).toBe(plain);
    expect(decryptPayloadToBase64(b, key)).toBe(plain);
  });
});
