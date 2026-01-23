import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Sun, Flame, Zap, Shield, TrendingUp, Info } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';

const { width } = Dimensions.get('window');

// --- Types & Helpers ---
const TARGET_ANCHOR_HOUR = 7;
const TARGET_ANCHOR_MINUTE = 15;
const TARGET_ANCHOR_TIME_STRING = "7:15 AM";

// Helper to calculate consistency score (0-100)
const calculateCircadianConsistency = (history: any[]) => {
  if (!history || history.length === 0) return 0;

  // Get last 7 sessions
  const recentSessions = history.slice(0, 7);
  let totalDeviation = 0;
  let sessionCount = 0;

  recentSessions.forEach(session => {
    if (!session.startTime) return;
    const date = new Date(session.startTime);
    const hour = date.getHours();
    const minute = date.getMinutes();

    // Convert to minutes from midnight
    const sessionMinutes = hour * 60 + minute;
    const targetMinutes = TARGET_ANCHOR_HOUR * 60 + TARGET_ANCHOR_MINUTE;

    // Deviation in minutes
    const deviation = Math.abs(sessionMinutes - targetMinutes);
    totalDeviation += deviation;
    sessionCount++;
  });

  if (sessionCount === 0) return 0;

  const avgDeviation = totalDeviation / sessionCount;
  // Formula: 100 - (deviation / 2), capped at 0. ex: 30min deviation = 85% score
  return Math.max(0, Math.round(100 - (avgDeviation / 2)));
};

// Helper to calculate Lux Volume (kLx-h)
const calculateLuxVolume = (history: any[]) => {
  // Sum of (lux * hours)
  let totalLuxSeconds = 0;
  history.forEach(session => {
    const lux = session.lux || 0;
    const seconds = session.durationSeconds || 0;
    totalLuxSeconds += (lux * seconds);
  });

  // Convert to kLx-h (KiloLux-Hours)
  // 1 kLx-h = 1000 lux for 1 hour
  const kLxh = totalLuxSeconds / 3600 / 1000;
  return Math.round(kLxh * 10) / 10; // 1 decimal
};


// Reusable Stat Component
interface StatBoxProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: any;
  color: string;
  highlight?: boolean;
}

