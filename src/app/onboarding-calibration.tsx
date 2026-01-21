import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import LuxSensor from 'expo-lux-sensor';
import { useAuthStore } from '@/lib/state/auth-store';
import { Sun, ArrowRight, Sparkles, Activity } from 'lucide-react-native';
import Svg, { Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');
const RING_SIZE = 260;

export default function OnboardingCalibrationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSensorCalibration = useAuthStore((s) => s.setSensorCalibration);

  const [lightLevel, setLightLevel] = useState(0);
  const [peakLight, setPeakLight] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [hasDetectedLight, setHasDetectedLight] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const ringProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
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
          if (lux > peakLight) setPeakLight(lux);

          // Progress towards "good light" threshold (500 lux = 100%)
          const progress = Math.min(lux / 500, 1);
          ringProgress.value = withTiming(progress, { duration: 200 });

          // Haptic tick for high light
          if (lux > 200 && lux % 50 < 10) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      });
    } catch (e) {
      console.error('Sensor error:', e);
    }
  };

  useEffect(() => {
    startSensor();
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => {
      if (subscriptionRef.current) subscriptionRef.current.remove();
      LuxSensor.stopAsync().catch(() => { });
    };
  }, []);

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
    setSensorCalibration({ light: peakLight || lightLevel || 500, timestamp: Date.now() });
    setShowComplete(true);
    LuxSensor.stopAsync().catch(() => { });
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/app-selection');
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => {
    const circumference = 2 * Math.PI * (RING_SIZE / 2 - 12);
    return {
      strokeDashoffset: circumference * (1 - ringProgress.value),
    };
  });

  const getIntensityLabel = () => {
    if (lightLevel < 50) return 'Low';
    if (lightLevel < 200) return 'Indoor';
    if (lightLevel < 500) return 'Bright';
    return 'Sunlight';
  };

  const getIntensityColor = () => {
    if (lightLevel < 50) return '#6366F1';
    if (lightLevel < 200) return '#FFB347';
    if (lightLevel < 500) return '#FF8C00';
    return '#4ADE80';
  };

  return (
    <View className="flex-1">
      <LinearGradient colors={['#0F0F1E', '#1A1A2E', '#0F0F1E']} style={{ flex: 1 }}>
        <View
          className="flex-1 px-8 items-center justify-between"
          style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }}
        >
          {/* Header */}
          <Animated.View entering={FadeIn} className="items-center w-full">
            <View className="flex-row items-center bg-white/5 px-4 py-2 rounded-full border border-white/10 mb-6">
              <Activity size={14} color="#FFB347" />
              <Text className="text-lumis-golden text-[10px] font-black ml-2 uppercase tracking-widest">Sensor Check</Text>
            </View>
            <Text className="text-3xl text-lumis-dawn text-center leading-tight" style={{ fontFamily: 'Outfit_700Bold' }}>
              Tuning Into{'\n'}Your Light
            </Text>
            <Text className="text-lumis-sunrise/50 text-sm text-center mt-3 px-4">
              Point your phone's camera towards a light source for best results.
            </Text>
          </Animated.View>

          {/* Main Visual */}
          <View className="items-center justify-center">
            {showComplete ? (
              <Animated.View entering={FadeInDown} className="items-center">
                <View className="bg-green-500/10 p-10 rounded-full mb-6 border border-green-500/20">
                  <Sparkles size={60} color="#4ADE80" />
                </View>
                <Text className="text-3xl text-lumis-dawn font-black mb-2">Synced</Text>
                <Text className="text-lumis-sunrise/50 text-center">Your sensor is calibrated to your environment.</Text>
              </Animated.View>
            ) : (
              <Animated.View style={pulseStyle} className="items-center justify-center">
                <Svg width={RING_SIZE} height={RING_SIZE}>
                  <Defs>
                    <RadialGradient id="luxGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                      <Stop offset="0%" stopColor={getIntensityColor()} stopOpacity="0.3" />
                      <Stop offset="100%" stopColor={getIntensityColor()} stopOpacity="0" />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_SIZE / 2 - 20} fill="url(#luxGlow)" />
                  <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_SIZE / 2 - 12} stroke="#FFFFFF" strokeWidth={4} fill="transparent" opacity={0.05} />
                  <G transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}>
                    <Circle
                      cx={RING_SIZE / 2}
                      cy={RING_SIZE / 2}
                      r={RING_SIZE / 2 - 12}
                      stroke={getIntensityColor()}
                      strokeWidth={6}
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * (RING_SIZE / 2 - 12)}
                      strokeDashoffset={2 * Math.PI * (RING_SIZE / 2 - 12) * (1 - Math.min(lightLevel / 500, 1))}
                      strokeLinecap="round"
                    />
                  </G>
                </Svg>
                <View className="absolute items-center justify-center">
                  <Text className="text-7xl text-lumis-dawn" style={{ fontFamily: 'Syne_800ExtraBold' }}>{lightLevel}</Text>
                  <Text className="text-lumis-sunrise/40 text-xs uppercase font-black tracking-widest mt-1">LUX</Text>
                  <View className="mt-4 px-4 py-1.5 rounded-full" style={{ backgroundColor: getIntensityColor() + '20' }}>
                    <Text style={{ color: getIntensityColor() }} className="text-xs font-black uppercase tracking-widest">{getIntensityLabel()}</Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </View>

          {/* Footer */}
          <View className="w-full items-center">
            {showComplete ? (
              <Pressable onPress={handleContinue} className="w-full">
                <LinearGradient colors={['#FFB347', '#FF8C00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Text className="text-lumis-night text-lg font-black uppercase tracking-widest mr-2">Continue</Text>
                  <ArrowRight size={20} color="#1A1A2E" strokeWidth={3} />
                </LinearGradient>
              </Pressable>
            ) : (
              <View className="items-center">
                <Text className="text-lumis-sunrise/30 text-sm font-bold">{hasDetectedLight ? `Completing in ${countdown}s...` : `Detecting light... ${countdown}s`}</Text>
                <Pressable onPress={completeCalibration} className="mt-4 opacity-50">
                  <Text className="text-white/40 text-xs uppercase tracking-widest">Skip for now</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
