// src/services/trialService.js
// Trial eligibility and management service

import { getDeviceId } from '../utils/deviceId';
import {
  fetchWithAuth,
  getFreshIdToken,
  getLiveFirebaseUser,
  looksLikeAuthFailure,
} from './authToken';
import {
  ERROR_CATEGORY,
  createUserFacingError,
  logTechnicalError,
  toUserFacingError,
} from '../utils/userFacingError';

const API_BASE_URL = 'https://auricrx-medcoach.onrender.com';

/**
 * Get a fresh Firebase ID token from the live session only.
 * Never falls back to a stale AsyncStorage snapshot.
 */
async function getAuthToken(user = null, { forceRefresh = false, requireAuth = true } = {}) {
  return getFreshIdToken({ user, forceRefresh, requireAuth });
}

/**
 * Check trial eligibility
 */
export async function checkTrialEligibility(email, phoneE164) {
  try {
    const deviceId = await getDeviceId();
    const live = getLiveFirebaseUser();
    if (!live) {
      throw createUserFacingError(ERROR_CATEGORY.NOT_SIGNED_IN, 'checkTrialEligibility');
    }

    const response = await fetchWithAuth(`${API_BASE_URL}/api/trial/eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phoneE164, deviceId }),
    });

    const data = await response.json().catch(() => ({}));
    return data;
  } catch (error) {
    logTechnicalError('checkTrialEligibility', error);
    throw createUserFacingError(categorizeOrKeep(error), error);
  }
}

/**
 * Start trial for user
 */
export async function startTrial(phoneE164, user = null) {
  try {
    const deviceId = await getDeviceId();
    const live = getLiveFirebaseUser(user);
    if (!live) {
      throw createUserFacingError(ERROR_CATEGORY.NOT_SIGNED_IN, 'startTrial');
    }

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/trial/start`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneE164, deviceId }),
      },
      { user: live }
    );

    const data = await response.json().catch(() => ({}));
    return data;
  } catch (error) {
    logTechnicalError('startTrial', error);
    throw createUserFacingError(categorizeOrKeep(error), error);
  }
}

function categorizeOrKeep(error) {
  if (error?.category) return error.category;
  if (error?.isSessionExpired) return ERROR_CATEGORY.SESSION_EXPIRED;
  if (error?.isAuthRequired) return ERROR_CATEGORY.NOT_SIGNED_IN;
  return ERROR_CATEGORY.GENERIC;
}

/**
 * Get current subscription status.
 * Soft-fails for callers: returns { ok:false, softFail:true } instead of throwing
 * on network/server issues so UI can keep the last known state.
 * On a real expired session returns { ok:false, softFail:true, sessionExpired:true }.
 */
export async function getSubscriptionStatus(user = null) {
  const live = getLiveFirebaseUser(user);
  if (!live) {
    logTechnicalError('getSubscriptionStatus', 'no live Firebase user — skipping request');
    return {
      ok: false,
      softFail: true,
      reason: 'not_authenticated',
      userMessage: toUserFacingError({ category: ERROR_CATEGORY.NOT_SIGNED_IN }),
    };
  }

  const attempt = async (forceRefresh) => {
    const token = await getAuthToken(live, { forceRefresh, requireAuth: true });
    return fetch(`${API_BASE_URL}/api/me/subscription`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  try {
    console.log('🔍 Loading subscription status…');
    let response = await attempt(false);
    let bodyText = '';

    if (!response.ok) {
      bodyText = await response.text().catch(() => '');
      logTechnicalError('getSubscriptionStatus/http', {
        status: response.status,
        body: bodyText.slice(0, 300),
      });

      // Production subscription route may return 500 "Invalid token" instead of 401.
      if (looksLikeAuthFailure(response, bodyText)) {
        console.warn('⚠️ Subscription auth failure — refreshing ID token and retrying once');
        try {
          response = await attempt(true);
          bodyText = '';
          if (!response.ok) {
            bodyText = await response.text().catch(() => '');
            logTechnicalError('getSubscriptionStatus/retry', {
              status: response.status,
              body: bodyText.slice(0, 300),
            });
          }
        } catch (retryError) {
          logTechnicalError('getSubscriptionStatus/retry-throw', retryError);
          return {
            ok: false,
            softFail: true,
            sessionExpired: true,
            reason: 'session_expired',
            userMessage: toUserFacingError({ category: ERROR_CATEGORY.SESSION_EXPIRED }),
          };
        }

        if (!response.ok && looksLikeAuthFailure(response, bodyText)) {
          return {
            ok: false,
            softFail: true,
            sessionExpired: true,
            reason: 'session_expired',
            userMessage: toUserFacingError({ category: ERROR_CATEGORY.SESSION_EXPIRED }),
          };
        }
      }

      if (!response.ok) {
        return {
          ok: false,
          softFail: true,
          reason: 'server_unavailable',
          userMessage: toUserFacingError({ category: ERROR_CATEGORY.SERVER_UNAVAILABLE }),
        };
      }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text().catch(() => '');
      logTechnicalError('getSubscriptionStatus/non-json', text.slice(0, 300));
      return {
        ok: false,
        softFail: true,
        reason: 'server_unavailable',
        userMessage: toUserFacingError({ category: ERROR_CATEGORY.SERVER_UNAVAILABLE }),
      };
    }

    const data = await response.json();
    console.log('✅ Subscription status received');
    return data;
  } catch (error) {
    logTechnicalError('getSubscriptionStatus', error);
    if (error?.isSessionExpired || error?.category === ERROR_CATEGORY.SESSION_EXPIRED) {
      return {
        ok: false,
        softFail: true,
        sessionExpired: true,
        reason: 'session_expired',
        userMessage: toUserFacingError(error),
      };
    }
    if (error?.isAuthRequired || error?.category === ERROR_CATEGORY.NOT_SIGNED_IN) {
      return {
        ok: false,
        softFail: true,
        reason: 'not_authenticated',
        userMessage: toUserFacingError(error),
      };
    }
    return {
      ok: false,
      softFail: true,
      reason: 'unavailable',
      userMessage: toUserFacingError(error),
    };
  }
}
