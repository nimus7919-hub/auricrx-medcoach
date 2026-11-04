const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('../node_modules/typescript');
function regionModule({ country = 'US', locale = 'en-US', missingNative = false, stored = {} } = {}) {
  const data = new Map(Object.entries(stored));
  const storage = { getItem: async key => data.get(key) || null, setItem: async (key, value) => data.set(key, value), multiSet: async rows => rows.forEach(([key, value]) => data.set(key, value)) };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/region.js', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText, {
    exports, Intl, require: name => {
      if (name === '@react-native-async-storage/async-storage') return { default: storage };
      if (name === 'react-native') return { NativeModules: { I18nManager: { localeIdentifier: locale } } };
      if (name === 'expo-localization') { if (missingNative) throw new Error('native module unavailable'); return { getLocales: () => [{ regionCode: country }] }; }
      throw new Error('Unexpected import');
    },
  });
  return { api: exports, data };
}
test('US/MX region defaults honor device country, saved choice and old-build fallback', async () => {
  assert.equal(await regionModule().api.initializeRegion(), 'US');
  assert.equal(await regionModule({ country: 'MX', locale: 'en-US' }).api.initializeRegion(), 'MX');
  assert.equal(await regionModule({ stored: { AURIC_REGION: 'MX' } }).api.initializeRegion(), 'MX');
  assert.equal(await regionModule({ missingNative: true, locale: 'es-MX' }).api.initializeRegion(), 'MX');
});
test('explicit region changes persist country/language and notify subscribers', async () => {
  const { api, data } = regionModule();
  let observed;
  api.subscribeRegion(value => { observed = value; });
  await api.setRegion('US');
  assert.equal(data.get('AURIC_LANG'), 'en');
  assert.equal(observed, 'US');
  await api.setRegion('MX');
  assert.equal(data.get('AURIC_LANG'), 'es');
  assert.equal(api.getRegion(), 'MX');
});
test('US startup consent is false by default, rejects partial receipt and tolerates corrupt storage', async () => {
  const { api } = regionModule({ stored: { AURIC_US_STARTUP_CONSENT: '{bad' } });
  await api.initializeRegion();
  assert.equal(api.hasUSStartupConsent(), false);
  await api.saveUSStartupConsent({ terms: true, collect: true, share: false, adult: true });
  assert.equal(api.hasUSStartupConsent(), false);
  await api.saveUSStartupConsent({ terms: true, collect: true, share: true, adult: true });
  assert.equal(api.hasUSStartupConsent(), true);
  assert.equal(api.getStartupConsent().version, 'US-2026-11-03');
});
