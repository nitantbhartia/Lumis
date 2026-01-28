import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useLumisStore } from '@/lib/state/lumis-store';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

// Thresholds for haptic feedback (in days per year)
const THRESHOLDS = [5, 10, 15, 20, 30];
const MIN_MINUTES = 1;
const MAX_MINUTES = 120;

export default function OnboardingTimeQuestionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setMorningScrollTime = useLumisStore((s) => s.setMorningScrollTime);

  // Slider state: 1 to 120 minutes, default 30
  const [minutes, setMinutes] = useState(30);
  const [sliderWidth, setSliderWidth] = useState(300);
  const [lastThresholdCrossed, setLastThresholdCrossed] = useState(0);
  const [isAtMax, setIsAtMax] = useState(false);

  // Animation values
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const sliderOpacity = useSharedValue(0);
  const counterScale = useSharedValue(1);
  const counterGlow = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  // Calculate days per year using: (Daily Minutes × 365) / (60 × 24)
  const daysPerYear = useMemo(() => {
    return ((minutes * 365) / (60 * 24)).toFixed(1);
  }, [minutes]);

  const daysValue = parseFloat(daysPerYear);

  // Check threshold crossing for haptics and max state
  useEffect(() => {
    const atMax = minutes >= MAX_MINUTES;
    setIsAtMax(atMax);

    if (atMax) {
      // Trigger pulsing glow at max
      counterGlow.value = withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.5, { duration: 800 })
      );
    }

    const newThreshold = THRESHOLDS.find(
      (t) => daysValue >= t && t > lastThresholdCrossed
    );
    if (newThreshold) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      counterScale.value = withSequence(
        withSpring(1.15, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
      setLastThresholdCrossed(newThreshold);
    }
    // Reset if going below thresholds
    if (daysValue < lastThresholdCrossed - 1) {
      setLastThresholdCrossed(
        THRESHOLDS.filter((t) => t < daysValue).pop() || 0
      );
    }
  }, [minutes, daysValue]);

  useEffect(() => {
    // Staggered animations
    titleOpacity.value = withTiming(1, { duration: 400 });
    titleTranslateY.value = withTiming(0, { duration: 400 });
    sliderOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    buttonOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const sliderStyle = useAnimatedStyle(() => ({
    opacity: sliderOpacity.value,
  }));

  const counterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterScale.value }],
    opacity: interpolate(counterGlow.value, [0, 1], [1, 0.6], Extrapolate.CLAMP),
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  // Slider position and tracking
  const sliderPosition = useSharedValue(0.25); // 30 out of 1-120 range
  const startPosition = useSharedValue(0.25);

  // Non-linear scaling: 1-min increments up to 30, then 5-min increments up to 120
  const updateMinutes = (value: number) => {
    let newMinutes: number;

    if (value <= 0.25) {
      // 0 to 0.25 maps to 1-30 minutes (1-minute increments)
      newMinutes = Math.round(1 + (value / 0.25) * 29);
    } else {
      // 0.25 to 1 maps to 30-120 minutes (5-minute increments)
      const normalized = (value - 0.25) / 0.75;
      const increment = Math.round(normalized * 18); // 18 steps of 5 minutes = 90 minutes
      newMinutes = 30 + (increment * 5);
    }

    newMinutes = Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, newMinutes));
    setMinutes(newMinutes);
  };

  // Sensitivity multiplier - lower = less sensitive
  const SENSITIVITY = 0.5;

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startPosition.value = sliderPosition.value;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((event) => {
      // Use absolute position from start, scaled by sensitivity
      const delta = (event.translationX / sliderWidth) * SENSITIVITY;
      const newPosition = Math.max(0, Math.min(1, startPosition.value + delta));
      sliderPosition.value = newPosition;
      runOnJS(updateMinutes)(newPosition);
    })
    .onEnd(() => {
      // Snap to current position
    });

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${sliderPosition.value * 100}%`,
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: `${sliderPosition.value * 100}%`,
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Store the actual minutes value
    setMorningScrollTime(minutes.toString());
    router.push('/onboarding-hook');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <View style={styles.content}>
          {/* Question */}
          <Animated.Text style={[styles.question, titleStyle]}>
            How much time do you lose scrolling each morning?
          </Animated.Text>

          {/* Dynamic Counter */}
          <Animated.View style={[styles.counterContainer, counterStyle]}>
            <Text style={[styles.counterValue, isAtMax && styles.counterValueMax]}>
              {daysPerYear}
            </Text>
            <Text style={styles.counterLabel}>days per year</Text>
            <Text style={styles.counterSubtext}>
              {isAtMax ? 'lost in the darkness' : 'lost in the dark'}
            </Text>
          </Animated.View>

          {/* Slider */}
          <Animated.View
            style={[styles.sliderContainer, sliderStyle]}
            onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width - 32)}
          >
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>1 min</Text>
              <Text style={styles.sliderLabelCenter}>{isAtMax ? '120+ min' : `${minutes} min`}</Text>
              <Text style={styles.sliderLabel}>120 min</Text>
            </View>

            <GestureDetector gesture={panGesture}>
              <View style={styles.sliderTrack}>
                <Animated.View style={[styles.sliderFill, fillStyle]} />
                <Animated.View style={[styles.sliderThumb, thumbStyle]} />
              </View>
            </GestureDetector>
          </Animated.View>
        </View>

        {/* CTA Button */}
        <Animated.View
          style={[styles.buttonContainer, { paddingBottom: insets.bottom }, buttonStyle]}
        >
          <Pressable onPress={handleContinue} style={styles.button}>
            <Text style={styles.buttonText}>RECLAIM MY MORNINGS</Text>
          </Pressable>
        </Animated.View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  question: {
    fontSize: 32,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    lineHeight: 40,
    letterSpacing: -1,
    marginBottom: 48,
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: 64,
  },
  counterValue: {
    fontSize: 96,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FF6B35',
    letterSpacing: -4,
    lineHeight: 100,
  },
  counterValueMax: {
    color: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
  counterLabel: {
    fontSize: 24,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  counterSubtext: {
    fontSize: 18,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  sliderContainer: {
    paddingHorizontal: 16,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  sliderLabelCenter: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  sliderTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 4,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    marginLeft: -14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonContainer: {
    backgroundColor: '#1A1A2E',
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
