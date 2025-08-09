// metro.config.js
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config'); // käytät Expoa

const config = getDefaultConfig(__dirname);

// Estetään web Firebase -SDK:n mukaan tulo
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  // yleisimmät web-SDK entryt:
  'firebase': path.resolve(__dirname, 'firebase-empty.js'),
  '@firebase/app': path.resolve(__dirname, 'firebase-empty.js'),
  '@firebase/auth': path.resolve(__dirname, 'firebase-empty.js'),
  '@firebase/database': path.resolve(__dirname, 'firebase-empty.js'),
  '@firebase/*': path.resolve(__dirname, 'firebase-empty.js'),
};

module.exports = config;
