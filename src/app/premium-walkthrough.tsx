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
    FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronRight, Sparkles, TrendingUp, Shield, Sun, CloudRain } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';

const ProSlides = [
    {
        icon: CloudRain,
        title: 'Adaptive Goals',
        subtitle: 'Lumis automatically adjusts your light goal based on the weather forecast.',
        color: '#FFB347',
    },
    {
        icon: TrendingUp,
        title: 'Advanced Stats',
        subtitle: 'Unlock deep insights into your circadian rhythm and monthly progress.',
        color: '#FF8C00',
    },
    {
        icon: Shield,
        title: 'Unlimited Shielding',
        subtitle: 'Block as many distracting apps as you need. No more limits.',
        color: '#FF6B35',
    },
    {
        icon: Sparkles,
        title: 'No Credit Card Needed',
        subtitle: 'Try all Pro features for 7 days. Absolutely free, no commitment.',
        color: '#FFD700',
    },
];

export default function PremiumWalkthroughScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [currentSlide, setCurrentSlide] = useState(0);
    const slideOpacity = useSharedValue(1);

    const startTrial = useLumisStore((s) => s.startTrial);
    const trialStartedAt = useLumisStore((s) => s.trialStartedAt);

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (currentSlide < ProSlides.length - 1) {
            slideOpacity.value = withTiming(0, { duration: 200 });
            setTimeout(() => {
                setCurrentSlide(currentSlide + 1);
                slideOpacity.value = withTiming(1, { duration: 200 });
            }, 200);
        } else {
            // If they haven't started trial, maybe offer it here or just go to paywall
            router.replace('/premium');
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.replace('/dashboard');
    };

    const slideStyle = useAnimatedStyle(() => ({
        opacity: slideOpacity.value,
    }));

    const slide = ProSlides[currentSlide];
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
                                {ProSlides.map((_, idx) => (
                                    <View
                                        key={idx}
                                        className={`h-1.5 flex-1 rounded-full ${idx === currentSlide ? 'bg-lumis-golden' : 'bg-lumis-twilight/50'
                                            }`}
                                    />
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Content */}
                    <View className="flex-1 items-center justify-center">
                        <Animated.View style={slideStyle} className="items-center gap-8 w-full">
                            {/* Icon */}
                            <View
                                style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: 60,
                                    backgroundColor: slide.color + '20',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    shadowColor: slide.color,
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 20,
                                }}
                            >
                                <IconComponent size={60} color={slide.color} strokeWidth={1.5} />
                            </View>

                            {/* Text */}
                            <View className="items-center gap-4 px-4">
                                <Text
                                    className="text-4xl text-lumis-dawn text-center"
                                    style={{ fontFamily: 'Outfit_700Bold' }}
                                >
                                    {slide.title}
                                </Text>
                                <Text
                                    className="text-xl text-lumis-sunrise text-center leading-7"
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
                            className="active:scale-95 shadow-lg"
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
                                    gap: 10,
                                }}
                            >
                                <Text
                                    className="text-lumis-night text-xl"
                                    style={{ fontFamily: 'Outfit_700Bold' }}
                                >
                                    {currentSlide === ProSlides.length - 1 ? 'Start Free Trial' : 'Continue'}
                                </Text>
                                <ChevronRight size={24} color="#1A1A2E" strokeWidth={2.5} />
                            </LinearGradient>
                        </Pressable>

                        {/* Skip Button */}
                        <Pressable onPress={handleSkip} className="py-2">
                            <Text
                                className="text-lumis-sunrise/50 text-center text-base"
                                style={{ fontFamily: 'Outfit_500Medium' }}
                            >
                                {currentSlide === ProSlides.length - 1 ? 'Not right now' : 'Skip walkthrough'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}
