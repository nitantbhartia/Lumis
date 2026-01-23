import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions, Platform, UIManager, LayoutAnimation } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing, interpolate } from 'react-native-reanimated';
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

import { useMissionBriefing } from '@/lib/hooks/useMissionBriefing';
import { MissionBriefingCard } from '@/components/dashboard/MissionBriefingCard';
import { MorningLightSlider } from '@/components/dashboard/MorningLightSlider';
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

  const { status, lux } = useSmartEnvironment();
  const isOutdoors = status === 'OUTDOORS';
  const pulseOpacity = useSharedValue(0.5);
  const timerScale = useSharedValue(1);

  const formattedName = formatFirstName(userName);
  const displayName = formattedName || 'Nitant';
  const initials = displayName ? displayName.charAt(0).toUpperCase() : 'N';

  // Mission & Dynamic Goal - Moved up to influence progress calculation
  const mission = useMissionBriefing(weather.condition, hoursSinceSunrise, currentStreak, userName, dailyGoalMinutes);
  const currentSessionGoal = mission.durationValue; // Adjusted goal

  const progressPercent = Math.min((todayProgress.lightMinutes / currentSessionGoal) * 100, 100);
  const isGoalMet = todayProgress.lightMinutes >= currentSessionGoal;

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

  // Animate layout changes when goal updates (e.g. weather clears)
  // Animate layout changes when goal updates (e.g. weather clears)
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

    // Haptic feedback and visual scale for goal change
    Haptics.selectionAsync();
    timerScale.value = withSequence(
      withTiming(1.1, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 300, easing: Easing.out(Easing.bounce) })
    );
  }, [currentSessionGoal, mission.isAdjusted]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    shadowOpacity: interpolate(pulseOpacity.value, [0.5, 1], [0.2, 0.6]),
  }));

  const timerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerScale.value }]
  }));

  // Haptic Feedback for High Lux Zones
  useEffect(() => {
    if (lux > 10000 && isOutdoors) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [lux, isOutdoors]);

  const handleStartTracking = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/tracking');
  };

  const windowStatus = hoursSinceSunrise < 2 ? "OPTIMAL" : hoursSinceSunrise < 4 ? "GOOD" : "CLOSING";

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
            mission={mission}
            windowStatus={windowStatus}
          />
        </View>

        {/* ACTION SCROLL AREA - Wrapped in ScrollView to prevent CTA cut-off */}
        {/* ACTION SCROLL AREA */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Morning Light Section */}
          <View style={styles.morningLightSection}>
            <View style={styles.morningLightHeader}>
              <View style={{ flex: 1, alignItems: 'center', marginTop: 10 }}>
                {/* Timer Display */}
                <Animated.View style={[{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }, timerAnimatedStyle]}>
                  <Animated.Text
                    sharedTransitionTag="sessionTimer"
                    style={[styles.recommendedTimeValue, { fontSize: 80, lineHeight: 85, color: '#1A1A2E' }]}
                  >
                    {currentSessionGoal}
                  </Animated.Text>
                  <Text style={[styles.recommendedTimeUnit, { fontSize: 20, marginBottom: 16 }]}>MIN</Text>
                </Animated.View>

                {mission.isAdjusted && (
                  <Text style={{ fontSize: 13, color: '#D84315', fontFamily: 'Outfit_500Medium', marginTop: -8 }}>
                    Adjusted for Overcast
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Morning Light Slider (Dynamic Goal) */}
          <MorningLightSlider goalMinutes={currentSessionGoal} luxScore={lux} />
        </ScrollView>

        {/* Integrated Start Button - Pinned to Bottom */}
        <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 6, paddingTop: 10 }}>
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
    marginBottom: 10,
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
    marginTop: 20, // Increased by 10pt as requested
    marginBottom: 8,
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
  inlineCtaContainer: {
    paddingHorizontal: 24,
    marginTop: 12,
    marginBottom: 0,
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
  benefitCapsule: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignSelf: 'flex-start',
  },
  benefitText: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    color: '#333',
    letterSpacing: 0.2,
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
  adjustmentBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: -4,
  },
  adjustmentText: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FF9800',
    textTransform: 'uppercase',
  },
});
