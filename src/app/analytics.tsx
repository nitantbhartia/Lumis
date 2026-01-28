import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sun, Flame, Calendar, Clock, Trophy, HelpCircle, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useLumisStore } from '@/lib/state/lumis-store';
import { useWeather } from '@/lib/hooks/useWeather';
import CalendarModal from '../components/CalendarModal';

const GOAL_MINUTES = 2; // Fixed goal matching dashboard

// Metric explanations
const METRIC_INFO: Record<string, { title: string; description: string }> = {
  streak: {
    title: 'Current Streak',
    description: 'The number of consecutive days you\'ve completed your morning light goal. Missing a day resets it to zero.',
  },
  totalMinutes: {
    title: 'Total Minutes',
    description: 'The total time you\'ve spent getting morning light across all your sessions.',
  },
  daysTracked: {
    title: 'Days Tracked',
    description: 'The number of days you\'ve used Lumis to track your morning light exposure.',
  },
  goalsMet: {
    title: 'Goals Met',
    description: 'The percentage of tracked days where you successfully completed your morning light goal.',
  },
  daysCompleted: {
    title: 'Days Completed',
    description: 'The total number of days you\'ve successfully met your morning light goal.',
  },
};

// Info Modal Component
interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
  metricKey: string | null;
}

const InfoModal = ({ visible, onClose, metricKey }: InfoModalProps) => {
  const insets = useSafeAreaInsets();
  const info = metricKey ? METRIC_INFO[metricKey] : null;

  if (!info) return null;

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalContent, { marginBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalIconWrap}>
              <HelpCircle size={20} color="#FF6B35" />
            </View>
            <Text style={styles.modalTitle}>{info.title}</Text>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={20} color="#999" />
            </Pressable>
          </View>
          <Text style={styles.modalDescription}>{info.description}</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const weather = useWeather();
  const [showCalendar, setShowCalendar] = useState(false);
  const [infoModalKey, setInfoModalKey] = useState<string | null>(null);

  const isDarkMode = !weather.isDaylight;
  const backgroundColor = '#0F172A'; // Match dashboard dark theme

  const showInfo = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInfoModalKey(key);
  };

  // Store data
  const currentStreak = useLumisStore((s) => s.currentStreak);
  const longestStreak = useLumisStore((s) => s.longestStreak);
  const progressHistory = useLumisStore((s) => s.progressHistory);

  // Derived metrics
  const totalDaysTracked = progressHistory.length || 0;
  const daysGoalMet = progressHistory.filter((p) => p.completed).length;
  const goalRate = totalDaysTracked > 0 ? Math.round((daysGoalMet / totalDaysTracked) * 100) : 0;
  const totalMinutes = progressHistory.reduce((sum, p) => sum + (p.lightMinutes || 0), 0);

  // Weekly chart data
  const weekData = useMemo(() => {
    const days = [];
    const today = new Date();
    const currentDay = today.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const isFuture = date > today;
      const isToday = dateStr === today.toISOString().split('T')[0];

      const historyEntry = progressHistory.find((p) => p.date === dateStr);

      days.push({
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        minutes: historyEntry?.lightMinutes || 0,
        completed: historyEntry?.completed || false,
        isFuture,
        isToday,
      });
    }
    return days;
  }, [progressHistory]);

  const maxChartMinutes = Math.max(GOAL_MINUTES, ...weekData.map((d) => d.minutes));

  // Insight message
  const insightText = useMemo(() => {
    const completedThisWeek = weekData.filter((d) => d.completed && !d.isFuture).length;
    if (completedThisWeek >= 5) return "Amazing week! You're building a strong habit.";
    if (completedThisWeek >= 3) return 'Good progress this week. Keep it up!';
    if (completedThisWeek >= 1) return "You've started - try to get outside more this week.";
    return 'Start your week by getting some morning light!';
  }, [weekData]);

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDarkMode && styles.textLight]}>Your Progress</Text>
      </View>

      {/* Streak Card */}
      <Pressable
        style={[styles.streakCard, isDarkMode && styles.cardDark]}
        onPress={() => showInfo('streak')}
      >
        <Pressable onPress={() => showInfo('streak')} style={styles.infoButton}>
          <HelpCircle size={14} color={isDarkMode ? 'rgba(255,255,255,0.4)' : '#CCC'} />
        </Pressable>
        <View style={styles.streakHeader}>
          <Flame size={16} color="#FF6B35" fill="#FF6B35" />
          <Text style={[styles.streakLabel, isDarkMode && styles.textSecondaryLight]}>
            CURRENT STREAK
          </Text>
        </View>
        <View style={styles.streakRow}>
          <Text style={[styles.streakNumber, isDarkMode && styles.textLight]}>{currentStreak}</Text>
          <Text style={[styles.streakUnit, isDarkMode && styles.textSecondaryLight]}>days</Text>
        </View>
        <Text style={[styles.longestStreak, isDarkMode && styles.textSecondaryLight]}>
          Longest: {longestStreak} days
        </Text>
      </Pressable>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Pressable
          style={[styles.statCard, isDarkMode && styles.cardDark]}
          onPress={() => showInfo('totalMinutes')}
        >
          <Pressable onPress={() => showInfo('totalMinutes')} style={styles.statInfoButton}>
            <HelpCircle size={12} color={isDarkMode ? 'rgba(255,255,255,0.4)' : '#CCC'} />
          </Pressable>
          <Sun size={18} color="#FF6B35" strokeWidth={2} />
          <Text style={[styles.statValue, isDarkMode && styles.textLight]}>{totalMinutes}</Text>
          <Text style={[styles.statLabel, isDarkMode && styles.textSecondaryLight]}>
            total minutes
          </Text>
        </Pressable>

        <Pressable
          style={[styles.statCard, isDarkMode && styles.cardDark]}
          onPress={() => showInfo('daysTracked')}
        >
          <Pressable onPress={() => showInfo('daysTracked')} style={styles.statInfoButton}>
            <HelpCircle size={12} color={isDarkMode ? 'rgba(255,255,255,0.4)' : '#CCC'} />
          </Pressable>
          <Calendar size={18} color="#8B5CF6" strokeWidth={2} />
          <Text style={[styles.statValue, isDarkMode && styles.textLight]}>{totalDaysTracked}</Text>
          <Text style={[styles.statLabel, isDarkMode && styles.textSecondaryLight]}>
            days tracked
          </Text>
        </Pressable>

        <Pressable
          style={[styles.statCard, isDarkMode && styles.cardDark]}
          onPress={() => showInfo('goalsMet')}
        >
          <Pressable onPress={() => showInfo('goalsMet')} style={styles.statInfoButton}>
            <HelpCircle size={12} color={isDarkMode ? 'rgba(255,255,255,0.4)' : '#CCC'} />
          </Pressable>
          <Trophy size={18} color="#22C55E" strokeWidth={2} />
          <Text style={[styles.statValue, isDarkMode && styles.textLight]}>{goalRate}%</Text>
          <Text style={[styles.statLabel, isDarkMode && styles.textSecondaryLight]}>goals met</Text>
        </Pressable>

        <Pressable
          style={[styles.statCard, isDarkMode && styles.cardDark]}
          onPress={() => showInfo('daysCompleted')}
        >
          <Pressable onPress={() => showInfo('daysCompleted')} style={styles.statInfoButton}>
            <HelpCircle size={12} color={isDarkMode ? 'rgba(255,255,255,0.4)' : '#CCC'} />
          </Pressable>
          <Clock size={18} color="#F59E0B" strokeWidth={2} />
          <Text style={[styles.statValue, isDarkMode && styles.textLight]}>{daysGoalMet}</Text>
          <Text style={[styles.statLabel, isDarkMode && styles.textSecondaryLight]}>
            days completed
          </Text>
        </Pressable>
      </View>

      {/* Weekly Chart */}
      <View style={[styles.chartCard, isDarkMode && styles.cardDark]}>
        <Text style={[styles.chartTitle, isDarkMode && styles.textLight]}>This Week</Text>

        <View style={styles.chartContainer}>
          {/* Goal line */}
          <View
            style={[styles.goalLine, { bottom: `${(GOAL_MINUTES / maxChartMinutes) * 100}%` }]}
          />

          {weekData.map((day, index) => {
            const heightPercent = Math.min((day.minutes / maxChartMinutes) * 100, 100);
            const isGoalMet = day.minutes >= GOAL_MINUTES;

            return (
              <View key={index} style={styles.barColumn}>
                <View style={[styles.barTrack, day.isFuture && styles.ghostBarTrack]}>
                  {!day.isFuture && (
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max(heightPercent, 5)}%`,
                          backgroundColor: isGoalMet ? '#FF6B35' : '#94A3B8',
                          opacity: day.minutes > 0 ? 1 : 0.3,
                        },
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.dayLabel,
                    isDarkMode && styles.textSecondaryLight,
                    day.isToday && styles.todayLabel,
                  ]}
                >
                  {day.dayName}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Insight */}
        <View style={[styles.insightBox, isDarkMode && styles.insightBoxDark]}>
          <Text style={[styles.insightText, isDarkMode && styles.textSecondaryLight]}>
            {insightText}
          </Text>
        </View>
      </View>

      {/* Calendar Button */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowCalendar(true);
        }}
        style={[styles.calendarButton, isDarkMode && styles.calendarButtonDark]}
      >
        <Calendar size={18} color="#FF6B35" />
        <Text style={styles.calendarButtonText}>View Calendar</Text>
      </Pressable>

      {/* Calendar Modal */}
      <CalendarModal visible={showCalendar} onClose={() => setShowCalendar(false)} />

      {/* Info Modal */}
      <InfoModal
        visible={!!infoModalKey}
        onClose={() => setInfoModalKey(null)}
        metricKey={infoModalKey}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  textLight: {
    color: '#FFFFFF',
  },
  textSecondaryLight: {
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // Streak Card
  streakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  cardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: '#999',
    letterSpacing: 1,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  streakNumber: {
    fontSize: 48,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
    lineHeight: 56,
  },
  streakUnit: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#666',
  },
  longestStreak: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#999',
    marginTop: 4,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    position: 'relative',
  },
  statInfoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    textAlign: 'center',
  },

  // Chart Card
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 100,
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
    opacity: 0.3,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barTrack: {
    width: 14,
    height: '85%',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  ghostBarTrack: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  dayLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_500Medium',
    color: '#999',
  },
  todayLabel: {
    color: '#FF6B35',
    fontFamily: 'Outfit_700Bold',
  },
  insightBox: {
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderRadius: 10,
    padding: 12,
  },
  insightBoxDark: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
  },
  insightText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    textAlign: 'center',
  },

  // Calendar Button
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  calendarButtonText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FF6B35',
  },

  // Info Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  modalClose: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    lineHeight: 22,
  },
});
