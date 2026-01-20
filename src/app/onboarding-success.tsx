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

  const isPremium = useLumisStore((s) => s.isPremium);
  const isTrialActive = useLumisStore((s) => s.isTrialActive());
  const hasPremiumAccess = isPremium || isTrialActive;

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasCompletedOnboarding(true);

    // Redirect to Paywall Walkthrough if not premium (Post-Onboarding Sunk Cost)
    if (!hasPremiumAccess) {
      router.replace('/premium-walkthrough');
    } else {
      router.replace('/dashboard');
    }
  };

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
      if (!hasPremiumAccess) {
        router.replace('/premium-walkthrough');
      } else {
        router.replace('/dashboard');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

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
                You're All Set
              </Text>
              <Text
                className="text-xl text-lumis-sunrise text-center"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Tomorrow starts with{'\n'}golden light, {displayName}
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
                  See Your Sun
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}
