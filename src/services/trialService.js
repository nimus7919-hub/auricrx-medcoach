// src/services/trialService.js
// Trial eligibility and management service

import { getDeviceId } from '../utils/deviceId';

const API_BASE_URL = 'https://auricrx-medcoach.onrender.com';

/**
 * Get Firebase auth token
 * @param {Object} [user] - Firebase user object (optional, will try AsyncStorage if not provided)
 */
async function getAuthToken(user = null) {
  // If user is provided, get fresh token
  if (user && user.getIdToken) {
    try {
      return await user.getIdToken();
    } catch (error) {
      console.warn('⚠️ Could not get ID token from user:', error);
    }
  }
  
  // Fallback to AsyncStorage
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const authState = await AsyncStorage.getItem('AURIC_AUTH_STATE');
  if (authState) {
    const parsed = JSON.parse(authState);
    return parsed.idToken;
  }
  return null;
}

/**
 * Check trial eligibility
 * @param {string} email - User email
 * @param {string} phoneE164 - User phone in E.164 format (e.g., +1234567890)
 * @returns {Promise<Object>} - Eligibility result
 */
export async function checkTrialEligibility(email, phoneE164) {
  try {
    const deviceId = await getDeviceId();
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/trial/eligibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ email, phoneE164, deviceId }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Trial eligibility check failed:', error);
    throw error;
  }
}

/**
 * Start trial for user
 * @param {string} phoneE164 - User phone in E.164 format
 * @param {Object} [user] - Firebase user object (optional, for fresh token)
 * @returns {Promise<Object>} - Trial start result
 */
export async function startTrial(phoneE164, user = null) {
  try {
    const deviceId = await getDeviceId();
    const token = await getAuthToken(user);
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/trial/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ phoneE164, deviceId }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Trial start failed:', error);
    throw error;
  }
}

/**
 * Get current subscription status
 * @param {Object} [user] - Firebase user object (optional, for fresh token)
 * @returns {Promise<Object>} - Subscription status
 */
export async function getSubscriptionStatus(user = null) {
  try {
    console.log('🔍 DEBUG: Starting getSubscriptionStatus...');
    const token = await getAuthToken(user);
    
    if (!token) {
      console.error('❌ DEBUG: No auth token found');
      throw new Error('Not authenticated');
    }
    
    console.log('🔍 DEBUG: Fetching subscription status from:', `${API_BASE_URL}/api/me/subscription`);
    
    const response = await fetch(`${API_BASE_URL}/api/me/subscription`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('🔍 DEBUG: Response status:', response.status);
    console.log('🔍 DEBUG: Response headers:', response.headers.get('content-type'));
    
    // Check if response is OK
    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Subscription status HTTP error:', response.status);
      console.error('❌ Response body:', text.substring(0, 500));
      throw new Error(`Server error: ${response.status}`);
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Subscription status non-JSON response');
      console.error('❌ Content-Type:', contentType);
      console.error('❌ Response body:', text.substring(0, 500));
      throw new Error('Server returned non-JSON response');
    }
    
    const data = await response.json();
    console.log('✅ DEBUG: Subscription data received:', data);
    return data;
  } catch (error) {
    console.error('❌ Subscription status check failed:', error);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
}

