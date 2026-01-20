import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Sun, Flame, Shield, Settings, BarChart3, ChevronRight, Lock, Unlock, Trophy, Users } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useLumisStore } from '@/lib/state/lumis-store';
import WeatherCard from '@/components/WeatherCard';

function ProgressRing({
  progress,
  size = 240,
  strokeWidth = 12,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFE4B5" />
            <Stop offset="50%" stopColor="#FFB347" />
            <Stop offset="100%" stopColor="#FF6B35" />
          </SvgLinearGradient>
        </Defs>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#0F3460"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
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

  const buttonScale = useSharedValue(1);

  const progress = todayProgress.lightMinutes / dailyGoalMinutes;
  const isCompleted = todayProgress.completed;
  const blockedCount = blockedApps.filter((app) => app.isBlocked).length;

  const handleStartTracking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/tracking');
  };

  const handleOpenSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/settings');
  };

  const handleOpenAnalytics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/analytics');
  };

  const handleOpenInsights = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/insights');
  };

  const handleOpenLeaderboard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/leaderboard');
  };

  const handleOpenFriends = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/friends');
  };

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View className="flex-1">
      <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={{ flex: 1 }}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 100,
          }}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(600)} className="px-6 flex-row justify-between items-center mb-8">
            <View>
              <Text
                className="text-lumis-sunrise/60 text-base"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Good morning
              </Text>
              <Text
                className="text-lumis-dawn text-2xl"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                {isCompleted ? 'Sun Drenched!' : 'Earn Your Light'}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={handleOpenFriends}
                className="w-11 h-11 rounded-full bg-lumis-twilight/50 items-center justify-center"
              >
                <Users size={20} color="#FFB347" strokeWidth={1.5} />
              </Pressable>
              <Pressable
                onPress={handleOpenLeaderboard}
                className="w-11 h-11 rounded-full bg-lumis-twilight/50 items-center justify-center"
              >
                <Trophy size={20} color="#FFB347" strokeWidth={1.5} />
              </Pressable>
              <Pressable
                onPress={handleOpenAnalytics}
                className="w-11 h-11 rounded-full bg-lumis-twilight/50 items-center justify-center"
              >
                <BarChart3 size={20} color="#FFB347" strokeWidth={1.5} />
              </Pressable>
              <Pressable
                onPress={handleOpenSettings}
                className="w-11 h-11 rounded-full bg-lumis-twilight/50 items-center justify-center"
              >
                <Settings size={20} color="#FFB347" strokeWidth={1.5} />
              </Pressable>
            </View>
          </Animated.View>

          {/* Progress Ring */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            className="items-center mb-8"
          >
            <View className="relative">
              <ProgressRing progress={progress} size={260} strokeWidth={14} />
              {/* Center content */}
              <View className="absolute inset-0 items-center justify-center">
                <View
                  className={`w-24 h-24 rounded-full items-center justify-center ${
                    isCompleted ? 'bg-lumis-golden/20' : 'bg-lumis-twilight/50'
                  }`}
                  style={{
                    shadowColor: '#FFB347',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: isCompleted ? 0.6 : 0.2,
                    shadowRadius: 20,
                  }}
                >
                  <Sun
                    size={48}
                    color={isCompleted ? '#FFB347' : '#FFB347'}
                    strokeWidth={1.5}
                    fill={isCompleted ? '#FFB34730' : 'transparent'}
                  />
                </View>
              </View>
            </View>

            {/* Progress text */}
            <View className="items-center mt-6">
              <Text
                className="text-5xl text-lumis-dawn"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                {Math.round(todayProgress.lightMinutes)}
                <Text
                  className="text-2xl text-lumis-sunrise/60"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  {' '}
                  / {dailyGoalMinutes} min
                </Text>
              </Text>
              <Text
                className="text-lumis-sunrise/60 mt-2"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                {isCompleted
                  ? 'Goal achieved! Apps unlocked.'
                  : `${Math.max(0, dailyGoalMinutes - todayProgress.lightMinutes).toFixed(1)} minutes to go`}
              </Text>
            </View>
          </Animated.View>

          {/* Stats row */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            className="flex-row px-6 mb-8 space-x-4"
          >
            {/* Streak card */}
            <View className="flex-1 bg-lumis-twilight/40 rounded-2xl p-4 border border-lumis-dusk/30">
              <View className="flex-row items-center mb-2">
                <Flame size={20} color="#FF6B35" strokeWidth={1.5} />
                <Text
                  className="text-lumis-sunrise/60 ml-2 text-sm"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  Streak
                </Text>
              </View>
              <Text
                className="text-3xl text-lumis-dawn"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                {currentStreak}
                <Text
                  className="text-lg text-lumis-sunrise/50"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  {' '}
                  days
                </Text>
              </Text>
            </View>

            {/* Apps card */}
            <View className="flex-1 bg-lumis-twilight/40 rounded-2xl p-4 border border-lumis-dusk/30">
              <View className="flex-row items-center mb-2">
                {isCompleted ? (
                  <Unlock size={20} color="#4ADE80" strokeWidth={1.5} />
                ) : (
                  <Lock size={20} color="#FFB347" strokeWidth={1.5} />
                )}
                <Text
                  className="text-lumis-sunrise/60 ml-2 text-sm"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  {isCompleted ? 'Unlocked' : 'Shielded'}
                </Text>
              </View>
              <Text
                className="text-3xl text-lumis-dawn"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                {blockedCount}
                <Text
                  className="text-lg text-lumis-sunrise/50"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  {' '}
                  apps
                </Text>
              </Text>
            </View>
          </Animated.View>

          {/* Blocked apps preview */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)} className="px-6 mb-8">
            <Pressable
              onPress={() => router.push('/shield')}
              className="bg-lumis-twilight/30 rounded-2xl p-5 border border-lumis-dusk/30"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Shield size={24} color="#FFB347" strokeWidth={1.5} />
                  <View className="ml-3">
                    <Text
                      className="text-lumis-dawn text-lg"
                      style={{ fontFamily: 'Outfit_600SemiBold' }}
                    >
                      {isCompleted ? 'Apps Unlocked' : 'Apps Shielded'}
                    </Text>
                    <Text
                      className="text-lumis-sunrise/50"
                      style={{ fontFamily: 'Outfit_400Regular' }}
                    >
                      {blockedApps
                        .filter((a) => a.isBlocked)
                        .map((a) => a.name)
                        .slice(0, 3)
                        .join(', ')}
                      {blockedCount > 3 && ` +${blockedCount - 3} more`}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#FFB347" strokeWidth={1.5} />
              </View>
            </Pressable>
          </Animated.View>

          {/* Today's steps */}
          <Animated.View entering={FadeInDown.delay(600).duration(600)} className="px-6 mb-8">
            <View className="bg-lumis-twilight/30 rounded-2xl p-5 border border-lumis-dusk/30">
              <Text
                className="text-lumis-sunrise/60 mb-2"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Steps during tracking
              </Text>
              <Text
                className="text-3xl text-lumis-dawn"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                {todayProgress.steps}
                <Text
                  className="text-lg text-lumis-sunrise/50"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  {' '}
                  steps
                </Text>
              </Text>
            </View>
          </Animated.View>

          {/* Weather Card */}
          <Animated.View entering={FadeInDown.delay(700).duration(600)} className="px-6 mb-8">
            <WeatherCard />
          </Animated.View>

          {/* Insights & Trends */}
          <Animated.View entering={FadeInDown.delay(800).duration(600)} className="px-6">
            <Pressable
              onPress={handleOpenInsights}
              className="bg-lumis-twilight/30 rounded-2xl p-5 border border-lumis-dusk/30 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <Text className="text-2xl">📊</Text>
                <View className="ml-3">
                  <Text
                    className="text-lumis-dawn text-lg"
                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                  >
                    Insights & Trends
                  </Text>
                  <Text
                    className="text-lumis-sunrise/50"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    See your progress
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#FFB347" strokeWidth={1.5} />
            </Pressable>
          </Animated.View>
        </ScrollView>

        {/* Fixed bottom button */}
        {!isCompleted && (
          <View
            className="absolute bottom-0 left-0 right-0 px-6"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <Animated.View style={buttonAnimStyle}>
              <Pressable
                onPress={handleStartTracking}
                onPressIn={() => {
                  buttonScale.value = withSpring(0.95);
                }}
                onPressOut={() => {
                  buttonScale.value = withSpring(1);
                }}
                className="w-full"
              >
                <LinearGradient
                  colors={['#FFB347', '#FF8C00', '#FF6B35']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 18,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#FF8C00',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 16,
                    elevation: 8,
                  }}
                >
                  <Sun size={22} color="#1A1A2E" strokeWidth={2} />
                  <Text
                    className="text-lumis-night text-lg ml-2"
                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                  >
                    Start Light Tracking
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}
