// app.plugin.js — patch AndroidManifest to avoid appComponentFactory conflict
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function configPlugin(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    // ensure tools namespace
    manifest.$ = manifest.$ || {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const app = manifest.application?.[0];
    if (app) {
      app.$ = app.$ || {};
      // ensure tools:replace includes appComponentFactory
      const existing = (app.$['tools:replace'] || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (!existing.includes('android:appComponentFactory')) {
        existing.push('android:appComponentFactory');
      }
      app.$['tools:replace'] = existing.join(',');
      // prefer the AndroidX value
      app.$['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';
    }
    return cfg;
  });
};
	