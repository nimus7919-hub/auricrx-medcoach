// app.plugin.js
const { withAppBuildGradle, withAndroidManifest } = require('@expo/config-plugins');

function addExcludes(gradle) {
  const marker = '/** Injected by app.plugin.js to avoid duplicate classes (support vs AndroidX) **/';
  if (gradle.contents.includes(marker)) return gradle;

  gradle.contents += `
${marker}
configurations.all {
  exclude group: "com.android.support", module: "versionedparcelable"
  exclude group: "com.android.support", module: "support-compat"
  exclude group: "com.android.support"
  resolutionStrategy {
    force "androidx.versionedparcelable:versionedparcelable:1.1.1"
  }
}
`;
  return gradle;
}

module.exports = function withFixAndroidX(config) {
  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    if (!manifest?.manifest?.application?.[0]?.$) return cfg;

    // Ensure tools namespace exists
    if (!manifest.manifest.$['xmlns:tools']) {
      manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // Prefer AndroidX appComponentFactory
    const app = manifest.manifest.application[0].$;
    app['tools:replace'] = (app['tools:replace'] || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .concat('android:appComponentFactory')
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(',');

    app['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';

    return cfg;
  });

  config = withAppBuildGradle(config, (cfg) => {
    cfg.modResults = addExcludes(cfg.modResults);
    return cfg;
  });

  return config;
};
