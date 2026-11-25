/**
 * PROFECO auto-match flag and install scheduling.
 * Run: node --test server/profeco.test.js
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isProfecoAutoMatchEnabled, install } = require('./profeco');

test('PROFECO_AUTO_MATCH_ENABLED is on only for the exact string true', () => {
  assert.equal(isProfecoAutoMatchEnabled(undefined), false);
  assert.equal(isProfecoAutoMatchEnabled(''), false);
  assert.equal(isProfecoAutoMatchEnabled('false'), false);
  assert.equal(isProfecoAutoMatchEnabled('TRUE'), false);
  assert.equal(isProfecoAutoMatchEnabled('True'), false);
  assert.equal(isProfecoAutoMatchEnabled('1'), false);
  assert.equal(isProfecoAutoMatchEnabled('yes'), false);
  assert.equal(isProfecoAutoMatchEnabled('true '), false);
  assert.equal(isProfecoAutoMatchEnabled('true'), true);
});

function recordingSql() {
  const calls = [];
  const sql = async (strings) => {
    calls.push(Array.isArray(strings) ? strings.join('?') : String(strings));
    return [];
  };
  sql.query = async (statement) => { calls.push(String(statement)); };
  sql.calls = calls;
  return sql;
}

function mockApp() {
  const posts = [];
  const gets = [];
  return {
    posts,
    gets,
    post(path) { posts.push(path); },
    get(path) { gets.push(path); },
  };
}

function withPatchedTimers(fn) {
  const timeouts = [];
  const intervals = [];
  const realSetTimeout = setTimeout;
  const realSetInterval = setInterval;
  global.setTimeout = (cb, ms) => {
    const handle = { type: 'timeout', delay: ms, cb, unref() { return handle; } };
    timeouts.push(handle);
    return handle;
  };
  global.setInterval = (cb, ms) => {
    const handle = { type: 'interval', delay: ms, cb, unref() { return handle; } };
    intervals.push(handle);
    return handle;
  };
  try {
    return fn({ timeouts, intervals });
  } finally {
    global.setTimeout = realSetTimeout;
    global.setInterval = realSetInterval;
  }
}

function withCapturedLogs(fn) {
  const lines = [];
  const origLog = console.log;
  const origError = console.error;
  const origWarn = console.warn;
  const restore = () => {
    console.log = origLog;
    console.error = origError;
    console.warn = origWarn;
  };
  console.log = (...args) => { lines.push(args.map(String).join(' ')); };
  console.error = (...args) => { lines.push(args.map(String).join(' ')); };
  console.warn = (...args) => { lines.push(args.map(String).join(' ')); };
  try {
    const result = fn(lines);
    if (result && typeof result.then === 'function') return result.finally(restore);
    restore();
    return result;
  } catch (err) {
    restore();
    throw err;
  }
}

async function withStubbedFetch(fn) {
  const real = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ success: true, result: { resources: [] } }),
  });
  try {
    return await fn();
  } finally {
    global.fetch = real;
  }
}

function withEnv(updates, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(updates)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  const restore = () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
  try {
    const result = fn();
    if (result && typeof result.then === 'function') return result.finally(restore);
    restore();
    return result;
  } catch (err) {
    restore();
    throw err;
  }
}

function isIngestCall(sql) {
  return sql.calls.some(c => c.includes('SELECT max(fecha)') || c.includes('DELETE FROM qqp_prices') || c.includes('FROM qqp_stores'));
}

function isMatchCall(sql) {
  return sql.calls.some(c =>
    c.includes('SELECT DISTINCT producto,presentacion FROM qqp_prices') ||
    c.includes('INSERT INTO med_qqp_map') ||
    c.includes('INSERT INTO qqp_match_review')
  );
}

test('install always schedules startup and weekly ingest, and logs auto-match off when the flag is unset', () => {
  withEnv({ PROFECO_AUTO_MATCH_ENABLED: undefined }, () => {
    const { timeouts, intervals, lines, app } = withCapturedLogs(logs => withPatchedTimers(({ timeouts, intervals }) => {
      const app = mockApp();
      install(app, recordingSql());
      return { timeouts, intervals, lines: logs, app };
    }));
    assert.equal(timeouts.some(t => t.delay === 120000), true);
    assert.equal(intervals.some(i => i.delay === 7 * 86400000), true);
    assert.equal(intervals.some(i => i.delay === 86400000), true);
    assert.equal(lines.includes('PROFECO auto-match: off'), true);
    assert.equal(app.posts.includes('/api/admin/ingest/profeco'), true);
    assert.equal(app.gets.includes('/api/pharmacies/nearby'), true);
    assert.equal(app.gets.includes('/api/prices'), true);
  });
});

test('install logs auto-match on when the flag is true and still schedules ingest timers', () => {
  withEnv({ PROFECO_AUTO_MATCH_ENABLED: 'true' }, () => {
    const { timeouts, intervals, lines } = withCapturedLogs(logs => withPatchedTimers(({ timeouts, intervals }) => {
      install(mockApp(), recordingSql());
      return { timeouts, intervals, lines: logs };
    }));
    assert.equal(timeouts.some(t => t.delay === 120000), true);
    assert.equal(intervals.some(i => i.delay === 7 * 86400000), true);
    assert.equal(lines.includes('PROFECO auto-match: on'), true);
  });
});

test('install leaves auto-match off for non-exact true values such as TRUE, but still schedules ingest', () => {
  withEnv({ PROFECO_AUTO_MATCH_ENABLED: 'TRUE' }, () => {
    const { timeouts, intervals, lines } = withCapturedLogs(logs => withPatchedTimers(({ timeouts, intervals }) => {
      install(mockApp(), recordingSql());
      return { timeouts, intervals, lines: logs };
    }));
    assert.equal(timeouts.some(t => t.delay === 120000), true);
    assert.equal(intervals.some(i => i.delay === 7 * 86400000), true);
    assert.equal(lines.includes('PROFECO auto-match: off'), true);
  });
});

test('scheduled startup run ingests but skips matchCatalog when the flag is off', async () => {
  await withEnv({
    PROFECO_AUTO_MATCH_ENABLED: undefined,
    INEGI_DENUE_TOKEN: undefined,
    INEGI_TOKEN: undefined,
  }, async () => {
    const { timeoutCb, sql } = withCapturedLogs(() => withPatchedTimers(({ timeouts }) => {
      const sql = recordingSql();
      install(mockApp(), sql);
      return { timeoutCb: timeouts.find(t => t.delay === 120000).cb, sql };
    }));
    await withCapturedLogs(() => withStubbedFetch(() => timeoutCb()));
    assert.equal(isIngestCall(sql), true);
    assert.equal(isMatchCall(sql), false);
  });
});

test('scheduled startup run runs matchCatalog when the flag is true', async () => {
  await withEnv({
    PROFECO_AUTO_MATCH_ENABLED: 'true',
    INEGI_DENUE_TOKEN: undefined,
    INEGI_TOKEN: undefined,
  }, async () => {
    const { timeoutCb, sql } = withCapturedLogs(() => withPatchedTimers(({ timeouts }) => {
      const sql = recordingSql();
      install(mockApp(), sql);
      return { timeoutCb: timeouts.find(t => t.delay === 120000).cb, sql };
    }));
    await withCapturedLogs(() => withStubbedFetch(() => timeoutCb()));
    assert.equal(isIngestCall(sql), true);
    assert.equal(isMatchCall(sql), true);
  });
});

test('manual run() still matches even when auto-match is off', async () => {
  await withEnv({
    PROFECO_AUTO_MATCH_ENABLED: undefined,
    INEGI_DENUE_TOKEN: undefined,
    INEGI_TOKEN: undefined,
  }, async () => {
    const { run, sql } = withCapturedLogs(() => withPatchedTimers(() => {
      const sql = recordingSql();
      const api = install(mockApp(), sql);
      return { run: api.run, sql };
    }));
    await withCapturedLogs(() => withStubbedFetch(() => run()));
    assert.equal(isIngestCall(sql), true);
    assert.equal(isMatchCall(sql), true);
  });
});
