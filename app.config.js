// Dynamic Expo config. Expo merges app.json into `config` before calling this.
module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE || 'development';
  const googleAuth = { ...(config.extra?.googleAuth || {}) };
  // Set these in each EAS build profile/console for its signing certificate.
  // Existing IDs stay in place until the configured profile supplies its verified IDs.
  for (const [key, suffix] of Object.entries({ androidClientId: 'ANDROID', iosClientId: 'IOS', webClientId: 'WEB' })) {
    const value = process.env[`GOOGLE_${suffix}_CLIENT_ID_${profile.toUpperCase()}`];
    if (value) googleAuth[key] = value;
  }
  const plugins = (config.plugins || []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === '@react-native-google-signin/google-signin') {
      return [plugin[0], { ...plugin[1], iosUrlScheme: googleAuth.iosClientId.split('.').reverse().join('.') }];
    }
    return plugin;
  });
  return { ...config, plugins, extra: { ...config.extra, googleAuth } };
};
