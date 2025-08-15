// app.config.js
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    "expo-font",
    "./app.plugin.js",
    [
      "expo-build-properties",
      {
        android: {
          kotlinVersion: "1.9.24",
          compileSdkVersion: 34,
          targetSdkVersion: 34
        }
      }
    ]
  ],
  extra: {
    ...(config.extra || {}),
    googleVisionKey: process.env.EXPO_PUBLIC_GOOGLE_VISION_KEY,
    eas: { projectId: "db976ea9-7756-4bdb-ba4e-7563b0d3597b" }
  }
});
