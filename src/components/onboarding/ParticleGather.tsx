import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PARTICLE_COUNT = 50;
const GATHER_DURATION = 1200; // ms to gather particles to center
const COLORS = ['#FFB347', '#FF8C00', '#FF6B35', '#FCD34D', '#FFEDD5'];

interface ParticleGatherProps {
  onComplete?: () => void;
}

interface Particle {
  id: number;
  startX: number;
  startY: number;
  color: string;
  delay: number;
  size: number;
}

// Generate particles around the screen edges
const generateParticles = (): Particle[] => {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    // Distribute particles around the screen perimeter
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
    const radius = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.6;

    // Add some randomness to the starting position
    const randomOffset = (Math.random() - 0.5) * 100;

    return {
      id: i,
      startX: SCREEN_WIDTH / 2 + Math.cos(angle) * radius + randomOffset,
      startY: SCREEN_HEIGHT / 2 + Math.sin(angle) * radius + randomOffset,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 200, // Stagger start times
      size: 6 + Math.random() * 6, // Vary particle sizes
    };
  });
};

function GatherParticle({
  particle,
  onComplete,
  centerX,
  centerY,
}: {
  particle: Particle;
  onComplete?: () => void;
  centerX: number;
  centerY: number;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Calculate distance to center
    const targetX = centerX - particle.startX;
    const targetY = centerY - particle.startY;

    // Fade in quickly
    opacity.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 150 })
    );

    // Move to center with easing
    translateX.value = withDelay(
      particle.delay + 100,
      withTiming(targetX, {
        duration: GATHER_DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );

    translateY.value = withDelay(
      particle.delay + 100,
      withTiming(targetY, {
        duration: GATHER_DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );

    // Shrink and fade as approaching center
    scale.value = withDelay(
      particle.delay + GATHER_DURATION * 0.6,
      withTiming(0.2, { duration: GATHER_DURATION * 0.4 })
    );

    opacity.value = withDelay(
      particle.delay + GATHER_DURATION * 0.7,
      withTiming(0, { duration: GATHER_DURATION * 0.3 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.startX,
          top: particle.startY,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: particle.color,
        },
        animatedStyle,
      ]}
    />
  );
}

export function ParticleGather({ onComplete }: ParticleGatherProps) {
  const particles = useMemo(() => generateParticles(), []);
  const [completedCount, setCompletedCount] = React.useState(0);
  const hasTriggeredHaptic = React.useRef(false);
  const hasCompleted = React.useRef(false);

  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2 - 50; // Slightly above center

  // Trigger heavy haptic when particles converge
  useEffect(() => {
    const hapticTimer = setTimeout(() => {
      if (!hasTriggeredHaptic.current) {
        hasTriggeredHaptic.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }, GATHER_DURATION + 200);

    return () => clearTimeout(hapticTimer);
  }, []);

  useEffect(() => {
    // When enough particles have completed, trigger the callback
    if (completedCount >= particles.length * 0.8 && !hasCompleted.current) {
      hasCompleted.current = true;
      onComplete?.();
    }
  }, [completedCount, particles.length, onComplete]);

  const handleParticleComplete = () => {
    setCompletedCount((prev) => prev + 1);
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <GatherParticle
          key={particle.id}
          particle={particle}
          centerX={centerX}
          centerY={centerY}
          onComplete={handleParticleComplete}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
