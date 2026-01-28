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

// MARK: - Focus Score Functions

export interface FocusScoreData {
    score: number;
    timestamp: string;
    distractingMinutes: number;
    sunlightBonusApplied: boolean;
    focusRatio: number;
    penaltyDeductions: number;
}

/**
 * Schedule the Focus Score monitoring for the morning window.
 * This sets up DeviceActivityReport to run 60 minutes after wake time.
 * @param wakeHour - Wake time hour (0-23)
 * @param wakeMinute - Wake time minute (0-59)
 */
export async function scheduleFocusScoreReport(wakeHour: number, wakeMinute: number): Promise<boolean> {
    if (!NativeModule || !NativeModule.scheduleFocusScoreReport) {
        console.warn('[LumisScreenTime] scheduleFocusScoreReport not available');
        return false;
    }
    try {
        return await NativeModule.scheduleFocusScoreReport(wakeHour, wakeMinute);
    } catch (e) {
        console.error('[LumisScreenTime] scheduleFocusScoreReport error:', e);
        return false;
    }
}

/**
 * Stop monitoring the focus score window.
 */
export function stopFocusScoreMonitoring(): void {
    if (!NativeModule || !NativeModule.stopFocusScoreMonitoring) {
        return;
    }
    NativeModule.stopFocusScoreMonitoring();
}

/**
 * Get the current Focus Score from the extension's calculation.
 * Returns data written by the DeviceActivityReport extension.
 */
export function getFocusScore(): FocusScoreData {
    if (!NativeModule || !NativeModule.getFocusScore) {
        return {
            score: 0,
            timestamp: '',
            distractingMinutes: 0,
            sunlightBonusApplied: false,
            focusRatio: 0,
            penaltyDeductions: 0
        };
    }
    return NativeModule.getFocusScore();
}

/**
 * Record a shield pickup (user attempted to open blocked app).
 * This increments the penalty counter for Focus Score calculation.
 */
export function recordShieldPickup(): void {
    if (!NativeModule || !NativeModule.recordShieldPickup) return;
    NativeModule.recordShieldPickup();
    console.log('[LumisScreenTime] Shield pickup recorded');
}

/**
 * Mark that user has achieved 120 seconds of outdoor lux today.
 * This enables the sunlight bonus multiplier for Focus Score.
 */
export function markLuxDetected(): void {
    if (!NativeModule || !NativeModule.markLuxDetected) return;
    NativeModule.markLuxDetected();
    console.log('[LumisScreenTime] Lux threshold achieved - sunlight bonus enabled');
}

/**
 * Reset daily focus data counters.
 * Call this at the start of each new day.
 */
export function resetDailyFocusData(): void {
    if (!NativeModule || !NativeModule.resetDailyFocusData) return;
    NativeModule.resetDailyFocusData();
    console.log('[LumisScreenTime] Daily focus data reset');
}

/**
 * Get the 7-day average distracting minutes for "Time Saved" badge.
 */
export function getAvgDistractingMinutes(): number {
    if (!NativeModule || !NativeModule.getAvgDistractingMinutes) return 0;
    return NativeModule.getAvgDistractingMinutes();
}

// MARK: - Detailed Usage Data Types

export interface DetailedUsageStats {
    totalScreenTimeSeconds: number;
    productiveSeconds: number;
    distractingSeconds: number;
    neutralSeconds: number;
    totalPickups: number;
    totalNotifications: number;
    topApps: string[];
    focusScore: number;
    focusRatio: number;
    timestamp: string;
}

export interface HourlyBreakdown {
    hour: number;
    productiveSeconds: number;
    distractingSeconds: number;
    neutralSeconds: number;
}

export interface AppUsageItem {
    bundleIdentifier: string;
    displayName: string;
    category: string;
    totalSeconds: number;
    numberOfPickups: number;
    numberOfNotifications: number;
    tokenData?: string; // Base64 encoded ApplicationToken for native icon
}

