import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, withRepeat, withTiming, Easing, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import Svg, { Circle, Path, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

export const DaylightBar = React.memo(() => {
    const glowScale = useSharedValue(1);

    // Calculate tracker position based on current time
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const sunriseMinutes = 6 * 60 + 49; // 6:49 AM
    const sunsetMinutes = 17 * 60 + 10; // 5:10 PM
    const dayLength = sunsetMinutes - sunriseMinutes;

    // Progress from 0 (sunrise) to 1 (sunset)
    let progress = (currentMinutes - sunriseMinutes) / dayLength;
    progress = Math.max(0, Math.min(1, progress));

    // Determine if it's daytime
    const isDaytime = currentMinutes >= sunriseMinutes && currentMinutes <= sunsetMinutes;

    useEffect(() => {
        // Pulsing glow animation for the sun tracker
        glowScale.value = withRepeat(
            withTiming(1.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const glowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowScale.value }],
        opacity: interpolate(glowScale.value, [1, 1.3], [0.6, 0.2]),
    }));

    // Track dimensions for the arc
    // Container width (width - 48?) - gaps
    // In dashboard.tsx, paddingHorizontal might be 24?
    // Let's assume dashboard padding is 24 on each side -> 48 total.
    // daylightContainer has paddingHorizontal: 8.
    // So effective width for the bar?
    // Let's stick to the calculation used in snippet: width - 48 - (28 * 2) - (12 * 2)
    const trackWidth = width - 48 - (28 * 2) - (12 * 2);
    const trackHeight = 40;

    return (
        <View style={styles.daylightContainer}>
            {/* Main Daylight Bar */}
            <View style={styles.daylightBarWrapper}>
                {/* Sunrise Icon */}
                <View style={styles.sunIconContainer}>
                    <Svg width={28} height={28} viewBox="0 0 24 24">
                        <Circle cx="12" cy="18" r="4" fill="#FFB347" />
                        <Path d="M12 2v4M12 18v4M4.22 10.22l2.83 2.83M16.95 13.05l2.83 2.83M2 18h4M18 18h4M4.22 25.78l2.83-2.83M16.95 22.95l2.83-2.83" stroke="#FFB347" strokeWidth="1.5" strokeLinecap="round" />
                        <Path d="M4 18h16" stroke="#E0E0E0" strokeWidth="1" />
                    </Svg>
                    <Text style={styles.sunTimeSmall}>6:49</Text>
                </View>

                {/* Progress Arc Track */}
                <View style={[styles.daylightTrack, { height: trackHeight, backgroundColor: 'transparent' }]}>
                    <Svg width="100%" height={trackHeight} style={{ position: 'absolute' }}>
                        {/* Subtle Arc Path - Increased visibility */}
                        <Path
                            d={`M 0 ${trackHeight - 5} Q ${trackWidth / 2} -10 ${trackWidth} ${trackHeight - 5}`}
                            stroke="rgba(255,179,71,0.3)"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="4,6"
                        />

                        {/* Active Progress Path - Solid and more opaque */}
                        <Path
                            d={`M 0 ${trackHeight - 5} Q ${trackWidth / 2} -10 ${trackWidth} ${trackHeight - 5}`}
                            stroke="#FFB347"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={`${progress * (trackWidth * 1.15)}, 1000`}
                            opacity={0.8}
                        />

                        {/* Sun Tracker along the arc - Exact quadratic formula */}
                        {isDaytime && (
                            <G transform={`translate(${progress * trackWidth}, ${(1 - progress) ** 2 * (trackHeight - 5) + 2 * (1 - progress) * progress * (-10) + progress ** 2 * (trackHeight - 5)})`}>
                                <Circle r="14" fill="rgba(255,179,71,0.5)" />
                                <Circle r="8" fill="#FFB347" />
                                <Circle r="4" fill="#FFF" />
                            </G>
                        )}
                    </Svg>
                </View>

                {/* Sunset Icon */}
                <View style={styles.sunIconContainer}>
                    <Svg width={28} height={28} viewBox="0 0 24 24">
                        <Circle cx="12" cy="18" r="4" fill="#FF8C42" opacity={0.6} />
                        <Path d="M12 14v-4M4.22 10.22l2.83 2.83M16.95 13.05l2.83 2.83M2 18h4M18 18h4" stroke="#FF8C42" strokeWidth="1.5" strokeLinecap="round" opacity={0.6} />
                        <Path d="M4 18h16" stroke="#E0E0E0" strokeWidth="1" />
                    </Svg>
                    <Text style={styles.sunTimeSmall}>5:10</Text>
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    daylightContainer: {
        width: '100%',
        paddingHorizontal: 8,
        marginBottom: 8,
    },
    daylightBarWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sunIconContainer: {
        alignItems: 'center',
        gap: 4,
    },
    sunTimeSmall: {
        fontSize: 11,
        fontFamily: 'Outfit_600SemiBold',
        color: '#666',
    },
    daylightTrack: {
        flex: 1,
        height: 12,
        borderRadius: 6,
        overflow: 'visible',
        position: 'relative',
    },
});
