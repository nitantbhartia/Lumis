import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform, Modal, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { Sun, Shield, Lock, Trash2, X, Zap, AlertTriangle } from 'lucide-react-native';
import { calculateVitaminD } from '@/lib/bio-metrics';
import Svg, { Circle, G, Line } from 'react-native-svg';
import { useLumisStore } from '@/lib/state/lumis-store';
import {
  deactivateShield,
  activateShield,
  LumisIcon,
  startLiveActivity,
  updateLiveActivity,
  endLiveActivity,
  areLiveActivitiesEnabled,
  syncShieldDisplayData
} from '@/lib/screen-time';
import { useSmartEnvironment } from '@/lib/hooks/useSmartEnvironment';
import { CoolDownModal } from '@/components/CoolDownModal';
import { ShieldPreviewRow } from '@/components/ShieldPreviewRow';
import { notificationService } from '@/lib/notifications';

const { width } = Dimensions.get('window');
const TIMER_SIZE = width * 0.75;
const STROKE_WIDTH = 12;
const RADIUS = (TIMER_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Science Ticker Messages
const TICKER_MESSAGES = [
  "Anchoring morning cortisol...",
  "Calibrating circadian clock...",
  "Clearing sleep adenosine...",
  "Generating serenity...",
  "Boosting serotonin levels...",
  "Aligning biological rhythm..."
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedView = Animated.createAnimatedComponent(View);

// --- 1. Biological Sun Timer (Pulse Countdown) ---
const BiologicalSunTimer = ({ progress, remainingSeconds }: { progress: number, remainingSeconds: number }) => {
  const animatedProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 1000, easing: Easing.out(Easing.ease) });
  }, [progress]);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = CIRCUMFERENCE - (CIRCUMFERENCE * animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  // Glow pulse for the active ring
  const glowOpacity = useSharedValue(0.5);
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    shadowOpacity: glowOpacity.value,
  }));

  const textPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.timerContainer}>
      <Svg width={TIMER_SIZE} height={TIMER_SIZE} viewBox={`0 0 ${TIMER_SIZE} ${TIMER_SIZE}`}>
        <G rotation="-90" origin={`${TIMER_SIZE / 2}, ${TIMER_SIZE / 2}`}>
          {/* Background Ring (Glassy) */}
          <Circle
            cx={TIMER_SIZE / 2}
            cy={TIMER_SIZE / 2}
            r={RADIUS}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress Ring (Amber Glow) */}
          <AnimatedCircle
            cx={TIMER_SIZE / 2}
            cy={TIMER_SIZE / 2}
            r={RADIUS}
            stroke="#FFB347"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            animatedProps={animatedProps}
            // @ts-ignore - reanimated props
            style={[glowStyle, {
              shadowColor: "#FFB347",
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 10,
            }]}
          />
        </G>
      </Svg>

      {/* Center Display */}
      <View style={styles.timerCenter}>
        <AnimatedText sharedTransitionTag="sessionTimer" style={[styles.timerValue, textPulseStyle]}>
          {formatTime(remainingSeconds)}
        </AnimatedText>
        <Text style={styles.timerLabel}>REMAINING</Text>
      </View>
    </View>
  );
};

// --- 2. Lux Intensity Meter ---
const LuxIntensityMeter = ({ lux }: { lux: number }) => {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (lux > 1000) {
      pulseScale.value = withRepeat(
        withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [lux]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(lux, [0, 10000], [0.6, 1]),
  }));

  const sunColor = lux > 5000 ? "#FFD700" : (lux > 1000 ? "#FFB347" : "rgba(255, 255, 255, 0.6)");

  return (
    <View style={styles.luxContainer}>
      <Animated.View style={[styles.luxIconContainer, animatedStyle]}>
        <Sun
          size={32}
          color={sunColor}
          fill={lux > 1000 ? sunColor : "none"}
          strokeWidth={lux > 1000 ? 0 : 2}
        />
      </Animated.View>
      <View style={styles.luxTextContainer}>
        <Text style={styles.luxValue}>{lux.toLocaleString()} LUX</Text>
        <Text style={styles.luxLabel}>INTENSITY</Text>
      </View>
    </View>
  );
};



