import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import LuxSensor from 'expo-lux-sensor';
import { useWeather } from './useWeather';

/**
 * Quick lux check hook for passive verification.
 * Samples ambient light within 500ms and cleans up.
 */
export const useQuickLuxCheck = () => {
    const [lux, setLux] = useState<number | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const weather = useWeather();

    const calculateSimulatedLux = () => {
        let base = 5000;
        const cond = (weather.condition || '').toLowerCase();
        if (cond.includes('clear')) base = 50000;
        else if (cond.includes('mainly clear')) base = 35000;
        else if (cond.includes('partly')) base = 20000;
        else if (cond.includes('overcast')) base = 8000;

        const uvBonus = (weather.uvIndex || 0) * 15000;
        return Math.round((base + uvBonus) * (0.9 + Math.random() * 0.2));
    };

    const checkLux = async (): Promise<number | null> => {
        if (Platform.OS === 'web') {
            return calculateSimulatedLux();
        }

        setIsChecking(true);

        try {
            let detectedLux: number | null = null;

            await LuxSensor.startAsync({ updateInterval: 100 }).catch(() => { });

            // Quick sampling
            const listener = LuxSensor.addLuxListener((data: any) => {
                const val = typeof data === 'number' ? data : (data?.lux ?? data?.illuminance ?? 0);
                if (val > 0) {
                    detectedLux = Math.round(val);
                }
            });

            // Wait up to 500ms for reading
            await new Promise(resolve => setTimeout(resolve, 500));

            // Cleanup
            listener.remove();
            await LuxSensor.stopAsync().catch(() => { });

            setIsChecking(false);

            // Fallback to weather simulation if sensor didn't work
            if (!detectedLux || detectedLux < 10) {
                detectedLux = calculateSimulatedLux();
            }

            setLux(detectedLux);
            return detectedLux;
        } catch (error) {
            console.error('[QuickLuxCheck] Error:', error);
            setIsChecking(false);

            // Fallback to weather-based simulation
            const simulated = calculateSimulatedLux();
            setLux(simulated);
            return simulated;
        }
    };

    return { lux, isChecking, checkLux };
};
