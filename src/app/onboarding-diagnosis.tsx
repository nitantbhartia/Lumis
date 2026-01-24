import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown,
    FadeInUp,
    FadeIn,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withRepeat,
    withSequence,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, Smartphone, Brain, Sun, ArrowRight, Zap, Moon, Battery, Info, X } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import { LumisHeroButton } from '@/components/ui/LumisHeroButton';

const { height } = Dimensions.get('window');
const isSmallDevice = height < 750;

interface InsightData {
    phoneReach: string | null;
    brainFog: string | null;
    sunlight: string | null;
    screenBeforeBed: string | null;
    morningEnergy: string | null;
}

// Risk calculation based on all user answers
function calculateRiskLevel(data: InsightData): { level: 'high' | 'medium' | 'low'; score: number } {
    let score = 0;

    // Phone reach timing (high impact)
    if (data.phoneReach === 'immediately') score += 25;
    else if (data.phoneReach === 'in_bed') score += 18;
    else if (data.phoneReach === 'coffee') score += 8;
    else if (data.phoneReach === 'out_door') score += 0;

    // Brain fog frequency (high impact)
    if (data.brainFog === 'yes') score += 22;
    else if (data.brainFog === 'most') score += 15;
    else if (data.brainFog === 'no') score += 0;

    // Sunlight exposure (medium impact)
    if (data.sunlight === 'rarely') score += 18;
    else if (data.sunlight === 'once_a_week') score += 14;
    else if (data.sunlight === 'few_times') score += 6;
    else if (data.sunlight === 'daily') score += 0;

    // Screen before bed (medium impact - affects sleep quality)
    if (data.screenBeforeBed === 'always') score += 18;
    else if (data.screenBeforeBed === 'often') score += 12;
    else if (data.screenBeforeBed === 'sometimes') score += 5;
    else if (data.screenBeforeBed === 'rarely') score += 0;

    // Morning energy level (high impact - direct symptom)
    if (data.morningEnergy === 'exhausted') score += 17;
    else if (data.morningEnergy === 'sluggish') score += 12;
    else if (data.morningEnergy === 'okay') score += 5;
    else if (data.morningEnergy === 'energized') score += 0;

    const level = score >= 55 ? 'high' : score >= 30 ? 'medium' : 'low';
    return { level, score };
}

// Insight definition with priority scoring
interface Insight {
    id: string;
    icon: typeof AlertTriangle;
    title: string;
    description: string;
    color: string;
    priority: number; // Higher = more important
}

