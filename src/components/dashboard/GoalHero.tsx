import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
    FadeIn,
} from 'react-native-reanimated';
import { Cloud, Sun, Flame, Zap } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface GoalHeroProps {
    goalMinutes: number;
    todayMinutes: number;
    isAdjusted: boolean;
    weatherCondition?: string;
    missionTitle?: string;
    missionMessage?: string;
}

export function GoalHero({
    goalMinutes,
    todayMinutes,
    isAdjusted,
    weatherCondition,
    missionTitle,
    missionMessage,
}: GoalHeroProps) {
    const remainingMinutes = Math.max(0, goalMinutes - todayMinutes);
    const progress = Math.min(todayMinutes / goalMinutes, 1);
    const hasProgress = todayMinutes > 0;
    const isComplete = todayMinutes >= goalMinutes;

    // Subtle breathing animation for the number
    const breathe = useSharedValue(1);
    React.useEffect(() => {
        breathe.value = withRepeat(
            withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const breatheStyle = useAnimatedStyle(() => ({
        transform: [{ scale: breathe.value }],
    }));

    // Get mission icon based on title
    const getMissionIcon = () => {
        if (!missionTitle) return <Cloud size={14} color="#FF8C00" />;
        const title = missionTitle.toLowerCase();
        if (title.includes('streak')) return <Flame size={14} color="#FF6B35" />;
        if (title.includes('clear') || title.includes('sprint')) return <Sun size={14} color="#FFB347" />;
        if (title.includes('cloud') || title.includes('anchor')) return <Cloud size={14} color="#64748B" />;
        return <Zap size={14} color="#FF8C00" />;
    };

    if (isComplete) {
        return (
            <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
                <Text style={styles.completeEmoji}>✓</Text>
                <Text style={styles.completeTitle}>Goal Complete</Text>
                <Text style={styles.completeSubtitle}>
                    {Math.round(todayMinutes)} minutes of light today
                </Text>
            </Animated.View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Mission Card */}
            <View style={styles.missionCard}>
                {/* Mission Header */}
                {missionTitle && (
                    <View style={styles.missionHeader}>
                        {getMissionIcon()}
                        <Text style={styles.missionTitle}>{missionTitle.toUpperCase()}</Text>
                    </View>
                )}

                {/* Large Goal Number */}
                <Animated.View style={breatheStyle}>
                    <Text style={styles.goalNumber}>
                        {Math.round(hasProgress ? remainingMinutes : goalMinutes)}
                    </Text>
                </Animated.View>

                {/* Subtitle */}
                <Text style={styles.subtitle}>
                    {hasProgress ? 'minutes remaining' : 'minutes of outdoor light'}
                </Text>

                {/* Progress bar (only if partial progress) */}
                {hasProgress && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressTrack}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    { width: `${progress * 100}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {Math.round(todayMinutes)} / {Math.round(goalMinutes)} min
                        </Text>
                    </View>
                )}

                {/* Mission Message (why this goal) */}
                {missionMessage && !hasProgress && (
                    <Text style={styles.missionMessage}>
                        {missionMessage}
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    missionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 24,
        paddingVertical: 24,
        paddingHorizontal: 28,
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    missionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    missionTitle: {
        fontSize: 11,
        fontFamily: 'Outfit_700Bold',
        color: '#64748B',
        letterSpacing: 1.5,
    },
    goalNumber: {
        fontSize: 72,
        fontFamily: 'Outfit_700Bold',
        color: '#FF8C00',
        lineHeight: 80,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 17,
        fontFamily: 'Outfit_500Medium',
        color: '#1A1A2E',
        marginTop: 2,
        textAlign: 'center',
    },
    missionMessage: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#64748B',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 20,
        paddingHorizontal: 8,
    },
    progressContainer: {
        width: '100%',
        maxWidth: 260,
        marginTop: 20,
        alignItems: 'center',
    },
    progressTrack: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FF8C00',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 13,
        fontFamily: 'Outfit_500Medium',
        color: '#64748B',
        marginTop: 8,
    },
    // Complete state
    completeEmoji: {
        fontSize: 48,
        color: '#22C55E',
        marginBottom: 8,
    },
    completeTitle: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: '#22C55E',
    },
    completeSubtitle: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        color: '#64748B',
        marginTop: 4,
    },
});
