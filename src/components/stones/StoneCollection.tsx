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
import { ChevronRight, Crown } from 'lucide-react-native';
import { MilestoneStone } from './MilestoneStone';
import {
  STONE_MILESTONES,
  PRO_STONE,
  StoneMilestone,
  getMilestoneProgress,
} from './StoneTypes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STONE_SIZE = 90;
const STONE_SPACING = 16;
const SNAP_INTERVAL = STONE_SIZE + STONE_SPACING;

interface StoneCollectionProps {
  collectedStones: number[];
  currentStreak: number;
  isPro?: boolean;
  onStonePress?: (milestone: StoneMilestone) => void;
  isDarkMode?: boolean;
}

export function StoneCollection({
  collectedStones,
  currentStreak,
  isPro = false,
  onStonePress,
  isDarkMode = true,
}: StoneCollectionProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);

  // Calculate progress to next milestone
  const { next, progress } = getMilestoneProgress(currentStreak);

  // Build complete stone list including Pro stone if applicable
  const allStones = isPro ? [PRO_STONE, ...STONE_MILESTONES] : STONE_MILESTONES;
  const totalCollected = collectedStones.length + (isPro ? 1 : 0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      scrollX.value = offsetX;
      const index = Math.round(offsetX / SNAP_INTERVAL);
      if (index !== activeIndex) {
        setActiveIndex(index);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [activeIndex]
  );

  const handleStonePress = (milestone: StoneMilestone, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Scroll to center the stone
    scrollViewRef.current?.scrollTo({
      x: index * SNAP_INTERVAL,
      animated: true,
    });

    onStonePress?.(milestone);
  };

  // Find the first locked milestone stone for the "next" indicator
  const nextLockedIndex = allStones.findIndex(
    (m) => m.day > 0 && !collectedStones.includes(m.day)
  );

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>
            Stone Collection
          </Text>
          <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
            {totalCollected} of {allStones.length} collected
          </Text>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <Text style={[styles.progressText, isDarkMode && styles.progressTextDark]}>
            {currentStreak} → {next}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Stone carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {allStones.map((milestone, index) => {
          // Pro stone is always unlocked for Pro users
          const isCollected = milestone.day === -1 ? isPro : collectedStones.includes(milestone.day);
          const isNext = index === nextLockedIndex;

          return (
            <Pressable
              key={milestone.day}
              onPress={() => handleStonePress(milestone, index)}
              style={[
                styles.stoneWrapper,
                isNext && styles.nextStoneWrapper,
              ]}
            >
              <MilestoneStone
                milestone={milestone}
                size={STONE_SIZE}
                isLocked={!isCollected}
                isActive={index === activeIndex}
                animated={isCollected}
                showLabel={true}
              />

              {/* "Next" indicator */}
              {isNext && (
                <View style={styles.nextBadge}>
                  <Text style={styles.nextBadgeText}>NEXT</Text>
                </View>
              )}

              {/* Pro badge for Pro stone */}
              {milestone.day === -1 && (
                <View style={styles.proBadge}>
                  <Crown size={10} color="#FFFFFF" />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </Pressable>
          );
        })}

        {/* End spacer */}
        <View style={{ width: SCREEN_WIDTH / 2 - STONE_SIZE }} />
      </ScrollView>

      {/* Page indicators */}
      <View style={styles.indicators}>
        {allStones.map((stone, index) => {
          const isCollected = stone.day === -1 ? isPro : collectedStones.includes(stone.day);
          return (
            <View
              key={index}
              style={[
                styles.indicator,
                index === activeIndex && styles.indicatorActive,
                isCollected && styles.indicatorCollected,
                stone.day === -1 && styles.indicatorPro,
              ]}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

// Compact version for dashboard card
export function StoneCollectionCard({
  collectedStones,
  currentStreak,
  isPro = false,
  onPress,
  isDarkMode = true,
}: {
  collectedStones: number[];
  currentStreak: number;
  isPro?: boolean;
  onPress?: () => void;
  isDarkMode?: boolean;
}) {
  const { next, progress } = getMilestoneProgress(currentStreak);
  const nextMilestone = STONE_MILESTONES.find((m) => m.day === next);

  // Build display list: Pro stone first (if Pro), then milestone stones
  const displayStones: StoneMilestone[] = isPro
    ? [PRO_STONE, ...STONE_MILESTONES.slice(0, 4)]
    : STONE_MILESTONES.slice(0, 5);

  const totalStones = STONE_MILESTONES.length + (isPro ? 1 : 0);
  const totalCollected = collectedStones.length + (isPro ? 1 : 0);
  const remainingCount = totalStones - displayStones.length;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={[
        styles.card,
        isDarkMode ? styles.cardDark : styles.cardLight,
      ]}
    >
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>
            Stone Collection
          </Text>
          <Text style={[styles.cardSubtitle, isDarkMode && styles.cardSubtitleDark]}>
            {totalCollected}/{totalStones} milestones
          </Text>
        </View>
        <ChevronRight size={20} color={isDarkMode ? '#888' : '#666'} />
      </View>

      {/* Stone preview row - first stone active, others greyed */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cardStonesScroll}
        contentContainerStyle={styles.cardStones}
      >
        {displayStones.map((milestone, index) => {
          // Pro stone is always unlocked for Pro users
          // First milestone stone (day 1) should show as collected if user has it
          const isCollected = milestone.day === -1
            ? isPro
            : collectedStones.includes(milestone.day);

          // First collected stone should be "active" (animated)
          const isFirstCollected = index === 0 || (index === 1 && isPro);

          return (
            <View key={milestone.day} style={styles.miniStoneWrapper}>
              <MilestoneStone
                milestone={milestone}
                size={48}
                isLocked={!isCollected}
                isActive={isCollected && isFirstCollected}
                animated={isCollected}
                showLabel={false}
              />
              {milestone.day === -1 && (
                <View style={styles.miniProBadge}>
                  <Crown size={8} color="#FFFFFF" />
                </View>
              )}
            </View>
          );
        })}
        {remainingCount > 0 && (
          <View style={styles.moreIndicator}>
            <Text style={styles.moreText}>+{remainingCount}</Text>
          </View>
        )}
      </ScrollView>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <View style={styles.cardProgress}>
          <View style={styles.cardProgressHeader}>
            <Text style={[styles.cardProgressLabel, isDarkMode && styles.cardProgressLabelDark]}>
              Next: {nextMilestone.name}
            </Text>
            <Text style={[styles.cardProgressDays, isDarkMode && styles.cardProgressDaysDark]}>
              {next - currentStreak} days away
            </Text>
          </View>
          <View style={styles.cardProgressBar}>
            <View
              style={[
                styles.cardProgressFill,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Full collection styles
  container: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    marginTop: 2,
  },
  subtitleDark: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FF8C00',
    marginBottom: 4,
  },
  progressTextDark: {
    color: '#FFB347',
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255, 140, 0, 0.2)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF8C00',
    borderRadius: 2,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingLeft: 24,
    paddingRight: SCREEN_WIDTH / 2,
  },
  stoneWrapper: {
    marginRight: STONE_SPACING,
    alignItems: 'center',
  },
  nextStoneWrapper: {
    // Add subtle emphasis for next stone
  },
  nextBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nextBadgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  proBadge: {
    position: 'absolute',
    top: -8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#7B68EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  proBadgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  indicatorActive: {
    width: 20,
    backgroundColor: '#FF8C00',
  },
  indicatorCollected: {
    backgroundColor: 'rgba(255, 140, 0, 0.5)',
  },
  indicatorPro: {
    backgroundColor: 'rgba(123, 104, 238, 0.5)',
  },

  // Card styles
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
  },
  cardTitleDark: {
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    marginTop: 2,
  },
  cardSubtitleDark: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  cardStonesScroll: {
    marginHorizontal: -4,
    marginBottom: 12,
  },
  cardStones: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 2,
  },
  miniStoneWrapper: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniProBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#7B68EE',
    padding: 3,
    borderRadius: 6,
  },
  moreIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  moreText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FF8C00',
  },
  cardProgress: {
    marginTop: 4,
  },
  cardProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardProgressLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: '#666',
  },
  cardProgressLabelDark: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cardProgressDays: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FF8C00',
  },
  cardProgressDaysDark: {
    color: '#FFB347',
  },
  cardProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  cardProgressFill: {
    height: '100%',
    backgroundColor: '#FF8C00',
    borderRadius: 3,
  },
});
