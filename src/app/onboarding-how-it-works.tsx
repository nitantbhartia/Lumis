import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Moon, Sun, Smartphone, LucideIcon } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

const STEPS: { icon: LucideIcon; title: string; color: string }[] = [
  {
    icon: Moon,
    title: 'Your apps lock at bedtime',
    color: '#6366F1',
  },
  {
    icon: Sun,
    title: 'Morning light unlocks them',
    color: '#FF6B35',
  },
  {
    icon: Smartphone,
    title: 'You start the day on your terms',
    color: '#22C55E',
  },
];

export default function OnboardingHowItWorksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Animation values
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const stepsOpacity = STEPS.map(() => useSharedValue(0));
  const stepsScale = STEPS.map(() => useSharedValue(0.9));
  const subtitleOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Title
    titleOpacity.value = withTiming(1, { duration: 400 });
    titleTranslateY.value = withTiming(0, { duration: 400 });

    // Staggered steps
    STEPS.forEach((_, index) => {
      const delay = 300 + index * 200;
      stepsOpacity[index].value = withDelay(delay, withTiming(1, { duration: 400 }));
      stepsScale[index].value = withDelay(delay, withTiming(1, { duration: 400 }));
    });

    // Subtitle
    subtitleOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));

    // Button
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 300 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding-sensor-calibration');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
      <View style={styles.content}>
        {/* Title */}
        <Animated.Text style={[styles.title, titleStyle]}>
          The system is simple
        </Animated.Text>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const stepStyle = useAnimatedStyle(() => ({
              opacity: stepsOpacity[index].value,
              transform: [{ scale: stepsScale[index].value }],
            }));
            return (
              <Animated.View key={index} style={[styles.stepRow, stepStyle]}>
                <View style={[styles.iconContainer, { backgroundColor: `${step.color}15` }]}>
                  <Icon size={24} color={step.color} strokeWidth={2} />
                </View>
                <Text style={styles.stepText}>{step.title}</Text>
              </Animated.View>
            );
          })}
        </View>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          Lumis uses your phone's light sensor to verify you've found natural light.{'\n\n'}
          No sunshine, no scrolling.
        </Animated.Text>
      </View>

      {/* CTA Button */}
      <Animated.View
        style={[styles.buttonContainer, { paddingBottom: insets.bottom }, buttonStyle]}
      >
        <Pressable onPress={handleContinue} style={styles.button}>
          <Text style={styles.buttonText}>SHOW ME HOW IT WORKS</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    lineHeight: 44,
    letterSpacing: -1,
    marginBottom: 48,
  },
  stepsContainer: {
    gap: 20,
    marginBottom: 48,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 24,
  },
  buttonContainer: {
    backgroundColor: '#0F172A',
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 22,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});
