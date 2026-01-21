import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeIn
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { X, Pause, Play, Shield, Sun } from 'lucide-react-native';
import Svg, { Circle, Line, Text as SvgText, G, Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg';
import { useLumisStore } from '@/lib/state/lumis-store';
import { unblockApps } from '@/lib/screen-time';
import { useSmartEnvironment } from '@/lib/hooks/useSmartEnvironment';

const { width, height } = Dimensions.get('window');
const RADAR_SIZE = width * 0.45;

// Circular Sun-Radar Component from IMG_9312
function SunRadar({ heading = 0, sunPosition = 45 }: { heading?: number, sunPosition?: number }) {
  const radius = (RADAR_SIZE - 20) / 2;

  return (
    <View style={{ width: RADAR_SIZE, height: RADAR_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RADAR_SIZE} height={RADAR_SIZE} viewBox="0 0 200 200">
        {/* Radar Rings */}
        {[30, 50, 70, 90].map((r, i) => (
          <Circle
            key={i}
            cx="100"
            cy="100"
            r={r}
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1"
            fill="none"
          />
        ))}

        {/* Outer Tick Marks */}
        {Array.from({ length: 72 }).map((_, i) => {
          const angle = (i * 5 * Math.PI) / 180;
          const r1 = 92;
          const r2 = 98;
          return (
            <Line
              key={i}
              x1={100 + r1 * Math.sin(angle)}
              y1={100 - r1 * Math.cos(angle)}
              x2={100 + r2 * Math.sin(angle)}
              y2={100 - r2 * Math.cos(angle)}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
            />
          );
        })}

        {/* Sun Indicator */}
        <G transform={`rotate(${sunPosition}, 100, 100)`}>
          <Line
            x1="100"
            y1="100"
            x2="100"
            y2="30"
            stroke="#FFB347"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <G transform="translate(100, 30)">
            {/* Tiny sun icon */}
            <Circle cx="0" cy="0" r="4" fill="#FFB347" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Line
                key={i}
                x1="0"
                y1="-6"
                x2="0"
                y2="-8"
                stroke="#FFB347"
                strokeWidth="1"
                transform={`rotate(${i * 45})`}
              />
            ))}
          </G>
        </G>

        {/* Center tiny dot */}
        <Circle cx="100" cy="100" r="2" fill="white" />
      </Svg>
    </View>
  );
}

