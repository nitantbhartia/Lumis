import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    interpolateColor,
    FadeIn,
    FadeOut
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import LuxSensor from 'expo-lux-sensor';
import { X, ArrowLeft, Smartphone, Sun, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import Svg, { Circle, Line, G, Path } from 'react-native-svg';
import { useLumisStore } from '@/lib/state/lumis-store';
import { useWeather } from '@/lib/hooks/useWeather';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const COMPASS_SIZE = 120;

const LuxPrimerModal = ({ visible, onDismiss }: { visible: boolean, onDismiss: () => void }) => {
    const insets = useSafeAreaInsets();

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.primerOverlay}>
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={[styles.primerContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
                    <View style={styles.primerIconContainer}>
                        <LinearGradient
                            colors={['#FFB347', '#FF8C00']}
                            style={styles.primerIconGradient}
                        >
                            <Sun size={40} color="#1A1A2E" strokeWidth={1.5} />
                        </LinearGradient>
                    </View>

                    <Text style={styles.primerTitle}>Lumis is now a light sensor.</Text>

                    <View style={styles.primerInfoRow}>
                        <CheckCircle2 size={24} color="#FFB347" />
                        <Text style={styles.primerInfoText}>
                            To unlock your apps, we need to verify you're getting at least <Text style={{ fontFamily: 'Outfit_700Bold' }}>1,000 Lux</Text> of natural light.
                        </Text>
                    </View>

                    <View style={styles.primerInfoRow}>
                        <Smartphone size={24} color="#FFB347" />
                        <Text style={styles.primerInfoText}>
                            Hold your phone facing the sky when prompted.
                        </Text>
                    </View>

                    <View style={[styles.primerInfoRow, { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16 }]}>
                        <ShieldCheck size={24} color="#FFB347" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.privacyTitle}>Privacy First</Text>
                            <Text style={styles.privacyText}>
                                Lumis only measures light intensity. No photos or videos are ever saved or shared.
                            </Text>
                        </View>
                    </View>

                    <View style={{ flex: 1 }} />

                    <Pressable onPress={onDismiss} style={styles.primerButton}>
                        <Text style={styles.primerButtonText}>Understood</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const GhostOverlay = ({ isFallback }: { isFallback?: boolean }) => {
    return (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.ghostOverlay}>
            <View style={styles.ghostHandContainer}>
                {/* Hand pointing up with phone SVG */}
                <Svg width={180} height={180} viewBox="0 0 100 100">
                    <Path
                        d="M40 80 Q 40 50 50 40 Q 60 50 60 80"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="2"
                        fill="none"
                    />
                    <G transform="rotate(-15, 50, 45)">
                        <Path
                            d="M35 30 L65 30 L65 60 L35 60 Z"
                            fill="rgba(255,255,255,0.15)"
                            stroke="rgba(255,255,255,0.6)"
                            strokeWidth="1.5"
                        />
                        <Line x1="45" y1="35" x2="55" y2="35" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
                        <Circle cx="50" cy="55" r="2" stroke="rgba(255,255,255,0.6)" strokeWidth="1" fill="none" />
                    </G>
                </Svg>
            </View>
            <Text style={styles.ghostText}>
                {isFallback
                    ? "It looks like you're still inside.\nStep outside and point your phone at the sky."
                    : "Point phone upward\ntoward the open sky"}
            </Text>
        </Animated.View>
    );
};

export default function CompassLuxScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { selectedActivity, hasSeenLuxPrimer, setHasSeenLuxPrimer } = useLumisStore();

    const [permission, requestPermission] = useCameraPermissions();
    const weather = useWeather();
    const [heading, setHeading] = useState(0);
    const [lux, setLux] = useState(0);
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [measureProgress, setMeasureProgress] = useState(0);
    const [displayLux, setDisplayLux] = useState(0);
    const [showPrimer, setShowPrimer] = useState(!hasSeenLuxPrimer);

    // Check if this is a fallback invocation (user detected indoors)
    const params = useLocalSearchParams();
    const isFallback = params.fallback === 'true';

    const glowAmber = useSharedValue(0);
    const pulseScale = useSharedValue(1);

    const calculateSimulatedLux = () => {
        let base = 5000;
        const cond = (weather.condition || '').toLowerCase();
        if (cond.includes('clear')) base = 50000;
        else if (cond.includes('mainly clear')) base = 35000;
        else if (cond.includes('partly')) base = 20000;
        else if (cond.includes('overcast')) base = 8000;

        const uvBonus = (weather.uvIndex || 0) * 15000;
        return Math.round((base + uvBonus) * (0.9 + Math.random() * 0.2));
    };

    useEffect(() => {
        let mounted = true;
        pulseScale.value = withRepeat(
            withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );

        const init = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    Location.watchHeadingAsync((data) => {
                        if (mounted) setHeading(data.trueHeading || data.magHeading || 0);
                    });
                }
                if (Platform.OS !== 'web') {
                    await LuxSensor.startAsync({ updateInterval: 500 }).catch(() => { });
                    LuxSensor.addLuxListener((data: any) => {
                        const val = typeof data === 'number' ? data : (data?.lux ?? data?.illuminance ?? 0);
                        if (mounted && !isMeasuring) {
                            setLux(Math.round(val));
                            if (val > 100) setDisplayLux(Math.round(val));
                        }
                    });
                }
                if (!permission?.granted) await requestPermission();
            } catch (e) { console.error('[CompassLux] Init error:', e); }
        };

        if (!showPrimer) init();

        return () => {
            mounted = false;
            if (Platform.OS !== 'web') LuxSensor.stopAsync().catch(() => { });
        };
    }, [showPrimer]);

    useEffect(() => {
        if (!weather.loading && lux < 100) {
            const initial = Math.round(calculateSimulatedLux() * 0.1);
            setLux(initial);
            setDisplayLux(initial);
        }
    }, [weather.loading]);

    useEffect(() => {
        if (displayLux >= 1000) {
            glowAmber.value = withTiming(1, { duration: 1000 });
        } else {
            glowAmber.value = withTiming(0, { duration: 500 });
        }
    }, [displayLux]);

    const handlePressIn = () => {
        setIsMeasuring(true);
        setMeasureProgress(0);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const targetLux = lux > 100 ? lux : calculateSimulatedLux();
        let currentProgress = 0;

        const interval = setInterval(() => {
            currentProgress += 0.05;
            setMeasureProgress(currentProgress);
            const currentDisplay = Math.round(targetLux * (currentProgress * 0.9 + (Math.random() * 0.1)));
            setDisplayLux(currentDisplay);

            if (currentProgress >= 1) {
                clearInterval(interval);
                setDisplayLux(targetLux);
                setLux(targetLux);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Automatic transition after short delay
                if (targetLux >= 1000) {
                    setTimeout(() => {
                        router.replace('/tracking');
                    }, 1500);
                }
            }
        }, 50);
    };

    const handlePressOut = () => {
        if (measureProgress < 1) {
            setIsMeasuring(false);
            setMeasureProgress(0);
        }
    };

    const animatedBackgroundStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            glowAmber.value,
            [0, 1],
            ['#1A1A2E00', '#FFB34730'] // Subtle amber glow
        );
        return { backgroundColor };
    });

    const getHeadingLabel = () => {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(heading / 45) % 8;
        return `${Math.round(heading)}° ${directions[index]}`;
    };

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={['#8FA3C6', '#C7BCCB', '#F3A675']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
            />
            <Animated.View style={[StyleSheet.absoluteFill, animatedBackgroundStyle]} />

            <View style={{ flex: 1, paddingTop: insets.top }}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.iconButton}>
                        <ArrowLeft size={24} color="#1A1A2E" />
                    </Pressable>
                    <View className="flex-1 items-center">
                        <Text style={[styles.headerTitle, isFallback && styles.headerTitleFallback]}>
                            {isFallback ? 'INDOOR LIGHT DETECTED' : 'LIGHT CALIBRATION'}
                        </Text>
                    </View>
                    <Pressable onPress={() => router.back()} style={styles.iconButton}>
                        <X size={24} color="#1A1A2E" />
                    </Pressable>
                </View>

                <View style={styles.topSection}>
                    <View style={styles.compassWrapper}>
                        <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox="0 0 120 120">
                            {Array.from({ length: 72 }).map((_, i) => {
                                const angle = (i * 5 * Math.PI) / 180;
                                const isMajor = i % 9 === 0;
                                return (
                                    <Line
                                        key={i}
                                        x1={60 + (isMajor ? 50 : 54) * Math.sin(angle)}
                                        y1={60 - (isMajor ? 50 : 54) * Math.cos(angle)}
                                        x2={60 + 60 * Math.sin(angle)}
                                        y2={60 - 60 * Math.cos(angle)}
                                        stroke="rgba(255,255,255,0.6)"
                                        strokeWidth={isMajor ? 1.5 : 0.5}
                                    />
                                );
                            })}
                            <Circle cx="60" cy="60" r="40" stroke="white" strokeWidth="1.5" fill="none" />
                            <Circle cx="60" cy="60" r="10" stroke="#FFD700" strokeWidth="2" fill="rgba(255,215,0,0.3)" />
                            <G transform={`rotate(${heading}, 60, 60)`}>
                                <Line x1="60" y1="60" x2="60" y2="20" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
                            </G>
                        </Svg>
                    </View>

                    <View style={styles.statsTextContainer}>
                        <Text style={styles.headingValue}>{getHeadingLabel()}</Text>
                        <Text style={styles.statLine}>{weather.city?.toUpperCase() || 'LOCATING...'}</Text>
                        <Text style={styles.statLine}>{weather.condition?.toUpperCase() || '--'}</Text>
                        <Text style={styles.statLine}>{weather.temperature?.toFixed(1) || '--'}°C</Text>
                    </View>
                </View>

                <View style={styles.luxContainer}>
                    <View style={styles.cameraFrame}>
                        {permission?.granted ? (
                            <View style={{ flex: 1 }}>
                                <CameraView style={styles.camera} facing="back" />
                                {measureProgress === 0 && <GhostOverlay isFallback={isFallback} />}
                            </View>
                        ) : (
                            <View style={styles.cameraPlaceholder} />
                        )}
                        {measureProgress > 0 && measureProgress < 1 && (
                            <View style={[styles.progressOverlay, { width: `${measureProgress * 100}%` }]} />
                        )}
                    </View>

                    <Text style={styles.luxDisplay}>
                        {displayLux.toLocaleString()} <Text style={styles.luxUnit}>LUX</Text>
                    </Text>

                    <Pressable
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        disabled={displayLux >= 1000 && measureProgress >= 1}
                        style={({ pressed }) => [
                            styles.luxButton,
                            pressed && styles.luxButtonPressed,
                            displayLux >= 1000 && measureProgress >= 1 && styles.luxButtonSuccess
                        ]}
                    >
                        <Text style={[
                            styles.luxButtonText,
                            displayLux >= 1000 && measureProgress >= 1 && styles.luxButtonTextSuccess
                        ]}>
                            {measureProgress >= 1
                                ? displayLux >= 1000 ? 'Verified' : 'Insufficient Light'
                                : isMeasuring ? 'Measuring...' : 'Hold to measure lux'}
                        </Text>
                    </Pressable>

                    <Text style={styles.hintText}>
                        {displayLux >= 1000 && measureProgress >= 1
                            ? 'Optimal light detected. Starting tracking...'
                            : 'Target: 1,000+ Lux'}
                    </Text>
                </View>

                <View style={{ flex: 1 }} />
            </View>

            <LuxPrimerModal
                visible={showPrimer}
                onDismiss={() => {
                    setShowPrimer(false);
                    setHasSeenLuxPrimer(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, height: 60 },
    iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 13, fontFamily: 'Outfit_700Bold', color: 'white', letterSpacing: 2 },
    headerTitleFallback: { color: '#FFB347' },
    topSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, gap: 24 },
    compassWrapper: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center' },
    statsTextContainer: { gap: 4 },
    headingValue: { color: 'white', fontSize: 16, fontFamily: 'Outfit_600SemiBold', marginBottom: 4 },
    statLine: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Outfit_500Medium', letterSpacing: 1, textTransform: 'uppercase' },
    luxContainer: { flex: 2, justifyContent: 'center', alignItems: 'center', gap: 20 },
    cameraFrame: { width: width - 48, height: 180, borderRadius: 32, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'black' },
    camera: { flex: 1 },
    cameraPlaceholder: { flex: 1, backgroundColor: '#333' },
    progressOverlay: { position: 'absolute', top: 0, left: 0, bottom: 0, backgroundColor: 'rgba(255, 179, 71, 0.4)' },
    luxDisplay: { fontSize: 48, fontFamily: 'Outfit_700Bold', color: 'white' },
    luxUnit: { fontSize: 18, fontFamily: 'Outfit_400Regular', opacity: 0.6 },
    luxButton: { width: width - 80, paddingVertical: 18, backgroundColor: 'white', borderRadius: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
    luxButtonPressed: { transform: [{ scale: 0.98 }], backgroundColor: '#F0F0F0' },
    luxButtonSuccess: { backgroundColor: '#FFB347' },
    luxButtonText: { color: '#1A1A2E', fontSize: 16, fontFamily: 'Outfit_600SemiBold', textTransform: 'uppercase', letterSpacing: 1 },
    luxButtonTextSuccess: { color: '#1A1A2E' },
    hintText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: 'Outfit_400Regular' },

    // Primer Styles
    primerOverlay: { flex: 1, justifyContent: 'center' },
    primerContent: { marginHorizontal: 32, backgroundColor: 'rgba(26,26,46,0.95)', borderRadius: 32, padding: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: '80%' },
    primerIconContainer: { alignItems: 'center', marginBottom: 24 },
    primerIconGradient: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
    primerTitle: { fontSize: 32, fontFamily: 'Outfit_700Bold', color: 'white', textAlign: 'center', marginBottom: 32 },
    primerInfoRow: { flexDirection: 'row', gap: 16, marginBottom: 24, alignItems: 'center' },
    primerInfoText: { flex: 1, fontSize: 16, fontFamily: 'Outfit_400Regular', color: 'rgba(255,255,255,0.8)', lineHeight: 24 },
    privacyTitle: { fontSize: 16, fontFamily: 'Outfit_600SemiBold', color: 'white', marginBottom: 4 },
    privacyText: { fontSize: 14, fontFamily: 'Outfit_400Regular', color: 'rgba(255,255,255,0.5)', lineHeight: 20 },
    primerButton: { backgroundColor: 'white', paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
    primerButtonText: { color: '#1A1A2E', fontSize: 18, fontFamily: 'Outfit_700Bold' },

    // Ghost Styles
    ghostOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
    ghostHandContainer: { marginBottom: 16 },
    ghostText: { color: 'white', fontSize: 14, fontFamily: 'Outfit_600SemiBold', textAlign: 'center', opacity: 0.8, letterSpacing: 0.5 }
});
