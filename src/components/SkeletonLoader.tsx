import React, { useEffect } from 'react';
import { View, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonLoaderProps {
  variant?: 'card' | 'text' | 'circle' | 'stat';
  width?: DimensionValue;
  height?: number;
  className?: string;
  style?: ViewStyle;
}

export function SkeletonLoader({
  variant = 'text',
  width,
  height,
  className,
  style,
}: SkeletonLoaderProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const variantStyles: Record<string, ViewStyle> = {
    card: {
      width: width || '100%',
      height: height || 120,
      borderRadius: 16,
    },
    text: {
      width: width || '60%',
      height: height || 16,
      borderRadius: 8,
    },
    circle: {
      width: width || 40,
      height: height || 40,
      borderRadius: (height || 40) / 2,
    },
    stat: {
      width: width || '100%',
      height: height || 80,
      borderRadius: 12,
    },
  };

  return (
    <Animated.View
      style={[
        variantStyles[variant],
        {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
        },
        animatedStyle,
        style,
      ]}
      className={className}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          flex: 1,
        }}
      />
    </Animated.View>
  );
}