export interface DailyUsageReport {
    date: string;
    totalScreenTimeSeconds: number;
    productiveSeconds: number;
    distractingSeconds: number;
    neutralSeconds: number;
    totalPickups: number;
    totalNotifications: number;
    focusScore: number;
    focusRatio: number;
    topApps: string[];
}

// MARK: - Detailed Usage Data Functions

/**
 * Get detailed usage stats for the current day.
 */
export function getDetailedUsageStats(): DetailedUsageStats {
    if (!NativeModule || !NativeModule.getDetailedUsageStats) {
        return {
            totalScreenTimeSeconds: 0,
            productiveSeconds: 0,
            distractingSeconds: 0,
            neutralSeconds: 0,
            totalPickups: 0,
            totalNotifications: 0,
            topApps: [],
            focusScore: 0,
            focusRatio: 0,
            timestamp: ''
        };
    }
    return NativeModule.getDetailedUsageStats();
}

/**
 * Get hourly breakdown data for charts.
 */
export function getHourlyBreakdown(): HourlyBreakdown[] {
    if (!NativeModule || !NativeModule.getHourlyBreakdown) return [];
    return NativeModule.getHourlyBreakdown();
}

/**
 * Get app usage data for the list view.
 */
export function getAppUsageData(): AppUsageItem[] {
    if (!NativeModule || !NativeModule.getAppUsageData) return [];
    return NativeModule.getAppUsageData();
}

/**
 * Get usage data for a specific date (historical).
 * @param dateKey - Date in YYYY-MM-DD format
 */
export function getUsageForDate(dateKey: string): DailyUsageReport | null {
    if (!NativeModule || !NativeModule.getUsageForDate) return null;
    return NativeModule.getUsageForDate(dateKey);
}

/**
 * Get available history dates (last 30 days with data).
 */
export function getAvailableHistoryDates(): string[] {
    if (!NativeModule || !NativeModule.getAvailableHistoryDates) return [];
    return NativeModule.getAvailableHistoryDates();
}

// MARK: - Daily Activity Monitoring

/**
 * Start monitoring all device activity for the full day.
 * This triggers the DeviceActivityMonitor extension to collect usage data.
 * Should be called once when the app starts or when user enables screen time tracking.
 */
export async function startDailyMonitoring(): Promise<boolean> {
    if (!NativeModule || !NativeModule.startDailyMonitoring) {
        console.warn('[LumisScreenTime] startDailyMonitoring not available');
        return false;
    }
    try {
        return await NativeModule.startDailyMonitoring();
    } catch (error) {
        console.error('[LumisScreenTime] startDailyMonitoring error:', error);
        return false;
    }
}

/**
 * Stop daily activity monitoring.
 */
export function stopDailyMonitoring(): void {
    if (!NativeModule || !NativeModule.stopDailyMonitoring) return;
    NativeModule.stopDailyMonitoring();
}

/**
 * Check if daily monitoring is currently active.
 */
export function isDailyMonitoringActive(): boolean {
    if (!NativeModule || !NativeModule.isDailyMonitoringActive) return false;
    return NativeModule.isDailyMonitoringActive();
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

// MARK: - Refresh Screen Time Data

/**
 * Triggers a refresh of screen time data.
 * Data is collected by the DeviceActivityMonitor extension.
 */
export async function refreshScreenTimeData(): Promise<boolean> {
    if (!NativeModule || !NativeModule.refreshScreenTimeData) {
        console.warn('[LumisScreenTime] refreshScreenTimeData not available');
        return false;
    }
    try {
        return await NativeModule.refreshScreenTimeData();
    } catch (error) {
        console.error('[LumisScreenTime] refreshScreenTimeData error:', error);
        return false;
    }
}

/**
 * @deprecated No longer needed - data is collected via DeviceActivityMonitor
 * Kept for backwards compatibility - returns null (no-op)
 */
export interface LumisActivityReportViewProps extends ViewProps {
    startDate?: number;
    endDate?: number;
}

export const LumisActivityReportView = (_props: LumisActivityReportViewProps) => {
    // No-op - data collection happens via DeviceActivityMonitor extension
    return null;
};
