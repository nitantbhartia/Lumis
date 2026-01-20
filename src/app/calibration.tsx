import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
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
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Home, Sun, Check, ChevronRight } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';

// Import sensors with platform check
let LightSensor: any;
if (Platform !== undefined && Platform.OS !== 'web') {
  try {
    const sensors = require('expo-sensors');
    LightSensor = sensors.LightSensor;
  } catch (error) {
    console.error('Failed to load sensors:', error);
  }
}

// Provide mock subscription for web
const createMockSubscription = () => ({ remove: () => { } });
const LightSensorMock = {
  isAvailableAsync: async () => false,
  addListener: () => createMockSubscription(),
  setUpdateInterval: () => { },
};

// Use mock if sensor not loaded
const useLightSensor = LightSensor || LightSensorMock;

type CalibrationStep = 'indoor' | 'outdoor' | 'complete';

export default function CalibrationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setCalibration = useLumisStore((s) => s.setCalibration);

  const [step, setStep] = useState<CalibrationStep>('indoor');
  const [indoorLux, setIndoorLux] = useState<number | null>(null);
  const [outdoorLux, setOutdoorLux] = useState<number | null>(null);
  const [currentLux, setCurrentLux] = useState<number>(0);
  const [isReading, setIsReading] = useState(false);
  const [sensorAvailable, setSensorAvailable] = useState(true);

  const pulseScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Check sensor availability
    const checkSensor = async () => {
      const available = await useLightSensor.isAvailableAsync();
      setSensorAvailable(available);
      if (!available && Platform.OS === 'ios') {
        // iOS doesn't have ambient light sensor API - use simulated values
        setSensorAvailable(false);
      }
    };
    checkSensor();
  }, []);

  useEffect(() => {
    if (isReading && sensorAvailable) {
      const subscription = useLightSensor.addListener((data: any) => {
        const rawValue = typeof data === 'number' ? data : (data?.illuminance ?? 0);
        const lux = Math.round(Number(rawValue) || 0);
        setCurrentLux(lux);
      });
      useLightSensor.setUpdateInterval(100);
      return () => subscription.remove();
    }
  }, [isReading, sensorAvailable]);

  useEffect(() => {
    if (isReading) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [isReading]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleStartReading = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsReading(true);

    // If sensor not available, simulate readings
    if (!sensorAvailable) {
      const simulatedLux = step === 'indoor' ? 100 + Math.random() * 200 : 10000 + Math.random() * 30000;
      setCurrentLux(Math.round(simulatedLux));
    }

    // Auto-capture after 3 seconds
    setTimeout(() => {
      setIsReading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const finalLux = sensorAvailable ? currentLux : (step === 'indoor' ? 150 : 20000);

      if (step === 'indoor') {
        setIndoorLux(finalLux);
        setStep('outdoor');
      } else if (step === 'outdoor') {
        setOutdoorLux(finalLux);
        setStep('complete');

        // Save calibration
        setCalibration({
          indoorLux: indoorLux ?? 150,
          outdoorLux: finalLux,
          isCalibrated: true,
        });
      }
    }, 3000);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/app-selection');
  };

  const renderStepContent = () => {
    switch (step) {
      case 'indoor':
        return (
          <>
            <Animated.View style={pulseStyle} className="mb-8">
              <View
                className="w-32 h-32 rounded-full bg-lumis-twilight items-center justify-center"
                style={{
                  shadowColor: '#FFB347',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isReading ? 0.6 : 0.2,
                  shadowRadius: isReading ? 30 : 10,
                }}
              >
                <Home size={56} color="#FFB347" strokeWidth={1.5} />
              </View>
            </Animated.View>
            <Text
              className="text-3xl text-lumis-dawn text-center mb-4"
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              Indoor Calibration
            </Text>
            <Text
              className="text-base text-lumis-sunrise/70 text-center mb-8 px-4"
              style={{ fontFamily: 'Outfit_400Regular' }}
            >
              Stand in the center of your room, away from windows. Hold your phone at chest level.
            </Text>
          </>
        );

      case 'outdoor':
        return (
          <>
            <Animated.View style={pulseStyle} className="mb-8">
              <View
                className="w-32 h-32 rounded-full bg-lumis-dusk items-center justify-center"
                style={{
                  shadowColor: '#FFB347',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isReading ? 0.8 : 0.3,
                  shadowRadius: isReading ? 40 : 15,
                }}
              >
                <Sun size={56} color="#FFB347" strokeWidth={1.5} />
              </View>
            </Animated.View>
            <Text
              className="text-3xl text-lumis-dawn text-center mb-4"
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              Outdoor Calibration
            </Text>
            <Text
              className="text-base text-lumis-sunrise/70 text-center mb-8 px-4"
              style={{ fontFamily: 'Outfit_400Regular' }}
            >
              Step outside into natural light. No need for direct sunlight - just be outdoors.
            </Text>
          </>
        );

      case 'complete':
        return (
          <>
            <Animated.View entering={FadeIn.duration(600)} className="mb-8">
              <View
                className="w-32 h-32 rounded-full bg-lumis-golden/20 items-center justify-center"
                style={{
                  shadowColor: '#FFB347',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 30,
                }}
              >
                <Check size={56} color="#FFB347" strokeWidth={2} />
              </View>
            </Animated.View>
            <Text
              className="text-3xl text-lumis-dawn text-center mb-4"
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              Calibration Complete
            </Text>
            <Text
              className="text-base text-lumis-sunrise/70 text-center mb-8 px-4"
              style={{ fontFamily: 'Outfit_400Regular' }}
            >
              Perfect! We can now detect when you're getting natural light.
            </Text>

            {/* Calibration results */}
            <View className="bg-lumis-twilight/50 rounded-2xl p-6 w-full">
              <View className="flex-row justify-between mb-4">
                <Text
                  className="text-lumis-sunrise/60"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  Indoor baseline
                </Text>
                <Text className="text-lumis-dawn" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                  {indoorLux} lux
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text
                  className="text-lumis-sunrise/60"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  Outdoor target
                </Text>
                <Text className="text-lumis-golden" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                  {outdoorLux} lux
                </Text>
              </View>
            </View>
          </>
        );
    }
  };

  return (
    <View className="flex-1">
      <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={{ flex: 1 }}>
        <View
          className="flex-1 px-8"
          style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }}
        >
          {/* Progress indicator */}
          <View className="flex-row justify-center mb-12">
            {['indoor', 'outdoor', 'complete'].map((s, index) => (
              <View key={s} className="flex-row items-center">
                <View
                  className={`w-3 h-3 rounded-full ${step === s
                      ? 'bg-lumis-golden'
                      : ['indoor', 'outdoor', 'complete'].indexOf(step) > index
                        ? 'bg-lumis-golden/60'
                        : 'bg-lumis-dusk'
                    }`}
                />
                {index < 2 && (
                  <View
                    className={`w-16 h-0.5 ${['indoor', 'outdoor', 'complete'].indexOf(step) > index
                        ? 'bg-lumis-golden/60'
                        : 'bg-lumis-dusk'
                      }`}
                  />
                )}
              </View>
            ))}
          </View>

          {/* Content */}
          <View className="flex-1 items-center justify-center">{renderStepContent()}</View>

          {/* Lux reading display */}
          {isReading && (
            <Animated.View entering={FadeIn} className="items-center mb-8">
              <Text
                className="text-6xl text-lumis-golden"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                {currentLux}
              </Text>
              <Text
                className="text-lumis-sunrise/60 mt-2"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                lux detected
              </Text>
            </Animated.View>
          )}

          {/* Action button */}
          <Animated.View style={buttonAnimStyle}>
            <Pressable
              onPress={step === 'complete' ? handleContinue : handleStartReading}
              onPressIn={() => {
                buttonScale.value = withSpring(0.95);
              }}
              onPressOut={() => {
                buttonScale.value = withSpring(1);
              }}
              disabled={isReading}
              className="w-full"
            >
              <LinearGradient
                colors={
                  isReading
                    ? ['#16213E', '#0F3460', '#16213E']
                    : ['#FFB347', '#FF8C00', '#FF6B35']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 18,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: isReading ? 'transparent' : '#FF8C00',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Text
                  className={`text-lg mr-2 ${isReading ? 'text-lumis-sunrise/60' : 'text-lumis-night'}`}
                  style={{ fontFamily: 'Outfit_600SemiBold' }}
                >
                  {isReading
                    ? 'Reading...'
                    : step === 'complete'
                      ? 'Select Apps to Block'
                      : 'Start Reading'}
                </Text>
                {!isReading && <ChevronRight size={20} color="#1A1A2E" strokeWidth={2.5} />}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {!sensorAvailable && step !== 'complete' && (
            <Text
              className="text-lumis-sunrise/40 text-center mt-4 text-sm"
              style={{ fontFamily: 'Outfit_400Regular' }}
            >
              Light sensor not available - using estimated values
            </Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}
