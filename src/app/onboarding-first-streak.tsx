import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useLumisStore } from '@/lib/state/lumis-store';
import { ParticleGather } from '@/components/onboarding/ParticleGather';
import { StreakStone } from '@/components/onboarding/StreakStone';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OnboardingFirstStreakScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showStone, setShowStone] = useState(false);
  const [showText, setShowText] = useState(false);
  const hasAwarded = useRef(false);

  const awardInitialStreak = useLumisStore((s) => s.awardInitialStreak);
  const hasReceivedInitialStreak = useLumisStore((s) => s.hasReceivedInitialStreak);

  const buttonOpacity = useSharedValue(0);

  // Award the streak on mount (only once)
  useEffect(() => {
    if (!hasAwarded.current && !hasReceivedInitialStreak) {
      hasAwarded.current = true;
      awardInitialStreak();
    }
  }, []);

  // Handle particle animation complete
  const handleParticlesComplete = () => {
    setShowStone(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show text after stone appears
    setTimeout(() => {
      setShowText(true);
      // Show button after text
      buttonOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
    }, 600);
  };

  // Auto-continue after delay
  useEffect(() => {
    if (showText) {
      const timer = setTimeout(() => {
        handleContinue();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showText]);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding-stakes-choice');
  };

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Particle animation */}
      <ParticleGather onComplete={handleParticlesComplete} />

      {/* Stone appears after particles converge */}
      {showStone && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.stoneContainer}
        >
          <StreakStone dayCount={1} size={140} animated />
        </Animated.View>
      )}

      {/* Text content */}
      {showText && (
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.textContainer}
        >
          <Text style={styles.title}>The Spark</Text>
          <Text style={styles.subtitle}>
            Your Morning Shield is now{'\n'}100% powered.
          </Text>
          <Text style={styles.message}>See you at sunrise.</Text>
        </Animated.View>
      )}

      {/* Continue button */}
      <Animated.View
        style={[styles.buttonContainer, { paddingBottom: insets.bottom + 20 }, buttonStyle]}
      >
        <Pressable onPress={handleContinue} style={styles.button}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </Animated.View>

      {/* Streak indicator badge */}
      {showStone && (
        <Animated.View
          entering={FadeIn.delay(1000).duration(400)}
          style={[styles.streakBadge, { top: insets.top + 20 }]}
        >
          <Text style={styles.streakBadgeText}>1-Day Streak</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stoneContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    bottom: 180,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Syne_700Bold',
    color: '#FFB347',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 179, 71, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  button: {
    backgroundColor: 'rgba(255, 179, 71, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 71, 0.3)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFB347',
  },
  streakBadge: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.4)',
  },
  streakBadgeText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FF6B35',
  },
});
