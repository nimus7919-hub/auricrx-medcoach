// Used only by the isolated feature bundle check; never loads project Babel/dotenv config.
const babel = require('@babel/core');
module.exports.transform = ({ filename, src, options, plugins }) => {
  const result = babel.transformSync(src, {
    filename, ast: true, code: false, babelrc: false, configFile: false,
    presets: ['module:@react-native/babel-preset'], plugins,
    caller: { name: 'metro', platform: options.platform, supportsStaticESM: false },
  });
  return { ast: result.ast, metadata: result.metadata };
};
