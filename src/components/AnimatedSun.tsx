import React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';

interface AnimatedSunProps {
  size?: number;
  isPulsing?: boolean;
  progress?: number; // 0-1 for progress ring
}

export function AnimatedSun({ size = 200, isPulsing = true, progress = 0 }: AnimatedSunProps) {
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isPulsing) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      rotation.value = withRepeat(
        withTiming(360, { duration: 60000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [isPulsing]);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.3, 0.7]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.2]) }],
  }));

  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: interpolate(glow.value, [0, 1], [0.4, 0.8]),
  }));

  const rays = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <View className="items-center justify-center" style={{ width: size * 1.5, height: size * 1.5 }}>
      {/* Outer glow */}
      <Animated.View
        style={[
          glowStyle,
          {
            position: 'absolute',
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: size * 0.7,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 179, 71, 0.4)', 'rgba(255, 107, 53, 0.2)', 'transparent']}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: size * 0.7,
          }}
        />
      </Animated.View>

      {/* Rays */}
      <Animated.View
        style={[
          raysStyle,
          {
            position: 'absolute',
            width: size * 1.3,
            height: size * 1.3,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        {rays.map((angle) => (
          <View
            key={angle}
            style={{
              position: 'absolute',
              width: 3,
              height: size * 0.15,
              backgroundColor: '#FFB347',
              borderRadius: 2,
              transform: [
                { rotate: `${angle}deg` },
                { translateY: -size * 0.55 },
              ],
              opacity: 0.6,
            }}
          />
        ))}
      </Animated.View>

      {/* Progress ring */}
      {progress > 0 && (
        <View
          style={{
            position: 'absolute',
            width: size * 1.15,
            height: size * 1.15,
            borderRadius: size * 0.575,
            borderWidth: 4,
            borderColor: 'rgba(255, 179, 71, 0.3)',
          }}
        />
      )}

      {/* Core sun */}
      <Animated.View style={coreStyle}>
        <LinearGradient
          colors={['#FFE4B5', '#FFB347', '#FF8C00', '#FF6B35']}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            shadowColor: '#FF8C00',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 30,
            elevation: 20,
          }}
        />
      </Animated.View>
    </View>
  );
}
