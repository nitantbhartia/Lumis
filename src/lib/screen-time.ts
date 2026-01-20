import * as ScreenTime from 'lumis-screen-time';
import { Platform } from 'react-native';

export const requestScreenTimeAuthorization = async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') return false;
    try {
        const result = await ScreenTime.requestAuthorization();
        console.log('[ScreenTime] Authorization result:', result);
        return result;
    } catch (error: any) {
        console.error('[ScreenTime] Authorization error:', error);
        alert(`Screen Time Error: ${error?.message || JSON.stringify(error)}`);
        return false;
    }
};

export const blockApps = (): boolean => {
    if (Platform.OS !== 'ios') return false;
    try {
        const result = ScreenTime.blockAllApps();
        console.log('[ScreenTime] Block apps result:', result);
        return result;
    } catch (error) {
        console.error('[ScreenTime] Error blocking apps:', error);
        return false;
    }
};

export const unblockApps = (): boolean => {
    if (Platform.OS !== 'ios') return false;
    try {
        const result = ScreenTime.unblockAllApps();
        console.log('[ScreenTime] Unblock apps result:', result);
        return result;
    } catch (error) {
        console.error('[ScreenTime] Error unblocking apps:', error);
        return false;
    }
};

export const areAppsCurrentlyBlocked = (): boolean => {
    if (Platform.OS !== 'ios') return false;
    try {
        return ScreenTime.areAppsBlocked();
    } catch (error) {
        console.error('[ScreenTime] Error checking blocked status:', error);
        return false;
    }
};

// Legacy placeholder functions for backwards compatibility
export const setAppRestrictions = async (appIds: string[]): Promise<boolean> => {
    console.log('[ScreenTime] setAppRestrictions called - using blockAllApps instead');
    return blockApps();
};

export const clearAppRestrictions = async (): Promise<boolean> => {
    console.log('[ScreenTime] clearAppRestrictions called - using unblockApps instead');
    return unblockApps();
};
