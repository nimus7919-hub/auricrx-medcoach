/**
 * Shared Firebase ID-token helpers.
 * Always prefer a live auth.currentUser token; never use a stale AsyncStorage snapshot
 * for authenticated API calls.
 */
import { auth } from '../config/firebase';
import {
  ERROR_CATEGORY,
  createUserFacingError,
  logTechnicalError,
} from '../utils/userFacingError';

/**
 * @returns {import('firebase/auth').User | null}
 */
export function getLiveFirebaseUser(preferredUser = null) {
  if (preferredUser && typeof preferredUser.getIdToken === 'function') {
    return preferredUser;
  }
  return auth.currentUser || null;
}

/**
 * Fresh ID token from the live Firebase session.
 * @param {object} [opts]
 * @param {object} [opts.user] - optional Firebase user (must have getIdToken)
 * @param {boolean} [opts.forceRefresh]
 * @param {boolean} [opts.requireAuth] - throw user-facing auth error when missing
 * @returns {Promise<string|null>}
 */
export async function getFreshIdToken({
  user = null,
  forceRefresh = false,
  requireAuth = false,
} = {}) {
  const live = getLiveFirebaseUser(user);
  if (!live) {
    if (requireAuth) {
      throw createUserFacingError(ERROR_CATEGORY.NOT_SIGNED_IN, 'getFreshIdToken: no current user');
    }
    return null;
  }
  try {
    return await live.getIdToken(!!forceRefresh);
  } catch (error) {
    logTechnicalError('getFreshIdToken', error);
    if (requireAuth) {
      throw createUserFacingError(ERROR_CATEGORY.SESSION_EXPIRED, error);
    }
    return null;
  }
}

/**
 * Fetch with a live Bearer token. On HTTP 401, force-refresh the ID token and retry once.
 * Never calls when signed out.
 */
export async function fetchWithAuth(url, options = {}, { user = null } = {}) {
  const live = getLiveFirebaseUser(user);
  if (!live) {
    throw createUserFacingError(ERROR_CATEGORY.NOT_SIGNED_IN, `fetchWithAuth: signed out for ${url}`);
  }

  const buildHeaders = async (forceRefresh) => {
    const token = await live.getIdToken(!!forceRefresh);
    return {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  };

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: await buildHeaders(false),
    });
  } catch (error) {
    logTechnicalError('fetchWithAuth/network', error);
    throw createUserFacingError(ERROR_CATEGORY.NO_CONNECTION, error);
  }

  if (response.status === 401) {
    console.warn('[fetchWithAuth] 401 — refreshing ID token and retrying once');
    try {
      response = await fetch(url, {
        ...options,
        headers: await buildHeaders(true),
      });
    } catch (error) {
      logTechnicalError('fetchWithAuth/retry-network', error);
      throw createUserFacingError(ERROR_CATEGORY.NO_CONNECTION, error);
    }
    if (response.status === 401 || response.status === 403) {
      throw createUserFacingError(ERROR_CATEGORY.SESSION_EXPIRED, {
        status: response.status,
        url,
      });
    }
  }

  return response;
}

/**
 * Detect auth failures even when the server returns 500 with "Invalid token".
 */
export function looksLikeAuthFailure(response, bodyText = '') {
  if (!response) return false;
  if (response.status === 401 || response.status === 403) return true;
  const text = String(bodyText || '');
  return /invalid token|no token provided|token expired|unauthoriz|forbidden/i.test(text);
}
