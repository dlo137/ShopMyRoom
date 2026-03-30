// Stub used in Expo Go where the native module is unavailable.
// The real SDK is loaded only in native dev/production builds.
const noop = () => {};
const noopAsync = () => Promise.resolve({});

const Purchases = {
  setLogLevel: noop,
  configure: noop,
  logIn: noopAsync,
  logOut: noopAsync,
  getOfferings: () => Promise.resolve({ current: null }),
  getCustomerInfo: () => Promise.resolve({ entitlements: { active: {} } }),
  purchasePackage: () => Promise.resolve({ customerInfo: { entitlements: { active: {} } } }),
  restorePurchases: () => Promise.resolve({ entitlements: { active: {} } }),
};

const LOG_LEVEL = { VERBOSE: 'VERBOSE', DEBUG: 'DEBUG', INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' };

const PACKAGE_TYPE = {
  UNKNOWN: 'UNKNOWN',
  CUSTOM: 'CUSTOM',
  LIFETIME: 'LIFETIME',
  ANNUAL: 'ANNUAL',
  SIX_MONTH: 'SIX_MONTH',
  THREE_MONTH: 'THREE_MONTH',
  TWO_MONTH: 'TWO_MONTH',
  MONTHLY: 'MONTHLY',
  WEEKLY: 'WEEKLY',
};

module.exports = { default: Purchases, LOG_LEVEL, PACKAGE_TYPE, ...Purchases };
