// iOS-only: @react-native-firebase (CocoaPods mode, v23) needs static frameworks.
// Mark RNFB pods as static frameworks and allow non-modular includes so the
// React headers they import compile under use_frameworks! :linkage => :static.
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FLAG = '$RNFirebaseAsStaticFramework = true';
const POST = "    installer.pods_project.targets.each do |t|\n      t.build_configurations.each { |c| c.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES' }\n    end";

module.exports = function withIosFirebaseStatic(config) {
  return withDangerousMod(config, ['ios', async (cfg) => {
    const file = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
    let src = fs.readFileSync(file, 'utf8');
    if (!src.includes(FLAG)) src = `${FLAG}\n${src}`;
    if (!src.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
      src = src.replace(/post_install do \|installer\|\n/, (m) => `${m}${POST}\n`);
    }
    fs.writeFileSync(file, src);
    return cfg;
  }]);
};
