// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force all imports of 'tslib' to use the same version to prevent __extends errors
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...(config.resolver?.extraNodeModules || {}),
    // Force all tslib imports to use the root tslib package
    tslib: path.resolve(__dirname, 'node_modules/tslib'),
  },
  // Ensure consistent module resolution
  resolveRequest: (context, moduleName, platform) => {
    // Force tslib to always resolve to the root package
    if (moduleName === 'tslib') {
      return {
        filePath: path.resolve(__dirname, 'node_modules/tslib/tslib.js'),
        type: 'sourceFile',
      };
    }
    // Let Metro handle other modules normally
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
