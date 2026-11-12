/**
 * Documents section security: lock preference, biometric/device auth,
 * at-rest file encryption (AES key in SecureStore), and Android screenshot blocking.
 *
 * Native modules added for this feature (require a new store build / runtime bump
 * beyond 1.0.0): expo-secure-store, expo-screen-capture, plus iOS NSFaceIDUsageDescription.
 * Already in runtime: expo-local-authentication, expo-crypto, expo-blur, expo-file-system.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as ScreenCapture from 'expo-screen-capture';
import { Platform } from 'react-native';
import {
  decryptPayloadToBase64,
  encryptBase64ToPayload,
  generateAesKeyBase64,
  isEncryptedPayload,
} from '../lib/documentCrypto';

export const DOCUMENTS_SECURITY_KEYS = {
  LOCK_ENABLED: 'documents:security:lockEnabled',
  PROMPT_SEEN: 'documents:security:promptSeen',
  ENCRYPTION_MIGRATED: 'documents:security:encryptionMigrated',
} as const;

const SECURE_KEY_ID = 'documents.aesKey.v1';
const IDLE_LOCK_MS = 5 * 60 * 1000;
const INDEX_FILE = () => `${FileSystem.documentDirectory}medical_documents.json`;
const PLAIN_CACHE_DIR = () => `${FileSystem.cacheDirectory}documents_secure_plain/`;

export type AuthCapability =
  | 'biometric_or_passcode'
  | 'passcode_only'
  | 'none';

export type UnlockResult =
  | { ok: true; method: 'biometric' | 'passcode' | 'unavailable_continue' }
  | { ok: false; reason: 'cancelled' | 'failed' | 'error'; message?: string };

function extensionOf(uri: string): string {
  const clean = uri.split('?')[0] || uri;
  const match = clean.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : 'bin';
}

function cachePathFor(storageUri: string): string {
  const name = storageUri.split('/').pop() || `doc_${Date.now()}`;
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${PLAIN_CACHE_DIR()}${safe}`;
}

class DocumentsSecurityService {
  private static instance: DocumentsSecurityService;
  private sessionUnlocked = false;
  private lastActiveAt = Date.now();
  /** storageUri -> plaintext cache uri */
  private plainCache = new Map<string, string>();
  /** plaintext cache uri -> storageUri */
  private reversePlainCache = new Map<string, string>();

  static getInstance() {
    if (!this.instance) this.instance = new DocumentsSecurityService();
    return this.instance;
  }

  getIdleLockMs() {
    return IDLE_LOCK_MS;
  }

  isSessionUnlocked() {
    return this.sessionUnlocked;
  }

  markActive() {
    this.lastActiveAt = Date.now();
  }

  isIdleExpired(now = Date.now()) {
    return now - this.lastActiveAt >= IDLE_LOCK_MS;
  }

  lockSession() {
    this.sessionUnlocked = false;
  }

  unlockSession() {
    this.sessionUnlocked = true;
    this.markActive();
  }

  /** Preference: null means not yet decided (may need one-time prompt). */
  async getLockEnabled(): Promise<boolean | null> {
    try {
      const value = await AsyncStorage.getItem(DOCUMENTS_SECURITY_KEYS.LOCK_ENABLED);
      if (value === null) return null;
      return value === 'true';
    } catch {
      return null;
    }
  }

  async setLockEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(DOCUMENTS_SECURITY_KEYS.LOCK_ENABLED, enabled ? 'true' : 'false');
    await AsyncStorage.setItem(DOCUMENTS_SECURITY_KEYS.PROMPT_SEEN, 'true');
    if (!enabled) {
      this.unlockSession();
    } else {
      this.lockSession();
    }
  }

  async hasSeenLockPrompt(): Promise<boolean> {
    try {
      return (await AsyncStorage.getItem(DOCUMENTS_SECURITY_KEYS.PROMPT_SEEN)) === 'true';
    } catch {
      return false;
    }
  }

  async markLockPromptSeen(): Promise<void> {
    await AsyncStorage.setItem(DOCUMENTS_SECURITY_KEYS.PROMPT_SEEN, 'true');
  }

  async hasExistingLocalDocuments(): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(INDEX_FILE());
      if (!info.exists) return false;
      const raw = await FileSystem.readAsStringAsync(INDEX_FILE());
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * New users: lock ON by default.
   * Existing users (already have local docs, never prompted): leave undecided so UI can prompt once.
   */
  async initializeLockPreference(): Promise<{
    enabled: boolean;
    needsPrompt: boolean;
  }> {
    const current = await this.getLockEnabled();
    if (current !== null) {
      return { enabled: current, needsPrompt: false };
    }

    const seen = await this.hasSeenLockPrompt();
    if (seen) {
      // Prompt was shown before but value missing — treat as off.
      await this.setLockEnabled(false);
      return { enabled: false, needsPrompt: false };
    }

    const existing = await this.hasExistingLocalDocuments();
    if (existing) {
      return { enabled: false, needsPrompt: true };
    }

    await this.setLockEnabled(true);
    return { enabled: true, needsPrompt: false };
  }

  async getAuthCapability(): Promise<AuthCapability> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const level = await LocalAuthentication.getEnrolledLevelAsync();

      if (level === LocalAuthentication.SecurityLevel.NONE) {
        return 'none';
      }
      if (hasHardware && enrolled && types.length > 0) {
        return 'biometric_or_passcode';
      }
      if (level > LocalAuthentication.SecurityLevel.NONE) {
        return 'passcode_only';
      }
      return 'none';
    } catch {
      return 'none';
    }
  }

  async authenticateForDocuments(promptMessage: string, cancelLabel: string): Promise<UnlockResult> {
    try {
      const capability = await this.getAuthCapability();
      if (capability === 'none') {
        // Never permanently lock users out when the device has no screen lock.
        this.unlockSession();
        return { ok: true, method: 'unavailable_continue' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel,
        disableDeviceFallback: false,
        biometricsSecurityLevel: 'weak',
      });

      if (result.success) {
        this.unlockSession();
        return {
          ok: true,
          method: capability === 'biometric_or_passcode' ? 'biometric' : 'passcode',
        };
      }

      return { ok: false, reason: 'cancelled' };
    } catch (error) {
      return {
        ok: false,
        reason: 'error',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async isSecureStoreAvailable(): Promise<boolean> {
    try {
      // Probe the native module; JS package may exist before a store rebuild.
      await SecureStore.isAvailableAsync();
      return true;
    } catch {
      return false;
    }
  }

  async getOrCreateEncryptionKey(): Promise<string | null> {
    try {
      const available = await SecureStore.isAvailableAsync();
      if (!available) {
        console.warn('[DocumentsSecurity] expo-secure-store unavailable — encryption deferred until native build');
        return null;
      }
      const existing = await SecureStore.getItemAsync(SECURE_KEY_ID);
      if (existing) return existing;
      const created = await generateAesKeyBase64();
      await SecureStore.setItemAsync(SECURE_KEY_ID, created, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return created;
    } catch (error) {
      console.warn('[DocumentsSecurity] SecureStore key error:', error);
      return null;
    }
  }

  async isFileEncrypted(uri: string): Promise<boolean> {
    try {
      if (!uri || !uri.startsWith('file://')) return false;
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists || info.isDirectory) return false;
      // Encrypted payloads are stored as UTF-8 strings with ARX1: prefix
      const head = await FileSystem.readAsStringAsync(uri);
      return isEncryptedPayload(head.slice(0, 64));
    } catch {
      return false;
    }
  }

  async encryptFileInPlace(uri: string): Promise<boolean> {
    if (!uri || !uri.startsWith('file://')) return false;
    const key = await this.getOrCreateEncryptionKey();
    if (!key) return false;
    try {
      if (await this.isFileEncrypted(uri)) return true;
      const plainBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const payload = await encryptBase64ToPayload(plainBase64, key);
      await FileSystem.writeAsStringAsync(uri, payload);
      this.plainCache.delete(uri);
      return true;
    } catch (error) {
      console.warn('[DocumentsSecurity] encrypt failed:', uri, error);
      return false;
    }
  }

  async ensureReadableUri(storageUri: string): Promise<string> {
    if (!storageUri) return storageUri;
    if (!storageUri.startsWith('file://')) return storageUri;

    const cached = this.plainCache.get(storageUri);
    if (cached) {
      const info = await FileSystem.getInfoAsync(cached);
      if (info.exists) return cached;
      this.plainCache.delete(storageUri);
      this.reversePlainCache.delete(cached);
    }

    const encrypted = await this.isFileEncrypted(storageUri);
    if (!encrypted) {
      return storageUri;
    }

    const key = await this.getOrCreateEncryptionKey();
    if (!key) return storageUri;

    await FileSystem.makeDirectoryAsync(PLAIN_CACHE_DIR(), { intermediates: true }).catch(() => undefined);
    const payload = await FileSystem.readAsStringAsync(storageUri);
    const plainBase64 = decryptPayloadToBase64(payload, key);
    const out = cachePathFor(storageUri);
    // Preserve a stable extension for viewers
    const withExt = out.includes('.') ? out : `${out}.${extensionOf(storageUri)}`;
    await FileSystem.writeAsStringAsync(withExt, plainBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    this.plainCache.set(storageUri, withExt);
    this.reversePlainCache.set(withExt, storageUri);
    return withExt;
  }

  async clearPlaintextCache(): Promise<void> {
    this.plainCache.clear();
    this.reversePlainCache.clear();
    try {
      await FileSystem.deleteAsync(PLAIN_CACHE_DIR(), { idempotent: true });
    } catch {
      // ignore
    }
  }

  /** Map a display/cache URI back to the encrypted storage URI when known. */
  toStorageUri(uri: string): string {
    if (!uri) return uri;
    return this.reversePlainCache.get(uri) || uri;
  }

  toStorageDocument<T extends { uri: string; pdfUri?: string }>(doc: T): T {
    return {
      ...doc,
      uri: this.toStorageUri(doc.uri),
      pdfUri: doc.pdfUri ? this.toStorageUri(doc.pdfUri) : doc.pdfUri,
    };
  }

  async migrateDocumentFiles(
    documents: Array<{ uri?: string; pdfUri?: string }>
  ): Promise<{ migrated: number; skipped: number; failed: number }> {
    const key = await this.getOrCreateEncryptionKey();
    if (!key) {
      return { migrated: 0, skipped: 0, failed: 0 };
    }

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    const uris = new Set<string>();
    for (const doc of documents) {
      if (doc.uri) uris.add(doc.uri);
      if (doc.pdfUri) uris.add(doc.pdfUri);
    }

    for (const uri of uris) {
      if (!uri.startsWith('file://')) {
        skipped += 1;
        continue;
      }
      try {
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists) {
          skipped += 1;
          continue;
        }
        if (await this.isFileEncrypted(uri)) {
          skipped += 1;
          continue;
        }
        const ok = await this.encryptFileInPlace(uri);
        if (ok) migrated += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }

    await AsyncStorage.setItem(DOCUMENTS_SECURITY_KEYS.ENCRYPTION_MIGRATED, 'true');
    return { migrated, skipped, failed };
  }

  async preventScreenshots(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      await ScreenCapture.preventScreenCaptureAsync('documents-vault');
      return true;
    } catch (error) {
      console.warn('[DocumentsSecurity] preventScreenCapture failed:', error);
      return false;
    }
  }

  async allowScreenshots(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      await ScreenCapture.allowScreenCaptureAsync('documents-vault');
    } catch (error) {
      console.warn('[DocumentsSecurity] allowScreenCapture failed:', error);
    }
  }

  /** Test helpers */
  static _resetForTests() {
    if (this.instance) {
      this.instance.sessionUnlocked = false;
      this.instance.lastActiveAt = Date.now();
      this.instance.plainCache.clear();
      this.instance.reversePlainCache.clear();
    }
  }
}

export default DocumentsSecurityService;
export { IDLE_LOCK_MS };
