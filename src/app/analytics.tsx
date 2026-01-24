import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Sun, Flame, TrendingUp, Shield, Calendar, Clock, Trophy, Info, ChevronLeft, ChevronRight, X, HelpCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useLumisStore } from '@/lib/state/lumis-store';
import CalendarModal from '../components/CalendarModal';

const { width } = Dimensions.get('window');

// --- Stat Explanations ---
const STAT_INFO: Record<string, { title: string; description: string; calculation: string }> = {
    streak: {
        title: 'Current Streak',
        description: 'Consecutive days you\'ve met your morning light goal.',
        calculation: 'Resets to 0 if you miss a day. Build consistency to strengthen your circadian rhythm.',
    },
    luxVolume: {
        title: 'Lux Volume',
        description: 'Total light exposure accumulated over all sessions.',
        calculation: 'Calculated as: (Average Lux × Hours) summed across all activities. Higher is better for circadian health.',
    },
    consistency: {
        title: 'Consistency Score',
        description: 'How consistently you get light at the same time each day.',
        calculation: 'Based on deviation from your target anchor time (7:15 AM). Smaller deviation = higher score.',
    },
    tracked: {
        title: 'Days Tracked',
        description: 'Total number of days you\'ve logged light exposure.',
        calculation: 'Counts every day with at least one recorded activity session.',
    },
    shield: {
        title: 'Shield Days',
        description: 'Days without using emergency unlock.',
        calculation: 'Resets when you use emergency unlock. Shows your willpower strength.',
    },
    anchor: {
        title: 'Anchor Time',
        description: 'Your target morning light time.',
        calculation: 'Set in your wake window settings. Aim to get light within 30 min of this time.',
    },
    goal: {
        title: 'Goal Rate',
        description: 'Percentage of days you\'ve met your daily light goal.',
        calculation: 'Calculated as: (Days Completed ÷ Days Tracked) × 100%',
    },
};

// --- Helpers ---
const TARGET_ANCHOR_HOUR = 7;
const TARGET_ANCHOR_MINUTE = 15;

const calculateCircadianConsistency = (history: any[]) => {
    if (!history || history.length === 0) return 0;

    const recentSessions = history.slice(0, 7);
    let totalDeviation = 0;
    let sessionCount = 0;

    recentSessions.forEach(session => {
        if (!session.startTime) return;
        const date = new Date(session.startTime);
        const hour = date.getHours();
        const minute = date.getMinutes();

        const sessionMinutes = hour * 60 + minute;
        const targetMinutes = TARGET_ANCHOR_HOUR * 60 + TARGET_ANCHOR_MINUTE;

        const deviation = Math.abs(sessionMinutes - targetMinutes);
        totalDeviation += deviation;
        sessionCount++;
    });

    if (sessionCount === 0) return 0;

    const avgDeviation = totalDeviation / sessionCount;
    return Math.max(0, Math.round(100 - (avgDeviation / 2)));
};

const calculateLuxVolume = (history: any[]) => {
    let totalLuxSeconds = 0;
    history.forEach(session => {
        const lux = session.lux || 0;
        const seconds = session.durationSeconds || 0;
        totalLuxSeconds += (lux * seconds);
    });

    const kLxh = totalLuxSeconds / 3600 / 1000;
    return Math.round(kLxh * 10) / 10;
};

