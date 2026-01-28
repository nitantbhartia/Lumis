import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  FadeIn,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, Flame, Unlock } from 'lucide-react-native';

interface CompletedGoalHeroProps {
  lightMinutes: number;
  currentStreak: number;
  unlockedAppsCount: number;
  nextMilestone?: {
    daysUntil: number;
    title: string;
  } | null;
}

export function CompletedGoalHero({
  lightMinutes,
  currentStreak,
  unlockedAppsCount,
  nextMilestone,
}: CompletedGoalHeroProps) {
  const sunScale = useSharedValue(0);
  const sunRotate = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    // Animate sun entrance
    sunScale.value = withDelay(
      200,
      withSpring(1, { damping: 12, stiffness: 100 })
    );

    // Sun rotation
    sunRotate.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    // Glow animation
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sunScale.value }, { rotate: `${sunRotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.15, 0.4]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.2]) }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Animated Sun */}
      <View style={styles.sunContainer}>
        <Animated.View
          style={[
            glowStyle,
            {
              position: 'absolute',
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: '#FFB347',
            },
          ]}
        />

        <Animated.View style={sunStyle}>
          <LinearGradient
            colors={['#FFE4B5', '#FFB347', '#FF8C00']}
            style={styles.sunGradient}
          >
            <Sun size={40} color="#1A1A2E" strokeWidth={1.5} />
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Completion Message */}
      <Text style={styles.checkmark}>✓</Text>
      <Text style={styles.title}>Goal Complete</Text>
      <Text style={styles.subtitle}>
        {Math.round(lightMinutes)} minutes of light today
      </Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Flame size={20} color="#FF8C00" />
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        <View style={styles.statCard}>
          <Unlock size={20} color="#4ADE80" />
          <Text style={styles.statValueGreen}>{unlockedAppsCount}</Text>
          <Text style={styles.statLabel}>Apps Unlocked</Text>
        </View>
      </View>

      {/* Next Milestone Preview */}
      {nextMilestone && (
        <View style={styles.milestoneContainer}>
          <Text style={styles.milestoneText}>
            {nextMilestone.daysUntil} {nextMilestone.daysUntil === 1 ? 'day' : 'days'} to{' '}
            <Text style={styles.milestoneHighlight}>{nextMilestone.title}</Text>
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  sunContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    height: 100,
    width: 100,
  },
  sunGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  checkmark: {
    fontSize: 32,
    color: '#22C55E',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Outfit_700Bold',
    color: '#22C55E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: '#64748B',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingHorizontal: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#FF8C00',
    marginTop: 6,
  },
  statValueGreen: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#4ADE80',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_500Medium',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  milestoneContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 179, 71, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.2)',
  },
  milestoneText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  milestoneHighlight: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#FF8C00',
  },
});
