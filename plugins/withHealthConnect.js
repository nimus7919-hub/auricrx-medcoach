const { withAndroidManifest, withAppBuildGradle, withMainActivity, withMainApplication, withDangerousMod, withStringsXml, withGradleProperties } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const privacy = require('../modules/health-connect/privacy.json');
const types = ['HEART_RATE', 'RESTING_HEART_RATE', 'STEPS', 'EXERCISE'];
const dependency = 'implementation("androidx.health.connect:connect-client:1.1.0-alpha11")';
const filter = (action, category) => ({ action: [{ $: { 'android:name': action } }], ...(category ? { category: [{ $: { 'android:name': category } }] } : {}) });

// Local native library equivalent: official AndroidX SDK, RN bridge, Expo config plugin.
module.exports = function withHealthConnect(config) {
  config = withGradleProperties(config, cfg => {
    const entry = cfg.modResults.find(p => p.type === 'property' && p.key === 'android.minSdkVersion');
    if (entry) entry.value = String(Math.max(26, Number(entry.value) || 26));
    else cfg.modResults.push({ type: 'property', key: 'android.minSdkVersion', value: '26' });
    return cfg;
  });
  config = withAndroidManifest(config, cfg => {
    const manifest = cfg.modResults.manifest;
    manifest['uses-permission'] ||= [];
    for (const type of types) {
      const name = `android.permission.health.READ_${type}`;
      if (!manifest['uses-permission'].some(p => p.$['android:name'] === name)) manifest['uses-permission'].push({ $: { 'android:name': name } });
    }
    manifest.queries ||= [{}];
    manifest.queries[0].package ||= [];
    if (!manifest.queries[0].package.some(p => p.$['android:name'] === 'com.google.android.apps.healthdata')) manifest.queries[0].package.push({ $: { 'android:name': 'com.google.android.apps.healthdata' } });
    const app = manifest.application[0];
    // Keep the locally stored consent out of Android cloud/device backups.
    app.$['android:allowBackup'] = 'false';
    app.activity ||= [];
    if (!app.activity.some(a => a.$['android:name'] === '.HealthConnectPrivacyActivity')) app.activity.push({
      $: { 'android:name': '.HealthConnectPrivacyActivity', 'android:exported': 'true' },
      'intent-filter': [filter('androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE')],
    });
    app['activity-alias'] ||= [];
    if (!app['activity-alias'].some(a => a.$['android:name'] === '.HealthConnectPermissionUsageActivity')) app['activity-alias'].push({
      $: { 'android:name': '.HealthConnectPermissionUsageActivity', 'android:exported': 'true', 'android:targetActivity': '.HealthConnectPrivacyActivity', 'android:permission': 'android.permission.START_VIEW_PERMISSION_USAGE' },
      'intent-filter': [filter('android.intent.action.VIEW_PERMISSION_USAGE', 'android.intent.category.HEALTH_PERMISSIONS')],
    });
    return cfg;
  });
  config = withAppBuildGradle(config, cfg => {
    if (!cfg.modResults.contents.includes(dependency)) cfg.modResults.contents += `\n// AuricRX local Health Connect library (compileSdk 35 / Expo 53).\ndependencies { ${dependency} }\n`;
    return cfg;
  });
  config = withMainActivity(config, cfg => {
    if (!cfg.modResults.contents.includes('HealthConnectPermissions.register(this)')) cfg.modResults.contents = cfg.modResults.contents.replace(/super\.onCreate\([^\n]*\)/, '$&\n    HealthConnectPermissions.register(this)');
    return cfg;
  });
  config = withMainApplication(config, cfg => {
    if (!cfg.modResults.contents.includes('packages.add(HealthConnectPackage())')) cfg.modResults.contents = cfg.modResults.contents.replace('val packages = PackageList(this).packages', 'val packages = PackageList(this).packages\n            packages.add(HealthConnectPackage())');
    return cfg;
  });
  config = withStringsXml(config, cfg => {
    const value = { $: { name: 'hc_privacy_notice', formatted: 'false' }, _: `Datos de actividad y salud de Health Connect\n\n${privacy.body}\n\n${privacy.disclaimer}` };
    cfg.modResults.resources.string = (cfg.modResults.resources.string || []).filter(s => s.$.name !== 'hc_privacy_notice').concat(value);
    return cfg;
  });
  return withDangerousMod(config, ['android', async cfg => {
    const target = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/java', cfg.android.package.replace(/\./g, '/'));
    fs.mkdirSync(target, { recursive: true });
    for (const file of ['HealthConnectPackage.kt', 'HealthConnectModule.kt', 'HealthConnectPermissions.kt', 'HealthConnectPrivacyActivity.kt']) {
      const contents = fs.readFileSync(path.join(__dirname, '../modules/health-connect/android', file), 'utf8').replace('package com.auricrx.medcoach', `package ${cfg.android.package}`);
      fs.writeFileSync(path.join(target, file), contents);
    }
    return cfg;
  }]);
};
