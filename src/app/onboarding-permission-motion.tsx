import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Footprints } from 'lucide-react-native';
import { healthService } from '@/lib/health';
import { LumisHeroButton } from '@/components/ui/LumisHeroButton';

export default function OnboardingPermissionMotionScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isRequesting, setIsRequesting] = useState(false);

    const handleAllow = async () => {
        if (isRequesting) return;
        setIsRequesting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            await healthService.requestPermissions();
        } catch (e) {
            console.log('[Motion Permission] Error:', e);
        }

        // Navigate to location permission
        router.push('/onboarding-permission-location');
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
                            <Footprints size={48} color="#1A1A2E" strokeWidth={1.5} />
                        </View>
                    </Animated.View>

                    {/* Title & Description */}
                    <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.textContainer}>
                        <Text style={styles.title}>Track your movement</Text>
                        <Text style={styles.description}>
                            This helps us verify you're actually outside walking, not just leaving your phone in a sunny spot.
                        </Text>
                    </Animated.View>

                    {/* Spacer */}
                    <View style={{ flex: 1 }} />

                    {/* Buttons */}
                    <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.buttonsContainer}>
                        <View style={styles.allowButtonContainer}>
                            <LumisHeroButton
                                title={isRequesting ? 'Requesting...' : 'Allow Motion Access'}
                                onPress={handleAllow}
                                icon={<Footprints size={20} color="#1A1A2E" strokeWidth={2.5} />}
                                loading={isRequesting}
                                disabled={isRequesting}
                            />
                        </View>

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
        color: '#FFFFFF',
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
        color: '#FFFFFF',
    },
});
