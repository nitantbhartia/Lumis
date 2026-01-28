import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  size?: number;
  useGradient?: boolean;
  color?: string;
}

export function AnimatedCounter({
  value,
  duration = 1500,
  suffix = '',
  size = 72,
  useGradient = true,
  color = '#FFFFFF',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    // Simple approach: animate and poll value
    animatedValue.value = 0;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * value);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const textContent = (
    <Text
      style={[
        styles.text,
        {
          fontSize: size,
          color: useGradient ? '#000' : color,
        },
      ]}
    >
      {displayValue}{suffix}
    </Text>
  );

  if (useGradient) {
    return (
      <MaskedView maskElement={textContent}>
        <LinearGradient
          colors={['#FFB347', '#FF6B35']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: size * 3, height: size * 1.3 }}
        />
      </MaskedView>
    );
  }

  return textContent;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: -2,
    textAlign: 'center',
  },
});
