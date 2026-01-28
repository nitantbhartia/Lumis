import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { DailyProgress } from '@/lib/state/lumis-store';

interface StreakCalendarStripProps {
  progressHistory: DailyProgress[];
  currentStreak: number;
  onPress?: () => void;
}

const getDayLabel = (daysAgo: number): string => {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Y';
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()];
};

const getDateString = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// Animated pulsing dot for "Today" when incomplete
function PulsingTodayDot({ isCompleted }: { isCompleted: boolean }) {
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (!isCompleted) {
      // Pulse animation to draw attention
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [isCompleted]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (isCompleted) {
    return (
      <View style={[styles.dayDot, styles.dayDotCompleted]}>
        <View style={styles.checkmark} />
      </View>
    );
  }

  return (
    <View style={styles.todayDotContainer}>
      {/* Glow ring */}
      <Animated.View style={[styles.todayGlow, glowStyle]} />
      {/* Pulsing dot */}
      <Animated.View style={[styles.dayDot, styles.dayDotTodayPulsing, pulseStyle]}>
        <View style={styles.todayInnerRing} />
      </Animated.View>
    </View>
  );
}

export function StreakCalendarStrip({
  progressHistory,
  currentStreak,
  onPress,
}: StreakCalendarStripProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  // Build a map of completed dates for quick lookup
  const completedDates = useMemo(() => {
    const dates = new Set<string>();
    progressHistory.forEach((p) => {
      if (p.completed) {
        dates.add(p.date);
      }
    });
    return dates;
  }, [progressHistory]);

  // Generate last 7 days - TODAY FIRST, then going back in time
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const daysAgo = i; // Today is index 0, yesterday is 1, etc.
      const dateStr = getDateString(daysAgo);
      const isCompleted = completedDates.has(dateStr);
      const isToday = daysAgo === 0;

      return {
        daysAgo,
        dateStr,
        label: getDayLabel(daysAgo),
        isCompleted,
        isToday,
      };
    });
  }, [completedDates]);

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.header}>
        <Text style={styles.title}>This Week</Text>
        <Text style={styles.streakBadge}>{currentStreak} day streak</Text>
      </View>
      <View style={styles.daysRow}>
        {days.map((day) => (
          <View key={day.dateStr} style={styles.dayColumn}>
            <Text
              style={[
                styles.dayLabel,
                day.isToday && styles.dayLabelToday,
              ]}
            >
              {day.label}
            </Text>
            {day.isToday ? (
              <PulsingTodayDot isCompleted={day.isCompleted} />
            ) : (
              <View
                style={[
                  styles.dayDot,
                  day.isCompleted && styles.dayDotCompleted,
                ]}
              >
                {day.isCompleted && <View style={styles.checkmark} />}
              </View>
            )}
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  streakBadge: {
    fontSize: 11,
    fontFamily: 'Outfit_500Medium',
    color: '#FF8C00',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  dayLabelToday: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_700Bold',
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotCompleted: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  todayDotContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayGlow: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF8C00',
  },
  dayDotTodayPulsing: {
    borderColor: '#FF8C00',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
  },
  todayInnerRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8C00',
  },
  checkmark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
});
