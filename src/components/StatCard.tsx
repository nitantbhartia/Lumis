import React, { useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useDerivedValue
} from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { SkeletonLoader } from './SkeletonLoader';
import { LucideIcon } from 'lucide-react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface StatCardProps {
  variant?: 'primary' | 'secondary' | 'hero';
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  label: string;
  value: number;
  subtitle?: string;
  loading?: boolean;
  onPress?: () => void;
}

export function StatCard({
  variant = 'secondary',
  icon: Icon,
  iconColor,
  iconBgColor,
  label,
  value,
  subtitle,
  loading = false,
  onPress,
}: StatCardProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    if (!loading) {
      animatedValue.value = withTiming(value, {
        duration: 1000,
        easing: Easing.out(Easing.exp),
      });
    }
  }, [value, loading]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: `${Math.round(animatedValue.value)}`,
    } as any;
  });

  if (loading) {
    return <SkeletonLoader variant="stat" />;
  }

  const isPrimary = variant === 'primary' || variant === 'hero';

  return (
    <GlassCard
      variant={variant === 'hero' ? 'hero' : (isPrimary ? 'elevated' : 'default')}
      glow={isPrimary}
      glowColor={iconColor}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-2 mb-md">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center p-2"
          style={{ backgroundColor: iconBgColor }}
        >
          <Icon size={20} color={iconColor} strokeWidth={2.2} />
        </View>
        <Text
          className="text-lumis-sunrise/50 text-[10px] uppercase tracking-widest flex-1"
          style={{ fontFamily: 'Outfit_700Bold' }}
        >
          {label}
        </Text>
      </View>

      <View className="flex-row items-baseline gap-1">
        <AnimatedTextInput
          underlineColorAndroid="transparent"
          editable={false}
          value={`${value}`}
          animatedProps={animatedProps}
          className={variant === 'hero' ? 'text-5xl text-lumis-dawn' : 'text-3xl text-lumis-dawn'}
          style={{ fontFamily: 'Syne_700Bold', padding: 0 }}
        />
        {subtitle && (
          <Text
            className="text-lumis-sunrise/30 text-[10px] uppercase tracking-wider"
            style={{ fontFamily: 'Outfit_600SemiBold' }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </GlassCard>
  );
}
