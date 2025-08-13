// app.config.js
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra || {}),
    // Pull from .env at build/start time
    googleVisionKey: process.env.EXPO_PUBLIC_GOOGLE_VISION_KEY,
    // Keep your existing EAS project id
    eas: { projectId: "db976ea9-7756-4bdb-ba4e-7563b0d3597b" }
  }
});
