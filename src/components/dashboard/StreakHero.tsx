import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { Flame, Sunrise, AlertTriangle } from 'lucide-react-native';

interface StreakHeroProps {
    currentStreak: number;
    isGoalMetToday: boolean;
    onPress?: () => void;
}

export function StreakHero({ currentStreak, isGoalMetToday, onPress }: StreakHeroProps) {
    const iconScale = useSharedValue(1);

    // Breathing animation for flame
    React.useEffect(() => {
        iconScale.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const iconAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }));

    // Determine messaging based on streak and goal status
    const getMessage = () => {
        const hour = new Date().getHours();

        if (isGoalMetToday) {
            return "Great job today!";
        }

        if (currentStreak === 0) {
            return "Start your first streak";
        }

        if (currentStreak >= 30) {
            return "Incredible dedication!";
        }

        if (currentStreak >= 14) {
            return "Two weeks strong!";
        }

        if (currentStreak >= 7) {
            return "One week strong!";
        }

        // Time-based urgency if goal not met
        if (hour >= 18 && !isGoalMetToday && currentStreak > 0) {
            return "Complete today to keep it!";
        }

        return "Don't break the chain!";
    };

    const getStreakColor = () => {
        if (currentStreak === 0) return '#64748B';
        if (currentStreak >= 30) return '#FF6B35';
        if (currentStreak >= 14) return '#FF8C00';
        if (currentStreak >= 7) return '#FFB347';
        return '#FF8C00';
    };

    const isAtRisk = new Date().getHours() >= 18 && !isGoalMetToday && currentStreak > 0;

    // Zero streak state - minimal, encouraging
    if (currentStreak === 0 && !isGoalMetToday) {
        return (
            <Pressable onPress={onPress} style={styles.container}>
                <View style={styles.row}>
                    <Animated.View style={iconAnimatedStyle}>
                        <Sunrise size={20} color="#FF8C00" strokeWidth={2} />
                    </Animated.View>
                    <Text style={styles.zeroStreakText}>Begin Your Journey</Text>
                    <Text style={styles.separator}>·</Text>
                    <Text style={styles.message}>Complete morning light to start</Text>
                </View>
            </Pressable>
        );
    }

    return (
        <Pressable onPress={onPress} style={styles.container}>
            <View style={styles.row}>
                {/* Flame icon */}
                <Animated.View style={iconAnimatedStyle}>
                    <Flame
                        size={20}
                        color={getStreakColor()}
                        fill={getStreakColor()}
                        strokeWidth={1.5}
                    />
                </Animated.View>

                {/* Streak count */}
                <Text style={[styles.streakNumber, { color: getStreakColor() }]}>
                    {currentStreak}
                </Text>
                <Text style={styles.streakLabel}>Day Streak</Text>

                <Text style={styles.separator}>·</Text>

                {/* Message */}
                {isAtRisk && (
                    <AlertTriangle size={14} color="#FF6B35" style={{ marginRight: 4 }} />
                )}
                <Text style={[styles.message, isAtRisk && styles.urgentMessage]}>
                    {getMessage()}
                </Text>

                {/* Goal met badge */}
                {isGoalMetToday && (
                    <View style={styles.doneBadge}>
                        <Text style={styles.doneBadgeText}>Done</Text>
                    </View>
                )}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    streakNumber: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
    },
    streakLabel: {
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
        color: '#1A1A2E',
    },
    separator: {
        fontSize: 15,
        color: '#94A3B8',
        marginHorizontal: 2,
    },
    message: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#64748B',
    },
    urgentMessage: {
        color: '#FF6B35',
        fontFamily: 'Outfit_500Medium',
    },
    doneBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginLeft: 4,
    },
    doneBadgeText: {
        fontSize: 11,
        fontFamily: 'Outfit_600SemiBold',
        color: '#22C55E',
    },
    // Zero streak styles
    zeroStreakText: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
    },
});
