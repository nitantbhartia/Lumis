import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  FadeInDown,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Sun, Flame, Shield, Settings, BarChart3, ChevronRight, Lock, Unlock, Trophy, Users, Activity } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useLumisStore } from '@/lib/state/lumis-store';
import { blockApps, unblockApps, areAppsCurrentlyBlocked } from '@/lib/screen-time';
import WeatherCard from '@/components/WeatherCard';
import { GlassCard } from '@/components/GlassCard';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Confetti } from '@/components/Confetti';
import { celebrationSequence } from '@/lib/haptics';

function ProgressRing({
  progress,
  isCompleted,
  size = 300,
  strokeWidth = 16,
}: {
  progress: number;
  isCompleted: boolean;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (progress > 0.9 && !isCompleted) {
      glowOpacity.value = withRepeat(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else if (isCompleted) {
      glowOpacity.value = 0.8;
    } else {
      glowOpacity.value = 0;
    }
  }, [progress, isCompleted]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: isCompleted ? '#22C55E' : '#FFB347',
    shadowColor: isCompleted ? '#22C55E' : '#FFB347',
    shadowRadius: 50,
    shadowOpacity: 1,
  }));

  const getGradientColors = () => {
    if (isCompleted) {
      return {
        id: 'successGradient',
        colors: ['#4ADE80', '#22C55E', '#16A34A'],
      };
    } else if (progress < 0.5) {
      return {
        id: 'mutedGradient',
        colors: ['#FFE4B5', '#FFB347', '#FF8C00'],
      };
    } else {
      return {
        id: 'progressGradient',
        colors: ['#FFE4B5', '#FFB347', '#FF6B35'],
      };
    }
  };

  const gradient = getGradientColors();

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={glowStyle as any} />
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <SvgLinearGradient id={gradient.id} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradient.colors[0]} />
            <Stop offset="50%" stopColor={gradient.colors[1]} />
            <Stop offset="100%" stopColor={gradient.colors[2]} />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#0F3460"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradient.id})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}

