import { requireNativeModule } from 'expo-modules-core';
import { Alert } from 'react-native';

// Use PascalCase as defined in Swift Name("LumisScreenTime")
let NativeModule: any = null;
try {
    NativeModule = requireNativeModule('LumisScreenTime');
    console.log('[LumisScreenTime] Native module loaded (LumisScreenTime):', !!NativeModule);
} catch (e: any) {
    console.error('[LumisScreenTime] Failed to load "LumisScreenTime":', e?.message);
}

if (!NativeModule) {
    try {
        // Fallback to lowercase just in case
        NativeModule = requireNativeModule('lumisscreentime');
        console.log('[LumisScreenTime] Native module loaded (lumisscreentime):', !!NativeModule);
    } catch (e: any) {
        console.error('[LumisScreenTime] Failed to load "lumisscreentime":', e?.message);
    }
}

if (NativeModule && NativeModule.hello) {
    console.log('[LumisScreenTime] Bridge check:', NativeModule.hello());
} else {
    console.error('[LumisScreenTime] Bridge check failed. NativeModule is:', NativeModule);
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
export async function showAppPicker(): Promise<any> {
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

export function getAppToggles(): { name: string, isEnabled: boolean, isCategory?: boolean, token?: string }[] {
    if (!NativeModule || !NativeModule.getAppToggles) return [];
    return NativeModule.getAppToggles();
}

export function toggleApp(name: string, enabled: boolean): boolean {
    if (!NativeModule || !NativeModule.toggleApp) return false;
    return NativeModule.toggleApp(name, enabled);
}

export function clearMetadata(): void {
    if (NativeModule && NativeModule.clearMetadata) {
        NativeModule.clearMetadata();
    }
}

export function hello(): string {
    if (!NativeModule) return "Native module not linked";
    return NativeModule.hello ? NativeModule.hello() : "hello function missing";
}

// MARK: - Live Activity Functions

/**
 * Start a Live Activity for the tracking session.
 * Shows on Dynamic Island (iPhone 14 Pro+) and Lock Screen.
 * @returns Activity ID if successful, null otherwise
 */
export function startLiveActivity(goalMinutes: number, remainingSeconds: number, luxLevel: number): string | null {
    if (!NativeModule || !NativeModule.startLiveActivity) {
        console.warn('[LumisScreenTime] startLiveActivity not available');
        return null;
    }
    return NativeModule.startLiveActivity(goalMinutes, remainingSeconds, luxLevel);
}

/**
 * Update the current Live Activity with new state.
 * Call this periodically during tracking.
 */
export function updateLiveActivity(remainingSeconds: number, luxLevel: number, creditRate: number, isIndoors: boolean): void {
    if (!NativeModule || !NativeModule.updateLiveActivity) {
        return;
    }
    NativeModule.updateLiveActivity(remainingSeconds, luxLevel, creditRate, isIndoors);
}

/**
 * End the current Live Activity.
 * Call when tracking completes or is cancelled.
 */
export function endLiveActivity(): void {
    if (!NativeModule || !NativeModule.endLiveActivity) {
        return;
    }
    NativeModule.endLiveActivity();
}

/**
 * Check if a Live Activity is currently running.
 */
export function isLiveActivityActive(): boolean {
    if (!NativeModule || !NativeModule.isLiveActivityActive) {
        return false;
    }
    return NativeModule.isLiveActivityActive();
}

/**
 * Check if Live Activities are enabled on this device.
 * Requires iOS 16.1+ and user hasn't disabled them.
 */
export function areLiveActivitiesEnabled(): boolean {
    if (!NativeModule || !NativeModule.areLiveActivitiesEnabled) {
        return false;
    }
    return NativeModule.areLiveActivitiesEnabled();
}

// MARK: - Shield Data Sync Functions

/**
 * Update shield display data for the ShieldConfigurationExtension.
 * This syncs goal progress to the custom blocked app screen.
 * Call this when shield is activated and during tracking sessions.
 */
export function updateShieldData(goalMinutes: number, lightMinutes: number, currentStreak: number): void {
    if (!NativeModule || !NativeModule.updateShieldData) {
        console.warn('[LumisScreenTime] updateShieldData not available');
        return;
    }
    NativeModule.updateShieldData(goalMinutes, lightMinutes, currentStreak);
}

import { requireNativeViewManager } from 'expo-modules-core';
import React from 'react';
import { ViewProps } from 'react-native';

const NativeLumisIcon = requireNativeViewManager('LumisScreenTime');

export interface LumisIconProps extends ViewProps {
    tokenData?: string;
    appName?: string;
    isCategory: boolean;
    variant?: "icon" | "title";
    size?: number;
    grayscale?: boolean;
}

export const LumisIcon = (props: LumisIconProps) => {
    // We pass the props individually to the native view
    return (
        <NativeLumisIcon
            style={props.style}
            tokenData={props.tokenData}
            appName={props.appName}
            isCategory={props.isCategory}
            variant={props.variant || "icon"}
            size={props.size || 40}
            grayscale={props.grayscale || false}
        />
    );
};
