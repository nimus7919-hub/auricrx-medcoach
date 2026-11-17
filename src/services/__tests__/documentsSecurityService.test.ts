import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import DocumentsSecurityService, {
  DOCUMENTS_SECURITY_KEYS,
  IDLE_LOCK_MS,
} from '../documentsSecurityService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///docs/',
  cacheDirectory: 'file:///cache/',
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  getEnrolledLevelAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_WEAK: 2, BIOMETRIC_STRONG: 3 },
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async (n: number) => Uint8Array.from({ length: n }, (_, i) => (i * 5 + 11) % 256)),
}));

jest.mock('expo-secure-store', () => ({
  __esModule: true,
  isAvailableAsync: jest.fn(async () => true),
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

jest.mock('expo-screen-capture', () => ({
  __esModule: true,
  preventScreenCaptureAsync: jest.fn(),
  allowScreenCaptureAsync: jest.fn(),
}));

describe('DocumentsSecurityService', () => {
  let service: DocumentsSecurityService;

  beforeEach(() => {
    jest.clearAllMocks();
    DocumentsSecurityService._resetForTests();
    service = DocumentsSecurityService.getInstance();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  describe('lock preference', () => {
    it('defaults ON for new users without existing documents', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
      const init = await service.initializeLockPreference();
      expect(init.enabled).toBe(true);
      expect(init.needsPrompt).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(DOCUMENTS_SECURITY_KEYS.LOCK_ENABLED, 'true');
    });

    it('prompts existing users who already have local documents', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, isDirectory: false });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
        JSON.stringify([{ id: '1', uri: 'file:///docs/a.jpg', name: 'ID' }])
      );
      const init = await service.initializeLockPreference();
      expect(init.enabled).toBe(false);
      expect(init.needsPrompt).toBe(true);
      expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
        DOCUMENTS_SECURITY_KEYS.LOCK_ENABLED,
        expect.anything()
      );
    });

    it('persists toggle changes', async () => {
      await service.setLockEnabled(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(DOCUMENTS_SECURITY_KEYS.LOCK_ENABLED, 'false');
      expect(service.isSessionUnlocked()).toBe(true);
    });
  });

  describe('authentication', () => {
    it('continues when device has no biometrics or passcode', async () => {
      (LocalAuthentication.getEnrolledLevelAsync as jest.Mock).mockResolvedValue(
        LocalAuthentication.SecurityLevel.NONE
      );
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([]);

      const result = await service.authenticateForDocuments('Unlock', 'Cancel');
      expect(result).toEqual({ ok: true, method: 'unavailable_continue' });
      expect(service.isSessionUnlocked()).toBe(true);
      expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
    });

    it('uses device fallback (disableDeviceFallback false)', async () => {
      (LocalAuthentication.getEnrolledLevelAsync as jest.Mock).mockResolvedValue(
        LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG
      );
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([1]);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

      const result = await service.authenticateForDocuments('Unlock Documents', 'Cancel');
      expect(result.ok).toBe(true);
      expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          promptMessage: 'Unlock Documents',
          disableDeviceFallback: false,
        })
      );
    });
  });

  describe('idle lock', () => {
    it('expires after about 5 minutes', () => {
      service.unlockSession();
      expect(service.isIdleExpired()).toBe(false);
      expect(service.isIdleExpired(Date.now() + IDLE_LOCK_MS + 1)).toBe(true);
      expect(service.getIdleLockMs()).toBe(5 * 60 * 1000);
    });
  });

  describe('encryption key', () => {
    it('creates and stores an AES key in SecureStore', async () => {
      const key = await service.getOrCreateEncryptionKey();
      expect(key).toBeTruthy();
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(key);
      const again = await service.getOrCreateEncryptionKey();
      expect(again).toBe(key);
    });
  });

  describe('file migration', () => {
    it('encrypts plaintext local files without dropping them', async () => {
      const plainBase64 = globalThis.btoa('fake-image-bytes');
      (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (uri: string) => ({
        exists: uri.startsWith('file:///docs/'),
        isDirectory: false,
        size: 12,
      }));
      (FileSystem.readAsStringAsync as jest.Mock).mockImplementation(async (uri: string, opts?: any) => {
        if (opts?.encoding === 'base64') return plainBase64;
        return 'not-encrypted-yet';
      });
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await service.migrateDocumentFiles([
        { uri: 'file:///docs/photo_1.jpg', pdfUri: 'file:///docs/photo_1.pdf' },
      ]);

      expect(result.migrated).toBe(2);
      expect(result.failed).toBe(0);
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      const written = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls.map((c) => c[1]);
      expect(written.every((payload: string) => String(payload).startsWith('ARX1:'))).toBe(true);
    });
  });
});
