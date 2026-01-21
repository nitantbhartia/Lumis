import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { useLumisStore } from '@/lib/state/lumis-store';

const { width, height } = Dimensions.get('window');

interface CalendarModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function CalendarModal({ visible, onClose }: CalendarModalProps) {
    const insets = useSafeAreaInsets();
    const currentStreak = useLumisStore((s) => s.currentStreak);
    const longestStreak = useLumisStore((s) => s.longestStreak);
    const totalHoursInSunlight = useLumisStore((s) => s.totalHoursInSunlight);

    // Use actual current date
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const totalDays = daysInMonth(month, year);
        const startDay = firstDayOfMonth(month, year);
        const now = new Date();
        const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

        const days = [];
        // Empty slots for days before the first of the month
        for (let i = 0; i < startDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.calendarDayCell} />);
        }

        for (let day = 1; day <= totalDays; day++) {
            const isToday = isCurrentMonth && day === now.getDate();
            days.push(
                <Pressable
                    key={day}
                    style={styles.calendarDayCell}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                    <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
                        <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
                    </View>
                </Pressable>
            );
        }

        return days;
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const formatHours = (hours: number) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return { h, m };
    };

    const totalTime = formatHours(totalHoursInSunlight);

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.root}>
                <LinearGradient
                    colors={['#004E92', '#000428']}
                    style={StyleSheet.absoluteFill}
                />

                <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable style={styles.closeButton} onPress={onClose}>
                            <X size={24} color="#FFF" />
                        </Pressable>

                        <View style={styles.monthSelector}>
                            <Pressable onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
                                <ChevronLeft size={24} color="rgba(255,255,255,0.5)" />
                            </Pressable>
                            <Text style={styles.monthTitle}>
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </Text>
                            <Pressable onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
                                <ChevronRight size={24} color="rgba(255,255,255,0.5)" />
                            </Pressable>
                        </View>
                    </View>

                    {/* Weekday Headers */}
                    <View style={styles.weekdaysRow}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <Text key={i} style={styles.weekdayText}>{d}</Text>
                        ))}
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.calendarGrid}>
                        {renderCalendar()}
                    </View>

                    {/* Stats Section */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statLine}>
                            <Text style={styles.statLabel}>CURRENT STREAK</Text>
                            <View style={styles.streakCircle}>
                                <Text style={styles.streakNumber}>{currentStreak}</Text>
                            </View>
                        </View>

                        <View style={styles.statLine}>
                            <Text style={styles.statLabel}>LONGEST STREAK</Text>
                            <View style={styles.streakCircle}>
                                <Text style={styles.streakNumber}>{longestStreak}</Text>
                            </View>
                        </View>

                        <View style={styles.subStatRow}>
                            <Text style={styles.subStatLabel}>LONGEST SUNLIGHT SESSION</Text>
                            <View style={styles.timeValueRow}>
                                <Text style={styles.timeValue}>0</Text>
                                <Text style={styles.timeUnit}>hr</Text>
                                <Text style={styles.timeValue}>0</Text>
                            </View>
                        </View>

                        <View style={styles.subStatRow}>
                            <Text style={styles.subStatLabel}>TOTAL SUNLIGHT SINCE JOINING</Text>
                            <View style={styles.timeValueRow}>
                                <Text style={styles.timeValue}>{totalTime.h}</Text>
                                <Text style={styles.timeUnit}>hr</Text>
                                <Text style={styles.timeValue}>{totalTime.m}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        marginBottom: 20,
    },
    closeButton: {
        alignSelf: 'flex-end',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    monthSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    monthTitle: {
        fontSize: 24,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFF',
    },
    weekdaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    weekdayText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        width: (width - 64) / 7,
        textAlign: 'center',
        fontFamily: 'Outfit_500Medium',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 40,
    },
    calendarDayCell: {
        width: (width - 48) / 7,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    todayCircle: {
        borderWidth: 2,
        borderColor: '#FFB347',
    },
    dayText: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: 'Outfit_500Medium',
    },
    todayText: {
        color: '#FFB347',
        fontFamily: 'Outfit_700Bold',
    },
    statsContainer: {
        flex: 1,
        gap: 32,
    },
    statLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFF',
        letterSpacing: 1,
    },
    streakCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#FFB347',
        alignItems: 'center',
        justifyContent: 'center',
    },
    streakNumber: {
        fontSize: 48,
        fontFamily: 'Outfit_700Bold',
        color: '#FFF',
    },
    subStatRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subStatLabel: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 1,
        maxWidth: '60%',
    },
    timeValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    timeValue: {
        fontSize: 32,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFF',
    },
    timeUnit: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255,255,255,0.4)',
        marginHorizontal: 4,
    },
});
