import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Trophy, Lock } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import { getAchievementsByCategory, getUnlockedCount, getTotalCount } from '@/lib/achievements';

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const achievements = useLumisStore((s) => s.achievements);

  const { streak, hours, consistency, special } = getAchievementsByCategory(achievements);
  const unlockedCount = getUnlockedCount(achievements);
  const totalCount = getTotalCount();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const AchievementCard = ({ achievement, index }: { achievement: any; index: number }) => {
    const progressPercent = (achievement.progress / achievement.requirement) * 100;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).duration(400)}
        className="mb-4"
      >
        <View
          className={`rounded-2xl p-4 border ${
            achievement.unlocked
              ? 'bg-lumis-twilight/80 border-lumis-golden/30'
              : 'bg-lumis-twilight/40 border-lumis-dusk/50'
          }`}
        >
          <View className="flex-row items-center">
            {/* Icon */}
            <View
              className={`w-16 h-16 rounded-full items-center justify-center mr-4 ${
                achievement.unlocked ? 'bg-lumis-golden/20' : 'bg-lumis-dusk/50'
              }`}
            >
              {achievement.unlocked ? (
                <Text style={{ fontSize: 32 }}>{achievement.icon}</Text>
              ) : (
                <Lock size={24} color="#FFB34740" />
              )}
            </View>

            {/* Content */}
            <View className="flex-1">
              <Text
                className={`text-lg mb-1 ${
                  achievement.unlocked ? 'text-lumis-dawn' : 'text-lumis-sunrise/50'
                }`}
                style={{ fontFamily: 'Outfit_600SemiBold' }}
              >
                {achievement.title}
              </Text>
              <Text
                className={achievement.unlocked ? 'text-lumis-sunrise/70' : 'text-lumis-sunrise/40'}
                style={{ fontFamily: 'Outfit_400Regular', fontSize: 13 }}
              >
                {achievement.description}
              </Text>

              {/* Progress bar for locked achievements */}
              {!achievement.unlocked && (
                <View className="mt-3">
                  <View className="flex-row justify-between mb-1">
                    <Text
                      className="text-lumis-sunrise/50 text-xs"
                      style={{ fontFamily: 'Outfit_500Medium' }}
                    >
                      Progress
                    </Text>
                    <Text
                      className="text-lumis-sunrise/50 text-xs"
                      style={{ fontFamily: 'Outfit_500Medium' }}
                    >
                      {achievement.progress}/{achievement.requirement}
                    </Text>
                  </View>
                  <View className="h-2 bg-lumis-dusk rounded-full overflow-hidden">
                    <View
                      className="h-full bg-lumis-golden/50 rounded-full"
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </View>
                </View>
              )}

              {/* Unlocked date */}
              {achievement.unlocked && achievement.unlockedAt && (
                <Text
                  className="text-lumis-golden/70 text-xs mt-2"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const CategorySection = ({
    title,
    achievements,
    startIndex,
  }: {
    title: string;
    achievements: any[];
    startIndex: number;
  }) => {
    const unlockedInCategory = achievements.filter((a) => a.unlocked).length;

    return (
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text
            className="text-xl text-lumis-dawn"
            style={{ fontFamily: 'Outfit_700Bold' }}
          >
            {title}
          </Text>
          <Text
            className="text-lumis-sunrise/60 text-sm"
            style={{ fontFamily: 'Outfit_500Medium' }}
          >
            {unlockedInCategory}/{achievements.length}
          </Text>
        </View>

        {achievements.map((achievement, index) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            index={startIndex + index}
          />
        ))}
      </View>
    );
  };

  return (
    <View className="flex-1">
      <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={{ flex: 1 }}>
        <View style={{ paddingTop: insets.top }} className="flex-1">
          {/* Header */}
          <View className="px-6 py-4 flex-row items-center justify-between border-b border-lumis-dusk/50">
            <Pressable
              onPress={handleBack}
              className="flex-row items-center"
            >
              <ChevronLeft size={24} color="#FFB347" strokeWidth={2} />
              <Text
                className="text-lumis-golden ml-1 text-base"
                style={{ fontFamily: 'Outfit_500Medium' }}
              >
                Back
              </Text>
            </Pressable>

            <View className="flex-row items-center">
              <Trophy size={24} color="#FFB347" strokeWidth={2} />
              <Text
                className="text-lumis-golden ml-2 text-lg"
                style={{ fontFamily: 'Outfit_600SemiBold' }}
              >
                {unlockedCount}/{totalCount}
              </Text>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            className="flex-1 px-6"
            contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-6">
              <Text
                className="text-3xl text-lumis-dawn mb-2"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                Achievements
              </Text>
              <Text
                className="text-lumis-sunrise/60"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Unlock badges by maintaining streaks, logging hours, and staying consistent
              </Text>
            </View>

            {/* Streak Achievements */}
            {streak.length > 0 && (
              <CategorySection
                title="🔥 Streak Master"
                achievements={streak}
                startIndex={0}
              />
            )}

            {/* Hours Achievements */}
            {hours.length > 0 && (
              <CategorySection
                title="☀️ Time in Sunlight"
                achievements={hours}
                startIndex={streak.length}
              />
            )}

            {/* Consistency Achievements */}
            {consistency.length > 0 && (
              <CategorySection
                title="⚡ Consistency"
                achievements={consistency}
                startIndex={streak.length + hours.length}
              />
            )}

            {/* Special Achievements */}
            {special.length > 0 && (
              <CategorySection
                title="✨ Special"
                achievements={special}
                startIndex={streak.length + hours.length + consistency.length}
              />
            )}
          </ScrollView>
        </View>
      </LinearGradient>
    </View>
  );
}
