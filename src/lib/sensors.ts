import { Platform } from 'react-native';

/**
 * Sensor Utilities
 * Provides graceful fallbacks for sensor access on web platform
 */

// Conditionally import based on platform
let ExpoLightSensor: any;
let ExpoPedometer: any;

if (Platform.OS !== 'web') {
  try {
    const sensors = require('expo-sensors');
    ExpoLightSensor = sensors.LightSensor;
    ExpoPedometer = sensors.Pedometer;
  } catch (error) {
    console.error('Failed to load expo-sensors:', error);
  }
}

export const LightSensor = {
  async isAvailableAsync() {
    if (Platform.OS === 'web') {
      console.log('LightSensor not available on web');
      return false;
    }
    if (!ExpoLightSensor) {
      return false;
    }
    try {
      return await ExpoLightSensor.isAvailableAsync();
    } catch (error) {
      console.error('Error checking LightSensor availability:', error);
      return false;
    }
  },

  addListener(callback: (data: { illuminance: number }) => void) {
    if (Platform.OS === 'web' || !ExpoLightSensor) {
      console.log('LightSensor not available - using mock data');
      // Return a mock subscription that does nothing
      return {
        remove: () => {},
      };
    }
    try {
      return ExpoLightSensor.addListener(callback);
    } catch (error) {
      console.error('Error adding LightSensor listener:', error);
      return {
        remove: () => {},
      };
    }
  },

  setUpdateInterval(interval: number) {
    if (Platform.OS === 'web' || !ExpoLightSensor) return;
    try {
      ExpoLightSensor.setUpdateInterval(interval);
    } catch (error) {
      console.error('Error setting LightSensor update interval:', error);
    }
  },
};

export const Pedometer = {
  async isAvailableAsync() {
    if (Platform.OS === 'web') {
      console.log('Pedometer not available on web');
      return false;
    }
    if (!ExpoPedometer) {
      return false;
    }
    try {
      return await ExpoPedometer.isAvailableAsync();
    } catch (error) {
      console.error('Error checking Pedometer availability:', error);
      return false;
    }
  },

  watchStepCount(callback: (result: { steps: number }) => void) {
    if (Platform.OS === 'web' || !ExpoPedometer) {
      console.log('Pedometer not available - using mock data');
      // Return a mock subscription that does nothing
      return {
        remove: () => {},
      };
    }
    try {
      return ExpoPedometer.watchStepCount(callback);
    } catch (error) {
      console.error('Error watching step count:', error);
      return {
        remove: () => {},
      };
    }
  },

  async getStepCountAsync(start: Date, end: Date) {
    if (Platform.OS === 'web' || !ExpoPedometer) {
      return { steps: 0 };
    }
    try {
      return await ExpoPedometer.getStepCountAsync(start, end);
    } catch (error) {
      console.error('Error getting step count:', error);
      return { steps: 0 };
    }
  },
};

