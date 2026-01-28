import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import LuxSensor from 'expo-lux-sensor';
import * as Location from 'expo-location';
import { useLumisStore } from '../state/lumis-store';
import { analyzeLuxPattern } from '../utils/lux-pattern-analyzer';
import { validateSolarLux } from '../utils/solar-calculator';

export type EnvironmentStatus = 'IDLE' | 'OUTDOORS' | 'IN_POCKET' | 'INDOORS' | 'NIGHT';

export interface SmartEnvironment {
    status: EnvironmentStatus;
    lux: number;
    steps: number;
    isMoving: boolean;
    creditRate: number; // 0.0 to 1.0
    // Anti-cheat signals
    solarConfidence?: number; // 0-100% match with solar position
    luxPatternConfidence?: number; // 0-100% natural pattern
    outdoorConfidenceScore?: number; // 0-100% combined confidence
}

export function useSmartEnvironment() {
    const calibration = useLumisStore(s => s.calibration);
    const [status, setStatus] = useState<EnvironmentStatus>('IDLE');
    const [lux, setLux] = useState(0);
    const [steps, setSteps] = useState(0);
    const [isMoving, setIsMoving] = useState(false);
    const [creditRate, setCreditRate] = useState(0);

    // Anti-cheat state
    const [solarConfidence, setSolarConfidence] = useState<number>(50);
    const [luxPatternConfidence, setLuxPatternConfidence] = useState<number>(50);
    const [outdoorConfidenceScore, setOutdoorConfidenceScore] = useState<number>(50);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    const lastStepsRef = useRef(0);
    const consecutiveLowLuxMoving = useRef(0);
    const luxHistoryRef = useRef<number[]>([]);

    useEffect(() => {
        let luxSub: any;
        let stepSub: any;
        let locationSub: any;
        let simulationInterval: any;
        let isMounted = true;

        const startSensors = async () => {
            const isWeb = Platform.OS === 'web';

            // 1. Permissions (Only if not web)
            let luxPerm = 'denied';
            let stepPerm = 'denied';
            let locPerm = 'denied';

            if (!isWeb) {
                try {
                    const lP = await LuxSensor.requestPermissionsAsync();
                    luxPerm = lP.status;
                    const sP = await Pedometer.requestPermissionsAsync();
                    stepPerm = sP.status;
                    const loP = await Location.requestForegroundPermissionsAsync();
                    locPerm = loP.status;
                } catch (e) {
                    console.log('[useSmartEnvironment] Error requesting permissions:', e);
                }
            }

            if (!isMounted) return;

            // 2. Lux Sensor (Primary Signal)
            if (luxPerm === 'granted') {
                await LuxSensor.startAsync({ updateInterval: 1000 }).catch(() => { });
                luxSub = LuxSensor.addLuxListener((data: any) => {
                    if (!isMounted) return;

                    // More robust parsing with logging
                    let rawValue = 0;
                    if (typeof data === 'number') {
                        rawValue = data;
                    } else if (data && typeof data === 'object') {
                        rawValue = data.lux ?? data.illuminance ?? 0;
                    }

                    const currentLux = Math.max(0, Math.round(Number(rawValue) || 0));
                    console.log('[Lux Sensor] Raw:', data, 'Parsed:', currentLux);
                    setLux(currentLux);

                    // Maintain lux history for pattern analysis (last 30 readings)
                    luxHistoryRef.current.push(currentLux);
                    if (luxHistoryRef.current.length > 30) {
                        luxHistoryRef.current.shift();
                    }
                });
            } else if (isWeb) {
                // Simulation for web/demo
                simulationInterval = setInterval(() => {
                    const hour = new Date().getHours();
                    let simLux = 0;

                    // Time-based simulation for demo
                    if (hour >= 6 && hour <= 18) {
                        simLux = 10000 + Math.random() * 10000; // Daytime outdoor
                    } else {
                        simLux = 200 + Math.random() * 300; // Indoor/Evening
                    }

                    setLux(Math.round(simLux));
                }, 2000); // Update every 2s instead of 5s
            }

            // 3. Pedometer (Motion Signal)
            if (stepPerm === 'granted') {
                stepSub = Pedometer.watchStepCount((result) => {
                    const diff = result.steps - lastStepsRef.current;
                    if (diff > 0) {
                        setIsMoving(true);
                        setSteps(result.steps);
                    } else {
                        setIsMoving(false);
                    }
                    lastStepsRef.current = result.steps;
                });
            } else if (isWeb) {
                const moveSim = setInterval(() => {
                    setIsMoving(Math.random() > 0.3);
                    setSteps(prev => prev + (Math.random() > 0.5 ? 1 : 0));
                }, 3000);
                return () => clearInterval(moveSim);
            }

            // 4. Location (Final Boss Validation + Solar Calculation)
            if (locPerm === 'granted') {
                // Get initial location for solar calculations
                try {
                    const initialLocation = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced
                    });
                    setUserLocation({
                        latitude: initialLocation.coords.latitude,
                        longitude: initialLocation.coords.longitude
                    });
                } catch (e) {
                    console.log('[useSmartEnvironment] Error getting location:', e);
                }

                locationSub = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
                    (location) => {
                        const speed = location.coords.speed || 0;
                        if (speed > 0.5) setIsMoving(true);

                        // Update location for solar calculations
                        setUserLocation({
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude
                        });
                    }
                );
            }
        };

        startSensors();

        return () => {
            isMounted = false;
            luxSub?.remove();
            stepSub?.remove();
            locationSub?.remove();
            if (simulationInterval) clearInterval(simulationInterval);
            if (!Platform.OS.includes('web')) {
                LuxSensor.stopAsync().catch(() => { });
            }
        };
    }, []);

    // Calculate anti-cheat confidence scores
    useEffect(() => {
        // Only calculate if we have sufficient data
        if (luxHistoryRef.current.length < 5) return;

        // 1. Lux Pattern Analysis
        const pattern = analyzeLuxPattern(luxHistoryRef.current);
        setLuxPatternConfidence(pattern.confidence);

        // 2. Solar Position Validation (if location available)
        if (userLocation) {
            // We'll get cloud cover and UV from weather API in tracking screen
            // For now, use default values
            const solarConf = validateSolarLux(
                lux,
                userLocation.latitude,
                userLocation.longitude,
                new Date(),
                0, // cloudCover (TODO: get from weather API)
                0  // uvIndex (TODO: get from weather API)
            );
            setSolarConfidence(solarConf);
        }

        // 3. Calculate combined outdoor confidence score
        // Weights: Solar (40%), Pattern (25%), Movement (20%), UV (10%), Temp (5%)
        // For now, we'll use Solar + Pattern + Movement (75% total, normalized to 100%)
        const movementConf = isMoving ? 80 : 40; // Moving outdoors = more confident
        const combinedScore = (
            (solarConfidence * 0.53) + // 40/75 = 53%
            (pattern.confidence * 0.33) + // 25/75 = 33%
            (movementConf * 0.27) // 20/75 = 27%
        );
        setOutdoorConfidenceScore(Math.round(combinedScore));

    }, [lux, userLocation, isMoving]);

    // State Machine Logic
    useEffect(() => {
        const evaluateStatus = () => {
            // Threshold based on calibration if available, otherwise default 1500
            const outdoorThreshold = calibration.isCalibrated
                ? Math.max(1500, calibration.indoorLux * 5)
                : 1500;

            // OUTDOORS: High Lux is the gold standard
            if (lux > outdoorThreshold) {
                setStatus('OUTDOORS');
                setCreditRate(1.0);
                consecutiveLowLuxMoving.current = 0;
                return;
            }

            // IN_POCKET: Low Lux but definitely moving
            if (lux < 20 && isMoving) {
                consecutiveLowLuxMoving.current += 1;
                if (consecutiveLowLuxMoving.current > 2) {
                    setStatus('IN_POCKET');
                    setCreditRate(0.5);
                }
                return;
            }

            // INDOORS: Moderate Lux typical of artificial lighting
            if (lux >= 100 && lux <= outdoorThreshold) {
                setStatus('INDOORS');
                setCreditRate(0.0);
                consecutiveLowLuxMoving.current = 0;
                return;
            }

            // NIGHT / IDLE: Very low light and no movement
            if (lux < 10 && !isMoving) {
                setStatus('NIGHT');
                setCreditRate(0.0);
                consecutiveLowLuxMoving.current = 0;
                return;
            }

            setStatus('IDLE');
            setCreditRate(0.0);
        };

        evaluateStatus();
    }, [lux, isMoving, calibration]);

    return {
        status,
        lux,
        steps,
        isMoving,
        creditRate,
        solarConfidence,
        luxPatternConfidence,
        outdoorConfidenceScore
    };
}
