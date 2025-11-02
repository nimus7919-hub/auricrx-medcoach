// src/services/cloudSyncService.js
// Cloud sync service for active health data

import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

const API_BASE_URL = 'https://auricrx-medcoach.onrender.com';

/**
 * Get Firebase auth token
 */
async function getAuthToken() {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return token;
    }
  } catch (error) {
    console.warn('⚠️ Could not get auth token:', error);
  }
  
  // Fallback to AsyncStorage
  const authState = await AsyncStorage.getItem('AURIC_AUTH_STATE');
  if (authState) {
    const parsed = JSON.parse(authState);
    return parsed.idToken;
  }
  
  return null;
}

/**
 * Push data to cloud
 */
async function pushToCloud(dataType, payload) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ dataType, payload }),
    });
    
    // Check if response is OK
    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Cloud sync push ${dataType} HTTP error:`, response.status, text.substring(0, 200));
      throw new Error(`Server error: ${response.status}`);
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`❌ Cloud sync push ${dataType} non-JSON response:`, text.substring(0, 200));
      throw new Error('Server returned non-JSON response');
    }
    
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.message || 'Sync failed');
    }
    
    return { success: true, data };
  } catch (error) {
    console.error(`❌ Failed to sync ${dataType}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Pull data from cloud
 */
async function pullFromCloud(dataType) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/sync/pull/${dataType}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Check if response is OK
    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Cloud sync pull ${dataType} HTTP error:`, response.status, text.substring(0, 200));
      throw new Error(`Server error: ${response.status}`);
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`❌ Cloud sync pull ${dataType} non-JSON response:`, text.substring(0, 200));
      throw new Error('Server returned non-JSON response');
    }
    
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.message || 'Pull failed');
    }
    
    return { success: true, hasData: data.hasData, payload: data.data?.payload };
  } catch (error) {
    console.error(`❌ Failed to pull ${dataType}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Pull all active data
 */
async function pullAllFromCloud() {
  try {
    console.log('🔍 DEBUG: Starting pullAllFromCloud...');
    const token = await getAuthToken();
    if (!token) {
      console.error('❌ DEBUG: No auth token found');
      throw new Error('Not authenticated');
    }
    
    console.log('🔍 DEBUG: Fetching cloud data from:', `${API_BASE_URL}/api/sync/pull`);
    
    const response = await fetch(`${API_BASE_URL}/api/sync/pull`, {
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
      console.error('❌ Cloud sync pull HTTP error:', response.status);
      console.error('❌ Response body:', text.substring(0, 500));
      throw new Error(`Server error: ${response.status}`);
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Cloud sync pull non-JSON response');
      console.error('❌ Content-Type:', contentType);
      console.error('❌ Response body:', text.substring(0, 500));
      throw new Error('Server returned non-JSON response');
    }
    
    const data = await response.json();
    console.log('✅ DEBUG: Cloud data received:', Object.keys(data));
    
    if (!data.ok) {
      throw new Error(data.message || 'Pull failed');
    }
    
    return { success: true, data: data.data };
  } catch (error) {
    console.error('❌ Failed to pull all data:', error);
    console.error('❌ Error stack:', error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Cloud sync service for active health data
 */
class CloudSyncService {
  /**
   * Sync medications to cloud
   */
  async syncMedications(medications) {
    return await pushToCloud('medications', medications);
  }
  
  /**
   * Pull medications from cloud
   */
  async pullMedications() {
    return await pullFromCloud('medications');
  }
  
  /**
   * Sync reminders to cloud
   */
  async syncReminders(reminders) {
    return await pushToCloud('reminders', reminders);
  }
  
  /**
   * Pull reminders from cloud
   */
  async pullReminders() {
    return await pullFromCloud('reminders');
  }
  
  /**
   * Sync appointments to cloud
   */
  async syncAppointments(appointments) {
    return await pushToCloud('appointments', appointments);
  }
  
  /**
   * Pull appointments from cloud
   */
  async pullAppointments() {
    return await pullFromCloud('appointments');
  }
  
  /**
   * Sync doctor contacts to cloud
   */
  async syncDoctors(doctors) {
    return await pushToCloud('doctors', doctors);
  }
  
  /**
   * Pull doctor contacts from cloud
   */
  async pullDoctors() {
    return await pullFromCloud('doctors');
  }
  
  /**
   * Sync AI doctor preference
   */
  async syncAIDoctor(doctorName) {
    return await pushToCloud('ai_doctor', { doctor: doctorName });
  }
  
  /**
   * Pull AI doctor preference
   */
  async pullAIDoctor() {
    return await pullFromCloud('ai_doctor');
  }
  
  /**
   * Pull all active data from cloud
   * Called on app load to sync everything
   */
  async pullAll() {
    return await pullAllFromCloud();
  }
  
  /**
   * Wrapper for pushToCloud
   */
  async pushToCloud(dataType, payload) {
    return await pushToCloud(dataType, payload);
  }
  
  /**
   * Wrapper for pullFromCloud
   */
  async pullFromCloud(dataType) {
    return await pullFromCloud(dataType);
  }
}

export default new CloudSyncService();

