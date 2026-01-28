import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Share2, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useLumisStore } from '@/lib/state/lumis-store';
import { StoneCollection, STONE_MILESTONES, PRO_STONE, getMilestoneProgress } from '@/components/stones';
import type { StoneMilestone } from '@/components/stones';
import { MilestoneStone } from '@/components/stones/MilestoneStone';

export default function StoneGalleryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const collectedStones = useLumisStore((s) => s.collectedStones);
  const currentStreak = useLumisStore((s) => s.currentStreak);
  const isPremium = useLumisStore((s) => s.isPremium);
  const isTrialActive = useLumisStore((s) => s.isTrialActive());

  const hasPremiumAccess = isPremium || isTrialActive;

  const [selectedStone, setSelectedStone] = useState<StoneMilestone | null>(null);

  const { next, progress } = getMilestoneProgress(currentStreak);
  const totalStones = STONE_MILESTONES.length + (hasPremiumAccess ? 1 : 0);
  const totalCollected = collectedStones.length + (hasPremiumAccess ? 1 : 0);

  const handleStonePress = (milestone: StoneMilestone) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to stone detail screen
    router.push(`/stone-detail?day=${milestone.day}`);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await Share.share({
        message: `I've collected ${totalCollected}/${totalStones} milestone stones on Lumis! Currently on a ${currentStreak}-day streak. 🌅`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Check if selected stone is collected
  const isSelectedCollected = selectedStone
    ? selectedStone.day === -1
      ? hasPremiumAccess
      : collectedStones.includes(selectedStone.day)
    : false;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Stone Collection</Text>
          <Text style={styles.headerSubtitle}>
            {totalCollected}/{totalStones} collected
          </Text>
        </View>
        <Pressable onPress={handleShare} style={styles.shareButton}>
          <Share2 size={20} color="#FFFFFF" />
        </Pressable>
      </Animated.View>

      {/* Progress Summary */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.progressSection}
      >
        <View style={styles.progressStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{next - currentStreak}</Text>
            <Text style={styles.statLabel}>Days to Next</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(progress * 100)}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>
      </Animated.View>

      {/* Stone Carousel */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(400)}
        style={styles.carouselSection}
      >
        <StoneCollection
          collectedStones={collectedStones}
          currentStreak={currentStreak}
          isPro={hasPremiumAccess}
          onStonePress={handleStonePress}
          isDarkMode={true}
        />
      </Animated.View>

      {/* Selected Stone Detail */}
      {selectedStone && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={styles.detailSection}
        >
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={styles.detailStonePreview}>
                <MilestoneStone
                  milestone={selectedStone}
                  size={80}
                  isLocked={!isSelectedCollected}
                  isActive={true}
                  animated={isSelectedCollected}
                  showLabel={false}
                />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailName}>{selectedStone.name}</Text>
                <Text style={styles.detailSubtitle}>{selectedStone.subtitle}</Text>
                {isSelectedCollected ? (
                  <View style={styles.unlockedBadge}>
                    <Text style={styles.unlockedText}>UNLOCKED</Text>
                  </View>
                ) : (
                  <View style={styles.lockedBadge}>
                    <Lock size={12} color="#888" />
                    <Text style={styles.lockedText}>
                      {selectedStone.day === -1
                        ? 'Pro Member Exclusive'
                        : `${selectedStone.day - currentStreak} days away`}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.detailDescription}>{selectedStone.description}</Text>
          </View>
        </Animated.View>
      )}

      {/* Bottom Instructions */}
      <Animated.View
        entering={FadeIn.delay(400).duration(300)}
        style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}
      >
        <Text style={styles.instructionText}>
          Tap a stone to learn more. Complete your morning light goal each day to collect new milestone stones.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  shareButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  progressSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  progressStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#FFB347',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  carouselSection: {
    marginBottom: 24,
  },
  detailSection: {
    paddingHorizontal: 24,
    flex: 1,
  },
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailStonePreview: {
    marginRight: 16,
  },
  detailInfo: {
    flex: 1,
  },
  detailName: {
    fontSize: 22,
    fontFamily: 'Syne_700Bold',
    color: '#FFFFFF',
  },
  detailSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  unlockedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  unlockedText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: '#22C55E',
    letterSpacing: 0.5,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  lockedText: {
    fontSize: 11,
    fontFamily: 'Outfit_500Medium',
    color: '#888',
  },
  detailDescription: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  instructionText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
