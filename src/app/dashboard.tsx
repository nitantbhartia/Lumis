import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, Easing, interpolate } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Info,
  ArrowRight,
  Sun,
  ChevronDown,
  CloudSun,
  Thermometer,
  Droplets,
  Shield,
  Lock,
  Instagram,
  Video,
  Twitter,
  Facebook,
  Youtube,
  MessageCircle,
  Ghost,
  Film
} from 'lucide-react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { useLumisStore } from '@/lib/state/lumis-store';
import { useAuthStore } from '@/lib/state/auth-store';
import { useSmartEnvironment } from '@/lib/hooks/useSmartEnvironment';
import { unblockApps } from '@/lib/screen-time';
import CalendarModal from '../components/CalendarModal';
import EmergencyUnlockModal from '../components/EmergencyUnlockModal';
import { AlertCircle } from 'lucide-react-native';
import { formatFirstName } from '@/lib/utils/name-utils';
import { useQuickLuxCheck } from '@/lib/hooks/useQuickLuxCheck';

const { width, height } = Dimensions.get('window');

import { useWeather } from '@/lib/hooks/useWeather';

// Simple weather icon component that renders different SVGs based on condition
// We'll use lucide icons as a base but style them to look "graphic"
const WeatherGraphic = ({ condition }: { condition: string }) => {
  const c = condition.toLowerCase();
  if (c.includes('cloud')) return <CloudSun size={24} color="#1A1A2E" />;
  if (c.includes('rain') || c.includes('drizzle')) return <Droplets size={24} color="#4682B4" />;
  if (c.includes('clear') || c.includes('sunny')) return <Sun size={24} color="#FFB347" strokeWidth={2} />;
  return <CloudSun size={24} color="#1A1A2E" />;
};

