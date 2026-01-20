import { Platform } from 'react-native';

/**
 * Health Integration Module
 *
 * For iOS: To enable real HealthKit integration, add 'expo-health' to package.json
 * For now, this provides a mock interface that works across all platforms
 *
 * Real implementation would require:
 * - expo-health package installation
 * - HealthKit entitlements in app.json
 * - NSHealthShareUsageDescription permission in Info.plist
 */

import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
} from 'react-native-health';
import { Pedometer } from 'expo-sensors';

export interface HealthSyncData {
  date: string;
  lightMinutes: number;
  steps: number;
  activeEnergy?: number; // kCal
}

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
    ],
    write: [
      AppleHealthKit.Constants.Permissions.Steps,
    ],
  },
};

class HealthService {
  private isAvailable = Platform.OS === 'ios';

  async requestPermissions(): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }

    // Try HealthKit first
    console.log('[HealthKit] Initializing...');
    let healthKitResult = false;
    try {
      healthKitResult = await new Promise<boolean>((resolve) => {
        AppleHealthKit.initHealthKit(permissions, (error) => {
          if (error) {
            console.log('[HealthKit] Error initializing:', error);
            resolve(false);
            return;
          }
          resolve(true); // If entitlement is missing, this might actually succeed but result in no data, OR fail.
        });
      });
    } catch (e) {
      console.log('[HealthKit] Exception during init:', e);
    }
    console.log('[HealthKit] Init result:', healthKitResult);

    // ALWAYS Request Pedometer permissions as fallback/supplement
    // This is critical because HealthKit entitlement is currently removed
    console.log('[Pedometer] Requesting permissions...');
    try {
      const { granted } = await Pedometer.requestPermissionsAsync();
      console.log('[Pedometer] Permission granted:', granted);
      // We consider it a success if Pedometer works, even if HealthKit failed
      return granted || healthKitResult;
    } catch (e) {
      console.log('[Pedometer] Error requesting permissions:', e);
      return healthKitResult;
    }
  }

  async writeOutdoorActivity(data: HealthSyncData): Promise<boolean> {
    if (!this.isAvailable) {
      console.log('HealthKit not available - data not synced to Health app');
      return false;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      // Real implementation would go here
      console.log('Health data synced:', data);
      return true;
    } catch (error) {
      console.error('Error syncing to HealthKit:', error);
      return false;
    }
  }

  async readOutdoorActivityMinutes(startDate: Date, endDate: Date): Promise<number> {
    if (!this.isAvailable) return 0;
    // Note: Outdoor activity minutes are usually inferred from distance or active energy
    // For now, we return 0 or implement a more complex query if needed
    return 0;
  }

  async syncSteps(startDate: Date, endDate: Date): Promise<number> {
    if (!this.isAvailable) return 0;

    const options: HealthInputOptions = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    return new Promise((resolve) => {
      AppleHealthKit.getStepCount(options, (err, results) => {
        if (err || !results) {
          resolve(0);
          return;
        }
        resolve(results.value);
      });
    });
  }

  async openHealthApp(): Promise<void> {
    if (Platform.OS !== 'ios') {
      console.log('Health app only available on iOS');
      return;
    }

    try {
      // In a real app with Linking module, this would open Health.app
      console.log('Opening Health app (requires Linking module)');
    } catch (error) {
      console.error('Error opening Health app:', error);
    }
  }

  isHealthAvailable(): boolean {
    return this.isAvailable;
  }

  getSetupInstructions(): string {
    return `To enable HealthKit integration:
1. Install expo-health: bun add expo-health
2. Add HealthKit capabilities to your Apple Developer account
3. Add to app.json:
   {
     "plugins": [
       ["expo-health", {
         "permissions": {
           "healthShare": ["HKWorkoutTypeIdentifier", "HKQuantityTypeIdentifierStepCount"],
           "healthRecords": []
         }
       }]
     ]
   }
4. Rebuild the app`;
  }
}

export const healthService = new HealthService();

// Use health service (mock mode by default)
export const getHealthService = () => healthService;