// Generate personalized insights based on answers - returns top 3
function getPersonalizedInsights(data: InsightData): Insight[] {
    const insights: Insight[] = [];

    // Phone addiction insight
    if (data.phoneReach === 'immediately') {
        insights.push({
            id: 'phone_immediate',
            icon: Smartphone,
            title: 'Dopamine Hijack',
            description: 'Phone within 5 min floods your brain with stress hormones.',
            color: '#FF6B6B',
            priority: 100,
        });
    } else if (data.phoneReach === 'in_bed') {
        insights.push({
            id: 'phone_bed',
            icon: Smartphone,
            title: 'Dopamine Hijack',
            description: 'Scrolling in bed delays your natural wake signal.',
            color: '#FF6B6B',
            priority: 85,
        });
    }

    // Evening screen sabotage
    if (data.screenBeforeBed === 'always') {
        insights.push({
            id: 'screen_always',
            icon: Moon,
            title: 'Evening Sabotage',
            description: 'Screen light before bed suppresses melatonin by up to 50%.',
            color: '#A78BFA',
            priority: 90,
        });
    } else if (data.screenBeforeBed === 'often') {
        insights.push({
            id: 'screen_often',
            icon: Moon,
            title: 'Sleep Disruption',
            description: 'Blue light before bed is delaying your natural sleep onset.',
            color: '#A78BFA',
            priority: 70,
        });
    }

    // Morning energy / delayed activation
    if (data.morningEnergy === 'exhausted') {
        insights.push({
            id: 'energy_exhausted',
            icon: Battery,
            title: 'Delayed Activation',
            description: 'Your cortisol awakening response is severely blunted.',
            color: '#FF6B6B',
            priority: 95,
        });
    } else if (data.morningEnergy === 'sluggish') {
        insights.push({
            id: 'energy_sluggish',
            icon: Battery,
            title: 'Slow Start',
            description: 'Your natural energy surge isn\'t kicking in on time.',
            color: '#F59E0B',
            priority: 65,
        });
    }

    // Brain fog / cortisol flatline
    if (data.brainFog === 'yes') {
        insights.push({
            id: 'fog_yes',
            icon: Brain,
            title: 'Cortisol Flatline',
            description: 'Without morning light, your energy rhythm stays flat all day.',
            color: '#FF6B6B',
            priority: 88,
        });
    } else if (data.brainFog === 'most') {
        insights.push({
            id: 'fog_most',
            icon: Brain,
            title: 'Energy Dips',
            description: 'Inconsistent light exposure creates unpredictable energy crashes.',
            color: '#F59E0B',
            priority: 60,
        });
    }

    // Sunlight deficiency
    if (data.sunlight === 'rarely') {
        insights.push({
            id: 'sun_rarely',
            icon: Sun,
            title: 'Light Starved',
            description: 'Your circadian clock is running without its primary input.',
            color: '#FF6B6B',
            priority: 80,
        });
    } else if (data.sunlight === 'once_a_week' || data.sunlight === 'few_times') {
        insights.push({
            id: 'sun_inconsistent',
            icon: Sun,
            title: 'Inconsistent Light',
            description: 'Your circadian clock needs daily light to stay calibrated.',
            color: '#F59E0B',
            priority: 50,
        });
    }

    // Sort by priority and return top 3
    return insights
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3);
}

// Score breakdown component for info modal
function ScoreBreakdown({ data, score }: { data: InsightData; score: number }) {
    const getPhoneScore = () => {
        if (data.phoneReach === 'immediately') return { label: 'Phone immediately', points: 25 };
        if (data.phoneReach === 'in_bed') return { label: 'Phone in bed', points: 18 };
        if (data.phoneReach === 'coffee') return { label: 'Phone with coffee', points: 8 };
        return { label: 'Phone after going outside', points: 0 };
    };

    const getBrainFogScore = () => {
        if (data.brainFog === 'yes') return { label: 'Brain fog daily', points: 22 };
        if (data.brainFog === 'most') return { label: 'Brain fog most days', points: 15 };
        return { label: 'No brain fog', points: 0 };
    };

    const getSunlightScore = () => {
        if (data.sunlight === 'rarely') return { label: 'Rarely get sunlight', points: 18 };
        if (data.sunlight === 'once_a_week') return { label: 'Sunlight once a week', points: 14 };
        if (data.sunlight === 'few_times') return { label: 'Sunlight few times/week', points: 6 };
        return { label: 'Daily sunlight', points: 0 };
    };

    const getScreenScore = () => {
        if (data.screenBeforeBed === 'always') return { label: 'Screens always before bed', points: 18 };
        if (data.screenBeforeBed === 'often') return { label: 'Screens often before bed', points: 12 };
        if (data.screenBeforeBed === 'sometimes') return { label: 'Screens sometimes before bed', points: 5 };
        return { label: 'Rarely screens before bed', points: 0 };
    };

    const getEnergyScore = () => {
        if (data.morningEnergy === 'exhausted') return { label: 'Exhausted by 10am', points: 17 };
        if (data.morningEnergy === 'sluggish') return { label: 'Sluggish by 10am', points: 12 };
        if (data.morningEnergy === 'okay') return { label: 'Okay by 10am', points: 5 };
        return { label: 'Energized by 10am', points: 0 };
    };

    const factors = [
        getPhoneScore(),
        getBrainFogScore(),
        getSunlightScore(),
        getScreenScore(),
        getEnergyScore(),
    ].filter(f => f.points > 0);

    return (
        <View style={modalStyles.breakdownContainer}>
            <Text style={modalStyles.breakdownTitle}>Your Score Breakdown</Text>
            {factors.map((factor, index) => (
                <View key={index} style={modalStyles.factorRow}>
                    <Text style={modalStyles.factorLabel}>{factor.label}</Text>
                    <Text style={modalStyles.factorPoints}>+{factor.points}</Text>
                </View>
            ))}
            <View style={modalStyles.totalRow}>
                <Text style={modalStyles.totalLabel}>Total Score</Text>
                <Text style={modalStyles.totalPoints}>{score}%</Text>
            </View>
            <Text style={modalStyles.scaleNote}>
                0-29% = Low Risk{'\n'}
                30-54% = Moderate Risk{'\n'}
                55%+ = High Risk
            </Text>
        </View>
    );
}

