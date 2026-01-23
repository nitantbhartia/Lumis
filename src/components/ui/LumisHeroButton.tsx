import React from 'react';
import { Text, View, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface LumisHeroButtonProps {
    title: string;
    subLabel?: string;
    icon?: React.ReactNode;
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
    loading?: boolean;
}

export function LumisHeroButton({ title, subLabel, icon, onPress, style, disabled, loading }: LumisHeroButtonProps) {
    const scale = useSharedValue(1);

    // Breathing animation setup
    React.useEffect(() => {
        if (!disabled && !loading) {
            scale.value = withRepeat(
                withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                -1,
                true // reverse
            );
        } else {
            scale.value = withTiming(1);
        }
    }, [disabled, loading]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        // Pause breathing on press
        scale.value = withSpring(0.97);
    };

    const handlePressOut = () => {
        // Resume breathing
        if (!disabled && !loading) {
            scale.value = withRepeat(
                withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        } else {
            scale.value = withSpring(1);
        }
    };

    const handlePress = () => {
        if (disabled || loading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    return (
        <Animated.View style={[styles.container, style, animatedStyle]}>
            <Pressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                style={styles.pressable}
            >
                <LinearGradient
                    colors={disabled ? ['#E0E0E0', '#D0D0D0'] : ['#FFB347', '#FF8C00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.gradient}
                >
                    {/* Leading Icon */}
                    <View style={styles.iconContainer}>
                        {icon}
                    </View>

                    {/* Centered Title & SubLabel */}
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={[styles.title, disabled && styles.titleDisabled]}>
                            {loading ? 'Processing...' : title}
                        </Text>
                        {!!subLabel && !loading && (
                            <Text style={styles.subLabel}>
                                {subLabel}
                            </Text>
                        )}
                    </View>

                    {/* Trailing Arrow Well */}
                    <View style={styles.arrowWell}>
                        <ArrowRight size={20} color={disabled ? '#A0A0A0' : '#1A1A2E'} strokeWidth={2.5} />
                    </View>
                </LinearGradient>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 75,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    pressable: {
        flex: 1,
        borderRadius: 37.5,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    iconContainer: {
        width: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    title: {
        textAlign: 'center',
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
    },
    subLabel: {
        textAlign: 'center',
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: 'rgba(26, 26, 46, 0.7)',
        marginTop: -2,
    },
    titleDisabled: {
        color: '#888',
    },
    arrowWell: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
