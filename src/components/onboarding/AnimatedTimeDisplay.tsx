import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedTimeDisplayProps {
  hours: number;
  minutes: number;
  period: 'AM' | 'PM';
}

export function AnimatedTimeDisplay({
  hours,
  minutes,
  period,
}: AnimatedTimeDisplayProps) {
  const formattedHours = hours.toString();
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const timeString = `${formattedHours}:${formattedMinutes}`;

  return (
    <View style={styles.container}>
      <AnimatedDigits value={timeString} />
      <Animated.Text style={styles.period}>{period}</Animated.Text>
    </View>
  );
}

interface AnimatedDigitsProps {
  value: string;
}

function AnimatedDigits({ value }: AnimatedDigitsProps) {
  const prevValue = useRef(value);
  const animationProgress = useSharedValue(1);

  useEffect(() => {
    if (prevValue.current !== value) {
      animationProgress.value = 0;
      animationProgress.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      prevValue.current = value;
    }
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(animationProgress.value, [0, 1], [-20, 0]),
      },
    ],
    opacity: animationProgress.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <MaskedView
        maskElement={
          <Animated.Text style={styles.time}>{value}</Animated.Text>
        }
      >
        <LinearGradient
          colors={['#FFB347', '#FF6B35']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </MaskedView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  time: {
    fontSize: 96,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: -4,
    color: '#000',
    textAlign: 'center',
  },
  gradient: {
    height: 120,
    width: 280,
  },
  period: {
    fontSize: 28,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 4,
  },
});
