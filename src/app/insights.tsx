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
  Shield,
  Clock,
} from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import { calculateInsights, generateMonthlyReport } from '@/lib/insights';
import { GlassCard } from '@/components/GlassCard';
import { FadeInDown } from 'react-native-reanimated';

export default function InsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const progressHistory = useLumisStore((s) => s.progressHistory);
  const isPremium = useLumisStore((s) => s.isPremium);
  const isTrialActive = useLumisStore((s) => s.isTrialActive());
  const hasPremiumAccess = isPremium || isTrialActive;

  // Calculate insights
  const insights = useMemo(() => calculateInsights(progressHistory), [progressHistory, hasPremiumAccess]);

  // Generate current month report
  const now = new Date();
  const monthlyReport = useMemo(
    () => generateMonthlyReport(progressHistory, now.getMonth(), now.getFullYear()),
    [progressHistory, hasPremiumAccess]
  );

  const TrendIcon = insights.trend === 'improving' ? TrendingUp : TrendingDown;
  const trendColor = insights.trend === 'improving' ? '#4CAF50' : insights.trend === 'declining' ? '#F44336' : '#FFC107';

  return (
    <View className="flex-1 bg-lumis-midnight">
      <LinearGradient colors={['#1A1A2E', '#16213E']} style={{ flex: 1 }}>
        <View
          className="flex-row items-center justify-between px-6 pb-4"
          style={{ paddingTop: insets.top + 16 }}
        >
          <Pressable onPress={() => router.back()} className="w-12 h-12 rounded-2xl bg-white/5 items-center justify-center border border-white/10">
            <ArrowLeft size={20} color="#FFF8E7" />
          </Pressable>
          <Text className="text-2xl text-lumis-dawn" style={{ fontFamily: 'Syne_800ExtraBold' }}>
            INSIGHTS
          </Text>
          <View className="w-12" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4 pt-4" scrollEnabled={hasPremiumAccess}>
          <View style={{ opacity: hasPremiumAccess ? 1 : 0.3, filter: hasPremiumAccess ? 'none' : 'blur(4px)' }}>
            {/* Trend Overview */}
            <Animated.View entering={FadeIn.delay(100)}>
              <GlassCard variant="hero" className="mb-lg" glow glowColor={trendColor}>
                <View className="flex-row items-center justify-between mb-md">
                  <Text className="text-lumis-dawn text-lg" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                    Overall Trend
                  </Text>
                  <View
                    className="flex-row items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: `${trendColor}30` }}
                  >
                    <TrendIcon size={14} color={trendColor} strokeWidth={2.5} />
                    <Text className="text-xs uppercase tracking-wider" style={{ color: trendColor, fontFamily: 'Outfit_700Bold' }}>
                      {insights.trend}
                    </Text>
                  </View>
                </View>
                <Text className="text-lumis-sunrise/70 text-base leading-relaxed" style={{ fontFamily: 'Outfit_400Regular' }}>
                  {insights.trend === 'improving'
                    ? "Your morning discipline is sharpening. You've increased light exposure by 12% this week."
                    : insights.trend === 'declining'
                      ? 'Your consistency is dipping. Try waking 10 minutes earlier to catch the gold hour.'
                      : 'You are maintaining a steady rhythm. Consider increasing your goal by 5 minutes.'}
                </Text>
              </GlassCard>
            </Animated.View>

            {/* Key Metrics */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Text className="text-lumis-sunrise/40 text-[10px] uppercase tracking-[3px] mb-md px-1" style={{ fontFamily: 'Outfit_700Bold' }}>
                THIS MONTH
              </Text>
              <View className="gap-4 mb-lg">
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <GlassCard variant="default">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Zap size={16} color="#FFB347" />
                        <Text className="text-lumis-sunrise/60 text-[10px] uppercase tracking-wider" style={{ fontFamily: 'Outfit_600SemiBold' }}>Light Earned</Text>
                      </View>
                      <Text className="text-3xl text-lumis-dawn" style={{ fontFamily: 'Syne_700Bold' }}>{monthlyReport.totalMinutes}</Text>
                    </GlassCard>
                  </View>
                  <View className="flex-1">
                    <GlassCard variant="default">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Target size={16} color="#8B5CF6" />
                        <Text className="text-lumis-sunrise/60 text-[10px] uppercase tracking-wider" style={{ fontFamily: 'Outfit_600SemiBold' }}>Avg Daily</Text>
                      </View>
                      <Text className="text-3xl text-lumis-dawn" style={{ fontFamily: 'Syne_700Bold' }}>
                        {monthlyReport.daysActive > 0 ? Math.round(monthlyReport.totalMinutes / monthlyReport.daysActive) : 0}
                      </Text>
                    </GlassCard>
                  </View>
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <GlassCard variant="default">
                      <View className="flex-row items-center gap-2 mb-2">
                        <TrendingUp size={16} color="#22C55E" />
                        <Text className="text-lumis-sunrise/60 text-[10px] uppercase tracking-wider" style={{ fontFamily: 'Outfit_600SemiBold' }}>Score</Text>
                      </View>
                      <Text className="text-3xl text-lumis-dawn" style={{ fontFamily: 'Syne_700Bold' }}>{monthlyReport.consistencyScore}%</Text>
                    </GlassCard>
                  </View>
                  <View className="flex-1">
                    <GlassCard variant="default">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Award size={16} color="#FF6B35" />
                        <Text className="text-lumis-sunrise/60 text-[10px] uppercase tracking-wider" style={{ fontFamily: 'Outfit_600SemiBold' }}>Best Week</Text>
                      </View>
                      <Text className="text-3xl text-lumis-dawn" style={{ fontFamily: 'Syne_700Bold' }}>{monthlyReport.bestWeek}</Text>
                    </GlassCard>
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
          </View>
        </ScrollView>

        {/* Paywall Overlay */}
        {!hasPremiumAccess && (
          <View className="absolute inset-0 items-center justify-center z-20">
            <View className="bg-lumis-twilight/90 p-8 rounded-3xl items-center border border-lumis-golden/30 mx-8">
              <View className="w-16 h-16 rounded-full bg-lumis-golden/20 items-center justify-center mb-4">
                <Target size={32} color="#FFB347" />
              </View>
              <Text className="text-lumis-dawn text-xl font-bold mb-2 text-center" style={{ fontFamily: 'Outfit_700Bold' }}>
                Unlock Your Full Potential
              </Text>
              <Text className="text-lumis-sunrise/70 text-center mb-6" style={{ fontFamily: 'Outfit_400Regular' }}>
                See advanced trends, best days, and detailed analytics with Lumis Pro.
              </Text>

              <Pressable onPress={() => router.push('/premium')} className="w-full">
                <LinearGradient
                  colors={['#FFB347', '#FF8C00', '#FF6B35']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text className="text-lumis-night font-bold text-lg" style={{ fontFamily: 'Outfit_700Bold' }}>
                    Unlock Statistics
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}
