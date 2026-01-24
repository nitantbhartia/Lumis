import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    withRepeat,
    interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Lock, ArrowRight, CheckCircle, ArrowLeft, Smartphone, Ban, Sun, Flame } from 'lucide-react-native';
import { Apple } from 'lucide-react-native';
import { requestScreenTimeAuthorization, showAppPicker, LumisIcon } from '@/lib/screen-time';
import { useLumisStore } from '@/lib/state/lumis-store';
import { useAuthStore } from '@/lib/state/auth-store';
import { formatFirstName } from '@/lib/utils/name-utils';
import { LumisHeroButton } from '@/components/ui/LumisHeroButton';

const { height } = Dimensions.get('window');
const isSmallDevice = height < 750;

export default function OnboardingCommitmentScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isRequesting, setIsRequesting] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);

    const blockedApps = useLumisStore((s) => s.blockedApps);
    const scheduledWakeTime = useLumisStore((s) => s.scheduledWakeTime);
    const phoneReachTiming = useLumisStore((s) => s.phoneReachTiming);
    const socialLogin = useAuthStore((s) => s.socialLogin);
    const setUserName = useAuthStore((s) => s.setUserName);
    const userName = useAuthStore((s) => s.userName);
    const user = useAuthStore((s) => s.user);

    const activeApps = useMemo(() => blockedApps.filter((app) => app.isBlocked), [blockedApps]);
    const shieldedApps = useMemo(() => activeApps.slice(0, 5), [activeApps]);

    // Animations
    const lockScale = useSharedValue(1);
    const lockRotation = useSharedValue(0);
    const pulseValue = useSharedValue(0);

    useEffect(() => {
        pulseValue.value = withRepeat(
            withTiming(1, { duration: 2000 }),
            -1,
            true
        );
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(pulseValue.value, [0, 1], [1, 1.1]) }],
        opacity: interpolate(pulseValue.value, [0, 1], [0.2, 0.05]),
    }));

    const lockStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: lockScale.value },
            { rotate: `${lockRotation.value}deg` }
        ]
    }));

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleSelectApps = async () => {
        if (isRequesting) return;
        setIsRequesting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        try {
            const authResult = await requestScreenTimeAuthorization();
            if (authResult) {
                const pickerResult = await showAppPicker();
                if (pickerResult.success) {
                    await useLumisStore.getState().syncWithNativeBlockedApps();
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setIsLocked(true);
                    lockScale.value = withSequence(withSpring(1.2), withSpring(1));
                    lockRotation.value = withSequence(
                        withTiming(-8, { duration: 100 }),
                        withTiming(8, { duration: 100 }),
                        withTiming(0, { duration: 100 })
                    );
                }
            }
        } catch (e) {
            console.error('[Commitment] Error selecting apps:', e);
        } finally {
            setIsRequesting(false);
        }
    };

    const handleAppleSignIn = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsSigningIn(true);
        try {
            const isAvailable = await AppleAuthentication.isAvailableAsync();
            if (!isAvailable) {
                alert('Apple Sign In is not available');
                setIsSigningIn(false);
                return;
            }
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            const hasName = credential.fullName?.givenName;
            const fullName = hasName ? `${credential.fullName?.givenName} ${credential.fullName?.familyName || ''}`.trim() : null;

            // Set userName immediately if Apple provides it (only happens on first sign-in)
            if (fullName) {
                setUserName(fullName);
            }

            const result = await socialLogin({
                provider: 'apple',
                idToken: credential.identityToken!,
                email: credential.email,
                name: fullName || userName || undefined, // Pass existing userName if no new name
            });
            if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.push('/onboarding-permission-motion');
            }
        } catch (e: any) {
            if (e.code !== 'ERR_CANCELED') alert('Sign in failed. Please try again.');
        } finally {
            setIsSigningIn(false);
        }
    };

    // Always use light theme for consistent onboarding experience
    const gradientColors = ['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9'] as const;

    const firstName = formatFirstName(userName) || formatFirstName(user?.name);

    // Personalized context from diagnosis
    const getContextText = () => {
        if (phoneReachTiming === 'immediately' || phoneReachTiming === 'in_bed') {
            return 'Block the apps that hijack your mornings.';
        }
        return 'Choose which apps to lock until your reset is complete.';
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#87CEEB' }}>
            <LinearGradient
                colors={gradientColors}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFill}
            />

            {/* Back Button */}
            <View style={{ position: 'absolute', top: insets.top + 10, left: 20, zIndex: 10 }}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={24} color="#1A1A2E" />
                </Pressable>
            </View>

            <View
                style={{
                    flex: 1,
                    paddingTop: insets.top + 60,
                    paddingBottom: insets.bottom + 24,
                    paddingHorizontal: 28,
                    justifyContent: 'space-between',
                }}
            >
                {!isLocked ? (
                    /* ===== PRE-SELECTION STATE ===== */
                    <>
                        {/* Top Section */}
                        <View style={styles.topSection}>
                            {/* Lock Icon */}
                            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.iconContainer}>
                                <Animated.View style={[styles.iconPulseLight, pulseStyle]} />
                                <Animated.View style={[styles.iconInnerLight, lockStyle]}>
                                    <Lock size={40} color="#FF8C00" strokeWidth={1.5} />
                                </Animated.View>
                            </Animated.View>

                            {/* Headline */}
                            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                                <Text style={styles.headlineLight}>Choose Your{'\n'}Shield Apps</Text>
                                <Text style={styles.subtextLight}>{getContextText()}</Text>
                            </Animated.View>
                        </View>

                        {/* How it works - Simple */}
                        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.howItWorksLight}>
                            <View style={styles.howItWorksRow}>
                                <View style={styles.stepIconLight}>
                                    <Ban size={18} color="#DC2626" strokeWidth={2} />
                                </View>
                                <Text style={styles.howItWorksTextLight}>
                                    Apps stay <Text style={styles.textBoldLight}>locked</Text> each morning
                                </Text>
                            </View>
                            <View style={styles.howItWorksDividerLight} />
                            <View style={styles.howItWorksRow}>
                                <View style={styles.stepIconLight}>
                                    <Sun size={18} color="#FF8C00" strokeWidth={2} />
                                </View>
                                <Text style={styles.howItWorksTextLight}>
                                    <Text style={styles.textBoldLight}>Unlock</Text> after your daily outdoor light goal
                                </Text>
                            </View>
                            <View style={styles.howItWorksDividerLight} />
                            <View style={styles.howItWorksRow}>
                                <View style={styles.stepIconLight}>
                                    <Flame size={18} color="#FF6B35" strokeWidth={2} />
                                </View>
                                <Text style={styles.howItWorksTextLight}>
                                    Build <Text style={styles.textBoldLight}>streaks</Text> to strengthen your routine
                                </Text>
                            </View>
                        </Animated.View>

                        {/* CTA */}
                        <Animated.View entering={FadeInUp.delay(600).duration(500)}>
                            <LumisHeroButton
                                title={isRequesting ? 'Opening...' : 'Select Apps'}
                                onPress={handleSelectApps}
                                icon={<ArrowRight size={20} color="#1A1A2E" strokeWidth={2.5} />}
                                loading={isRequesting}
                                disabled={isRequesting}
                            />
                            <Text style={styles.hintLight}>You can change these anytime in settings</Text>
                        </Animated.View>
                    </>
                ) : (
                    /* ===== POST-SELECTION (SUCCESS) STATE ===== */
                    <>
                        {/* Success Content Card */}
                        <Animated.View entering={FadeIn.duration(500)} style={styles.successCard}>
                            {/* Checkmark Icon */}
                            <View style={styles.successIconContainer}>
                                <Animated.View style={[styles.successIconInner, lockStyle]}>
                                    <CheckCircle size={48} color="#22C55E" strokeWidth={2} fill="rgba(34, 197, 94, 0.2)" />
                                </Animated.View>
                            </View>

                            {/* Headline */}
                            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                                <Text style={styles.successHeadline}>
                                    Shield Active{firstName ? `, ${firstName}` : ''}
                                </Text>
                                <Text style={styles.successSubtext}>
                                    {activeApps.length} {activeApps.length === 1 ? 'app' : 'apps'} will be locked until you complete your morning light.
                                </Text>
                            </Animated.View>

                            {/* Shielded Apps Preview - Integrated */}
                            {shieldedApps.length > 0 && (
                                <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.appsPreview}>
                                    <View style={styles.appsDivider} />
                                    <Text style={styles.appsPreviewLabel}>SHIELDED APPS</Text>
                                    <View style={styles.appsRow}>
                                        {shieldedApps.map((app, idx) => (
                                            <View key={`${app.id}-${idx}`} style={styles.appIconWrapper}>
                                                {app.token ? (
                                                    <LumisIcon
                                                        style={{ width: 44, height: 44 }}
                                                        appName={app.name}
                                                        tokenData={app.tokenData || app.token}
                                                        isCategory={!!app.isCategory}
                                                        size={44}
                                                        grayscale={false}
                                                    />
                                                ) : (
                                                    <View style={styles.appIconPlaceholder}>
                                                        <Smartphone size={20} color="#666" />
                                                    </View>
                                                )}
                                            </View>
                                        ))}
                                        {activeApps.length > 5 && (
                                            <View style={[styles.appIconWrapper, styles.moreApps]}>
                                                <Text style={styles.moreAppsText}>+{activeApps.length - 5}</Text>
                                            </View>
                                        )}
                                    </View>
                                </Animated.View>
                            )}
                        </Animated.View>

                        {/* Spacer */}
                        <View style={{ flex: 1 }} />

                        {/* Apple Sign In / Continue */}
                        <Animated.View entering={FadeInUp.delay(600).duration(500)}>
                            <Pressable
                                onPress={user ? () => router.push('/onboarding-permission-motion') : handleAppleSignIn}
                                disabled={isSigningIn}
                                style={[
                                    styles.appleButton,
                                    isSigningIn && { opacity: 0.6 }
                                ]}
                            >
                                {!user && <Apple size={22} color="#FFFFFF" fill="#FFFFFF" />}
                                <Text style={styles.appleButtonText}>
                                    {isSigningIn ? 'Signing in...' : user ? 'Continue' : 'Continue with Apple'}
                                </Text>
                            </Pressable>
                            <Text style={styles.authHint}>
                                {user ? 'One more step to finish setup' : 'Save your progress & sync across devices'}
                            </Text>
                        </Animated.View>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    topSection: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    iconPulseLight: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FF8C00',
    },
    iconInnerLight: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    headlineLight: {
        fontSize: isSmallDevice ? 28 : 34,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
        textAlign: 'center',
        lineHeight: isSmallDevice ? 34 : 42,
    },
    subtextLight: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        color: '#64748B',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 22,
    },
    howItWorksLight: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    howItWorksRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepIconLight: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    howItWorksTextLight: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        color: '#64748B',
        lineHeight: 21,
    },
    textBoldLight: {
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
    },
    howItWorksDividerLight: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
        marginVertical: 14,
    },
    hintLight: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 14,
    },
    // Success State
    successCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    successIconContainer: {
        marginBottom: 20,
    },
    successIconInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(34, 197, 94, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#22C55E',
    },
    successHeadline: {
        fontSize: isSmallDevice ? 26 : 30,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
        textAlign: 'center',
        lineHeight: isSmallDevice ? 32 : 38,
    },
    successSubtext: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
        paddingHorizontal: 8,
    },
    appsPreview: {
        alignItems: 'center',
        width: '100%',
        marginTop: 8,
    },
    appsDivider: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
        width: '100%',
        marginVertical: 20,
    },
    appsPreviewLabel: {
        fontSize: 10,
        fontFamily: 'Outfit_700Bold',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 14,
    },
    appsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    appIconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.04)',
    },
    appIconPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreApps: {
        backgroundColor: '#F1F5F9',
    },
    moreAppsText: {
        fontSize: 14,
        fontFamily: 'Outfit_700Bold',
        color: '#64748B',
    },
    appleButton: {
        height: 58,
        backgroundColor: '#000000',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        overflow: 'hidden',
    },
    appleButtonText: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
    },
    authHint: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(0, 0, 0, 0.4)',
        textAlign: 'center',
        marginTop: 14,
    },
});
