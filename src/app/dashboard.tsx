import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, UIManager, LayoutAnimation } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useLumisStore } from '@/lib/state/lumis-store';
import { useAuthStore } from '@/lib/state/auth-store';
import { unblockApps } from '@/lib/screen-time';
import { formatFirstName } from '@/lib/utils/name-utils';
import { useWeather } from '@/lib/hooks/useWeather';

import CalendarModal from '../components/CalendarModal';
import EmergencyUnlockModal from '../components/EmergencyUnlockModal';
import UserSettingsModal from '../components/UserSettingsModal';

import { useMissionBriefing } from '@/lib/hooks/useMissionBriefing';
import { ShieldCta } from '@/components/dashboard/ShieldCta';
import { StreakHero } from '@/components/dashboard/StreakHero';
import { GoalHero } from '@/components/dashboard/GoalHero';
import { LockedAppsRow } from '@/components/dashboard/LockedAppsRow';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function DashboardScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const weather = useWeather();
    const userName = useAuthStore((s) => s.userName);
    const user = useAuthStore((s) => s.user);
    const currentStreak = useLumisStore((s) => s.currentStreak);
    const todayProgress = useLumisStore((s) => s.todayProgress);
    const blockedApps = useLumisStore((s) => s.blockedApps);
    const dailyGoalMinutes = useLumisStore((s) => s.dailyGoalMinutes);

    const [showCalendar, setShowCalendar] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showEmergencyUnlock, setShowEmergencyUnlock] = useState(false);
    const [isCheckingLux, setIsCheckingLux] = useState(false);

    // Time-based data
    const now = new Date();
    const sunriseMinutes = 6 * 60 + 49;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const hoursSinceSunrise = Math.max(0, (currentMinutes - sunriseMinutes) / 60);

    const formattedName = formatFirstName(userName) || formatFirstName(user?.name);
    const displayName = formattedName || 'Friend';
    const initials = displayName ? displayName.charAt(0).toUpperCase() : 'F';

    // Get time-based greeting
    const getGreeting = () => {
        const hour = now.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Mission & Dynamic Goal
    const mission = useMissionBriefing(weather.condition, hoursSinceSunrise, currentStreak, userName, dailyGoalMinutes);
    const currentSessionGoal = mission.durationValue;

    const progressPercent = Math.min((todayProgress.lightMinutes / currentSessionGoal) * 100, 100);
    const isGoalMet = todayProgress.lightMinutes >= currentSessionGoal;

    // Sync blocked apps on mount
    useEffect(() => {
        useLumisStore.getState().syncWithNativeBlockedApps();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    }, [currentSessionGoal, mission.isAdjusted]);

    const handleStartTracking = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push({
            pathname: '/tracking',
            params: { initialGoal: currentSessionGoal }
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFF' }}>
            <LinearGradient
                colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFill}
            />

            <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
                {/* Header Row: Profile & Date */}
                <View style={styles.header}>
                    <Pressable onPress={() => setShowSettings(true)} style={styles.profileRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View>
                            <Text style={styles.greeting}>{getGreeting()}, {displayName}</Text>
                            <Text style={styles.dateText}>
                                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </Text>
                        </View>
                    </Pressable>
                </View>

                {/* Main Content - No ScrollView */}
                <View style={styles.content}>
                    {/* Goal Hero - The main focus with mission context */}
                    <GoalHero
                        goalMinutes={currentSessionGoal}
                        todayMinutes={todayProgress.lightMinutes}
                        isAdjusted={mission.isAdjusted}
                        weatherCondition={weather.condition}
                        missionTitle={mission.title}
                        missionMessage={mission.message}
                    />

                    {/* Streak Row - Inline, minimal */}
                    <StreakHero
                        currentStreak={currentStreak}
                        isGoalMetToday={isGoalMet}
                        onPress={() => setShowCalendar(true)}
                    />

                    {/* Locked Apps Row - Minimal */}
                    <LockedAppsRow
                        blockedApps={blockedApps}
                        isGoalMet={isGoalMet}
                        onManageShield={() => router.push('/(tabs)/shield')}
                    />
                </View>

                {/* Spacer to push CTA down */}
                <View style={{ flex: 1 }} />

                {/* CTA Button - Pinned to Bottom for thumb-zone access */}
                <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 8 }]}>
                    <ShieldCta
                        onStartTracking={handleStartTracking}
                        onManageShield={() => router.push('/(tabs)/shield')}
                        blockedApps={blockedApps}
                        isCheckingLux={isCheckingLux}
                        isGoalMet={isGoalMet}
                        progressPercent={progressPercent}
                    />
                </View>

                {/* Modals */}
                <UserSettingsModal
                    visible={showSettings}
                    onClose={() => setShowSettings(false)}
                />

                <CalendarModal
                    visible={showCalendar}
                    onClose={() => setShowCalendar(false)}
                />

                <EmergencyUnlockModal
                    visible={showEmergencyUnlock}
                    onClose={() => setShowEmergencyUnlock(false)}
                    onSuccess={() => {
                        unblockApps();
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 8,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatarText: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
    },
    greeting: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
    },
    dateText: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#64748B',
        marginTop: 1,
    },
    content: {
        paddingHorizontal: 24,
    },
    ctaContainer: {
        paddingHorizontal: 24,
        paddingTop: 10,
    },
});
