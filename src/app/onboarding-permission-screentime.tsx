import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { requestScreenTimeAuthorization } from '@/lib/screen-time';

// Hand-drawn arrow SVG component
function HandDrawnArrow() {
    return (
        <Svg width={60} height={80} viewBox="0 0 60 80">
            <Path
                d="M30 75 C25 60, 20 45, 22 30 C24 20, 28 12, 30 5"
                stroke="#2196F3"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M22 15 L30 5 L38 15"
                stroke="#2196F3"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

export default function OnboardingPermissionScreenTimeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isRequesting, setIsRequesting] = useState(false);

    const handleContinue = async () => {
        if (isRequesting) return;
        setIsRequesting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const result = await requestScreenTimeAuthorization();

            // Navigate to next permission screen
            router.push('/onboarding-permission-notifications');
        } catch (e) {
            console.error('[Screen Time Permission] Error:', e);
            // Still navigate even on error
            router.push('/onboarding-permission-notifications');
        } finally {
            setIsRequesting(false);
        }
    };

    const handleDontAllow = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Navigate without granting permission
        router.push('/onboarding-permission-notifications');
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
            {/* Header Section */}
            <Animated.View entering={FadeIn.duration(400)} style={styles.headerSection}>
                <Text style={styles.headerTitle}>Connect Lumis to Screen{'\n'}Time, Securely.</Text>
                <Text style={styles.headerSubtitle}>
                    To analyse your Screen Time on this iPhone, Lumis will need your permission.
                </Text>
            </Animated.View>

            {/* Permission Dialog Box */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.dialogContainer}>
                <View style={styles.dialogBox}>
                    <Text style={styles.dialogTitle}>"Lumis" Would Like to Access{'\n'}Screen Time</Text>
                    <Text style={styles.dialogDescription}>
                        Providing "Lumis" access to Screen Time may allow it to see your activity data, restrict content, and limit the usage of apps and websites.
                    </Text>

                    {/* Dialog Buttons */}
                    <View style={styles.dialogButtonsContainer}>
                        <Pressable
                            onPress={handleContinue}
                            style={styles.dialogButton}
                            disabled={isRequesting}
                        >
                            <Text style={styles.dialogButtonTextBlue}>Continue</Text>
                        </Pressable>
                        <View style={styles.dialogButtonDivider} />
                        <Pressable
                            onPress={handleDontAllow}
                            style={styles.dialogButton}
                            disabled={isRequesting}
                        >
                            <Text style={styles.dialogButtonTextBlue}>Don't allow</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Hand-drawn arrow pointing to Continue */}
                <View style={styles.arrowContainer}>
                    <HandDrawnArrow />
                </View>
            </Animated.View>

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Footer Section */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.footerSection}>
                <Text style={styles.footerText}>
                    Your information is protected by Apple and will stay 100% on your phone.
                </Text>
                <Pressable>
                    <Text style={styles.learnMoreText}>Learn More</Text>
                </Pressable>
            </Animated.View>

            {/* Bottom Spacing */}
            <View style={{ height: insets.bottom + 20 }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        paddingHorizontal: 24,
    },
    headerSection: {
        marginBottom: 60,
    },
    headerTitle: {
        fontSize: 32,
        fontFamily: 'Outfit_700Bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 40,
    },
    headerSubtitle: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        lineHeight: 24,
    },
    dialogContainer: {
        alignItems: 'center',
    },
    dialogBox: {
        backgroundColor: '#2C2C2E',
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#2196F3',
        width: '90%',
        maxWidth: 320,
        overflow: 'hidden',
    },
    dialogTitle: {
        fontSize: 17,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
        textAlign: 'center',
        paddingTop: 20,
        paddingHorizontal: 16,
        paddingBottom: 12,
        lineHeight: 22,
    },
    dialogDescription: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        paddingHorizontal: 16,
        paddingBottom: 20,
        lineHeight: 18,
    },
    dialogButtonsContainer: {
        flexDirection: 'row',
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    dialogButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dialogButtonDivider: {
        width: 0.5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    dialogButtonTextBlue: {
        fontSize: 17,
        fontFamily: 'Outfit_400Regular',
        color: '#0A84FF',
    },
    arrowContainer: {
        marginTop: -10,
        marginLeft: -80,
        transform: [{ rotate: '15deg' }],
    },
    footerSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    footerText: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    learnMoreText: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
});
