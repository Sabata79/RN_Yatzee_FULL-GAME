// metro.config.js (juureen)
const path = require('path');
module.exports = {
  resolver: {
    extraNodeModules: {
      'firebase/app': path.resolve(__dirname, 'firebase-empty.js'),
      'firebase/database': path.resolve(__dirname, 'firebase-empty.js'),
      '@firebase/app': path.resolve(__dirname, 'firebase-empty.js'),
      '@firebase/database': path.resolve(__dirname, 'firebase-empty.js'),
      '@firebase/remote-config': path.resolve(__dirname, 'firebase-empty.js'),
    },
  },
};