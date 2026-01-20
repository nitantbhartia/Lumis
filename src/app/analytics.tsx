import React from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Sun, Flame, Calendar, TrendingUp, Award, Trophy } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import { GlassCard } from '@/components/GlassCard';
import { StatCard } from '@/components/StatCard';

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
        <View
          className="flex-row items-center justify-between px-6 pb-6"
          style={{ paddingTop: insets.top + 20 }}
        >
          <View>
            <Text
              className="text-4xl text-lumis-dawn"
              style={{ fontFamily: 'Syne_800ExtraBold' }}
            >
              ANALYTICS
            </Text>
            <View className="h-1 w-12 bg-lumis-accent rounded-full mt-1" />
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
          {/* Summary Stats */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            className="flex-row gap-3 mb-6"
          >
            {/* Current Streak */}
            <StatCard
              icon={Flame}
              iconColor="#FF6B35"
              iconBgColor="rgba(255, 107, 53, 0.15)"
              label="Streak"
              value={currentStreak}
              subtitle="DAYS"
              variant="primary"
            />

            <StatCard
              icon={Trophy}
              iconColor="#FFB347"
              iconBgColor="rgba(255, 179, 71, 0.15)"
              label="Best"
              value={longestStreak}
              subtitle="DAYS"
              variant="secondary"
            />
          </Animated.View>

          {/* Weekly Chart */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} className="mb-6">
            <Text
              className="text-lumis-sunrise/40 text-[10px] uppercase tracking-[3px] mb-md px-1"
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              THIS WEEK
            </Text>
            <GlassCard variant="elevated">
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
            </GlassCard>
          </Animated.View>

          {/* Lifetime Stats */}
          <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-lg">
            <Text
              className="text-lumis-sunrise/40 text-[10px] uppercase tracking-[3px] mb-md px-1"
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              ALL TIME
            </Text>
            <GlassCard variant="default">
              <View className="flex-row items-center mb-lg">
                <View className="w-12 h-12 rounded-2xl bg-lumis-golden/10 items-center justify-center mr-4">
                  <Calendar size={24} color="#FFB347" />
                </View>
                <View className="flex-1">
                  <Text className="text-lumis-sunrise/40 text-[10px] uppercase tracking-wider" style={{ fontFamily: 'Outfit_700Bold' }}>Earned Days</Text>
                  <Text
                    className="text-3xl text-lumis-dawn"
                    style={{ fontFamily: 'Syne_700Bold' }}
                  >
                    {totalDaysCompleted}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-lumis-accent/10 items-center justify-center mr-4">
                  <Sun size={24} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-lumis-sunrise/40 text-[10px] uppercase tracking-wider" style={{ fontFamily: 'Outfit_700Bold' }}>Sun Absorbed</Text>
                  <Text
                    className="text-3xl text-lumis-dawn"
                    style={{ fontFamily: 'Syne_700Bold' }}
                  >
                    {(progressHistory.reduce((sum, p) => sum + p.lightMinutes, 0)).toFixed(0)} min
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Insight */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <GlassCard variant="hero" glow glowColor="#8B5CF6">
              <View className="flex-row items-center mb-3">
                <TrendingUp size={20} color="#8B5CF6" />
                <Text
                  className="text-lumis-dawn text-base ml-2"
                  style={{ fontFamily: 'Outfit_700Bold' }}
                >
                  Your Edge
                </Text>
              </View>
              <Text
                className="text-lumis-sunrise/70 text-base leading-relaxed"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                {currentStreak >= 7
                  ? "Peak alignment. Your sleep quality is likely at its best right now."
                  : currentStreak >= 3
                    ? "Momentum building. One more sunrise cements this habit."
                    : "The first 3 days are the reset. Push through — the energy shift is coming."}
              </Text>
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
