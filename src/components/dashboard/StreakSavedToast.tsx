import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Flame, Check } from 'lucide-react-native';

interface StreakSavedToastProps {
    visible: boolean;
    streak: number;
    onHide: () => void;
}

export function StreakSavedToast({ visible, streak, onHide }: StreakSavedToastProps) {
    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);

    useEffect(() => {
        if (visible) {
            // Animate in
            translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
            opacity.value = withTiming(1, { duration: 300 });
            scale.value = withSpring(1, { damping: 12, stiffness: 200 });

            // Auto-hide after 3 seconds
            const timer = setTimeout(() => {
                translateY.value = withTiming(-100, { duration: 300 });
                opacity.value = withTiming(0, { duration: 300 }, () => {
                    runOnJS(onHide)();
                });
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value },
        ],
        opacity: opacity.value,
    }));

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <View style={styles.toast}>
                <View style={styles.iconContainer}>
                    <Flame size={20} color="#F59E0B" fill="#FEF3C7" />
                    <View style={styles.checkBadge}>
                        <Check size={10} color="#FFF" strokeWidth={3} />
                    </View>
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>
                        {streak > 1 ? `${streak}-Day Streak Saved!` : 'Streak Started!'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {streak > 1 ? 'Keep it going tomorrow' : 'Day 1 complete'}
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 24,
        right: 24,
        zIndex: 1000,
        alignItems: 'center',
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    checkBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#22C55E',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
    },
    subtitle: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#64748B',
        marginTop: 2,
    },
});
