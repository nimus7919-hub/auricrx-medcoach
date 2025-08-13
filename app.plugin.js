// app.plugin.js — manifest patch + global exclude of old support libs + force AndroidX
const {
  withAndroidManifest,
  withAppBuildGradle,
  withProjectBuildGradle,
} = require('@expo/config-plugins');

module.exports = function (config) {
  // 1) Manifest: tools:replace + AndroidX appComponentFactory
  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$ = manifest.$ || {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const app = manifest.application?.[0];
    if (app) {
      app.$ = app.$ || {};
      const existing = (app.$['tools:replace'] || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!existing.includes('android:appComponentFactory')) {
        existing.push('android:appComponentFactory');
      }
      app.$['tools:replace'] = existing.join(',');
      app.$['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';
    }
    return cfg;
  });

  // 2) app/build.gradle: exclude support libs + force AndroidX versionedparcelable
  config = withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;

    if (!src.includes('configurations.all {') || !src.includes('exclude group: "com.android.support"')) {
      src += `

/** Injected by app.plugin.js to avoid duplicate classes (support vs AndroidX) **/
configurations.all {
    exclude group: "com.android.support", module: "versionedparcelable"
    exclude group: "com.android.support", module: "support-compat"
    exclude group: "com.android.support"
}
`;
    }

    if (src.includes('dependencies {') && !src.includes('androidx.versionedparcelable:versionedparcelable:1.1.1')) {
      src = src.replace(
        /dependencies\s*\{/,
        `dependencies {
    implementation("androidx.versionedparcelable:versionedparcelable:1.1.1")`
      );
    }

    cfg.modResults.contents = src;
    return cfg;
  });

  // 3) ROOT android/build.gradle: apply the same exclusions to *all* subprojects
  config = withProjectBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;

    // Add a subprojects block if not present
    if (!src.includes('subprojects {') || !src.includes('exclude group: "com.android.support"')) {
      src += `

/** Injected by app.plugin.js (root) to avoid duplicate classes across subprojects **/
subprojects { project ->
    configurations.all {
        exclude group: "com.android.support", module: "versionedparcelable"
        exclude group: "com.android.support", module: "support-compat"
        exclude group: "com.android.support"
    }
}
`;
    }

    cfg.modResults.contents = src;
    return cfg;
  });

  return config;
};
