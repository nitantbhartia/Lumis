import React from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Sun, Flame, Calendar, TrendingUp, Award } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const currentStreak = useLumisStore((s) => s.currentStreak);
  const longestStreak = useLumisStore((s) => s.longestStreak);
  const totalDaysCompleted = useLumisStore((s) => s.totalDaysCompleted);
  const progressHistory = useLumisStore((s) => s.progressHistory);
  const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Generate last 7 days data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayProgress = progressHistory.find((p) => p.date === dateStr);
    return {
      date: dateStr,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      minutes: dayProgress?.lightMinutes ?? 0,
      completed: dayProgress?.completed ?? false,
    };
  });

  const maxMinutes = Math.max(...last7Days.map((d) => d.minutes), dailyGoalMinutes);
  const totalMinutesThisWeek = last7Days.reduce((sum, d) => sum + d.minutes, 0);
  const completedDaysThisWeek = last7Days.filter((d) => d.completed).length;

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
            Analytics
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
          {/* Summary Stats */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            className="flex-row space-x-4 mb-6"
          >
            {/* Current Streak */}
            <View className="flex-1 bg-lumis-twilight/40 rounded-2xl p-4 border border-lumis-golden/30">
              <View className="flex-row items-center mb-2">
                <Flame size={18} color="#FF6B35" strokeWidth={1.5} />
                <Text
                  className="text-lumis-sunrise/60 ml-2 text-sm"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  Current
                </Text>
              </View>
              <Text
                className="text-3xl text-lumis-golden"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                {currentStreak}
              </Text>
              <Text
                className="text-lumis-sunrise/50 text-sm"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                day streak
              </Text>
            </View>

            {/* Longest Streak */}
            <View className="flex-1 bg-lumis-twilight/40 rounded-2xl p-4 border border-lumis-dusk/30">
              <View className="flex-row items-center mb-2">
                <Award size={18} color="#FFB347" strokeWidth={1.5} />
                <Text
                  className="text-lumis-sunrise/60 ml-2 text-sm"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  Best
                </Text>
              </View>
              <Text
                className="text-3xl text-lumis-dawn"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                {longestStreak}
              </Text>
              <Text
                className="text-lumis-sunrise/50 text-sm"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                day streak
              </Text>
            </View>
          </Animated.View>

          {/* Weekly Chart */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} className="mb-6">
            <Text
              className="text-lumis-sunrise/60 text-sm uppercase mb-3"
              style={{ fontFamily: 'Outfit_500Medium' }}
            >
              This Week
            </Text>
            <View className="bg-lumis-twilight/40 rounded-2xl p-5 border border-lumis-dusk/30">
              {/* Chart */}
              <View className="flex-row items-end justify-between h-40 mb-4">
                {last7Days.map((day, index) => {
                  const barHeight = maxMinutes > 0 ? (day.minutes / maxMinutes) * 120 : 0;
                  const isToday = index === 6;

                  return (
                    <View key={day.date} className="items-center flex-1">
                      {/* Bar */}
                      <View className="w-8 justify-end" style={{ height: 120 }}>
                        {/* Goal line */}
                        <View
                          className="absolute w-full border-t border-dashed border-lumis-golden/30"
                          style={{ bottom: (dailyGoalMinutes / maxMinutes) * 120 }}
                        />
                        {/* Bar fill */}
                        <LinearGradient
                          colors={
                            day.completed
                              ? ['#FFE4B5', '#FFB347', '#FF8C00']
                              : ['#0F3460', '#16213E']
                          }
                          style={{
                            height: Math.max(barHeight, 4),
                            borderRadius: 4,
                            width: '100%',
                          }}
                        />
                      </View>
                      {/* Day label */}
                      <Text
                        className={`text-xs mt-2 ${isToday ? 'text-lumis-golden' : 'text-lumis-sunrise/50'}`}
                        style={{ fontFamily: isToday ? 'Outfit_600SemiBold' : 'Outfit_400Regular' }}
                      >
                        {day.dayName}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Week stats */}
              <View className="flex-row justify-between pt-4 border-t border-lumis-dusk/30">
                <View>
                  <Text
                    className="text-lumis-sunrise/50 text-sm"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    Total light time
                  </Text>
                  <Text
                    className="text-lumis-dawn text-xl"
                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                  >
                    {totalMinutesThisWeek.toFixed(0)} min
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className="text-lumis-sunrise/50 text-sm"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    Days completed
                  </Text>
                  <Text
                    className="text-lumis-golden text-xl"
                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                  >
                    {completedDaysThisWeek}/7
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Lifetime Stats */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} className="mb-6">
            <Text
              className="text-lumis-sunrise/60 text-sm uppercase mb-3"
              style={{ fontFamily: 'Outfit_500Medium' }}
            >
              Lifetime
            </Text>
            <View className="bg-lumis-twilight/40 rounded-2xl p-5 border border-lumis-dusk/30">
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 rounded-xl bg-lumis-golden/20 items-center justify-center mr-4">
                  <Calendar size={24} color="#FFB347" strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-lumis-dawn text-2xl"
                    style={{ fontFamily: 'Outfit_700Bold' }}
                  >
                    {totalDaysCompleted}
                  </Text>
                  <Text
                    className="text-lumis-sunrise/50"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    days of sunlight earned
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-xl bg-lumis-golden/20 items-center justify-center mr-4">
                  <Sun size={24} color="#FFB347" strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-lumis-dawn text-2xl"
                    style={{ fontFamily: 'Outfit_700Bold' }}
                  >
                    {(progressHistory.reduce((sum, p) => sum + p.lightMinutes, 0)).toFixed(0)}
                  </Text>
                  <Text
                    className="text-lumis-sunrise/50"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    total minutes of light
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Insight */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <View className="bg-lumis-golden/10 rounded-2xl p-5 border border-lumis-golden/30">
              <View className="flex-row items-center mb-2">
                <TrendingUp size={18} color="#FFB347" strokeWidth={1.5} />
                <Text
                  className="text-lumis-golden ml-2"
                  style={{ fontFamily: 'Outfit_600SemiBold' }}
                >
                  Insight
                </Text>
              </View>
              <Text
                className="text-lumis-sunrise/80"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                {currentStreak >= 7
                  ? "Amazing! You've maintained a week-long streak. Your circadian rhythm is thanking you!"
                  : currentStreak >= 3
                    ? "Great progress! Keep going to build a stronger habit."
                    : "Start your streak today! Morning light exposure improves sleep quality and mood."}
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