// --- 3. Indoor Warning Overlay ---
const IndoorWarningOverlay = ({ lux, isVisible }: { lux: number; isVisible: boolean }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, { duration: 300 });
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value > 0 ? 'auto' : 'none',
  }));

  if (!isVisible) return null;

  return (
    <AnimatedView style={[styles.indoorOverlay, animatedStyle]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.indoorContent}>
        <AlertTriangle size={32} color="#FFB347" strokeWidth={2} />
        <Text style={styles.indoorTitle}>Indoor Light Detected</Text>
        <Text style={styles.indoorSubtitle}>Earning at 0.5x rate</Text>
        <View style={styles.indoorLuxBadge}>
          <Sun size={16} color="#FFB347" />
          <Text style={styles.indoorLuxText}>{lux.toLocaleString()} LUX</Text>
        </View>
        <Text style={styles.indoorHint}>Step outside to earn full credit</Text>
      </View>
    </AnimatedView>
  );
};

// --- 4. Science Ticker ---
const ScienceTicker = () => {
  const [msgIndex, setMsgIndex] = useState(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      opacity.value = withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 500 })
      );
      setTimeout(() => {
        setMsgIndex(prev => (prev + 1) % TICKER_MESSAGES.length);
      }, 500);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));

  return (
    <View style={styles.tickerContainer}>
      <AnimatedText style={[styles.tickerText, animatedStyle]}>
        {TICKER_MESSAGES[msgIndex]}
      </AnimatedText>
    </View>
  );
};



