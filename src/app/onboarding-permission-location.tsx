import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';

export default function OnboardingPermissionLocationScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isRequesting, setIsRequesting] = useState(false);

    const handleAllow = async () => {
        if (isRequesting) return;
        setIsRequesting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (e) {
            console.log('[Location Permission] Error:', e);
        }

        // Navigate to Screen Time permission (next step)
        router.push('/onboarding-permission-screentime');
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
                locations={[0, 0.3, 0.7, 1]}
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
                    {/* Back Button */}
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <ArrowLeft size={24} color="#1A1A2E" strokeWidth={2} />
                    </Pressable>

                    {/* Icon */}
                    <Animated.View entering={FadeIn.duration(500)} style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <MapPin size={48} color="#1A1A2E" strokeWidth={1.5} />
                        </View>
                    </Animated.View>

                    {/* Title & Description */}
                    <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.textContainer}>
                        <Text style={styles.title}>Enable location</Text>
                        <Text style={styles.description}>
                            Local sunrise, sunset, and weather data are essential for the algorithm to work. We only check this locally on your device.
                        </Text>
                    </Animated.View>

                    {/* Spacer */}
                    <View style={{ flex: 1 }} />

                    {/* Buttons */}
                    <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.buttonsContainer}>
                        <Pressable onPress={handleAllow} style={styles.allowButtonContainer}>
                            <LinearGradient
                                colors={['#FFB347', '#FF8C00']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.allowButton}
                            >
                                <Text style={styles.allowButtonText}>
                                    {isRequesting ? 'Requesting...' : 'Allow Location Access'}
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        alignItems: 'center',
        marginTop: 48,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    textContainer: {
        marginTop: 32,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#333',
        textAlign: 'center',
        lineHeight: 24,
    },
    buttonsContainer: {
        gap: 12,
    },
    allowButtonContainer: {
        width: '100%',
    },
    allowButton: {
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
    },
    allowButtonText: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
    },
});
