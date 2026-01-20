import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronRight, Lock, Zap, Sun } from 'lucide-react-native';

const ValueProps = [
  {
    icon: Lock,
    title: 'Screen Lock',
    description: 'Your apps sleep until YOU reset.',
    color: '#FF8C00',
  },
  {
    icon: Zap,
    title: 'Cortisol Kickstart',
    description: 'Morning sun floods your brain with energy hormones.',
    color: '#FFB347',
  },
  {
    icon: Sun,
    title: 'Sun Scoring',
    description: 'Step outside. Lumis tracks real daylight to unlock your day.',
    color: '#FF6B35',
  },
];

export default function OnboardingValuePropScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding-calibration');
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 px-8 justify-between"
          style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }}
        >
          {/* Header */}
          <View>
            <Text
              className="text-4xl text-lumis-dawn mb-2"
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              How it works
            </Text>
            <Text
              className="text-lg text-lumis-sunrise"
              style={{ fontFamily: 'Outfit_400Regular' }}
            >
              The first 30 minutes of light decide your whole day.
            </Text>
          </View>

          {/* List */}
          <View className="gap-6">
            {ValueProps.map((item, index) => {
              const Icon = item.icon;
              return (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(index * 200).springify()}
                  className="flex-row items-start gap-4"
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: item.color + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={24} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-xl text-lumis-dawn mb-1"
                      style={{ fontFamily: 'Outfit_600SemiBold' }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      className="text-base text-lumis-sunrise"
                      style={{ fontFamily: 'Outfit_400Regular' }}
                    >
                      {item.description}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>

          {/* Button */}
          <Pressable
            onPress={handleContinue}
            className="active:scale-95"
          >
            <LinearGradient
              colors={['#FFB347', '#FF8C00', '#FF6B35']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 18,
                borderRadius: 16,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text
                className="text-lumis-night text-lg"
                style={{ fontFamily: 'Outfit_600SemiBold' }}
              >
                Let's Go
              </Text>
              <ChevronRight size={20} color="#1A1A2E" strokeWidth={2.5} />
            </LinearGradient>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}
