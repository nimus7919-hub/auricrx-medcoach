// src/services/trialService.js
// Trial eligibility and management service

import { getDeviceId } from '../utils/deviceId';
import {
  fetchWithAuth,
  getFreshIdToken,
  getLiveFirebaseUser,
  isDefinitiveAuthInvalidation,
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

function softFail(reason, category = ERROR_CATEGORY.GENERIC, extra = {}) {
  return {
    ok: false,
    softFail: true,
    reason,
    userMessage: toUserFacingError({ category }),
    ...extra,
  };
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
    throw createUserFacingError(error?.category || ERROR_CATEGORY.GENERIC, error);
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
    throw createUserFacingError(error?.category || ERROR_CATEGORY.GENERIC, error);
  }
}

/**
 * Get current subscription status.
 * Soft-fails for callers: returns { ok:false, softFail:true } instead of throwing
 * on network/server issues so UI can keep the last known state.
 *
 * sessionExpired is set ONLY when:
 *   1) first response looked like an auth failure, AND
 *   2) ID token force-refresh succeeded, AND
 *   3) retry still looked like an auth failure
 * OR Firebase itself reports a definitive auth invalidation while refreshing.
 * One transient 401, network error, or plain 500 never marks the session expired.
 */
export async function getSubscriptionStatus(user = null) {
  const live = getLiveFirebaseUser(user);
  if (!live) {
    logTechnicalError('getSubscriptionStatus', 'no live Firebase user — skipping request');
    // Do not treat "auth not ready / briefly null" as expiry — keep local session.
    return softFail('not_authenticated', ERROR_CATEGORY.NOT_SIGNED_IN);
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
    let response;
    try {
      response = await attempt(false);
    } catch (firstError) {
      logTechnicalError('getSubscriptionStatus/first', firstError);
      if (firstError?.isSessionExpired || isDefinitiveAuthInvalidation(firstError)) {
        return softFail('session_expired', ERROR_CATEGORY.SESSION_EXPIRED, {
          sessionExpired: true,
          confirmedAfterRefresh: true,
        });
      }
      // Network / transient token failure — keep last known subscription state.
      return softFail(
        firstError?.category === ERROR_CATEGORY.NO_CONNECTION ? 'no_connection' : 'unavailable',
        firstError?.category || ERROR_CATEGORY.NO_CONNECTION
      );
    }

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
        let refreshed = false;
        try {
          // Force-refresh must succeed before we can confirm expiry.
          await getAuthToken(live, { forceRefresh: true, requireAuth: true });
          refreshed = true;
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
          if (retryError?.isSessionExpired || isDefinitiveAuthInvalidation(retryError)) {
            return softFail('session_expired', ERROR_CATEGORY.SESSION_EXPIRED, {
              sessionExpired: true,
              confirmedAfterRefresh: true,
            });
          }
          // Refresh or retry failed transiently (network, timeout, plain server error).
          // Keep the user signed in and preserve last known subscription state.
          return softFail(
            retryError?.category === ERROR_CATEGORY.NO_CONNECTION ? 'no_connection' : 'unavailable',
            retryError?.category || ERROR_CATEGORY.NO_CONNECTION
          );
        }

        if (refreshed && !response.ok && looksLikeAuthFailure(response, bodyText)) {
          // Confirmed: refreshed token still rejected as invalid/unauthorized.
          return softFail('session_expired', ERROR_CATEGORY.SESSION_EXPIRED, {
            sessionExpired: true,
            confirmedAfterRefresh: true,
          });
        }
      }

      if (!response.ok) {
        return softFail('server_unavailable', ERROR_CATEGORY.SERVER_UNAVAILABLE);
      }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text().catch(() => '');
      logTechnicalError('getSubscriptionStatus/non-json', text.slice(0, 300));
      return softFail('server_unavailable', ERROR_CATEGORY.SERVER_UNAVAILABLE);
    }

    const data = await response.json();
    console.log('✅ Subscription status received');
    return data;
  } catch (error) {
    logTechnicalError('getSubscriptionStatus', error);
    if (
      (error?.isSessionExpired || error?.category === ERROR_CATEGORY.SESSION_EXPIRED) &&
      (error?.confirmedAfterRefresh || isDefinitiveAuthInvalidation(error))
    ) {
      return softFail('session_expired', ERROR_CATEGORY.SESSION_EXPIRED, {
        sessionExpired: true,
        confirmedAfterRefresh: true,
      });
    }
    if (error?.isAuthRequired || error?.category === ERROR_CATEGORY.NOT_SIGNED_IN) {
      return softFail('not_authenticated', ERROR_CATEGORY.NOT_SIGNED_IN);
    }
    return softFail('unavailable', error?.category || ERROR_CATEGORY.GENERIC);
  }
}
