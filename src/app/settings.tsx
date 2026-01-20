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

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);
  const setDailyGoalMinutes = useLumisStore((s) => s.setDailyGoalMinutes);
  const wakeWindowStart = useLumisStore((s) => s.wakeWindowStart);
  const wakeWindowEnd = useLumisStore((s) => s.wakeWindowEnd);
  const blockedApps = useLumisStore((s) => s.blockedApps);
  const achievements = useLumisStore((s) => s.achievements);
  const notificationPreferences = useLumisStore((s) => s.notificationPreferences);
  const setNotificationPreferences = useLumisStore((s) => s.setNotificationPreferences);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const blockedCount = blockedApps.filter((app) => app.isBlocked).length;
  const unlockedAchievements = achievements.filter((a) => a.unlocked).length;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleIncrementGoal = () => {
    if (dailyGoalMinutes < 30) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDailyGoalMinutes(dailyGoalMinutes + 1);
    }
  };

  const handleDecrementGoal = () => {
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Implement actual health sync
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logout();
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-lumis-night">
      <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={{ flex: 1 }}>
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-6 pb-4 border-b border-lumis-dusk/30"
          style={{ paddingTop: insets.top + 16 }}
        >
          <Text
            className="text-2xl text-lumis-dawn"
            style={{ fontFamily: 'Outfit_700Bold' }}
          >
            Settings
          </Text>
          <Pressable
            onPress={handleClose}
            className="w-10 h-10 rounded-full bg-lumis-twilight/50 items-center justify-center"
          >
            <X size={20} color="#FFB347" strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 40 }}
        >
          {/* Daily Goal */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} className="mb-6">
            <Text
              className="text-lumis-sunrise/60 text-sm uppercase mb-3"
              style={{ fontFamily: 'Outfit_500Medium' }}
            >
              Daily Goal
            </Text>
            <View className="bg-lumis-twilight/40 rounded-2xl p-5 border border-lumis-dusk/30">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-xl bg-lumis-golden/20 items-center justify-center mr-3">
                  <Sun size={20} color="#FFB347" strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-lumis-dawn text-lg"
                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                  >
                    Light Minutes
                  </Text>
                  <Text
                    className="text-lumis-sunrise/50"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    How long to be outside each day
                  </Text>
                </View>
              </View>

              {/* Stepper */}
              <View className="flex-row items-center justify-center bg-lumis-night/30 rounded-xl p-2">
                <Pressable
                  onPress={handleDecrementGoal}
                  className="w-12 h-12 rounded-lg bg-lumis-dusk/50 items-center justify-center"
                  disabled={dailyGoalMinutes <= 5}
                >
                  <Minus
                    size={20}
                    color={dailyGoalMinutes <= 5 ? '#0F346060' : '#FFB347'}
                    strokeWidth={2}
                  />
                </Pressable>
                <View className="flex-1 items-center">
                  <Text
                    className="text-4xl text-lumis-golden"
                    style={{ fontFamily: 'Outfit_700Bold' }}
                  >
                    {dailyGoalMinutes}
                  </Text>
                  <Text
                    className="text-lumis-sunrise/50"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    minutes
                  </Text>
                </View>
                <Pressable
                  onPress={handleIncrementGoal}
                  className="w-12 h-12 rounded-lg bg-lumis-dusk/50 items-center justify-center"
                  disabled={dailyGoalMinutes >= 30}
                >
                  <Plus
                    size={20}
                    color={dailyGoalMinutes >= 30 ? '#0F346060' : '#FFB347'}
                    strokeWidth={2}
                  />
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* Blocked Apps */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} className="mb-6">
            <Text
              className="text-lumis-sunrise/60 text-sm uppercase mb-3"
              style={{ fontFamily: 'Outfit_500Medium' }}
            >
              App Shield
            </Text>
            <Pressable onPress={handleManageApps}>
              <View className="bg-lumis-twilight/40 rounded-2xl p-5 border border-lumis-dusk/30 flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-lumis-golden/20 items-center justify-center mr-3">
                  <Shield size={20} color="#FFB347" strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-lumis-dawn text-lg"
                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                  >
                    Shielded Apps
                  </Text>
                  <Text
                    className="text-lumis-sunrise/50"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    {blockedCount} apps blocked until goal is met
                  </Text>
                </View>
                <ChevronRight size={20} color="#FFB347" strokeWidth={1.5} />
              </View>
            </Pressable>
          </Animated.View>

          {/* Achievements */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} className="mb-6">
            <Text
              className="text-lumis-sunrise/60 text-sm uppercase mb-3"
              style={{ fontFamily: 'Outfit_500Medium' }}
            >
              Progress
            </Text>
            <Pressable onPress={handleAchievements}>
              <View className="bg-lumis-twilight/40 rounded-2xl p-5 border border-lumis-dusk/30 flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-lumis-golden/20 items-center justify-center mr-3">
                  <Trophy size={20} color="#FFB347" strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-lumis-dawn text-lg"
                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                  >
                    Achievements
                  </Text>
                  <Text
                    className="text-lumis-sunrise/50"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    {unlockedAchievements} unlocked
                  </Text>
                </View>
                <ChevronRight size={20} color="#FFB347" strokeWidth={1.5} />
              </View>
            </Pressable>
          </Animated.View>

          {/* Wake Window */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} className="mb-6">
            <Text
              className="text-lumis-sunrise/60 text-sm uppercase mb-3"
              style={{ fontFamily: 'Outfit_500Medium' }}
            >
              Wake Window
            </Text>
            <View className="bg-lumis-twilight/40 rounded-2xl p-5 border border-lumis-dusk/30">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-lumis-golden/20 items-center justify-center mr-3">
                  <Clock size={20} color="#FFB347" strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-lumis-dawn text-lg"
                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                  >
                    Active Hours
                  </Text>
                  <Text
                    className="text-lumis-sunrise/50"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    {wakeWindowStart} - {wakeWindowEnd}
                  </Text>
                </View>
                <View className="bg-lumis-dusk/50 rounded-lg px-3 py-1">
                  <Text
                    className="text-lumis-sunrise/60 text-sm"
                    style={{ fontFamily: 'Outfit_500Medium' }}
                  >
                    Coming Soon
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Notifications */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} className="mb-6">
            <Text
              className="text-lumis-sunrise/60 text-sm uppercase mb-3"
              style={{ fontFamily: 'Outfit_500Medium' }}
            >
              Notifications
            </Text>
            <View className="bg-lumis-twilight/40 rounded-2xl p-5 border border-lumis-dusk/30 flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-lumis-golden/20 items-center justify-center mr-3">
                <Bell size={20} color="#FFB347" strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-lumis-dawn text-lg"
                  style={{ fontFamily: 'Outfit_600SemiBold' }}
                >
                  Morning Reminders
                </Text>
                <Text
                  className="text-lumis-sunrise/50"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  Get reminded to earn your light
                </Text>
              </View>
              <Switch
                value={notificationPreferences.enabled}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNotificationPreferences({ enabled: value });
                }}
                trackColor={{ false: '#0F3460', true: '#FFB34760' }}
                thumbColor={notificationPreferences.enabled ? '#FFB347' : '#16213E'}
              />
            </View>
          </Animated.View>

          {/* About */}
          <Animated.View entering={FadeInDown.delay(600).duration(400)} className="mb-6">
            <Text
              className="text-lumis-sunrise/60 text-sm uppercase mb-3"
              style={{ fontFamily: 'Outfit_500Medium' }}
            >
              Health & Data
            </Text>

            {/* Health Sync */}
            <Pressable onPress={handleHealthSync} className="mb-3">
              <View className="bg-lumis-twilight/40 rounded-2xl p-5 border border-lumis-dusk/30 flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-lumis-golden/20 items-center justify-center mr-3">
                  <Heart size={20} color="#FFB347" strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-lumis-dawn text-lg"
                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                  >
                    Health App Sync
                  </Text>
                  <Text
                    className="text-lumis-sunrise/50"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    Export data to Apple Health (Premium)
                  </Text>
                </View>
                <ChevronRight size={20} color="#FFB347" strokeWidth={1.5} />
              </View>
            </Pressable>

            {/* About */}
            <View className="bg-lumis-twilight/40 rounded-2xl p-5 border border-lumis-dusk/30 flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-lumis-golden/20 items-center justify-center mr-3">
                <Info size={20} color="#FFB347" strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-lumis-dawn text-lg"
                  style={{ fontFamily: 'Outfit_600SemiBold' }}
                >
                  Lumis
                </Text>
                <Text
                  className="text-lumis-sunrise/50"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  Version 1.0.0
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Account */}
          <Animated.View entering={FadeInDown.delay(700).duration(400)}>
            <Text
              className="text-lumis-sunrise/60 text-sm uppercase mb-3"
              style={{ fontFamily: 'Outfit_500Medium' }}
            >
              Account
            </Text>

            {/* User info */}
            {user && (
              <View className="bg-lumis-twilight/40 rounded-2xl p-5 border border-lumis-dusk/30 flex-row items-center mb-3">
                <View className="w-10 h-10 rounded-xl bg-lumis-golden/20 items-center justify-center mr-3">
                  <User size={20} color="#FFB347" strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-lumis-dawn text-lg"
                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                  >
                    {user.name}
                  </Text>
                  <Text
                    className="text-lumis-sunrise/50"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    {user.email}
                  </Text>
                </View>
              </View>
            )}

            {/* Logout button */}
            <Pressable onPress={handleLogout}>
              <View className="bg-red-500/10 rounded-2xl p-5 border border-red-500/30 flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-red-500/20 items-center justify-center mr-3">
                  <LogOut size={20} color="#EF4444" strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-red-400 text-lg"
                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                  >
                    Sign Out
                  </Text>
                  <Text
                    className="text-red-400/50"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    Log out of your account
                  </Text>
                </View>
                <ChevronRight size={20} color="#EF4444" strokeWidth={1.5} />
              </View>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
