import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Crown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MilestoneStone } from './MilestoneStone';
import {
  STONE_MILESTONES,
  PRO_STONE,
  StoneMilestone,
} from './StoneTypes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CENTER_STONE_SIZE = 130; // Zoomed out center stone
const SIDE_STONE_SIZE = 70; // Smaller side stones
const ITEM_WIDTH = CENTER_STONE_SIZE + 30;

interface StoneHeroCarouselProps {
  collectedStones: number[];
  currentStreak: number;
  isPro?: boolean;
  onStonePress?: (milestone: StoneMilestone) => void;
}

export function StoneHeroCarousel({
  collectedStones,
  currentStreak,
  isPro = false,
  onStonePress,
}: StoneHeroCarouselProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);

  // Build complete stone list - Pro stone first if applicable
  const allStones = isPro ? [PRO_STONE, ...STONE_MILESTONES] : STONE_MILESTONES;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      scrollX.value = offsetX;
      const index = Math.round(offsetX / ITEM_WIDTH);
      if (index !== activeIndex && index >= 0 && index < allStones.length) {
        setActiveIndex(index);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [activeIndex, allStones.length]
  );

  const handleStonePress = (milestone: StoneMilestone, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scrollViewRef.current?.scrollTo({
      x: index * ITEM_WIDTH,
      animated: true,
    });
    setActiveIndex(index);
    onStonePress?.(milestone);
  };

  // Find the first locked milestone stone for the "next" indicator
  const nextLockedIndex = allStones.findIndex(
    (m) => m.day > 0 && !collectedStones.includes(m.day)
  );

  // Get active stone info
  const activeStone = allStones[activeIndex];
  const isActiveCollected = activeStone?.day === -1
    ? isPro
    : collectedStones.includes(activeStone?.day || 0);

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Background glow that emits from the center stone */}
      {activeStone && (
        <View style={styles.glowContainer}>
          <View
            style={[
              styles.backgroundGlow,
              {
                backgroundColor: isActiveCollected
                  ? activeStone.colors.glow
                  : 'rgba(100, 100, 120, 0.3)',
                shadowColor: activeStone.colors.primary,
              }
            ]}
          />
          <View
            style={[
              styles.backgroundGlowInner,
              {
                backgroundColor: isActiveCollected
                  ? activeStone.colors.primary
                  : 'rgba(80, 80, 100, 0.2)',
              }
            ]}
          />
        </View>
      )}

      {/* Stone carousel with 3D depth effect */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        snapToAlignment="center"
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {allStones.map((milestone, index) => {
          const isCollected = milestone.day === -1 ? isPro : collectedStones.includes(milestone.day);
          const isNext = index === nextLockedIndex;
          const isActive = index === activeIndex;

          // Calculate distance from center for 3D effect
          const distanceFromCenter = Math.abs(index - activeIndex);
          const scale = isActive ? 1 : Math.max(0.5, 1 - distanceFromCenter * 0.3);
          const opacity = isActive ? 1 : Math.max(0.35, 1 - distanceFromCenter * 0.4);
          const zIndex = isActive ? 10 : 10 - distanceFromCenter;
          // Push side stones back and slightly down
          const translateY = isActive ? 0 : 30 + distanceFromCenter * 15;

          return (
            <Pressable
              key={milestone.day}
              onPress={() => handleStonePress(milestone, index)}
              style={[
                styles.stoneItem,
                {
                  zIndex,
                  transform: [
                    { scale },
                    { translateY },
                  ],
                  opacity,
                },
              ]}
            >
              <MilestoneStone
                milestone={milestone}
                size={isActive ? CENTER_STONE_SIZE : SIDE_STONE_SIZE}
                isLocked={!isCollected}
                isActive={isActive}
                animated={isCollected && isActive}
                showLabel={false}
              />

              {/* Pro badge for Pro stone */}
              {milestone.day === -1 && isActive && (
                <View style={styles.proBadge}>
                  <Crown size={12} color="#FFFFFF" />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}

              {/* Pedestal/shadow for active stone */}
              {isActive && (
                <View style={styles.pedestal}>
                  <LinearGradient
                    colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)'] as [string, string]}
                    style={styles.pedestalGradient}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Stone info is now shown only on tap via onStonePress callback */}

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    marginLeft: -24,
    paddingTop: 8,
    paddingBottom: 12,
    overflow: 'visible',
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundGlow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: SCREEN_WIDTH * 0.35,
    opacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
  },
  backgroundGlowInner: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.35,
    height: SCREEN_WIDTH * 0.35,
    borderRadius: SCREEN_WIDTH * 0.175,
    opacity: 0.5,
  },
  scrollView: {
    flexGrow: 0,
    overflow: 'visible',
  },
  scrollContent: {
    paddingLeft: (SCREEN_WIDTH - ITEM_WIDTH) / 2,
    paddingRight: (SCREEN_WIDTH - ITEM_WIDTH) / 2,
    alignItems: 'center',
    height: CENTER_STONE_SIZE + 70,
  },
  stoneItem: {
    width: ITEM_WIDTH,
    height: CENTER_STONE_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadge: {
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7B68EE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  proBadgeText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  pedestal: {
    position: 'absolute',
    bottom: 5,
    width: 90,
    height: 24,
    borderRadius: 45,
    overflow: 'hidden',
  },
  pedestalGradient: {
    flex: 1,
  },
});
