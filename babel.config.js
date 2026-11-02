// babel.config.js (project root)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          // Load .env.development or .env.production based on NODE_ENV
          path: `.env.${process.env.NODE_ENV || 'development'}`,
          blocklist: ['OPENAI_API_KEY', 'EXPO_PUBLIC_OPENAI_API_KEY'],
          allowUndefined: true,
        },
      ],
      // (optional) keep these if you already use them:
      // 'react-native-reanimated/plugin',
    ],
  };
};
