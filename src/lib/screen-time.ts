import {
    requestAuthorization as nativeRequestAuthorization,
    getAuthorizationStatus as nativeGetAuthorizationStatus,
    showAppPicker as nativeShowAppPicker,
    activateShield as nativeActivateShield,
    deactivateShield as nativeDeactivateShield,
    getSelectedAppCount as nativeGetSelectedAppCount,
    isShieldActive as nativeIsShieldActive,
    getAppToggles as nativeGetAppToggles,
    toggleApp as nativeToggleApp,
    clearMetadata as nativeClearMetadata,
    startLiveActivity as nativeStartLiveActivity,
    updateLiveActivity as nativeUpdateLiveActivity,
    endLiveActivity as nativeEndLiveActivity,
    isLiveActivityActive as nativeIsLiveActivityActive,
    areLiveActivitiesEnabled as nativeAreLiveActivitiesEnabled,
    updateShieldData as nativeUpdateShieldData,
    LumisIcon
} from 'lumisscreentime';
import { requireNativeModule } from 'expo-modules-core';
import { Platform, Alert, Linking } from 'react-native';
import { useLumisStore } from '@/lib/state/lumis-store';

const isAvailable = Platform.OS === 'ios';

const getModule = () => {
    try {
        return requireNativeModule('lumisscreentime');
    } catch (e) {
        return null;
    }
};

export const getScreenTimePermissionStatus = async (): Promise<boolean> => {
    if (!isAvailable) return false;
    try {
        console.log('[ScreenTime] Calling getAuthorizationStatus...');
        if (typeof nativeGetAuthorizationStatus !== 'function') {
            console.error('[ScreenTime] getAuthorizationStatus is NOT a function:', typeof nativeGetAuthorizationStatus);
            return false;
        }
        const status = await (nativeGetAuthorizationStatus() as any);
        console.log('[ScreenTime] getScreenTimePermissionStatus raw result:', status);
        return status === 'approved';
    } catch (error: any) {
        console.error('[ScreenTime] Error checking status:', error);
        return false;
    }
};

export const requestScreenTimeAuthorization = async (): Promise<boolean> => {
    if (!isAvailable) {
        console.log('[ScreenTime] Platform NOT supported (needs iOS)');
        return false;
    }
    try {
        console.log('[ScreenTime] Starting authorization flow...');

        // 1. Check current status
        const currentStatus = await getScreenTimePermissionStatus();
        console.log('[ScreenTime] Current status:', currentStatus);

        if (currentStatus) {
            console.log('[ScreenTime] Already approved');
            return true;
        }

        // 2. Request authorization
        console.log('[ScreenTime] Calling native requestAuthorization...');

        try {
            const result = await nativeRequestAuthorization();
            console.log('[ScreenTime] Native request result:', result);
        } catch (nativeError: any) {
            console.error('[ScreenTime] Native call failed:', nativeError);
            throw nativeError;
        }

        // 3. Re-verify
        const finalStatus = await getScreenTimePermissionStatus();
        return finalStatus;
    } catch (error: any) {
        console.error('[ScreenTime] Authorization flow error:', error);
        return await getScreenTimePermissionStatus();
    }
};

/**
 * Emergency debug bypass for permission check
 */
export const debugForcePermission = (): boolean => {
    console.log('[ScreenTime] DEBUG FORCE PERMISSION CALLED');
    return true;
};

/**
 * Present the iOS FamilyActivityPicker for users to select apps to shield.
 * This shows the native Apple picker UI.
 */
export interface PickerResult {
    success: boolean;
    count: number;
    toggles: { name: string; isEnabled: boolean; isCategory?: boolean; token?: string; tokenData?: string }[];
}

export const showAppPicker = async (): Promise<PickerResult> => {
    const defaultResult = { success: false, count: 0, toggles: [] };
    if (!isAvailable) return defaultResult;
    try {
        console.log('[ScreenTime] Calling native showAppPicker...');
        let result: any = null;

        // 1. Try named import
        if (typeof nativeShowAppPicker === 'function') {
            console.log('[ScreenTime] Using named import');
            result = await nativeShowAppPicker();
        }
        // 2. Try direct module access
        else {
            const mod = getModule();
            console.log('[ScreenTime] Direct module keys:', mod ? Object.keys(mod) : 'null');
            if (mod && typeof mod.showAppPicker === 'function') {
                console.log('[ScreenTime] Using direct module access');
                result = await mod.showAppPicker();
            }
        }

        if (!result && result !== false) {
            const mod = getModule();
            const errorMsg = `showAppPicker is NOT available (Import: ${typeof nativeShowAppPicker}, Module: ${mod ? 'Found' : 'Null'})`;
            console.error('[ScreenTime]', errorMsg);
            // Alert.alert("Bridge Error", errorMsg); // Suppress
            return defaultResult;
        }

        console.log('[ScreenTime] Raw result:', result);

        // Handle legacy boolean return
        if (typeof result === 'boolean') {
            if (result) {
                const count = getSelectedAppCount();
                const toggles = getAppToggles();
                return { success: true, count, toggles };
            }
            return defaultResult;
        }

        // Handle new object return
        if (result && typeof result === 'object') {
            return {
                success: result.success ?? false,
                count: result.count ?? 0,
                toggles: result.toggles ?? []
            };
        }

        return defaultResult;
    } catch (error: any) {
        console.error('[ScreenTime] Error showing app picker:', error);
        return defaultResult;
    }
};

/**
 * Activate shields on selected apps.
 * Call this when morning shield should be enforced.
 * Automatically syncs state to Zustand store.
 */