const StatBox = ({ label, value, unit, icon: Icon, color, highlight }: StatBoxProps) => (
  <View style={[styles.statBox, highlight && styles.statBoxHighlight]}>
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

  const activityHistory = useLumisStore((s) => s.activityHistory);
  const progressHistory = useLumisStore((s) => s.progressHistory);
  const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);
  const daysWithoutEmergencyUnlock = useLumisStore((s) => s.daysWithoutEmergencyUnlock);

  // --- Derived Metrics ---
  const calculatedConsistency = useMemo(() => calculateCircadianConsistency(activityHistory), [activityHistory]);
  const luxVolume = useMemo(() => calculateLuxVolume(activityHistory), [activityHistory]);

  const totalDaysTracked = progressHistory.length || 1;
  const daysGoalMet = progressHistory.filter(p => p.completed).length;
  const anchorStatusPercent = Math.round((daysGoalMet / totalDaysTracked) * 100);

  // --- Insight Logic ---
  const insightText = useMemo(() => {
    if (calculatedConsistency < 50) return "Your wake window is drifting. Anchoring 20 minutes earlier this week will reset your rhythm.";
    if (calculatedConsistency < 80) return "You're building momentum. Try to hit your 7:15 AM target for 3 days in a row.";
    return "Your biological clock is perfectly synced. Keep maintaining this solid 7:15 AM anchor.";
  }, [calculatedConsistency]);


  // --- Chart Data (This Week) ---
  const weekData = useMemo(() => {
    const days = [];
    const today = new Date();
    // Start from Monday of current week or just last 7 days? 
    // Let's do a fixed Mon-Sun view for "Ghost Bars" effect
    const currentDay = today.getDay(); // 0 is Sun
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const isFuture = date > today;
      const isToday = dateStr === today.toISOString().split('T')[0];

      const historyEntry = progressHistory.find(p => p.date === dateStr);
      // Find peak lux for this day from activity history
      const daySessions = activityHistory.filter(s => s.startTime.startsWith(dateStr));
      const peakLux = daySessions.length > 0 ? Math.max(...daySessions.map(s => s.lux || 0)) : 0;

      days.push({
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        minutes: historyEntry?.lightMinutes || 0,
        completed: historyEntry?.completed || false,
        isFuture,
        isToday,
        peakLux
      });
    }
    return days;
  }, [progressHistory, activityHistory]);

  const maxChartMinutes = Math.max(20, ...weekData.map(d => d.minutes));

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
          <Text style={styles.headerTitle}>Biological Insights</Text>
          <Text style={styles.headerSubtitle}>Optimize your circadian rhythm</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        >
          {/* Main Chart Card: "The Biological Win" */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Biological Anchor</Text>
              <View style={styles.targetBadge}>
                <Text style={styles.targetText}>Target: 16 min</Text>
              </View>
            </View>

            <View style={styles.chartContainer}>

              {/* Anchor Line */}
              <View style={[styles.anchorLine, { bottom: `${(16 / maxChartMinutes) * 100}%` }]} />
              <Text style={[styles.anchorLabel, { bottom: `${(16 / maxChartMinutes) * 100 + 2}%` }]}>GOAL</Text>

              {weekData.map((day, index) => {
                const heightPercent = Math.min((day.minutes / maxChartMinutes) * 100, 100);
                const isGoalMet = day.minutes >= 16;

                return (
                  <View key={index} style={styles.barColumn}>
                    {/* Peak Lux Dot */}
                    {day.peakLux > 5000 && (
                      <View style={[styles.peakLuxDot, { bottom: `${heightPercent + 5}%` }]} />
                    )}

                    <View style={[
                      styles.barTrack,
                      day.isFuture && styles.ghostBarTrack
                    ]}>
                      {!day.isFuture && (
                        <LinearGradient
                          colors={isGoalMet ? ['#FFB347', '#FF8C00'] : ['#A0C4FF', '#4A90D9']}
                          style={[
                            styles.barFill,
                            {
                              height: `${Math.max(heightPercent, 5)}%`, // Min height for visibility
                              opacity: day.minutes > 0 ? 1 : 0.3
                            }
                          ]}
                        />
                      )}
                    </View>
                    <Text style={[styles.dayLabel, day.isToday && styles.todayLabel]}>
                      {day.dayName}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Insight Coach Card */}
            <View style={styles.insightBox}>
              <View style={styles.insightIcon}>
                <Info size={16} color="#4A90D9" />
              </View>
              <Text style={styles.insightText}>
                <Text style={{ fontFamily: 'Outfit_700Bold' }}>Morning Outlook: </Text>
                {insightText}
              </Text>
            </View>
          </Animated.View>

          {/* Biological Stats Grid */}
          <View style={styles.statsGrid}>

            {/* 1. Circadian Consistency */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statCard}>
              <StatBox
                icon={calculatedConsistency >= 80 ? Flame : Sun}
                color={calculatedConsistency >= 80 ? "#4CAF50" : "#FFB347"}
                value={`${calculatedConsistency}%`}
                label="Consistency"
                highlight={calculatedConsistency >= 80}
              />
            </Animated.View>

            {/* 2. Lux Volume */}
            <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.statCard}>
              <StatBox
                icon={Zap}
                color="#FFD700"
                value={luxVolume}
                unit="kLx-h"
                label="Lux Volume"
              />
            </Animated.View>

            {/* 3. Cortisol Anchor Status */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.statCard}>
              <StatBox
                icon={TrendingUp}
                color="#8B5CF6"
                value={`${anchorStatusPercent}%`}
                label="Anchor Status"
              />
            </Animated.View>

            {/* 4. Shield Strength */}
            <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.statCard}>
              <StatBox
                icon={Shield}
                color="#4A90D9"
                value={daysWithoutEmergencyUnlock}
                unit="days"
                label="Shield Strength"
              />
            </Animated.View>
          </View>

          {/* Target Info */}
          <Text style={styles.footerNote}>
            Target Anchor Time: {TARGET_ANCHOR_TIME_STRING} • San Diego, CA
          </Text>

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
    fontSize: 28,
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  targetBadge: {
    backgroundColor: 'rgba(255, 179, 71, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  targetText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FF8C00',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 180,
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  anchorLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#FF8C00',
    opacity: 0.3,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#FF8C00',
  },
  anchorLabel: {
    position: 'absolute',
    right: 0,
    fontSize: 10,
    color: '#FF8C00',
    fontFamily: 'Outfit_700Bold',
    opacity: 0.6
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    gap: 8,
    position: 'relative',
  },
  peakLuxDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    position: 'absolute',
    shadowColor: '#FFD700',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  barTrack: {
    width: 12,
    height: '85%',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  ghostBarTrack: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
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
  insightBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start'
  },
  insightIcon: {
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#334E68',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
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
  statBoxHighlight: {
    // 
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
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
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    opacity: 0.5,
    marginTop: 8,
  }
});
