// Explicit Babel options: this check never loads the project's dotenv Babel plugin.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const root = path.resolve(__dirname, '..');
const privacy = require('../modules/health-connect/privacy.json');
const files = [
  'src/services/healthConnectService.js', 'src/screens/ActivityHealthScreen.js',
  'src/navigation/AppNavigator.js', 'src/screens/Dashboard.js', 'src/screens/Settings.js',
  'src/providers/AppController.js', 'plugins/withHealthConnect.js',
];
for (const file of files) {
  babel.transformSync(fs.readFileSync(path.join(root, file), 'utf8'), {
    filename: path.join(root, file), babelrc: false, configFile: false,
    presets: ['babel-preset-expo'], caller: { name: 'metro', platform: 'android', isDev: false },
  });
}
console.log(`Babel syntax/transform: ${files.length} changed files passed (no dotenv).`);

function harness({ os = 'android', missing = false } = {}) {
  const storage = new Map();
  let grants = ['HeartRate', 'RestingHeartRate', 'Steps', 'ExerciseSession'];
  let sdkStatus = 'available'; let reads = 0; let requests = 0;
  let revokeFails = false; let finishRead;
  const native = {
    getStatus: async () => sdkStatus,
    getPermissions: async () => JSON.stringify(grants),
    requestPermissions: async () => { requests++; return JSON.stringify(grants); },
    revokePermissions: async () => { if (revokeFails) throw Error('failure'); grants = []; },
    readSnapshot: async () => { reads++; return new Promise(resolve => { finishRead = () => resolve(JSON.stringify({ local: true })); }); },
  };
  const mocks = {
    '@react-native-async-storage/async-storage': {
      getItem: async key => storage.get(key) || null,
      setItem: async (key, value) => { storage.set(key, value); },
      removeItem: async key => { storage.delete(key); },
    },
    'react-native': { Platform: { OS: os }, NativeModules: missing ? {} : { AuricHealthConnect: native }, Linking: {} },
    '../../modules/health-connect/privacy.json': privacy,
  };
  const code = babel.transformSync(fs.readFileSync(path.join(root, files[0]), 'utf8'), {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require(name) {
    assert.ok(name in mocks, `Unexpected dependency / potential external data path: ${name}`);
    return mocks[name];
  } });
  return {
    service: module.exports, storage, get reads() { return reads; }, get requests() { return requests; },
    grant(value) { grants = value; }, status(value) { sdkStatus = value; }, failRevoke() { revokeFails = true; }, finish() { finishRead(); },
  };
}

(async () => {
  assert.equal(await harness({ missing: true }).service.connectionStatus('u1'), 'native-missing');
  assert.equal(await harness({ os: 'ios' }).service.connectionStatus('u1'), 'ios');
  const h = harness();
  for (const state of ['install', 'unavailable']) { h.status(state); assert.equal(await h.service.connectionStatus('u1'), state); }
  h.status('available');
  assert.equal(await h.service.connectionStatus('u1'), 'disconnected');
  await assert.rejects(h.service.readHealth('u1'));
  assert.equal(h.reads, 0); assert.equal(h.requests, 0);
  h.grant(['Steps']);
  assert.equal(await h.service.connectHealth('u1'), 'denied');
  assert.equal(await h.service.connectionStatus('u1'), 'denied');
  await assert.rejects(h.service.readHealth('u1'));
  const record = JSON.parse([...h.storage.values()][0]);
  assert.equal(record.userId, 'u1'); assert.equal(record.version, 'hc-consent-v1');
  assert.deepEqual(record.grantedTypes, ['Steps']); assert.ok(!Number.isNaN(Date.parse(record.timestamp)));
  h.grant(['HeartRate', 'RestingHeartRate', 'Steps', 'ExerciseSession']);
  assert.equal(await h.service.connectHealth('u1'), 'connected');
  assert.equal(await h.service.connectionStatus('u2'), 'disconnected');
  const pending = h.service.readHealth('u1');
  while (!h.reads) await new Promise(resolve => setImmediate(resolve));
  const rejected = assert.rejects(pending);
  assert.equal(await h.service.disconnectHealth('u1'), true);
  h.finish(); await rejected;
  assert.equal(h.storage.size, 0);
  assert.equal(await h.service.connectionStatus('u1'), 'disconnected');
  h.grant(['HeartRate', 'RestingHeartRate', 'Steps', 'ExerciseSession']);
  await h.service.connectHealth('u1'); h.failRevoke();
  assert.equal(await h.service.disconnectHealth('u1'), false);
  assert.equal(h.storage.size, 0);
  await assert.rejects(h.service.readHealth('u1'));
  console.log('Local consent, missing native module, denied/partial permissions, user isolation, revocation failure and in-flight disconnect checks passed.');

  const { XML } = require('@expo/config-plugins');
  const manifest = (await XML.readXMLAsync({ path: path.join(root, 'android/app/src/main/AndroidManifest.xml') })).manifest;
  const health = manifest['uses-permission'].map(p => p.$['android:name']).filter(name => name.startsWith('android.permission.health.')).sort();
  assert.deepEqual(health, ['EXERCISE', 'HEART_RATE', 'RESTING_HEART_RATE', 'STEPS'].map(type => `android.permission.health.READ_${type}`).sort());
  assert.ok(manifest.queries.some(q => q.package?.some(p => p.$['android:name'] === 'com.google.android.apps.healthdata')));
  const app = manifest.application[0];
  assert.ok(app.activity.some(a => a.$['android:name'] === '.HealthConnectPrivacyActivity'));
  const alias = app['activity-alias'].find(a => a.$['android:name'] === '.HealthConnectPermissionUsageActivity');
  assert.equal(alias.$['android:targetActivity'], '.HealthConnectPrivacyActivity');
  assert.equal(alias.$['android:permission'], 'android.permission.START_VIEW_PERMISSION_USAGE');
  for (const file of ['HealthConnectModule.kt', 'HealthConnectPackage.kt', 'HealthConnectPermissions.kt', 'HealthConnectPrivacyActivity.kt']) {
    assert.equal(fs.readFileSync(path.join(root, 'modules/health-connect/android', file), 'utf8'), fs.readFileSync(path.join(root, 'android/app/src/main/java/com/auricrx/medcoach', file), 'utf8'));
  }
  console.log('Android permissions, provider query, privacy activity and native source consistency passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
