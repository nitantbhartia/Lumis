import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Polygon, Defs, RadialGradient, Stop } from 'react-native-svg';
import {
  Flame,
  Sun,
  Star,
  Moon,
  Diamond,
  Crown,
  Infinity,
} from 'lucide-react-native';
import { StoneMilestone } from './StoneTypes';

interface MilestoneStoneProps {
  milestone: StoneMilestone;
  size?: number;
  isLocked?: boolean;
  isActive?: boolean; // Currently highlighted in carousel
  animated?: boolean;
  showLabel?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

// Symbol icons mapping
const SymbolIcon = ({
  symbol,
  size,
  color,
}: {
  symbol: StoneMilestone['symbol'];
  size: number;
  color: string;
}) => {
  const props = { size, color, fill: color, strokeWidth: 1.5 };

  switch (symbol) {
    case 'flame':
      return <Flame {...props} />;
    case 'sun':
      return <Sun {...props} />;
    case 'star':
      return <Star {...props} />;
    case 'moon':
      return <Moon {...props} />;
    case 'diamond':
      return <Diamond {...props} />;
    case 'crown':
      return <Crown {...props} />;
    case 'infinity':
      return <Infinity {...props} />;
    default:
      return <Flame {...props} />;
  }
};

// Shape components
function HexagonShape({ size, colors }: { size: number; colors: string[] }) {
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = size / 2 + (size / 2 - 4) * Math.cos(angle);
    const y = size / 2 + (size / 2 - 4) * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="hexGrad" cx="50%" cy="30%" r="70%">
          <Stop offset="0%" stopColor={colors[0]} />
          <Stop offset="50%" stopColor={colors[1]} />
          <Stop offset="100%" stopColor={colors[2]} />
        </RadialGradient>
      </Defs>
      <Polygon points={points} fill="url(#hexGrad)" />
    </Svg>
  );
}

function DiamondShape({ size, colors }: { size: number; colors: string[] }) {
  const half = size / 2;
  const path = `M ${half} 4 L ${size - 4} ${half} L ${half} ${size - 4} L 4 ${half} Z`;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="diamondGrad" cx="50%" cy="30%" r="70%">
          <Stop offset="0%" stopColor={colors[0]} />
          <Stop offset="50%" stopColor={colors[1]} />
          <Stop offset="100%" stopColor={colors[2]} />
        </RadialGradient>
      </Defs>
      <Path d={path} fill="url(#diamondGrad)" />
    </Svg>
  );
}

function CrystalShape({ size, colors }: { size: number; colors: string[] }) {
  // Multi-faceted crystal shape
  const cx = size / 2;
  const cy = size / 2;
  const path = `
    M ${cx} 4
    L ${size - 8} ${cy * 0.6}
    L ${size - 4} ${cy}
    L ${size - 8} ${cy * 1.4}
    L ${cx} ${size - 4}
    L 8 ${cy * 1.4}
    L 4 ${cy}
    L 8 ${cy * 0.6}
    Z
  `;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="crystalGrad" cx="40%" cy="30%" r="80%">
          <Stop offset="0%" stopColor={colors[0]} />
          <Stop offset="40%" stopColor={colors[1]} />
          <Stop offset="100%" stopColor={colors[2]} />
        </RadialGradient>
      </Defs>
      <Path d={path} fill="url(#crystalGrad)" />
      {/* Inner facet highlight */}
      <Path
        d={`M ${cx} 12 L ${cx + 15} ${cy * 0.7} L ${cx} ${cy} L ${cx - 15} ${cy * 0.7} Z`}
        fill="rgba(255,255,255,0.3)"
      />
    </Svg>
  );
}

function ShieldShape({ size, colors }: { size: number; colors: string[] }) {
  const path = `
    M ${size / 2} 4
    L ${size - 4} ${size * 0.25}
    L ${size - 4} ${size * 0.55}
    Q ${size - 4} ${size * 0.85} ${size / 2} ${size - 4}
    Q 4 ${size * 0.85} 4 ${size * 0.55}
    L 4 ${size * 0.25}
    Z
  `;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="shieldGrad" cx="50%" cy="25%" r="80%">
          <Stop offset="0%" stopColor={colors[0]} />
          <Stop offset="50%" stopColor={colors[1]} />
          <Stop offset="100%" stopColor={colors[2]} />
        </RadialGradient>
      </Defs>
      <Path d={path} fill="url(#shieldGrad)" />
    </Svg>
  );
}

