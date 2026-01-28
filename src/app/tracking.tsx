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
import { Sun, Shield, Lock, Trash2, X, Zap, AlertTriangle, Info, Cloud, CloudRain, CloudSnow, CloudDrizzle } from 'lucide-react-native';
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
  syncShieldDisplayData,
  markLuxDetected,
} from '@/lib/screen-time';
import { useSmartEnvironment } from '@/lib/hooks/useSmartEnvironment';
import { CoolDownModal } from '@/components/CoolDownModal';
import { ShieldPreviewRow } from '@/components/ShieldPreviewRow';
import { notificationService } from '@/lib/notifications';
import { calculateOutdoorConfidence, calculateMovementConfidence } from '@/lib/utils/outdoor-confidence';
import { useWeather } from '@/lib/hooks/useWeather';
import { isInPocketPattern } from '@/lib/utils/lux-pattern-analyzer';

const { width } = Dimensions.get('window');
const TIMER_SIZE = width * 0.75;
const STROKE_WIDTH = 12;
const RADIUS = (TIMER_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Habit Accountability Messages
const TICKER_MESSAGES = [
  "Actually going outside...",
  "Breaking the scroll addiction...",
  "Earning your screen time...",
  "Don't break the chain...",
  "Future you will thank you...",
  "Building the habit..."
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedView = Animated.createAnimatedComponent(View);

// Weather-based gradient colors
const getWeatherGradient = (condition: string, isDaylight: boolean): { colors: string[], locations: number[] } => {
  const cond = condition.toLowerCase();

  // Night time (6pm - 6am)
  if (!isDaylight) {
    if (cond.includes('clear')) {
      return {
        colors: ['#0F2027', '#203A43', '#2C5364', '#1a1a2e'], // Deep night sky
        locations: [0, 0.3, 0.7, 1]
      };
    }
    if (cond.includes('cloud') || cond.includes('overcast')) {
      return {
        colors: ['#232526', '#414345', '#536976', '#292E49'], // Cloudy night
        locations: [0, 0.35, 0.75, 1]
      };
    }
    if (cond.includes('rain') || cond.includes('drizzle')) {
      return {
        colors: ['#1e3c72', '#2a5298', '#7e8ba3', '#3a4a5c'], // Rainy night
        locations: [0, 0.4, 0.8, 1]
      };
    }
    // Default night
    return {
      colors: ['#0F2027', '#203A43', '#2C5364'],
      locations: [0, 0.5, 1]
    };
  }

  // Daytime conditions
  if (cond.includes('clear') || cond.includes('sunny')) {
    return {
      colors: ['#87CEEB', '#B0E0E6', '#FFD700', '#FFA500'], // Bright sunny sky
      locations: [0, 0.3, 0.7, 1]
    };
  }

  if (cond.includes('partly cloudy') || cond.includes('mainly clear')) {
    return {
      colors: ['#A7C5EB', '#C9D9E8', '#F5D491', '#F0C050'], // Mixed sun & clouds
      locations: [0, 0.4, 0.75, 1]
    };
  }

  if (cond.includes('overcast') || cond.includes('cloudy')) {
    return {
      colors: ['#95A5A6', '#B8C6D0', '#D5DBE0', '#A8B2B8'], // Gray overcast
      locations: [0, 0.35, 0.7, 1]
    };
  }

  if (cond.includes('fog')) {
    return {
      colors: ['#C0C0C0', '#D3D3D3', '#E8E8E8', '#BEBEBE'], // Misty fog
      locations: [0, 0.4, 0.75, 1]
    };
  }

  if (cond.includes('drizzle') || cond.includes('light rain')) {
    return {
      colors: ['#6B8E99', '#8FA3AD', '#B4C5D0', '#7A8C98'], // Light rain
      locations: [0, 0.4, 0.8, 1]
    };
  }

  if (cond.includes('rain') || cond.includes('shower')) {
    return {
      colors: ['#4A6FA5', '#6888B8', '#8EA7C8', '#5A7A9A'], // Rainy day
      locations: [0, 0.35, 0.75, 1]
    };
  }

  if (cond.includes('thunder') || cond.includes('storm')) {
    return {
      colors: ['#2C3E50', '#34495E', '#5D6D7E', '#455A64'], // Stormy dark
      locations: [0, 0.4, 0.75, 1]
    };
  }

  if (cond.includes('snow')) {
    return {
      colors: ['#E0F2F7', '#F0F8FF', '#FFFFFF', '#D6E9F0'], // Snowy bright
      locations: [0, 0.35, 0.7, 1]
    };
  }

  // Default sunrise/sunset gradient
  return {
    colors: ['#8FA3C6', '#C7BCCB', '#F3A675', '#EC8650'],
    locations: [0, 0.4, 0.8, 1]
  };
};

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



// --- 3. Low Confidence Banner (Non-blocking) ---
const LowConfidenceBanner = ({
  lux,
  isVisible,
  creditRate,
  confidenceScore,
  isInPocket
}: {
  lux: number;
  isVisible: boolean;
  creditRate: number;
  confidenceScore?: number;
  isInPocket?: boolean;
}) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(-100, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!isVisible) return null;

  // Softer colors - amber/orange tones instead of red
  const getBannerColor = () => {
    if (creditRate === 0.0) return { bg: 'rgba(251, 191, 36, 0.95)', border: '#F59E0B', text: '#78350F' };
    if (creditRate === 0.5) return { bg: 'rgba(96, 165, 250, 0.95)', border: '#3B82F6', text: '#1E3A5F' };
    return { bg: 'rgba(16, 185, 129, 0.95)', border: '#10B981', text: '#064E3B' };
  };

  const colors = getBannerColor();

  const getMessage = () => {
    if (isInPocket) {
      return { title: 'Phone in pocket?', subtitle: 'Pull it out briefly to verify light' };
    }
    if (creditRate === 0.0) {
      return { title: 'Finding sunlight...', subtitle: 'Timer paused – head outside to continue' };
    }
    if (creditRate === 0.5) {
      return { title: 'Getting there!', subtitle: 'Move to brighter light for full speed' };
    }
    return { title: 'Looking good!', subtitle: 'Full credit' };
  };

  const message = getMessage();

  return (
    <AnimatedView style={[styles.bannerContainer, animatedStyle]} pointerEvents="box-none">
      <View style={[styles.bannerContent, { backgroundColor: colors.bg, borderColor: colors.border }]} pointerEvents="auto">
        <View style={styles.bannerLeft}>
          <Sun size={20} color={colors.text} />
        </View>
        <View style={styles.bannerTextContainer}>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>{message.title}</Text>
          <Text style={[styles.bannerSubtitle, { color: colors.text }]}>{message.subtitle}</Text>
        </View>
        <View style={styles.bannerRight}>
          <View style={[styles.bannerBadge, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
            <Text style={[styles.bannerBadgeText, { color: colors.text }]}>
              {creditRate === 0 ? 'Paused' : creditRate === 0.5 ? '0.5×' : '1×'}
            </Text>
          </View>
        </View>
      </View>
    </AnimatedView>
  );
};

// --- 4. How It Works Modal ---
const HowItWorksModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>How It Works</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={24} color="#FFF" />
            </Pressable>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.modalSection}>
              <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(255, 179, 71, 0.15)' }]}>
                <Sun size={18} color="#FFB347" />
              </View>
              <View style={styles.sectionTextContainer}>
                <Text style={styles.sectionTitle}>Light Check</Text>
                <Text style={styles.sectionText}>
                  We compare ambient light to expected sunlight for your location and time.
                </Text>
              </View>
            </View>

            <View style={styles.modalSection}>
              <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
                <Zap size={18} color="#60A5FA" />
              </View>
              <View style={styles.sectionTextContainer}>
                <Text style={styles.sectionTitle}>Pattern Analysis</Text>
                <Text style={styles.sectionText}>
                  Sunlight changes smoothly. Flashlights and lamps create sudden spikes—easy to detect.
                </Text>
              </View>
            </View>

            <View style={styles.modalSection}>
              <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Shield size={18} color="#10B981" />
              </View>
              <View style={styles.sectionTextContainer}>
                <Text style={styles.sectionTitle}>Movement</Text>
                <Text style={styles.sectionText}>
                  Walking outdoors = <Text style={styles.boldText}>steps + GPS movement</Text>. Treadmills show steps but no location change.
                </Text>
              </View>
            </View>

            <View style={styles.modalSection}>
              <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <AlertTriangle size={18} color="#8B5CF6" />
              </View>
              <View style={styles.sectionTextContainer}>
                <Text style={styles.sectionTitle}>Confidence</Text>
                <Text style={styles.sectionText}>
                  <Text style={styles.boldText}>80%+</Text> full credit  ·  <Text style={styles.boldText}>50-80%</Text> half credit  ·  <Text style={styles.boldText}>&lt;50%</Text> paused
                </Text>
              </View>
            </View>

            <View style={[styles.modalSection, { marginBottom: 8 }]}>
              <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(255, 179, 71, 0.15)' }]}>
                <Info size={18} color="#FFB347" />
              </View>
              <View style={styles.sectionTextContainer}>
                <Text style={styles.sectionTitle}>Pocket Mode</Text>
                <Text style={styles.sectionText}>
                  GPS + steps work in your pocket. Just <Text style={styles.boldText}>pull it out briefly</Text> once or twice to verify light.
                </Text>
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// --- 5. Weather Atmosphere Overlay ---
const WeatherAtmosphere = ({ condition }: { condition: string }) => {
  const cond = condition.toLowerCase();
  const opacity = useSharedValue(0.15);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.25, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));

  // Only show icon for specific conditions
  let WeatherIcon = null;
  let iconColor = 'rgba(255, 255, 255, 0.3)';

  if (cond.includes('cloud') || cond.includes('overcast')) {
    WeatherIcon = Cloud;
  } else if (cond.includes('rain') && cond.includes('thunder')) {
    WeatherIcon = CloudRain;
    iconColor = 'rgba(100, 150, 200, 0.4)';
  } else if (cond.includes('rain') || cond.includes('shower')) {
    WeatherIcon = CloudRain;
    iconColor = 'rgba(120, 170, 220, 0.3)';
  } else if (cond.includes('drizzle')) {
    WeatherIcon = CloudDrizzle;
    iconColor = 'rgba(150, 180, 210, 0.3)';
  } else if (cond.includes('snow')) {
    WeatherIcon = CloudSnow;
    iconColor = 'rgba(200, 220, 240, 0.4)';
  }

  if (!WeatherIcon) return null;

  return (
    <Animated.View style={[styles.weatherAtmosphere, animatedStyle]}>
      <WeatherIcon size={200} color={iconColor} strokeWidth={1} />
    </Animated.View>
  );
};

