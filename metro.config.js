const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// extraNodeModules acts as a fallback resolver — it only kicks in when Metro
// cannot find the module through normal node_modules resolution.
// In Expo Go, react-native-purchases' native side is unavailable and Metro
// may fail to resolve it, so we point it at a safe no-op stub.
// In EAS / standalone builds the real package in node_modules is used directly.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-purchases': path.resolve(__dirname, 'mocks/react-native-purchases.js'),
  'react-native-purchases-ui': path.resolve(__dirname, 'mocks/react-native-purchases.js'),
};

module.exports = config;
