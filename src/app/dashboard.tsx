import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing, interpolate } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Info,
  ArrowRight,
  Sun,
  ChevronDown,
  CloudSun,
  Thermometer,
  Droplets
} from 'lucide-react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { useLumisStore } from '@/lib/state/lumis-store';
import { useAuthStore } from '@/lib/state/auth-store';
import CalendarModal from '../components/CalendarModal';
import EmergencyUnlockModal from '../components/EmergencyUnlockModal';
import { AlertCircle } from 'lucide-react-native';

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

// Sun Arc Component with Expandable Weather
const SunArc = React.memo(({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) => {
  const weather = useWeather();
  const rotation = useSharedValue(0);
  const heightValue = useSharedValue(0);
  const opacityValue = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 180 : 0, { duration: 300 });
    heightValue.value = withTiming(expanded ? 100 : 0, { duration: 300, easing: Easing.inOut(Easing.ease) });
    opacityValue.value = expanded
      ? withDelay(100, withTiming(1, { duration: 200 }))
      : withTiming(0, { duration: 200 });
  }, [expanded]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    height: heightValue.value,
    opacity: opacityValue.value,
    overflow: 'hidden',
    marginTop: interpolate(heightValue.value, [0, 100], [0, 24]),
  }));

  return (
    <View style={styles.sunArcContainer}>
      {/* Chevron Toggle */}
      <Pressable onPress={onToggle} style={styles.chevronContainer} hitSlop={10}>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={24} color="rgba(0,0,0,0.1)" />
        </Animated.View>
      </Pressable>

      <Svg width={width - 48} height={80} viewBox="0 0 300 80">
        <Path
          d="M 20 70 Q 150 -10 280 70"
          stroke="#E0E0E0"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
        />
        <Circle cx="150" cy="25" r="8" fill="#FFB347" />
        <G transform="translate(150, 65)">
          {Array.from({ length: 8 }).map((_, i) => (
            <Path
              key={i}
              d="M 0 -10 L 0 -18"
              stroke="#1A1A2E"
              strokeWidth="1"
              transform={`rotate(${i * 45 - 112.5})`}
            />
          ))}
          <Circle cx="0" cy="0" r="5" stroke="#1A1A2E" strokeWidth="1" fill="none" />
        </G>
      </Svg>

      <View style={styles.sunTimesRow}>
        <View style={styles.sunTimeItem}>
          <Text style={styles.sunTimeLabel}>Sunrise</Text>
          <Text style={styles.sunTimeValue}>6:49 <Text style={styles.sunTimeAmPm}>am</Text></Text>
        </View>
        <Pressable style={styles.weatherItem} onPress={onToggle}>
          <WeatherGraphic condition={weather.condition} />
          <Text style={styles.weatherCondition}>{weather.condition}</Text>
        </Pressable>
        <View style={styles.sunTimeItem}>
          <Text style={styles.sunTimeLabel}>Sunset</Text>
          <Text style={styles.sunTimeValue}>5:09 <Text style={styles.sunTimeAmPm}>pm</Text></Text>
        </View>
      </View>

      {/* Expanded Weather Data */}
      <Animated.View style={[styles.expandedWeatherContainer, contentStyle]}>
        <View style={styles.weatherBox}>
          <CloudSun size={20} color="#FFB347" />
          <Text style={styles.weatherBoxLabel}>UV Index</Text>
          <Text style={styles.weatherBoxValue}>{weather.uvIndex}</Text>
        </View>
        <View style={styles.weatherBox}>
          <Thermometer size={20} color="#6495ED" />
          <Text style={styles.weatherBoxLabel}>Temp</Text>
          <Text style={styles.weatherBoxValue}>{weather.temperature}°C</Text>
        </View>
        <View style={styles.weatherBox}>
          <Droplets size={20} color="#4682B4" />
          <Text style={styles.weatherBoxLabel}>Humidity</Text>
          <Text style={styles.weatherBoxValue}>{weather.humidity}%</Text>
        </View>
      </Animated.View>
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
  const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);

  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmergencyUnlock, setShowEmergencyUnlock] = useState(false);
  const [peopleCount, setPeopleCount] = useState(142);
  const [isWeatherExpanded, setIsWeatherExpanded] = useState(false);

  useEffect(() => {
    // Make people count dynamic based on current hour/minute
    const now = new Date();
    const dynamicBase = 120 + (now.getHours() * 2) + Math.floor(now.getMinutes() / 5);
    setPeopleCount(dynamicBase);
  }, []);

  const initials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'NB';

  const handleStartTracking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/shield');
  };

  const toggleWeather = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsWeatherExpanded(!isWeatherExpanded);
  }

  const progressPercent = Math.min((todayProgress.lightMinutes / dailyGoalMinutes) * 100, 100);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={{ flex: 1, paddingTop: insets.top + 20 }}>
        {/* Header Section */}
        <View style={[styles.header, { zIndex: 99 }]}>
          <Pressable onPress={() => setShowSettings(true)} style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeText}>Good evening,</Text>
              <Text style={styles.userNameText}>{userName || 'nitant bhartia'}</Text>
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
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Community Stats */}
          <View style={styles.communityRow}>
            <Sun size={12} color="#FFB347" fill="#FFB347" />
            <Text style={styles.communityText}>{peopleCount} PEOPLE GETTING THEIR DAILY SUN</Text>
          </View>

          {/* Active Tracking Progress Bar (Pill from IMG_9295) */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              {progressPercent > 0 && (
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              )}
            </View>
          </View>

          {/* How It Works */}
          <Pressable
            style={styles.howItWorksButton}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Info size={14} color="#1A1A2E" />
            <Text style={styles.howItWorksText}>HOW IT WORKS</Text>
          </Pressable>

          {/* Exposure Status */}
          <View style={styles.exposureStatusContainer}>
            <Text style={styles.exposureStatusText}>
              Today you completed <Text style={styles.exposureValue}>{Math.round(todayProgress.lightMinutes)}</Text> minutes of <Text style={styles.exposureType}>Morning Light Exposure</Text>
            </Text>
            <Info size={18} color="rgba(0,0,0,0.3)" />
          </View>

          {/* Emergency Unlock Trigger (Floating Pill) */}
          <Pressable
            style={styles.emergencyPill}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowEmergencyUnlock(true);
            }}
          >
            <AlertCircle size={14} color="#FF6347" />
            <Text style={styles.emergencyPillText}>Need to unlock an app?</Text>
          </Pressable>

          {/* Spacer if needed to keep button visible */}
          <View style={{ flex: 1, minHeight: 40 }} />
        </ScrollView>

        {/* White Bottom Card Area - Fixed at bottom */}
        <View style={styles.bottomCardContainer}>
          <View style={styles.bottomCard}>
            <SunArc expanded={isWeatherExpanded} onToggle={toggleWeather} />

            <Pressable
              style={styles.mainCta}
              onPress={handleStartTracking}
            >
              <LinearGradient
                colors={['#FFE4B5', '#FFB347', '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>See you in the morning</Text>
                <ArrowRight size={24} color="#1A1A2E" strokeWidth={2} />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>

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
          console.log('App unlocked via Emergency Flare');
        }}
      />
    </View>
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
  bottomCardContainer: {
    width: '100%',
  },
  bottomCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: width * 0.4,
    borderTopRightRadius: width * 0.4,
    paddingTop: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  sunArcContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  chevronContainer: {
    position: 'absolute',
    top: -55,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    zIndex: 10,
  },
  sunTimesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: -15,
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
    marginBottom: 40,
    marginTop: 12,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
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
});
