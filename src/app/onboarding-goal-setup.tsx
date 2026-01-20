import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Sun, ChevronRight, Check } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import { GlassCard } from '@/components/GlassCard';

const GOAL_PRESETS = [10, 15, 20, 30];

export default function OnboardingGoalSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const setDailyGoalMinutes = useLumisStore((s) => s.setDailyGoalMinutes);
  const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);

  const [selectedGoal, setSelectedGoal] = useState(dailyGoalMinutes || 15);
  const buttonScale = useSharedValue(1);

  const handleGoalSelect = (minutes: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGoal(minutes);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDailyGoalMinutes(selectedGoal);
    router.push('/onboarding-success');
  };

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View className="flex-1 bg-lumis-night">
      <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={{ flex: 1 }}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }}
        >
          <View className="px-8">
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(400)} className="mb-8">
              <View className="w-20 h-20 rounded-3xl bg-lumis-golden/20 items-center justify-center mb-6">
                <Sun size={40} color="#FFB347" strokeWidth={1.5} />
              </View>
              <Text
                className="text-4xl text-lumis-dawn mb-3"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                Set Your Goal
              </Text>
              <Text
                className="text-lg text-lumis-sunrise/70"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                How many minutes of sunlight do you want to get each morning?
              </Text>
            </Animated.View>

            {/* Goal Presets */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} className="mb-8">
              <Text
                className="text-lumis-sunrise/60 text-sm uppercase mb-4"
                style={{ fontFamily: 'Outfit_500Medium' }}
              >
                Choose Your Daily Goal
              </Text>
              <View className="gap-3">
                {GOAL_PRESETS.map((minutes, index) => {
                  const isSelected = selectedGoal === minutes;
                  const isRecommended = minutes === 15;

                  return (
                    <Animated.View
                      key={minutes}
                      entering={FadeInDown.delay(200 + index * 50).duration(400)}
                    >
                      <GlassCard
                        variant={isSelected ? 'elevated' : 'default'}
                        onPress={() => handleGoalSelect(minutes)}
                        glow={isSelected}
                      >
                        <View className="flex-row items-center">
                          <View
                            className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${
                              isSelected ? 'bg-lumis-golden/20' : 'bg-lumis-dusk/30'
                            }`}
                          >
                            <Text
                              className={`text-2xl ${
                                isSelected ? 'text-lumis-golden' : 'text-lumis-sunrise/60'
                              }`}
                              style={{ fontFamily: 'Outfit_700Bold' }}
                            >
                              {minutes}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center">
                              <Text
                                className="text-lumis-dawn text-lg"
                                style={{ fontFamily: 'Outfit_600SemiBold' }}
                              >
                                {minutes} Minutes
                              </Text>
                              {isRecommended && (
                                <View className="ml-2 bg-success/20 px-2 py-1 rounded-full">
                                  <Text
                                    className="text-success text-xs"
                                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                                  >
                                    Recommended
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text
                              className={`text-sm ${
                                isSelected ? 'text-lumis-golden/80' : 'text-lumis-sunrise/50'
                              }`}
                              style={{ fontFamily: 'Outfit_400Regular' }}
                            >
                              {minutes === 10 && 'Quick morning boost'}
                              {minutes === 15 && 'Perfect for most people'}
                              {minutes === 20 && 'Build a strong habit'}
                              {minutes === 30 && 'Maximum benefits'}
                            </Text>
                          </View>
                          {isSelected && (
                            <View className="w-8 h-8 rounded-full bg-lumis-golden items-center justify-center">
                              <Check size={18} color="#1A1A2E" strokeWidth={3} />
                            </View>
                          )}
                        </View>
                      </GlassCard>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>

            {/* Info Card */}
            <Animated.View entering={FadeInDown.delay(400).duration(400)} className="mb-8">
              <GlassCard variant="flat">
                <Text
                  className="text-lumis-sunrise/70 text-sm leading-relaxed"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  💡 <Text style={{ fontFamily: 'Outfit_600SemiBold' }}>Pro tip:</Text> Morning sunlight
                  within 2 hours of waking helps regulate your circadian rhythm, improving sleep quality and
                  mood throughout the day.
                </Text>
              </GlassCard>
            </Animated.View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View className="px-8" style={{ paddingBottom: insets.bottom + 20 }}>
          <Animated.View style={buttonAnimStyle}>
            <Pressable
              onPress={handleContinue}
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
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Text
                  className="text-lumis-night text-lg mr-2"
                  style={{ fontFamily: 'Outfit_600SemiBold' }}
                >
                  Continue
                </Text>
                <ChevronRight size={20} color="#1A1A2E" strokeWidth={2.5} />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}
