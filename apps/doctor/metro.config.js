const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = false;
config.resolver.extraNodeModules = {
  '@auricrx/doctor-core': path.resolve(monorepoRoot, 'packages/doctor-core'),
};

// Expo SDK 53 resolves package.json "exports" by default. firebase/auth has no
// react-native export condition, so Metro picks the browser/node entry. That
// omits getReactNativePersistence and makes initializeAuth() crash Hermes at
// launch ("INTERNAL ASSERTION FAILED: Expected a class definition").
// https://github.com/expo/expo/issues/36588
config.resolver.unstable_enablePackageExports = false;
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

module.exports = config;