// Helper function for dynamic greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const todayProgress = useLumisStore((s) => s.todayProgress);
  const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);
  const currentStreak = useLumisStore((s) => s.currentStreak);
  const blockedApps = useLumisStore((s) => s.blockedApps);

  const [showConfetti, setShowConfetti] = useState(false);
  const [hasTriggeredCelebration, setHasTriggeredCelebration] = useState(false);

  const buttonScale = useSharedValue(1);

  const progress = todayProgress.lightMinutes / dailyGoalMinutes;
  const isCompleted = todayProgress.completed;
  const blockedCount = blockedApps.filter((app) => app.isBlocked).length;

  // Trigger celebration when goal completed
  useEffect(() => {
    if (isCompleted && !hasTriggeredCelebration) {
      setShowConfetti(true);
      celebrationSequence();
      setHasTriggeredCelebration(true);
    }
  }, [isCompleted, hasTriggeredCelebration]);

  // Manage app blocking based on goal completion
  useEffect(() => {
    if (blockedCount > 0) {
      if (isCompleted) {
        // Goal completed - unblock apps
        const result = unblockApps();
        console.log('[Dashboard] Goal completed, unblocking apps:', result);
      } else {
        // Goal not completed - ensure apps are blocked
        const result = blockApps();
        console.log('[Dashboard] Goal not completed, blocking apps:', result);
      }
    }
  }, [isCompleted, blockedCount]);

  const handleStartTracking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/tracking');
  };

  const handleOpenSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/settings');
  };

  const handleOpenAnalytics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/analytics');
  };

  const handleOpenInsights = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/insights');
  };

  const handleOpenLeaderboard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/leaderboard');
  };

  const handleOpenFriends = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/friends');
  };

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View className="flex-1">
      <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={{ flex: 1 }}>
        {/* Confetti overlay */}
        {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 120,
          }}
        >
          <Animated.View entering={FadeIn.duration(400)} className="px-6 mb-8">
            <View className="flex-row items-center justify-between">
              <View>
                <Text
                  className="text-lumis-sunrise/60 text-xs mb-1 uppercase tracking-widest"
                  style={{ fontFamily: 'Outfit_600SemiBold' }}
                >
                  {getGreeting()}
                </Text>
                <Text
                  className="text-4xl text-lumis-dawn"
                  style={{ fontFamily: 'Syne_800ExtraBold' }}
                >
                  {isCompleted ? 'SUN DRENCHED' : 'EARN YOUR LIGHT'}
                </Text>
              </View>

              <Pressable
                onPress={handleOpenSettings}
                className="active:scale-90"
              >
                <View className="w-12 h-12 rounded-2xl bg-white/5 items-center justify-center border border-white/10">
                  <Settings size={22} color="#FFF8E7" />
                </View>
              </Pressable>
            </View>
          </Animated.View>

          {/* Progress Section */}
          <Animated.View
            entering={FadeInDown.springify().delay(200)}
            className="items-center mb-12"
          >
            <View className="relative">
              <ProgressRing progress={progress} isCompleted={isCompleted} size={300} strokeWidth={16} />
              <View className="absolute inset-0 items-center justify-center">
                <View
                  className={`w-32 h-32 rounded-full items-center justify-center ${isCompleted ? 'bg-success/10' : 'bg-lumis-golden/5'
                    }`}
                >
                  <Sun
                    size={64}
                    color={isCompleted ? '#4ADE80' : '#FFB347'}
                    strokeWidth={1}
                    fill={isCompleted ? '#4ADE8020' : '#FFB34710'}
                  />
                </View>
              </View>
            </View>

            <View className="items-center mt-xl">
              <Text
                className="text-6xl text-lumis-dawn"
                style={{ fontFamily: 'Syne_800ExtraBold' }}
              >
                {Math.round(todayProgress.lightMinutes)}
                <Text
                  className="text-3xl text-lumis-sunrise/40"
                  style={{ fontFamily: 'Syne_700Bold' }}
                >
                  /{dailyGoalMinutes}
                </Text>
              </Text>
              <Text
                className="text-lumis-sunrise/60 mt-sm tracking-wide"
                style={{ fontFamily: 'Outfit_500Medium' }}
              >
                {isCompleted ? 'TARGET ACHIEVED' : 'TO GO'}
              </Text>
            </View>
          </Animated.View>

          {/* Stats Row */}
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            className="flex-row px-6 mb-8 gap-4"
          >
            <View className="flex-1">
              <GlassCard variant="hero" glowColor="#FF8C00">
                <View className="flex-row items-center gap-2 mb-2">
                  <Flame size={18} color="#FFB347" />
                  <Text className="text-lumis-sunrise/60 text-xs uppercase tracking-wider" style={{ fontFamily: 'Outfit_600SemiBold' }}>Streak</Text>
                </View>
                <Text className="text-3xl text-lumis-dawn" style={{ fontFamily: 'Syne_700Bold' }}>{currentStreak}</Text>
                <Text className="text-lumis-sunrise/40 text-[10px] mt-1" style={{ fontFamily: 'Outfit_400Regular' }}>DAY STREAK</Text>
              </GlassCard>
            </View>

            <View className="flex-1">
              <GlassCard variant="elevated">
                <View className="flex-row items-center gap-2 mb-2">
                  <Shield size={18} color="#8B5CF6" />
                  <Text className="text-lumis-sunrise/60 text-xs uppercase tracking-wider" style={{ fontFamily: 'Outfit_600SemiBold' }}>Apps</Text>
                </View>
                <Text className="text-3xl text-lumis-dawn" style={{ fontFamily: 'Syne_700Bold' }}>{blockedCount}</Text>
                <Text className="text-lumis-sunrise/40 text-[10px] mt-1" style={{ fontFamily: 'Outfit_400Regular' }}>APPS GUARDED</Text>
              </GlassCard>
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(500).springify()} className="px-6 mb-12 gap-4">
            <Pressable onPress={handleOpenAnalytics}>
              <GlassCard variant="default">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-4">
                    <View className="w-12 h-12 rounded-2xl bg-lumis-accent/10 items-center justify-center">
                      <BarChart3 size={24} color="#8B5CF6" />
                    </View>
                    <View>
                      <Text className="text-lumis-dawn text-lg" style={{ fontFamily: 'Outfit_600SemiBold' }}>Analytics</Text>
                      <Text className="text-lumis-sunrise/40 text-sm" style={{ fontFamily: 'Outfit_400Regular' }}>Your light exposure trends</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#8B5CF6" strokeWidth={1.5} />
                </View>
              </GlassCard>
            </Pressable>

            <Pressable onPress={handleOpenInsights}>
              <GlassCard variant="default">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-4">
                    <View className="w-12 h-12 rounded-2xl bg-lumis-golden/10 items-center justify-center">
                      <Trophy size={24} color="#FFB347" />
                    </View>
                    <View>
                      <Text className="text-lumis-dawn text-lg" style={{ fontFamily: 'Outfit_600SemiBold' }}>Insights</Text>
                      <Text className="text-lumis-sunrise/40 text-sm" style={{ fontFamily: 'Outfit_400Regular' }}>Personalized recommendations</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#FFB347" strokeWidth={1.5} />
                </View>
              </GlassCard>
            </Pressable>
          </Animated.View>
        </ScrollView>

        {/* Fixed bottom button */}
        {!isCompleted && (
          <View
            className="absolute bottom-0 left-0 right-0 px-6"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <Animated.View style={buttonAnimStyle}>
              <Pressable
                onPress={handleStartTracking}
                onPressIn={() => {
                  buttonScale.value = withSpring(0.95);
                }}
                onPressOut={() => {
                  buttonScale.value = withSpring(1);
                }}
                className="w-full"
              >
                <LinearGradient
                  colors={['#FFB347', '#FF8C00', '#FF6B35']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 18,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#FF8C00',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 16,
                    elevation: 8,
                  }}
                >
                  <Sun size={22} color="#1A1A2E" strokeWidth={2} />
                  <Text
                    className="text-lumis-night text-lg ml-2"
                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                  >
                    Start Light Tracking
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}
