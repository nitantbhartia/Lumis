import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Lock, Shield, ChevronRight } from 'lucide-react-native';
import { BlockedApp } from '@/lib/state/lumis-store';
import { LumisIcon } from '@/lib/screen-time';

interface LockedAppsRowProps {
    blockedApps: BlockedApp[];
    isGoalMet: boolean;
    onManageShield: () => void;
}

export function LockedAppsRow({
    blockedApps,
    isGoalMet,
    onManageShield,
}: LockedAppsRowProps) {
    const activeApps = blockedApps.filter(app => app.isBlocked);

    // No apps configured state
    if (activeApps.length === 0) {
        return (
            <Pressable onPress={onManageShield} style={styles.container}>
                <View style={styles.row}>
                    <Shield size={18} color="#94A3B8" />
                    <Text style={styles.emptyText}>No apps shielded</Text>
                    <ChevronRight size={16} color="#94A3B8" />
                </View>
            </Pressable>
        );
    }

    // Goal met state - apps unlocked
    if (isGoalMet) {
        return (
            <View style={styles.container}>
                <View style={styles.row}>
                    <View style={styles.iconRow}>
                        {activeApps.slice(0, 3).map((app, index) => (
                            <View key={app.id || `app-${index}`} style={styles.appIcon}>
                                <LumisIcon
                                    style={{ width: 28, height: 28 }}
                                    appName={app.name}
                                    tokenData={(app as any).tokenData}
                                    isCategory={!!app.isCategory}
                                    size={28}
                                    grayscale={false}
                                />
                            </View>
                        ))}
                        {activeApps.length > 3 && (
                            <View style={[styles.appIcon, styles.moreIcon]}>
                                <Text style={styles.moreText}>+{activeApps.length - 3}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.unlockedText}>
                        {activeApps.length} apps unlocked
                    </Text>
                </View>
            </View>
        );
    }

    // Locked state - main display
    return (
        <Pressable onPress={onManageShield} style={styles.container}>
            <View style={styles.row}>
                <View style={styles.iconRow}>
                    {activeApps.slice(0, 3).map((app, index) => (
                        <View key={app.id || `app-${index}`} style={styles.appIcon}>
                            <LumisIcon
                                style={{ width: 28, height: 28 }}
                                appName={app.name}
                                tokenData={(app as any).tokenData}
                                isCategory={!!app.isCategory}
                                size={28}
                                grayscale={true}
                            />
                        </View>
                    ))}
                    {activeApps.length > 3 && (
                        <View style={[styles.appIcon, styles.moreIcon]}>
                            <Text style={styles.moreText}>+{activeApps.length - 3}</Text>
                        </View>
                    )}
                </View>
                <Lock size={14} color="#DC2626" style={{ marginRight: 4 }} />
                <Text style={styles.lockedText}>
                    {activeApps.length} apps locked until complete
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: -8,
        borderWidth: 2,
        borderColor: '#FFDAB9',
    },
    moreIcon: {
        backgroundColor: 'rgba(255, 140, 0, 0.15)',
    },
    moreText: {
        fontSize: 11,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FF8C00',
    },
    lockedText: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#64748B',
    },
    unlockedText: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#22C55E',
    },
    emptyText: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#94A3B8',
        flex: 1,
    },
});
