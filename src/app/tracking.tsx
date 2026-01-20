import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, Platform, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Sun, Footprints, X, AlertCircle, Check } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useLumisStore } from '@/lib/state/lumis-store';

// Import sensors with platform check
let LightSensor: any;
let Pedometer: any;
if (Platform !== undefined && Platform.OS !== 'web') {
  try {
    const sensors = require('expo-sensors');
    LightSensor = sensors.LightSensor;
    Pedometer = sensors.Pedometer;
  } catch (error) {
    console.error('Failed to load sensors:', error);
  }
}

// Provide mock subscriptions for web
const createMockSubscription = () => ({ remove: () => {} });
const LightSensorMock = {
  isAvailableAsync: async () => false,
  addListener: () => createMockSubscription(),
  setUpdateInterval: () => {},
};
const PedometerMock = {
  isAvailableAsync: async () => false,
  watchStepCount: () => createMockSubscription(),
  getStepCountAsync: async () => ({ steps: 0 }),
};

// Use mocks if sensors not loaded
const useLightSensor = LightSensor || LightSensorMock;
const usePedometer = Pedometer || PedometerMock;

function ProgressRing({
  progress,
  size = 280,
  strokeWidth = 16,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id="trackingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFE4B5" />
            <Stop offset="50%" stopColor="#FFB347" />
            <Stop offset="100%" stopColor="#FF6B35" />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#0F3460"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#trackingGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}

export default function TrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const todayProgress = useLumisStore((s) => s.todayProgress);
  const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);
  const calibration = useLumisStore((s) => s.calibration);
  const updateTodayProgress = useLumisStore((s) => s.updateTodayProgress);
  const incrementStreak = useLumisStore((s) => s.incrementStreak);
  const addToHistory = useLumisStore((s) => s.addToHistory);
  const setTrackingActive = useLumisStore((s) => s.setTrackingActive);

  const [currentLux, setCurrentLux] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const [isOutdoors, setIsOutdoors] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [sensorAvailable, setSensorAvailable] = useState(true);

  const sessionStartRef = useRef<Date | null>(null);
  const lastStepCountRef = useRef(0);
  const accumulatedMinutesRef = useRef(todayProgress.lightMinutes);

  const pulse = useSharedValue(1);
  const glow = useSharedValue(0);

  const progress = (accumulatedMinutesRef.current + sessionMinutes) / dailyGoalMinutes;
  const totalMinutes = accumulatedMinutesRef.current + sessionMinutes;
  const isGoalReached = totalMinutes >= dailyGoalMinutes;

  // Light threshold (3x indoor calibration)
  const lightThreshold = calibration.indoorLux * 3;

  useEffect(() => {
    setTrackingActive(true);
    sessionStartRef.current = new Date();

    // Check sensor availability
    const checkSensors = async () => {
      const lightAvailable = await useLightSensor.isAvailableAsync();
      setSensorAvailable(lightAvailable);
    };
    checkSensors();

    // Animations
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    return () => {
      setTrackingActive(false);
    };
  }, []);

  // Light sensor subscription
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    if (sensorAvailable) {
      subscription = useLightSensor.addListener((data: { illuminance: number }) => {
        setCurrentLux(Math.round(data.illuminance));
        setIsOutdoors(data.illuminance > lightThreshold);
      });
      useLightSensor.setUpdateInterval(500);
    } else {
      // Simulate outdoor light for demo
      const interval = setInterval(() => {
        const simulatedLux = 15000 + Math.random() * 10000;
        setCurrentLux(Math.round(simulatedLux));
        setIsOutdoors(true);
      }, 1000);
      return () => clearInterval(interval);
    }

    return () => {
      subscription?.remove();
    };
  }, [sensorAvailable, lightThreshold]);

  // Pedometer subscription
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const setupPedometer = async () => {
      const available = await usePedometer.isAvailableAsync();
      if (available) {
        subscription = usePedometer.watchStepCount((result: { steps: number }) => {
          const newSteps = result.steps;
          const stepDiff = newSteps - lastStepCountRef.current;

          // Consider moving if > 5 steps in recent interval
          setIsMoving(stepDiff > 5);
          setStepCount(newSteps);
          lastStepCountRef.current = newSteps;
        });
      } else {
        // Simulate steps for demo
        const interval = setInterval(() => {
          setStepCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
          setIsMoving(true);
        }, 2000);
        return () => clearInterval(interval);
      }
    };

    setupPedometer();
    return () => {
      subscription?.remove();
    };
  }, []);

  // Progress tracking timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOutdoors && isMoving && !isGoalReached) {
        // Accumulate ~1 second of progress
        setSessionMinutes((prev) => {
          const newValue = prev + 1 / 60; // 1 second = 1/60 minute
          return newValue;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOutdoors, isMoving, isGoalReached]);

  // Check for goal completion
  useEffect(() => {
    if (isGoalReached && !todayProgress.completed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Save progress
      const completedProgress = {
        ...todayProgress,
        lightMinutes: totalMinutes,
        steps: stepCount,
        completed: true,
        unlockTime: new Date().toISOString(),
      };

      updateTodayProgress(completedProgress);
      incrementStreak();
      addToHistory(completedProgress);

      // Navigate to victory screen
      setTimeout(() => {
        router.replace('/victory');
      }, 500);
    }
  }, [isGoalReached, todayProgress.completed]);

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Save partial progress
    updateTodayProgress({
      lightMinutes: accumulatedMinutesRef.current + sessionMinutes,
      steps: todayProgress.steps + stepCount,
    });

    router.back();
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.4, 0.8]),
  }));

  const isEarning = isOutdoors && isMoving;

  return (
    <View className="flex-1">
      <LinearGradient
        colors={isEarning ? ['#1A1A2E', '#0F3460', '#16213E'] : ['#1A1A2E', '#16213E', '#1A1A2E']}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 items-center justify-between px-8"
          style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 }}
        >
          {/* Header */}
          <View className="w-full flex-row justify-between items-center">
            <View>
              <Text
                className="text-lumis-sunrise/60"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                {isEarning ? 'Earning light credits' : 'Waiting for conditions...'}
              </Text>
              <Text
                className="text-lumis-dawn text-xl"
                style={{ fontFamily: 'Outfit_600SemiBold' }}
              >
                Active Tracking
              </Text>
            </View>
            <Pressable
              onPress={handleStop}
              className="w-10 h-10 rounded-full bg-lumis-twilight/50 items-center justify-center"
            >
              <X size={20} color="#FFB347" strokeWidth={2} />
            </Pressable>
          </View>

          {/* Main progress ring */}
          <View className="items-center">
            <View className="relative">
              {/* Glow effect when earning */}
              {isEarning && (
                <Animated.View
                  style={[
                    glowStyle,
                    {
                      position: 'absolute',
                      width: 320,
                      height: 320,
                      borderRadius: 160,
                      left: -20,
                      top: -20,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(255, 179, 71, 0.3)', 'rgba(255, 107, 53, 0.1)', 'transparent']}
                    style={{ width: '100%', height: '100%', borderRadius: 160 }}
                  />
                </Animated.View>
              )}

              <ProgressRing progress={progress} size={280} strokeWidth={16} />

              {/* Center content */}
              <View className="absolute inset-0 items-center justify-center">
                <Animated.View style={pulseStyle}>
                  <View
                    className={`w-28 h-28 rounded-full items-center justify-center ${
                      isEarning ? 'bg-lumis-golden/20' : 'bg-lumis-twilight/50'
                    }`}
                    style={{
                      shadowColor: '#FFB347',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: isEarning ? 0.6 : 0.2,
                      shadowRadius: 25,
                    }}
                  >
                    <Sun
                      size={52}
                      color="#FFB347"
                      strokeWidth={1.5}
                      fill={isEarning ? '#FFB34730' : 'transparent'}
                    />
                  </View>
                </Animated.View>
              </View>
            </View>

            {/* Progress text */}
            <View className="items-center mt-6">
              <Text
                className="text-5xl text-lumis-dawn"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                {totalMinutes.toFixed(1)}
                <Text
                  className="text-2xl text-lumis-sunrise/60"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  {' '}
                  / {dailyGoalMinutes} min
                </Text>
              </Text>
              <Text
                className="text-lumis-sunrise/60 mt-2"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                {isGoalReached
                  ? 'Goal reached!'
                  : `${(dailyGoalMinutes - totalMinutes).toFixed(1)} minutes to go`}
              </Text>
            </View>
          </View>

          {/* Status indicators */}
          <View className="w-full">
            {/* Light status */}
            <View className="flex-row items-center mb-4">
              <View
                className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                  isOutdoors ? 'bg-lumis-golden/20' : 'bg-lumis-twilight/50'
                }`}
              >
                <Sun size={24} color={isOutdoors ? '#FFB347' : '#FFB34760'} strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-lumis-dawn"
                  style={{ fontFamily: 'Outfit_600SemiBold' }}
                >
                  Light Level
                </Text>
                <Text
                  className="text-lumis-sunrise/60"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  {currentLux.toLocaleString()} lux {isOutdoors ? '(Outdoor)' : '(Indoor)'}
                </Text>
              </View>
              {isOutdoors ? (
                <Check size={20} color="#4ADE80" strokeWidth={2.5} />
              ) : (
                <AlertCircle size={20} color="#FFB347" strokeWidth={2} />
              )}
            </View>

            {/* Movement status */}
            <View className="flex-row items-center mb-6">
              <View
                className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                  isMoving ? 'bg-lumis-golden/20' : 'bg-lumis-twilight/50'
                }`}
              >
                <Footprints size={24} color={isMoving ? '#FFB347' : '#FFB34760'} strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-lumis-dawn"
                  style={{ fontFamily: 'Outfit_600SemiBold' }}
                >
                  Movement
                </Text>
                <Text
                  className="text-lumis-sunrise/60"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  {stepCount} steps {isMoving ? '(Moving)' : '(Stationary)'}
                </Text>
              </View>
              {isMoving ? (
                <Check size={20} color="#4ADE80" strokeWidth={2.5} />
              ) : (
                <AlertCircle size={20} color="#FFB347" strokeWidth={2} />
              )}
            </View>

            {/* Status message */}
            <View
              className={`rounded-2xl p-4 ${
                isEarning ? 'bg-lumis-golden/10 border border-lumis-golden/30' : 'bg-lumis-twilight/30 border border-lumis-dusk/30'
              }`}
            >
              <Text
                className={`text-center ${isEarning ? 'text-lumis-golden' : 'text-lumis-sunrise/60'}`}
                style={{ fontFamily: 'Outfit_500Medium' }}
              >
                {isEarning
                  ? 'Keep walking in the light to earn credits!'
                  : !isOutdoors
                    ? 'Move to a brighter outdoor area'
                    : 'Start walking to earn light credits'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
