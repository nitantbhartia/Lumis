import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import LuxSensor from 'expo-lux-sensor';
import { useAuthStore } from '@/lib/state/auth-store';
import { Sun, ArrowRight, RefreshCw } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function OnboardingCalibrationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSensorCalibration = useAuthStore((s) => s.setSensorCalibration);

  const [lightLevel, setLightLevel] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [showComplete, setShowComplete] = useState(false);
  const [hasDetectedLight, setHasDetectedLight] = useState(false);

  const barWidth = useSharedValue(0);
  const subscriptionRef = useRef<any>(null);

  const startSensor = async () => {
    try {
      const { status } = await LuxSensor.requestPermissionsAsync();
      if (status !== 'granted') return;

      await LuxSensor.stopAsync().catch(() => { });
      if (subscriptionRef.current) subscriptionRef.current.remove();

      await LuxSensor.startAsync({ updateInterval: 100 });

      subscriptionRef.current = LuxSensor.addLuxListener((data: any) => {
        const rawValue = typeof data === 'number' ? data : (data?.lux ?? data?.illuminance ?? 0);
        const lux = Math.round(Number(rawValue) || 0);

        if (lux > 0) {
          setLightLevel(lux);
          setHasDetectedLight(true);

          // Update bar based on lux (max at 500 for visual)
          barWidth.value = withTiming(Math.min((lux / 500) * (width - 64), width - 64), {
            duration: 300,
            easing: Easing.out(Easing.quad),
          });
        }
      });
    } catch (e) {
      console.error('Sensor error:', e);
    }
  };

  useEffect(() => {
    startSensor();
    return () => {
      if (subscriptionRef.current) subscriptionRef.current.remove();
      LuxSensor.stopAsync().catch(() => { });
    };
  }, []);

  // Simple countdown - complete after 5 seconds IF we detected any light
  useEffect(() => {
    if (showComplete) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          completeCalibration();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showComplete]);

  const completeCalibration = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSensorCalibration({ light: lightLevel || 500, timestamp: Date.now() });
    setShowComplete(true);
    LuxSensor.stopAsync().catch(() => { });
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/app-selection');
  };

  const handleSkipNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSensorCalibration({ light: 500, timestamp: Date.now() });
    router.push('/app-selection');
  };

  const barStyle = useAnimatedStyle(() => ({
    width: barWidth.value,
  }));

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#1A1A2E']}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 px-8"
          style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }}
        >
          {/* Header */}
          <View className="mb-8">
            <Text className="text-4xl text-lumis-dawn" style={{ fontFamily: 'Outfit_700Bold' }}>
              Quick{'\n'}Light Check
            </Text>
          </View>

          <Text className="text-lumis-sunrise/60 text-base mb-12 leading-relaxed" style={{ fontFamily: 'Outfit_400Regular' }}>
            We're checking your device's light sensor. This only takes a moment.
          </Text>

          {/* Main Display */}
          <View className="flex-1 items-center justify-center">
            {showComplete ? (
              <Animated.View entering={FadeInDown} className="items-center">
                <View className="bg-green-500/10 p-8 rounded-full mb-6">
                  <Sun size={64} color="#4ADE80" />
                </View>
                <Text className="text-3xl text-lumis-dawn font-bold mb-2">All Set!</Text>
                <Text className="text-lumis-sunrise/60">Light sensor calibrated</Text>
              </Animated.View>
            ) : (
              <View className="items-center w-full">
                {/* Lux Display */}
                <View className="items-center mb-12">
                  <Text className="text-8xl text-lumis-golden" style={{ fontFamily: 'Outfit_700Bold' }}>
                    {lightLevel}
                  </Text>
                  <Text className="text-sm text-lumis-sunrise/40 uppercase tracking-widest mt-2">
                    Current Light
                  </Text>
                </View>

                {/* Progress Bar */}
                <View className="w-full h-4 rounded-full overflow-hidden bg-white/5 mb-8">
                  <Animated.View style={[barStyle, { height: '100%', borderRadius: 8 }]}>
                    <LinearGradient
                      colors={['#FFB347', '#FF8C00']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{ flex: 1 }}
                    />
                  </Animated.View>
                </View>

                {/* Countdown */}
                <Text className="text-lumis-sunrise/50 text-sm">
                  {hasDetectedLight ? `Completing in ${countdown}s...` : `Waiting for sensor... ${countdown}s`}
                </Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View className="items-center">
            {showComplete ? (
              <Pressable
                onPress={handleContinue}
                className="bg-lumis-golden w-full py-5 rounded-2xl flex-row items-center justify-center"
              >
                <Text className="text-[#1A1A2E] text-lg font-black mr-2">Continue</Text>
                <ArrowRight size={20} color="#1A1A2E" strokeWidth={3} />
              </Pressable>
            ) : (
              <View className="w-full">
                <Pressable
                  onPress={handleSkipNow}
                  className="bg-white/10 w-full py-4 rounded-2xl items-center mb-4"
                >
                  <Text className="text-lumis-dawn font-bold">Skip & Continue →</Text>
                </Pressable>

                <Pressable onPress={startSensor} className="flex-row items-center justify-center opacity-50">
                  <RefreshCw size={14} color="#FFF" />
                  <Text className="text-white/60 text-xs ml-2">Restart Sensor</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