export default function OnboardingDiagnosisScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [showInfoModal, setShowInfoModal] = useState(false);

    // Get user answers from store
    const phoneReachTiming = useLumisStore((s) => s.phoneReachTiming);
    const brainFogFrequency = useLumisStore((s) => s.brainFogFrequency);
    const sunlightFrequency = useLumisStore((s) => s.sunlightFrequency);
    const screenBeforeBed = useLumisStore((s) => s.screenBeforeBed);
    const morningEnergyLevel = useLumisStore((s) => s.morningEnergyLevel);
    const scheduledWakeTime = useLumisStore((s) => s.scheduledWakeTime);

    // Combine all data for calculations
    const insightData: InsightData = useMemo(() => ({
        phoneReach: phoneReachTiming,
        brainFog: brainFogFrequency,
        sunlight: sunlightFrequency,
        screenBeforeBed: screenBeforeBed,
        morningEnergy: morningEnergyLevel,
    }), [phoneReachTiming, brainFogFrequency, sunlightFrequency, screenBeforeBed, morningEnergyLevel]);

    // Calculate risk and insights
    const risk = useMemo(
        () => calculateRiskLevel(insightData),
        [insightData]
    );

    const insights = useMemo(
        () => getPersonalizedInsights(insightData),
        [insightData]
    );

    // Animations
    const riskMeterProgress = useSharedValue(0);
    const pulseValue = useSharedValue(0);

    useEffect(() => {
        // Animate risk meter filling up
        riskMeterProgress.value = withDelay(
            500,
            withTiming(risk.score / 100, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        );

        // Pulse animation for high risk
        if (risk.level === 'high') {
            pulseValue.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1000 }),
                    withTiming(0, { duration: 1000 })
                ),
                -1,
                true
            );
        }
    }, [risk]);

    const riskMeterStyle = useAnimatedStyle(() => ({
        width: `${riskMeterProgress.value * 100}%`,
    }));

    const pulseStyle = useAnimatedStyle(() => ({
        opacity: interpolate(pulseValue.value, [0, 1], [0.3, 0.6]),
        transform: [{ scale: interpolate(pulseValue.value, [0, 1], [1, 1.02]) }],
    }));

    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        router.push('/onboarding-commitment');
    };

    // Risk level text and colors
    const riskConfig = {
        high: {
            label: 'High Risk',
            sublabel: 'Your mornings are working against you',
            color: '#FF6B6B',
            bgColor: 'rgba(255, 107, 107, 0.15)',
        },
        medium: {
            label: 'Moderate Risk',
            sublabel: 'Room for improvement',
            color: '#F59E0B',
            bgColor: 'rgba(245, 158, 11, 0.15)',
        },
        low: {
            label: 'Low Risk',
            sublabel: 'Good foundation, let\'s optimize',
            color: '#22C55E',
            bgColor: 'rgba(34, 197, 94, 0.15)',
        },
    };

    const config = riskConfig[risk.level];

    // Get headline based on risk
    const getHeadline = () => {
        if (risk.level === 'high') return 'We Found\nThe Problem.';
        if (risk.level === 'medium') return 'We See\nThe Pattern.';
        return 'Let\'s\nOptimize.';
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#0F0F1A' }}>
            <LinearGradient
                colors={['#0F0F1A', '#1A1A2E', '#2D2D44']}
                style={StyleSheet.absoluteFill}
            />

            <View
                style={{
                    flex: 1,
                    paddingTop: insets.top + 16,
                    paddingBottom: insets.bottom + 24,
                    paddingHorizontal: 24,
                    justifyContent: 'space-between',
                }}
            >
                {/* Top Section */}
                <View>
                    {/* Header */}
                    <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.headerSection}>
                        <View style={[styles.alertBadge, { backgroundColor: config.bgColor }]}>
                            <AlertTriangle size={14} color={config.color} />
                            <Text style={[styles.alertBadgeText, { color: config.color }]}>
                                {config.label}
                            </Text>
                        </View>

                        <Text style={styles.headline}>{getHeadline()}</Text>
                        <Text style={styles.subheadline}>{config.sublabel}</Text>
                    </Animated.View>

                    {/* Risk Meter */}
                    <Animated.View
                        entering={FadeInDown.delay(300).duration(600)}
                        style={styles.riskMeterContainer}
                    >
                        <View style={styles.riskMeterHeader}>
                            <View style={styles.riskMeterLabelRow}>
                                <Text style={styles.riskMeterLabel}>CIRCADIAN DISRUPTION</Text>
                                <Pressable
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setShowInfoModal(true);
                                    }}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Info size={14} color="rgba(255, 255, 255, 0.5)" />
                                </Pressable>
                            </View>
                            <Text style={[styles.riskMeterScore, { color: config.color }]}>
                                {risk.score}%
                            </Text>
                        </View>
                        <View style={styles.riskMeterTrack}>
                            <Animated.View style={[styles.riskMeterFill, riskMeterStyle]}>
                                <LinearGradient
                                    colors={['#22C55E', '#F59E0B', '#FF6B6B']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFill}
                                />
                            </Animated.View>
                        </View>
                    </Animated.View>

                    {/* Personalized Insights - Compact */}
                    <Animated.View
                        entering={FadeInDown.delay(500).duration(600)}
                        style={styles.insightsContainer}
                    >
                        <Text style={styles.insightsTitle}>Based on your answers:</Text>
                        {insights.map((insight, index) => {
                            const IconComponent = insight.icon;
                            return (
                                <Animated.View
                                    key={insight.id}
                                    entering={FadeInDown.delay(600 + index * 80).duration(350)}
                                    style={styles.insightCard}
                                >
                                    <View style={[styles.insightIconContainer, { backgroundColor: `${insight.color}20` }]}>
                                        <IconComponent size={16} color={insight.color} strokeWidth={2} />
                                    </View>
                                    <View style={styles.insightContent}>
                                        <Text style={[styles.insightTitle, { color: insight.color }]}>
                                            {insight.title}
                                        </Text>
                                        <Text style={styles.insightDescription}>
                                            {insight.description}
                                        </Text>
                                    </View>
                                </Animated.View>
                            );
                        })}
                    </Animated.View>
                </View>

                {/* Bottom Section */}
                <View>
                    {/* The Solution Teaser */}
                    <Animated.View
                        entering={FadeInUp.delay(800).duration(600)}
                        style={styles.solutionContainer}
                    >
                        <View style={styles.solutionHeader}>
                            <Zap size={16} color="#FFB347" fill="#FFB347" />
                            <Text style={styles.solutionLabel}>THE FIX</Text>
                        </View>
                        <Text style={styles.solutionText}>
                            {scheduledWakeTime
                                ? `Morning outdoor light after ${scheduledWakeTime} resets your rhythm.`
                                : 'Morning outdoor light each day resets your rhythm.'
                            }
                        </Text>
                    </Animated.View>

                    {/* CTA */}
                    <Animated.View entering={FadeInUp.delay(1000).duration(600)}>
                        <LumisHeroButton
                            title="I'm Ready to Fix This"
                            onPress={handleContinue}
                            icon={<ArrowRight size={20} color="#1A1A2E" strokeWidth={2.5} />}
                        />
                    </Animated.View>
                </View>
            </View>

            {/* Info Modal */}
            <Modal
                visible={showInfoModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowInfoModal(false)}
            >
                <Pressable
                    style={modalStyles.overlay}
                    onPress={() => setShowInfoModal(false)}
                >
                    <Animated.View
                        entering={FadeIn.duration(200)}
                        style={modalStyles.container}
                    >
                        <Pressable onPress={(e) => e.stopPropagation()}>
                            <View style={modalStyles.content}>
                                <View style={modalStyles.header}>
                                    <Text style={modalStyles.title}>How We Calculate Your Score</Text>
                                    <Pressable
                                        onPress={() => setShowInfoModal(false)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <X size={20} color="#64748B" />
                                    </Pressable>
                                </View>
                                <Text style={modalStyles.description}>
                                    Your Circadian Disruption Score is based on your answers about morning habits, screen time, and energy levels. Higher scores indicate more disruption to your natural rhythm.
                                </Text>
                                <ScoreBreakdown data={insightData} score={risk.score} />
                            </View>
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    headerSection: {
        alignItems: 'center',
        marginBottom: isSmallDevice ? 12 : 16,
    },
    alertBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 5,
        marginBottom: 12,
    },
    alertBadgeText: {
        fontSize: 11,
        fontFamily: 'Outfit_700Bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headline: {
        fontSize: isSmallDevice ? 28 : 36,
        fontFamily: 'Outfit_700Bold',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: isSmallDevice ? 34 : 44,
    },
    subheadline: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        marginTop: 6,
    },
    riskMeterContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
        marginBottom: isSmallDevice ? 12 : 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    riskMeterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    riskMeterLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    riskMeterLabel: {
        fontSize: 9,
        fontFamily: 'Outfit_700Bold',
        color: 'rgba(255, 255, 255, 0.5)',
        letterSpacing: 1.5,
    },
    riskMeterScore: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
    },
    riskMeterTrack: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    riskMeterFill: {
        height: '100%',
        borderRadius: 3,
        overflow: 'hidden',
    },
    insightsContainer: {
        marginBottom: isSmallDevice ? 0 : 4,
    },
    insightsTitle: {
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 8,
    },
    insightCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: isSmallDevice ? 10 : 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    insightIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    insightContent: {
        flex: 1,
    },
    insightTitle: {
        fontSize: 13,
        fontFamily: 'Outfit_700Bold',
        marginBottom: 1,
    },
    insightDescription: {
        fontSize: 11,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: 15,
    },
    solutionContainer: {
        backgroundColor: 'rgba(255, 179, 71, 0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 179, 71, 0.2)',
    },
    solutionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    solutionLabel: {
        fontSize: 10,
        fontFamily: 'Outfit_700Bold',
        color: '#FFB347',
        letterSpacing: 1.5,
    },
    solutionText: {
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
        color: '#FFFFFF',
        lineHeight: 22,
    },
});

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 360,
    },
    content: {
        backgroundColor: '#1A1A2E',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#FFFFFF',
    },
    description: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 20,
        marginBottom: 20,
    },
    breakdownContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
    },
    breakdownTitle: {
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    factorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    factorLabel: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255, 255, 255, 0.8)',
        flex: 1,
    },
    factorPoints: {
        fontSize: 13,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FF6B6B',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
    },
    totalPoints: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#FF8C00',
    },
    scaleNote: {
        fontSize: 11,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 16,
        textAlign: 'center',
        lineHeight: 18,
    },
});
