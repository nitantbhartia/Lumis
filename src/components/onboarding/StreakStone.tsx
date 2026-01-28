import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame } from 'lucide-react-native';

interface StreakStoneProps {
  dayCount?: number;
  size?: number;
  animated?: boolean;
}

export function StreakStone({
  dayCount = 1,
  size = 120,
  animated = true,
}: StreakStoneProps) {
  const scale = useSharedValue(0);
  const glowOpacity = useSharedValue(0.6);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      // Spring entrance animation
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 100,
        mass: 1,
      });

      // Breathing glow effect
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Subtle rotation
      rotation.value = withRepeat(
        withSequence(
          withTiming(3, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-3, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scale.value = 1;
    }
  }, [animated]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0.6, 1], [1, 1.15]) }],
  }));

  return (
    <View style={[styles.wrapper, { width: size * 1.5, height: size * 1.5 }]}>
      {/* Outer glow */}
      <Animated.View style={[styles.glowOuter, glowStyle, { width: size * 1.4, height: size * 1.4, borderRadius: size * 0.7 }]}>
        <LinearGradient
          colors={['transparent', 'rgba(255, 140, 0, 0.3)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Main stone */}
      <Animated.View style={[styles.stoneContainer, containerStyle]}>
        <LinearGradient
          colors={['#FFE4B5', '#FFB347', '#FF8C00', '#FF6B35']}
          style={[styles.stone, { width: size, height: size, borderRadius: size / 2 }]}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
        >
          {/* Inner highlight */}
          <View style={[styles.highlight, { width: size * 0.3, height: size * 0.15, top: size * 0.15, left: size * 0.2 }]} />

          {/* Flame icon */}
          <View style={styles.iconContainer}>
            <Flame
              size={size * 0.35}
              color="#FFFFFF"
              fill="#FFFFFF"
              strokeWidth={1.5}
            />
          </View>

          {/* Day count badge */}
          <View style={[styles.badge, { bottom: size * 0.1, right: size * 0.1 }]}>
            <Text style={[styles.badgeText, { fontSize: size * 0.15 }]}>{dayCount}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Inner glow ring */}
      <Animated.View style={[styles.glowInner, glowStyle, { width: size * 1.1, height: size * 1.1, borderRadius: size * 0.55 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 140, 0, 0.2)',
  },
  glowInner: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 179, 71, 0.4)',
  },
  stoneContainer: {
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  stone: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 50,
    transform: [{ rotate: '-20deg' }],
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_700Bold',
  },
});