export const activateShield = (): boolean => {
    if (!isAvailable) return false;
    try {
        const result = nativeActivateShield();
        console.log('[ScreenTime] activateShield result:', result);

        // Sync to store
        if (result) {
            useLumisStore.getState().setShieldEngaged(true);
        }

        return result;
    } catch (error) {
        console.error('[ScreenTime] Error activating shield:', error);
        return false;
    }
};

/**
 * Deactivate all shields.
 * Call this when user completes their sunlight session.
 * Automatically syncs state to Zustand store.
 */
export const deactivateShield = (): boolean => {
    if (!isAvailable) return false;
    try {
        const result = nativeDeactivateShield();
        console.log('[ScreenTime] deactivateShield result:', result);

        // Sync to store
        if (result) {
            useLumisStore.getState().setShieldEngaged(false);
        }

        return result;
    } catch (error) {
        console.error('[ScreenTime] Error deactivating shield:', error);
        return false;
    }
};

/**
 * Get the list of apps selected in the native picker and their status
 */
export const getAppToggles = (): { name: string, isEnabled: boolean, isCategory?: boolean, token?: string }[] => {
    if (!isAvailable) return [];
    try {
        return nativeGetAppToggles();
    } catch (error) {
        console.error('[ScreenTime] Error getting app toggles:', error);
        return [];
    }
};

/**
 * Update an app's toggle state in the native store
 */
export const toggleNativeApp = (name: string, enabled: boolean): boolean => {
    if (!isAvailable) return false;
    try {
        return nativeToggleApp(name, enabled);
    } catch (error) {
        console.error('[ScreenTime] Error toggling native app:', error);
        return false;
    }
};

/**
 * Get count of apps selected for shielding.
 */
export const getSelectedAppCount = (): number => {
    if (!isAvailable) return 0;
    try {
        return nativeGetSelectedAppCount();
    } catch (error) {
        console.error('[ScreenTime] Error getting app count:', error);
        return 0;
    }
};

/**
 * Check if shield is currently active.
 * Falls back to Zustand store state if native call fails.
 */
export const isShieldActive = (): boolean => {
    if (!isAvailable) return false;
    try {
        return nativeIsShieldActive();
    } catch (error) {
        console.error('[ScreenTime] Error checking shield status, falling back to store:', error);
        // Fallback to store state if native read fails
        return useLumisStore.getState().isShieldEngaged;
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

export const clearMetadata = (): void => {
    if (!isAvailable) return;
    try {
        nativeClearMetadata();
    } catch (e) {
        console.error('Failed to clear metadata', e);
    }
};

// MARK: - Live Activity Functions

/**
 * Start a Live Activity for tracking session.
 * Shows on Dynamic Island and Lock Screen.
 * @returns Activity ID if successful, null otherwise
 */
export const startLiveActivity = (
    goalMinutes: number,
    remainingSeconds: number,
    luxLevel: number
): string | null => {
    if (!isAvailable) return null;
    try {
        const result = nativeStartLiveActivity(goalMinutes, remainingSeconds, luxLevel);
        console.log('[ScreenTime] startLiveActivity result:', result);
        return result ?? null;
    } catch (error) {
        console.error('[ScreenTime] Error starting Live Activity:', error);
        return null;
    }
};

/**
 * Update the Live Activity with current session state.
 * Call this every few seconds during tracking.
 */
export const updateLiveActivity = (
    remainingSeconds: number,
    luxLevel: number,
    creditRate: number,
    isIndoors: boolean
): void => {
    if (!isAvailable) return;
    try {
        nativeUpdateLiveActivity(remainingSeconds, luxLevel, creditRate, isIndoors);
    } catch (error) {
        console.error('[ScreenTime] Error updating Live Activity:', error);
    }
};

/**
 * End the current Live Activity.
 * Call this when tracking session completes or is cancelled.
 */
export const endLiveActivity = (): void => {
    if (!isAvailable) return;
    try {
        nativeEndLiveActivity();
        console.log('[ScreenTime] Live Activity ended');
    } catch (error) {
        console.error('[ScreenTime] Error ending Live Activity:', error);
    }
};

/**
 * Check if a Live Activity is currently running.
 */
export const isLiveActivityActive = (): boolean => {
    if (!isAvailable) return false;
    try {
        return nativeIsLiveActivityActive() ?? false;
    } catch (error) {
        console.error('[ScreenTime] Error checking Live Activity status:', error);
        return false;
    }
};

/**
 * Check if Live Activities are enabled on this device.
 * Requires iOS 16.1+ and user permission.
 */
export const areLiveActivitiesEnabled = (): boolean => {
    if (!isAvailable) return false;
    try {
        return nativeAreLiveActivitiesEnabled() ?? false;
    } catch (error) {
        console.error('[ScreenTime] Error checking Live Activities enabled:', error);
        return false;
    }
};

// MARK: - Shield Display Data Sync

/**
 * Sync shield display data to the ShieldConfigurationExtension.
 * This updates the custom blocked app screen with current goal progress.
 * Call this when:
 * - Shield is activated
 * - During tracking sessions (to show updated progress)
 * - When daily progress changes
 */
export const syncShieldDisplayData = (): void => {
    if (!isAvailable) return;
    try {
        const store = useLumisStore.getState();
        const goalMinutes = store.dailyGoalMinutes;
        const lightMinutes = Math.floor(store.todayProgress?.lightMinutes ?? 0);
        const currentStreak = store.currentStreak;

        nativeUpdateShieldData(goalMinutes, lightMinutes, currentStreak);
        console.log('[ScreenTime] Shield display data synced:', { goalMinutes, lightMinutes, currentStreak });
    } catch (error) {
        console.error('[ScreenTime] Error syncing shield display data:', error);
    }
};

export { LumisIcon };