// Floating particles effect
function FloatingParticles({
  size,
  color,
  count = 6,
}: {
  size: number;
  color: string;
  count?: number;
}) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2,
      distance: size * 0.4 + Math.random() * size * 0.15,
      particleSize: 3 + Math.random() * 3,
      delay: i * 200,
    }));
  }, [count, size]);

  return (
    <>
      {particles.map((p) => (
        <ParticleOrb
          key={p.id}
          angle={p.angle}
          distance={p.distance}
          size={p.particleSize}
          color={color}
          delay={p.delay}
          containerSize={size}
        />
      ))}
    </>
  );
}

function ParticleOrb({
  angle,
  distance,
  size,
  color,
  delay,
  containerSize,
}: {
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
  containerSize: number;
}) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const currentAngle = angle + progress.value * Math.PI * 2;
    const x = containerSize / 2 + Math.cos(currentAngle) * distance - size / 2;
    const y = containerSize / 2 + Math.sin(currentAngle) * distance - size / 2;

    return {
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      opacity: opacity.value,
    };
  });

  return <Animated.View style={animatedStyle} />;
}

// Radiating rays effect
function RadiatingRays({ size, color }: { size: number; color: string }) {
  const rayCount = 8;
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size * 1.4,
          height: size * 1.4,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
    >
      {Array.from({ length: rayCount }).map((_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: 2,
            height: size * 0.25,
            backgroundColor: color,
            opacity: 0.4,
            transform: [
              { rotate: `${(i / rayCount) * 360}deg` },
              { translateY: -size * 0.55 },
            ],
          }}
        />
      ))}
    </Animated.View>
  );
}

// Orbital rings effect
function OrbitalRings({ size, color }: { size: number; color: string }) {
  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);

  useEffect(() => {
    rotation1.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
    rotation2.value = withRepeat(
      withTiming(-360, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotateX: '70deg' }, { rotateZ: `${rotation1.value}deg` }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotateX: '70deg' }, { rotateY: '30deg' }, { rotateZ: `${rotation2.value}deg` }],
  }));

  return (
    <>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size * 1.3,
            height: size * 1.3,
            borderRadius: size * 0.65,
            borderWidth: 1.5,
            borderColor: color,
            opacity: 0.4,
          },
          ring1Style,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            borderWidth: 1,
            borderColor: color,
            opacity: 0.25,
          },
          ring2Style,
        ]}
      />
    </>
  );
}

