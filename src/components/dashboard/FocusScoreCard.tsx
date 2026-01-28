import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Target, Sun, AlertTriangle, TrendingDown, ChevronRight } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLumisStore } from '@/lib/state/lumis-store';
import { getFocusScore, getAvgDistractingMinutes } from '@/lib/screen-time';

interface FocusScoreCardProps {
    isDarkMode?: boolean;
}

export function FocusScoreCard({ isDarkMode = false }: FocusScoreCardProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [showTimeSaved, setShowTimeSaved] = useState(false);

    const focusScore = useLumisStore((s) => s.focusScore);
    const focusScoreTimestamp = useLumisStore((s) => s.focusScoreTimestamp);
    const distractingMinutes = useLumisStore((s) => s.distractingMinutesToday);
    const sunlightBonus = useLumisStore((s) => s.focusSunlightBonusApplied);
    const focusRatio = useLumisStore((s) => s.focusRatio);
    const penaltyDeductions = useLumisStore((s) => s.focusPenaltyDeductions);
    const updateFocusScore = useLumisStore((s) => s.updateFocusScore);

    // Fetch focus score on mount and poll every 30 seconds
    useEffect(() => {
        const fetchScore = () => {
            try {
                const data = getFocusScore();
                if (data.timestamp) {
                    updateFocusScore({
                        score: data.score,
                        timestamp: data.timestamp,
                        distractingMinutes: data.distractingMinutes,
                        sunlightBonusApplied: data.sunlightBonusApplied,
                        focusRatio: data.focusRatio,
                        penaltyDeductions: data.penaltyDeductions,
                    });

                    // Check for Time Saved badge
                    const avgMinutes = getAvgDistractingMinutes();
                    if (avgMinutes > 0 && data.distractingMinutes < avgMinutes * 0.8) {
                        setShowTimeSaved(true);
                    }
                }
            } catch (e) {
                console.log('[FocusScoreCard] Error fetching score:', e);
            }
            setIsLoading(false);
        };

        fetchScore();
        const interval = setInterval(fetchScore, 30000);
        return () => clearInterval(interval);
    }, []);

    // Check if score is from today
    const isScoreFromToday = () => {
        if (!focusScoreTimestamp) return false;
        const scoreDate = new Date(focusScoreTimestamp).toDateString();
        const today = new Date().toDateString();
        return scoreDate === today;
    };

    if (isLoading) {
        return (
            <View style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}>
                <ActivityIndicator color="#FF6B35" />
            </View>
        );
    }

    // Don't show card if no score yet today
    if (!focusScoreTimestamp || !isScoreFromToday()) {
        return null;
    }

    const scoreColor = getScoreColor(focusScore);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/focus-analytics');
    };

    return (
        <Pressable onPress={handlePress}>
            <Animated.View
                entering={FadeIn.duration(400)}
                style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Target size={18} color={scoreColor} strokeWidth={2.5} />
                        <Text style={[styles.title, isDarkMode && styles.textLight]}>
                            Morning Focus
                        </Text>
                    </View>

                    <View style={styles.headerRight}>
                        <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}20` }]}>
                            <Text style={[styles.scoreText, { color: scoreColor }]}>
                                {focusScore}
                            </Text>
                        </View>
                        <ChevronRight size={18} color={isDarkMode ? 'rgba(255,255,255,0.4)' : '#999'} />
                    </View>
                </View>

            {/* Breakdown */}
            <View style={styles.breakdown}>
                {/* Focus Ratio */}
                <View style={styles.breakdownItem}>
                    <Text style={[styles.breakdownLabel, isDarkMode && styles.textSecondary]}>
                        Focus Ratio
                    </Text>
                    <Text style={[styles.breakdownValue, isDarkMode && styles.textLight]}>
                        {Math.round(focusRatio * 100)}%
                    </Text>
                </View>

                {/* Distracting Apps */}
                <View style={styles.breakdownItem}>
                    <Text style={[styles.breakdownLabel, isDarkMode && styles.textSecondary]}>
                        Distracting Apps
                    </Text>
                    <Text style={[
                        styles.breakdownValue,
                        distractingMinutes > 15 ? styles.valueWarning : null,
                        isDarkMode && styles.textLight
                    ]}>
                        {distractingMinutes} min
                    </Text>
                </View>
            </View>

            {/* Second Row */}
            <View style={styles.breakdown}>
                {/* Sunlight Bonus */}
                <View style={styles.breakdownItem}>
                    <View style={styles.bonusRow}>
                        <Sun
                            size={14}
                            color={sunlightBonus ? '#F59E0B' : isDarkMode ? 'rgba(255,255,255,0.4)' : '#999'}
                            fill={sunlightBonus ? '#F59E0B' : 'transparent'}
                        />
                        <Text style={[styles.breakdownLabel, isDarkMode && styles.textSecondary]}>
                            Sunlight Bonus
                        </Text>
                    </View>
                    <Text
                        style={[
                            styles.breakdownValue,
                            sunlightBonus ? styles.bonusActive : styles.bonusInactive,
                            isDarkMode && !sunlightBonus && styles.textSecondary,
                        ]}
                    >
                        {sunlightBonus ? 'Active' : 'Not earned'}
                    </Text>
                </View>

                {/* Penalties (only show if any) */}
                {penaltyDeductions > 0 && (
                    <View style={styles.breakdownItem}>
                        <View style={styles.bonusRow}>
                            <AlertTriangle size={14} color="#EF4444" />
                            <Text style={[styles.breakdownLabel, isDarkMode && styles.textSecondary]}>
                                Penalties
                            </Text>
                        </View>
                        <Text style={[styles.breakdownValue, styles.valuePenalty]}>
                            -{penaltyDeductions} pts
                        </Text>
                    </View>
                )}
            </View>

            {/* Time Saved Badge */}
            {showTimeSaved && (
                <View style={styles.timeSavedBadge}>
                    <TrendingDown size={14} color="#22C55E" />
                    <Text style={styles.timeSavedText}>
                        20% less than your average
                    </Text>
                </View>
            )}

            {/* Score Label */}
            {focusScore >= 80 && (
                <View style={styles.successBadge}>
                    <Text style={styles.successText}>
                        {getScoreLabel(focusScore)}
                    </Text>
                </View>
            )}
            </Animated.View>
        </Pressable>
    );
}

function getScoreColor(score: number): string {
    if (score >= 80) return '#22C55E'; // Green
    if (score >= 50) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
}

function getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent Focus!';
    if (score >= 80) return 'Great Job!';
    if (score >= 60) return 'Good Effort';
    if (score >= 40) return 'Room to Improve';
    return 'Let\'s Do Better';
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    cardLight: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
    },
    cardDark: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
    },
    textLight: {
        color: '#FFFFFF',
    },
    textSecondary: {
        color: 'rgba(255, 255, 255, 0.6)',
    },
    scoreBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    scoreText: {
        fontSize: 20,
        fontFamily: 'Outfit_800ExtraBold',
    },
    breakdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    breakdownItem: {
        flex: 1,
    },
    breakdownLabel: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#666',
        marginBottom: 4,
    },
    breakdownValue: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
    },
    valueWarning: {
        color: '#F59E0B',
    },
    valuePenalty: {
        color: '#EF4444',
    },
    bonusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    bonusActive: {
        color: '#F59E0B',
    },
    bonusInactive: {
        color: '#999',
    },
    timeSavedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 4,
        paddingVertical: 8,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: 8,
    },
    timeSavedText: {
        fontSize: 13,
        fontFamily: 'Outfit_500Medium',
        color: '#22C55E',
    },
    successBadge: {
        marginTop: 4,
        alignItems: 'center',
    },
    successText: {
        fontSize: 13,
        fontFamily: 'Outfit_600SemiBold',
        color: '#22C55E',
    },
});
