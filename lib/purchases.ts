// RevenueCat removed. Stub exports keep imports in other files from breaking
// while purchases are disabled.

export async function getActiveSubscription() {
  return null;
}

export async function purchasePackage(_pkg: unknown) {
  throw new Error('Purchases not available.');
}

export async function restorePurchases() {
  throw new Error('Purchases not available.');
}
