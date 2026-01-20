import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Calendar,
  Target,
  Award,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import { calculateInsights, generateMonthlyReport } from '@/lib/insights';

export default function InsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const progressHistory = useLumisStore((s) => s.progressHistory);
  const todayProgress = useLumisStore((s) => s.todayProgress);

  // Calculate insights
  const insights = useMemo(() => calculateInsights(progressHistory), [progressHistory]);

  // Generate current month report
  const now = new Date();
  const monthlyReport = useMemo(
    () => generateMonthlyReport(progressHistory, now.getMonth(), now.getFullYear()),
    [progressHistory]
  );

  const TrendIcon = insights.trend === 'improving' ? TrendingUp : TrendingDown;
  const trendColor = insights.trend === 'improving' ? '#4CAF50' : insights.trend === 'declining' ? '#F44336' : '#FFC107';

  return (
    <View className="flex-1 bg-lumis-midnight">
      <LinearGradient colors={['#1A1A2E', '#16213E']} style={{ flex: 1 }}>
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-4 py-3"
          style={{ paddingTop: insets.top + 10 }}
        >
          <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center bg-lumis-twilight/50">
            <ArrowLeft size={20} color="#FFB347" />
          </Pressable>
          <Text className="text-lumis-dawn text-xl font-bold" style={{ fontFamily: 'Outfit_700Bold' }}>
            Insights & Trends
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4 pt-4">
          {/* Trend Overview */}
          <Animated.View entering={FadeIn.delay(100)}>
            <View className="mb-6 rounded-2xl overflow-hidden">
              <LinearGradient
                colors={['rgba(255, 179, 71, 0.1)', 'rgba(255, 107, 53, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-4 border border-lumis-sunrise/20"
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lumis-dawn text-lg font-semibold" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                    Your Trend
                  </Text>
                  <View
                    className="flex-row items-center gap-2 px-3 py-2 rounded-full"
                    style={{ backgroundColor: `${trendColor}25` }}
                  >
                    <TrendIcon size={16} color={trendColor} />
                    <Text className="text-sm font-semibold capitalize" style={{ color: trendColor, fontFamily: 'Outfit_600SemiBold' }}>
                      {insights.trend}
                    </Text>
                  </View>
                </View>
                <Text className="text-lumis-sunrise/80 text-sm" style={{ fontFamily: 'Outfit_400Regular' }}>
                  {insights.trend === 'improving'
                    ? "🔥 You're getting better! Keep up the momentum."
                    : insights.trend === 'declining'
                    ? '📉 Your routine is slipping. Get back on track!'
                    : '→ Staying consistent. Keep it steady!'}
                </Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Key Metrics */}
          <Animated.View entering={FadeIn.delay(200)}>
            <Text className="text-lumis-sunrise/60 text-xs font-semibold mb-3 px-1" style={{ fontFamily: 'Outfit_600SemiBold' }}>
              THIS MONTH
            </Text>
            <View className="gap-3 mb-6">
              {/* Total & Average */}
              <View className="flex-row gap-3">
                <View className="flex-1 bg-lumis-twilight/60 rounded-xl p-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Zap size={16} color="#FFD700" />
                    <Text className="text-lumis-sunrise/60 text-xs" style={{ fontFamily: 'Outfit_400Regular' }}>
                      Total Minutes
                    </Text>
                  </View>
                  <Text className="text-lumis-dawn text-2xl font-bold" style={{ fontFamily: 'Outfit_700Bold' }}>
                    {monthlyReport.totalMinutes}
                  </Text>
                </View>

                <View className="flex-1 bg-lumis-twilight/60 rounded-xl p-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Target size={16} color="#FFB347" />
                    <Text className="text-lumis-sunrise/60 text-xs" style={{ fontFamily: 'Outfit_400Regular' }}>
                      Avg Per Day
                    </Text>
                  </View>
                  <Text className="text-lumis-dawn text-2xl font-bold" style={{ fontFamily: 'Outfit_700Bold' }}>
                    {monthlyReport.daysActive > 0 ? Math.round(monthlyReport.totalMinutes / monthlyReport.daysActive) : 0}
                  </Text>
                </View>
              </View>

              {/* Consistency & Best Week */}
              <View className="flex-row gap-3">
                <View className="flex-1 bg-lumis-twilight/60 rounded-xl p-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Calendar size={16} color="#4CAF50" />
                    <Text className="text-lumis-sunrise/60 text-xs" style={{ fontFamily: 'Outfit_400Regular' }}>
                      Consistency
                    </Text>
                  </View>
                  <Text className="text-lumis-dawn text-2xl font-bold" style={{ fontFamily: 'Outfit_700Bold' }}>
                    {monthlyReport.consistencyScore}%
                  </Text>
                </View>

                <View className="flex-1 bg-lumis-twilight/60 rounded-xl p-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Award size={16} color="#FF6B9D" />
                    <Text className="text-lumis-sunrise/60 text-xs" style={{ fontFamily: 'Outfit_400Regular' }}>
                      Best Week
                    </Text>
                  </View>
                  <Text className="text-lumis-dawn text-2xl font-bold" style={{ fontFamily: 'Outfit_700Bold' }}>
                    {monthlyReport.bestWeek}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Streak & All-Time Stats */}
          <Animated.View entering={FadeIn.delay(300)}>
            <Text className="text-lumis-sunrise/60 text-xs font-semibold mb-3 px-1" style={{ fontFamily: 'Outfit_600SemiBold' }}>
              ALL-TIME
            </Text>
            <View className="gap-3 mb-6">
              <View className="flex-row gap-3">
                <View className="flex-1 bg-lumis-twilight/60 rounded-xl p-4">
                  <Text className="text-lumis-sunrise/60 text-xs mb-2" style={{ fontFamily: 'Outfit_400Regular' }}>
                    Current Streak
                  </Text>
                  <Text className="text-lumis-dawn text-2xl font-bold" style={{ fontFamily: 'Outfit_700Bold' }}>
                    {insights.currentStreak}
                  </Text>
                  <Text className="text-lumis-sunrise/40 text-xs mt-1" style={{ fontFamily: 'Outfit_400Regular' }}>
                    days
                  </Text>
                </View>

                <View className="flex-1 bg-lumis-twilight/60 rounded-xl p-4">
                  <Text className="text-lumis-sunrise/60 text-xs mb-2" style={{ fontFamily: 'Outfit_400Regular' }}>
                    Best Streak
                  </Text>
                  <Text className="text-lumis-dawn text-2xl font-bold" style={{ fontFamily: 'Outfit_700Bold' }}>
                    {insights.longestStreak}
                  </Text>
                  <Text className="text-lumis-sunrise/40 text-xs mt-1" style={{ fontFamily: 'Outfit_400Regular' }}>
                    days
                  </Text>
                </View>

                <View className="flex-1 bg-lumis-twilight/60 rounded-xl p-4">
                  <Text className="text-lumis-sunrise/60 text-xs mb-2" style={{ fontFamily: 'Outfit_400Regular' }}>
                    Total Time
                  </Text>
                  <Text className="text-lumis-dawn text-2xl font-bold" style={{ fontFamily: 'Outfit_700Bold' }}>
                    {Math.round(insights.totalMinutes / 60)}
                  </Text>
                  <Text className="text-lumis-sunrise/40 text-xs mt-1" style={{ fontFamily: 'Outfit_400Regular' }}>
                    hours
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Best & Worst Days */}
          <Animated.View entering={FadeIn.delay(400)}>
            <Text className="text-lumis-sunrise/60 text-xs font-semibold mb-3 px-1" style={{ fontFamily: 'Outfit_600SemiBold' }}>
              PERFORMANCE
            </Text>
            <View className="gap-3 mb-6">
              <View className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-green-400 text-xs font-semibold mb-1" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                      Best Day
                    </Text>
                    <Text className="text-lumis-dawn text-lg font-semibold" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                      {insights.bestDay.dayOfWeek}
                    </Text>
                    <Text className="text-green-400/80 text-sm mt-1" style={{ fontFamily: 'Outfit_400Regular' }}>
                      {insights.bestDay.minutes} minutes
                    </Text>
                  </View>
                  <Text className="text-3xl">🏆</Text>
                </View>
              </View>

              <View className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-red-400 text-xs font-semibold mb-1" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                      Least Active Day
                    </Text>
                    <Text className="text-lumis-dawn text-lg font-semibold" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                      {insights.worstDay.dayOfWeek}
                    </Text>
                    <Text className="text-red-400/80 text-sm mt-1" style={{ fontFamily: 'Outfit_400Regular' }}>
                      {insights.worstDay.minutes} minutes
                    </Text>
                  </View>
                  <Text className="text-3xl">⏰</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Improvements & Recommendations */}
          <Animated.View entering={FadeIn.delay(500)}>
            {monthlyReport.improvements.length > 0 && (
              <>
                <Text className="text-lumis-sunrise/60 text-xs font-semibold mb-3 px-1" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                  YOUR WINS
                </Text>
                <View className="gap-2 mb-6">
                  {monthlyReport.improvements.map((improvement, idx) => (
                    <View key={idx} className="bg-lumis-twilight/60 rounded-xl p-3 flex-row gap-3">
                      <Text className="text-xl">✨</Text>
                      <Text className="flex-1 text-lumis-sunrise text-sm" style={{ fontFamily: 'Outfit_400Regular' }}>
                        {improvement}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Text className="text-lumis-sunrise/60 text-xs font-semibold mb-3 px-1" style={{ fontFamily: 'Outfit_600SemiBold' }}>
              RECOMMENDATIONS
            </Text>
            <View className="gap-2 mb-12">
              {monthlyReport.recommendations.map((rec, idx) => (
                <View key={idx} className="bg-lumis-twilight/60 rounded-xl p-3 flex-row gap-3">
                  <Text className="text-xl">💡</Text>
                  <Text className="flex-1 text-lumis-sunrise text-sm" style={{ fontFamily: 'Outfit_400Regular' }}>
                    {rec}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
