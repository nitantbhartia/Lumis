import * as ScreenTime from 'lumisscreentime';
import { Platform } from 'react-native';

const isAvailable = Platform.OS === 'ios';

export const getScreenTimePermissionStatus = async (): Promise<boolean> => {
    if (!isAvailable) return false;
    try {
        const status = await ScreenTime.getAuthorizationStatus();
        console.log('[ScreenTime] getScreenTimePermissionStatus result:', status);
        return status;
    } catch (error) {
        console.error('[ScreenTime] Error checking status:', error);
        return false;
    }
};

export const requestScreenTimeAuthorization = async (): Promise<boolean> => {
    if (!isAvailable) return false;
    try {
        console.log('[ScreenTime] Testing native link:', ScreenTime.hello());
        const result = await ScreenTime.requestAuthorization();
        console.log('[ScreenTime] Authorization result:', result);
        return result;
    } catch (error: any) {
        console.error('[ScreenTime] Authorization error:', error);
        return false;
    }
};

/**
 * Present the iOS FamilyActivityPicker for users to select apps to shield.
 * This shows the native Apple picker UI.
 */
export const showAppPicker = async (): Promise<boolean> => {
    if (!isAvailable) return false;
    try {
        const result = await ScreenTime.showAppPicker();
        console.log('[ScreenTime] showAppPicker result:', result);
        return result;
    } catch (error) {
        console.error('[ScreenTime] Error showing app picker:', error);
        return false;
    }
};

/**
 * Activate shields on selected apps.
 * Call this when morning shield should be enforced.
 */
export const activateShield = (): boolean => {
    if (!isAvailable) return false;
    try {
        const result = ScreenTime.activateShield();
        console.log('[ScreenTime] activateShield result:', result);
        return result;
    } catch (error) {
        console.error('[ScreenTime] Error activating shield:', error);
        return false;
    }
};

/**
 * Deactivate all shields.
 * Call this when user completes their sunlight session.
 */
export const deactivateShield = (): boolean => {
    if (!isAvailable) return false;
    try {
        const result = ScreenTime.deactivateShield();
        console.log('[ScreenTime] deactivateShield result:', result);
        return result;
    } catch (error) {
        console.error('[ScreenTime] Error deactivating shield:', error);
        return false;
    }
};

/**
 * Get count of apps selected for shielding.
 */
export const getSelectedAppCount = (): number => {
    if (!isAvailable) return 0;
    try {
        return ScreenTime.getSelectedAppCount();
    } catch (error) {
        console.error('[ScreenTime] Error getting app count:', error);
        return 0;
    }
};

/**
 * Check if shield is currently active.
 */
export const isShieldActive = (): boolean => {
    if (!isAvailable) return false;
    try {
        return ScreenTime.isShieldActive();
    } catch (error) {
        console.error('[ScreenTime] Error checking shield status:', error);
        return false;
    }
};

// Legacy functions for backwards compatibility
export const blockApps = (): boolean => {
    return activateShield();
};

export const unblockApps = (): boolean => {
    return deactivateShield();
};

export const areAppsCurrentlyBlocked = (): boolean => {
    return isShieldActive();
};

export const setAppRestrictions = async (appIds: string[]): Promise<boolean> => {
    return activateShield();
};

export const clearAppRestrictions = async (): Promise<boolean> => {
    return deactivateShield();
};
