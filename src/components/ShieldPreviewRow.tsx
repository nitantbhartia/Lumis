import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing, interpolate } from 'react-native-reanimated';
import { Shield } from 'lucide-react-native';
import { LumisIcon } from '@/lib/screen-time';

const AnimatedView = Animated.createAnimatedComponent(View);

interface ShieldPreviewRowProps {
    activeApps: any[];
    lux?: number;
}

export const ShieldPreviewRow = ({ activeApps, lux = 0 }: ShieldPreviewRowProps) => {
    const breathOpacity = useSharedValue(0.6);

    useEffect(() => {
        breathOpacity.value = withRepeat(
            withSequence(
                withTiming(0.8, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const breathStyle = useAnimatedStyle(() => ({
        opacity: breathOpacity.value
    }));

    // Dynamic Amber Glow based on Lux
    const glowStyle = useAnimatedStyle(() => {
        const intensity = interpolate(lux, [0, 5000], [0, 1], 'clamp');
        return {
            shadowOpacity: interpolate(intensity, [0, 1], [0, 0.6]),
            shadowRadius: interpolate(intensity, [0, 1], [0, 20]),
        };
    });

    return (
        <AnimatedView style={[styles.shieldRowContainer, breathStyle, styles.glowContainer, glowStyle]}>
            <Text style={styles.shieldLabel}>SHIELD ACTIVE • {activeApps.length} APPS</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconScrollContent}
                style={styles.iconScroll}
            >
                {activeApps.map((app, index) => (
                    <View key={`${app.id}-${index}`} style={styles.shieldIconWrapper}>
                        {app.token ? (
                            <LumisIcon
                                style={{ width: 24, height: 24 }}
                                iconProps={{
                                    tokenData: app.token,
                                    isCategory: !!app.isCategory,
                                    size: 24,
                                    grayscale: true
                                }}
                            />
                        ) : (
                            <Shield size={24} color="#888" />
                        )}
                    </View>
                ))}
            </ScrollView>
        </AnimatedView>
    );
};

const styles = StyleSheet.create({
    shieldRowContainer: {
        alignItems: 'center',
        gap: 12,
        width: '100%',
    },
    glowContainer: {
        shadowColor: '#FFB347',
        shadowOffset: { width: 0, height: 0 },
    },
    shieldLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_600SemiBold',
        color: 'rgba(255, 255, 255, 0.6)',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    iconScroll: {
        maxHeight: 40,
    },
    iconScrollContent: {
        paddingHorizontal: 24,
        gap: 16,
        alignItems: 'center',
        minWidth: '100%',
        justifyContent: 'center',
    },
    shieldIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Glassy container for icon
        alignItems: 'center',
        justifyContent: 'center',
    },
});
