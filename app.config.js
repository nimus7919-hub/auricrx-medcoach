const config = require('./app.json');
module.exports = () => {
  const profile = process.env.EAS_BUILD_PROFILE || 'development';
  const googleAuth = { ...config.expo.extra.googleAuth };
  // Set these in each EAS build profile/console for its signing certificate.
  // Existing IDs stay in place until the configured profile supplies its verified IDs.
  for (const [key, suffix] of Object.entries({ androidClientId: 'ANDROID', iosClientId: 'IOS', webClientId: 'WEB' })) {
    const value = process.env[`GOOGLE_${suffix}_CLIENT_ID_${profile.toUpperCase()}`];
    if (value) googleAuth[key] = value;
  }
  return { ...config.expo, extra: { ...config.expo.extra, googleAuth } };
};
