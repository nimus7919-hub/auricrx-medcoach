/**
 * Doctor plan entitlement seam.
 * Phase 1: mock grant/revoke. Future: IAP / Stripe doctor subscription.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'doctorMode:doctorPlan';

export type DoctorPlanSource = 'mock' | 'iap' | 'stripe' | 'admin';

export interface DoctorPlanEntitlement {
  doctorPlan: boolean;
  source: DoctorPlanSource;
  updatedAt: string;
}

/**
 * Local entitlement cache. Authoritative doctorPlan flag also lives on
 * Firestore doctorProfiles/{uid}.doctorPlan for security rules.
 */
export async function getLocalDoctorPlan(): Promise<DoctorPlanEntitlement | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DoctorPlanEntitlement) : null;
  } catch {
    return null;
  }
}

export async function setLocalDoctorPlan(
  doctorPlan: boolean,
  source: DoctorPlanSource = 'mock'
): Promise<DoctorPlanEntitlement> {
  const entitlement: DoctorPlanEntitlement = {
    doctorPlan,
    source,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entitlement));
  return entitlement;
}

/**
 * Future payment hook — call after successful IAP/Stripe purchase.
 * Do not implement real billing in Phase 1.
 */
export async function activateDoctorPlanFromPurchase(_receipt: {
  productId: string;
  transactionId: string;
  platform: 'ios' | 'android' | 'web';
}): Promise<DoctorPlanEntitlement> {
  // TODO(billing): validate receipt with App Store / Play / Stripe, then grant.
  return setLocalDoctorPlan(true, 'iap');
}

export async function clearLocalDoctorPlan(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
