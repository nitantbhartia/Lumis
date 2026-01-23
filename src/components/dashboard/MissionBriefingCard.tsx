import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MissionBriefing } from '@/lib/hooks/useMissionBriefing';

interface MissionBriefingProps {
    mission: MissionBriefing;
    windowStatus: string;
}

export const MissionBriefingCard = ({ mission, windowStatus }: MissionBriefingProps) => {
    // Determine window status based on prop or context? 
    // The previous implementation calculated windowStatus inside the component based on hoursSinceSunrise.
    // For now, let's keep it simple or accept it as a prop if needed.
    // Ideally, the hook should provide everything, or we pass windowStatus too.
    // Let's assume the parent passes the mission.
    // Wait, the original prop list had 'hoursSinceSunrise'.
    // Let's modify the props to just take the mission, OR we can keep hoursSinceSunrise just for the window display
    // But the user wants consistency. The hook is the source of truth.

    // Actually, let's keep the component dumb and just render what it gets.
    // But we need 'windowStatus'. Let's calculate it here or pass it.
    // Simpler: Pass it as a prop.

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

// ... unused logic removed ...

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
