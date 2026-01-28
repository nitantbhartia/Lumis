import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useLumisStore } from '@/lib/state/lumis-store';
import { AnimatedCounter } from '@/components/onboarding/AnimatedCounter';

export default function OnboardingCalculationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const morningScrollTime = useLumisStore((s) => s.morningScrollTime);

  const calculation = useMemo(() => {
    const minutes = parseInt(morningScrollTime || '30', 10);
    const hoursPerYear = (minutes * 365) / 60;
    const daysPerYear = (minutes * 365) / (60 * 24);

    return {
      avgMinutes: minutes,
      hoursPerYear: Math.round(hoursPerYear),
      daysPerYear: parseFloat(daysPerYear.toFixed(1)),
    };
  }, [morningScrollTime]);

  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  useEffect(() => {
    // Text fades in after number animation completes
    textOpacity.value = withDelay(
      1600,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    );
    textTranslateY.value = withDelay(
      1600,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) })
    );
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding-social-proof');
  };

  return (
    <View style={styles.container}>
      {/* Top section - Orange */}
      <View style={styles.topSection}>
        <View style={styles.topContent}>
          <AnimatedCounter
            value={calculation.hoursPerYear}
            duration={1500}
            size={96}
            useGradient={false}
            color="#FFFFFF"
          />
          <Animated.Text entering={FadeIn.delay(800)} style={styles.hoursLabel}>
            hours per year
          </Animated.Text>
        </View>
      </View>

      {/* Bottom section - Dark */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom }]}>
        <View style={styles.bottomContent}>
          <Animated.View style={textStyle}>
            <Text style={styles.daysText}>
              {calculation.daysPerYear} full days of your life.
            </Text>
            <Text style={styles.subText}>In bed. Scrolling.</Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.delay(2000)}>
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>CONTINUE</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    flex: 0.4,
    backgroundColor: '#FF6B35',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 48,
  },
  topContent: {
    alignItems: 'center',
  },
  hoursLabel: {
    fontSize: 24,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  bottomSection: {
    flex: 0.6,
    backgroundColor: '#1A1A2E',
    justifyContent: 'space-between',
  },
  bottomContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  daysText: {
    fontSize: 36,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    lineHeight: 44,
    letterSpacing: -1,
    marginBottom: 12,
  },
  subText: {
    fontSize: 24,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 22,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#E85D04',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});
