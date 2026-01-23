import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Sun, ArrowLeft, Zap, Brain } from 'lucide-react-native';
import { LumisHeroButton } from '@/components/ui/LumisHeroButton';

const { height } = Dimensions.get('window');
const isSmallDevice = height < 750;

const PILLARS = [
    {
        id: 'dopamine',
        icon: Zap,
        title: 'Dopamine Reset',
        caption: 'Shielding the scroll prevents stress-inducing dopamine spikes.',
        color: '#FF6B6B',
    },
    {
        id: 'cortisol',
        icon: Sun,
        title: 'Cortisol Anchor',
        caption: 'Direct light clears sleepy brain fog and inertia.',
        color: '#FFB347',
    },
    {
        id: 'circadian',
        icon: Brain,
        title: 'Circadian Signal',
        caption: 'Morning light sets your biological clock for 24h.',
        color: '#4CAF50',
    },
];

export default function OnboardingScienceScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [activeIndex, setActiveIndex] = useState(-1);

    const sunPulse = useSharedValue(0.6);
    const sunriseOpacity = useSharedValue(0);
    const benefitProgress = useSharedValue(0.33);

    useEffect(() => {
        sunPulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1500 }),
                withTiming(0.6, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);

    useEffect(() => {
        const targetProgress = activeIndex === -1 ? 0.33 : (activeIndex + 1) / PILLARS.length;
        benefitProgress.value = withTiming(targetProgress, { duration: 400 });
    }, [activeIndex]);

    const sunPulseStyle = useAnimatedStyle(() => ({
        opacity: sunPulse.value * 0.5,
        transform: [{ scale: interpolate(sunPulse.value, [0.6, 1], [1, 1.2]) }],
    }));

    const benefitBarStyle = useAnimatedStyle(() => ({
        width: `${benefitProgress.value * 100}%`,
    }));

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        sunriseOpacity.value = withTiming(1, { duration: 800 });
        setTimeout(() => {
            router.push('/onboarding-commitment');
        }, 700);
    };

    const sunriseOverlayStyle = useAnimatedStyle(() => ({
        opacity: sunriseOpacity.value,
        zIndex: sunriseOpacity.value > 0 ? 1000 : -1,
    }));

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
            <LinearGradient
                colors={['#1A1A2E', '#2D3A4F', '#4A5568', '#D4A373', '#FFDAB9']}
                locations={[0, 0.25, 0.5, 0.75, 1]}
                style={StyleSheet.absoluteFill}
            />

            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, sunriseOverlayStyle]}>
                <LinearGradient
                    colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
                    locations={[0, 0.3, 0.7, 1]}
                    style={{ flex: 1 }}
                />
            </Animated.View>

            {/* Scrollable to ensure content is NEVER trapped on small screens */}
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: insets.top + (isSmallDevice ? 10 : 30),
                    paddingBottom: insets.bottom + 30,
                    paddingHorizontal: 28,
                    justifyContent: 'space-between'
                }}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Header */}
                <View style={{ alignItems: 'center' }}>
                    <View style={styles.visualHeader}>
                        <Animated.View style={[styles.sunGlow, sunPulseStyle]} />
                        <Sun size={isSmallDevice ? 40 : 52} color="#FFB347" fill="#FFB347" strokeWidth={1} />
                    </View>

                    <Text style={styles.headline}>
                        Your Brain Needs{'\n'}a Biological Buffer.
                    </Text>

                    <Text style={styles.summary}>
                        Light is the switch that moves your brain from sleep to focus.
                    </Text>
                </View>

                {/* Pillars */}
                <View style={styles.pillarsContainer}>
                    {PILLARS.map((pillar, index) => {
                        const IconComponent = pillar.icon;
                        const isActive = activeIndex === index;
                        return (
                            <Pressable
                                key={pillar.id}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setActiveIndex(activeIndex === index ? -1 : index);
                                }}
                                style={[styles.pillarCardOuter, isActive && styles.pillarCardActive]}
                            >
                                <BlurView intensity={80} tint="light" style={styles.pillarBlur}>
                                    <View style={[styles.pillarAccent, { backgroundColor: pillar.color }]} />
                                    <View style={[styles.pillarIcon, { backgroundColor: `${pillar.color}25` }]}>
                                        <IconComponent size={20} color={pillar.color} strokeWidth={2.5} />
                                    </View>
                                    <View style={styles.pillarText}>
                                        <Text style={styles.pillarTitle}>{pillar.title}</Text>
                                        {isActive && <Text style={styles.pillarCaption}>{pillar.caption}</Text>}
                                    </View>
                                </BlurView>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Bottom Section */}
                <View style={{ gap: isSmallDevice ? 16 : 24 }}>
                    <View style={styles.benefitMeterContainer}>
                        <View style={styles.benefitMeterLabels}>
                            <Text style={styles.benefitLabelLeft}>Dopamine Debt</Text>
                            <Text style={styles.benefitLabelRight}>Circadian Anchor</Text>
                        </View>
                        <View style={styles.benefitMeterTrack}>
                            <Animated.View style={[styles.benefitMeterFill, benefitBarStyle]}>
                                <LinearGradient
                                    colors={['#FF6B6B', '#FFB347', '#4CAF50']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFill}
                                />
                            </Animated.View>
                        </View>
                        <Text style={styles.benefitHint}>Tap cards for science details</Text>
                    </View>

                    <LumisHeroButton
                        title="Begin Reset"
                        onPress={handleNext}
                        icon={null}
                    />
                </View>
            </ScrollView>

            {/* Absolute Back Button */}
            <View style={{ position: 'absolute', top: insets.top + 0, left: 16 }}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    backButton: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    visualHeader: { alignItems: 'center', justifyContent: 'center', height: isSmallDevice ? 50 : 70 },
    sunGlow: { position: 'absolute', width: isSmallDevice ? 60 : 90, height: isSmallDevice ? 60 : 90, borderRadius: 45, backgroundColor: '#FFB347' },
    headline: { fontSize: isSmallDevice ? 24 : 34, fontFamily: 'Outfit_700Bold', color: '#FFFFFF', textAlign: 'center', lineHeight: isSmallDevice ? 30 : 42, marginTop: 6 },
    summary: { fontSize: isSmallDevice ? 13 : 16, fontFamily: 'Outfit_500Medium', color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center', lineHeight: isSmallDevice ? 18 : 24, marginTop: 4 },
    pillarsContainer: { marginVertical: isSmallDevice ? 10 : 20 },
    pillarCardOuter: { borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.2)', marginBottom: 12 },
    pillarCardActive: { borderColor: 'rgba(255, 255, 255, 0.5)', backgroundColor: 'rgba(255, 255, 255, 0.05)' },
    pillarBlur: { flexDirection: 'row', alignItems: 'center', padding: isSmallDevice ? 10 : 16, backgroundColor: 'rgba(255, 255, 255, 0.12)' },
    pillarAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
    pillarIcon: { width: isSmallDevice ? 36 : 46, height: isSmallDevice ? 36 : 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    pillarText: { flex: 1 },
    pillarTitle: { fontSize: isSmallDevice ? 15 : 18, fontFamily: 'Outfit_600SemiBold', color: '#FFFFFF' },
    pillarCaption: { fontSize: isSmallDevice ? 12 : 14, fontFamily: 'Outfit_400Regular', color: 'rgba(255, 255, 255, 0.8)', lineHeight: isSmallDevice ? 16 : 20, marginTop: 4 },
    benefitMeterContainer: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    benefitMeterLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    benefitLabelLeft: { fontSize: 10, fontFamily: 'Outfit_700Bold', color: '#FF6B6B', textTransform: 'uppercase', letterSpacing: 1 },
    benefitLabelRight: { fontSize: 10, fontFamily: 'Outfit_700Bold', color: '#4CAF50', textTransform: 'uppercase', letterSpacing: 1 },
    benefitMeterTrack: { height: 6, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 3, overflow: 'hidden' },
    benefitMeterFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },
    benefitHint: { fontSize: 11, fontFamily: 'Outfit_400Regular', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', marginTop: 8 },
    ctaButton: { width: '100%', height: isSmallDevice ? 56 : 72, borderRadius: 36, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
    ctaPressed: { transform: [{ scale: 0.97 }] },
    ctaGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 36, gap: 12 },
    ctaText: { fontSize: isSmallDevice ? 18 : 22, fontFamily: 'Outfit_800ExtraBold', color: '#1A1A2E', textTransform: 'uppercase', letterSpacing: 2 },
});
