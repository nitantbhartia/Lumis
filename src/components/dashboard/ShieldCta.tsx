import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, ArrowRight, Lock, Instagram, Video, Twitter, Facebook, Youtube, MessageCircle, Film, Ghost, LayoutGrid } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

interface ShieldCtaProps {
    onStartTracking: () => void;
    onManageShield: () => void;
    blockedApps: Array<{ name: string; isBlocked: boolean; id?: string }>;
    isCheckingLux: boolean;
    isGoalMet: boolean;
    progressPercent: number; // 0-100
}

const getAppIcon = (appName: string, size: number = 32, color?: string) => {
    const name = appName.toLowerCase();
    const iconColor = color || (name.includes('tik') ? '#000' : name.includes('insta') ? '#C13584' : '#666');

    if (name.includes('insta')) return <Instagram size={size} color={iconColor} />;
    if (name.includes('tik')) return <Video size={size} color={iconColor} />;
    if (name.includes('twitter') || name.includes('x')) return <Twitter size={size} color={iconColor} />;
    if (name.includes('face')) return <Facebook size={size} color={iconColor} />;
    if (name.includes('you')) return <Youtube size={size} color={iconColor} />;
    if (name.includes('reddit')) return <MessageCircle size={size} color={iconColor} />;
    if (name.includes('snap')) return <Ghost size={size} color={iconColor} />;
    if (name.includes('netflix')) return <Film size={size} color={iconColor} />;

    return <Lock size={size} color={iconColor} />;
};

export const ShieldCta = ({
    onStartTracking,
    onManageShield,
    blockedApps,
    isCheckingLux,
    isGoalMet,
    progressPercent
}: ShieldCtaProps) => {
    const [isAppsExpanded, setIsAppsExpanded] = useState(false);
    const activeApps = blockedApps.filter(a => a.isBlocked);
    const router = useRouter();

    const toggleExpand = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        setIsAppsExpanded(!isAppsExpanded);
    };

    // Logic for icon "Power Up" state (grayscale to color)
    // If progress < 100, icons are likely "locked" -> Grayscale or Dimmed?
    // Design: "Monochrome or dimmed. As progress approaches 100%, icons animate to full color."
    const isPoweredUp = progressPercent >= 100;

    return (
        <View style={styles.container}>
            {/* 1. Shielded Apps Interactive Stack */}
            {activeApps.length > 0 && !isGoalMet && (
                <Pressable
                    style={[styles.stackContainer, isAppsExpanded && styles.stackContainerExpanded]}
                    onPress={toggleExpand}
                >
                    {isAppsExpanded ? (
                        // EXPANDED GRID VIEW
                        <View style={styles.expandedGrid}>
                            <View style={styles.expandedHeader}>
                                <Text style={styles.expandedTitle}>Shielded Apps</Text>
                                <Pressable style={styles.manageButton} onPress={onManageShield}>
                                    <Text style={styles.manageButtonText}>Manage</Text>
                                </Pressable>
                            </View>
                            <View style={styles.appGrid}>
                                {activeApps.map((app, index) => (
                                    <View key={index} style={styles.gridItem}>
                                        <View style={styles.navIconWrapper}>
                                            {getAppIcon(app.name, 28, isPoweredUp ? undefined : '#888')}
                                        </View>
                                        <Text style={styles.gridAppName} numberOfLines={1}>
                                            {app.name}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : (
                        // COLLAPSED STACK VIEW
                        <View style={styles.collapsedStack}>
                            <View style={styles.iconStack}>
                                {activeApps.slice(0, 4).map((app, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.stackIconWrapper,
                                            {
                                                zIndex: 4 - index,
                                                marginLeft: index === 0 ? 0 : -12,
                                                opacity: isPoweredUp ? 1 : 0.7
                                            }
                                        ]}
                                    >
                                        {getAppIcon(app.name, 24, isPoweredUp ? undefined : '#555')}
                                    </View>
                                ))}
                                {activeApps.length > 4 && (
                                    <View style={[styles.stackIconWrapper, { zIndex: 0, marginLeft: -12, backgroundColor: '#EEE' }]}>
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#666' }}>+{activeApps.length - 4}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.stackLabel}>
                                {isPoweredUp ? "Apps Unlocked" : `${activeApps.length} apps locked`}
                            </Text>
                        </View>
                    )}
                </Pressable>
            )}

            {/* 2. Main CTA Button */}
            <Pressable
                style={({ pressed }) => [styles.mainCta, pressed && styles.ctaPressed]}
                onPress={onStartTracking}
            >
                <LinearGradient
                    colors={['#FFC77D', '#FF8C00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.ctaGradient}
                >
                    <View style={styles.ctaContent}>
                        <Sun size={24} color="#1A1A2E" fill="#1A1A2E" />
                        <Text style={styles.ctaText}>
                            {isCheckingLux ? 'Checking light...' :
                                activeApps.length > 0 && !isGoalMet
                                    ? `Unlock ${activeApps.length} apps`
                                    : 'Get your morning light'}
                        </Text>
                    </View>
                    {!isCheckingLux && <ArrowRight size={24} color="#1A1A2E" strokeWidth={2} />}
                </LinearGradient>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 20, // Match Dashboard padding
        gap: 16,
        marginBottom: 40,
    },
    // Stack Styles
    stackContainer: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        overflow: 'hidden',
    },
    stackContainerExpanded: {
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    collapsedStack: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    iconStack: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stackIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    stackLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#4A5568',
    },

    // Expanded View
    expandedGrid: {
        padding: 20,
    },
    expandedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    expandedTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
    },
    manageButton: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    manageButtonText: {
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
        color: '#666',
    },
    appGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    gridItem: {
        alignItems: 'center',
        width: '20%', // approx 4 per row
        gap: 6,
    },
    navIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridAppName: {
        fontSize: 10,
        fontFamily: 'Outfit_500Medium',
        color: '#666',
        textAlign: 'center',
    },

    // CTA Button
    mainCta: {
        width: '100%',
        height: 64,
        borderRadius: 32,
        shadowColor: '#FF8C00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    ctaPressed: {
        transform: [{ scale: 0.98 }],
    },
    ctaGradient: {
        flex: 1,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
    },
    ctaContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ctaText: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
        letterSpacing: 0.5,
    },
});
