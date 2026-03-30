const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// In Expo Go the react-native-purchases native module doesn't exist.
// Point Metro to a no-op stub so the app bundles without errors.
// On real device builds the actual SDK is used.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-purchases': path.resolve(__dirname, 'mocks/react-native-purchases.js'),
  'react-native-purchases-ui': path.resolve(__dirname, 'mocks/react-native-purchases.js'),
};

module.exports = config;