// Daylight Bar Component with Live Tracker - Always visible
const DaylightBar = React.memo(() => {
  const weather = useWeather();
  const glowScale = useSharedValue(1);

  // Calculate tracker position based on current time
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const sunriseMinutes = 6 * 60 + 49; // 6:49 AM
  const sunsetMinutes = 17 * 60 + 10; // 5:10 PM
  const dayLength = sunsetMinutes - sunriseMinutes;

  // Progress from 0 (sunrise) to 1 (sunset)
  let progress = (currentMinutes - sunriseMinutes) / dayLength;
  progress = Math.max(0, Math.min(1, progress));

  // Determine if it's daytime
  const isDaytime = currentMinutes >= sunriseMinutes && currentMinutes <= sunsetMinutes;

  useEffect(() => {
    // Pulsing glow animation for the sun tracker
    glowScale.value = withRepeat(
      withTiming(1.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: interpolate(glowScale.value, [1, 1.3], [0.6, 0.2]),
  }));

  // Track dimensions for the arc
  const trackWidth = width - 48 - (28 * 2) - (12 * 2); // Container width - icons - gaps
  const trackHeight = 40;

  return (
    <View style={styles.daylightContainer}>
      {/* Main Daylight Bar */}
      <View style={styles.daylightBarWrapper}>
        {/* Sunrise Icon */}
        <View style={styles.sunIconContainer}>
          <Svg width={28} height={28} viewBox="0 0 24 24">
            <Circle cx="12" cy="18" r="4" fill="#FFB347" />
            <Path d="M12 2v4M12 18v4M4.22 10.22l2.83 2.83M16.95 13.05l2.83 2.83M2 18h4M18 18h4M4.22 25.78l2.83-2.83M16.95 22.95l2.83-2.83" stroke="#FFB347" strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M4 18h16" stroke="#E0E0E0" strokeWidth="1" />
          </Svg>
          <Text style={styles.sunTimeSmall}>6:49</Text>
        </View>

        {/* Progress Arc Track */}
        <View style={[styles.daylightTrack, { height: trackHeight, backgroundColor: 'transparent' }]}>
          <Svg width="100%" height={trackHeight} style={{ position: 'absolute' }}>
            {/* Subtle Arc Path - Increased visibility */}
            <Path
              d={`M 0 ${trackHeight - 5} Q ${trackWidth / 2} -10 ${trackWidth} ${trackHeight - 5}`}
              stroke="rgba(255,179,71,0.3)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="4,6"
            />

            {/* Active Progress Path - Solid and more opaque */}
            <Path
              d={`M 0 ${trackHeight - 5} Q ${trackWidth / 2} -10 ${trackWidth} ${trackHeight - 5}`}
              stroke="#FFB347"
              strokeWidth="3"
              fill="none"
              strokeDasharray={`${progress * (trackWidth * 1.15)}, 1000`}
              opacity={0.8}
            />

            {/* Sun Tracker along the arc - Exact quadratic formula */}
            {isDaytime && (
              <G transform={`translate(${progress * trackWidth}, ${(1 - progress) ** 2 * (trackHeight - 5) + 2 * (1 - progress) * progress * (-10) + progress ** 2 * (trackHeight - 5)})`}>
                <Circle r="14" fill="rgba(255,179,71,0.5)" />
                <Circle r="8" fill="#FFB347" />
                <Circle r="4" fill="#FFF" />
              </G>
            )}
          </Svg>
        </View>

        {/* Sunset Icon */}
        <View style={styles.sunIconContainer}>
          <Svg width={28} height={28} viewBox="0 0 24 24">
            <Circle cx="12" cy="18" r="4" fill="#FF8C42" opacity={0.6} />
            <Path d="M12 14v-4M4.22 10.22l2.83 2.83M16.95 13.05l2.83 2.83M2 18h4M18 18h4" stroke="#FF8C42" strokeWidth="1.5" strokeLinecap="round" opacity={0.6} />
            <Path d="M4 18h16" stroke="#E0E0E0" strokeWidth="1" />
          </Svg>
          <Text style={styles.sunTimeSmall}>5:10</Text>
        </View>
      </View>

  // Weather Data Row - Simplified and Cleaner
      <View style={styles.weatherDataRow}>
        <Text style={styles.weatherDataLabel}>{weather.condition}</Text>
        <Text style={styles.weatherDataDividerDot}>•</Text>
        <Text style={styles.weatherDataValueMinimal}>{weather.temperature}°</Text>
        <Text style={styles.weatherDataDividerDot}>•</Text>
        <Text style={styles.weatherDataValueMinimal}>UV {weather.uvIndex}</Text>
      </View>
    </View>
  );
});

import UserSettingsModal from '../components/UserSettingsModal';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userName = useAuthStore((s) => s.userName);
  const currentStreak = useLumisStore((s) => s.currentStreak);
  const todayProgress = useLumisStore((s) => s.todayProgress);
  const blockedApps = useLumisStore((s) => s.blockedApps);
  const useEmergencyUnlock = useLumisStore((s) => s.useEmergencyUnlock);
  const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);

  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmergencyUnlock, setShowEmergencyUnlock] = useState(false);
  const [showMorningLightInfo, setShowMorningLightInfo] = useState(false);
  const [isCheckingLux, setIsCheckingLux] = useState(false);

  const { checkLux } = useQuickLuxCheck();
  const incrementPassiveSuccess = useLumisStore((s) => s.incrementPassiveSuccess);
  const incrementPassiveFail = useLumisStore((s) => s.incrementPassiveFail);
  const [selectedBlockedApp, setSelectedBlockedApp] = useState<string | null>(null);
  const [peopleCount, setPeopleCount] = useState(142);
  const [isWeatherExpanded, setIsWeatherExpanded] = useState(false);

  // Time-based greeting and CTA logic
  const now = new Date();
  const currentHour = now.getHours();
  const sunsetHour = 17; // 5 PM
  const sunriseHour = 6;

  const { status } = useSmartEnvironment();
  const isOutdoors = status === 'OUTDOORS';
  const pulseOpacity = useSharedValue(0.5);

  const getGreeting = () => {
    if (currentHour >= 5 && currentHour < 12) return 'Good morning';
    if (currentHour >= 12 && currentHour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getCtaText = () => {
    // After sunset or before sunrise: "See you in the morning"
    if (currentHour >= sunsetHour || currentHour < sunriseHour) {
      return 'See you in the morning';
    }
    // Morning (sunrise to noon): "Get your morning light"
    if (currentHour >= sunriseHour && currentHour < 12) {
      return 'Get your morning light';
    }
    // Afternoon: "Get your afternoon light"
    return 'Get your afternoon light';
  };

  useEffect(() => {
    // Make people count dynamic based on current hour/minute
    const dynamicBase = 120 + (currentHour * 2) + Math.floor(now.getMinutes() / 5);
    setPeopleCount(dynamicBase);
  }, []);

  const displayName = formatFirstName(userName || 'nitant bhartia');
  const initials = displayName ? displayName.charAt(0).toUpperCase() : 'N';

  const handleStartTracking = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCheckingLux(true);

    try {
      // Quick passive lux check
      const detectedLux = await checkLux();

      // Smart routing based on lux level
      if (detectedLux !== null) {
        if (detectedLux >= 5000) {
          // User is already in optimal sunlight - skip calibration
          incrementPassiveSuccess();
          router.push('/tracking');
        } else if (detectedLux < 500) {
          // User appears to be indoors - show gentle nudge
          incrementPassiveFail();
          router.push('/compass-lux?fallback=true');
        } else {
          // Borderline case - show standard calibration
          router.push('/compass-lux');
        }
      } else {
        // Sensor unavailable - show standard calibration
        router.push('/compass-lux');
      }
    } catch (error) {
      console.error('[Dashboard] Lux check error:', error);
      router.push('/compass-lux');
    } finally {
      setIsCheckingLux(false);
    }
  };

  const toggleWeather = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsWeatherExpanded(!isWeatherExpanded);
  }

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

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={{ flex: 1, paddingTop: insets.top + 48 }}>
        {/* Header Section */}
        <View style={[styles.header, { zIndex: 99 }]}>
          <Pressable onPress={() => setShowSettings(true)} style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeText}>{getGreeting()},</Text>
              <Text style={styles.userNameText}>{displayName}</Text>
            </View>
          </Pressable>
          <Pressable
            style={styles.calendarTrigger}
            hitSlop={20}
            onPress={() => {
              console.log('Opening calendar...');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCalendar(true);
            }}
          >
            <Sun size={24} color="#1A1A2E" fill="#FFB347" />
            <Text style={styles.streakCountText}>{currentStreak}</Text>
          </Pressable>
        </View>

        {/* Action Content Area */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        >
          {/* Community Stats */}

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

          {/* Flexible Spacing to balance the weather bar */}
          <View style={{ flex: 1 }} />

          {/* Daylight Bar Section - Now back inside ScrollView */}
          <View style={styles.daylightSection}>
            <DaylightBar />
          </View>

          {/* Shielded Apps Carousel - Only show if there are blocked apps */}
          {blockedApps.some(a => a.isBlocked) && (
            <View style={styles.shieldedAppsSection}>
              <View style={styles.shieldedAppsHeader}>
                <Text style={styles.shieldedAppsTitle}>Shielded Apps</Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/shield')}
                  style={styles.manageShieldsButton}
                >
                  <Text style={styles.manageShieldsText}>{blockedApps.filter(a => a.isBlocked).length} Active</Text>
                  <ArrowRight size={12} color="#666" />
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shieldedAppsList}
              >
                {/* Show only top 3 blocked apps to reduce noise */}
                {blockedApps.filter(a => a.isBlocked).slice(0, 3).map((app) => (
                  <Pressable
                    key={app.id}
                    style={[styles.shieldedAppItem, { opacity: Math.max(0.4, progressPercent / 100) }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      setSelectedBlockedApp(app.name);
                      setShowEmergencyUnlock(true);
                    }}
                  >
                    <View style={styles.shieldedAppIconWrapper}>
                      {app.id === 'instagram' && <Instagram size={32} color="#C13584" />}
                      {app.id === 'tiktok' && <Video size={32} color="#000000" />}
                      {app.id === 'twitter' && <Twitter size={32} color="#1DA1F2" />}
                      {app.id === 'facebook' && <Facebook size={32} color="#1877F2" />}
                      {app.id === 'youtube' && <Youtube size={32} color="#FF0000" />}
                      {app.id === 'reddit' && <MessageCircle size={32} color="#FF4500" />}
                      {app.id === 'snapchat' && <Ghost size={32} color="#FFFC00" />}
                      {app.id === 'netflix' && <Film size={32} color="#E50914" />}

                      <View style={styles.shieldOverlay}>
                        <Lock size={12} color="#FFF" />
                      </View>
                    </View>
                    {/* Removed Text Labels to cleaner look */}
                  </Pressable>
                ))}

                {blockedApps.filter(a => a.isBlocked).length > 3 && (
                  <View style={styles.moreAppsIndicator}>
                    <Text style={styles.moreAppsText}>+{blockedApps.filter(a => a.isBlocked).length - 3}</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Equal spacing below weather bar */}
          <View style={{ flex: 1 }} />
        </ScrollView>

        {/* Morning Light Info Modal */}
        {
          showMorningLightInfo && (
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
          )
        }
      </View >

      {/* Fixed CTA Button - Just above nav bar */}
      < View style={[styles.fixedCtaContainer, { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1000 }]} >
        <Pressable
          style={styles.mainCta}
          onPress={handleStartTracking}
        >
          <LinearGradient
            colors={['#FFC77D', '#FF8C00']} // Lighter top to match "swell"
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }} // Vertical gradient
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>{isCheckingLux ? 'Checking light...' : getCtaText()}</Text>
            {!isCheckingLux && <ArrowRight size={24} color="#1A1A2E" strokeWidth={2} />}
          </LinearGradient>
        </Pressable>
      </View >

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
          // Optional: Update state to reflect unblocked status immediately if needed
          // But useLumisStore's daily progress might not need to change unless we count this as "cheated" progress?
          // For now, just unblock the apps.
        }}
      />
    </View >
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
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
  welcomeTextContainer: {
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#1A1A2E',
    opacity: 0.8,
  },
  userNameText: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
  },
  calendarTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  streakCountText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
    gap: 8,
  },
  communityText: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
    opacity: 0.6,
    letterSpacing: 1,
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
  howItWorksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 24,
    alignSelf: 'flex-start',
    marginBottom: 20,
    gap: 6,
  },
  howItWorksText: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
    letterSpacing: 0.5,
  },
  exposureStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  exposureStatusText: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Outfit_400Regular',
    color: '#1A1A2E',
    lineHeight: 28,
  },
  exposureValue: {
    fontFamily: 'Outfit_700Bold',
  },
  exposureType: {
    fontFamily: 'Outfit_600SemiBold',
  },
  daylightSection: {
    width: '100%',
    paddingHorizontal: 24,
    // Increased standard vertical margin
    marginVertical: 40,
  },
  fixedCtaContainer: {
    // Reverting to floating capsule style based on "Capsule Shape" request
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  bottomSection: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  bottomCardContainer: {
    width: '100%',
  },
  bottomCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: width * 0.5,
    borderTopRightRadius: width * 0.5,
    paddingTop: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  sunArcContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  // Daylight Bar Styles
  daylightContainer: {
    width: '100%',
    paddingHorizontal: 8,
    // Reduced bottom margin for streamlined look
    marginBottom: 8,
  },
  daylightBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sunIconContainer: {
    alignItems: 'center',
    gap: 4,
  },
  sunTimeSmall: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    color: '#666',
  },
  daylightTrack: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 6,
    overflow: 'visible',
    position: 'relative',
  },
  trackGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
  },
  trackProgress: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  sunTracker: {
    position: 'absolute',
    top: -10,
    marginLeft: -16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFB347',
  },
  sunDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFB347',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  weatherConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 8,
  },
  weatherConditionText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#666',
  },
  // Weather Data Row - Always visible inline
  weatherDataRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline', // Strict horizontal baseline alignment
    paddingVertical: 12, // Increased breathing room
    gap: 16, // Wider gap between items
  },
  weatherDataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherDataLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#666',
  },
  weatherDataValueMinimal: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#1A1A2E',
  },
  weatherDataDividerDot: {
    fontSize: 14,
    color: '#CCC',
    marginHorizontal: 4,
  },
  // Legacy styles (keeping for compatibility)
  chevronOutside: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    display: 'none',
  },
  chevronOutsideCard: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -24,
    zIndex: 10,
  },
  arcWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunTimesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: -30,
  },
  sunTimeItem: {
    alignItems: 'center',
  },
  sunTimeLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_500Medium',
    color: '#999',
    marginBottom: 2,
  },
  sunTimeValue: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
  },
  sunTimeAmPm: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
  },
  weatherItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherIcon: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  weatherCondition: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#777',
    marginTop: 4,
  },
  expandedWeatherContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    gap: 12,
  },
  weatherBox: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 6,
  },
  weatherBoxLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#999',
  },
  weatherBoxValue: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
  },
  mainCta: {
    width: '100%',
    shadowColor: '#FF8C00', // Amber glow
    shadowOffset: { width: 0, height: 8 }, // Balanced, substantial shadow
    shadowOpacity: 0.5, // Stronger glow opacity
    shadowRadius: 24, // Wide diffusion for "emitting light" look
    elevation: 8,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24, // Increased for ~72px total height
    paddingHorizontal: 32,
    borderRadius: 36, // Full capsule shape
  },
  ctaText: {
    fontSize: 20,
    fontFamily: 'Outfit_500Medium',
    color: '#1A1A2E',
  },
  emergencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 99, 71, 0.1)',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 99, 71, 0.2)',
  },
  emergencyPillText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FF6347',
  },
  // Morning Light Section
  morningLightSection: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 32, // Added spacing below the 16 MIN section
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
  lightTypeText: {
    fontSize: 24,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(26, 26, 46, 0.3)',
    marginTop: 8,
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
  shieldedAppsSection: {
    // Reduced bottom margin to bring it closer to equal visual weight but kept enough space
    marginBottom: 0,
    marginTop: 40, // Increased to separate from weather row
    width: '90%', // Narrower than full width
    alignSelf: 'center', // Centered
  },
  shieldedAppsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  shieldedAppsTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
  },
  manageShieldsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
  },
  manageShieldsText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#666',
  },
  shieldedAppsList: {
    paddingHorizontal: 24,
    gap: 16,
    paddingRight: 40,
  },
  shieldedAppItem: {
    alignItems: 'center',
    width: 64,
  },
  shieldedAppIconWrapper: {
    width: 60, // Normalized size
    height: 60,
    borderRadius: 20, // Softer corners
    backgroundColor: 'transparent', // Removed background
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    borderWidth: 0, // Removed border
  },
  shieldOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1A1A2E',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  shieldedAppName: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#1A1A2E',
    marginBottom: 2,
    textAlign: 'center',
  },
  unlockTimeText: {
    fontSize: 10,
    fontFamily: 'Outfit_400Regular',
    color: '#FF6B6B',
    textAlign: 'center',
  },
  moreAppsIndicator: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreAppsText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#666',
  },
  manualLogLink: {
    marginTop: 24,
    marginBottom: 48,
    alignSelf: 'center',
    padding: 8,
  },
  manualLogLinkText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#999',
    textDecorationLine: 'underline',
  },
});
