import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { notificationService } from '@/lib/notifications';

export default function OnboardingPermissionNotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isRequesting, setIsRequesting] = useState(false);

    const handleAllow = async () => {
        if (isRequesting) return;
        setIsRequesting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            await notificationService.requestPermissions();
        } catch (e) {
            console.log('[Notifications Permission] Error:', e);
        }

        // Navigate to wake time schedule
        router.push('/onboarding-permission-motion');
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/onboarding-permission-motion');
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
            {/* Back Button */}
            <Pressable onPress={handleBack} style={styles.backButton}>
                <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
            </Pressable>

            {/* Icon */}
            <Animated.View entering={FadeIn.duration(500)} style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                    <Bell size={48} color="#FF6B35" strokeWidth={1.5} />
                </View>
            </Animated.View>

            {/* Title & Description */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.textContainer}>
                <Text style={styles.title}>Stay on track</Text>
                <Text style={styles.description}>
                    We'll send a gentle nudge each morning to remind you to get your light, and celebrate your wins along the way.
                </Text>
            </Animated.View>

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Skip option */}
            <Animated.View entering={FadeIn.delay(600)} style={styles.skipContainer}>
                <Pressable onPress={handleSkip}>
                    <Text style={styles.skipText}>Skip for now</Text>
                </Pressable>
            </Animated.View>

            {/* Button */}
            <Animated.View
                entering={FadeInDown.delay(400).duration(400)}
                style={{ paddingBottom: insets.bottom }}
            >
                <Pressable
                    onPress={handleAllow}
                    disabled={isRequesting}
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed,
                    ]}
                >
                    <Bell size={20} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.buttonText}>
                        {isRequesting ? 'Requesting...' : 'Allow Notifications'}
                    </Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A2E',
        paddingHorizontal: 24,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        alignItems: 'center',
        marginTop: 48,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 107, 53, 0.3)',
    },
    textContainer: {
        marginTop: 32,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Outfit_700Bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        lineHeight: 24,
    },
    skipContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    skipText: {
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
        color: 'rgba(255, 255, 255, 0.4)',
    },
    button: {
        backgroundColor: '#FF6B35',
        paddingVertical: 20,
        marginHorizontal: -24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    buttonPressed: {
        backgroundColor: '#E85D04',
    },
    buttonText: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
