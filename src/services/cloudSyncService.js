import { getRegion } from './region';
// src/services/cloudSyncService.js
// Cloud sync service for active health data

import { API_BASE as API_BASE_URL } from '../config/api';
import { fetchWithAuth, getLiveFirebaseUser } from './authToken';
import {
  ERROR_CATEGORY,
  createUserFacingError,
  logTechnicalError,
  toUserFacingError,
} from '../utils/userFacingError';

// Keep the timeout active until the response body has been consumed.
async function requestSync(path, options = {}) {
  const live = getLiveFirebaseUser();
  if (!live) {
    throw createUserFacingError(ERROR_CATEGORY.NOT_SIGNED_IN, `requestSync ${path}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}${path}`,
      {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Auric-Region': getRegion(),
          ...(options.headers || {}),
        },
        signal: controller.signal,
      },
      { user: live }
    );

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      logTechnicalError('cloudSync/http', { path, status: response.status, body: bodyText.slice(0, 300) });
      if (response.status === 401 || response.status === 403) {
        throw createUserFacingError(ERROR_CATEGORY.SESSION_EXPIRED, { status: response.status, path });
      }
      throw createUserFacingError(ERROR_CATEGORY.SERVER_UNAVAILABLE, { status: response.status, path });
    }
    if (!response.headers.get('content-type')?.includes('application/json')) {
      logTechnicalError('cloudSync/non-json', path);
      throw createUserFacingError(ERROR_CATEGORY.SERVER_UNAVAILABLE, path);
    }
    const data = await response.json();
    if (!data.ok) {
      logTechnicalError('cloudSync/api', data);
      throw createUserFacingError(ERROR_CATEGORY.SERVER_UNAVAILABLE, data.message || data.error);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Push data to cloud
 */
async function pushToCloud(dataType, payload, options = {}) {
  try {
    const body = { dataType, payload };
    if (options.forceClear) body.forceClear = true;
    const data = await requestSync('/api/sync/push', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return { success: true, data };
  } catch (error) {
    logTechnicalError(`pushToCloud:${dataType}`, error);
    return { success: false, error: toUserFacingError(error) };
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
    logTechnicalError(`pullFromCloud:${dataType}`, error);
    return { success: false, error: toUserFacingError(error) };
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
    logTechnicalError('pullAllFromCloud', error);
    return { success: false, error: toUserFacingError(error) };
  }
}

/**
 * Cloud sync service for active health data
 */
class CloudSyncService {
  async syncMedications(medications) {
    return await pushToCloud('medications', medications);
  }

  async pullMedications() {
    return await pullFromCloud('medications');
  }

  async syncReminders(reminders, options = {}) {
    return await pushToCloud('reminders', reminders, options);
  }

  async pullReminders() {
    return await pullFromCloud('reminders');
  }

  async syncAppointments(appointments) {
    return await pushToCloud('appointments', appointments);
  }

  async pullAppointments() {
    return await pullFromCloud('appointments');
  }

  async syncDoctors(doctors) {
    return await pushToCloud('doctors', doctors);
  }

  async pullDoctors() {
    return await pullFromCloud('doctors');
  }

  async syncAIDoctor(doctorName) {
    return await pushToCloud('ai_doctor', { doctor: doctorName });
  }

  async pullAIDoctor() {
    return await pullFromCloud('ai_doctor');
  }

  async pullAll() {
    return await pullAllFromCloud();
  }

  async pushToCloud(dataType, payload) {
    return await pushToCloud(dataType, payload);
  }

  async pullFromCloud(dataType) {
    return await pullFromCloud(dataType);
  }
}

export default new CloudSyncService();
