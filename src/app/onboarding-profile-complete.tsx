import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withRepeat,
    withSequence,
    interpolate,
    Easing,
    runOnJS
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const TICKER_MESSAGES = [
    "Analyzing window...",
    "Optimizing thresholds...",
    "Finalizing protocol..."
];

export default function OnboardingProfileCompleteScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Animation Values
    const progress = useSharedValue(0);
    const sunScale = useSharedValue(1);
    const sunOpacity = useSharedValue(0);
    const flashOpacity = useSharedValue(0);

    // State for Ticker
    const [tickerIndex, setTickerIndex] = useState(0);

    useEffect(() => {
        // 1. Start Sun Pulse immediately
        sunOpacity.value = withTiming(1, { duration: 800 });
        sunScale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
        );

        // 2. Animate Progress Bar (Total 3.5s)
        progress.value = withTiming(100, { duration: 3500, easing: Easing.linear });

        // 3. Ticker Logic
        const interval = setInterval(() => {
            setTickerIndex(prev => {
                if (prev < TICKER_MESSAGES.length - 1) return prev + 1;
                return prev;
            });
        }, 1100);

        // 4. End Sequence: Bright Flash & Navigate
        const endTimer = setTimeout(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Trigger Flash
            flashOpacity.value = withSequence(
                withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
                withDelay(100, withTiming(0, { duration: 300 })) // Fade out not strictly needed if we nav, but good for safety
            );

            // Navigate right at peak flash
            setTimeout(() => {
                router.replace('/onboarding-science');
            }, 500);

        }, 3600);

        return () => {
            clearInterval(interval);
            clearTimeout(endTimer);
        };
    }, []);

    const sunStyle = useAnimatedStyle(() => ({
        transform: [{ scale: sunScale.value }],
        opacity: sunOpacity.value,
    }));

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value}%`,
    }));

    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
    }));

    return (
        <View style={{ flex: 1, backgroundColor: '#87CEEB' }}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFill}
            />

            <View
                style={{
                    flex: 1,
                    paddingTop: insets.top + 60,
                    paddingBottom: insets.bottom + 60,
                    paddingHorizontal: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Sun Pulse Animation */}
                <View style={styles.sunContainer}>
                    {/* Outer Glow 1 */}
                    <Animated.View style={[styles.glowRing, sunStyle, { width: 240, height: 240, opacity: 0.2 }]} />
                    {/* Outer Glow 2 */}
                    <Animated.View style={[styles.glowRing, sunStyle, { width: 180, height: 180, opacity: 0.4 }]} />

                    {/* Core Sun */}
                    <Animated.View style={[styles.sunCore, sunStyle]}>
                        <LinearGradient
                            colors={['#FFB347', '#FF8C00']} // Brand Amber Gradient
                            style={styles.sunGradient}
                        />
                    </Animated.View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <Animated.View style={[styles.progressFill, progressStyle]} />
                    </View>
                    <Text style={styles.progressLabel}>
                        {TICKER_MESSAGES[tickerIndex].toUpperCase()}
                    </Text>
                </View>
            </View>

            {/* White Flash Overlay */}
            <Animated.View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', zIndex: 100 }, flashStyle]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    sunContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 80,
        height: 240,
    },
    sunCore: {
        width: 100,
        height: 100,
        borderRadius: 50,
        shadowColor: '#FF8C00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
        elevation: 10,
    },
    sunGradient: {
        flex: 1,
        borderRadius: 50,
    },
    glowRing: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: '#FFB347',
    },
    progressContainer: {
        width: '100%',
        marginBottom: 40,
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FF8C00',
        borderRadius: 3,
    },
    progressLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
        letterSpacing: 2,
        textAlign: 'center',
    },
});
