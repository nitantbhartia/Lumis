import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withRepeat,
    withSequence,
    FadeIn,
    FadeInUp,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Smartphone, Brain, Sun, Moon, Battery, Check } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';

const { width, height } = Dimensions.get('window');

interface AnalysisStep {
    id: string;
    label: string;
    icon: typeof Smartphone;
    value: string;
    points: number;
}

// Same risk calculation as diagnosis screen
function calculateScore(data: {
    phoneReach: string | null;
    brainFog: string | null;
    sunlight: string | null;
    screenBeforeBed: string | null;
    morningEnergy: string | null;
}): number {
    let score = 0;

    if (data.phoneReach === 'immediately') score += 25;
    else if (data.phoneReach === 'in_bed') score += 18;
    else if (data.phoneReach === 'coffee') score += 8;

    if (data.brainFog === 'yes') score += 22;
    else if (data.brainFog === 'most') score += 15;

    if (data.sunlight === 'rarely') score += 18;
    else if (data.sunlight === 'once_a_week') score += 14;
    else if (data.sunlight === 'few_times') score += 6;

    if (data.screenBeforeBed === 'always') score += 18;
    else if (data.screenBeforeBed === 'often') score += 12;
    else if (data.screenBeforeBed === 'sometimes') score += 5;

    if (data.morningEnergy === 'exhausted') score += 17;
    else if (data.morningEnergy === 'sluggish') score += 12;
    else if (data.morningEnergy === 'okay') score += 5;

    return score;
}

export default function OnboardingProfileCompleteScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Get user answers from store
    const phoneReachTiming = useLumisStore((s) => s.phoneReachTiming);
    const brainFogFrequency = useLumisStore((s) => s.brainFogFrequency);
    const sunlightFrequency = useLumisStore((s) => s.sunlightFrequency);
    const screenBeforeBed = useLumisStore((s) => s.screenBeforeBed);
    const morningEnergyLevel = useLumisStore((s) => s.morningEnergyLevel);

    // Animation state
    const [currentStep, setCurrentStep] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const scoreValue = useSharedValue(0);
    const sunScale = useSharedValue(1);
    const sunOpacity = useSharedValue(0);
    const flashOpacity = useSharedValue(0);

    // Calculate real score
    const finalScore = useMemo(() => calculateScore({
        phoneReach: phoneReachTiming,
        brainFog: brainFogFrequency,
        sunlight: sunlightFrequency,
        screenBeforeBed: screenBeforeBed,
        morningEnergy: morningEnergyLevel,
    }), [phoneReachTiming, brainFogFrequency, sunlightFrequency, screenBeforeBed, morningEnergyLevel]);

    // Build analysis steps based on actual user data
    const analysisSteps: AnalysisStep[] = useMemo(() => {
        const steps: AnalysisStep[] = [];

        // Phone timing
        const phoneLabels: Record<string, string> = {
            'immediately': 'Within 5 minutes',
            'in_bed': 'While in bed',
            'coffee': 'With morning coffee',
            'out_door': 'After going outside',
        };
        const phonePoints: Record<string, number> = {
            'immediately': 25, 'in_bed': 18, 'coffee': 8, 'out_door': 0,
        };
        if (phoneReachTiming) {
            steps.push({
                id: 'phone',
                label: 'Morning phone use',
                icon: Smartphone,
                value: phoneLabels[phoneReachTiming] || 'Unknown',
                points: phonePoints[phoneReachTiming] || 0,
            });
        }

        // Screen before bed
        const screenLabels: Record<string, string> = {
            'always': 'Every night',
            'often': 'Most nights',
            'sometimes': 'Occasionally',
            'rarely': 'Rarely',
        };
        const screenPoints: Record<string, number> = {
            'always': 18, 'often': 12, 'sometimes': 5, 'rarely': 0,
        };
        if (screenBeforeBed) {
            steps.push({
                id: 'screen',
                label: 'Evening screen time',
                icon: Moon,
                value: screenLabels[screenBeforeBed] || 'Unknown',
                points: screenPoints[screenBeforeBed] || 0,
            });
        }

        // Sunlight exposure
        const sunLabels: Record<string, string> = {
            'daily': 'Daily exposure',
            'few_times': 'Few times weekly',
            'once_a_week': 'Once weekly',
            'rarely': 'Rarely',
        };
        const sunPoints: Record<string, number> = {
            'rarely': 18, 'once_a_week': 14, 'few_times': 6, 'daily': 0,
        };
        if (sunlightFrequency) {
            steps.push({
                id: 'sun',
                label: 'Sunlight exposure',
                icon: Sun,
                value: sunLabels[sunlightFrequency] || 'Unknown',
                points: sunPoints[sunlightFrequency] || 0,
            });
        }

        // Morning energy
        const energyLabels: Record<string, string> = {
            'exhausted': 'Exhausted',
            'sluggish': 'Sluggish',
            'okay': 'Functional',
            'energized': 'Energized',
        };
        const energyPoints: Record<string, number> = {
            'exhausted': 17, 'sluggish': 12, 'okay': 5, 'energized': 0,
        };
        if (morningEnergyLevel) {
            steps.push({
                id: 'energy',
                label: 'Energy by 10am',
                icon: Battery,
                value: energyLabels[morningEnergyLevel] || 'Unknown',
                points: energyPoints[morningEnergyLevel] || 0,
            });
        }

        // Brain fog
        const fogLabels: Record<string, string> = {
            'yes': 'Daily fog',
            'most': 'Most days',
            'no': 'Clear headed',
        };
        const fogPoints: Record<string, number> = {
            'yes': 22, 'most': 15, 'no': 0,
        };
        if (brainFogFrequency) {
            steps.push({
                id: 'fog',
                label: 'Brain fog frequency',
                icon: Brain,
                value: fogLabels[brainFogFrequency] || 'Unknown',
                points: fogPoints[brainFogFrequency] || 0,
            });
        }

        return steps;
    }, [phoneReachTiming, screenBeforeBed, sunlightFrequency, morningEnergyLevel, brainFogFrequency]);

    useEffect(() => {
        // Sun pulse animation
        sunOpacity.value = withTiming(1, { duration: 600 });
        sunScale.value = withRepeat(
            withSequence(
                withTiming(1.15, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
                withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
        );

        // Step through each analysis item - slower pace (1 second per step)
        const stepInterval = setInterval(() => {
            setCurrentStep(prev => {
                if (prev < analysisSteps.length - 1) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    return prev + 1;
                }
                return prev;
            });
        }, 1000);

        // Show final score after all steps (wait longer)
        const scoreTimer = setTimeout(() => {
            setShowScore(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            scoreValue.value = withTiming(finalScore, { duration: 1500, easing: Easing.out(Easing.cubic) });
        }, analysisSteps.length * 1000 + 800);

        // Navigate after showing score - give user 3 seconds to read it
        const navTimer = setTimeout(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            flashOpacity.value = withSequence(
                withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }),
                withDelay(100, withTiming(0, { duration: 250 }))
            );
            setTimeout(() => {
                router.replace('/onboarding-diagnosis');
            }, 450);
        }, analysisSteps.length * 1000 + 3800);

        return () => {
            clearInterval(stepInterval);
            clearTimeout(scoreTimer);
            clearTimeout(navTimer);
        };
    }, [analysisSteps.length, finalScore]);

    const sunStyle = useAnimatedStyle(() => ({
        transform: [{ scale: sunScale.value }],
        opacity: sunOpacity.value,
    }));

    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
    }));

    const scoreAnimStyle = useAnimatedStyle(() => ({
        opacity: withTiming(showScore ? 1 : 0, { duration: 400 }),
    }));

    return (
        <View style={{ flex: 1, backgroundColor: '#87CEEB' }}>
            <LinearGradient
                colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFill}
            />

            <View
                style={{
                    flex: 1,
                    paddingTop: insets.top + 20,
                    paddingBottom: insets.bottom + 20,
                    paddingHorizontal: 24,
                }}
            >
                {/* Header */}
                <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
                    <Text style={styles.headerTitle}>Analyzing Your Profile</Text>
                    <Text style={styles.headerSubtitle}>Calculating circadian disruption score</Text>
                </Animated.View>

                {/* Sun Animation - Compact */}
                <View style={styles.sunContainer}>
                    <Animated.View style={[styles.glowRing, sunStyle, { width: 100, height: 100, opacity: 0.15 }]} />
                    <Animated.View style={[styles.glowRing, sunStyle, { width: 70, height: 70, opacity: 0.3 }]} />
                    <Animated.View style={[styles.sunCore, sunStyle]}>
                        <LinearGradient
                            colors={['#FFB347', '#FF8C00']}
                            style={styles.sunGradient}
                        />
                    </Animated.View>
                </View>

                {/* Analysis Steps */}
                <View style={styles.stepsContainer}>
                    {analysisSteps.map((step, index) => {
                        const isActive = index <= currentStep;
                        const IconComponent = step.icon;
                        return (
                            <Animated.View
                                key={step.id}
                                entering={FadeInUp.delay(index * 100).duration(300)}
                                style={[
                                    styles.stepRow,
                                    isActive && styles.stepRowActive,
                                ]}
                            >
                                <View style={[styles.stepIcon, isActive && styles.stepIconActive]}>
                                    {isActive ? (
                                        <Check size={14} color="#22C55E" strokeWidth={3} />
                                    ) : (
                                        <IconComponent size={14} color="#94A3B8" strokeWidth={2} />
                                    )}
                                </View>
                                <View style={styles.stepContent}>
                                    <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                                        {step.label}
                                    </Text>
                                    {isActive && (
                                        <Text style={styles.stepValue}>{step.value}</Text>
                                    )}
                                </View>
                                {isActive && step.points > 0 && (
                                    <Text style={styles.stepPoints}>+{step.points}</Text>
                                )}
                            </Animated.View>
                        );
                    })}
                </View>

                {/* Final Score */}
                <Animated.View style={[styles.scoreContainer, scoreAnimStyle]}>
                    <Text style={styles.scoreLabel}>CIRCADIAN DISRUPTION</Text>
                    <Text style={styles.scoreValue}>{finalScore}%</Text>
                    <Text style={styles.scoreHint}>
                        {finalScore >= 55 ? 'High disruption detected' :
                         finalScore >= 30 ? 'Moderate disruption detected' :
                         'Low disruption detected'}
                    </Text>
                </Animated.View>
            </View>

            {/* White Flash Overlay */}
            <Animated.View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', zIndex: 100 }, flashStyle]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#64748B',
        marginTop: 4,
    },
    sunContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 100,
        marginBottom: 20,
    },
    sunCore: {
        width: 50,
        height: 50,
        borderRadius: 25,
        shadowColor: '#FF8C00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 8,
    },
    sunGradient: {
        flex: 1,
        borderRadius: 25,
    },
    glowRing: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: '#FFB347',
    },
    stepsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 10,
        marginBottom: 2,
    },
    stepRowActive: {
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
    },
    stepIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    stepIconActive: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
    },
    stepContent: {
        flex: 1,
    },
    stepLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#94A3B8',
    },
    stepLabelActive: {
        color: '#1A1A2E',
    },
    stepValue: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#64748B',
        marginTop: 2,
    },
    stepPoints: {
        fontSize: 13,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FF6B6B',
    },
    scoreContainer: {
        alignItems: 'center',
        marginTop: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    scoreLabel: {
        fontSize: 10,
        fontFamily: 'Outfit_700Bold',
        color: '#64748B',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    scoreValue: {
        fontSize: 42,
        fontFamily: 'Outfit_700Bold',
        color: '#FF6B6B',
    },
    scoreHint: {
        fontSize: 13,
        fontFamily: 'Outfit_500Medium',
        color: '#64748B',
        marginTop: 4,
    },
});
