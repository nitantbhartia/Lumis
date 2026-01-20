import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Trophy, Flame, Clock } from 'lucide-react-native';
import { useSocialStore } from '@/lib/state/social-store';

export default function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const leaderboard = useSocialStore((s) => s.leaderboard);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const LeaderboardRow = ({ entry, index }: { entry: any; index: number }) => {
    const isCurrentUser = entry.isCurrentUser;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).duration(400)}
        className="mb-3"
      >
        <View
          className={`rounded-2xl p-4 border flex-row items-center ${
            isCurrentUser
              ? 'bg-lumis-golden/10 border-lumis-golden/50'
              : 'bg-lumis-twilight/40 border-lumis-dusk/50'
          }`}
        >
          {/* Rank */}
          <View className="w-12 h-12 rounded-xl bg-lumis-twilight/60 items-center justify-center mr-4">
            <Text
              className="text-2xl"
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              {getMedalEmoji(entry.rank)}
            </Text>
          </View>

          {/* User Info */}
          <View className="flex-1">
            <Text
              className={isCurrentUser ? 'text-lumis-golden text-lg' : 'text-lumis-dawn text-lg'}
              style={{ fontFamily: 'Outfit_600SemiBold' }}
            >
              {entry.name}
              {isCurrentUser && ' (You)'}
            </Text>
            <View className="flex-row items-center gap-3 mt-2">
              <View className="flex-row items-center gap-1">
                <Flame size={14} color="#FFB347" strokeWidth={2} />
                <Text
                  className="text-lumis-sunrise/70 text-sm"
                  style={{ fontFamily: 'Outfit_500Medium' }}
                >
                  {entry.streakDays}d
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Clock size={14} color="#FFB347" strokeWidth={2} />
                <Text
                  className="text-lumis-sunrise/70 text-sm"
                  style={{ fontFamily: 'Outfit_500Medium' }}
                >
                  {Math.round(entry.totalHours)}h
                </Text>
              </View>
            </View>
          </View>

          {/* Score Badge */}
          <View className="bg-lumis-dusk/50 rounded-xl px-4 py-3 items-center">
            <Text
              className="text-lumis-golden text-lg"
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              {entry.streakDays * 10 + Math.round(entry.totalHours)}
            </Text>
            <Text
              className="text-lumis-sunrise/50 text-xs"
              style={{ fontFamily: 'Outfit_400Regular' }}
            >
              points
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const topThree = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3);

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
                Leaderboard
              </Text>
            </View>

            <View className="w-6" />
          </View>

          {/* Content */}
          <ScrollView
            className="flex-1 px-6"
            contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Podium */}
            {topThree.length > 0 && (
              <View className="mb-8">
                <Text
                  className="text-xl text-lumis-dawn mb-4"
                  style={{ fontFamily: 'Outfit_700Bold' }}
                >
                  Top 3
                </Text>

                <View className="flex-row items-flex-end gap-3 h-40">
                  {/* 2nd Place */}
                  {topThree[1] && (
                    <Animated.View
                      entering={FadeInDown.delay(100).duration(400)}
                      className="flex-1 items-center"
                    >
                      <View className="bg-lumis-twilight/60 rounded-2xl p-4 w-full items-center border border-lumis-dusk/50 flex-1 justify-end mb-3">
                        <Text className="text-4xl mb-2">🥈</Text>
                        <Text
                          className="text-lumis-dawn font-semibold"
                          style={{ fontFamily: 'Outfit_600SemiBold' }}
                        >
                          {topThree[1].name}
                        </Text>
                        <Text
                          className="text-lumis-sunrise/60 text-sm mt-1"
                          style={{ fontFamily: 'Outfit_400Regular' }}
                        >
                          {topThree[1].streakDays}d streak
                        </Text>
                      </View>
                      <View className="bg-lumis-golden/20 rounded-lg px-2 py-1">
                        <Text
                          className="text-lumis-golden text-sm"
                          style={{ fontFamily: 'Outfit_600SemiBold' }}
                        >
                          #{topThree[1].rank}
                        </Text>
                      </View>
                    </Animated.View>
                  )}

                  {/* 1st Place */}
                  {topThree[0] && (
                    <Animated.View
                      entering={FadeInDown.delay(50).duration(400)}
                      className="flex-1 items-center"
                    >
                      <View
                        className="bg-lumis-golden/10 rounded-2xl p-4 w-full items-center border-2 border-lumis-golden/50 flex-1 justify-end mb-3"
                        style={{
                          shadowColor: '#FFB347',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.4,
                          shadowRadius: 12,
                        }}
                      >
                        <Text className="text-5xl mb-2">🥇</Text>
                        <Text
                          className="text-lumis-golden font-semibold text-lg"
                          style={{ fontFamily: 'Outfit_700Bold' }}
                        >
                          {topThree[0].name}
                        </Text>
                        <Text
                          className="text-lumis-golden/70 text-sm mt-1"
                          style={{ fontFamily: 'Outfit_500Medium' }}
                        >
                          {topThree[0].streakDays}d streak
                        </Text>
                      </View>
                      <View className="bg-lumis-golden/20 rounded-lg px-2 py-1">
                        <Text
                          className="text-lumis-golden text-sm"
                          style={{ fontFamily: 'Outfit_700Bold' }}
                        >
                          🏆 #1
                        </Text>
                      </View>
                    </Animated.View>
                  )}

                  {/* 3rd Place */}
                  {topThree[2] && (
                    <Animated.View
                      entering={FadeInDown.delay(150).duration(400)}
                      className="flex-1 items-center"
                    >
                      <View className="bg-lumis-twilight/60 rounded-2xl p-4 w-full items-center border border-lumis-dusk/50 flex-1 justify-end mb-3">
                        <Text className="text-4xl mb-2">🥉</Text>
                        <Text
                          className="text-lumis-dawn font-semibold"
                          style={{ fontFamily: 'Outfit_600SemiBold' }}
                        >
                          {topThree[2].name}
                        </Text>
                        <Text
                          className="text-lumis-sunrise/60 text-sm mt-1"
                          style={{ fontFamily: 'Outfit_400Regular' }}
                        >
                          {topThree[2].streakDays}d streak
                        </Text>
                      </View>
                      <View className="bg-lumis-golden/20 rounded-lg px-2 py-1">
                        <Text
                          className="text-lumis-golden text-sm"
                          style={{ fontFamily: 'Outfit_600SemiBold' }}
                        >
                          #{topThree[2].rank}
                        </Text>
                      </View>
                    </Animated.View>
                  )}
                </View>
              </View>
            )}

            {/* Rest of Leaderboard */}
            {restOfList.length > 0 && (
              <View>
                <Text
                  className="text-xl text-lumis-dawn mb-4"
                  style={{ fontFamily: 'Outfit_700Bold' }}
                >
                  More Rankings
                </Text>
                {restOfList.map((entry, index) => (
                  <LeaderboardRow key={entry.userId} entry={entry} index={index} />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </LinearGradient>
    </View>
  );
}
