const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Lisää CommonJS ja varmistetaan transpilaus
config.resolver.sourceExts.push('cjs');

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
};

config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/react-native\/.*/, // estetään tuplat RN
];

config.resolver.extraNodeModules = {
  ...(config.resolver?.extraNodeModules ?? {}),
  'firebase': path.resolve(__dirname, 'firebase-empty.js'),
  'firebase/app': path.resolve(__dirname, 'firebase-empty.js'),
  'firebase/database': path.resolve(__dirname, 'firebase-empty.js'),
  '@firebase/app': path.resolve(__dirname, 'firebase-empty.js'),
  '@firebase/database': path.resolve(__dirname, 'firebase-empty.js'),
  '@firebase/remote-config': path.resolve(__dirname, 'firebase-empty.js'),
};

// Directory import fix
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === '@react-native-firebase/app/lib/common' ||
    moduleName === '@react-native-firebase/app/lib/common/'
  ) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(
        __dirname,
        'node_modules/@react-native-firebase/app/lib/common/index.js'
      ),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
