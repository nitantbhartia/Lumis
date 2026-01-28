import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface KineticLogoProps {
  text?: string;
  letterDelay?: number;
  letterDuration?: number;
  onComplete?: () => void;
  size?: number;
}

export function KineticLogo({
  text = 'LUMIS',
  letterDelay = 120,
  letterDuration = 400,
  onComplete,
  size = 72,
}: KineticLogoProps) {
  const letters = text.split('');
  const animationProgress = letters.map(() => useSharedValue(0));

  useEffect(() => {
    letters.forEach((_, index) => {
      animationProgress[index].value = withDelay(
        index * letterDelay,
        withTiming(1, {
          duration: letterDuration,
          easing: Easing.out(Easing.cubic),
        })
      );
    });

    // Call onComplete after all letters have animated
    if (onComplete) {
      const totalDuration = letters.length * letterDelay + letterDuration;
      const timer = setTimeout(() => {
        onComplete();
      }, totalDuration);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.lettersRow}>
        {letters.map((letter, index) => (
          <AnimatedLetter
            key={index}
            letter={letter}
            progress={animationProgress[index]}
            size={size}
          />
        ))}
      </View>
    </View>
  );
}

interface AnimatedLetterProps {
  letter: string;
  progress: Animated.SharedValue<number>;
  size: number;
}

function AnimatedLetter({ letter, progress, size }: AnimatedLetterProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [60, 0]) },
      { rotate: `${interpolate(progress.value, [0, 1], [15, 0])}deg` },
    ],
    opacity: progress.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text
        style={[
          styles.letter,
          {
            fontSize: size,
            color: '#FF6B35',
          },
        ]}
      >
        {letter}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  letter: {
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0,
  },
});
