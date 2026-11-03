// Isolated Android feature bundle. Does not use Expo CLI, app config or dotenv.
const path = require('node:path');
const fs = require('node:fs');
const Metro = require('metro');
const { getDefaultConfig } = require('metro-config');
const root = path.resolve(__dirname, '..');
(async () => {
  const config = await getDefaultConfig(root);
  config.projectRoot = root;
  config.watchFolders = [root];
  config.maxWorkers = 1;
  config.cacheStores = [];
  config.resolver.useWatchman = false;
  config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
  config.resolver.blockList = [
    /[\\/]backup_[^\\/]*(?:[\\/]|$)/i, /[\\/]indautor Req(?:[\\/]|$)/i,
    /[\\/]\.env[^\\/]*(?:[\\/]|$)/i, /[\\/]\.git(?:[\\/]|$)/i,
    /[\\/]auricrx-medcoach[\\/](?:dist[^\\/]*|backup|temp-export|q6-export|\.expo|\.health-connect-check)(?:[\\/]|$)/i,
  ];
  config.transformer.babelTransformerPath = path.join(__dirname, 'health-connect-sanity-transformer.cjs');
  config.reporter = { update(event) { if (event.type === 'bundling_error') console.error(event.error.message); } };
  const output = path.join(root, '.health-connect-check');
  fs.mkdirSync(output, { recursive: true });
  config.fileMapCacheDirectory = output;
  await Metro.runBuild(config, {
    entry: 'src/screens/ActivityHealthScreen.js', platform: 'android', dev: false,
    minify: false, out: path.join(output, 'activity-health.android.bundle'),
  });
  console.log('Android Health Connect feature bundle passed (isolated config, no environment files).');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
