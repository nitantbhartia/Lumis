import Purchases, { PurchasesPackage, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

// TODO: Replace with your actual RevenueCat API Keys
const API_KEYS = {
    ios: 'appl_qphLWsbVTRWkKqoEnzPVFlmSAFl',
    android: 'goog_REPLACE_WITH_YOUR_KEY',
};

export const REVENUECAT_ENTITLEMENTS = {
    PREMIUM: 'premium_access',
};

export const REVENUECAT_OFFERINGS = {
    SKIP_PASS: 'skip_pass',
    // Legacy alias for backwards compatibility
    EMERGENCY_FLARE: 'skip_pass',
};

export const initRevenueCat = async () => {
    try {
        if (Platform.OS === 'ios') {
            await Purchases.configure({ apiKey: API_KEYS.ios });
        } else if (Platform.OS === 'android') {
            await Purchases.configure({ apiKey: API_KEYS.android });
        }

        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        console.log('[RevenueCat] Initialized successfully');
    } catch (e) {
        console.warn('RevenueCat init failed (likely running in Expo Go or invalid key):', e);
    }
};

export const purchasePackage = async (packageToPurchase: PurchasesPackage) => {
    try {
        const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
        return { success: true, customerInfo };
    } catch (e: any) {
        if (!e.userCancelled) {
            console.error('Purchase error:', e);
        }
        return { success: false, error: e, userCancelled: e.userCancelled };
    }
};

export const getOfferings = async () => {
    try {
        const offerings = await Purchases.getOfferings();
        console.log('[RevenueCat] Offerings:', offerings);
        return offerings.current;
    } catch (e) {
        console.error('Error getting offerings:', e);
        return null;
    }
};

export const checkEntitlement = async (entitlementId: string) => {
    try {
        const customerInfo = await Purchases.getCustomerInfo();
        return customerInfo.entitlements.active[entitlementId] !== undefined;
    } catch (e) {
        console.error('Error checking entitlement:', e);
        return false;
    }
};
