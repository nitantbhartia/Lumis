import { requireNativeModule } from 'expo-modules-core';

let LumisScreenTime: any = null;
try {
    LumisScreenTime = requireNativeModule('lumisscreentime');
    console.log('[LumisScreenTime] Native module loaded result:', !!LumisScreenTime);
} catch (e) {
    console.error('[LumisScreenTime] CRITICAL: Failed to load native module:', e);
}

export async function requestAuthorization(): Promise<boolean> {
    if (!LumisScreenTime) {
        console.error('[LumisScreenTime] requestAuthorization failed: Native module not found.');
        return false;
    }
    return await LumisScreenTime.requestAuthorization();
}

export async function getAuthorizationStatus(): Promise<boolean> {
    if (!LumisScreenTime || !LumisScreenTime.getAuthorizationStatus) {
        console.warn('[LumisScreenTime] getAuthorizationStatus not available on native side');
        return false;
    }
    return await LumisScreenTime.getAuthorizationStatus();
}

/**
 * Present the iOS FamilyActivityPicker for users to select which apps to shield.
 * Returns true when selection is complete, false if cancelled or error.
 */
export async function showAppPicker(): Promise<boolean> {
    if (!LumisScreenTime || !LumisScreenTime.showAppPicker) {
        console.warn('[LumisScreenTime] showAppPicker not available');
        return false;
    }
    return await LumisScreenTime.showAppPicker();
}

/**
 * Activate shields on all apps selected via showAppPicker.
 * Call this when morning shield should be enforced.
 */
export function activateShield(): boolean {
    if (!LumisScreenTime || !LumisScreenTime.activateShield) {
        console.warn('[LumisScreenTime] activateShield not available');
        return false;
    }
    return LumisScreenTime.activateShield();
}

/**
 * Remove all shields from apps.
 * Call this when user completes their sunlight session.
 */
export function deactivateShield(): boolean {
    if (!LumisScreenTime || !LumisScreenTime.deactivateShield) {
        console.warn('[LumisScreenTime] deactivateShield not available');
        return false;
    }
    return LumisScreenTime.deactivateShield();
}

/**
 * Get count of apps currently selected for shielding.
 */
export function getSelectedAppCount(): number {
    if (!LumisScreenTime || !LumisScreenTime.getSelectedAppCount) {
        return 0;
    }
    return LumisScreenTime.getSelectedAppCount();
}

/**
 * Check if shield is currently active on any apps.
 */
export function isShieldActive(): boolean {
    if (!LumisScreenTime || !LumisScreenTime.isShieldActive) {
        return false;
    }
    return LumisScreenTime.isShieldActive();
}

// Legacy functions for backwards compatibility
export function blockAllApps(): boolean {
    if (!LumisScreenTime) return false;
    return LumisScreenTime.blockAllApps();
}

export function unblockAllApps(): boolean {
    if (!LumisScreenTime) return false;
    return LumisScreenTime.unblockAllApps();
}

export function areAppsBlocked(): boolean {
    if (!LumisScreenTime) return false;
    return LumisScreenTime.areAppsBlocked();
}

export function hello(): string {
    if (!LumisScreenTime) return "Native module not linked";
    return LumisScreenTime.hello ? LumisScreenTime.hello() : "hello function missing";
}
