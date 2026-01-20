import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LightSensor } from 'expo-sensors';
import { useAuthStore } from '@/lib/state/auth-store';
import { ArrowUp } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function OnboardingCalibrationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSensorCalibration = useAuthStore((s) => s.setSensorCalibration);

  const [lightLevel, setLightLevel] = useState(0);
  const [maxLight, setMaxLight] = useState(0);
  const [isScanning, setIsScanning] = useState(true);
  const [showComplete, setShowComplete] = useState(false);

  const barWidth = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    // Set update interval
    LightSensor.setUpdateInterval(100);

    // Subscribe to sensor
    const subscription = LightSensor.addListener((data) => {
      const lux = Math.round(data.illuminance);
      setLightLevel(lux);

      if (lux > maxLight) {
        setMaxLight(lux);
        barWidth.value = withTiming(Math.min(lux / 100, width - 48), {
          duration: 300,
          easing: Easing.out(Easing.ease),
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [maxLight]);

  // Auto-complete when sufficient light detected
  useEffect(() => {
    if (lightLevel > 5000 && isScanning) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsScanning(false);
      setSensorCalibration({ light: lightLevel, timestamp: Date.now() });
      setShowComplete(true);

      setTimeout(() => {
        router.push('/onboarding-auth');
      }, 1500);
    }
  }, [lightLevel]);

  const barStyle = useAnimatedStyle(() => ({
    width: barWidth.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  useEffect(() => {
    if (isScanning) {
      pulseOpacity.value = withTiming(0.5, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [isScanning]);

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 px-6"
          style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }}
        >
          {/* Header */}
          <View className="mb-12">
            <Text
              className="text-5xl text-lumis-dawn"
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              Let's check{'\n'}your light
            </Text>
          </View>

          {/* Instruction */}
          <View className="mb-16">
            <Text
              className="text-lg text-lumis-sunrise"
              style={{ fontFamily: 'Outfit_400Regular' }}
            >
              Point your phone at a window or light source
            </Text>
          </View>

          {/* Light Visualization */}
          <View className="flex-1 items-center justify-center gap-8 mb-16">
            {/* Progress Bar */}
            <View className="w-full gap-4">
              <Text
                className="text-lumis-golden text-center"
                style={{ fontFamily: 'Outfit_600SemiBold' }}
              >
                {lightLevel} lux
              </Text>

              {/* Bar Container */}
              <View
                className="w-full h-12 rounded-full overflow-hidden"
                style={{ backgroundColor: '#16213E' }}
              >
                <Animated.View
                  style={[
                    barStyle,
                    {
                      height: '100%',
                      borderRadius: 24,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#FFB347', '#FF8C00', '#FF6B35']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1 }}
                  />
                </Animated.View>
              </View>
            </View>

            {/* Light Icon Animation */}
            <Animated.View style={[pulseStyle, { marginVertical: 40 }]}>
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: '#FF8C00' + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: '#FFB347' + '30',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#FFB347',
                    }}
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Status Message */}
          {showComplete ? (
            <View className="mb-8 items-center">
              <Text
                className="text-2xl text-lumis-golden text-center"
                style={{ fontFamily: 'Outfit_600SemiBold' }}
              >
                ✓ Calibration Complete!
              </Text>
            </View>
          ) : (
            <View className="mb-8 items-center gap-2">
              <ArrowUp size={24} color="#FFB347" strokeWidth={2} />
              <Text
                className="text-lumis-sunrise text-center"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Need more light: {5000 - lightLevel} lux
              </Text>
            </View>
          )}

          {/* Skip Button */}
          {!showComplete && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSensorCalibration({ light: maxLight || 1000, timestamp: Date.now() });
                router.push('/onboarding-auth');
              }}
            >
              <Text
                className="text-lumis-sunrise text-center text-base"
                style={{ fontFamily: 'Outfit_500Medium' }}
              >
                Skip for now
              </Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}
