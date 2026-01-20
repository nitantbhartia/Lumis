import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Sun, Flame, Unlock, PartyPopper } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';

export default function VictoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const currentStreak = useLumisStore((s) => s.currentStreak);
  const todayProgress = useLumisStore((s) => s.todayProgress);

  const sunScale = useSharedValue(0);
  const sunRotate = useSharedValue(0);
  const glow = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Trigger haptic celebration
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate sun entrance
    sunScale.value = withDelay(
      200,
      withSpring(1, { damping: 8, stiffness: 100 })
    );

    // Sun rotation
    sunRotate.value = withRepeat(
      withTiming(360, { duration: 40000, easing: Easing.linear }),
      -1,
      false
    );

    // Glow animation
    glow.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Confetti fade in
    confettiOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));

    // Celebration haptics
    const hapticInterval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 500);

    setTimeout(() => clearInterval(hapticInterval), 3000);

    return () => clearInterval(hapticInterval);
  }, []);

  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sunScale.value }, { rotate: `${sunRotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.3, 0.7]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.2]) }],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/dashboard');
  };

  // Generate confetti particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1000,
    color: ['#FFB347', '#FF8C00', '#FF6B35', '#FFE4B5', '#4ADE80'][
      Math.floor(Math.random() * 5)
    ],
  }));

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#1A1A2E', '#0F3460', '#16213E', '#1A1A2E']}
        locations={[0, 0.3, 0.6, 1]}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 items-center justify-between px-8"
          style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30 }}
        >
          {/* Confetti */}
          <Animated.View
            style={[confettiStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}
          >
            {particles.map((particle) => (
              <Animated.View
                key={particle.id}
                entering={FadeInDown.delay(particle.delay).duration(2000)}
                style={{
                  position: 'absolute',
                  left: `${particle.x}%`,
                  top: `${Math.random() * 40}%`,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: particle.color,
                  opacity: 0.6,
                }}
              />
            ))}
          </Animated.View>

          {/* Header */}
          <View className="items-center">
            <PartyPopper size={32} color="#FFB347" strokeWidth={1.5} />
          </View>

          {/* Sun Animation */}
          <View className="items-center">
            {/* Outer glow */}
            <Animated.View
              style={[
                glowStyle,
                {
                  position: 'absolute',
                  width: 320,
                  height: 320,
                  borderRadius: 160,
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255, 179, 71, 0.5)', 'rgba(255, 107, 53, 0.2)', 'transparent']}
                style={{ width: '100%', height: '100%', borderRadius: 160 }}
              />
            </Animated.View>

            {/* Sun */}
            <Animated.View style={sunStyle}>
              <LinearGradient
                colors={['#FFE4B5', '#FFB347', '#FF8C00', '#FF6B35']}
                start={{ x: 0.3, y: 0 }}
                end={{ x: 0.7, y: 1 }}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#FF8C00',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 50,
                  elevation: 20,
                }}
              >
                <Sun size={80} color="#1A1A2E" strokeWidth={1.5} />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Text content */}
          <View className="items-center">
            <Animated.View entering={FadeIn.delay(800).duration(600)}>
              <Text
                className="text-5xl text-lumis-dawn text-center mb-4"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                EARNED
              </Text>
              <Text
                className="text-lg text-lumis-sunrise/70 text-center mb-8"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                {todayProgress.lightMinutes.toFixed(0)} min of pure sun.{'\n'}
                Apps unlocked. You did the hard thing.
              </Text>
            </Animated.View>

            {/* Stats */}
            <Animated.View
              entering={FadeInDown.delay(1000).duration(600)}
              className="flex-row space-x-4"
            >
              {/* Streak */}
              <View className="bg-lumis-twilight/40 rounded-2xl px-6 py-4 items-center border border-lumis-golden/30">
                <View className="flex-row items-center mb-1">
                  <Flame size={20} color="#FF6B35" strokeWidth={1.5} />
                  <Text
                    className="text-lumis-sunrise/60 ml-1"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    Streak
                  </Text>
                </View>
                <Text
                  className="text-3xl text-lumis-golden"
                  style={{ fontFamily: 'Outfit_700Bold' }}
                >
                  {currentStreak}
                  <Text
                    className="text-lg text-lumis-sunrise/50"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    {' '}
                    days
                  </Text>
                </Text>
              </View>

              {/* Unlocked */}
              <View className="bg-lumis-twilight/40 rounded-2xl px-6 py-4 items-center border border-green-500/30">
                <View className="flex-row items-center mb-1">
                  <Unlock size={20} color="#4ADE80" strokeWidth={1.5} />
                  <Text
                    className="text-lumis-sunrise/60 ml-1"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    Status
                  </Text>
                </View>
                <Text
                  className="text-xl text-green-400"
                  style={{ fontFamily: 'Outfit_600SemiBold' }}
                >
                  Unlocked
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Continue button */}
          <Animated.View
            entering={FadeInDown.delay(1200).duration(600)}
            style={[buttonAnimStyle, { width: '100%' }]}
          >
            <Pressable
              onPress={handleContinue}
              onPressIn={() => {
                buttonScale.value = withSpring(0.95);
              }}
              onPressOut={() => {
                buttonScale.value = withSpring(1);
              }}
              className="w-full"
            >
              <LinearGradient
                colors={['#FFB347', '#FF8C00', '#FF6B35']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 18,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#FF8C00',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <Text
                  className="text-lumis-night text-lg"
                  style={{ fontFamily: 'Outfit_600SemiBold' }}
                >
                  Claim Your Day
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}
