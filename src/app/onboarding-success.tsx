import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/lib/state/auth-store';
import { useLumisStore } from '@/lib/state/lumis-store';

export default function OnboardingSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const userName = useAuthStore((s) => s.userName);
  const setHasCompletedOnboarding = useLumisStore((s) => s.setHasCompletedOnboarding);

  const sunScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate sun growing
    sunScale.value = withSpring(1, { damping: 8, mass: 1, stiffness: 80 });

    // Glow pulse
    glowOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 800,
        easing: Easing.inOut(Easing.ease),
      })
    );

    // Text fade in
    textOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));

    // Button fade in
    buttonOpacity.value = withDelay(900, withTiming(1, { duration: 600 }));

    // Auto-navigate after 3 seconds
    const timer = setTimeout(() => {
      setHasCompletedOnboarding(true);
      router.replace('/dashboard');
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sunScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const displayName = user?.name || userName || 'Friend';

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasCompletedOnboarding(true);
    router.replace('/dashboard');
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 items-center justify-between px-6"
          style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }}
        >
          {/* Spacer */}
          <View />

          {/* Sun Animation */}
          <View className="items-center gap-8">
            {/* Glow Background */}
            <Animated.View
              style={[
                glowStyle,
                {
                  position: 'absolute',
                  width: 280,
                  height: 280,
                  borderRadius: 140,
                  backgroundColor: '#FF8C00' + '20',
                },
              ]}
            />

            {/* Sun */}
            <Animated.View style={sunStyle}>
              <View
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  backgroundColor: '#FFB347',
                  shadowColor: '#FF8C00',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 40,
                  elevation: 20,
                }}
              />
            </Animated.View>

            {/* Text Content */}
            <Animated.View style={textStyle} className="items-center gap-2">
              <Text
                className="text-4xl text-lumis-dawn text-center"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                Account Secured
              </Text>
              <Text
                className="text-xl text-lumis-sunrise text-center"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                You're ready for{'\n'}tomorrow's sunrise, {displayName}
              </Text>
            </Animated.View>
          </View>

          {/* Continue Button */}
          <Animated.View style={buttonStyle} className="w-full">
            <Pressable onPress={handleContinue} className="active:scale-95">
              <LinearGradient
                colors={['#FFB347', '#FF8C00', '#FF6B35']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 18,
                  borderRadius: 16,
                  shadowColor: '#FF8C00',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Text
                  className="text-lumis-night text-center text-lg"
                  style={{ fontFamily: 'Outfit_600SemiBold' }}
                >
                  Go to Dashboard
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}
