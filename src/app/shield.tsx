import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  interpolate,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Sun, AlertTriangle, X, Shield, Lock, ArrowRight, Zap } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function ShieldScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const todayProgress = useLumisStore((s) => s.todayProgress);
  const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);
  const triggerEmergencyUnlock = useLumisStore((s) => s.useEmergencyUnlock);
  const emergencyUnlockUsedToday = useLumisStore((s) => s.emergencyUnlockUsedToday);

  const pulse = useSharedValue(1);
  const glow = useSharedValue(0);
  const raysRotate = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const [showEmergency, setShowEmergency] = useState(false);

  const progress = todayProgress.lightMinutes / dailyGoalMinutes;
  const minutesRemaining = Math.max(0, dailyGoalMinutes - todayProgress.lightMinutes);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    raysRotate.value = withRepeat(
      withTiming(360, { duration: 120000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.15, 0.45]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.4]) }],
  }));

  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${raysRotate.value}deg` }],
  }));

  const handleGoOutside = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.replace('/tracking');
  };

  const handleEmergencyUnlock = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    triggerEmergencyUnlock();
    router.back();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#0F0F1E', '#1A1A2E', '#0F0F1E']}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 items-center justify-between px-8"
          style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }}
        >
          {/* Top Bar */}
          <View className="w-full flex-row justify-between items-center">
            <View className="flex-row items-center bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <Shield size={14} color="#FFB347" strokeWidth={2.5} />
              <Text className="text-lumis-golden text-[10px] font-bold ml-1.5 uppercase tracking-widest">Active Shield</Text>
            </View>
            <Pressable
              onPress={handleClose}
              className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/10"
            >
              <X size={20} color="#FFFFFF" opacity={0.5} />
            </Pressable>
          </View>

          {/* Core Visual System (Opal Inspired) */}
          <View className="items-center justify-center w-full">
            <Animated.View
              style={[
                glowStyle,
                {
                  position: 'absolute',
                  width: width * 0.7,
                  height: width * 0.7,
                  borderRadius: width * 0.35,
                  backgroundColor: '#FFB347',
                  shadowColor: '#FFB347',
                  shadowRadius: 100,
                  shadowOpacity: 0.6,
                },
              ]}
            />

            <Animated.View style={raysStyle} className="absolute">
              {[...Array(30)].map((_, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    width: 2,
                    height: 140,
                    backgroundColor: '#FFB347',
                    opacity: 0.1,
                    transform: [{ rotate: `${i * 12}deg` }, { translateY: -160 }],
                  }}
                />
              ))}
            </Animated.View>

            <Animated.View style={pulseStyle}>
              <View className="w-56 h-56 rounded-full items-center justify-center overflow-hidden border border-white/20">
                <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={['rgba(255,179,71,0.2)', 'rgba(0,0,0,0.4)']}
                  style={StyleSheet.absoluteFill}
                />
                <Lock size={60} color="#FFB347" strokeWidth={1} />
              </View>
            </Animated.View>
          </View>

          {/* Content Section */}
          <View className="w-full items-center">
            <Animated.View entering={FadeInDown.delay(300)} className="items-center mb-10 text-center">
              <Text
                className="text-4xl text-lumis-dawn text-center leading-tight"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                Focusing on{'\n'}Your Biology
              </Text>
              <Text
                className="text-lg text-lumis-sunrise/60 text-center mt-4 leading-relaxed px-6"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Your digital world is on hold while we prioritize your morning light window.
              </Text>
            </Animated.View>

            {/* Progress Visualization */}
            <View className="w-full bg-white/5 rounded-[40px] p-8 border border-white/10 overflow-hidden">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <Sun size={20} color="#FFB347" strokeWidth={2} />
                  <Text className="text-lumis-dawn text-sm font-bold ml-2">Progress</Text>
                </View>
                <Text className="text-lumis-golden text-sm font-black">{Math.round(progress * 100)}%</Text>
              </View>

              <View className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                <LinearGradient
                  colors={['#FFB347', '#FF6B35']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: '100%',
                    width: `${Math.min(progress * 100, 100)}%`,
                  }}
                />
              </View>

              <Text className="text-lumis-sunrise/40 text-center text-xs mt-4 uppercase tracking-widest font-bold">
                {minutesRemaining.toFixed(0)} Minutes to Harmony
              </Text>
            </View>
          </View>

          {/* Action Footer */}
          <View className="w-full gap-4">
            <Animated.View entering={FadeInDown.delay(500)}>
              <Pressable
                onPress={handleGoOutside}
                onPressIn={() => { buttonScale.value = withSpring(0.96); }}
                onPressOut={() => { buttonScale.value = withSpring(1); }}
                className="w-full"
              >
                <Animated.View style={{ transform: [{ scale: buttonScale.value }] }}>
                  <LinearGradient
                    colors={['#FFB347', '#FF8C00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 22,
                      borderRadius: 24,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#FFB347',
                      shadowOffset: { width: 0, height: 10 },
                      shadowOpacity: 0.3,
                      shadowRadius: 20,
                    }}
                  >
                    <Zap size={20} color="#1A1A2E" strokeWidth={3} fill="#1A1A2E" />
                    <Text
                      className="text-lumis-night text-lg font-black uppercase tracking-widest ml-3"
                      style={{ fontFamily: 'Outfit_700Bold' }}
                    >
                      Step Outside
                    </Text>
                  </LinearGradient>
                </Animated.View>
              </Pressable>
            </Animated.View>

            <Pressable
              onPress={() => setShowEmergency(true)}
              className="py-2 opacity-30 active:opacity-100"
            >
              <Text className="text-white text-center text-xs uppercase tracking-[0.2em] font-bold">
                Emergency Override
              </Text>
            </Pressable>

            {showEmergency && !emergencyUnlockUsedToday && (
              <Animated.View entering={FadeIn.duration(400)} className="items-center mt-2">
                <View className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl w-full flex-row items-center mb-4">
                  <AlertTriangle size={18} color="#EF4444" />
                  <Text className="text-red-400 text-xs ml-3 font-bold">Unlock will reset your streak instantly.</Text>
                </View>
                <Pressable onPress={handleEmergencyUnlock} className="bg-white/5 py-4 px-8 rounded-2xl border border-white/10 w-full">
                  <Text className="text-white text-center font-bold">I understand, override shield</Text>
                </Pressable>
              </Animated.View>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