export default function TrackingScreen() {
  const router = useRouter();
  const { initialGoal } = useLocalSearchParams(); // Ensure 'useLocalSearchParams' is imported
  const insets = useSafeAreaInsets();

  const todayProgress = useLumisStore((s) => s.todayProgress);
  const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);

  // Use passed session goal or fallback to daily goal (which might be lower/unadjusted)
  const effectiveGoal = initialGoal ? Number(initialGoal) : dailyGoalMinutes;

  const selectedActivity = useLumisStore((s) => s.selectedActivity);
  const updateTodayProgress = useLumisStore((s) => s.updateTodayProgress);
  const incrementStreak = useLumisStore((s) => s.incrementStreak);
  const addToHistory = useLumisStore((s) => s.addToHistory);
  const setTrackingActive = useLumisStore((s) => s.setTrackingActive);
  const blockedApps = useLumisStore((s) => s.blockedApps);
  const activeApps = useMemo(() => blockedApps.filter(a => a.isBlocked), [blockedApps]);

  const { lux, steps } = useSmartEnvironment();
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Indoor detection state
  const [isIndoors, setIsIndoors] = useState(false);
  const [creditRate, setCreditRate] = useState(1.0);
  const lowLuxStartTime = useRef<number | null>(null);
  const LUX_THRESHOLD = 500;
  const GRACE_PERIOD_MS = 15000;
  const [sessionCoordinates, setSessionCoordinates] = useState<{ latitude: number, longitude: number, timestamp: number }[]>([]);
  const accumulatedMinutesRef = useRef(todayProgress.lightMinutes);

  const [showCoolDown, setShowCoolDown] = useState(false);

  const sessionMinutes = sessionSeconds / 60;
  const totalMinutes = accumulatedMinutesRef.current + sessionMinutes;

  // Calculate remaining target based on EFFECTIVE GOAL
  // We want to count down the session goal, correcting for previously accumulated minutes if they count towards it?
  // Actually, 'initialGoal' passed from dashboard implies the "Session Goal" including what's left? 
  // No, dashboard logic is: currentSessionGoal = Duration Value (e.g. 22).
  // Is this the TOTAL daily goal adjusted, or just what's needed for this session?
  // Dashboard: uses `updatedDailyGoal`. So it is the NEW Daily Goal.
  // So: remaining = effectiveGoal - totalMinutes.

  const remainingMinutes = Math.max(0, effectiveGoal - totalMinutes);
  const remainingSeconds = Math.max(0, (remainingMinutes * 60));

  const progress = Math.min(1, sessionMinutes / Math.max(1, effectiveGoal - accumulatedMinutesRef.current));
  const dailyProgress = Math.min(1, totalMinutes / effectiveGoal);

  const isGoalReached = totalMinutes >= effectiveGoal;

  useEffect(() => {
    setTrackingActive(true);

    // Activate shields
    if (Platform.OS === 'ios') {
      activateShield();
      // Sync initial shield display data
      syncShieldDisplayData();

      // Start Live Activity for lock screen / Dynamic Island
      if (areLiveActivitiesEnabled()) {
        const initialRemaining = Math.max(0, (effectiveGoal - accumulatedMinutesRef.current) * 60);
        startLiveActivity(effectiveGoal, Math.round(initialRemaining), lux);
      }
    }

    // Location Tracking
    (async () => {
      try {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setSessionCoordinates([{
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            timestamp: Date.now()
          }]);
        }
      } catch (e) {
        console.log("Loc start error", e);
      }
    })();

    return () => {
      setTrackingActive(false);
      // End Live Activity when leaving tracking
      if (Platform.OS === 'ios') {
        endLiveActivity();
      }
    };
  }, []);

  // Indoor detection - monitor lux with 15s grace period
  useEffect(() => {
    if (isGoalReached) return;

    if (lux < LUX_THRESHOLD) {
      if (!lowLuxStartTime.current) {
        lowLuxStartTime.current = Date.now();
      }

      const elapsed = Date.now() - lowLuxStartTime.current;
      if (elapsed >= GRACE_PERIOD_MS && !isIndoors) {
        setIsIndoors(true);
        setCreditRate(0.5);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } else {
      // Lux recovered - reset to full credit
      lowLuxStartTime.current = null;
      if (isIndoors) {
        setIsIndoors(false);
        setCreditRate(1.0);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [lux, isGoalReached, isIndoors]);

  // Timer Tick - apply credit rate for indoor penalty
  useEffect(() => {
    if (isGoalReached) return;

    const interval = setInterval(async () => {
      setSessionSeconds((prev) => prev + creditRate);

      // Record coordinate every 30 seconds to save batt
      if (Math.floor(sessionSeconds + 1) % 30 === 0) {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setSessionCoordinates(prev => [
            ...prev,
            { latitude: loc.coords.latitude, longitude: loc.coords.longitude, timestamp: Date.now() }
          ]);
        } catch (e) { console.log('Loc update error', e) }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isGoalReached, sessionSeconds, creditRate]);

  // Progress notification updates every 30 seconds
  useEffect(() => {
    if (isGoalReached) {
      notificationService.dismissProgressNotification();
      return;
    }

    const updateNotification = () => {
      notificationService.updateProgressNotification({
        remainingMinutes: Math.ceil(remainingSeconds / 60),
        creditRate,
        luxLevel: lux,
      });
    };

    // Initial notification
    updateNotification();

    // Update every 30 seconds
    const interval = setInterval(updateNotification, 30000);

    return () => {
      clearInterval(interval);
      notificationService.dismissProgressNotification();
    };
  }, [isGoalReached, Math.floor(remainingSeconds / 30), creditRate]);

  // Live Activity and Shield Display updates every 5 seconds for smoother UI
  useEffect(() => {
    if (Platform.OS !== 'ios' || isGoalReached) return;

    const updateLA = () => {
      updateLiveActivity(
        Math.round(remainingSeconds),
        lux,
        creditRate,
        isIndoors
      );
      // Also sync shield display data so blocked app screen shows current progress
      syncShieldDisplayData();
    };

    // Update every 5 seconds
    const interval = setInterval(updateLA, 5000);
    updateLA(); // Initial update

    return () => clearInterval(interval);
  }, [isGoalReached, Math.floor(remainingSeconds / 5), creditRate, isIndoors, lux]);

  // Goal Completion
  useEffect(() => {
    if (isGoalReached && !todayProgress.completed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      deactivateShield();

      const completedProgress = {
        ...todayProgress,
        lightMinutes: totalMinutes,
        steps: steps,
        completed: true,
        unlockTime: new Date().toISOString(),
      };

      const skinType = useLumisStore.getState().skinType;
      const vitD = calculateVitaminD(4, sessionSeconds / 60, skinType);

      const session = {
        id: `session_${Date.now()}`,
        type: selectedActivity || 'walk',
        startTime: new Date().toISOString(),
        durationSeconds: sessionSeconds,
        lightMinutes: totalMinutes - accumulatedMinutesRef.current,
        steps: steps,
        calories: Math.round(steps * 0.05),
        distance: parseFloat((steps * 0.0005).toFixed(2)),
        lux: lux,
        uvIndex: 4,
        temperature: 15.0,
        vitaminD: vitD,
        coordinates: sessionCoordinates
      };

      useLumisStore.getState().addActivityToHistory(session as any);
      updateTodayProgress(completedProgress);
      incrementStreak();
      addToHistory(completedProgress);

      setTimeout(() => {
        router.replace('/victory');
      }, 500);
    }
  }, [isGoalReached]);

  const handleEmergencyBreak = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowCoolDown(true);
  };

  const confirmExit = () => {
    setShowCoolDown(false);
    deactivateShield();
    updateTodayProgress({
      lightMinutes: totalMinutes,
      steps: steps,
    });
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#8FA3C6', '#C7BCCB', '#F3A675', '#EC8650']} // Sunset to Sunrise
        locations={[0, 0.4, 0.8, 1]}
        style={{ flex: 1 }}
      >
        <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 }]}>

          {/* Header: Lux Meter & Environment */}
          <View style={styles.header}>
            <LuxIntensityMeter lux={lux} />
          </View>

          {/* Main Content */}
          <View style={styles.content}>

            {/* Science Ticker */}
            <ScienceTicker />

            {/* Sun Timer */}
            <BiologicalSunTimer progress={dailyProgress} remainingSeconds={remainingSeconds} />

            {/* Shield Preview */}
            {activeApps.length > 0 && (
              <BlurView intensity={20} tint="light" style={styles.shieldPreviewCard}>
                <ShieldPreviewRow activeApps={activeApps} lux={lux} />
              </BlurView>
            )}

          </View>

          {/* Footer: Emergency Break */}
          <Pressable onPress={handleEmergencyBreak} style={styles.emergencyButton} hitSlop={20}>
            <Text style={styles.emergencyText}>Emergency Break</Text>
          </Pressable>

        </View>
      </LinearGradient>

      <CoolDownModal visible={showCoolDown} onComplete={confirmExit} />
      <IndoorWarningOverlay lux={lux} isVisible={isIndoors} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  // Lux Meter
  luxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  luxIconContainer: {
    // 
  },
  luxTextContainer: {
    justifyContent: 'center',
  },
  luxValue: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#FFF',
  },
  luxLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  // Ticker
  tickerContainer: {
    height: 30, // Fixed height to prevent layout jumps
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickerText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  // Sun Timer
  timerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerValue: {
    fontSize: 64,
    fontFamily: 'Outfit_300Light',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 2,
    marginTop: 4,
  },
  // Shield Preview
  shieldPreviewCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  shieldRowContainer: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  glowContainer: {
    shadowColor: '#FFB347',
    shadowOffset: { width: 0, height: 0 },
  },
  shieldLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  iconScroll: {
    maxHeight: 40,
  },
  iconScrollContent: {
    paddingHorizontal: 24,
    gap: 16,
    alignItems: 'center',
    minWidth: '100%',
    justifyContent: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    gap: 16,
  },
  shieldIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Glassy container for icon
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Emergency Button
  emergencyButton: {
    alignSelf: 'center',
    padding: 12,
  },
  emergencyText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.5)',
    textDecorationLine: 'underline',
  },
  // Indoor Warning Overlay
  indoorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  indoorContent: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  indoorTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#FFF',
    marginTop: 8,
  },
  indoorSubtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#FFB347',
  },
  indoorLuxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 179, 71, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  indoorLuxText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFB347',
  },
  indoorHint: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
});
