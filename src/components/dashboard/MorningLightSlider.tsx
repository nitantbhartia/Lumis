import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedProps, withRepeat, withSequence } from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface MorningLightSliderProps {
    goalMinutes: number; // e.g. 16 or 22
    progressMinutes?: number;
    luxScore?: number; // Optional lux score to drive intensity
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const MorningLightSlider = React.memo(({ goalMinutes, progressMinutes = 0, luxScore = 1000 }: MorningLightSliderProps) => {
    // Animation for the arc length change
    const animatedGoal = useSharedValue(goalMinutes);

    // Pulse animation for the Lux Aura Dot
    const pulseOpacity = useSharedValue(0.6);
    const pulseRadius = useSharedValue(6);

    useEffect(() => {
        animatedGoal.value = withTiming(goalMinutes, { duration: 600, easing: Easing.out(Easing.ease) });
    }, [goalMinutes]);

    useEffect(() => {
        // Start breathing animation
        pulseOpacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        pulseRadius.value = withRepeat(
            withSequence(
                withTiming(9, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(6, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const trackWidth = width - 48; // Full width minus padding
    const trackHeight = 40;
    const MAX_minutes = 40;

    // Bezier Curve Control Points
    const P0 = { x: 10, y: trackHeight - 10 };
    const P1 = { x: trackWidth / 2, y: -10 };
    const P2 = { x: trackWidth - 10, y: trackHeight - 10 };

    // Function to calculate point on Quadratic Bezier curve at t (0-1)
    const getBezierPoint = (t: number) => {
        const x = Math.pow(1 - t, 2) * P0.x + 2 * (1 - t) * t * P1.x + Math.pow(t, 2) * P2.x;
        const y = Math.pow(1 - t, 2) * P0.y + 2 * (1 - t) * t * P1.y + Math.pow(t, 2) * P2.y;
        return { x, y };
    };

    // Calculate position for the Aura Dot based on LUX (Real-time hardware sensor)
    // Map Lux 0 -> 20,000 to the curve t (0 -> 1)
    // Logarithmic scale might be better? For now, linear up to a cap.
    const MAX_LUX = 20000;
    const luxT = Math.min(1, Math.max(0, luxScore / MAX_LUX));
    const dotPos = getBezierPoint(luxT);

    const animatedDotProps = useAnimatedProps(() => {
        return {
            opacity: pulseOpacity.value,
            r: pulseRadius.value,
        };
    });

    return (
        <View style={styles.container}>
            <View style={{ height: trackHeight, alignItems: 'center' }}>
                <Svg width={trackWidth} height={trackHeight}>
                    <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0" stopColor="#FFB347" stopOpacity="0.4" />
                            <Stop offset="1" stopColor="#FFB347" stopOpacity="1" />
                        </LinearGradient>
                        {/* Aura Glow Gradient */}
                        <LinearGradient id="auraGrad" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
                            <Stop offset="1" stopColor="#FFD700" stopOpacity="0.6" />
                        </LinearGradient>
                    </Defs>

                    {/* Background Track (faint) */}
                    <Path
                        d={`M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                    />

                    {/* Active Goal Arc */}
                    <Path
                        d={`M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`}
                        stroke="url(#grad)"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={[trackWidth * 1.2 * (goalMinutes / MAX_minutes), 1000]}
                    />

                    {/* Lux Aura Dot */}
                    <G x={dotPos.x} y={dotPos.y}>
                        {/* Outer Glow */}
                        <AnimatedCircle
                            cx={0}
                            cy={0}
                            fill="#FFD700"
                            animatedProps={animatedDotProps}
                        />
                        {/* Core */}
                        <Circle
                            cx={0}
                            cy={0}
                            r={4}
                            fill="#FFFFFF"
                            stroke="#FFB347"
                            strokeWidth={1}
                        />
                    </G>
                </Svg>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        marginBottom: 10,
        paddingHorizontal: 0,
    },
});
