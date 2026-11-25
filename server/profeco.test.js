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

function mockSql() {
  const sql = async () => [];
  sql.query = async () => {};
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
    const handle = { type: 'timeout', delay: ms, unref() { return handle; } };
    timeouts.push(handle);
    return handle;
  };
  global.setInterval = (cb, ms) => {
    const handle = { type: 'interval', delay: ms, unref() { return handle; } };
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
  const orig = console.log;
  console.log = (...args) => { lines.push(args.map(String).join(' ')); };
  try {
    return fn(lines);
  } finally {
    console.log = orig;
  }
}

test('install does not schedule startup or weekly auto-match when the flag is unset', () => {
  const previous = process.env.PROFECO_AUTO_MATCH_ENABLED;
  delete process.env.PROFECO_AUTO_MATCH_ENABLED;
  try {
    const { timeouts, intervals, lines, app } = withCapturedLogs(logs => withPatchedTimers(({ timeouts, intervals }) => {
      const app = mockApp();
      install(app, mockSql());
      return { timeouts, intervals, lines: logs, app };
    }));
    assert.equal(timeouts.some(t => t.delay === 120000), false);
    assert.equal(intervals.some(i => i.delay === 7 * 86400000), false);
    assert.equal(intervals.some(i => i.delay === 86400000), true);
    assert.equal(lines.includes('PROFECO auto-match: off'), true);
    assert.equal(app.posts.includes('/api/admin/ingest/profeco'), true);
    assert.equal(app.gets.includes('/api/pharmacies/nearby'), true);
    assert.equal(app.gets.includes('/api/prices'), true);
  } finally {
    if (previous === undefined) delete process.env.PROFECO_AUTO_MATCH_ENABLED;
    else process.env.PROFECO_AUTO_MATCH_ENABLED = previous;
  }
});

test('install schedules startup and weekly auto-match only when the flag is true', () => {
  const previous = process.env.PROFECO_AUTO_MATCH_ENABLED;
  process.env.PROFECO_AUTO_MATCH_ENABLED = 'true';
  try {
    const { timeouts, intervals, lines, app } = withCapturedLogs(logs => withPatchedTimers(({ timeouts, intervals }) => {
      const app = mockApp();
      install(app, mockSql());
      return { timeouts, intervals, lines: logs, app };
    }));
    assert.equal(timeouts.some(t => t.delay === 120000), true);
    assert.equal(intervals.some(i => i.delay === 7 * 86400000), true);
    assert.equal(intervals.some(i => i.delay === 86400000), true);
    assert.equal(lines.includes('PROFECO auto-match: on'), true);
    assert.equal(app.posts.includes('/api/admin/ingest/profeco'), true);
  } finally {
    if (previous === undefined) delete process.env.PROFECO_AUTO_MATCH_ENABLED;
    else process.env.PROFECO_AUTO_MATCH_ENABLED = previous;
  }
});

test('install leaves auto-match off for non-exact true values such as TRUE', () => {
  const previous = process.env.PROFECO_AUTO_MATCH_ENABLED;
  process.env.PROFECO_AUTO_MATCH_ENABLED = 'TRUE';
  try {
    const { timeouts, intervals, lines } = withCapturedLogs(logs => withPatchedTimers(({ timeouts, intervals }) => {
      install(mockApp(), mockSql());
      return { timeouts, intervals, lines: logs };
    }));
    assert.equal(timeouts.some(t => t.delay === 120000), false);
    assert.equal(intervals.some(i => i.delay === 7 * 86400000), false);
    assert.equal(lines.includes('PROFECO auto-match: off'), true);
  } finally {
    if (previous === undefined) delete process.env.PROFECO_AUTO_MATCH_ENABLED;
    else process.env.PROFECO_AUTO_MATCH_ENABLED = previous;
  }
});
