import { requireNativeModule } from 'expo-modules-core';
import { Alert } from 'react-native';

// Use lowercase name as used in most Expo projects
let NativeModule: any = null;
try {
    NativeModule = requireNativeModule('lumisscreentime');
    console.log('[LumisScreenTime] Native module loaded:', !!NativeModule);

    if (NativeModule) {
        if (NativeModule.hello) {
            console.log('[LumisScreenTime] Bridge check:', NativeModule.hello());
        }
    }
} catch (e: any) {
    console.error('[LumisScreenTime] Failed to load native module:', e);
}

export async function requestAuthorization(): Promise<boolean> {
    if (!NativeModule) {
        console.error('[LumisScreenTime] requestAuthorization: Native module not found.');
        return false;
    }
    return await NativeModule.requestAuthorization();
}

export async function getAuthorizationStatus(): Promise<string> {
    if (!NativeModule || !NativeModule.getAuthorizationStatus) {
        console.warn('[LumisScreenTime] getAuthorizationStatus not available');
        return "unknown";
    }
    return await NativeModule.getAuthorizationStatus();
}

/**
 * Present the iOS FamilyActivityPicker for users to select which apps to shield.
 * Returns true when selection is complete, false if cancelled or error.
 */
export async function showAppPicker(): Promise<boolean> {
    if (!NativeModule || !NativeModule.showAppPicker) {
        console.warn('[LumisScreenTime] showAppPicker not available');
        return false;
    }
    return await NativeModule.showAppPicker();
}

/**
 * Activate shields on all apps selected via showAppPicker.
 * Call this when morning shield should be enforced.
 */
export function activateShield(): boolean {
    if (!NativeModule || !NativeModule.activateShield) {
        console.warn('[LumisScreenTime] activateShield not available');
        return false;
    }
    return NativeModule.activateShield();
}

/**
 * Remove all shields from apps.
 * Call this when user completes their sunlight session.
 */
export function deactivateShield(): boolean {
    if (!NativeModule || !NativeModule.deactivateShield) {
        console.warn('[LumisScreenTime] deactivateShield not available');
        return false;
    }
    return NativeModule.deactivateShield();
}

/**
 * Get count of apps currently selected for shielding.
 */
export function getSelectedAppCount(): number {
    if (!NativeModule || !NativeModule.getSelectedAppCount) {
        return 0;
    }
    return NativeModule.getSelectedAppCount();
}

/**
 * Check if shield is currently active on any apps.
 */
export function isShieldActive(): boolean {
    if (!NativeModule || !NativeModule.isShieldActive) {
        return false;
    }
    return NativeModule.isShieldActive();
}

// Legacy functions for backwards compatibility
export function blockAllApps(): boolean {
    if (!NativeModule || !NativeModule.blockAllApps) return false;
    return NativeModule.blockAllApps();
}

export function unblockAllApps(): boolean {
    if (!NativeModule || !NativeModule.unblockAllApps) return false;
    return NativeModule.unblockAllApps();
}

export function areAppsBlocked(): boolean {
    if (!NativeModule || !NativeModule.areAppsBlocked) return false;
    return NativeModule.areAppsBlocked();
}

export function getAppToggles(): { name: string, isEnabled: boolean, isCategory?: boolean }[] {
    if (!NativeModule || !NativeModule.getAppToggles) return [];
    return NativeModule.getAppToggles();
}

export function toggleApp(name: string, enabled: boolean): boolean {
    if (!NativeModule || !NativeModule.toggleApp) return false;
    return NativeModule.toggleApp(name, enabled);
}

export function hello(): string {
    if (!NativeModule) return "Native module not linked";
    return NativeModule.hello ? NativeModule.hello() : "hello function missing";
}
