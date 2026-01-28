import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TrendingUp,
  TrendingDown,
  Sun,
  Calendar,
  Target,
  Flame,
  ArrowLeft,
  Clock,
  Minus,
} from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import { calculateInsights, generateMonthlyReport } from '@/lib/insights';
import { useWeather } from '@/lib/hooks/useWeather';

export default function InsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const weather = useWeather();
  const progressHistory = useLumisStore((s) => s.progressHistory);
  const isPremium = useLumisStore((s) => s.isPremium);
  const isTrialActive = useLumisStore((s) => s.isTrialActive());
  const hasPremiumAccess = isPremium || isTrialActive;

  const isDarkMode = !weather.isDaylight;
  const backgroundColor = isDarkMode ? '#1A1A2E' : '#FFF9F0';

  // Calculate insights
  const insights = useMemo(
    () => calculateInsights(progressHistory),
    [progressHistory]
  );

  // Generate current month report
  const now = new Date();
  const monthlyReport = useMemo(
    () => generateMonthlyReport(progressHistory, now.getMonth(), now.getFullYear()),
    [progressHistory]
  );

  const getTrendIcon = () => {
    if (insights.trend === 'improving') return TrendingUp;
    if (insights.trend === 'declining') return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (insights.trend === 'improving') return '#22C55E';
    if (insights.trend === 'declining') return '#EF4444';
    return '#F59E0B';
  };

  const getTrendMessage = () => {
    if (insights.trend === 'improving') {
      return "You're getting better! Your morning routine is becoming a habit.";
    }
    if (insights.trend === 'declining') {
      return "Your consistency has dipped. Try to get outside a bit earlier tomorrow.";
    }
    return "You're staying steady. Keep up the good work!";
  };

  const TrendIcon = getTrendIcon();
  const trendColor = getTrendColor();

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={hasPremiumAccess}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, isDarkMode && styles.backButtonDark]}
          >
            <ArrowLeft size={20} color={isDarkMode ? '#FFFFFF' : '#1A1A2E'} />
          </Pressable>
          <Text style={[styles.title, isDarkMode && styles.textLight]}>
            Your Progress
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={{ opacity: hasPremiumAccess ? 1 : 0.3 }}>
          {/* Trend Card */}
          <View style={[styles.trendCard, isDarkMode && styles.cardDark]}>
            <View style={styles.trendHeader}>
              <Text style={[styles.trendLabel, isDarkMode && styles.textSecondaryLight]}>
                Your Trend
              </Text>
              <View style={[styles.trendBadge, { backgroundColor: `${trendColor}20` }]}>
                <TrendIcon size={14} color={trendColor} strokeWidth={2.5} />
                <Text style={[styles.trendBadgeText, { color: trendColor }]}>
                  {insights.trend === 'improving' ? 'Improving' : insights.trend === 'declining' ? 'Needs Work' : 'Steady'}
                </Text>
              </View>
            </View>
            <Text style={[styles.trendMessage, isDarkMode && styles.textSecondaryLight]}>
              {getTrendMessage()}
            </Text>
          </View>

          {/* This Month Stats */}
          <Text style={[styles.sectionTitle, isDarkMode && styles.textSecondaryLight]}>
            THIS MONTH
          </Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, isDarkMode && styles.cardDark]}>
              <View style={styles.statIconContainer}>
                <Sun size={18} color="#FF6B35" strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, isDarkMode && styles.textLight]}>
                {monthlyReport.totalMinutes}
              </Text>
              <Text style={[styles.statLabel, isDarkMode && styles.textSecondaryLight]}>
                minutes outside
              </Text>
            </View>

            <View style={[styles.statCard, isDarkMode && styles.cardDark]}>
              <View style={styles.statIconContainer}>
                <Target size={18} color="#8B5CF6" strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, isDarkMode && styles.textLight]}>
                {monthlyReport.daysActive > 0
                  ? Math.round(monthlyReport.totalMinutes / monthlyReport.daysActive)
                  : 0}
              </Text>
              <Text style={[styles.statLabel, isDarkMode && styles.textSecondaryLight]}>
                avg per day
              </Text>
            </View>

            <View style={[styles.statCard, isDarkMode && styles.cardDark]}>
              <View style={styles.statIconContainer}>
                <Calendar size={18} color="#22C55E" strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, isDarkMode && styles.textLight]}>
                {monthlyReport.consistencyScore}%
              </Text>
              <Text style={[styles.statLabel, isDarkMode && styles.textSecondaryLight]}>
                consistency
              </Text>
            </View>

            <View style={[styles.statCard, isDarkMode && styles.cardDark]}>
              <View style={styles.statIconContainer}>
                <Clock size={18} color="#F59E0B" strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, isDarkMode && styles.textLight]}>
                {monthlyReport.daysActive}
              </Text>
              <Text style={[styles.statLabel, isDarkMode && styles.textSecondaryLight]}>
                days active
              </Text>
            </View>
          </View>

          {/* All Time Stats */}
          <Text style={[styles.sectionTitle, isDarkMode && styles.textSecondaryLight]}>
            ALL TIME
          </Text>

          <View style={styles.allTimeRow}>
            <View style={[styles.allTimeCard, isDarkMode && styles.cardDark]}>
              <Flame size={20} color="#FF6B35" strokeWidth={2} fill="#FF6B35" />
              <Text style={[styles.allTimeValue, isDarkMode && styles.textLight]}>
                {insights.currentStreak}
              </Text>
              <Text style={[styles.allTimeLabel, isDarkMode && styles.textSecondaryLight]}>
                current streak
              </Text>
            </View>

            <View style={[styles.allTimeCard, isDarkMode && styles.cardDark]}>
              <Flame size={20} color="#F59E0B" strokeWidth={2} />
              <Text style={[styles.allTimeValue, isDarkMode && styles.textLight]}>
                {insights.longestStreak}
              </Text>
              <Text style={[styles.allTimeLabel, isDarkMode && styles.textSecondaryLight]}>
                best streak
              </Text>
            </View>

            <View style={[styles.allTimeCard, isDarkMode && styles.cardDark]}>
              <Sun size={20} color="#22C55E" strokeWidth={2} />
              <Text style={[styles.allTimeValue, isDarkMode && styles.textLight]}>
                {Math.round(insights.totalMinutes / 60)}h
              </Text>
              <Text style={[styles.allTimeLabel, isDarkMode && styles.textSecondaryLight]}>
                total time
              </Text>
            </View>
          </View>

          {/* Best Day */}
          {insights.bestDay.minutes > 0 && (
            <View style={[styles.bestDayCard, isDarkMode && styles.cardDark]}>
              <Text style={[styles.bestDayLabel, isDarkMode && styles.textSecondaryLight]}>
                Your best day was
              </Text>
              <Text style={[styles.bestDayValue, isDarkMode && styles.textLight]}>
                {insights.bestDay.dayOfWeek}
              </Text>
              <Text style={[styles.bestDayMinutes, isDarkMode && styles.textSecondaryLight]}>
                {insights.bestDay.minutes} minutes of morning light
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Premium Paywall */}
      {!hasPremiumAccess && (
        <View style={styles.paywallOverlay}>
          <View style={[styles.paywallCard, isDarkMode && styles.paywallCardDark]}>
            <View style={styles.paywallIconContainer}>
              <Target size={32} color="#FF6B35" />
            </View>
            <Text style={[styles.paywallTitle, isDarkMode && styles.textLight]}>
              See Your Full Progress
            </Text>
            <Text style={[styles.paywallSubtitle, isDarkMode && styles.textSecondaryLight]}>
              Track trends, streaks, and daily stats with Lumis Pro.
            </Text>
            <Pressable
              onPress={() => router.push('/premium')}
              style={styles.paywallButton}
            >
              <Text style={styles.paywallButtonText}>UNLOCK INSIGHTS</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  placeholder: {
    width: 44,
  },
  textLight: {
    color: '#FFFFFF',
  },
  textSecondaryLight: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  trendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trendLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#666',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendBadgeText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    textTransform: 'capitalize',
  },
  trendMessage: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: '#999',
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
  },
  allTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  allTimeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  allTimeValue: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
    marginTop: 8,
    marginBottom: 2,
  },
  allTimeLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    textAlign: 'center',
  },
  bestDayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  bestDayLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    marginBottom: 4,
  },
  bestDayValue: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  bestDayMinutes: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
  },
  paywallOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 32,
  },
  paywallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  paywallCardDark: {
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  paywallIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  paywallTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  paywallSubtitle: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  paywallButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  paywallButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
