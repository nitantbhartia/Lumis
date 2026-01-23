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
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AnimatedSun } from '@/components/AnimatedSun';
import { useLumisStore } from '@/lib/state/lumis-store';
import { useAuthStore } from '@/lib/state/auth-store';

export default function IndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasCompletedOnboarding = useLumisStore((s) => s.hasCompletedOnboarding);

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);
  const buttonOpacity = useSharedValue(0);
  const secondaryButtonOpacity = useSharedValue(0);

  useEffect(() => {
    // Check if user is authenticated and has completed onboarding
    if (isAuthenticated && hasCompletedOnboarding) {
      const timer = setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
      return () => clearTimeout(timer);
    }

    // If authenticated but hasn't completed onboarding, go to new onboarding flow
    if (isAuthenticated && !hasCompletedOnboarding) {
      const timer = setTimeout(() => {
        router.replace('/onboarding-splash');
      }, 100);
      return () => clearTimeout(timer);
    }

    // Not authenticated cases
    if (hasCompletedOnboarding) {
      // Returning user - take them straight to auth
      const timer = setTimeout(() => {
        router.replace('/onboarding-auth');
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // New user - start from splash
      const timer = setTimeout(() => {
        router.replace('/onboarding-splash');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, hasCompletedOnboarding]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const secondaryButtonStyle = useAnimatedStyle(() => ({
    opacity: secondaryButtonOpacity.value,
  }));

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding-splash');
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding-splash');
  };

  // Show loading state while checking auth
  if (isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#87CEEB', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatedSun size={120} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
        locations={[0, 0.3, 0.7, 1]}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 items-center justify-between px-8"
          style={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }}
        >
          {/* Sun Animation */}
          <Animated.View entering={FadeIn.duration(1000)} className="mt-8">
            <AnimatedSun size={180} />
          </Animated.View>

          {/* Text Content */}
          <View className="items-center space-y-4">
            <Animated.Text
              style={[titleStyle, { fontFamily: 'Outfit_700Bold', color: '#1A1A2E' }]}
              className="text-5xl text-center"
            >
              LUMIS
            </Animated.Text>
            <Animated.Text
              style={[subtitleStyle, { fontFamily: 'Outfit_400Regular', color: '#1A1A2E' }]}
              className="text-lg text-center opacity-80"
            >
              Earn your screen time{'\n'}with daylight
            </Animated.Text>
          </View>

          {/* CTA Buttons */}
          <View className="w-full">
            {/* Primary: Get Started (Sign Up) */}
            <Animated.View style={buttonStyle}>
              <Pressable
                onPress={handleGetStarted}
                className="w-full active:scale-95"
                style={{ transform: [{ scale: 1 }] }}
              >
                <LinearGradient
                  colors={['#FFB347', '#FF8C00', '#FF6B35']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 22,
                    borderRadius: 20,
                    shadowColor: '#FF8C00',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.5,
                    shadowRadius: 16,
                    elevation: 10,
                  }}
                >
                  <Text
                    className="text-lumis-night text-center text-xl font-bold uppercase tracking-widest"
                    style={{ fontFamily: 'Outfit_700Bold' }}
                  >
                    Get Started
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Secondary: Sign In */}
            <Animated.View style={secondaryButtonStyle}>
              <Pressable
                onPress={handleLogin}
                className="w-full mt-4 py-4"
              >
                <Text
                  className="text-center text-base"
                  style={{ fontFamily: 'Outfit_500Medium', color: '#1A1A2E' }}
                >
                  Already have an account? <Text style={{ fontFamily: 'Outfit_600SemiBold', color: '#FF8C00' }}>Sign In</Text>
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
