const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /node_modules\/@react-native\/debugger-frontend\/.*/,
];

// Force Metro to prefer CJS builds over ESM.
// Zustand v4's ESM bundle contains `import.meta.env` which is a SyntaxError
// in Metro's classic-script bundle (not type="module"), causing a white screen.
config.resolver.resolverMainFields = [
  'react-native',
  'browser',
  'require',
  'main',
];

module.exports = withNativeWind(config, { input: './global.css' });