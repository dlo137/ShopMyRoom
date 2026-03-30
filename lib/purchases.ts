import Purchases, { PurchasesPackage } from 'react-native-purchases';

export async function getActiveSubscription() {
  const customerInfo = await Purchases.getCustomerInfo();
  return customerInfo;
}

export async function purchasePackage(pkg: PurchasesPackage) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (error) {
    throw error;
  }
}

export async function restorePurchases() {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo;
}
