import React, { useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInRight,
  FadeOutLeft,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Sun, Shield, TrendingUp, Footprints, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: readonly [string, string, string];
}

const steps: OnboardingStep[] = [
  {
    icon: <Sun size={64} color="#FFB347" strokeWidth={1.5} />,
    title: 'Morning Light',
    description:
      'Start your day with natural sunlight. Just 10 minutes of outdoor light can reset your circadian rhythm and boost your mood.',
    gradient: ['#1A1A2E', '#16213E', '#0F3460'] as const,
  },
  {
    icon: <Shield size={64} color="#FFB347" strokeWidth={1.5} />,
    title: 'Shield Your Apps',
    description:
      'Select the apps that distract you most. They stay locked until you earn your screen time with light.',
    gradient: ['#1A1A2E', '#0F3460', '#16213E'] as const,
  },
  {
    icon: <Footprints size={64} color="#FFB347" strokeWidth={1.5} />,
    title: 'Move & Unlock',
    description:
      'Take a walk in the morning light. We verify both light exposure and movement to ensure you really went outside.',
    gradient: ['#16213E', '#1A1A2E', '#0F3460'] as const,
  },
  {
    icon: <TrendingUp size={64} color="#FFB347" strokeWidth={1.5} />,
    title: 'Build Your Streak',
    description:
      'Track your progress and build healthy habits. Watch your sleep and mood improve as your streak grows.',
    gradient: ['#0F3460', '#16213E', '#1A1A2E'] as const,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const buttonScale = useSharedValue(1);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLastStep) {
      router.push('/calibration');
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/calibration');
  };

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View className="flex-1">
      <LinearGradient colors={[...step.gradient]} style={{ flex: 1 }}>
        <View
          className="flex-1"
          style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}
        >
          {/* Skip button */}
          <View className="flex-row justify-end px-6">
            <Pressable onPress={handleSkip} className="py-2 px-4">
              <Text
                className="text-lumis-sunrise/60 text-base"
                style={{ fontFamily: 'Outfit_500Medium' }}
              >
                Skip
              </Text>
            </Pressable>
          </View>

          {/* Content */}
          <View className="flex-1 items-center justify-center px-8">
            <Animated.View
              key={currentStep}
              entering={FadeInRight.duration(400)}
              exiting={FadeOutLeft.duration(300)}
              className="items-center"
            >
              {/* Icon container with glow */}
              <View className="mb-12">
                <View
                  style={{
                    shadowColor: '#FFB347',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 40,
                    elevation: 20,
                  }}
                >
                  {step.icon}
                </View>
              </View>

              {/* Title */}
              <Text
                className="text-4xl text-lumis-dawn text-center mb-6"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                {step.title}
              </Text>

              {/* Description */}
              <Text
                className="text-lg text-lumis-sunrise/80 text-center leading-7"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                {step.description}
              </Text>
            </Animated.View>
          </View>

          {/* Progress dots and button */}
          <View className="px-8">
            {/* Progress indicators */}
            <View className="flex-row justify-center mb-8 space-x-3">
              {steps.map((_, index) => (
                <View
                  key={index}
                  className={`h-2 rounded-full ${
                    index === currentStep
                      ? 'w-8 bg-lumis-golden'
                      : index < currentStep
                        ? 'w-2 bg-lumis-golden/60'
                        : 'w-2 bg-lumis-dusk'
                  }`}
                  style={{
                    shadowColor: index === currentStep ? '#FFB347' : 'transparent',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                  }}
                />
              ))}
            </View>

            {/* Next button */}
            <Animated.View style={buttonAnimStyle}>
              <Pressable
                onPress={handleNext}
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
                    {isLastStep ? 'Calibrate Sensors' : 'Continue'}
                  </Text>
                  <ChevronRight size={20} color="#1A1A2E" strokeWidth={2.5} />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
