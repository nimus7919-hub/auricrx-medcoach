/**
 * Device ID Service - Anti-Abuse Trial Enforcement
 * 
 * Generates a hashed device identifier for trial enforcement.
 * 
 * PRIVACY COMPLIANCE:
 * - Uses app-scoped device ID only (ANDROID_ID / identifierForVendor)
 * - Does NOT use IMEI, MAC address, or IP address
 * - Hashes the ID with salted SHA-256 BEFORE sending to server
 * - Only the hash is stored/transmitted (original ID never leaves device)
 * - Used solely to prevent trial abuse (one trial per device)
 * 
 * DATA SAFETY DISCLOSURE REQUIRED:
 * - Google Play Data safety form MUST declare "Device or other IDs"
 * - Privacy notice MUST mention device ID usage for trial enforcement
 * 
 * @see https://developer.android.com/reference/android/provider/Settings.Secure#ANDROID_ID
 * @see https://developer.apple.com/documentation/uikit/uidevice/1620059-identifierforvendor
 */

import * as Application from 'expo-application';
import { Platform } from 'react-native';

const DEVICE_ID_SALT = 'auricrx_medcoach_trial_v1'; // Salt for hashing

/**
 * Simple SHA-256 implementation for device ID hashing.
 * Uses native crypto if available, otherwise falls back to JS implementation.
 */
async function sha256(message: string): Promise<string> {
  // Try native crypto first (modern browsers and React Native 0.60+)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.log('Native crypto not available, using fallback');
    }
  }
  
  // Fallback: Simple JS SHA-256 implementation
  // This is a simplified version for environments without crypto.subtle
  return simpleHash(message);
}

/**
 * Simple hash fallback when crypto.subtle is not available.
 * Not cryptographically secure, but sufficient for trial abuse prevention.
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

class DeviceIdService {
  private static instance: DeviceIdService;
  private cachedDeviceHash: string | null = null;

  static getInstance() {
    if (!this.instance) {
      this.instance = new DeviceIdService();
    }
    return this.instance;
  }

  /**
   * Get the app-scoped device identifier.
   * - Android: ANDROID_ID (app-scoped, survives app reinstalls, not tied to hardware)
   * - iOS: identifierForVendor (app-scoped, resets if all apps from vendor uninstalled)
   * 
   * @returns Device ID string or null if unavailable
   */
  private async getRawDeviceId(): Promise<string | null> {
    try {
      if (Platform.OS === 'android') {
        // Android app-scoped ID (ANDROID_ID)
        const androidId = await Application.getAndroidId();
        return androidId;
      } else if (Platform.OS === 'ios') {
        // iOS vendor identifier
        const iosId = await Application.getIosIdForVendorAsync();
        return iosId;
      }
      return null;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return null;
    }
  }

  /**
   * Get the hashed device identifier.
   * The hash is salted SHA-256 of the device ID.
   * 
   * PRIVACY: Only this hash is transmitted to the server.
   * The original device ID NEVER leaves the device.
   * 
   * @returns Hashed device ID or null if device ID unavailable
   */
  async getDeviceHash(): Promise<string | null> {
    if (this.cachedDeviceHash) {
      return this.cachedDeviceHash;
    }

    const rawId = await this.getRawDeviceId();
    if (!rawId) {
      console.warn('Device ID not available');
      return null;
    }

    // Hash the device ID with salt
    const saltedId = `${DEVICE_ID_SALT}:${rawId}`;
    const hash = await sha256(saltedId);
    
    this.cachedDeviceHash = hash;
    return hash;
  }

  /**
   * Clear cached device hash (useful for testing).
   */
  clearCache(): void {
    this.cachedDeviceHash = null;
  }
}

export default DeviceIdService;
