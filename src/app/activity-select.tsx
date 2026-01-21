import React, { useState } from 'react';
import { View, Text, Pressable, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Plus } from 'lucide-react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useLumisStore } from '@/lib/state/lumis-store';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 24 * 2 - 16) / 2;

const ACTIVITIES = [
    { id: 'walk', label: 'WALK', icon: 'shoe' },
    { id: 'run', label: 'RUN', icon: 'runner' },
    { id: 'meditate', label: 'MEDITATE', icon: 'lotus' },
    { id: 'sit_soak', label: 'SIT & SOAK', icon: 'sit' },
] as const;

type ActivityType = typeof ACTIVITIES[number]['id'];

const ShoeIcon = () => (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5}>
        <Path d="M4 18v-4a4 4 0 0 1 4-4h8" />
        <Path d="M16 6a2 2 0 0 1 2 2v6a4 4 0 0 1-4 4H4" />
        <Path d="M8 14h8" />
        <Circle cx="6" cy="18" r="1" fill="white" />
        <Circle cx="10" cy="18" r="1" fill="white" />
    </Svg>
);

const RunnerIcon = () => (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5}>
        <Circle cx="17" cy="5" r="2" />
        <Path d="M15 9l-4 4 2 3-3 4" />
        <Path d="M8 13l-3 4" />
        <Path d="M10 9l5 3" />
    </Svg>
);

const LotusIcon = () => (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5}>
        <Path d="M12 20c4-2 6-6 6-10a6 6 0 0 0-6-6 6 6 0 0 0-6 6c0 4 2 8 6 10z" />
        <Path d="M12 10c-2 2-2 5 0 7" />
        <Path d="M12 10c2 2 2 5 0 7" />
        <Path d="M9 14h6" />
    </Svg>
);

const SitIcon = () => (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5}>
        <Circle cx="12" cy="5" r="2" />
        <Path d="M12 7v4" />
        <Path d="M8 11h8" />
        <Path d="M9 11l-1 5" />
        <Path d="M15 11l1 5" />
        <Path d="M10 20l2-4 2 4" />
    </Svg>
);

const getIcon = (iconName: string) => {
    switch (iconName) {
        case 'shoe': return <ShoeIcon />;
        case 'runner': return <RunnerIcon />;
        case 'lotus': return <LotusIcon />;
        case 'sit': return <SitIcon />;
        default: return null;
    }
};

export default function TrackTab() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const setSelectedActivity = useLumisStore((s) => s.setSelectedActivity);

    const handleSelect = (id: ActivityType) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedActivity(id);
        router.push('/compass-lux');
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)');
    };

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={['#A8C8DC', '#C4B8D8', '#F5C6AA', '#F8A868']}
                locations={[0, 0.3, 0.6, 1]}
                style={{ flex: 1 }}
            >
                <View
                    style={{
                        flex: 1,
                        paddingTop: insets.top + 16,
                        paddingBottom: insets.bottom + 24,
                        paddingHorizontal: 24,
                    }}
                >
                    <View style={styles.header}>
                        <View style={{ width: 48 }} />
                        <View style={{ flex: 1 }} />
                        <Pressable onPress={handleClose} style={styles.closeButton}>
                            <X size={24} color="#1A1A2E" strokeWidth={2} />
                        </Pressable>
                    </View>

                    <Animated.View entering={FadeIn.duration(500)} style={styles.questionContainer}>
                        <Text style={styles.questionText}>
                            What would you like to{'\n'}do today?
                        </Text>
                    </Animated.View>

                    <View style={styles.gridContainer}>
                        {ACTIVITIES.map((activity, index) => (
                            <Animated.View
                                key={activity.id}
                                entering={FadeIn.delay(100 + index * 80).duration(400)}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => handleSelect(activity.id)}
                                    style={styles.activityCard}
                                >
                                    <View style={styles.iconContainer}>
                                        {getIcon(activity.icon)}
                                    </View>
                                    <Text style={styles.activityLabel}>{activity.label}</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>

                    <View style={{ flex: 1 }} />

                    <View style={styles.manualLogContainer}>
                        <Pressable onPress={() => { }} style={styles.manualLogButton}>
                            <Plus size={24} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                        </Pressable>
                        <Text style={styles.manualLogText}>MANUAL LOG</Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    closeButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    questionContainer: {
        marginTop: 48,
        marginBottom: 48,
        alignItems: 'center',
    },
    questionText: {
        fontSize: 28,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 38,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'center',
    },
    activityCard: {
        width: CARD_SIZE,
        height: CARD_SIZE,
        borderRadius: CARD_SIZE / 2,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    iconContainer: {
        marginBottom: 8,
    },
    activityLabel: {
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    manualLogContainer: {
        alignItems: 'center',
        gap: 8,
    },
    manualLogButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    manualLogText: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 1,
    },
});
