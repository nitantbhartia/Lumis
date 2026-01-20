import React from 'react';
import { View, Text, ScrollView, Pressable, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Users, Flame, Clock, Share2 } from 'lucide-react-native';
import { useSocialStore } from '@/lib/state/social-store';

export default function FriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const friends = useSocialStore((s) => s.friends);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleShareStreak = async (friendName: string, streak: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await Share.share({
        message: `🔥 ${friendName} has a ${streak}-day streak on Lumis! Can you beat their streak?`,
        title: 'Check out this Lumis streak!',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const formatLastActivity = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return activityTime.toLocaleDateString();
  };

  const FriendCard = ({ friend, index }: { friend: any; index: number }) => {
    const isStreakHot = friend.currentStreak >= 7;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50 + 100).duration(400)}
        className="mb-4"
      >
        <View
          className={`rounded-2xl p-5 border ${
            isStreakHot
              ? 'bg-lumis-twilight/60 border-lumis-golden/30'
              : 'bg-lumis-twilight/40 border-lumis-dusk/50'
          }`}
        >
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              <Text
                className="text-lg text-lumis-dawn"
                style={{ fontFamily: 'Outfit_600SemiBold' }}
              >
                {friend.name}
              </Text>
              <Text
                className="text-lumis-sunrise/60 text-sm mt-1"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Active {formatLastActivity(friend.lastActivityAt)}
              </Text>
            </View>

            <Pressable
              onPress={() => handleShareStreak(friend.name, friend.currentStreak)}
              className="w-10 h-10 rounded-lg bg-lumis-dusk/50 items-center justify-center"
            >
              <Share2 size={18} color="#FFB347" strokeWidth={2} />
            </Pressable>
          </View>

          {/* Stats */}
          <View className="flex-row gap-3">
            {/* Current Streak */}
            <View className="flex-1 bg-lumis-night/40 rounded-xl p-4 items-center">
              <View className="flex-row items-center gap-2 mb-2">
                <Flame size={18} color="#FFB347" strokeWidth={2} />
                <Text
                  className="text-lumis-golden text-2xl"
                  style={{ fontFamily: 'Outfit_700Bold' }}
                >
                  {friend.currentStreak}
                </Text>
              </View>
              <Text
                className="text-lumis-sunrise/60 text-xs"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Current Streak
              </Text>
            </View>

            {/* Longest Streak */}
            <View className="flex-1 bg-lumis-night/40 rounded-xl p-4 items-center">
              <View className="flex-row items-center gap-2 mb-2">
                <Flame size={18} color="#FFB34780" strokeWidth={2} />
                <Text
                  className="text-lumis-sunrise/70 text-2xl"
                  style={{ fontFamily: 'Outfit_700Bold' }}
                >
                  {friend.longestStreak}
                </Text>
              </View>
              <Text
                className="text-lumis-sunrise/60 text-xs"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Best Streak
              </Text>
            </View>

            {/* Total Hours */}
            <View className="flex-1 bg-lumis-night/40 rounded-xl p-4 items-center">
              <View className="flex-row items-center gap-2 mb-2">
                <Clock size={18} color="#FFB34780" strokeWidth={2} />
                <Text
                  className="text-lumis-sunrise/70 text-2xl"
                  style={{ fontFamily: 'Outfit_700Bold' }}
                >
                  {Math.round(friend.totalHours)}
                </Text>
              </View>
              <Text
                className="text-lumis-sunrise/60 text-xs"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Total Hours
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
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
              <Users size={24} color="#FFB347" strokeWidth={2} />
              <Text
                className="text-lumis-golden ml-2 text-lg"
                style={{ fontFamily: 'Outfit_600SemiBold' }}
              >
                Friends
              </Text>
            </View>

            <View className="w-24">
              <View className="bg-lumis-dusk/50 rounded-lg px-2 py-1 items-center">
                <Text
                  className="text-lumis-golden text-sm"
                  style={{ fontFamily: 'Outfit_600SemiBold' }}
                >
                  {friends.length} friends
                </Text>
              </View>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            className="flex-1 px-6"
            contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.duration(600)} className="mb-6">
              <Text
                className="text-3xl text-lumis-dawn mb-2"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                Your Friends
              </Text>
              <Text
                className="text-lumis-sunrise/60"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Follow your friends' streaks and challenge them to beat your record
              </Text>
            </Animated.View>

            {friends.length === 0 ? (
              <Animated.View
                entering={FadeInDown.delay(100).duration(400)}
                className="items-center justify-center py-12"
              >
                <Users size={48} color="#FFB34740" strokeWidth={1.5} />
                <Text
                  className="text-lumis-sunrise/60 text-center mt-4"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  No friends yet. Invite friends to get started!
                </Text>
              </Animated.View>
            ) : (
              friends.map((friend, index) => (
                <FriendCard key={friend.id} friend={friend} index={index} />
              ))
            )}
          </ScrollView>
        </View>
      </LinearGradient>
    </View>
  );
}
