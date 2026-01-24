import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Unlock, Shield, ChevronRight } from 'lucide-react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { BlockedApp } from '@/lib/state/lumis-store';
import { LumisIcon } from '@/lib/screen-time';

interface LockedAppsCardProps {
  blockedApps: BlockedApp[];
  goalMinutes: number;
  todayMinutes: number;
  isGoalMet: boolean;
  onManageShield: () => void;
}

export function LockedAppsCard({
  blockedApps,
  goalMinutes,
  todayMinutes,
  isGoalMet,
  onManageShield,
}: LockedAppsCardProps) {
  const lockPulse = useSharedValue(1);
  const activeApps = blockedApps.filter(app => app.isBlocked);
  const remainingMinutes = Math.max(0, goalMinutes - todayMinutes);

  // Subtle pulse animation for the lock icon
  React.useEffect(() => {
    if (!isGoalMet && activeApps.length > 0) {
      lockPulse.value = withRepeat(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [isGoalMet, activeApps.length]);

  const lockAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lockPulse.value }],
  }));

  // No apps configured state
  if (activeApps.length === 0) {
    return (
      <Pressable onPress={onManageShield}>
        <View style={styles.emptyContainer}>
          <Shield size={24} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No apps shielded</Text>
          <Text style={styles.emptySubtitle}>Tap to select apps to block until your goal is met</Text>
          <View style={styles.setupButton}>
            <Text style={styles.setupButtonText}>Set Up Shield</Text>
            <ChevronRight size={16} color="#FFB347" />
          </View>
        </View>
      </Pressable>
    );
  }

  // Goal already met state
  if (isGoalMet) {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={styles.unlockedContainer}>
        <View style={styles.unlockedHeader}>
          <Unlock size={20} color="#22C55E" />
          <Text style={styles.unlockedTitle}>Apps Unlocked</Text>
        </View>
        <Text style={styles.unlockedSubtitle}>
          Great work! Your apps are available until tomorrow.
        </Text>
      </Animated.View>
    );
  }

  // Locked state - main card
  return (
    <Pressable onPress={onManageShield} style={styles.cardPressable}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 248, 240, 0.95)']}
        style={styles.container}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Animated.View style={[styles.lockIconContainer, lockAnimatedStyle]}>
            <Lock size={18} color="#DC2626" />
          </Animated.View>
          <Text style={styles.lockedTitle}>
            {activeApps.length} {activeApps.length === 1 ? 'app' : 'apps'} locked
          </Text>
        </View>

        {/* App Icons Row */}
        <View style={styles.appsRow}>
          {activeApps.slice(0, 4).map((app, index) => (
            <View key={app.id || `app-${index}`} style={styles.appIconContainer}>
              <View style={styles.appIcon}>
                <LumisIcon
                  style={{ width: 40, height: 40 }}
                  appName={app.name}
                  tokenData={(app as any).tokenData}
                  isCategory={!!app.isCategory}
                  size={40}
                  grayscale={true}
                />
              </View>
              <LumisIcon
                style={{ width: '100%', height: 16, marginTop: 4 }}
                appName={app.name}
                tokenData={(app as any).tokenData}
                isCategory={!!app.isCategory}
                variant="title"
                size={10}
                grayscale={true}
              />
            </View>
          ))}
          {activeApps.length > 4 && (
            <View style={styles.appIconContainer}>
              <View style={[styles.appIcon, styles.moreIcon]}>
                <Text style={styles.moreIconText}>+{activeApps.length - 4}</Text>
              </View>
              <Text style={styles.appName}>more</Text>
            </View>
          )}
        </View>

        {/* Unlock Requirement */}
        <View style={styles.requirementContainer}>
          <Text style={styles.requirementText}>
            Complete{' '}
            <Text style={styles.requirementHighlight}>{Math.round(remainingMinutes)} min</Text>
            {' '}of morning light to unlock
          </Text>
        </View>

        {/* Progress indicator if partial progress */}
        {todayMinutes > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min((todayMinutes / goalMinutes) * 100, 100)}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(todayMinutes)} / {Math.round(goalMinutes)} min
            </Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardPressable: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  container: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.15)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  lockedTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#DC2626',
  },
  appsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  appIconContainer: {
    alignItems: 'center',
    width: 56,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  appIconText: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#64748B',
  },
  appName: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  moreIcon: {
    backgroundColor: 'rgba(255, 179, 71, 0.2)',
  },
  moreIconText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFB347',
  },
  requirementContainer: {
    backgroundColor: 'rgba(255, 179, 71, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  requirementText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  requirementHighlight: {
    fontFamily: 'Outfit_700Bold',
    color: '#FF8C00',
  },
  progressContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFB347',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#64748B',
    marginTop: 6,
  },
  // Empty state
  emptyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setupButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFB347',
  },
  // Unlocked state
  unlockedContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  unlockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unlockedTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#22C55E',
  },
  unlockedSubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
});
