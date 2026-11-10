import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSubscriptionStatus } from './trialService';
import { PREMIUM_TRIAL_DAYS, isPremiumFeature } from '../config/premiumFeatures';

const STORAGE_KEYS = {
  PREMIUM_TRIAL_START: 'premium:trial:start',
  PREMIUM_STATUS: 'premium:status',
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

  async startPremiumTrial(): Promise<void> {
    const existing = await AsyncStorage.getItem(STORAGE_KEYS.PREMIUM_TRIAL_START);
    if (!existing) {
      await AsyncStorage.setItem(STORAGE_KEYS.PREMIUM_TRIAL_START, new Date().toISOString());
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
