// src/utils/deviceId.js
// Device ID management for trial eligibility checks

import * as Application from 'expo-application';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'AURIC_DEVICE_ID';

/**
 * Get a stable device ID for trial eligibility
 * Prefers OS-provided IDs, falls back to generated UUID stored in AsyncStorage
 */
export async function getDeviceId() {
  try {
    // Try to get device ID from OS
    let deviceId = null;
    
    if (Platform.OS === 'android' && Application.androidId) {
      deviceId = Application.androidId;
      console.log('📱 Using Android ID:', deviceId);
    } else if (Platform.OS === 'ios') {
      // iOS only
      try {
        if (typeof Application.getIosIdForVendorAsync === 'function') {
          deviceId = await Application.getIosIdForVendorAsync();
          console.log('📱 Using iOS Vendor ID:', deviceId);
        }
      } catch (iosError) {
        console.warn('⚠️ Failed to get iOS ID:', iosError);
      }
    }
    
    // If no OS ID, try to get stored UUID
    if (!deviceId) {
      deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (deviceId) {
        console.log('📱 Using stored UUID:', deviceId);
      }
    }
    
    // Generate and store new UUID if none exists
    if (!deviceId) {
      deviceId = `uuid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('📱 Generated new UUID:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('❌ Failed to get device ID:', error);
    // Fallback: return a temporary ID for this session
    return `temp_${Date.now()}`;
  }
}

