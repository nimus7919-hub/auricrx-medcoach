import { getRegion } from './region';
import { fetchWithAuth } from './authToken';

/**
 * Authenticated fetch that waits on a live Firebase session, attaches a fresh
 * ID token, and retries once after getIdToken(true) on HTTP 401.
 */
export async function authenticatedFetch(url, options = {}) {
  const headers = {
    ...(options.headers || {}),
    'X-Auric-Region': getRegion(),
  };
  return fetchWithAuth(url, { ...options, headers });
}
