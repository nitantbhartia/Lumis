import { requireNativeModule } from 'expo-modules-core';

// This call loads the native module object from the JSI.
const LumisScreenTime = requireNativeModule('LumisScreenTime');

export async function requestAuthorization(): Promise<boolean> {
    return await LumisScreenTime.requestAuthorization();
}

export function blockAllApps(): boolean {
    return LumisScreenTime.blockAllApps();
}

export function unblockAllApps(): boolean {
    return LumisScreenTime.unblockAllApps();
}

export function areAppsBlocked(): boolean {
    return LumisScreenTime.areAppsBlocked();
}
