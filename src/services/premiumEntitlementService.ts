import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSubscriptionStatus } from './trialService';
import { PREMIUM_TRIAL_DAYS, isPremiumFeature } from '../config/premiumFeatures';
import DeviceIdService from './deviceIdService';
import PlayIntegrityService from './playIntegrityService';
import { API_BASE } from '../config/api';

const STORAGE_KEYS = {
  PREMIUM_TRIAL_START: 'premium:trial:start',
  PREMIUM_STATUS: 'premium:status',
  DEVICE_HASH: 'premium:device:hash', // Stored hash for reference only
};

export interface PremiumEntitlement {
  hasPremiumAccess: boolean;
  isInTrial: boolean;
  trialDaysRemaining: number;
  trialStartDate?: string;
  isPremium: boolean;
}

class PremiumEntitlementService {
  private static instance: PremiumEntitlementService;

  static getInstance() {
    if (!this.instance) {
      this.instance = new PremiumEntitlementService();
    }
    return this.instance;
  }

  async checkPremiumAccess(): Promise<PremiumEntitlement> {
    try {
      // Check if user has an active premium subscription from backend
      try {
        const subStatus = await getSubscriptionStatus();
        if (subStatus?.active || subStatus?.isPremium || subStatus?.subscription?.active) {
          return {
            hasPremiumAccess: true,
            isInTrial: false,
            trialDaysRemaining: 0,
            isPremium: true,
          };
        }
      } catch (error) {
        console.log('Could not check backend subscription, checking local trial');
      }

      // Check local trial status (shared across all premium features)
      const trialStartStr = await AsyncStorage.getItem(STORAGE_KEYS.PREMIUM_TRIAL_START);
      
      if (!trialStartStr) {
        // No trial started yet
        return {
          hasPremiumAccess: true, // Can access to start trial
          isInTrial: false,
          trialDaysRemaining: PREMIUM_TRIAL_DAYS,
          isPremium: false,
        };
      }

      const trialStart = new Date(trialStartStr);
      const now = new Date();
      const daysSinceStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, PREMIUM_TRIAL_DAYS - daysSinceStart);

      return {
        hasPremiumAccess: daysRemaining > 0,
        isInTrial: daysRemaining > 0,
        trialDaysRemaining: daysRemaining,
        trialStartDate: trialStartStr,
        isPremium: false,
      };
    } catch (error) {
      console.error('Error checking premium access:', error);
      // On error, allow access but mark as not premium
      return {
        hasPremiumAccess: true,
        isInTrial: false,
        trialDaysRemaining: 0,
        isPremium: false,
      };
    }
  }

  /**
   * Start the premium trial with anti-abuse enforcement.
   * 
   * ANTI-ABUSE MEASURES:
   * 1. Generates hashed device identifier (salted SHA-256)
   * 2. Verifies with Play Integrity API (Android)
   * 3. Checks with backend: one trial per device
   * 4. Backend enforces: device hash that started trial cannot start another
   * 
   * PRIVACY:
   * - Only the hashed device ID is sent to server
   * - Original device ID never leaves the device
   * 
   * GRACEFUL DEGRADATION:
   * - If network fails, allows trial start locally but logs for backend sync
   * - If device ID unavailable, allows trial (edge case for emulators/test devices)
   * 
   * @param userId - User account ID (required for backend check)
   * @returns Success status and error message if failed
   */
  async startPremiumTrial(userId?: string): Promise<{ success: boolean; error?: string }> {
    const existing = await AsyncStorage.getItem(STORAGE_KEYS.PREMIUM_TRIAL_START);
    if (existing) {
      return { success: true }; // Trial already started
    }

    try {
      // Get hashed device identifier
      const deviceIdService = DeviceIdService.getInstance();
      const deviceHash = await deviceIdService.getDeviceHash();
      
      if (!deviceHash) {
        console.warn('Device hash unavailable - allowing trial start (edge case)');
        // Edge case: device ID unavailable (emulator, test device)
        // Allow trial but without device enforcement
        await AsyncStorage.setItem(STORAGE_KEYS.PREMIUM_TRIAL_START, new Date().toISOString());
        return { success: true };
      }

      // Play Integrity API verification (Android only)
      const playIntegrityService = PlayIntegrityService.getInstance();
      if (playIntegrityService.isAvailable()) {
        const integrityResult = await playIntegrityService.requestIntegrityToken(
          deviceHash,
          userId || 'unknown'
        );
        
        if (!integrityResult.success && !integrityResult.requiresRetry) {
          console.error('Play Integrity check failed');
          // Continue anyway - backend device-hash check is the primary enforcement
        }
      }

      // Check with backend: one trial per device
      const backendCheck = await this.checkTrialEligibilityWithBackend(deviceHash, userId);
      
      if (!backendCheck.eligible) {
        return {
          success: false,
          error: backendCheck.reason || 'Trial already used on this device',
        };
      }

      // Start trial locally
      await AsyncStorage.setItem(STORAGE_KEYS.PREMIUM_TRIAL_START, new Date().toISOString());
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_HASH, deviceHash);
      
      // Report trial start to backend (fire and forget - logged for audit)
      this.reportTrialStartToBackend(deviceHash, userId).catch(err => 
        console.error('Failed to report trial start:', err)
      );

      return { success: true };
    } catch (error: any) {
      console.error('Error starting trial:', error);
      
      // Graceful degradation: Network failures should not block legitimate users
      // Start trial locally and log for backend sync
      await AsyncStorage.setItem(STORAGE_KEYS.PREMIUM_TRIAL_START, new Date().toISOString());
      console.warn('Trial started locally due to network error - will sync with backend later');
      
      return { 
        success: true,
        error: 'Trial started offline - verification pending',
      };
    }
  }

  /**
   * Check trial eligibility with backend.
   * 
   * SERVER TODO:
   * - Endpoint: POST /api/premium/check-trial-eligibility
   * - Check if deviceHash has already started a trial
   * - Check if deviceHash is tied to a different account
   * - Return { eligible: boolean, reason?: string }
   * 
   * @param deviceHash - Hashed device identifier
   * @param userId - User account ID
   * @returns Eligibility result
   */
  private async checkTrialEligibilityWithBackend(
    deviceHash: string,
    userId?: string
  ): Promise<{ eligible: boolean; reason?: string }> {
    try {
      // TODO: Replace with actual backend endpoint when ready
      const response = await fetch(`${API_BASE}/premium/check-trial-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceHash, userId }),
      });

      if (!response.ok) {
        throw new Error(`Backend check failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Backend trial eligibility check failed:', error);
      // Graceful degradation: Network error - assume eligible but log
      return { eligible: true, reason: 'Backend check unavailable' };
    }
  }

  /**
   * Report trial start to backend for audit and enforcement.
   * 
   * SERVER TODO:
   * - Endpoint: POST /api/premium/trial-started
   * - Store deviceHash tied to userId and timestamp
   * - Enforce: same deviceHash cannot start another trial
   * - Log for abuse detection
   * 
   * @param deviceHash - Hashed device identifier
   * @param userId - User account ID
   */
  private async reportTrialStartToBackend(
    deviceHash: string,
    userId?: string
  ): Promise<void> {
    try {
      // TODO: Replace with actual backend endpoint when ready
      await fetch(`${API_BASE}/premium/trial-started`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceHash,
          userId,
          timestamp: new Date().toISOString(),
          platform: require('react-native').Platform.OS,
        }),
      });
    } catch (error) {
      console.error('Failed to report trial start to backend:', error);
      // Non-critical - trial already started locally
    }
  }

  // TODO: Wire to Google Play Billing / App Store purchases
  // When implementing real billing:
  // 1. Add react-native-purchases or expo-in-app-purchases
  // 2. Create subscription products in Google Play Console / App Store Connect
  // 3. Implement purchase flow that calls this method after successful purchase
  // 4. Store receipt validation on backend
  // 5. Sync premium status with backend via API
  async grantPremiumAccess(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PREMIUM_STATUS, JSON.stringify({
      isPremium: true,
      grantedAt: new Date().toISOString(),
      method: 'manual', // Will be 'google_play' or 'app_store' when wired
    }));
  }

  async isPremiumUser(): Promise<boolean> {
    try {
      const subStatus = await getSubscriptionStatus();
      if (subStatus?.active || subStatus?.isPremium || subStatus?.subscription?.active) {
        return true;
      }
    } catch (error) {
      // Fall through to check local status
    }

    const premiumStatus = await AsyncStorage.getItem(STORAGE_KEYS.PREMIUM_STATUS);
    if (premiumStatus) {
      const parsed = JSON.parse(premiumStatus);
      return parsed.isPremium === true;
    }
    return false;
  }
}

export default PremiumEntitlementService;
