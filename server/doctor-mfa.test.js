/**
 * Unit tests for doctor MFA gate + recovery-code hashing.
 * Run: node server/doctor-mfa.test.js
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  hasSignInSecondFactor,
  generateRecoveryCodes,
  hashRecoveryCode,
  normalizeRecoveryCode,
  verifyDoctorAuth,
  RECOVERY_CODE_COUNT,
} = require('./doctor-mfa');

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(n) {
      this.statusCode = n;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('hasSignInSecondFactor requires a non-empty firebase.sign_in_second_factor claim', () => {
  assert.equal(hasSignInSecondFactor({ uid: 'd1' }), false);
  assert.equal(hasSignInSecondFactor({ uid: 'd1', firebase: {} }), false);
  assert.equal(hasSignInSecondFactor({ uid: 'd1', firebase: { sign_in_second_factor: '' } }), false);
  assert.equal(hasSignInSecondFactor({ uid: 'd1', firebase: { sign_in_second_factor: 'totp' } }), true);
  assert.equal(hasSignInSecondFactor({ uid: 'd1', firebase: { sign_in_second_factor: 'phone' } }), true);
});

test('recovery codes are unique, normalized, and hash stably with salt', () => {
  const codes = generateRecoveryCodes();
  assert.equal(codes.length, RECOVERY_CODE_COUNT);
  assert.equal(new Set(codes).size, RECOVERY_CODE_COUNT);
  const sample = codes[0];
  assert.match(sample, /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{2}$/);
  const salt = 'abc123';
  const h1 = hashRecoveryCode(sample, salt);
  const h2 = hashRecoveryCode(sample.toLowerCase().replace(/-/g, ' '), salt);
  assert.equal(h1, h2);
  assert.notEqual(h1, hashRecoveryCode(sample, 'other'));
  assert.equal(normalizeRecoveryCode('ab-cd ef'), 'ABCDEF');
});

test('verifyDoctorAuth rejects missing tokens and tokens without second factor', async () => {
  const original = require('./auth-utils').verifyToken;
  const authUtils = require('./auth-utils');

  authUtils.verifyToken = async (token) => {
    if (token === 'no-mfa') return { uid: 'doc1', firebase: { sign_in_provider: 'password' } };
    if (token === 'with-mfa') {
      return { uid: 'doc1', firebase: { sign_in_provider: 'password', sign_in_second_factor: 'totp' } };
    }
    throw new Error('Invalid token');
  };

  try {
    for (const authorization of [undefined, 'Bearer bad', 'Bearer no-mfa']) {
      const res = response();
      let allowed = false;
      await verifyDoctorAuth({ headers: { authorization } }, res, () => {
        allowed = true;
      });
      assert.equal(allowed, false);
      assert.equal(res.statusCode, 401);
      if (authorization === 'Bearer no-mfa') {
        assert.equal(res.body.error, 'MFA_REQUIRED');
      }
    }

    const req = { headers: { authorization: 'Bearer with-mfa' } };
    const res = response();
    let allowed = false;
    await verifyDoctorAuth(req, res, () => {
      allowed = true;
    });
    assert.equal(allowed, true);
    assert.equal(req.userId, 'doc1');
    assert.equal(req.decodedToken.firebase.sign_in_second_factor, 'totp');
  } finally {
    authUtils.verifyToken = original;
  }
});
