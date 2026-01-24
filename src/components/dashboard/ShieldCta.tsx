import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, ArrowRight, Lock, Shield, Instagram, Video, Twitter, Facebook, Youtube, MessageCircle, Film, Ghost, LayoutGrid, Users, Gamepad2, Play, Palette, Clock, GraduationCap, ShoppingBag, Plane, Settings, Activity, BookOpen } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LumisHeroButton } from '@/components/ui/LumisHeroButton';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

interface ShieldCtaProps {
    onStartTracking: () => void;
    onManageShield: () => void;
    blockedApps: Array<{ name: string; isBlocked: boolean; id?: string; isCategory?: boolean }>;
    isCheckingLux: boolean;
    isGoalMet: boolean;
    progressPercent: number; // 0-100
}

const getAppIcon = (appName: string, size: number = 32, color?: string) => {
    const name = appName.toLowerCase();
    const iconColor = color || (name.includes('tik') ? '#000' : name.includes('insta') ? '#C13584' : '#666');

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

    // Calculate counts
    const appsCount = activeApps.filter(a => !a.isCategory).length;
    const categoriesCount = activeApps.filter(a => a.isCategory).length;
    const categories = activeApps.filter(a => a.isCategory);

    const getCategoryNamesPart = () => {
        if (categoriesCount === 1) return categories[0].name;
        if (categoriesCount === 2) return `${categories[0].name} & ${categories[1].name}`;
        return `${categoriesCount} categories`;
    };

    const getCompactLabel = () => {
        const catPart = getCategoryNamesPart();
        if (categoriesCount > 0 && appsCount > 0) return `${catPart}, ${appsCount} app${appsCount > 1 ? 's' : ''}`;
        if (categoriesCount > 0) return catPart;
        return `${appsCount} app${appsCount > 1 ? 's' : ''}`;
    };

    const getCtaLabel = () => {
        if (isCheckingLux) return 'Checking light...';
        return 'Start Morning Light';
    };

    const getLockedAppsLabel = () => {
        if (!activeApps.length || isGoalMet) return undefined;
        return `${activeApps.length} apps shielded`;
    };

    return (
        <View style={styles.container}>
            {/* 2. Main CTA Button (Consolidated) */}
            <View style={styles.mainCta}>
                <LumisHeroButton
                    title={getCtaLabel()}
                    subLabel={getLockedAppsLabel()}
                    onPress={onStartTracking}
                    icon={!isCheckingLux ? <Sun size={24} color="#1A1A2E" fill="#1A1A2E" /> : null}
                    loading={isCheckingLux}
                    disabled={isCheckingLux}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        gap: 12,
    },
    // Stack Styles
    stackContainer: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        overflow: 'hidden',
        marginHorizontal: 8,
    },
    stackContainerExpanded: {
        backgroundColor: 'rgba(255,255,255,1)',
    },
    collapsedStack: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 12,
    },
    iconStack: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stackIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    stackLabel: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
    },

    // Expanded View
    expandedGrid: {
        padding: 24,
    },
    expandedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    expandedTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
    },
    manageButton: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 14,
    },
    manageButtonText: {
        fontSize: 13,
        fontFamily: 'Outfit_700Bold',
        color: '#FF8C00',
    },
    appGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    gridItem: {
        alignItems: 'center',
        width: '20%',
        gap: 8,
    },
    navIconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: '#F8F8F8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridAppName: {
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
        color: '#444',
        textAlign: 'center',
    },

    // CTA Button
    mainCta: {
        width: '100%',
        height: 80,
        borderRadius: 32,
        shadowColor: '#FF8C00',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 12,
    },
    ctaPressed: {
        transform: [{ scale: 0.95 }],
    },
    ctaGradient: {
        flex: 1,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
    },
    ctaContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    ctaText: {
        fontSize: 22,
        fontFamily: 'Outfit_800ExtraBold',
        color: '#1A1A2E',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});