// --- 6. Science Ticker ---
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

  const environment = useSmartEnvironment();
  const { lux, steps, solarConfidence, luxPatternConfidence, outdoorConfidenceScore } = environment;
  const weather = useWeather();
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Confidence-based validation state
  const [isIndoors, setIsIndoors] = useState(false);
  const [creditRate, setCreditRate] = useState(1.0);
  const [confidenceWarnings, setConfidenceWarnings] = useState<string[]>([]);
  const hasFirstConfidenceCheck = useRef(false);
  const lowConfidenceStartTime = useRef<number | null>(null);
  const CONFIDENCE_THRESHOLD = 50; // Minimum 50% confidence for any credit
  const FULL_CREDIT_THRESHOLD = 80; // 80%+ for full credit
  const GRACE_PERIOD_MS = 5000; // 5 seconds grace period before pausing timer (short for 2-min session)

  // Pocket mode detection
  const [isInPocket, setIsInPocket] = useState(false);
  const luxHistoryRef = useRef<number[]>([]);
  const lastPocketNudgeTime = useRef<number>(0);
  const POCKET_NUDGE_INTERVAL_MS = 45000; // Nudge every 45 seconds

  // Focus Score: Track outdoor lux seconds for sunlight bonus
  const OUTDOOR_LUX_THRESHOLD = 1000;
  const OUTDOOR_LUX_SECONDS_REQUIRED = 120;
  const outdoorLuxSecondsToday = useLumisStore((s) => s.outdoorLuxSecondsToday);
  const incrementOutdoorLuxSeconds = useLumisStore((s) => s.incrementOutdoorLuxSeconds);
  const hasMarkedLuxDetected = useRef(false);
  const [sessionCoordinates, setSessionCoordinates] = useState<{
    latitude: number,
    longitude: number,
    timestamp: number,
    accuracy?: number  // GPS accuracy in meters - lower is better
  }[]>([]);
  const accumulatedMinutesRef = useRef(todayProgress.lightMinutes);

  const [showCoolDown, setShowCoolDown] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  // Fixed 2-minute session duration
  const SESSION_DURATION_SECONDS = 120; // 2 minutes

  const sessionMinutes = sessionSeconds / 60;
  const totalMinutes = accumulatedMinutesRef.current + sessionMinutes;

  // Calculate remaining target based on EFFECTIVE GOAL
  // We want to count down the session goal, correcting for previously accumulated minutes if they count towards it?
  // Actually, 'initialGoal' passed from dashboard implies the "Session Goal" including what's left? 
  // No, dashboard logic is: currentSessionGoal = Duration Value (e.g. 22).
  // Is this the TOTAL daily goal adjusted, or just what's needed for this session?
  // Dashboard: uses `updatedDailyGoal`. So it is the NEW Daily Goal.
  // So: remaining = effectiveGoal - totalMinutes.

  const remainingSeconds = Math.max(0, SESSION_DURATION_SECONDS - sessionSeconds);

  const progress = Math.min(1, sessionSeconds / SESSION_DURATION_SECONDS);
  const dailyProgress = Math.min(1, totalMinutes / effectiveGoal);

  const isGoalReached = sessionSeconds >= SESSION_DURATION_SECONDS;

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
            timestamp: Date.now(),
            accuracy: loc.coords.accuracy || undefined
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

  // Confidence-based validation with activity-movement correlation
  useEffect(() => {
    if (isGoalReached) return;

    // Calculate movement confidence based on activity and actual movement
    const totalDistance = sessionCoordinates.length > 1
      ? sessionCoordinates.reduce((sum, coord, i) => {
          if (i === 0) return 0;
          const prev = sessionCoordinates[i - 1];
          const R = 6371e3; // Earth radius in meters
          const φ1 = prev.latitude * Math.PI / 180;
          const φ2 = coord.latitude * Math.PI / 180;
          const Δφ = (coord.latitude - prev.latitude) * Math.PI / 180;
          const Δλ = (coord.longitude - prev.longitude) * Math.PI / 180;
          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return sum + R * c;
        }, 0)
      : 0;

    // Calculate average GPS accuracy (lower is better)
    const avgGpsAccuracy = sessionCoordinates.length > 0
      ? sessionCoordinates.reduce((sum, coord) => sum + (coord.accuracy || 50), 0) / sessionCoordinates.length
      : 50;

    // GPS accuracy confidence: outdoor = 5-20m, indoor = 50-100m+
    const gpsAccuracyConfidence = avgGpsAccuracy < 20 ? 100
      : avgGpsAccuracy < 40 ? 70
      : avgGpsAccuracy < 60 ? 40
      : 10;

    const movementConfidence = calculateMovementConfidence(
      selectedActivity,
      steps,
      sessionSeconds,
      totalDistance
    );

    // Boost movement confidence if GPS accuracy is good (outdoor signal)
    // Penalize if GPS accuracy is poor (indoor signal)
    let adjustedMovementConfidence = Math.round(
      movementConfidence * (gpsAccuracyConfidence / 100)
    );

    // Special handling for pocket mode: if GPS shows good movement + accuracy,
    // boost confidence even though lux is low
    const pocketDetected = luxHistoryRef.current.length >= 10 && isInPocketPattern(luxHistoryRef.current);
    if (pocketDetected && avgGpsAccuracy < 30 && totalDistance > 100) {
      // Genuine outdoor walking with phone in pocket
      // Don't penalize as harshly - boost movement confidence
      adjustedMovementConfidence = Math.min(100, adjustedMovementConfidence * 1.5);
    }

    // Calculate combined outdoor confidence
    const confidenceResult = calculateOutdoorConfidence({
      solarConfidence: solarConfidence || 50,
      luxPatternConfidence: luxPatternConfidence || 50,
      movementConfidence: adjustedMovementConfidence,
      uvConfidence: weather.uvIndex > 0 ? 100 : undefined
    });

    // Update warnings
    setConfidenceWarnings(confidenceResult.warnings);

    // Mark that we've done first confidence check
    hasFirstConfidenceCheck.current = true;

    // Apply confidence-based credit rate
    // For 2-min sessions: show banner immediately, pause timer after brief grace period
    if (confidenceResult.score < CONFIDENCE_THRESHOLD) {
      // Always show the banner immediately so user knows to go outside
      setIsIndoors(true);

      // Track when low confidence started for grace period
      if (!lowConfidenceStartTime.current) {
        lowConfidenceStartTime.current = Date.now();
      }

      const elapsed = Date.now() - lowConfidenceStartTime.current;
      // After grace period, actually pause the timer
      if (elapsed >= GRACE_PERIOD_MS && creditRate !== 0.0) {
        setCreditRate(0.0);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } else if (confidenceResult.score < FULL_CREDIT_THRESHOLD) {
      // Partial credit (50%) - borderline case
      lowConfidenceStartTime.current = null;
      if (!isIndoors || creditRate !== 0.5) {
        setIsIndoors(true);
        setCreditRate(0.5);
      }
    } else {
      // Full credit - high confidence outdoor
      lowConfidenceStartTime.current = null;
      if (isIndoors || creditRate !== 1.0) {
        setIsIndoors(false);
        setCreditRate(1.0);
        // Celebration haptic when resuming outdoor
        if (creditRate === 0.0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    }

    // Pocket mode detection and helpful nudging
    luxHistoryRef.current.push(lux);
    if (luxHistoryRef.current.length > 30) {
      luxHistoryRef.current.shift();
    }

    if (luxHistoryRef.current.length >= 10) {
      const pocketDetected = isInPocketPattern(luxHistoryRef.current);
      setIsInPocket(pocketDetected);

      // Show helpful nudge if in pocket for extended period
      if (pocketDetected && sessionSeconds > 30) {
        const timeSinceLastNudge = Date.now() - lastPocketNudgeTime.current;
        if (timeSinceLastNudge > POCKET_NUDGE_INTERVAL_MS) {
          lastPocketNudgeTime.current = Date.now();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          // The warning overlay will show the message
        }
      }
    }
  }, [lux, steps, sessionSeconds, sessionCoordinates, isGoalReached, solarConfidence, luxPatternConfidence, selectedActivity, weather.uvIndex]);

  // Focus Score: Track outdoor lux accumulation for sunlight bonus
  useEffect(() => {
    if (isGoalReached) return;

    // Only track if above outdoor lux threshold
    if (lux >= OUTDOOR_LUX_THRESHOLD) {
      incrementOutdoorLuxSeconds();

      // Check if we've hit the threshold for sunlight bonus
      const newTotal = outdoorLuxSecondsToday + 1;
      if (newTotal >= OUTDOOR_LUX_SECONDS_REQUIRED && !hasMarkedLuxDetected.current) {
        hasMarkedLuxDetected.current = true;
        markLuxDetected();
        console.log('[Tracking] Sunlight bonus threshold (120s outdoor lux) achieved!');
      }
    }
  }, [lux, isGoalReached, sessionSeconds]); // Runs each second via sessionSeconds change

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
            {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              timestamp: Date.now(),
              accuracy: loc.coords.accuracy || undefined
            }
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

      // Navigate back to dashboard to show completion state
      setTimeout(() => {
        router.back();
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

  // Get dynamic weather-based gradient
  const weatherGradient = getWeatherGradient(weather.condition, weather.isDaylight);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={weatherGradient.colors}
        locations={weatherGradient.locations}
        style={{ flex: 1 }}
      >
        {/* Weather atmosphere overlay */}
        <WeatherAtmosphere condition={weather.condition} />

        <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 }]}>

          {/* Header: Lux Meter & Info Button */}
          <View style={styles.header}>
            <LuxIntensityMeter lux={lux} />
            <Pressable
              onPress={() => setShowHowItWorksModal(true)}
              style={styles.infoButton}
              hitSlop={10}
            >
              <Info size={20} color="rgba(255, 255, 255, 0.8)" />
            </Pressable>
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
      <HowItWorksModal visible={showHowItWorksModal} onClose={() => setShowHowItWorksModal(false)} />
      <LowConfidenceBanner
        lux={lux}
        isVisible={isIndoors && hasFirstConfidenceCheck.current && (creditRate < 1.0)}
        creditRate={creditRate}
        confidenceScore={outdoorConfidenceScore}
        isInPocket={isInPocket}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  weatherAtmosphere: {
    position: 'absolute',
    top: '15%',
    right: '-10%',
    zIndex: 0,
    transform: [{ rotate: '-15deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
    zIndex: 150,
  },
  infoButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 200,
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
  // Low Confidence Banner (non-blocking)
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingTop: 60, // Account for status bar
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerLeft: {
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    opacity: 0.85,
  },
  bannerRight: {
    marginLeft: 12,
  },
  bannerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bannerBadgeText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
  // How It Works Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#FFF',
  },
  modalScroll: {
    padding: 20,
  },
  modalSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sectionTextContainer: {
    flex: 1,
    paddingTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    color: '#FFF',
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 19,
  },
  boldText: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFB347',
  },
});
