import React, { useEffect } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
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
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Sun, AlertTriangle, X } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';

const { width, height } = Dimensions.get('window');

export default function ShieldScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const todayProgress = useLumisStore((s) => s.todayProgress);
  const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);
  const triggerEmergencyUnlock = useLumisStore((s) => s.useEmergencyUnlock);
  const emergencyUnlockUsedToday = useLumisStore((s) => s.emergencyUnlockUsedToday);

  const pulse = useSharedValue(1);
  const glow = useSharedValue(0);
  const rays = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const [showEmergency, setShowEmergency] = React.useState(false);

  const progress = todayProgress.lightMinutes / dailyGoalMinutes;
  const minutesRemaining = Math.max(0, dailyGoalMinutes - todayProgress.lightMinutes);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    rays.value = withRepeat(
      withTiming(360, { duration: 80000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.3, 0.6]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.15]) }],
  }));

  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rays.value}deg` }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleGoOutside = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  const rayElements = Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#1A1A2E', '#0F3460', '#16213E', '#1A1A2E']}
        locations={[0, 0.4, 0.7, 1]}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 items-center justify-between px-8"
          style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 }}
        >
          {/* Close button */}
          <View className="w-full flex-row justify-end">
            <Pressable
              onPress={handleClose}
              className="w-10 h-10 rounded-full bg-lumis-twilight/50 items-center justify-center"
            >
              <X size={20} color="#FFB347" strokeWidth={2} />
            </Pressable>
          </View>

          {/* Sun Animation */}
          <View className="items-center">
            {/* Outer glow */}
            <Animated.View
              style={[
                glowStyle,
                {
                  position: 'absolute',
                  width: 280,
                  height: 280,
                  borderRadius: 140,
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255, 179, 71, 0.4)', 'rgba(255, 107, 53, 0.15)', 'transparent']}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 140,
                }}
              />
            </Animated.View>

            {/* Rays */}
            <Animated.View
              style={[
                raysStyle,
                {
                  position: 'absolute',
                  width: 320,
                  height: 320,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              {rayElements.map((angle) => (
                <View
                  key={angle}
                  style={{
                    position: 'absolute',
                    width: 3,
                    height: 35,
                    backgroundColor: '#FFB347',
                    borderRadius: 2,
                    transform: [{ rotate: `${angle}deg` }, { translateY: -135 }],
                    opacity: 0.4,
                  }}
                />
              ))}
            </Animated.View>

            {/* Core sun */}
            <Animated.View style={pulseStyle}>
              <LinearGradient
                colors={['#FFE4B5', '#FFB347', '#FF8C00', '#FF6B35']}
                start={{ x: 0.3, y: 0 }}
                end={{ x: 0.7, y: 1 }}
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#FF8C00',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 40,
                  elevation: 20,
                }}
              >
                <Sun size={72} color="#1A1A2E" strokeWidth={1.5} />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Text content */}
          <Animated.View entering={FadeIn.delay(300).duration(600)} className="items-center">
            <Text
              className="text-4xl text-lumis-dawn text-center mb-4"
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              Earn Your Scroll
            </Text>
            <Text
              className="text-lg text-lumis-sunrise/70 text-center mb-8"
              style={{ fontFamily: 'Outfit_400Regular' }}
            >
              Step into the light to unlock your apps.{'\n'}
              {minutesRemaining.toFixed(1)} minutes of sunlight to go.
            </Text>

            {/* Progress indicator */}
            <View className="bg-lumis-twilight/40 rounded-2xl px-6 py-4 mb-8">
              <View className="flex-row items-center">
                <View className="flex-1 h-2 bg-lumis-dusk rounded-full mr-4">
                  <View
                    className="h-full bg-lumis-golden rounded-full"
                    style={{ width: `${Math.min(progress * 100, 100)}%` }}
                  />
                </View>
                <Text
                  className="text-lumis-golden"
                  style={{ fontFamily: 'Outfit_600SemiBold' }}
                >
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Actions */}
          <View className="w-full">
            {/* Main CTA */}
            <Animated.View style={buttonAnimStyle}>
              <Pressable
                onPress={handleGoOutside}
                onPressIn={() => {
                  buttonScale.value = withSpring(0.95);
                }}
                onPressOut={() => {
                  buttonScale.value = withSpring(1);
                }}
                className="w-full mb-4"
              >
                <LinearGradient
                  colors={['#FFB347', '#FF8C00', '#FF6B35']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 18,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#FF8C00',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 16,
                    elevation: 8,
                  }}
                >
                  <Sun size={22} color="#1A1A2E" strokeWidth={2} />
                  <Text
                    className="text-lumis-night text-lg ml-2"
                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                  >
                    Go Outside Now
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Emergency unlock */}
            {!emergencyUnlockUsedToday && !showEmergency && (
              <Pressable
                onPress={() => setShowEmergency(true)}
                className="py-3"
              >
                <Text
                  className="text-lumis-sunrise/40 text-center text-sm"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  Need emergency access?
                </Text>
              </Pressable>
            )}

            {showEmergency && !emergencyUnlockUsedToday && (
              <Animated.View entering={FadeIn.duration(300)} className="mt-4">
                <View className="bg-lumis-deep/20 border border-lumis-deep/40 rounded-2xl p-4 mb-4">
                  <View className="flex-row items-center mb-2">
                    <AlertTriangle size={18} color="#DC2F02" strokeWidth={2} />
                    <Text
                      className="text-lumis-deep ml-2"
                      style={{ fontFamily: 'Outfit_600SemiBold' }}
                    >
                      This will break your streak
                    </Text>
                  </View>
                  <Text
                    className="text-lumis-sunrise/60 text-sm"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    Emergency unlock gives you 15 minutes of access but resets your current streak.
                  </Text>
                </View>
                <Pressable
                  onPress={handleEmergencyUnlock}
                  className="bg-lumis-twilight/50 border border-lumis-dusk rounded-xl py-3"
                >
                  <Text
                    className="text-lumis-sunrise/70 text-center"
                    style={{ fontFamily: 'Outfit_500Medium' }}
                  >
                    Emergency Unlock (15 min)
                  </Text>
                </Pressable>
              </Animated.View>
            )}

            {emergencyUnlockUsedToday && (
              <Text
                className="text-lumis-sunrise/30 text-center text-sm mt-4"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Emergency unlock already used today
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
