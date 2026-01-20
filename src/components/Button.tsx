import React from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { cn } from '@/lib/cn';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning';
  children: React.ReactNode;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  style?: ViewStyle;
}

export function Button({
  variant = 'primary',
  children,
  onPress,
  loading = false,
  disabled = false,
  className,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const gradients: Record<string, [string, string, ...string[]]> = {
    primary: ['#FFB347', '#FF8C00', '#FF6B35'],
    secondary: ['transparent', 'transparent'],
    tertiary: ['transparent', 'transparent'],
    success: ['#4ADE80', '#22C55E', '#16A34A'],
    warning: ['#FCD34D', '#F59E0B', '#D97706'],
  };

  const textColors = {
    primary: '#1A1A2E',
    secondary: '#FFB347',
    tertiary: '#FFB347',
    success: '#1A1A2E',
    warning: '#1A1A2E',
  } as const;

  const borderStyles = variant === 'secondary' ? {
    borderWidth: 2,
    borderColor: '#FFB347',
  } : {};

  const isDisabled = disabled || loading;

  const shadowStyles = variant === 'primary' ? {
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  } : {};

  return (
    <Animated.View style={[animatedStyle, { opacity: isDisabled ? 0.5 : 1 }, style]}>
      <Pressable
        onPress={isDisabled ? undefined : onPress}
        onPressIn={isDisabled ? undefined : handlePressIn}
        onPressOut={isDisabled ? undefined : handlePressOut}
        disabled={isDisabled}
      >
        <LinearGradient
          colors={gradients[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            {
              paddingVertical: 18,
              paddingHorizontal: 24,
              borderRadius: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            },
            borderStyles,
            shadowStyles,
          ]}
          className={cn(className)}
        >
          {loading ? (
            <ActivityIndicator color={textColors[variant]} />
          ) : (
            typeof children === 'string' ? (
              <Text
                style={{
                  color: textColors[variant],
                  fontSize: 16,
                  fontFamily: 'Outfit_700Bold',
                }}
              >
                {children}
              </Text>
            ) : (
              children
            )
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
