import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronRight, Lock, Zap, Sun } from 'lucide-react-native';

const ValuePropSlides = [
  {
    icon: Lock,
    title: 'Your morning is locked',
    subtitle: 'Distracting apps are blocked until you\'ve had natural light exposure',
    color: '#FF8C00',
  },
  {
    icon: Zap,
    title: 'Proven to work',
    subtitle: 'Natural light exposure resets your circadian rhythm and boosts productivity',
    color: '#FFB347',
  },
  {
    icon: Sun,
    title: 'See the magic',
    subtitle: 'Your phone reacts to light. Point it at a window to feel the difference',
    color: '#FF6B35',
  },
];

export default function OnboardingValuePropScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slideOpacity = useSharedValue(1);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentSlide < ValuePropSlides.length - 1) {
      slideOpacity.value = withTiming(0, { duration: 200 });
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        slideOpacity.value = withTiming(1, { duration: 200 });
      }, 200);
    } else {
      router.push('/onboarding-calibration');
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding-calibration');
  };

  const slideStyle = useAnimatedStyle(() => ({
    opacity: slideOpacity.value,
  }));

  const slide = ValuePropSlides[currentSlide];
  const IconComponent = slide.icon;

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 px-6"
          style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-1">
              <View className="flex-row gap-1">
                {ValuePropSlides.map((_, idx) => (
                  <View
                    key={idx}
                    className={`h-1 flex-1 rounded-full ${
                      idx === currentSlide ? 'bg-lumis-golden' : 'bg-lumis-twilight'
                    }`}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Content */}
          <View className="flex-1 items-center justify-center">
            <Animated.View style={slideStyle} className="items-center gap-6 w-full">
              {/* Icon */}
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: slide.color + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <IconComponent size={50} color={slide.color} strokeWidth={1.5} />
              </View>

              {/* Text */}
              <View className="items-center gap-3">
                <Text
                  className="text-4xl text-lumis-dawn text-center"
                  style={{ fontFamily: 'Outfit_700Bold' }}
                >
                  {slide.title}
                </Text>
                <Text
                  className="text-lg text-lumis-sunrise text-center"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  {slide.subtitle}
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Buttons */}
          <View className="gap-4">
            {/* Next Button */}
            <Pressable
              onPress={handleNext}
              className="active:scale-95"
            >
              <LinearGradient
                colors={[slide.color, slide.color + 'dd']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 16,
                  borderRadius: 12,
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
                  {currentSlide === ValuePropSlides.length - 1 ? 'Start Test' : 'Next'}
                </Text>
                <ChevronRight size={20} color="#1A1A2E" strokeWidth={2.5} />
              </LinearGradient>
            </Pressable>

            {/* Skip Button */}
            {currentSlide < ValuePropSlides.length - 1 && (
              <Pressable onPress={handleSkip}>
                <Text
                  className="text-lumis-sunrise text-center text-base"
                  style={{ fontFamily: 'Outfit_500Medium' }}
                >
                  Skip
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
