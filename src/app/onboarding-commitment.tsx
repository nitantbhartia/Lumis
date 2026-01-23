import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
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
import { Shield, Lock, ArrowRight, CheckCircle, ArrowLeft, Instagram, Video, Twitter, Facebook, Youtube, MessageCircle, Film, Ghost, Hand, Users, Gamepad2, Play, Palette, Clock, GraduationCap, ShoppingBag, Plane, Settings, Activity, BookOpen } from 'lucide-react-native';
import { Apple } from 'lucide-react-native';
import { requestScreenTimeAuthorization, showAppPicker, LumisIcon } from '@/lib/screen-time';
import { useLumisStore } from '@/lib/state/lumis-store';
import { useAuthStore } from '@/lib/state/auth-store';
import { formatFirstName } from '@/lib/utils/name-utils';
import { LumisHeroButton } from '@/components/ui/LumisHeroButton';

const { width } = Dimensions.get('window');

// Helper to get app icon
const getAppIcon = (appName: string, size: number = 24, color?: string) => {
    const name = appName.toLowerCase();
    const iconColor = color || '#666';

    // Specific app icons
    if (name.includes('insta')) return <Instagram size={size} color={iconColor} />;
    if (name.includes('tik')) return <Video size={size} color={iconColor} />;
    if (name.includes('twitter') || name.includes('x')) return <Twitter size={size} color={iconColor} />;
    if (name.includes('face')) return <Facebook size={size} color={iconColor} />;
    if (name.includes('you')) return <Youtube size={size} color={iconColor} />;
    if (name.includes('reddit')) return <MessageCircle size={size} color={iconColor} />;
    if (name.includes('snap')) return <Ghost size={size} color={iconColor} />;
    if (name.includes('netflix')) return <Film size={size} color={iconColor} />;

    // Category specific icons
    if (name.includes('social')) return <Users size={size} color={iconColor} />;
    if (name.includes('game')) return <Gamepad2 size={size} color={iconColor} />;
    if (name.includes('entertain')) return <Play size={size} color={iconColor} />;
    if (name.includes('creativ')) return <Palette size={size} color={iconColor} />;
    if (name.includes('productiv') || name.includes('finance')) return <Clock size={size} color={iconColor} />;
    if (name.includes('educat')) return <GraduationCap size={size} color={iconColor} />;
    if (name.includes('shop') || name.includes('food')) return <ShoppingBag size={size} color={iconColor} />;
    if (name.includes('travel')) return <Plane size={size} color={iconColor} />;
    if (name.includes('utilit')) return <Settings size={size} color={iconColor} />;
    if (name.includes('health') || name.includes('fit')) return <Activity size={size} color={iconColor} />;
    if (name.includes('read') || name.includes('info')) return <BookOpen size={size} color={iconColor} />;

    if (name.includes('layer') || name.includes('category')) return <Shield size={size} color={iconColor} />;
    return <Lock size={size} color={iconColor} />;
};

const CONTRACT_CLAUSES = [
    {
        id: 'shield',
        icon: Shield,
        title: 'Empower Focus',
        body: 'Select the apps Lumis will guard until you\'re biologically ready.',
        color: '#FFB347'
    },
    {
        id: 'bargain',
        icon: Hand,
        title: 'End the Bargaining',
        body: 'Deciding now removes the willpower struggle tomorrow morning.',
        color: '#60A5FA'
    },
    {
        id: 'unlock',
        icon: CheckCircle,
        title: 'Biological Unlock',
        body: 'Your apps return once you\'ve hit your light target.',
        color: '#4ADE80'
    }
];

