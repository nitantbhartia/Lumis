import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Sun, Moon, Clock, Flame, Shield, Smartphone } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

import { useLumisStore } from '@/lib/state/lumis-store';
import { useAuthStore } from '@/lib/state/auth-store';
import { formatFirstName } from '@/lib/utils/name-utils';
import { useWeather } from '@/lib/hooks/useWeather';

import CalendarModal from '../components/CalendarModal';
import SkipPassModal from '../components/SkipPassModal';
import UserSettingsModal from '../components/UserSettingsModal';

import { StakesCard } from '@/components/dashboard/StakesCard';
import { CompletionActions } from '@/components/dashboard/CompletionActions';
import { Confetti } from '@/components/Confetti';
import { StreakSavedToast } from '@/components/dashboard/StreakSavedToast';
import { WeatherBar } from '@/components/dashboard/WeatherBar';
import { StreakCalendarStrip } from '@/components/dashboard/StreakCalendarStrip';
import { StoneHeroCarousel } from '@/components/stones';
import { getDetailedUsageStats, startDailyMonitoring, isDailyMonitoringActive } from '@/lib/screen-time';

const GOAL_MINUTES = 2; // Fixed 2-minute goal

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const weather = useWeather();

  // Auth state
  const userName = useAuthStore((s) => s.userName);
  const user = useAuthStore((s) => s.user);

  // Lumis state
  const currentStreak = useLumisStore((s) => s.currentStreak);
  const todayProgress = useLumisStore((s) => s.todayProgress);
  const blockedApps = useLumisStore((s) => s.blockedApps);
  const scheduledWakeTime = useLumisStore((s) => s.scheduledWakeTime);
  const stakesEnabled = useLumisStore((s) => s.stakesEnabled);
  const selectedCharity = useLumisStore((s) => s.selectedCharity);
  const hasSeenCompletionToday = useLumisStore((s) => s.hasSeenCompletionToday);
  const setHasSeenCompletionToday = useLumisStore((s) => s.setHasSeenCompletionToday);
  const isPremium = useLumisStore((s) => s.isPremium);
  const isTrialActive = useLumisStore((s) => s.isTrialActive());
  const collectedStones = useLumisStore((s) => s.collectedStones);
  const progressHistory = useLumisStore((s) => s.progressHistory);

  const hasPremiumAccess = isPremium || isTrialActive;

  // Modal states
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmergencyUnlock, setShowEmergencyUnlock] = useState(false);
  const [showStreakToast, setShowStreakToast] = useState(false);
  const [screenTimeMinutes, setScreenTimeMinutes] = useState(0);

  // Start daily monitoring and fetch screen time data
  useEffect(() => {
    // Start daily monitoring if not already active
    const initMonitoring = async () => {
      try {
        const isActive = isDailyMonitoringActive();
        if (!isActive) {
          console.log('[Dashboard] Starting daily monitoring...');
          await startDailyMonitoring();
        }
      } catch (e) {
        console.log('[Dashboard] Daily monitoring init error:', e);
      }
    };
    initMonitoring();

    const fetchScreenTime = () => {
      try {
        const stats = getDetailedUsageStats();
        const minutes = Math.round(stats.totalScreenTimeSeconds / 60);
        setScreenTimeMinutes(minutes);
      } catch (e) {
        console.log('[Dashboard] Screen time fetch error:', e);
      }
    };
    fetchScreenTime();
    // Refresh every minute
    const interval = setInterval(fetchScreenTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Derived state
  const now = new Date();
  const isNightTime = !weather.isDaylight;
  const isGoalMet = todayProgress.completed || todayProgress.lightMinutes >= GOAL_MINUTES;

  // Check if before scheduled wake time
  const isBeforeWake = (() => {
    if (!scheduledWakeTime) return false;
    const [hours, minutes] = scheduledWakeTime.split(':').map(Number);
    const wakeDate = new Date();
    wakeDate.setHours(hours, minutes, 0, 0);
    return now < wakeDate;
  })();

  // Always use dark background to match stone carousel
  const isDarkMode = true;
  const backgroundColor = '#0F172A';

  // User display
  const formattedName = formatFirstName(userName) || formatFirstName(user?.name);
  const displayName = formattedName || 'Friend';
  const initials = displayName.charAt(0).toUpperCase();

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Trigger celebration when goal is first met
  useEffect(() => {
    if (isGoalMet && !hasSeenCompletionToday) {
      const hapticInterval = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 600);

      setTimeout(() => {
        setShowStreakToast(true);
      }, 800);

      setTimeout(() => {
        clearInterval(hapticInterval);
        setHasSeenCompletionToday(true);
      }, 3000);

      return () => clearInterval(hapticInterval);
    }
  }, [isGoalMet, hasSeenCompletionToday]);

  const handleStartTracking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/tracking');
  };

  const formatWakeTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Confetti for first-time completion */}
      {isGoalMet && !hasSeenCompletionToday && <Confetti />}

      {/* Streak Saved Toast */}
      <StreakSavedToast
        visible={showStreakToast}
        streak={currentStreak + 1}
        onHide={() => setShowStreakToast(false)}
      />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 4 },
        ]}
      >
        {/* Minimal Header - just avatar for settings access */}
        <View style={styles.minimalHeader}>
          <Pressable onPress={() => setShowSettings(true)} style={styles.avatarButton}>
            <View style={[styles.avatar, styles.avatarDark]}>
              <Text style={[styles.avatarText, styles.avatarTextDark]}>
                {initials}
              </Text>
            </View>
            {hasPremiumAccess && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Stone Hero Carousel - hero at top like Opal */}
        <StoneHeroCarousel
          collectedStones={collectedStones}
          currentStreak={currentStreak}
          isPro={hasPremiumAccess}
          onStonePress={(milestone) => router.push(`/stone-detail?day=${milestone.day}`)}
        />

        {/* Horizontal Stats Bar */}
        <View style={styles.statsBar}>
          <Pressable
            style={styles.statItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/stone-gallery');
            }}
          >
            <Flame size={18} color="#FF8C00" />
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>STREAK</Text>
          </Pressable>

          <Pressable
            style={styles.statItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/focus-analytics');
            }}
          >
            <Smartphone size={18} color="#60A5FA" />
            <Text style={styles.statValue}>{screenTimeMinutes > 0 ? `${Math.floor(screenTimeMinutes / 60)}h ${screenTimeMinutes % 60}m` : '0m'}</Text>
            <Text style={styles.statLabel}>SCREEN TIME</Text>
          </Pressable>

          <Pressable
            style={styles.statItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/shield');
            }}
          >
            <Shield size={18} color="#FF6B6B" />
            <Text style={styles.statValue}>{blockedApps.filter(a => a.isBlocked).length}</Text>
            <Text style={styles.statLabel}>BLOCKED</Text>
          </Pressable>
        </View>

        {/* Weather Bar */}
        <WeatherBar weather={weather} />

        {/* 7-Day Streak Calendar */}
        <StreakCalendarStrip
          progressHistory={progressHistory}
          currentStreak={currentStreak}
          onPress={() => setShowCalendar(true)}
        />

        {/* Main Content */}
        {isBeforeWake ? (
          // Pre-Wake State
          <View style={styles.preWakeCard}>
            <View style={styles.preWakeIconContainer}>
              <Clock size={28} color="#FF6B35" strokeWidth={2} />
            </View>
            <Text style={styles.textLight}>
              Apps lock at {scheduledWakeTime && formatWakeTime(scheduledWakeTime)}
            </Text>
            <Text style={styles.textSecondaryLight}>
              Apps will lock when your morning begins
            </Text>
          </View>
        ) : (
          // Active Challenge State - just stakes if enabled
          <>
            {stakesEnabled && !isGoalMet && !isNightTime && (
              <StakesCard
                charity={selectedCharity}
                penaltyAmount={1}
                onChangeCharity={() => router.push('/settings')}
                isDarkMode={true}
              />
            )}
          </>
        )}
      </View>

      {/* Floating CTA above tab bar */}
      {!isNightTime && !isBeforeWake && !isGoalMet && (
        <View style={styles.floatingCtaContainer}>
          <Pressable onPress={handleStartTracking} style={styles.floatingStartButton}>
            <BlurView intensity={60} tint="dark" style={styles.floatingButtonBlur}>
              <Sun size={20} color="#FF6B35" strokeWidth={2.5} />
              <Text style={styles.floatingStartButtonText}>START MORNING LIGHT</Text>
            </BlurView>
          </Pressable>
        </View>
      )}

      {/* Completion state */}
      {!isNightTime && !isBeforeWake && isGoalMet && (
        <View style={styles.floatingCtaContainer}>
          <CompletionActions
            onViewActivity={() => router.push('/activity-summary')}
            lightMinutes={todayProgress.lightMinutes}
            currentStreak={currentStreak}
          />
        </View>
      )}

      {/* Modals */}
      <UserSettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
      />

      <SkipPassModal
        visible={showEmergencyUnlock}
        onClose={() => setShowEmergencyUnlock(false)}
        onSuccess={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 24,
  },
  minimalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  avatarButton: {
    position: 'relative',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  avatarTextDark: {
    color: '#FFFFFF',
  },
  proBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  proBadgeText: {
    fontSize: 8,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    marginTop: 2,
  },
  textLight: {
    color: '#FFFFFF',
  },
  textSecondaryLight: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  debugAnalyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderRadius: 12,
  },
  debugAnalyticsText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#FF6B35',
  },
  preWakeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  preWakeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  preWakeTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 8,
  },
  preWakeSubtitle: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  editWakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  editWakeText: {
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
    color: '#FF6B35',
    marginRight: 4,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  floatingCtaContainer: {
    position: 'absolute',
    bottom: 95, // Just above the tab bar
    left: 20,
    right: 20,
  },
  floatingStartButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  floatingButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  floatingStartButtonText: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    color: '#FF6B35',
    letterSpacing: 0.5,
  },
  // Horizontal stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 32,
    marginBottom: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 20,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
