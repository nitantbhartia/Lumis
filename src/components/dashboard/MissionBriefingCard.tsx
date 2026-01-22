import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatFirstName } from '@/lib/utils/name-utils';

interface MissionBriefingProps {
    weatherCondition: string;
    hoursSinceSunrise: number;
    streak: number;
    userName: string | null;
}

const getMissionBriefing = (weatherCondition: string, hoursSinceSunrise: number, streak: number, name: string) => {
    const condition = weatherCondition.toLowerCase();
    const isCloudy = condition.includes('cloud') || condition.includes('rain') || condition.includes('overcast');
    const isClear = condition.includes('sunny') || condition.includes('clear');

    // Logic Flow: Streak -> Clear -> Cloudy

    // 1. Streak Defense (Priority if streak is good)
    if (streak >= 4) {
        return {
            title: "Streak Defense",
            message: `You've unlocked your apps before 8 AM for ${streak} days straight. Don't let the streak break today.`,
            luxScore: "Streak: " + streak,
            duration: "10 min",
            urgency: "High Priority",
            urgencyColor: "#FF6B6B" // Red
        };
    }

    // 2. Clear Sky Sprint
    if (isClear || !isCloudy) {
        return {
            title: "Clear Sky Sprint",
            message: `${name}, local light is at peak Lux (10,000+). Your mission today is a 10-minute sprint to full energy.`,
            luxScore: "10,000+ Lux",
            duration: "10-12 min",
            urgency: "Optimal",
            urgencyColor: "#4CAF50" // Green
        };
    }

    // 3. Cloudy Anchor Protocol
    return {
        title: "Cloudy Anchor Protocol",
        message: `Heavy overcast detected. We’ve adjusted your goal to 22 minutes to ensure your clock stays anchored.`,
        luxScore: "~2,500 Lux",
        duration: "20-25 min",
        urgency: "Adjusted",
        urgencyColor: "#FF9800" // Orange
    };
};

export const MissionBriefingCard = ({ weatherCondition, hoursSinceSunrise, streak, userName }: MissionBriefingProps) => {
    const name = formatFirstName(userName) || 'User';
    const mission = getMissionBriefing(weatherCondition, hoursSinceSunrise, streak, name);
    const windowStatus = hoursSinceSunrise < 2 ? "OPTIMAL" : hoursSinceSunrise < 4 ? "GOOD" : "CLOSING";

    return (
        <View style={styles.missionCard}>
            <View style={styles.missionHeader}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <View style={[styles.urgencyBadge, { backgroundColor: mission.urgencyColor }]}>
                    <Text style={styles.urgencyText}>{mission.urgency}</Text>
                </View>
            </View>

            <Text style={styles.missionBody}>{mission.message}</Text>

            <View style={styles.missionDivider} />

            <View style={styles.missionStatsRow}>
                <View style={styles.missionStat}>
                    <Text style={styles.statLabel}>LUX POTENTIAL</Text>
                    <Text style={styles.statValue}>{mission.luxScore}</Text>
                </View>
                <View style={styles.missionStat}>
                    <Text style={styles.statLabel}>EST. DURATION</Text>
                    <Text style={styles.statValue}>{mission.duration}</Text>
                </View>
                <View style={styles.missionStat}>
                    <Text style={styles.statLabel}>WINDOW</Text>
                    <Text style={styles.statValue}>{windowStatus}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    missionCard: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    missionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    missionTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
    },
    urgencyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    urgencyText: {
        fontSize: 11,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFF',
        textTransform: 'uppercase',
    },
    missionBody: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        color: '#4A5568',
        lineHeight: 22,
        marginBottom: 20,
    },
    missionDivider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 16,
    },
    missionStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    missionStat: {
        alignItems: 'flex-start',
    },
    statLabel: {
        fontSize: 10,
        fontFamily: 'Outfit_600SemiBold',
        color: '#8A94A6',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
    },
});
