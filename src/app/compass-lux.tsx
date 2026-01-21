import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import LuxSensor from 'expo-lux-sensor';
import { X, ChevronLeft, ArrowLeft } from 'lucide-react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { useLumisStore } from '@/lib/state/lumis-store';

const { width, height } = Dimensions.get('window');
const COMPASS_SIZE = 120; // Smaller as per image

export default function CompassLuxScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const selectedActivity = useLumisStore((s) => s.selectedActivity);

    const [permission, requestPermission] = useCameraPermissions();
    const weather = useWeather();
    const [heading, setHeading] = useState(0);
    const [lux, setLux] = useState(0);
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [measureProgress, setMeasureProgress] = useState(0);

    const pulseScale = useSharedValue(1);

    // Initial permissions and location setup
    useEffect(() => {
        let mounted = true;

        pulseScale.value = withRepeat(
            withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );

        const init = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                Location.watchHeadingAsync((data) => {
                    if (mounted) setHeading(data.trueHeading || data.magHeading || 0);
                });
            }

            if (Platform.OS !== 'web') {
                // Try enabling lux sensor
                try {
                    await LuxSensor.startAsync({ updateInterval: 500 });
                    LuxSensor.addLuxListener((data: any) => {
                        const val = typeof data === 'number' ? data : (data?.lux ?? data?.illuminance ?? 0);
                        if (mounted && !isMeasuring) setLux(Math.round(val));
                    });
                } catch (e) {
                    // Fallback mock lux if sensor fails or not present
                }
            }

            if (!permission?.granted) {
                await requestPermission();
            }
        };

        init();
        return () => {
            mounted = false;
            if (Platform.OS !== 'web') LuxSensor.stopAsync().catch(() => { });
        };
    }, []);

    // Measurement simulation interaction
    const handlePressIn = () => {
        setIsMeasuring(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Mock measurement progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 0.05;
            setMeasureProgress(progress);
            if (progress >= 1) {
                clearInterval(interval);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // "Found" a reading
                setLux((prev) => Math.max(prev, Math.floor(Math.random() * 5000 + 1000)));
            }
        }, 50);
    };

    const handlePressOut = () => {
        if (measureProgress < 1) {
            setIsMeasuring(false);
            setMeasureProgress(0);
        }
    };

    const handleStart = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        router.replace('/tracking');
    };

    const getHeadingLabel = () => {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(heading / 45) % 8;
        return `${Math.round(heading)}° ${directions[index]}`;
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Background Blur / Gradient to match image */}
            <LinearGradient
                colors={['#8FA3C6', '#C7BCCB', '#F3A675']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
            />

            <View style={{ flex: 1, paddingTop: insets.top }}>

                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.iconButton}>
                        <ArrowLeft size={24} color="#1A1A2E" />
                    </Pressable>
                    <Text style={styles.headerTitle}>MEDITATION</Text>
                    <Pressable onPress={() => router.back()} style={styles.iconButton}>
                        <X size={24} color="#1A1A2E" />
                    </Pressable>
                </View>

                {/* Top Section: Compass & Stats */}
                <View style={styles.topSection}>
                    {/* Compass Widget */}
                    <View style={styles.compassWrapper}>
                        <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox="0 0 120 120">
                            {/* Outer ticks */}
                            {Array.from({ length: 72 }).map((_, i) => {
                                const angle = (i * 5 * Math.PI) / 180;
                                const isMajor = i % 9 === 0;
                                const r1 = isMajor ? 50 : 54;
                                const r2 = 60;
                                return (
                                    <Line
                                        key={i}
                                        x1={60 + r1 * Math.sin(angle)}
                                        y1={60 - r1 * Math.cos(angle)}
                                        x2={60 + r2 * Math.sin(angle)}
                                        y2={60 - r2 * Math.cos(angle)}
                                        stroke="rgba(255,255,255,0.6)"
                                        strokeWidth={isMajor ? 1.5 : 0.5}
                                    />
                                );
                            })}
                            {/* Inner Circles */}
                            <Circle cx="60" cy="60" r="40" stroke="rgba(255,255,255,1)" strokeWidth="1.5" fill="none" />
                            <Circle cx="60" cy="60" r="25" stroke="rgba(255,255,255,0.5)" strokeWidth="1" fill="none" />
                            <Circle cx="60" cy="60" r="10" stroke="#FFD700" strokeWidth="2" fill="rgba(255,215,0,0.3)" />

                            {/* North Indicator */}
                            <Line x1="60" y1="60" x2="60" y2="20" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" transform={`rotate(${heading}, 60, 60)`} />
                        </Svg>
                    </View>

                    {/* Stats Text */}
                    <View style={styles.statsTextContainer}>
                        <Text style={styles.headingValue}>{getHeadingLabel()}</Text>
                        <Text style={styles.statLine}>{weather.city || 'LOADING...'}</Text>
                        <Text style={styles.statLine}>{weather.condition || '--'}</Text>
                        <Text style={styles.statLine}>{weather.temperature?.toFixed(1)}°C</Text>
                    </View>
                </View>

                {/* Center: Lux Meter */}
                <View style={styles.luxContainer}>
                    <Text style={styles.luxLabel}>Lux Meter: point camera at sky 🤳</Text>

                    {/* Camera Viewport / Button Interactivity */}
                    <View style={styles.cameraFrame}>
                        {permission?.granted ? (
                            <CameraView style={styles.camera} facing="back" />
                        ) : (
                            <View style={styles.cameraPlaceholder} />
                        )}

                        {/* Status Overlay */}
                        {measureProgress > 0 && measureProgress < 1 && (
                            <View style={[styles.progressOverlay, { width: `${measureProgress * 100}%` }]} />
                        )}
                    </View>

                    <Pressable
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        style={({ pressed }) => [
                            styles.luxButton,
                            pressed && styles.luxButtonPressed
                        ]}
                    >
                        <Text style={styles.luxButtonText}>
                            {measureProgress >= 1 ? `Lux Measured: ${lux}` : 'Hold to measure lux'}
                        </Text>
                    </Pressable>
                </View>

                {/* Footer: Start Button */}
                <View style={styles.footer}>
                    <Pressable onPress={handleStart} style={styles.startButton}>
                        <Text style={styles.startButtonText}>Start</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        height: 60,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: 'white',
        letterSpacing: 2,
    },
    topSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        gap: 24,
    },
    compassWrapper: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsTextContainer: {
        gap: 4,
    },
    headingValue: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        marginBottom: 4,
    },
    statLine: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontFamily: 'Outfit_500Medium',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    luxContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    luxLabel: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
    },
    cameraFrame: {
        width: width - 48,
        height: 120,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'white',
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
        opacity: 0.8,
    },
    cameraPlaceholder: {
        flex: 1,
        backgroundColor: '#333',
    },
    progressOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 215, 0, 0.4)',
    },
    luxButton: {
        width: width - 48,
        paddingVertical: 14,
        backgroundColor: 'white',
        borderRadius: 25, // Pill shape
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    luxButtonPressed: {
        transform: [{ scale: 0.98 }],
        backgroundColor: '#F0F0F0',
    },
    luxButtonText: {
        color: '#1A1A2E',
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
    },
    footer: {
        paddingBottom: 60,
        alignItems: 'center',
    },
    startButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF1A6', // Pale yellow from image
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
    },
    startButtonText: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
    },
});
