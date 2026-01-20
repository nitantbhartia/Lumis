import React from 'react';
import { View, Pressable, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { cn } from '@/lib/cn';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'flat' | 'hero';
  glow?: boolean;
  glowColor?: string;
  className?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

export function GlassCard({
  children,
  variant = 'default',
  glow = false,
  glowColor = '#FFB347',
  className,
  style,
  onPress,
}: GlassCardProps) {
  const variantStyles = {
    default: {
      backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(22, 33, 62, 0.6)',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 228, 181, 0.2)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 6,
    },
    elevated: {
      backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(22, 33, 62, 0.8)',
      borderWidth: 2,
      borderColor: 'rgba(255, 228, 181, 0.3)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 12,
    },
    flat: {
      backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(22, 33, 62, 0.4)',
      borderWidth: 1,
      borderColor: 'rgba(255, 228, 181, 0.15)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 3,
    },
    hero: {
      backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(46, 59, 102, 0.8)',
      borderWidth: 2,
      borderColor: 'rgba(255, 179, 71, 0.4)',
      shadowColor: '#FFB347',
      shadowOffset: { width: 0, height: 15 },
      shadowOpacity: 0.3,
      shadowRadius: 30,
      elevation: 20,
    },
  };

  const glowStyle = glow ? {
    shadowColor: glowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  } : {};

  const combinedStyle: ViewStyle = {
    borderRadius: 16,
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
    ...variantStyles[variant],
    ...glowStyle,
    ...style,
  };

  const content = (
    <View style={combinedStyle} className={cn(className)}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={variant === 'elevated' || variant === 'hero' ? 30 : 15} tint="dark" style={{ borderRadius: 16, flex: 1 }}>
          <View style={{ padding: 20 }}>
            {children}
          </View>
        </BlurView>
      ) : (
        <View style={{ padding: 20 }}>
          {children}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:scale-98">
        {content}
      </Pressable>
    );
  }

  return content;
}
