const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const { parsePrice } = require('../src/utils/parsePrice');

test('prices support decimals, grouping, currency labels and zero', () => {
  for (const [value, expected] of [[123.45,123.45],['123,45',123.45],['$1,234.50',1234.5],['1.234,50 MXN',1234.5],['1,234',1234],['0',0],['MXN 99.90',99.9]]) {
    assert.equal(parsePrice(value), expected, String(value));
  }
  for (const value of ['', 'N/A', 'call for price', '-15', Infinity, null, '1,2,3', '12.34.56', 'USD', '12abc34']) assert.equal(parsePrice(value), null);
});

function loadModule(path, imports, globals = {}) {
  const code = babel.transformSync(fs.readFileSync(path, 'utf8'), {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  }, AbortController, TextDecoder, console, ...globals });
  return exports;
}

function streamHarness(fetch) {
  const state = [];
  let cleanup;
  const react = {
    useState(initial) { const slot = state.length; state.push(initial); return [initial, value => { state[slot] = value; }]; },
    useRef: current => ({ current }),
    useEffect: effect => { cleanup = effect(); },
  };
  const { useMedicalStream } = loadModule('src/hooks/useMedicalStream.js', {
    react,
    '../i18n': { t: (key, options) => `${key} ${options?.value1 ?? ''}` },
    '../config/api': { API_BASE: 'https://example.test' },
  }, { fetch });
  return { hook: useMedicalStream('/ask', { stream: false }), state, unmount: () => cleanup() };
}

test('superseded AI responses cannot replace the newest response or clear its loading state', async () => {
  const pending = [];
  const { hook, state } = streamHarness(() => new Promise(resolve => pending.push(resolve)));
  const first = hook.ask(['first']);
  const second = hook.ask(['second']);
  pending[0]({ ok: true, text: async () => 'old' });
  await first;
  assert.equal(state[1], true);
  pending[1]({ ok: true, text: async () => 'new' });
  assert.equal(await second, 'new');
  assert.deepEqual(state, ['new', false]);
});

test('AI HTTP errors reject and restore loading state', async () => {
  const { hook, state } = streamHarness(async () => ({ ok: false, status: 503 }));
  await assert.rejects(hook.ask([]), /503/);
  assert.equal(state[1], false);
});

test('unmount aborts the AI request and prevents later state updates', async () => {
  let resolve;
  let signal;
  const harness = streamHarness((url, options) => { signal = options.signal; return new Promise(done => { resolve = done; }); });
  const request = harness.hook.ask([]);
  harness.unmount();
  assert.equal(signal.aborted, true);
  resolve({ ok: true, text: async () => 'late' });
  await request;
  assert.equal(harness.state[0], '');
});

test('cloud sync preserves result shapes, shares auth and clears its timeout', async () => {
  let cleared = 0;
  let request;
  const service = loadModule('src/services/cloudSyncService.js', {
    './region': { getRegion: () => 'MX' },
    '../i18n': { t: key => key },
    '@react-native-async-storage/async-storage': { getItem: async () => null },
    '../config/firebase': { auth: { currentUser: { getIdToken: async () => 'test-token' } } },
    '../config/api': { API_BASE: 'https://example.test' },
  }, {
    setTimeout: () => 1, clearTimeout: () => { cleared++; },
    fetch: async (url, options) => {
      request = { url, options };
      return { ok: true, headers: { get: () => 'application/json' }, json: async () => ({ ok: true, hasData: true, data: { payload: [1] } }) };
    },
  }).default;
  const result = await service.pullMedications();
  assert.equal(result.success, true);
  assert.equal(result.hasData, true);
  assert.equal(result.payload[0], 1);
  assert.equal(request.url, 'https://example.test/api/sync/pull/medications');
  assert.equal(request.options.headers.Authorization, 'Bearer test-token');
  assert.equal(cleared, 1);
});
