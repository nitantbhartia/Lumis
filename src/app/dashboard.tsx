import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
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
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Sun,
  Flame,
  Shield as ShieldIcon,
  Settings,
  BarChart3,
  ChevronRight,
  Lock,
  Unlock,
  Trophy,
  Users,
  Activity,
  Zap,
  Clock,
  Layout
} from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useLumisStore } from '@/lib/state/lumis-store';
import { blockApps, unblockApps, areAppsCurrentlyBlocked } from '@/lib/screen-time';
import WeatherCard from '@/components/WeatherCard';
import { GlassCard } from '@/components/GlassCard';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Confetti } from '@/components/Confetti';
import { celebrationSequence } from '@/lib/haptics';
import { CircadianChart } from '@/components/CircadianChart';

function ProgressRing({
  progress,
  isCompleted,
  size = 280,
  strokeWidth = 14,
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
    backgroundColor: isCompleted ? '#4ADE80' : '#FFB347',
    shadowColor: isCompleted ? '#4ADE80' : '#FFB347',
    shadowRadius: 50,
    shadowOpacity: 1,
  }));

  const getGradientColors = () => {
    if (isCompleted) {
      return { id: 'successGradient', colors: ['#4ADE80', '#22C55E', '#16A34A'] };
    }
    return { id: 'progressGradient', colors: ['#FFE4B5', '#FFB347', '#FF6B35'] };
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
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#0F3460" strokeWidth={strokeWidth} fill="transparent" opacity={0.3} />
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

  // Manage app blocking
  useEffect(() => {
    const timer = setTimeout(() => {
      if (blockedCount > 0) {
        if (isCompleted) {
          unblockApps();
        } else {
          blockApps();
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [isCompleted, blockedCount]);

  const handleStartTracking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/tracking');
  };

  const handleOpenSettings = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/settings'); };
  const handleOpenShield = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/shield'); };

  return (
    <View className="flex-1 bg-lumis-night">
      <LinearGradient colors={['#10101E', '#16213E', '#10101E']} style={StyleSheet.absoluteFill} />

      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 120 }}
      >
        {/* Profile & Settings Header */}
        <View className="px-8 flex-row justify-between items-center mb-10">
          <View>
            <Text className="text-lumis-sunrise/40 text-[10px] uppercase font-black tracking-[0.3em] mb-1">Your Biology</Text>
            <Text className="text-lumis-dawn text-2xl" style={{ fontFamily: 'Syne_700Bold' }}>{isCompleted ? 'Harmony Found' : 'Seeking Balance'}</Text>
          </View>
          <Pressable onPress={handleOpenSettings} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <Settings size={22} color="#FFFFFF" opacity={0.6} />
          </Pressable>
        </View>

        {/* Floating Shield Status (Opal Inspired) */}
        {!isCompleted && blockedCount > 0 && (
          <Animated.View entering={FadeInDown} className="px-8 mb-8">
            <Pressable onPress={handleOpenShield} className="overflow-hidden rounded-3xl border border-white/10">
              <BlurView intensity={30} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={['rgba(255,179,71,0.1)', 'transparent']} style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                <View className="w-10 h-10 rounded-full bg-lumis-golden/20 items-center justify-center">
                  <Lock size={18} color="#FFB347" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-lumis-dawn text-sm font-bold">App Shields Active</Text>
                  <Text className="text-lumis-sunrise/50 text-xs">Unlocking as soon as you hit your goal.</Text>
                </View>
                <ChevronRight size={16} color="#FFFFFF" opacity={0.3} />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Main Progress Hub */}
        <View className="items-center mb-12">
          <View className="relative items-center justify-center">
            <ProgressRing progress={progress} isCompleted={isCompleted} />
            <View className="absolute items-center justify-center">
              <Text className="text-lumis-sunrise/30 text-xs uppercase font-black tracking-widest mb-1">Light Intake</Text>
              <Text className="text-6xl text-lumis-dawn" style={{ fontFamily: 'Syne_800ExtraBold' }}>
                {Math.round(todayProgress.lightMinutes)}
              </Text>
              <Text className="text-lumis-sunrise/40 text-sm font-bold mt-1">/ {dailyGoalMinutes} min</Text>
            </View>
          </View>
        </View>

        {/* Circadian Insights (Rise Science style) */}
        <CircadianChart />

        {/* Weather & External Data */}
        <View className="px-6 mt-8">
          <WeatherCard />
        </View>

        {/* Quick Actions */}
        <View className="px-6 mt-8 flex-row gap-4">
          <View className="flex-1 bg-white/5 rounded-3xl p-6 border border-white/10">
            <Flame size={24} color="#FF6B35" />
            <Text className="text-2xl text-lumis-dawn font-black mt-2">{currentStreak}</Text>
            <Text className="text-[10px] text-lumis-sunrise/40 uppercase font-bold tracking-widest mt-1">Day Streak</Text>
          </View>
          <View className="flex-1 bg-white/5 rounded-3xl p-6 border border-white/10">
            <Activity size={24} color="#3B82F6" />
            <Text className="text-2xl text-lumis-dawn font-black mt-2">{todayProgress.steps.toLocaleString()}</Text>
            <Text className="text-[10px] text-lumis-sunrise/40 uppercase font-bold tracking-widest mt-1">Morning Steps</Text>
          </View>
        </View>

      </ScrollView>

      {/* Floating CTA */}
      <View className="absolute bottom-10 left-8 right-8">
        <Pressable
          onPress={handleStartTracking}
          onPressIn={() => { buttonScale.value = withSpring(0.96); }}
          onPressOut={() => { buttonScale.value = withSpring(1); }}
        >
          <Animated.View style={{ transform: [{ scale: buttonScale.value }] }}>
            <LinearGradient
              colors={['#FFB347', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 22,
                borderRadius: 28,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#FFB347',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
              }}
            >
              <Zap size={22} color="#1A1A2E" strokeWidth={3} fill="#1A1A2E" />
              <Text className="text-lumis-night text-lg font-black uppercase tracking-widest ml-3">Capture Light</Text>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}
