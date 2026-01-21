import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  X,
  Sun,
  Clock,
  Shield,
  Bell,
  Info,
  ChevronRight,
  Minus,
  Plus,
  LogOut,
  User,
  Trophy,
  Heart,
} from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import { useAuthStore } from '@/lib/state/auth-store';
import { GlassCard } from '@/components/GlassCard';
import { formatFirstName } from '@/lib/utils/name-utils';

function SectionHeader({ title, delay = 0 }: { title: string; delay?: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} className="mb-md">
      <Text className="text-lumis-sunrise/40 text-[10px] uppercase tracking-[3px]" style={{ fontFamily: 'Outfit_700Bold' }}>
        {title}
      </Text>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isPremium = useLumisStore((s) => s.isPremium);
  const isTrialActive = useLumisStore((s) => s.isTrialActive());
  const hasPremiumAccess = isPremium || isTrialActive;

  const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);
  const setDailyGoalMinutes = useLumisStore((s) => s.setDailyGoalMinutes);
  const wakeWindowStart = useLumisStore((s) => s.wakeWindowStart);
  const wakeWindowEnd = useLumisStore((s) => s.wakeWindowEnd);
  const blockedApps = useLumisStore((s) => s.blockedApps);
  const achievements = useLumisStore((s) => s.achievements);
  const notificationPreferences = useLumisStore((s) => s.notificationPreferences);
  const setNotificationPreferences = useLumisStore((s) => s.setNotificationPreferences);
  const weatherAdaptiveGoalsEnabled = useLumisStore((s) => s.weatherAdaptiveGoalsEnabled);
  const setWeatherAdaptiveGoalsEnabled = useLumisStore((s) => s.setWeatherAdaptiveGoalsEnabled);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const blockedCount = blockedApps.filter((app) => app.isBlocked).length;
  const unlockedAchievements = achievements.filter((a) => a.unlocked).length;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleIncrementGoal = () => {
    if (!hasPremiumAccess && dailyGoalMinutes >= 10) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/premium');
      return;
    }
    if (dailyGoalMinutes < 30) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDailyGoalMinutes(dailyGoalMinutes + 1);
    }
  };

  const handleDecrementGoal = () => {
    if (!hasPremiumAccess && dailyGoalMinutes <= 10) {
      // Allow going down if somehow above 10, but clamp at 10 effectively
      // Actually, free users should be stick at 10.
      // If they promote to premium then downgrade, we reset them to 10.
      return;
    }
    if (dailyGoalMinutes > 5) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDailyGoalMinutes(dailyGoalMinutes - 1);
    }
  };

  const handleManageApps = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/app-selection');
  };

  const handleAchievements = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/achievements');
  };

  const handleHealthSync = () => {
    if (!hasPremiumAccess) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/premium');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Implement actual health sync
  };

  const handleToggleWeatherAdaptive = (value: boolean) => {
    if (!hasPremiumAccess) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/premium');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeatherAdaptiveGoalsEnabled(value);
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logout();
    router.replace('/');
  };

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/premium');
  };

  return (
    <View className="flex-1 bg-lumis-night">
      <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={{ flex: 1 }}>
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-6 pb-6"
          style={{ paddingTop: insets.top + 20 }}
        >
          <View>
            <Text
              className="text-4xl text-lumis-dawn"
              style={{ fontFamily: 'Syne_800ExtraBold' }}
            >
              PREFERENCES
            </Text>
            <View className="h-1 w-12 bg-lumis-golden rounded-full mt-1" />
          </View>
          <Pressable
            onPress={handleClose}
            className="w-12 h-12 rounded-2xl bg-white/5 items-center justify-center border border-white/10"
          >
            <X size={22} color="#FFF8E7" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 40 }}
        >
          {/* SECTION 1: ROUTINE */}
          <SectionHeader title="Routine" delay={100} />

          <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-lg">
            <GlassCard variant="default">
              {/* Daily Goal Stepper */}
              <View className="flex-row items-center justify-between mb-lg">
                <View className="flex-1">
                  <Text className="text-lumis-dawn text-lg" style={{ fontFamily: 'Outfit_600SemiBold' }}>Daily Goal</Text>
                  <Text className="text-lumis-sunrise/40 text-sm" style={{ fontFamily: 'Outfit_400Regular' }}>How much sun you need each morning</Text>
                </View>
                <View className="flex-row items-center bg-white/5 rounded-2xl p-2 gap-4">
                  <Pressable onPress={handleDecrementGoal} className="w-10 h-10 items-center justify-center bg-white/5 rounded-xl">
                    <Minus size={18} color="#FFB347" />
                  </Pressable>
                  <Text className="text-2xl text-lumis-dawn min-w-[32px] text-center" style={{ fontFamily: 'Syne_700Bold' }}>{dailyGoalMinutes}</Text>
                  <Pressable onPress={handleIncrementGoal} className="w-10 h-10 items-center justify-center bg-white/5 rounded-xl">
                    <Plus size={18} color="#FFB347" />
                  </Pressable>
                </View>
              </View>

              {/* Weather Adaptive */}
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-lumis-dawn text-lg" style={{ fontFamily: 'Outfit_600SemiBold' }}>Smart Goals</Text>
                  <Text className="text-lumis-sunrise/40 text-sm" style={{ fontFamily: 'Outfit_400Regular' }}>Auto-flex based on the weather</Text>
                </View>
                <Switch
                  value={weatherAdaptiveGoalsEnabled}
                  onValueChange={handleToggleWeatherAdaptive}
                  trackColor={{ false: '#0F3460', true: '#FFB34760' }}
                  thumbColor={weatherAdaptiveGoalsEnabled ? '#FFB347' : '#16213E'}
                />
              </View>
            </GlassCard>
          </Animated.View>

          {/* SECTION 2: FOCUS */}
          <SectionHeader title="Focus" delay={200} />

          <Animated.View entering={FadeInDown.delay(250).springify()} className="mb-lg gap-3">
            <GlassCard variant="default" onPress={handleManageApps}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <Shield size={22} color="#8B5CF6" />
                  <View>
                    <Text className="text-lumis-dawn text-lg" style={{ fontFamily: 'Outfit_600SemiBold' }}>Shielded Apps</Text>
                    <Text className="text-lumis-sunrise/40 text-sm">{blockedCount} apps protected</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#8B5CF6" />
              </View>
            </GlassCard>

            <GlassCard variant="default" onPress={handleAchievements}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <Trophy size={22} color="#FFB347" />
                  <View>
                    <Text className="text-lumis-dawn text-lg" style={{ fontFamily: 'Outfit_600SemiBold' }}>Achievements</Text>
                    <Text className="text-lumis-sunrise/40 text-sm">{unlockedAchievements} milestones reached</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#FFB347" />
              </View>
            </GlassCard>
          </Animated.View>

          {/* SECTION 3: SYSTEM */}
          <SectionHeader title="System" delay={300} />

          <Animated.View entering={FadeInDown.delay(350).springify()} className="mb-lg gap-3">
            <GlassCard variant="default">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <Bell size={22} color="#3B82F6" />
                  <View>
                    <Text className="text-lumis-dawn text-lg" style={{ fontFamily: 'Outfit_600SemiBold' }}>Notifications</Text>
                    <Text className="text-lumis-sunrise/40 text-sm">Morning reminders</Text>
                  </View>
                </View>
                <Switch
                  value={notificationPreferences.enabled}
                  onValueChange={(v) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setNotificationPreferences({ enabled: v });
                  }}
                  trackColor={{ false: '#0F3460', true: '#FFB34760' }}
                  thumbColor={notificationPreferences.enabled ? '#FFB347' : '#16213E'}
                />
              </View>
            </GlassCard>

            <GlassCard variant="default" onPress={handleHealthSync}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <Heart size={22} color="#EF4444" />
                  <View>
                    <Text className="text-lumis-dawn text-lg" style={{ fontFamily: 'Outfit_600SemiBold' }}>Apple Health</Text>
                    <Text className="text-lumis-sunrise/40 text-sm">Sync exposure data</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#EF4444" />
              </View>
            </GlassCard>
          </Animated.View>

          {/* SECTION 4: ACCOUNT */}
          <SectionHeader title="Account" delay={400} />

          <Animated.View entering={FadeInDown.delay(450).springify()} className="mb-2xl gap-3">
            <GlassCard variant="flat">
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-2xl bg-white/5 items-center justify-center border border-white/10">
                  <User size={22} color="#FFF8E7" />
                </View>
                <View className="flex-1">
                  <Text className="text-lumis-dawn text-lg" style={{ fontFamily: 'Outfit_600SemiBold' }}>{formatFirstName(user?.name || 'Explorer')}</Text>
                  <Text className="text-lumis-sunrise/40 text-sm">{user?.email || 'Premium member'}</Text>
                </View>
              </View>
            </GlassCard>

            <Pressable onPress={handleLogout} className="active:scale-95">
              <View className="flex-row items-center justify-center gap-2 py-4">
                <LogOut size={18} color="#EF4444" />
                <Text className="text-error text-lg" style={{ fontFamily: 'Outfit_600SemiBold' }}>SIGN OUT</Text>
              </View>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
