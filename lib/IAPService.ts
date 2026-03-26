// IAPService.ts — stub for react-native-iap integration
// Replace internals when wiring up real purchases.

import { Platform } from 'react-native';

type DebugCallback = (logs: string[], listenerStatus: string) => void;

let _debugCallback: DebugCallback | null = null;
let _purchaseLogs: string[] = [];
let _listenerStatus = 'Not triggered yet';

function log(msg: string) {
  _purchaseLogs = [..._purchaseLogs, `[${new Date().toISOString()}] ${msg}`];
  _debugCallback?.(_purchaseLogs, _listenerStatus);
}

function setListenerStatus(status: string) {
  _listenerStatus = status;
  _debugCallback?.(_purchaseLogs, _listenerStatus);
}

export const IAPService = {
  clearPurchaseLogs() {
    _purchaseLogs = [];
    _listenerStatus = 'Not triggered yet';
  },

  setDebugCallback(cb: DebugCallback | null) {
    _debugCallback = cb;
  },

  async isAvailable(): Promise<boolean> {
    // Always true in production builds; false in simulators without StoreKit config.
    return Platform.OS === 'ios' || Platform.OS === 'android';
  },

  async getProducts(productIds: string[]): Promise<any[]> {
    log(`Fetching products: ${productIds.join(', ')}`);
    setListenerStatus('Fetching products…');
    // Stub: return empty array until react-native-iap is wired up.
    setListenerStatus('Product fetch complete (stub)');
    return [];
  },

  async purchaseSubscription(
    productId: string,
    offerToken?: string
  ): Promise<void> {
    log(`Purchase attempt: ${productId}${offerToken ? ` (offerToken: ${offerToken})` : ''}`);
    setListenerStatus(`Purchasing ${productId}…`);
    throw new Error('IAP not yet wired up');
  },

  async restorePurchases(): Promise<any[]> {
    log('Restore purchases triggered');
    setListenerStatus('Restoring…');
    throw new Error('IAP not yet wired up');
  },
};
