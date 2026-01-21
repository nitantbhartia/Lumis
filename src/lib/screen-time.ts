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

export const blockApps = (): boolean => {
    if (!isAvailable) return false;
    try {
        // Safe check for method existence
        if (typeof ScreenTime?.blockAllApps !== 'function') {
            console.warn('[ScreenTime] blockAllApps not available');
            return false;
        }
        const result = ScreenTime.blockAllApps();
        console.log('[ScreenTime] Block apps result:', result);
        return result;
    } catch (error) {
        console.error('[ScreenTime] Error blocking apps:', error);
        return false;
    }
};

export const unblockApps = (): boolean => {
    if (!isAvailable) return false;
    try {
        if (typeof ScreenTime?.unblockAllApps !== 'function') {
            console.warn('[ScreenTime] unblockAllApps not available');
            return false;
        }
        const result = ScreenTime.unblockAllApps();
        console.log('[ScreenTime] Unblock apps result:', result);
        return result;
    } catch (error) {
        console.error('[ScreenTime] Error unblocking apps:', error);
        return false;
    }
};

export const areAppsCurrentlyBlocked = (): boolean => {
    if (!isAvailable) return false;
    try {
        if (typeof ScreenTime?.areAppsBlocked !== 'function') {
            return false;
        }
        return ScreenTime.areAppsBlocked();
    } catch (error) {
        console.error('[ScreenTime] Error checking blocked status:', error);
        return false;
    }
};

// Legacy placeholder functions for backwards compatibility
export const setAppRestrictions = async (appIds: string[]): Promise<boolean> => {
    return blockApps();
};

export const clearAppRestrictions = async (): Promise<boolean> => {
    return unblockApps();
};
