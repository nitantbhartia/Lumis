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
