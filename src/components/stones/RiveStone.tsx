import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Rive, { RiveRef, Fit, Alignment } from 'rive-react-native';
import { StoneMilestone } from './StoneTypes';

interface RiveStoneProps {
  milestone: StoneMilestone;
  size?: number;
  isLocked?: boolean;
  isActive?: boolean;
  showLabel?: boolean;
}

// Map milestone days to Rive animation state machine inputs
const getStoneStateMachine = (day: number): string => {
  switch (day) {
    case 1:
      return 'spark_state';
    case 7:
      return 'dawn_state';
    case 14:
      return 'fortnight_state';
    case 30:
      return 'lunar_state';
    case 60:
      return 'solar_state';
    case 100:
      return 'centurion_state';
    case 365:
      return 'eternal_state';
    case -1: // Pro stone
      return 'aurora_state';
    default:
      return 'spark_state';
  }
};

// Map milestone days to Rive file paths
// These files need to be created in Rive editor and placed in assets
const getRiveAsset = (day: number): string => {
  // For production, you would use different .riv files for each stone
  // For now, use a single file with state machines for different stones
  return 'lumis_stones'; // Will load from assets/lumis_stones.riv
};

export function RiveStone({
  milestone,
  size = 100,
  isLocked = false,
  isActive = false,
  showLabel = true,
}: RiveStoneProps) {
  const riveRef = useRef<RiveRef>(null);
  const { colors, day, name, subtitle } = milestone;

  useEffect(() => {
    if (riveRef.current) {
      // Set state machine inputs based on locked/active state
      try {
        riveRef.current.setInputState('state_machine', 'isLocked', isLocked);
        riveRef.current.setInputState('state_machine', 'isActive', isActive);
      } catch (e) {
        // Input may not exist in the Rive file
        console.log('Rive input not found:', e);
      }
    }
  }, [isLocked, isActive]);

  // Fallback to simple View if Rive file doesn't exist yet
  const renderFallback = () => (
    <View
      style={[
        styles.fallbackStone,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isLocked ? '#3A3A3A' : colors.primary,
          shadowColor: isLocked ? 'transparent' : colors.glow,
        },
      ]}
    >
      <Text style={[styles.fallbackDay, { fontSize: size * 0.25 }]}>
        {day === -1 ? 'PRO' : day}
      </Text>
    </View>
  );

  // Check if Rive assets are available
  // In production, you would have actual .riv files
  const hasRiveAssets = false; // Set to true once you have .riv files

  return (
    <View style={[styles.wrapper, { width: size * 1.6, height: size * 1.6 + (showLabel ? 50 : 0) }]}>
      {/* Glow effect */}
      {!isLocked && (
        <View
          style={[
            styles.glow,
            {
              width: size * 1.4,
              height: size * 1.4,
              borderRadius: size * 0.7,
              backgroundColor: colors.glow,
              opacity: isActive ? 0.6 : 0.3,
            },
          ]}
        />
      )}

      {/* Rive animation or fallback */}
      {hasRiveAssets ? (
        <Rive
          ref={riveRef}
          resourceName={getRiveAsset(day)}
          stateMachineName="state_machine"
          artboardName={getStoneStateMachine(day)}
          style={{ width: size, height: size }}
          fit={Fit.Contain}
          alignment={Alignment.Center}
          autoplay={!isLocked}
        />
      ) : (
        renderFallback()
      )}

      {/* Label */}
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.stoneName, { color: isLocked ? '#666' : colors.secondary }]}>
            {name}
          </Text>
          <Text style={[styles.stoneSubtitle, { color: isLocked ? '#555' : 'rgba(255,255,255,0.6)' }]}>
            {subtitle}
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
  fallbackStone: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fallbackDay: {
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
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

/*
 * RIVE SETUP INSTRUCTIONS:
 *
 * To create the stone animations in Rive:
 *
 * 1. Go to rive.app and create a new file
 *
 * 2. Create artboards for each stone type:
 *    - spark_state (Day 1) - warm pulse animation, flame icon
 *    - dawn_state (Day 7) - golden shimmer, sun icon
 *    - fortnight_state (Day 14) - floating flame, particle effects
 *    - lunar_state (Day 30) - orbital animation, moon glow
 *    - solar_state (Day 60) - rotating diamond, light rays
 *    - centurion_state (Day 100) - radiant crown, particle burst
 *    - eternal_state (Day 365) - breathing infinity, all effects
 *    - aurora_state (Pro) - prismatic shimmer, rainbow effects
 *
 * 3. Create a State Machine named "state_machine" with:
 *    - Boolean input: "isLocked" (controls locked/unlocked appearance)
 *    - Boolean input: "isActive" (controls active/inactive state)
 *    - Trigger input: "collect" (plays collection animation)
 *
 * 4. Design each stone with:
 *    - Base shape (circle/hexagon/diamond/crystal/shield)
 *    - Gradient fill using colors from StoneTypes.ts
 *    - Icon symbol in center (flame/sun/star/moon/diamond/crown/infinity)
 *    - Glow effects (use blur + opacity animations)
 *    - Particle effects (floating orbs, rays, rings)
 *
 * 5. Export as lumis_stones.riv and place in:
 *    - iOS: ios/[AppName]/lumis_stones.riv
 *    - Android: android/app/src/main/res/raw/lumis_stones.riv
 *
 * 6. Set hasRiveAssets = true in this file
 *
 * Rive Tips for Gem Effects:
 * - Use mesh deformation for liquid shimmer
 * - Layer multiple shapes with different blend modes
 * - Use timeline animations for breathing/pulsing
 * - Create procedural particle systems for floating orbs
 * - Use constraints for orbital ring animations
 */