export default function TrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const todayProgress = useLumisStore((s) => s.todayProgress);
  const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);
  const selectedActivity = useLumisStore((s) => s.selectedActivity);
  const updateTodayProgress = useLumisStore((s) => s.updateTodayProgress);
  const incrementStreak = useLumisStore((s) => s.incrementStreak);
  const addToHistory = useLumisStore((s) => s.addToHistory);
  const setTrackingActive = useLumisStore((s) => s.setTrackingActive);

  const { status, lux, steps, creditRate } = useSmartEnvironment();
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [location, setLocation] = useState<{ city: string; heading: number; temp: number; weather: string } | null>(null);

  const accumulatedMinutesRef = useRef(todayProgress.lightMinutes);
  const pulseScale = useSharedValue(1);

  const sessionMinutes = sessionSeconds / 60;
  const totalMinutes = accumulatedMinutesRef.current + sessionMinutes;
  const isGoalReached = totalMinutes >= dailyGoalMinutes;

  // Estimate calories (rough: 0.05 cal per step walking)
  const calories = Math.round(steps * 0.05);
  // Estimate distance (rough: 0.0005 miles per step)
  const distanceMiles = (steps * 0.0005).toFixed(1);

  const getActivityLabel = () => {
    switch (selectedActivity) {
      case 'walk': return 'WALKING';
      case 'run': return 'RUNNING';
      case 'meditate': return 'MEDITATING';
      case 'sit_soak': return 'SIT & SOAK';
      default: return 'TRACKING';
    }
  };

  useEffect(() => {
    setTrackingActive(true);

    pulseScale.value = withRepeat(
      withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Get location info
    (async () => {
      try {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          const heading = await Location.getHeadingAsync();
          setLocation({
            city: 'SAN DIEGO, CA',
            heading: heading.trueHeading || heading.magHeading || 0,
            temp: 15.0,
            weather: 'MOSTLY CLOUDY',
          });
        }
      } catch (e) {
        console.log('[Tracking] Location error:', e);
      }
    })();

    return () => {
      setTrackingActive(false);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (isPaused || isGoalReached) return;

    const interval = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isGoalReached]);

  // Check for goal completion
  useEffect(() => {
    if (isGoalReached && !todayProgress.completed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      unblockApps();

      const completedProgress = {
        ...todayProgress,
        lightMinutes: totalMinutes,
        steps: steps,
        completed: true,
        unlockTime: new Date().toISOString(),
      };

      updateTodayProgress(completedProgress);
      incrementStreak();
      addToHistory(completedProgress);

      setTimeout(() => {
        router.replace('/victory');
      }, 500);
    }
  }, [isGoalReached]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateTodayProgress({
      lightMinutes: totalMinutes,
      steps: steps,
    });
    router.back();
  };

  const handlePauseToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused(!isPaused);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#8FA3C6', '#C7BCCB', '#F3A675', '#EC8650']}
        locations={[0, 0.3, 0.7, 1]}
        style={{ flex: 1 }}
      >
        {/* Wave Overlay */}
        <View style={StyleSheet.absoluteFill}>
          <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <Path
              d={`M 0 ${height * 0.45} Q ${width * 0.5} ${height * 0.4} ${width} ${height * 0.45} L ${width} ${height} L 0 ${height} Z`}
              fill="rgba(255, 255, 255, 0.05)"
            />
          </Svg>
        </View>

        <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.activityLabel}>{getActivityLabel()}</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <X size={20} color="#1A1A2E" />
            </Pressable>
          </View>

          {/* Tracking Badge */}
          <View style={styles.trackingBadge}>
            <View style={styles.trackingDot} />
            <Text style={styles.trackingText}>Tracking</Text>
          </View>

          {/* Radar Info Card */}
          <Animated.View entering={FadeIn.duration(800)} style={styles.infoCard}>
            <SunRadar heading={location?.heading || 0} />
            <View style={styles.locationInfo}>
              <Text style={styles.headingValue}>
                {location ? `-${Math.round(location.heading)}° W` : '--'}
              </Text>
              <Text style={styles.cityText}>{location?.city || 'LOCATING...'}</Text>
              <Text style={styles.weatherCondition}>{location?.weather || '--'}</Text>
              <Text style={styles.tempText}>{location?.temp.toFixed(1)}°C</Text>
            </View>
          </Animated.View>

          {/* Stats Section */}
          <View style={styles.statsCard}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>STEPS</Text>
              <Text style={styles.statValue}>{steps}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>CALORIES</Text>
              <Text style={styles.statValue}>{calories}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>DISTANCE</Text>
              <Text style={styles.statValue}>{distanceMiles} mi</Text>
            </View>
          </View>

          {/* Large Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(sessionSeconds)}</Text>
          </View>

          {/* Bottom Spacer */}
          <View style={{ flex: 1 }} />

          {/* Pause Button */}
          <Pressable
            onPress={handlePauseToggle}
            style={({ pressed }) => [
              styles.pauseButton,
              pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }
            ]}
          >
            {isPaused ? (
              <Play size={32} color="#1A1A2E" fill="#1A1A2E" />
            ) : (
              <Pause size={32} color="#1A1A2E" fill="#1A1A2E" />
            )}
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 48,
  },
  activityLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFF',
    letterSpacing: 2,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 8,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  trackingText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#1A1A2E',
  },
  infoCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    marginTop: 32,
    gap: 20,
  },
  locationInfo: {
    flex: 1,
  },
  headingValue: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFF',
    marginBottom: 4,
  },
  cityText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  weatherCondition: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  tempText: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFF',
    marginTop: 4,
  },
  statsCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    marginTop: 16,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    color: '#FFF',
  },
  timerContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 80,
    fontFamily: 'Outfit_300Light',
    color: '#FFF',
  },
  pauseButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFE4B5',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});
