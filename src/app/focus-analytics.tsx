import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  X,
  Info,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cloud,
} from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { BlurView } from 'expo-blur';

import {
  getDetailedUsageStats,
  getHourlyBreakdown,
  getAppUsageData,
  getUsageForDate,
  getAvailableHistoryDates,
  startDailyMonitoring,
  isDailyMonitoringActive,
  getAppToggles,
  refreshScreenTimeData,
  type DetailedUsageStats,
  type HourlyBreakdown,
  type AppUsageItem,
} from '@/lib/screen-time';
import { LumisIcon } from 'lumisscreentime';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_CHART_WIDTH = SCREEN_WIDTH - 64; // Padding on both sides

export default function FocusAnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState<'focus' | 'pickups' | 'privacy' | null>(null);

  // Data state
  const [stats, setStats] = useState<DetailedUsageStats | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyBreakdown[]>([]);
  const [appUsage, setAppUsage] = useState<AppUsageItem[]>([]);

  // Ensure monitoring is active on mount and refresh data
  useEffect(() => {
    const initializeScreenTime = async () => {
      // Start daily monitoring if not active
      const isActive = isDailyMonitoringActive();
      if (!isActive) {
        await startDailyMonitoring();
      }

      // Trigger a refresh of screen time data via DeviceActivityReport
      // This presents a hidden view that causes iOS to run the report extension
      const refreshed = await refreshScreenTimeData();
      console.log('[FocusAnalytics] Screen time data refreshed:', refreshed);

      // Reload data after refresh completes
      loadData();
    };
    initializeScreenTime();
  }, [loadData]);

  // Load data for selected date
  const loadData = useCallback(async () => {
    setIsLoading(true);

    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === today;

    // Get available history dates
    const dates = getAvailableHistoryDates();
    setAvailableDates([today, ...dates.filter(d => d !== today)]);

    if (isToday) {
      // Load current day data
      const usageStats = getDetailedUsageStats();
      const hourly = getHourlyBreakdown();
      const apps = getAppUsageData();

      setStats(usageStats);
      setHourlyData(hourly);

      // If no app usage data from the report extension, show shielded apps as fallback
      if (apps.length === 0) {
        const shieldedApps = getAppToggles();
        const fallbackApps: AppUsageItem[] = shieldedApps
          .filter(app => app.isEnabled)
          .map(app => ({
            bundleIdentifier: app.name,
            displayName: app.name,
            category: app.isCategory ? 'Category' : 'Shielded',
            totalSeconds: 0,
            numberOfPickups: 0,
            numberOfNotifications: 0,
            tokenData: app.tokenData,
          }));
        setAppUsage(fallbackApps);
      } else {
        setAppUsage(apps);
      }
    } else {
      // Load historical data
      const historicalData = getUsageForDate(selectedDate);
      if (historicalData) {
        setStats({
          totalScreenTimeSeconds: historicalData.totalScreenTimeSeconds,
          productiveSeconds: historicalData.productiveSeconds,
          distractingSeconds: historicalData.distractingSeconds,
          neutralSeconds: historicalData.neutralSeconds,
          totalPickups: historicalData.totalPickups,
          totalNotifications: historicalData.totalNotifications,
          topApps: historicalData.topApps,
          focusScore: historicalData.focusScore,
          focusRatio: historicalData.focusRatio,
          timestamp: historicalData.date,
        });
        setHourlyData([]);
        setAppUsage([]);
      } else {
        setStats(null);
        setHourlyData([]);
        setAppUsage([]);
      }
    }

    setIsLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentIndex = availableDates.indexOf(selectedDate);

    if (direction === 'prev' && currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    }
  };

  const formatDuration = (seconds: number): string => {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDurationShort = (seconds: number): string => {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDateLabel = (dateStr: string): string => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return 'Today';

    const date = new Date(dateStr + 'T12:00:00');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#22C55E';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getCategoryColor = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('productive') || lowerCategory.includes('productivity')) {
      return '#8B5CF6';
    }
    if (lowerCategory.includes('distract') || lowerCategory.includes('social') || lowerCategory.includes('entertainment')) {
      return '#EF4444';
    }
    return '#6B7280';
  };

  const getCategoryLabel = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('productive') || lowerCategory.includes('productivity')) {
      return 'Productive';
    }
    if (lowerCategory.includes('distract') || lowerCategory.includes('social') || lowerCategory.includes('entertainment')) {
      return 'Distracting';
    }
    return 'Other';
  };

  // Generate hourly data for display (5 AM to 11 PM)
  const displayHours = [5, 9, 13, 17, 21]; // 5AM, 9AM, 1PM, 5PM, 9PM
  const hourLabels = ['5 AM', '9 AM', '1 PM', '5 PM', '9 PM'];

  // Get max value for chart scaling
  const allHourlyData = hourlyData.length > 0 ? hourlyData :
    Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      productiveSeconds: 0,
      distractingSeconds: 0,
      neutralSeconds: 0
    }));

  const maxHourlySeconds = Math.max(
    ...allHourlyData.map(h => Math.max(h.productiveSeconds + h.neutralSeconds, h.distractingSeconds)),
    60 // Minimum 1 minute for scaling
  );

  // Check if we have any data
  const hasData = stats && stats.totalScreenTimeSeconds > 0;
  const today = new Date().toISOString().split('T')[0];
  const canGoNext = availableDates.indexOf(selectedDate) > 0;
  const canGoPrev = availableDates.indexOf(selectedDate) < availableDates.length - 1;

  // Top 3 most used apps for header display
  const topThreeApps = appUsage.slice(0, 3);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <X size={20} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Screen Time</Text>
          <Pressable
            style={styles.infoButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowInfoModal('privacy');
            }}
          >
            <Info size={16} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </View>
        <Pressable
          onPress={() => setShowDatePicker(!showDatePicker)}
          style={styles.dateButton}
        >
          <Text style={styles.dateButtonText}>{formatDateLabel(selectedDate)}</Text>
          <ChevronDown size={14} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      {/* Date Picker Dropdown */}
      {showDatePicker && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.datePicker}>
          <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
            {availableDates.map((date) => (
              <Pressable
                key={date}
                onPress={() => {
                  setSelectedDate(date);
                  setShowDatePicker(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.dateOption,
                  selectedDate === date && styles.dateOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dateOptionText,
                    selectedDate === date && styles.dateOptionTextSelected,
                  ]}
                >
                  {formatDateLabel(date)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {!hasData ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataTitle}>No Data Available</Text>
            <Text style={styles.noDataSubtitle}>
              {selectedDate === today
                ? 'Screen time data will appear here as you use your device.'
                : 'No usage data was recorded for this date.'}
            </Text>
          </View>
        ) : (
          <>
            {/* Main Screen Time Display */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.mainTimeSection}>
              <Text style={styles.mainTimeValue}>
                {formatDurationShort(stats.totalScreenTimeSeconds)}
              </Text>
              <Text style={styles.mainTimeLabel}>SCREEN TIME TODAY</Text>

              {/* Quick Stats Row */}
              <View style={styles.quickStatsRow}>
                {/* Most Used */}
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatLabel}>MOST USED</Text>
                  <View style={styles.mostUsedIcons}>
                    {topThreeApps.length > 0 ? (
                      topThreeApps.map((app, index) => (
                        <View
                          key={`top-${app.bundleIdentifier}-${index}`}
                          style={[
                            styles.appIconSmall,
                            { marginLeft: index > 0 ? -8 : 0, zIndex: 3 - index },
                          ]}
                        >
                          {app.tokenData ? (
                            <LumisIcon
                              tokenData={app.tokenData}
                              isCategory={false}
                              size={24}
                              style={{ width: 24, height: 24 }}
                            />
                          ) : (
                            <Text style={styles.appIconLetter}>{app.displayName.charAt(0)}</Text>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noAppsText}>-</Text>
                    )}
                  </View>
                </View>

                {/* Focus Score */}
                <View style={styles.quickStatItem}>
                  <View style={styles.statLabelRow}>
                    <Text style={styles.quickStatLabel}>FOCUS SCORE</Text>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowInfoModal('focus');
                      }}
                      hitSlop={8}
                    >
                      <Info size={12} color="rgba(255,255,255,0.3)" />
                    </Pressable>
                  </View>
                  <Text style={[styles.quickStatValue, { color: getScoreColor(stats.focusScore) }]}>
                    {stats.focusScore}%
                  </Text>
                </View>

                {/* Pickups */}
                <View style={styles.quickStatItem}>
                  <View style={styles.statLabelRow}>
                    <Text style={styles.quickStatLabel}>PICKUPS</Text>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowInfoModal('pickups');
                      }}
                      hitSlop={8}
                    >
                      <Info size={12} color="rgba(255,255,255,0.3)" />
                    </Pressable>
                  </View>
                  <Text style={styles.quickStatValue}>{stats.totalPickups}</Text>
                </View>
              </View>
            </Animated.View>

            {/* Hourly Bar Chart */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.chartSection}>
              {/* Legend */}
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
                  <Text style={styles.legendText}>PRODUCTIVE</Text>
                </View>
                <Text style={styles.legendSeparator}>•</Text>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>DISTRACTING</Text>
                </View>
              </View>

              {/* Bar Chart */}
              <View style={styles.barChartContainer}>
                {allHourlyData
                  .filter(h => h.hour >= 5 && h.hour <= 23)
                  .map((hourData) => {
                    const productiveTotal = hourData.productiveSeconds + hourData.neutralSeconds;
                    const distractingTotal = hourData.distractingSeconds;
                    const productiveHeight = maxHourlySeconds > 0
                      ? (productiveTotal / maxHourlySeconds) * 80
                      : 0;
                    const distractingHeight = maxHourlySeconds > 0
                      ? (distractingTotal / maxHourlySeconds) * 80
                      : 0;
                    const hasActivity = productiveTotal > 0 || distractingTotal > 0;

                    return (
                      <View key={hourData.hour} style={styles.barGroup}>
                        <View style={styles.barsContainer}>
                          {/* Productive bar (left) */}
                          <View
                            style={[
                              styles.bar,
                              styles.barProductive,
                              { height: Math.max(productiveHeight, hasActivity ? 4 : 2) },
                            ]}
                          />
                          {/* Distracting bar (right) */}
                          <View
                            style={[
                              styles.bar,
                              styles.barDistracting,
                              { height: Math.max(distractingHeight, hasActivity ? 4 : 2) },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
              </View>

              {/* Time Labels */}
              <View style={styles.timeLabels}>
                {hourLabels.map((label) => (
                  <Text key={label} style={styles.timeLabel}>{label}</Text>
                ))}
              </View>
            </Animated.View>

            {/* Assist Section */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.assistCard}>
              <View style={styles.assistHeader}>
                <View>
                  <Text style={styles.assistTitle}>Assist</Text>
                  <Text style={styles.assistSubtitle}>Keep distracting apps in check.</Text>
                </View>
                <Text style={styles.assistStatus}>Off</Text>
              </View>

              <View style={styles.assistContent}>
                {/* Circular Progress */}
                <View style={styles.assistProgress}>
                  <Svg width={120} height={120} viewBox="0 0 120 120">
                    <Circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="10"
                      fill="none"
                    />
                    <Circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 50 * (stats.distractingSeconds / stats.totalScreenTimeSeconds || 0)} ${2 * Math.PI * 50}`}
                      strokeLinecap="round"
                      rotation="-90"
                      origin="60, 60"
                    />
                  </Svg>
                  <View style={styles.assistProgressCenter}>
                    <Text style={styles.assistTimeValue}>
                      {formatDurationShort(stats.distractingSeconds)}
                    </Text>
                    <Text style={styles.assistTimeLabel}>NO GOAL</Text>
                  </View>
                </View>

                {/* Top Distracting Apps */}
                <View style={styles.topDistractingApps}>
                  {appUsage
                    .filter(app => getCategoryLabel(app.category) === 'Distracting')
                    .slice(0, 3)
                    .map((app, index) => (
                      <View key={`distracting-${app.bundleIdentifier}-${index}`} style={styles.distractingAppRow}>
                        <View style={styles.distractingAppIcon}>
                          {app.tokenData ? (
                            <LumisIcon
                              tokenData={app.tokenData}
                              isCategory={false}
                              size={28}
                              style={{ width: 28, height: 28 }}
                            />
                          ) : (
                            <Text style={styles.distractingAppLetter}>{app.displayName.charAt(0)}</Text>
                          )}
                        </View>
                        <View style={styles.distractingAppInfo}>
                          <Text style={styles.distractingAppName}>{app.displayName}</Text>
                          <Text style={styles.distractingAppTime}>
                            {formatDuration(app.totalSeconds)}
                          </Text>
                        </View>
                      </View>
                    ))}
                </View>
              </View>
            </Animated.View>

            {/* App Usage Section */}
            <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.appUsageCard}>
              <Text style={styles.sectionTitle}>App Usage</Text>

              {/* Show note if showing shielded apps without usage data */}
              {appUsage.length > 0 && appUsage[0].totalSeconds === 0 && (
                <View style={styles.fallbackNote}>
                  <Text style={styles.fallbackNoteText}>
                    Showing your shielded apps. Detailed usage data will appear as you use your device.
                  </Text>
                </View>
              )}

              {/* Time Offline */}
              <View style={styles.appRow}>
                <View style={[styles.appIcon, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
                  <Cloud size={20} color="#60A5FA" />
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>Time Offline</Text>
                  <Text style={styles.appCategory}>
                    {Math.round(((86400 - stats.totalScreenTimeSeconds) / 86400) * 100)}% of your day
                  </Text>
                </View>
                <Text style={[styles.appDuration, { color: '#60A5FA' }]}>
                  {formatDurationShort(86400 - stats.totalScreenTimeSeconds)}
                </Text>
              </View>

              {/* App List */}
              {appUsage.map((app, index) => {
                const categoryLabel = getCategoryLabel(app.category);
                const categoryColor = getCategoryColor(app.category);

                return (
                  <Animated.View
                    key={`${app.bundleIdentifier}-${index}`}
                    entering={FadeInDown.delay(450 + index * 30).duration(300)}
                    style={styles.appRow}
                  >
                    <View style={[styles.appIcon, { backgroundColor: categoryColor + '20' }]}>
                      {app.tokenData ? (
                        <LumisIcon
                          tokenData={app.tokenData}
                          isCategory={false}
                          size={28}
                          style={{ width: 28, height: 28 }}
                        />
                      ) : (
                        <Text style={[styles.appIconLetter, { color: categoryColor }]}>
                          {app.displayName.charAt(0)}
                        </Text>
                      )}
                    </View>

                    <View style={styles.appInfo}>
                      <Text style={styles.appName}>{app.displayName}</Text>
                      <View style={styles.appProgressBar}>
                        <View
                          style={[
                            styles.appProgressFill,
                            {
                              width: `${Math.min((app.totalSeconds / stats.totalScreenTimeSeconds) * 100, 100)}%`,
                              backgroundColor: categoryColor,
                            },
                          ]}
                        />
                      </View>
                      <Pressable style={styles.categoryBadge}>
                        <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
                          {categoryLabel} ›
                        </Text>
                      </Pressable>
                    </View>

                    <Text style={[styles.appDuration, { color: categoryColor }]}>
                      {formatDuration(app.totalSeconds)}
                    </Text>
                  </Animated.View>
                );
              })}
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowInfoModal(null);
          }}
        >
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showInfoModal === 'focus' ? 'Focus Score' : showInfoModal === 'pickups' ? 'Pickups' : 'Your Privacy'}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowInfoModal(null);
                }}
                style={styles.modalCloseButton}
              >
                <X size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            <Text style={styles.modalBody}>
              {showInfoModal === 'focus'
                ? "Your Focus Score measures how well you spent your screen time. It's calculated based on the ratio of productive apps to distracting apps. A higher score means more time in productive apps like work tools, education, and utilities."
                : showInfoModal === 'pickups'
                ? "Pickups count how many times you picked up your device and unlocked it throughout the day. Reducing pickups helps minimize context switching and improves your ability to focus on deep work."
                : "All screen time data is stored locally on your device and is never shared with Lumis servers or third parties. Your app usage, pickups, and screen time statistics remain completely private and under your control. We use Apple's Screen Time API to collect this data securely on-device."}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  infoButton: {
    padding: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 4,
  },
  dateButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
  },
  datePicker: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 180,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dateOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dateOptionSelected: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
  },
  dateOptionText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  dateOptionTextSelected: {
    color: '#FF6B35',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  noDataTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  noDataSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  mainTimeSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  mainTimeValue: {
    fontSize: 56,
    fontFamily: 'Outfit_300Light',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  mainTimeLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  quickStatLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1,
  },
  quickStatValue: {
    fontSize: 22,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  mostUsedIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
    overflow: 'hidden',
  },
  noAppsText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  chartSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
  },
  legendSeparator: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    paddingHorizontal: 4,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    width: 6,
    borderRadius: 3,
    minHeight: 2,
  },
  barProductive: {
    backgroundColor: '#8B5CF6',
  },
  barDistracting: {
    backgroundColor: '#EF4444',
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  timeLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  assistCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
  },
  assistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  assistTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  assistSubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  assistStatus: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  assistContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assistProgress: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  assistProgressCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistTimeValue: {
    fontSize: 22,
    fontFamily: 'Outfit_300Light',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  assistTimeLabel: {
    fontSize: 9,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  topDistractingApps: {
    flex: 1,
    marginLeft: 16,
    gap: 12,
  },
  distractingAppRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distractingAppIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  distractingAppLetter: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  distractingAppInfo: {
    flex: 1,
  },
  distractingAppName: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  distractingAppTime: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  appUsageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  fallbackNote: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  fallbackNoteText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  appIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  appIconLetter: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  appCategory: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  appProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  appProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
  appDuration: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
  },
});
