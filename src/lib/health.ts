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

export interface HealthSyncData {
  date: string;
  lightMinutes: number;
  steps: number;
  activeEnergy?: number; // kCal
}

class HealthService {
  private isAvailable = false; // Will be true when expo-health is installed

  async requestPermissions(): Promise<boolean> {
    if (!this.isAvailable) {
      console.log(
        'HealthKit integration not available. To enable, install expo-health package.'
      );
      return false;
    }
    return true;
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

    try {
      // Real implementation would query HealthKit
      console.log(`Reading outdoor activities from ${startDate} to ${endDate}`);
      return 0;
    } catch (error) {
      console.error('Error reading from HealthKit:', error);
      return 0;
    }
  }

  async syncSteps(startDate: Date, endDate: Date): Promise<number> {
    if (!this.isAvailable) return 0;

    try {
      // Real implementation would query HealthKit for step count
      console.log(`Reading steps from ${startDate} to ${endDate}`);
      return 0;
    } catch (error) {
      console.error('Error reading steps from HealthKit:', error);
      return 0;
    }
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

