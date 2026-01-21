import React, { useEffect } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { AnimatedSun } from '@/components/AnimatedSun';

export default function OnboardingSplashScreen() {
  const router = useRouter();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    // Pulsing animation
    pulseScale.value = withRepeat(
      withTiming(1.1, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    pulseOpacity.value = withRepeat(
      withTiming(0.7, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    // Auto-navigate after 3 seconds
    const timer = setTimeout(() => {
      router.push('/onboarding-question-sunlight');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
        locations={[0, 0.3, 0.7, 1]}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center">
          <Animated.View style={pulseStyle}>
            <AnimatedSun size={200} />
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}
