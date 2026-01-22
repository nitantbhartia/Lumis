import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing, interpolate } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Info, Sun, Shield, Lock } from 'lucide-react-native';

import { useLumisStore } from '@/lib/state/lumis-store';
import { useAuthStore } from '@/lib/state/auth-store';
import { useSmartEnvironment } from '@/lib/hooks/useSmartEnvironment';
import { unblockApps } from '@/lib/screen-time';
import { formatFirstName } from '@/lib/utils/name-utils';
import { useQuickLuxCheck } from '@/lib/hooks/useQuickLuxCheck';
import { useWeather } from '@/lib/hooks/useWeather';

import CalendarModal from '../components/CalendarModal';
import EmergencyUnlockModal from '../components/EmergencyUnlockModal';
import UserSettingsModal from '../components/UserSettingsModal';

import { MissionBriefingCard } from '@/components/dashboard/MissionBriefingCard';
import { DaylightBar } from '@/components/dashboard/DaylightBar';
import { ShieldCta } from '@/components/dashboard/ShieldCta';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const weather = useWeather();
  const userName = useAuthStore((s) => s.userName);
  const currentStreak = useLumisStore((s) => s.currentStreak);
  const todayProgress = useLumisStore((s) => s.todayProgress);
  const blockedApps = useLumisStore((s) => s.blockedApps);
  const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);

  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmergencyUnlock, setShowEmergencyUnlock] = useState(false);
  const [showMorningLightInfo, setShowMorningLightInfo] = useState(false);
  const [isCheckingLux, setIsCheckingLux] = useState(false);

  const { checkLux } = useQuickLuxCheck();
  const incrementPassiveSuccess = useLumisStore((s) => s.incrementPassiveSuccess);
  const incrementPassiveFail = useLumisStore((s) => s.incrementPassiveFail);

  // Time-based data
  const now = new Date();
  const sunriseMinutes = 6 * 60 + 49;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const hoursSinceSunrise = Math.max(0, (currentMinutes - sunriseMinutes) / 60);

  const { status } = useSmartEnvironment();
  const isOutdoors = status === 'OUTDOORS';
  const pulseOpacity = useSharedValue(0.5);

  const displayName = formatFirstName(userName || 'nitant bhartia');
  const initials = displayName ? displayName.charAt(0).toUpperCase() : 'N';

  const progressPercent = Math.min((todayProgress.lightMinutes / dailyGoalMinutes) * 100, 100);
  const isGoalMet = todayProgress.lightMinutes >= dailyGoalMinutes;

  useEffect(() => {
    if (isOutdoors) {
      pulseOpacity.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isOutdoors]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    shadowOpacity: interpolate(pulseOpacity.value, [0.5, 1], [0.2, 0.6]),
  }));

  const handleStartTracking = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCheckingLux(true);

    try {
      const detectedLux = await checkLux();

      if (detectedLux !== null) {
        if (detectedLux >= 5000) {
          incrementPassiveSuccess();
          router.push('/tracking');
        } else if (detectedLux < 500) {
          incrementPassiveFail();
          router.push('/compass-lux?fallback=true');
        } else {
          router.push('/compass-lux');
        }
      } else {
        router.push('/compass-lux');
      }
    } catch (error) {
      console.error('[Dashboard] Lux check error:', error);
      router.push('/compass-lux');
    } finally {
      setIsCheckingLux(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={{ flex: 1, paddingTop: insets.top + 24 }}>
        {/* Top Header Row: Profile & Streak */}
        <View style={{ paddingHorizontal: 24 }}>
          <View style={styles.topHeaderRow}>
            <Pressable onPress={() => setShowSettings(true)} style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View>
                <Text style={styles.userNameText}>{displayName}</Text>
                <Text style={{ fontSize: 12, color: '#666', fontFamily: 'Outfit_400Regular' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </Pressable>

            <Pressable onPress={() => setShowCalendar(true)} style={styles.streakBadge}>
              <Sun size={16} color="#B8860B" fill="#B8860B" />
              <Text style={styles.streakText}>{currentStreak}</Text>
            </Pressable>
          </View>

          {/* Mission Briefing Card */}
          <MissionBriefingCard
            weatherCondition={weather.condition}
            hoursSinceSunrise={hoursSinceSunrise}
            streak={currentStreak}
            userName={userName}
          />
        </View>

        {/* Action Content Area */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
        >
          {/* Active Tracking Progress Bar (Pill from IMG_9295) */}
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, isOutdoors && styles.progressBarPulse, isOutdoors && pulseStyle]}>
              {progressPercent > 0 && (
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              )}
            </Animated.View>
          </View>

          {/* Morning Light Section */}
          <View style={styles.morningLightSection}>
            <View style={styles.morningLightHeader}>
              <View>
                <View style={styles.morningLightTitleRow}>
                  <Text style={styles.morningLightTitle}>Morning Light</Text>
                  <Pressable
                    onPress={() => setShowMorningLightInfo(true)}
                    hitSlop={10}
                  >
                    <Info size={18} color="#1A1A2E" style={{ marginLeft: 6 }} />
                  </Pressable>
                </View>
                <Text style={styles.morningLightSubtitle}>
                  RECOMMENDED FOR IMPROVED ENERGY, MOOD,{'\n'}AND SLEEP
                </Text>
              </View>
              <View style={styles.recommendedTimeContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {isGoalMet ? (
                    <Shield size={24} color="#FFB347" fill="#FFB347" />
                  ) : (
                    <Lock size={24} color="#999" />
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={styles.recommendedTimeValue}>{dailyGoalMinutes}</Text>
                    <Text style={styles.recommendedTimeUnit}>MIN</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Flexible Spacing */}
          <View style={{ flex: 1 }} />

          {/* Daylight Bar Section */}
          <DaylightBar />

          {/* Equal spacing below weather bar */}
          <View style={{ flex: 1 }} />
        </ScrollView>

        {/* Fixed CTA with Integrated App Unlock */}
        <View style={[styles.fixedCtaContainer, { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1000 }]}>
          <ShieldCta
            onStartTracking={handleStartTracking}
            onManageShield={() => router.push('/(tabs)/shield')}
            blockedApps={blockedApps}
            isCheckingLux={isCheckingLux}
            isGoalMet={isGoalMet}
            progressPercent={progressPercent}
          />
        </View>

        {/* Morning Light Info Modal */}
        {showMorningLightInfo && (
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowMorningLightInfo(false)}
          >
            <Pressable style={styles.morningLightModal} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalParagraph}>
                <Text style={styles.modalBold}>Morning sunlight</Text> is the natural light you get within the first 1–2 hours after sunrise. It signals your brain to wake up and align your body's internal clock, also known as the circadian rhythm.
              </Text>

              <Text style={styles.modalParagraph}>
                Exposure to morning light <Text style={styles.modalBold}>raises cortisol levels</Text> (a healthy wake-up hormone) and <Text style={styles.modalBold}>increases serotonin</Text>, <Text style={styles.modalItalic}>improving focus</Text> and <Text style={styles.modalBold}>mood</Text> throughout the day.
              </Text>

              <Text style={styles.modalParagraph}>
                Lumis identifies how long you need to spend outside in the morning for optimal light exposure.
              </Text>

              <View style={styles.modalHighlight}>
                <Text style={styles.modalHighlightText}>
                  Spend {dailyGoalMinutes} minutes outdoors today{'\n'}between 6:49–11:59 AM.
                </Text>
              </View>

              <Text style={styles.modalNote}>
                No sunglasses are needed, but don't look directly at the sun.
              </Text>

              <Pressable style={styles.modalLearnMore}>
                <Text style={styles.modalLearnMoreText}>Learn more about Morning Light</Text>
              </Pressable>

              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowMorningLightInfo(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        )}

        <UserSettingsModal
          visible={showSettings}
          onClose={() => setShowSettings(false)}
        />

        <CalendarModal
          visible={showCalendar}
          onClose={() => setShowCalendar(false)}
        />

        <EmergencyUnlockModal
          visible={showEmergencyUnlock}
          onClose={() => setShowEmergencyUnlock(false)}
          onSuccess={() => {
            unblockApps();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
        />
      </View >
    </View>
  );
}

const styles = StyleSheet.create({
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  userNameText: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  streakText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  progressBar: {
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  progressBarPulse: {
    shadowColor: '#FFB347',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    borderColor: '#FFB347',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#354E35', // Dark tracking green
    borderRadius: 16,
  },
  morningLightSection: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 32,
  },
  morningLightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  morningLightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  morningLightTitle: {
    fontSize: 28,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
  },
  morningLightSubtitle: {
    fontSize: 9,
    fontFamily: 'Outfit_600SemiBold',
    color: '#666',
    letterSpacing: 0.5,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  recommendedTimeContainer: {
    alignItems: 'flex-end',
  },
  recommendedTimeValue: {
    fontSize: 48,
    fontFamily: 'Outfit_400Regular',
    color: '#1A1A2E',
    lineHeight: 52,
  },
  recommendedTimeUnit: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#999',
    marginLeft: 4,
  },
  fixedCtaContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  morningLightModal: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    maxWidth: 400,
  },
  modalParagraph: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: '#333',
    lineHeight: 22,
    marginBottom: 16,
  },
  modalBold: {
    fontFamily: 'Outfit_700Bold',
  },
  modalItalic: {
    fontStyle: 'italic',
  },
  modalHighlight: {
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalHighlightText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
    lineHeight: 22,
  },
  modalNote: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalLearnMore: {
    borderWidth: 1,
    borderColor: '#E0C090',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalLearnMoreText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#B8860B',
  },
  modalCloseButton: {
    backgroundColor: '#1A1A2E',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFF',
  },
});
