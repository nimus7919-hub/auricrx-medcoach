import PremiumEntitlementService from '../premiumEntitlementService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PREMIUM_TRIAL_DAYS } from '../../config/premiumFeatures';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../deviceIdService', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getDeviceHash: jest.fn().mockResolvedValue('test-device-hash-123'),
    }),
  },
}));

jest.mock('../playIntegrityService', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      isAvailable: jest.fn().mockReturnValue(false),
      getIntegrityToken: jest.fn().mockResolvedValue(null),
    }),
  },
}));

jest.mock('../renewalReminderService', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      scheduleRenewalReminder: jest.fn().mockResolvedValue(undefined),
      cancelRenewalReminder: jest.fn().mockResolvedValue(undefined),
      checkAndReschedule: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

jest.mock('../trialService', () => ({
  getSubscriptionStatus: jest.fn().mockResolvedValue(null),
}));

describe('PremiumEntitlementService', () => {
  let service: PremiumEntitlementService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = PremiumEntitlementService.getInstance();
  });

  describe('Premium Gating Logic', () => {
    it('should allow access when no trial started (free tier)', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const entitlement = await service.checkPremiumAccess();

      expect(entitlement.hasPremiumAccess).toBe(true);
      expect(entitlement.isInTrial).toBe(false);
      expect(entitlement.trialDaysRemaining).toBe(PREMIUM_TRIAL_DAYS);
      expect(entitlement.isPremium).toBe(false);
    });

    it('should allow access during active trial', async () => {
      const trialStartDate = new Date();
      trialStartDate.setDate(trialStartDate.getDate() - 3);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(trialStartDate.toISOString());

      const entitlement = await service.checkPremiumAccess();

      expect(entitlement.hasPremiumAccess).toBe(true);
      expect(entitlement.isInTrial).toBe(true);
      expect(entitlement.trialDaysRemaining).toBeGreaterThan(0);
      expect(entitlement.isPremium).toBe(false);
    });

    it('should deny access after trial expires', async () => {
      const trialStartDate = new Date();
      trialStartDate.setDate(trialStartDate.getDate() - (PREMIUM_TRIAL_DAYS + 1));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(trialStartDate.toISOString());

      const entitlement = await service.checkPremiumAccess();

      expect(entitlement.hasPremiumAccess).toBe(false);
      expect(entitlement.isInTrial).toBe(false);
      expect(entitlement.trialDaysRemaining).toBe(0);
      expect(entitlement.isPremium).toBe(false);
    });

    it('should check if feature is premium-gated', () => {
      expect(service.requiresPremium('familyCircle')).toBe(true);
      expect(service.requiresPremium('pharmacySearch')).toBe(true);
      expect(service.requiresPremium('labSearch')).toBe(true);
      expect(service.requiresPremium('aiChat')).toBe(true);
      expect(service.requiresPremium('cloudBackup')).toBe(true);
    });
  });

  describe('Device-Hash Trial Anti-Abuse', () => {
    it('should allow first trial start with device hash', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ eligible: true }),
      });

      const result = await service.startPremiumTrial('test-user-123');

      expect(result.success).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'premium:trial:start',
        expect.any(String)
      );
    });

    it('should prevent duplicate trial on same device', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ eligible: false, reason: 'Device already used for trial' }),
      });

      const result = await service.startPremiumTrial('test-user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Device already used for trial');
    });

    it('should gracefully degrade if backend check fails', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await service.startPremiumTrial('test-user-123');

      expect(result.success).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'premium:trial:start',
        expect.any(String)
      );
    });
  });
});
