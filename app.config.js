// app.config.js (ESM version)
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: 'auricrx-medcoach',
  slug: 'auricrx-medcoach',

  plugins: [
    'expo-font',
    './app.plugin.js',
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 34,
        },
      },
    ],
  ],

  extra: {
    ...(config.extra || {}),
    // your existing public key (ok to keep if you use it elsewhere)
    googleVisionKey: process.env.EXPO_PUBLIC_GOOGLE_VISION_KEY,

    // 🔐 used by API.Medical-AI.ts via Constants.expoConfig.extra.OPENAI_API_KEY
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,

    eas: { projectId: 'db976ea9-7756-4bdb-ba4e-7563b0d3597b' },
  },
});