export default function OnboardingCommitmentScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isRequesting, setIsRequesting] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);

    const blockedApps = useLumisStore((s) => s.blockedApps);
    const setBlockedApps = useLumisStore((s) => s.setBlockedApps);
    const scheduledWakeTime = useLumisStore((s) => s.scheduledWakeTime);
    const socialLogin = useAuthStore((s) => s.socialLogin);
    const setUserName = useAuthStore((s) => s.setUserName);
    const userName = useAuthStore((s) => s.userName);
    const user = useAuthStore((s) => s.user);

    const activeApps = useMemo(() => blockedApps.filter((app) => app.isBlocked), [blockedApps]);
    const appsCount = useMemo(() => activeApps.filter(a => !a.isCategory).length, [activeApps]);
    const categoriesCount = useMemo(() => activeApps.filter(a => a.isCategory).length, [activeApps]);

    const getShieldingText = () => {
        const categories = activeApps.filter(a => a.isCategory);
        let categoryPart = '';

        if (categoriesCount === 1) {
            categoryPart = categories[0].name || 'Category';
        } else if (categoriesCount === 2) {
            const name1 = categories[0].name || 'Category';
            const name2 = categories[1].name || 'Category';
            if (name1 === name2) {
                categoryPart = `2 categories`;
            } else {
                categoryPart = `${name1} & ${name2}`;
            }
        } else if (categoriesCount > 2) {
            categoryPart = `${categoriesCount} categories`;
        }

        if (categoriesCount > 0 && appsCount > 0) {
            return `${categoryPart} & ${appsCount} app${appsCount > 1 ? 's' : ''} are now shielded.`;
        } else if (categoriesCount > 0) {
            return `${categoryPart} are now shielded.`;
        } else {
            return `${appsCount} app${appsCount > 1 ? 's' : ''} are now shielded.`;
        }
    };

    const displayText = isLocked ? (`${getShieldingText()} Your morning is protected.`) : '';
    const shieldedApps = useMemo(() => activeApps.slice(0, 6), [activeApps]);

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
        transform: [{ scale: interpolate(pulseValue.value, [0, 1], [1, 1.15]) }],
        opacity: interpolate(pulseValue.value, [0, 1], [0.15, 0.05]),
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
                    const updatedApps = pickerResult.toggles.map((t, index) => ({
                        id: `${t.name.toLowerCase().replace(/\s+/g, '_')}_${index}`,
                        name: t.name,
                        icon: t.isCategory ? 'layers' : 'shield',
                        isBlocked: t.isEnabled,
                        isCategory: t.isCategory,
                        token: t.token
                    }));
                    if (updatedApps.length > 0) {
                        setBlockedApps(updatedApps);
                    }
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setIsLocked(true);
                    lockScale.value = withSequence(withSpring(1.3), withSpring(1));
                    lockRotation.value = withSequence(
                        withTiming(-10, { duration: 100 }),
                        withTiming(10, { duration: 100 }),
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
            const result = await socialLogin({
                provider: 'apple',
                idToken: credential.identityToken!,
                email: credential.email,
                name: fullName || undefined,
            });
            if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                if (fullName) setUserName(fullName);
                router.push('/onboarding-permission-motion');
            }
        } catch (e: any) {
            if (e.code !== 'ERR_CANCELED') alert('Sign in failed. Please try again.');
        } finally {
            setIsSigningIn(false);
        }
    };

    const gradientColors = isLocked
        ? ['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9'] as const
        : ['#1E2030', '#2D3A4F', '#4A5568'] as const; // Slightly brighter than previous screen

    const firstName = formatFirstName(userName) || formatFirstName(user?.name);

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={gradientColors}
                locations={isLocked ? [0, 0.3, 0.7, 1] : undefined}
                style={{ flex: 1 }}
            >
                <View style={{ position: 'absolute', top: insets.top + 10, left: 20, zIndex: 10 }}>
                    <Pressable onPress={handleBack} style={[styles.backButton, isLocked && { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
                        <ArrowLeft size={24} color={isLocked ? '#1A1A2E' : '#FFF'} />
                    </Pressable>
                </View>

                <Animated.ScrollView
                    entering={FadeIn.duration(800)}
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingTop: insets.top + (isLocked ? 40 : 20),
                        paddingBottom: insets.bottom + 40,
                        paddingHorizontal: 32,
                        justifyContent: 'space-between',
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        <View style={styles.visualContainer}>
                            <Animated.View style={[styles.shieldPulse, !isLocked && pulseStyle]} />
                            <Animated.View style={[
                                styles.shieldIcon,
                                lockStyle,
                                isLocked && styles.shieldIconLocked
                            ]}>
                                {isLocked ? (
                                    <CheckCircle size={64} color="#22C55E" strokeWidth={1.5} />
                                ) : (
                                    <Shield size={64} color="#FFB347" strokeWidth={1.5} />
                                )}
                            </Animated.View>
                        </View>

                        <Animated.Text
                            entering={FadeInDown.delay(200).duration(600)}
                            style={[styles.header, isLocked && styles.headerLocked]}
                        >
                            {isLocked
                                ? `Your Protocol\nis Active, ${firstName || 'Nitant'}.`
                                : 'Seal Your\nMorning Contract.'
                            }
                        </Animated.Text>
                    </View>

                    {/* Clauses vs Success Summary */}
                    <View style={styles.contentSection}>
                        {!isLocked ? (
                            <View style={styles.clausesContainer}>
                                {CONTRACT_CLAUSES.map((clause, index) => {
                                    const ClauseIcon = clause.icon;
                                    return (
                                        <Animated.View
                                            key={clause.id}
                                            entering={FadeInDown.delay(400 + index * 100).duration(600)}
                                        >
                                            <BlurView intensity={20} tint="light" style={styles.clauseCard}>
                                                <View style={[styles.clauseIconWrapper, { backgroundColor: `${clause.color}20` }]}>
                                                    <ClauseIcon size={20} color={clause.color} strokeWidth={2.5} />
                                                </View>
                                                <View style={styles.clauseText}>
                                                    <Text style={styles.clauseTitle}>{clause.title}</Text>
                                                    <Text style={styles.clauseBody}>{clause.body}</Text>
                                                </View>
                                            </BlurView>
                                        </Animated.View>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={styles.successSummary}>
                                <Animated.Text entering={FadeInDown.delay(400)} style={styles.successMessage}>
                                    {displayText}
                                </Animated.Text>

                                {shieldedApps.length > 0 && (
                                    <Animated.View entering={FadeInDown.delay(500)} style={styles.shieldPreview}>
                                        <Text style={styles.shieldPreviewLabel}>GUARDING TOMORROW</Text>
                                        <View style={styles.appIconsStack}>
                                            {shieldedApps.map((app, idx) => (
                                                <View key={`${app.id}-${idx}`} style={[styles.stackAppIcon, { zIndex: 10 - idx, marginLeft: idx === 0 ? 0 : -10 }]}>
                                                    {app.token ? (
                                                        <LumisIcon
                                                            style={{ width: 18, height: 18 }}
                                                            iconProps={{
                                                                tokenData: app.token,
                                                                isCategory: !!app.isCategory,
                                                                size: 18,
                                                                grayscale: false
                                                            }}
                                                        />
                                                    ) : getAppIcon(app.name, 18, '#555')}
                                                </View>
                                            ))}
                                            {activeApps.length > 6 && (
                                                <View style={[styles.stackAppIcon, { zIndex: 0, marginLeft: -10, backgroundColor: '#EEE' }]}>
                                                    <Text style={styles.stackPlusText}>+{activeApps.length - 6}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </Animated.View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Interaction Section */}
                    <View style={styles.actionSection}>
                        {!isLocked ? (
                            <Animated.View entering={FadeInUp.delay(800).duration(600)}>
                                <LumisHeroButton
                                    title={isRequesting ? 'Readying Shield...' : 'Select My Shielded Apps'}
                                    onPress={handleSelectApps}
                                    icon={<Lock size={20} color="#1A1A2E" strokeWidth={2.5} />}
                                    loading={isRequesting}
                                    disabled={isRequesting}
                                />
                                <Text style={styles.commitmentHint}>I commit to my morning focus</Text>
                            </Animated.View>
                        ) : (
                            <Animated.View entering={FadeInUp.delay(600)} style={styles.authContainer}>
                                <Pressable
                                    onPress={user ? () => router.push('/onboarding-permission-motion') : handleAppleSignIn}
                                    disabled={isSigningIn}
                                >
                                    <View style={[styles.appleSignIn, isSigningIn && { opacity: 0.6 }]}>
                                        {user ? null : <Apple size={22} color="#FFF" fill="#FFF" />}
                                        <Text style={styles.appleSignInText}>
                                            {isSigningIn ? 'Signing in...' : user ? 'Enter Lumis' : 'Continue with Apple'}
                                        </Text>
                                    </View>
                                </Pressable>
                                <Text style={styles.authCaption}>
                                    {user ? 'Your protocol is ready.' : 'Secure your settings and sync dashboard.'}
                                </Text>
                            </Animated.View>
                        )}
                    </View>
                </Animated.ScrollView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    heroSection: {
        alignItems: 'center',
        gap: 16,
    },
    visualContainer: {
        height: 140,
        width: 140,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shieldPulse: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#FFB347',
    },
    shieldIcon: {
        width: 110,
        height: 110,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 179, 71, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 179, 71, 0.3)',
    },
    shieldIconLocked: {
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        borderColor: 'rgba(74, 222, 128, 0.3)',
    },
    header: {
        fontSize: 32,
        fontFamily: 'Outfit_700Bold',
        color: '#FFF',
        textAlign: 'center',
        lineHeight: 40,
    },
    headerLocked: {
        color: '#1A1A2E',
    },
    contentSection: {
        marginVertical: 20,
    },
    clausesContainer: {
        gap: 12,
    },
    clauseCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
    },
    clauseIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    clauseText: {
        flex: 1,
    },
    clauseTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        color: '#FFF',
        marginBottom: 2,
    },
    clauseBody: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 18,
    },
    successSummary: {
        alignItems: 'center',
        gap: 20,
    },
    successMessage: {
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
        color: '#333',
        textAlign: 'center',
        lineHeight: 24,
    },
    shieldPreview: {
        alignItems: 'center',
        gap: 10,
    },
    shieldPreviewLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_700Bold',
        color: 'rgba(0,0,0,0.4)',
        letterSpacing: 1.5,
    },
    appIconsStack: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stackAppIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.5,
        borderColor: '#DDD',
    },
    stackPlusText: {
        fontSize: 10,
        fontFamily: 'Outfit_700Bold',
        color: '#666',
    },
    actionSection: {
        marginTop: 10,
    },
    ctaButton: {
        height: 72,
        borderRadius: 36,
        overflow: 'hidden',
        shadowColor: '#FFB347',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 8,
    },
    ctaGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    ctaText: {
        fontSize: 18,
        fontFamily: 'Outfit_800ExtraBold',
        color: '#1A1A2E',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    ctaPressed: {
        transform: [{ scale: 0.97 }],
    },
    commitmentHint: {
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        marginTop: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    appleSignIn: {
        height: 64,
        backgroundColor: '#000',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    appleSignInText: {
        fontSize: 20,
        fontFamily: 'Outfit_500Medium',
        color: '#FFF',
    },
    authContainer: {
        gap: 16,
    },
    authCaption: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(0,0,0,0.5)',
        textAlign: 'center',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
