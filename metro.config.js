const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Lisää vain omat aliakset, mutta säilytä Expon defaultit
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...(config.resolver?.extraNodeModules ?? {}),
    'firebase': path.resolve(__dirname, 'firebase-empty.js'),
    'firebase/app': path.resolve(__dirname, 'firebase-empty.js'),
    'firebase/database': path.resolve(__dirname, 'firebase-empty.js'),
    '@firebase/app': path.resolve(__dirname, 'firebase-empty.js'),
    '@firebase/database': path.resolve(__dirname, 'firebase-empty.js'),
    '@firebase/remote-config': path.resolve(__dirname, 'firebase-empty.js'),
  },
};

module.exports = config;