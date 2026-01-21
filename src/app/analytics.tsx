import React from 'react';
import { View, Text, Pressable, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Sun, Flame, Calendar, Trophy, Zap, Clock } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';

const { width } = Dimensions.get('window');

// Reusable Stat Component
// Reusable Stat Component
interface StatBoxProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: any;
  color: string;
}

const StatBox = ({ label, value, unit, icon: Icon, color }: StatBoxProps) => (
  <View style={styles.statBox}>
    <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
      <Icon size={20} color={color} />
    </View>
    <View>
      <Text style={styles.statValue}>
        {value}
        {unit && <Text style={styles.statUnit}> {unit}</Text>}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const currentStreak = useLumisStore((s) => s.currentStreak);
  const longestStreak = useLumisStore((s) => s.longestStreak);
  const totalDaysCompleted = useLumisStore((s) => s.totalDaysCompleted);
  const progressHistory = useLumisStore((s) => s.progressHistory);
  const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);
  const totalHoursInSunlight = useLumisStore((s) => s.totalHoursInSunlight);

  // Generate last 7 days data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayProgress = progressHistory.find((p) => p.date === dateStr);
    return {
      date: dateStr,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
      minutes: dayProgress?.lightMinutes ?? 0,
      completed: dayProgress?.completed ?? false,
    };
  });

  const maxMinutes = Math.max(...last7Days.map((d) => d.minutes), dailyGoalMinutes * 1.5, 30); // Prevent flat bars
  const totalMinutesThisWeek = last7Days.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={{ flex: 1, paddingTop: insets.top + 20 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Your light exposure journey</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        >
          {/* Main Chart Card */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>This Week</Text>
              <Text style={styles.cardValue}>{Math.round(totalMinutesThisWeek)} <Text style={styles.cardUnit}>mins</Text></Text>
            </View>

            <View style={styles.chartContainer}>
              {last7Days.map((day, index) => {
                const heightPercent = (day.minutes / maxMinutes) * 100;
                const isToday = index === 6;

                return (
                  <View key={day.date} style={styles.barColumn}>
                    <View style={styles.barTrack}>
                      <LinearGradient
                        colors={day.completed ? ['#FFB347', '#FF8C00'] : ['#A0C4FF', '#4A90D9']}
                        style={[
                          styles.barFill,
                          {
                            height: `${Math.max(heightPercent, 8)}%`,
                            opacity: day.minutes > 0 ? 1 : 0.3
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
                      {day.dayName}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statCard}>
              <StatBox
                icon={Flame}
                color="#FF6B35"
                value={currentStreak}
                label="Current Streak"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.statCard}>
              <StatBox
                icon={Trophy}
                color="#FFB347"
                value={longestStreak}
                label="Longest Streak"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.statCard}>
              <StatBox
                icon={Clock}
                color="#4A90D9"
                value={Math.round(totalHoursInSunlight)}
                unit="hrs"
                label="Total Time"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.statCard}>
              <StatBox
                icon={Calendar}
                color="#8B5CF6"
                value={totalDaysCompleted}
                label="Total Days"
              />
            </Animated.View>
          </View>

          {/* Goals Card */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Daily Goal</Text>
              <Pressable>
                <Text style={styles.editLink}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.goalRow}>
              <View style={styles.goalIconContainer}>
                <Sun size={24} color="#FF8C00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalLabel}>Morning Light</Text>
                <Text style={styles.goalSubtext}>{dailyGoalMinutes} minutes before 10 AM</Text>
              </View>
              <View style={styles.goalValue}>
                <Text style={styles.goalValueText}>{Math.round((progressHistory[progressHistory.length - 1]?.lightMinutes || 0) / dailyGoalMinutes * 100)}%</Text>
              </View>
            </View>

            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min((progressHistory[progressHistory.length - 1]?.lightMinutes || 0) / dailyGoalMinutes * 100, 100)}%` }
                ]}
              />
            </View>
          </Animated.View>

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#1A1A2E',
    opacity: 0.6,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
    opacity: 0.8,
  },
  cardValue: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  cardUnit: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#1A1A2E',
    opacity: 0.5,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 160,
    alignItems: 'flex-end',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    gap: 8,
  },
  barTrack: {
    width: 8,
    height: '85%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#1A1A2E',
    opacity: 0.4,
  },
  todayLabel: {
    color: '#FF8C00',
    opacity: 1,
    fontFamily: 'Outfit_700Bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 48 - 12) / 2, // 2 columns
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    padding: 16,
  },
  statBox: {
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  statUnit: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    opacity: 0.6,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#1A1A2E',
    opacity: 0.5,
  },
  editLink: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#4A90D9',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  goalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
  },
  goalSubtext: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#1A1A2E',
    opacity: 0.6,
  },
  goalValue: {
    alignItems: 'flex-end',
  },
  goalValueText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF8C00',
    borderRadius: 3,
  },
});