const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}`;
};

// Info Modal Component
interface InfoModalProps {
    visible: boolean;
    onClose: () => void;
    statKey: string | null;
}

const InfoModal = ({ visible, onClose, statKey }: InfoModalProps) => {
    const insets = useSafeAreaInsets();
    const info = statKey ? STAT_INFO[statKey] : null;

    if (!info) return null;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={[styles.modalContent, { marginBottom: insets.bottom + 20 }]}>
                    <View style={styles.modalHeader}>
                        <View style={styles.modalIconWrap}>
                            <HelpCircle size={20} color="#FF8C00" />
                        </View>
                        <Text style={styles.modalTitle}>{info.title}</Text>
                        <Pressable onPress={onClose} style={styles.modalClose}>
                            <X size={20} color="#999" />
                        </Pressable>
                    </View>
                    <Text style={styles.modalDescription}>{info.description}</Text>
                    <View style={styles.modalCalculation}>
                        <Text style={styles.modalCalcLabel}>How it's calculated:</Text>
                        <Text style={styles.modalCalcText}>{info.calculation}</Text>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default function AnalyticsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [showCalendar, setShowCalendar] = useState(false);
    const [infoModalKey, setInfoModalKey] = useState<string | null>(null);

    const showInfo = (key: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setInfoModalKey(key);
    };

    // Store data
    const currentStreak = useLumisStore((s) => s.currentStreak);
    const longestStreak = useLumisStore((s) => s.longestStreak);
    const activityHistory = useLumisStore((s) => s.activityHistory);
    const progressHistory = useLumisStore((s) => s.progressHistory);
    const daysWithoutEmergencyUnlock = useLumisStore((s) => s.daysWithoutEmergencyUnlock);
    const wakeWindowStart = useLumisStore((s) => s.wakeWindowStart);
    const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);
    const lastCompletedSession = useLumisStore((s) => s.lastCompletedSession);

    // Derived metrics
    const consistency = useMemo(() => calculateCircadianConsistency(activityHistory), [activityHistory]);
    const luxVolume = useMemo(() => calculateLuxVolume(activityHistory), [activityHistory]);
    const totalDaysTracked = progressHistory.length || 1;
    const daysGoalMet = progressHistory.filter(p => p.completed).length;
    const goalRate = Math.round((daysGoalMet / totalDaysTracked) * 100);
    const anchorTime = formatTime(wakeWindowStart);

    // Insight logic
    const insightText = useMemo(() => {
        if (consistency < 50) return "Anchor 20 min earlier to reset your rhythm.";
        if (consistency < 80) return "Building momentum. Hit your target 3 days in a row.";
        return "Your clock is synced. Keep this morning anchor.";
    }, [consistency]);

    // Weekly chart data
    const weekData = useMemo(() => {
        const days = [];
        const today = new Date();
        const currentDay = today.getDay();
        const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - daysToMonday);

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            const isFuture = date > today;
            const isToday = dateStr === today.toISOString().split('T')[0];

            const historyEntry = progressHistory.find(p => p.date === dateStr);

            days.push({
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
                minutes: historyEntry?.lightMinutes || 0,
                completed: historyEntry?.completed || false,
                isFuture,
                isToday,
            });
        }
        return days;
    }, [progressHistory]);

    const maxChartMinutes = Math.max(dailyGoalMinutes, ...weekData.map(d => d.minutes));

    return (
        <View style={{ flex: 1, backgroundColor: '#FFF' }}>
            <LinearGradient
                colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFill}
            />

            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        style={styles.backButton}
                    >
                        <ChevronLeft size={24} color="#1A1A2E" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Biological Insights</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Streak Hero - Compact */}
                    <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.streakHero}>
                        <Pressable onPress={() => showInfo('streak')} style={styles.infoButton}>
                            <HelpCircle size={14} color="#AAA" />
                        </Pressable>
                        <View style={styles.streakHeader}>
                            <Flame size={14} color="#FF6B35" />
                            <Text style={styles.streakLabel}>CURRENT STREAK</Text>
                        </View>
                        <View style={styles.streakRow}>
                            <Text style={styles.streakNumber}>{currentStreak}</Text>
                            <Text style={styles.streakUnit}>days</Text>
                        </View>
                        <Text style={styles.longestStreak}>Longest: {longestStreak} days</Text>
                    </Animated.View>

                    {/* Twin Metrics Row */}
                    <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.twinRow}>
                        <Pressable style={styles.twinMetric} onPress={() => showInfo('luxVolume')}>
                            <View style={styles.metricIconWrap}>
                                <Sun size={18} color="#FFB347" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.twinValue}>
                                    {luxVolume}<Text style={styles.twinUnit}> kLx-h</Text>
                                </Text>
                                <Text style={styles.twinLabel}>LUX VOLUME</Text>
                            </View>
                            <HelpCircle size={12} color="#CCC" />
                        </Pressable>

                        <Pressable style={styles.twinMetric} onPress={() => showInfo('consistency')}>
                            <View style={styles.metricIconWrap}>
                                <TrendingUp size={18} color="#4CAF50" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.twinValue}>
                                    {consistency}<Text style={styles.twinUnit}>%</Text>
                                </Text>
                                <Text style={styles.twinLabel}>CONSISTENCY</Text>
                            </View>
                            <HelpCircle size={12} color="#CCC" />
                        </Pressable>
                    </Animated.View>

                    {/* Secondary Grid (4 columns) */}
                    <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.grid}>
                        <Pressable style={styles.gridItem} onPress={() => showInfo('tracked')}>
                            <Calendar size={14} color="#64748B" />
                            <Text style={styles.gridValue}>{totalDaysTracked}</Text>
                            <View style={styles.gridLabelRow}>
                                <Text style={styles.gridLabel}>TRACKED</Text>
                                <HelpCircle size={8} color="#CCC" />
                            </View>
                        </Pressable>
                        <Pressable style={styles.gridItem} onPress={() => showInfo('shield')}>
                            <Shield size={14} color="#64748B" />
                            <Text style={styles.gridValue}>{daysWithoutEmergencyUnlock}</Text>
                            <View style={styles.gridLabelRow}>
                                <Text style={styles.gridLabel}>SHIELD</Text>
                                <HelpCircle size={8} color="#CCC" />
                            </View>
                        </Pressable>
                        <Pressable style={styles.gridItem} onPress={() => showInfo('anchor')}>
                            <Clock size={14} color="#64748B" />
                            <Text style={styles.gridValue}>{anchorTime}</Text>
                            <View style={styles.gridLabelRow}>
                                <Text style={styles.gridLabel}>ANCHOR</Text>
                                <HelpCircle size={8} color="#CCC" />
                            </View>
                        </Pressable>
                        <Pressable style={styles.gridItem} onPress={() => showInfo('goal')}>
                            <Trophy size={14} color="#64748B" />
                            <Text style={styles.gridValue}>{goalRate}%</Text>
                            <View style={styles.gridLabelRow}>
                                <Text style={styles.gridLabel}>GOAL</Text>
                                <HelpCircle size={8} color="#CCC" />
                            </View>
                        </Pressable>
                    </Animated.View>

                    {/* Weekly Chart - Taller */}
                    <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.chartCard}>
                        <Text style={styles.chartTitle}>This Week</Text>

                        <View style={styles.chartContainer}>
                            {/* Goal line */}
                            <View style={[styles.goalLine, { bottom: `${(dailyGoalMinutes / maxChartMinutes) * 100}%` }]} />

                            {weekData.map((day, index) => {
                                const heightPercent = Math.min((day.minutes / maxChartMinutes) * 100, 100);
                                const isGoalMet = day.minutes >= dailyGoalMinutes;

                                return (
                                    <View key={index} style={styles.barColumn}>
                                        <View style={[styles.barTrack, day.isFuture && styles.ghostBarTrack]}>
                                            {!day.isFuture && (
                                                <LinearGradient
                                                    colors={isGoalMet ? ['#FFB347', '#FF8C00'] : ['#A0C4FF', '#4A90D9']}
                                                    style={[
                                                        styles.barFill,
                                                        {
                                                            height: `${Math.max(heightPercent, 5)}%`,
                                                            opacity: day.minutes > 0 ? 1 : 0.3
                                                        }
                                                    ]}
                                                />
                                            )}
                                        </View>
                                        <Text style={[styles.dayLabel, day.isToday && styles.todayLabel]}>
                                            {day.dayName}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Insight - Inline */}
                        <View style={styles.insightBox}>
                            <Info size={14} color="#4A90D9" />
                            <Text style={styles.insightText}>{insightText}</Text>
                        </View>
                    </Animated.View>
                </View>

                {/* Bottom Actions */}
                <View style={styles.bottomActions}>
                    {/* Last Activity Button */}
                    {lastCompletedSession && (
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/activity-summary');
                            }}
                            style={styles.activityButton}
                        >
                            <View style={styles.activityButtonLeft}>
                                <Sun size={18} color="#FF8C00" />
                                <Text style={styles.activityButtonText}>View Last Activity</Text>
                            </View>
                            <ChevronRight size={20} color="#999" />
                        </Pressable>
                    )}

                    {/* CTA Buttons Row */}
                    <View style={styles.ctaRow}>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setShowCalendar(true);
                            }}
                            style={styles.ctaButtonSecondary}
                        >
                            <Calendar size={18} color="#FF8C00" />
                            <Text style={styles.ctaTextSecondary}>Calendar</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                router.back();
                            }}
                        >
                            <LinearGradient
                                colors={['#FFD580', '#FF8C00']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.ctaButtonPrimary}
                            >
                                <Text style={styles.ctaTextPrimary}>Back to Dashboard</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>
            </View>

            {/* Calendar Modal */}
            <CalendarModal
                visible={showCalendar}
                onClose={() => setShowCalendar(false)}
            />

            {/* Info Modal */}
            <InfoModal
                visible={!!infoModalKey}
                onClose={() => setInfoModalKey(null)}
                statKey={infoModalKey}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
    },

    content: {
        flex: 1,
        paddingHorizontal: 20,
    },

    // Streak Hero - Compact
    streakHero: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        position: 'relative',
    },
    infoButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 4,
    },
    streakHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    streakLabel: {
        fontSize: 10,
        fontFamily: 'Outfit_700Bold',
        color: '#64748B',
        letterSpacing: 1,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    streakNumber: {
        fontSize: 56,
        fontFamily: 'Outfit_300Light',
        color: '#1A1A2E',
        lineHeight: 60,
    },
    streakUnit: {
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
        color: '#64748B',
    },
    longestStreak: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#999',
        marginTop: 4,
    },

    // Twin Metrics Row
    twinRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    twinMetric: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 16,
        padding: 12,
    },
    metricIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
    },
    twinValue: {
        fontSize: 20,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
    },
    twinUnit: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#999',
    },
    twinLabel: {
        fontSize: 9,
        fontFamily: 'Outfit_600SemiBold',
        color: '#AAA',
        letterSpacing: 0.5,
        marginTop: 1,
    },

    // Secondary Grid
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
    },
    gridItem: {
        alignItems: 'center',
        flex: 1,
    },
    gridValue: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
        marginTop: 4,
    },
    gridLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 2,
    },
    gridLabel: {
        fontSize: 8,
        fontFamily: 'Outfit_700Bold',
        color: '#AAA',
        letterSpacing: 0.5,
    },

    // Chart Card
    chartCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 20,
        padding: 16,
    },
    chartTitle: {
        fontSize: 14,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
        marginBottom: 12,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 130,
        alignItems: 'flex-end',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    goalLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        borderWidth: 1,
        borderColor: '#FF8C00',
        borderStyle: 'dashed',
        opacity: 0.3,
    },
    barColumn: {
        alignItems: 'center',
        flex: 1,
        height: '100%',
        justifyContent: 'flex-end',
        gap: 4,
    },
    barTrack: {
        width: 12,
        height: '85%',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 6,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    ghostBarTrack: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        borderStyle: 'dashed',
        backgroundColor: 'transparent',
    },
    barFill: {
        width: '100%',
        borderRadius: 6,
    },
    dayLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
        color: '#1A1A2E',
        opacity: 0.4,
    },
    todayLabel: {
        color: '#FF8C00',
        opacity: 1,
        fontFamily: 'Outfit_700Bold',
    },
    insightBox: {
        flexDirection: 'row',
        backgroundColor: '#F0F7FF',
        borderRadius: 10,
        padding: 10,
        gap: 8,
        alignItems: 'center',
    },
    insightText: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#334E68',
    },

    // Bottom Actions
    bottomActions: {
        paddingHorizontal: 20,
        gap: 10,
    },
    activityButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        padding: 14,
    },
    activityButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    activityButtonText: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
    },
    ctaRow: {
        flexDirection: 'row',
        gap: 10,
    },
    ctaButtonSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        paddingVertical: 14,
    },
    ctaTextSecondary: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FF8C00',
    },
    ctaButtonPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    ctaTextPrimary: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFF',
    },

    // Info Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    modalIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 140, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        flex: 1,
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
    },
    modalClose: {
        padding: 4,
    },
    modalDescription: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        color: '#64748B',
        lineHeight: 22,
        marginBottom: 16,
    },
    modalCalculation: {
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        padding: 14,
    },
    modalCalcLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_700Bold',
        color: '#64748B',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    modalCalcText: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#1A1A2E',
        lineHeight: 18,
    },
});
