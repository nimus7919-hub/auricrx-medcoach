import { getRegion } from './region';
import uiI18n from "../i18n";
// src/services/cloudSyncService.js
// Cloud sync service for active health data

import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

import { API_BASE as API_BASE_URL } from '../config/api';

// Keep the timeout active until the response body has been consumed.
async function requestSync(path, options = {}) {
  const token = await getAuthToken();
  if (!token) throw new Error(uiI18n.t("ui.notAuthenticated"));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-Auric-Region': getRegion() },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(uiI18n.t("ui.serverErrorValue_2600e2", { value1: response.status }));
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error(uiI18n.t("ui.serverReturnedNonJsonResponse"));
    }
    const data = await response.json();
    if (!data.ok) throw new Error(data.message || uiI18n.t("ui.syncFailed"));
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

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
    const data = await requestSync('/api/sync/push', {
      method: 'POST',
      body: JSON.stringify({ dataType, payload }),
    });

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
    const data = await requestSync(`/api/sync/pull/${dataType}`);

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
    const data = await requestSync('/api/sync/pull');

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

