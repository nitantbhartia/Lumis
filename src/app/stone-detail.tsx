import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Share, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Share2, Check, Lock, X, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { useLumisStore } from '@/lib/state/lumis-store';
import { MilestoneStone } from '@/components/stones/MilestoneStone';
import { STONE_MILESTONES, PRO_STONE, getStoneForDay } from '@/components/stones/StoneTypes';
import type { StoneMilestone } from '@/components/stones/StoneTypes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Simulated rarity percentages (in production, fetch from server)
const RARITY_DATA: Record<number, number> = {
  1: 100, // Everyone who starts gets day 1
  7: 68,
  14: 45,
  30: 27,
  60: 15,
  100: 8,
  365: 2,
  [-1]: 12, // Pro stone
};

export default function StoneDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ day: string }>();

  const collectedStones = useLumisStore((s) => s.collectedStones);
  const currentStreak = useLumisStore((s) => s.currentStreak);
  const isPremium = useLumisStore((s) => s.isPremium);
  const isTrialActive = useLumisStore((s) => s.isTrialActive());
  const firstSessionDate = useLumisStore((s) => s.firstSessionDate);

  const hasPremiumAccess = isPremium || isTrialActive;

  // Parse the day parameter
  const stoneDay = parseInt(params.day || '1', 10);

  // Find the stone
  const stone: StoneMilestone | undefined =
    stoneDay === -1 ? PRO_STONE : getStoneForDay(stoneDay);

  if (!stone) {
    return null;
  }

  // Check if collected
  const isCollected = stoneDay === -1 ? hasPremiumAccess : collectedStones.includes(stoneDay);

  // Calculate unlock date (approximate based on first session + days)
  const getUnlockDate = (): string | null => {
    if (!isCollected || !firstSessionDate) return null;

    if (stoneDay === -1) {
      // Pro stone - use current date as unlock
      return new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }

    const startDate = new Date(firstSessionDate);
    const unlockDate = new Date(startDate);
    unlockDate.setDate(startDate.getDate() + stoneDay - 1);

    return unlockDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get days until unlock
  const getDaysUntil = (): number => {
    if (isCollected) return 0;
    if (stoneDay === -1) return 0; // Pro requires subscription
    return Math.max(0, stoneDay - currentStreak);
  };

  const unlockDate = getUnlockDate();
  const daysUntil = getDaysUntil();
  const rarityPercent = RARITY_DATA[stoneDay] || 50;

  // Glow animation
  const glowAnim = useSharedValue(0);

  useEffect(() => {
    if (isCollected) {
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [isCollected]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.3, 0.7]),
    transform: [{ scale: interpolate(glowAnim.value, [0, 1], [1, 1.15]) }],
  }));

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const message = isCollected
      ? `I unlocked the "${stone.name}" milestone stone on Lumis! 🌅 ${stone.description}`
      : `I'm working toward the "${stone.name}" milestone on Lumis - ${daysUntil} days to go! 🌅`;

    try {
      await Share.share({ message });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Get requirement text based on stone type
  const getRequirementText = (): string => {
    if (stoneDay === -1) {
      return 'Become a Lumis Pro subscriber';
    }
    switch (stoneDay) {
      case 1:
        return 'Complete your first morning light session';
      case 7:
        return 'Maintain a 7-day streak';
      case 14:
        return 'Keep your streak alive for 2 weeks';
      case 30:
        return 'One full month of dedication';
      case 60:
        return 'Two months of morning light mastery';
      case 100:
        return 'Reach the 100-day milestone';
      case 365:
        return 'Complete a full year of sunrise ritual';
      default:
        return `Maintain a ${stoneDay}-day streak`;
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[
          'rgba(15, 23, 42, 0.98)',
          isCollected ? stone.colors.glow.replace('0.5', '0.15').replace('0.6', '0.15').replace('0.7', '0.15') : 'rgba(15, 23, 42, 0.98)',
          'rgba(15, 23, 42, 0.98)',
        ]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />

      {/* Close button */}
      <Pressable
        onPress={handleClose}
        style={[styles.closeButton, { top: insets.top + 12 }]}
      >
        <View style={styles.closeButtonInner}>
          <X size={20} color="#FFFFFF" />
        </View>
      </Pressable>

      {/* Share button */}
      <Pressable
        onPress={handleShare}
        style={[styles.shareButton, { top: insets.top + 12 }]}
      >
        <Share2 size={20} color="#FFFFFF" />
      </Pressable>

      {/* Main content */}
      <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
        {/* Title */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.titleSection}>
          <Text style={styles.stoneTitle}>{stone.name.toUpperCase()}</Text>
          <Text style={styles.stoneSubtitle}>{getRequirementText()}</Text>

          {/* Rarity badge */}
          <View style={styles.rarityBadge}>
            <Trophy size={14} color="#FFD700" />
            <Text style={styles.rarityText}>Owned by {rarityPercent}%</Text>
          </View>
        </Animated.View>

        {/* Stone display */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.stoneSection}
        >
          {/* Glow effect behind stone */}
          {isCollected && (
            <Animated.View
              style={[
                styles.stoneGlow,
                { backgroundColor: stone.colors.glow },
                glowStyle,
              ]}
            />
          )}

          {/* Stone */}
          <View style={styles.stoneWrapper}>
            <MilestoneStone
              milestone={stone}
              size={180}
              isLocked={!isCollected}
              isActive={true}
              animated={isCollected}
              showLabel={false}
            />
          </View>

          {/* Pedestal */}
          <View style={styles.pedestal}>
            <LinearGradient
              colors={['#2A2A3E', '#1A1A2E', '#0A0A1E']}
              style={styles.pedestalGradient}
            />
          </View>
        </Animated.View>

        {/* Unlock status */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={styles.statusSection}
        >
          {isCollected ? (
            <View style={styles.unlockedStatus}>
              <Check size={18} color="#22C55E" />
              <Text style={styles.unlockedText}>
                Unlocked on {unlockDate}
              </Text>
            </View>
          ) : (
            <View style={styles.lockedStatus}>
              <Lock size={18} color="#888" />
              <Text style={styles.lockedText}>
                {stoneDay === -1
                  ? 'Unlock with Lumis Pro subscription'
                  : `${daysUntil} days away`}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Description */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(400)}
          style={styles.descriptionSection}
        >
          <Text style={styles.descriptionText}>{stone.description}</Text>
        </Animated.View>
      </View>

      {/* Bottom action */}
      <Animated.View
        entering={FadeInUp.delay(600).duration(400)}
        style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}
      >
        {isCollected ? (
          <View style={styles.currentGemButton}>
            <Check size={20} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.currentGemText}>Collected</Text>
          </View>
        ) : stoneDay === -1 ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(tabs)/premium');
            }}
            style={styles.upgradeButton}
          >
            <LinearGradient
              colors={['#7B68EE', '#9370DB']}
              style={styles.upgradeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.upgradeText}>Upgrade to Pro</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <View style={styles.progressInfo}>
            <Text style={styles.progressInfoText}>
              Keep your streak going to unlock this stone
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, (currentStreak / stoneDay) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressCount}>
              {currentStreak} / {stoneDay} days
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    zIndex: 100,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stoneTitle: {
    fontSize: 28,
    fontFamily: 'Syne_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  stoneSubtitle: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 8,
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  rarityText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFD700',
  },
  stoneSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
    marginBottom: 24,
  },
  stoneGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  stoneWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pedestal: {
    width: 100,
    height: 24,
    marginTop: -10,
    overflow: 'hidden',
    borderRadius: 50,
  },
  pedestalGradient: {
    flex: 1,
  },
  statusSection: {
    marginBottom: 20,
  },
  unlockedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unlockedText: {
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
    color: '#22C55E',
  },
  lockedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockedText: {
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
    color: '#888',
  },
  descriptionSection: {
    paddingHorizontal: 40,
  },
  descriptionText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 24,
  },
  currentGemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentGemText: {
    fontSize: 17,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  upgradeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  upgradeText: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  progressInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  progressInfoText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF8C00',
    borderRadius: 4,
  },
  progressCount: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFB347',
    marginTop: 10,
  },
});
