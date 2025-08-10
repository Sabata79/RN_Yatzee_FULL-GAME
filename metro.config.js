// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Salli .cjs
config.resolver.sourceExts = [
  ...new Set([...(config.resolver.sourceExts ?? []), 'cjs']),
];

// Aliasoi mahdolliset web-Firebase importit tyhjään tiedostoon (jos niitä vilahtelee)
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  firebase: path.resolve(__dirname, 'firebase-empty.js'),
  'firebase/app': path.resolve(__dirname, 'firebase-empty.js'),
  'firebase/database': path.resolve(__dirname, 'firebase-empty.js'),
  '@firebase/app': path.resolve(__dirname, 'firebase-empty.js'),
  '@firebase/database': path.resolve(__dirname, 'firebase-empty.js'),
  '@firebase/remote-config': path.resolve(__dirname, 'firebase-empty.js'),
};

module.exports = config;
