const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { AuthError, isAuthError, verifyToken } = require('./auth-utils');

const source = fs.readFileSync(require.resolve('./index'), 'utf8');

function response() {
  return {
    statusCode: 200,
    status(n) { this.statusCode = n; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

function loadFunction(name, end, globals = {}) {
  const start = source.indexOf(`function ${name}(`);
  const code = (source.slice(start - 6, start) === 'async ' ? 'async ' : '')
    + source.slice(start, source.indexOf(end, start));
  return vm.runInNewContext(`(${code.trim()})`, globals);
}

test('isAuthError recognizes AuthError and legacy token messages', () => {
  assert.equal(isAuthError(new AuthError('No token provided')), true);
  assert.equal(isAuthError(new AuthError('Invalid token')), true);
  assert.equal(isAuthError(new Error('No token provided')), true);
  assert.equal(isAuthError(new Error('Invalid token')), true);
  assert.equal(isAuthError(new Error('Invalid token identity')), true);
  assert.equal(isAuthError(new Error('connection refused')), false);
  assert.equal(isAuthError(new Error('subscription_check_failed')), false);
});

test('verifyToken throws AuthError for missing tokens without calling Firebase', async () => {
  await assert.rejects(() => verifyToken(undefined), (err) => {
    assert.equal(err instanceof AuthError, true);
    assert.equal(err.message, 'No token provided');
    assert.equal(err.code, 'unauthorized');
    return true;
  });
  await assert.rejects(() => verifyToken(''), (err) => {
    assert.equal(isAuthError(err), true);
    return true;
  });
});

test('requireMeAuth returns 401 unauthorized for missing, invalid, or expired tokens', async () => {
  const requireMeAuth = loadFunction('requireMeAuth', '\n/**', {
    console: { log() {}, error() {} },
    AuthError,
    verifyToken: async (token) => {
      if (!token) throw new AuthError('No token provided');
      if (token === 'expired') throw new AuthError('Invalid token');
      if (token === 'bad') throw new AuthError('Invalid token');
      return { uid: 'owner' };
    },
  });

  for (const authorization of [undefined, '', 'Basic x', 'Bearer bad', 'Bearer expired']) {
    const res = response();
    let nextCalled = false;
    await requireMeAuth({ headers: { authorization } }, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 401);
    // Compare fields: response() objects may come from a VM context.
    assert.equal(res.body.error, 'unauthorized');
    assert.equal(nextCalled, false);
  }

  const ok = response();
  const req = { headers: { authorization: 'Bearer good' } };
  let allowed = false;
  await requireMeAuth(req, ok, () => { allowed = true; });
  assert.equal(allowed, true);
  assert.equal(req.userId, 'owner');
  assert.equal(ok.statusCode, 200);
});

test('GET /api/me/subscription uses requireMeAuth and keeps 500 for non-auth failures', async () => {
  const start = source.indexOf("app.get('/api/me/subscription'");
  const registration = source.slice(start, source.indexOf('\n});', start) + 4);
  let middleware;
  let handler;
  const requireMeAuth = Symbol('requireMeAuth');

  vm.runInNewContext(registration, {
    app: {
      get(path, mw, callback) {
        assert.equal(path, '/api/me/subscription');
        middleware = mw;
        handler = callback;
      },
    },
    requireMeAuth,
    console: { log() {}, error() {} },
    isAuthError,
    neonClient: async () => { throw new Error('db down'); },
  });

  assert.equal(middleware, requireMeAuth);

  const res = response();
  await handler({ userId: 'owner' }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error, 'subscription_check_failed');
});

test('POST /api/sync/push still returns 409 for empty reminder overwrite without forceClear', async () => {
  const start = source.indexOf("app.post('/api/sync/push'");
  const registration = source.slice(start, source.indexOf('\n});', start) + 4);
  let handler;
  const verifyUser = () => {};

  let updateCalled = false;
  vm.runInNewContext(registration, {
    app: {
      post(path, middleware, callback) {
        assert.equal(path, '/api/sync/push');
        assert.equal(middleware, verifyUser);
        handler = callback;
      },
    },
    verifyUser,
    console: { log() {}, error() {} },
    verifyToken: async () => ({ uid: 'owner' }),
    neonClient: Object.assign(async (strings, ...values) => {
      const sql = String.raw({ raw: strings }, ...values);
      if (sql.includes('SELECT id, sync_version, payload')) {
        return [{ id: 1, sync_version: 3, payload: [{ id: 'r1' }] }];
      }
      if (sql.includes('UPDATE health_data') || sql.includes('INSERT INTO health_data')) {
        updateCalled = true;
        return [{ id: 1 }];
      }
      return [];
    }, {}),
  });

  const blocked = response();
  await handler({
    headers: { authorization: 'Bearer valid' },
    body: { dataType: 'reminders', payload: [] },
  }, blocked);
  assert.equal(blocked.statusCode, 409);
  assert.equal(blocked.body.error, 'EMPTY_OVERWRITE_BLOCKED');
  assert.equal(updateCalled, false);

  updateCalled = false;
  const allowed = response();
  await handler({
    headers: { authorization: 'Bearer valid' },
    body: { dataType: 'reminders', payload: [], forceClear: true },
  }, allowed);
  assert.equal(allowed.statusCode, 200);
  assert.equal(allowed.body.ok, true);
  assert.equal(updateCalled, true);
});
