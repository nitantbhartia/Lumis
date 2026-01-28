import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LucideIcon } from 'lucide-react-native';

interface TimelineStepProps {
  number: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  isLast?: boolean;
  delay?: number;
}

export function TimelineStep({
  number,
  title,
  subtitle,
  icon: Icon,
  isLast = false,
  delay = 0,
}: TimelineStepProps) {
  return (
    <View style={styles.container}>
      {/* Left side: Number circle and line */}
      <View style={styles.leftColumn}>
        <Animated.View
          entering={FadeIn.delay(delay).duration(300)}
          style={styles.numberCircle}
        >
          <Text style={styles.numberText}>{number}</Text>
        </Animated.View>
        {!isLast && (
          <Animated.View
            entering={FadeIn.delay(delay + 100).duration(400)}
            style={styles.line}
          />
        )}
      </View>

      {/* Right side: Content card */}
      <Animated.View
        entering={FadeInRight.delay(delay + 50).duration(400)}
        style={styles.card}
      >
        <View style={styles.iconContainer}>
          <Icon size={20} color="#FF6B35" strokeWidth={2.5} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 100,
  },
  leftColumn: {
    width: 56,
    alignItems: 'center',
  },
  numberCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  numberText: {
    fontSize: 24,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
  },
  line: {
    flex: 1,
    width: 3,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    marginVertical: 8,
    borderRadius: 1.5,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginLeft: 16,
    marginBottom: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    lineHeight: 20,
  },
});
