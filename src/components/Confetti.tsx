import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiProps {
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  velocityX: number;
  velocityY: number;
}

const COLORS = ['#FFB347', '#FF6B35', '#4ADE80', '#FCD34D', '#F87171'];

const generateParticles = (count: number): Particle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: SCREEN_WIDTH / 2,
    y: SCREEN_HEIGHT / 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle',
    velocityX: (Math.random() - 0.5) * 400,
    velocityY: -Math.random() * 400 - 200,
  }));
};

function ConfettiParticle({ particle, onComplete }: { particle: Particle; onComplete?: () => void }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(particle.velocityX, {
      duration: 3000,
      easing: Easing.out(Easing.quad),
    });

    translateY.value = withTiming(
      particle.velocityY + 800, // gravity effect
      {
        duration: 3000,
        easing: Easing.in(Easing.quad),
      }
    );

    rotate.value = withTiming(Math.random() * 720, {
      duration: 3000,
      easing: Easing.linear,
    });

    opacity.value = withDelay(
      2000,
      withTiming(0, { duration: 1000 }, (finished) => {
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
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const shapeStyle = {
    circle: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: particle.color,
    },
    square: {
      width: 8,
      height: 8,
      backgroundColor: particle.color,
    },
    triangle: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid' as const,
      borderLeftWidth: 4,
      borderRightWidth: 4,
      borderBottomWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: particle.color,
    },
  };

  return (
    <Animated.View
      style={[
        styles.particle,
        { left: particle.x, top: particle.y },
        shapeStyle[particle.shape],
        animatedStyle,
      ]}
    />
  );
}

export function Confetti({ onComplete }: ConfettiProps) {
  const particles = generateParticles(50);
  const [completedCount, setCompletedCount] = React.useState(0);

  useEffect(() => {
    if (completedCount >= particles.length && onComplete) {
      onComplete();
    }
  }, [completedCount, particles.length, onComplete]);

  const handleParticleComplete = () => {
    setCompletedCount((prev) => prev + 1);
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <ConfettiParticle
          key={particle.id}
          particle={particle}
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
  },
});
