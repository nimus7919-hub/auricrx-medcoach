const STRINGS = {
  'errors.notSignedIn': 'Please sign in to continue.',
  'errors.sessionExpired': 'Your session expired. Please sign in again.',
  'errors.noConnection': 'No internet connection. Check your network and try again.',
  'errors.serverUnavailable': "We're having trouble reaching the server. Please try again in a moment.",
  'errors.generic': 'Something went wrong. Please try again.',
};

const t = (key) => STRINGS[key] || key;

const {
  ERROR_CATEGORY,
  categorizeError,
  getUserFacingMessage,
  looksTechnical,
  toUserFacingError,
} = require('../userFacingError');

describe('userFacingError', () => {
  it('maps auth/token failures to session expired', () => {
    expect(categorizeError(new Error('Invalid token'))).toBe(ERROR_CATEGORY.SESSION_EXPIRED);
    expect(categorizeError(new Error('No token provided'))).toBe(ERROR_CATEGORY.SESSION_EXPIRED);
    expect(categorizeError({ status: 401 })).toBe(ERROR_CATEGORY.SESSION_EXPIRED);
    expect(getUserFacingMessage(new Error('Invalid token'), t)).toMatch(/session expired/i);
  });

  it('maps network failures', () => {
    expect(categorizeError(new Error('Network request failed'))).toBe(ERROR_CATEGORY.NO_CONNECTION);
    expect(categorizeError(new Error('Failed to fetch'))).toBe(ERROR_CATEGORY.NO_CONNECTION);
  });

  it('maps server status codes without leaking them', () => {
    const msg = toUserFacingError(new Error('Request failed with status code 500'), 'errors.generic', t);
    expect(msg).not.toMatch(/500/);
    expect(msg).toMatch(/server|wrong|try again/i);
  });

  it('detects technical strings', () => {
    expect(looksTechnical('Invalid token')).toBe(true);
    expect(looksTechnical('Request failed with status code 403')).toBe(true);
    expect(looksTechnical('Please sign in to continue.')).toBe(false);
  });

  it('keeps already-friendly messages', () => {
    expect(toUserFacingError('Please sign in to continue.', 'errors.generic', t)).toBe(
      'Please sign in to continue.'
    );
  });
});
