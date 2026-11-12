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

/** Firebase Auth codes that mean the local session is truly invalid (not a blip). */
const DEFINITIVE_AUTH_INVALIDATION = new Set([
  'auth/user-token-expired',
  'auth/invalid-user-token',
  'auth/user-disabled',
  'auth/user-not-found',
  'auth/invalid-refresh-token',
  'auth/id-token-expired',
  'auth/id-token-revoked',
]);

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
 * True only for Firebase errors that prove the session cannot be refreshed.
 * Network/timeouts/unknown errors return false so callers soft-fail instead of signing out.
 */
export function isDefinitiveAuthInvalidation(error) {
  if (!error) return false;
  const code = String(error.code || error?.customData?.code || '');
  if (DEFINITIVE_AUTH_INVALIDATION.has(code)) return true;
  const text = String(error.message || error || '');
  return /auth\/(user-token-expired|invalid-user-token|user-disabled|user-not-found|invalid-refresh-token|id-token-expired|id-token-revoked)/i.test(
    text
  );
}

/**
 * Fresh ID token from the live Firebase session.
 * @param {object} [opts]
 * @param {object} [opts.user] - optional Firebase user (must have getIdToken)
 * @param {boolean} [opts.forceRefresh]
 * @param {boolean} [opts.requireAuth] - throw when missing user / definitive invalidation
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
    if (requireAuth && isDefinitiveAuthInvalidation(error)) {
      throw createUserFacingError(ERROR_CATEGORY.SESSION_EXPIRED, error);
    }
    if (requireAuth) {
      // Transient token/network failure — do NOT treat as session expiry.
      throw createUserFacingError(ERROR_CATEGORY.NO_CONNECTION, error);
    }
    return null;
  }
}

/**
 * Fetch with a live Bearer token. On HTTP 401, force-refresh the ID token and retry once.
 * SESSION_EXPIRED is thrown only when the retry still returns 401/403 after a successful refresh.
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
    let refreshedHeaders;
    try {
      refreshedHeaders = await buildHeaders(true);
    } catch (refreshError) {
      logTechnicalError('fetchWithAuth/refresh', refreshError);
      if (isDefinitiveAuthInvalidation(refreshError)) {
        throw createUserFacingError(ERROR_CATEGORY.SESSION_EXPIRED, refreshError);
      }
      throw createUserFacingError(ERROR_CATEGORY.NO_CONNECTION, refreshError);
    }
    try {
      response = await fetch(url, {
        ...options,
        headers: refreshedHeaders,
      });
    } catch (error) {
      logTechnicalError('fetchWithAuth/retry-network', error);
      throw createUserFacingError(ERROR_CATEGORY.NO_CONNECTION, error);
    }
    // Confirmed invalid only after a successful refresh + retry still unauthorized.
    if (response.status === 401 || response.status === 403) {
      throw createUserFacingError(ERROR_CATEGORY.SESSION_EXPIRED, {
        status: response.status,
        url,
        confirmedAfterRefresh: true,
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