export function MilestoneStone({
  milestone,
  size = 100,
  isLocked = false,
  isActive = false,
  animated = true,
  showLabel = true,
}: MilestoneStoneProps) {
  const { colors, animation, symbol, shape, effects } = milestone;

  // Animation values
  const scale = useSharedValue(isActive ? 1 : 0.85);
  const glowOpacity = useSharedValue(effects.glowIntensity);
  const rotation = useSharedValue(0);
  const floatY = useSharedValue(0);
  const shimmerX = useSharedValue(0);

  useEffect(() => {
    // Scale animation for active state
    scale.value = withSpring(isActive ? 1 : 0.85, { damping: 15, stiffness: 120 });

    if (!animated || isLocked) return;

    const { type, intensity, speed } = animation;
    const duration = 2000 / speed;

    switch (type) {
      case 'pulse':
        scale.value = withRepeat(
          withSequence(
            withTiming(1 + 0.05 * intensity, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        break;

      case 'rotate':
        rotation.value = withRepeat(
          withTiming(360, { duration: duration * 5, easing: Easing.linear }),
          -1,
          false
        );
        break;

      case 'float':
        floatY.value = withRepeat(
          withSequence(
            withTiming(-8 * intensity, { duration: duration, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: duration, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        break;

      case 'shimmer':
        shimmerX.value = withRepeat(
          withSequence(
            withTiming(1, { duration: duration, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: duration, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        break;

      case 'breathe':
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: duration, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.4, { duration: duration, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        scale.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: duration, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: duration, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        break;

      case 'orbit':
      case 'radiate':
        // These use dedicated effect components
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(effects.glowIntensity + 0.2, { duration: duration }),
            withTiming(effects.glowIntensity - 0.1, { duration: duration })
          ),
          -1,
          true
        );
        break;
    }
  }, [animated, isLocked, isActive, animation, effects.glowIntensity]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
      { translateY: floatY.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: isLocked ? 0.1 : glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0.4, 1], [1, 1.1]) }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerX.value, [0, 0.5, 1], [0.3, 0.8, 0.3]),
    transform: [{ translateX: interpolate(shimmerX.value, [0, 1], [-size * 0.3, size * 0.3]) }],
  }));

  // Render shape based on type
  const renderShape = () => {
    const gradientColors = isLocked
      ? ['#4A4A4A', '#3A3A3A', '#2A2A2A']
      : [colors.primary, colors.secondary, colors.accent];

    switch (shape) {
      case 'hexagon':
        return <HexagonShape size={size} colors={gradientColors} />;
      case 'diamond':
        return <DiamondShape size={size} colors={gradientColors} />;
      case 'crystal':
        return <CrystalShape size={size} colors={gradientColors} />;
      case 'shield':
        return <ShieldShape size={size} colors={gradientColors} />;
      case 'circle':
      default:
        return (
          <LinearGradient
            colors={gradientColors as [string, string, ...string[]]}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
          />
        );
    }
  };

  return (
    <View style={[styles.wrapper, { width: size * 1.6, height: size * 1.6 + (showLabel ? 50 : 0) }]}>
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: size * 0.7,
            backgroundColor: isLocked ? 'rgba(100, 100, 100, 0.2)' : colors.glow,
          },
          glowStyle,
        ]}
      />

      {/* Effects layer */}
      {!isLocked && effects.hasRings && <OrbitalRings size={size} color={colors.accent} />}
      {!isLocked && effects.hasRays && <RadiatingRays size={size} color={colors.accent} />}
      {!isLocked && effects.hasParticles && (
        <FloatingParticles size={size * 1.4} color={colors.accent} />
      )}

      {/* Main stone */}
      <Animated.View style={[styles.stoneContainer, containerStyle]}>
        {/* Shape */}
        <View style={styles.shapeContainer}>{renderShape()}</View>

        {/* Shimmer overlay */}
        {animation.type === 'shimmer' && !isLocked && (
          <Animated.View
            style={[
              styles.shimmer,
              {
                width: size * 0.4,
                height: size,
                borderRadius: size / 2,
              },
              shimmerStyle,
            ]}
          />
        )}

        {/* Symbol icon */}
        <View style={[styles.iconContainer, { width: size, height: size }]}>
          <SymbolIcon
            symbol={symbol}
            size={size * 0.35}
            color={isLocked ? '#666666' : '#FFFFFF'}
          />
        </View>

        {/* Day count badge - hide for Pro stone */}
        {milestone.day !== -1 && (
          <View
            style={[
              styles.badge,
              {
                bottom: size * 0.08,
                right: size * 0.08,
                backgroundColor: isLocked ? 'rgba(50, 50, 50, 0.8)' : 'rgba(0, 0, 0, 0.4)',
              },
            ]}
          >
            <Text style={[styles.badgeText, { fontSize: size * 0.12, color: isLocked ? '#888' : '#FFF' }]}>
              {milestone.day}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Label */}
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.stoneName, { color: isLocked ? '#666' : colors.secondary }]}>
            {milestone.name}
          </Text>
          <Text style={[styles.stoneSubtitle, { color: isLocked ? '#555' : 'rgba(255,255,255,0.6)' }]}>
            {milestone.subtitle}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  stoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shapeContainer: {
    position: 'absolute',
  },
  shimmer: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: 'Outfit_700Bold',
  },
  labelContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  stoneName: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
  },
  stoneSubtitle: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    marginTop: 2,
  },
});
