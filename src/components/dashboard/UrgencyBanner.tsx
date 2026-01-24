import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sun, Clock, Zap, CloudSun, Cloud } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface UrgencyBannerProps {
  hoursSinceSunrise: number;
  weatherCondition?: string;
  goalMinutes: number;
  baseGoalMinutes: number;
  isGoalMet: boolean;
  remainingMinutes?: number;
}

type UrgencyLevel = 'optimal' | 'good' | 'closing' | 'late';

export function UrgencyBanner({
  hoursSinceSunrise,
  weatherCondition,
  goalMinutes,
  baseGoalMinutes,
  isGoalMet,
  remainingMinutes,
}: UrgencyBannerProps) {
  if (isGoalMet) {
    return null;
  }

  const getUrgencyLevel = (): UrgencyLevel => {
    if (hoursSinceSunrise < 2) return 'optimal';
    if (hoursSinceSunrise < 4) return 'good';
    if (hoursSinceSunrise < 6) return 'closing';
    return 'late';
  };

  const urgencyLevel = getUrgencyLevel();

  const minutesText = remainingMinutes
    ? `${Math.round(remainingMinutes)} min`
    : `${Math.round(goalMinutes)} min`;

  const getUrgencyConfig = () => {
    switch (urgencyLevel) {
      case 'optimal':
        return {
          icon: Sun,
          iconColor: '#FFB347',
          message: `Go outside for ${minutesText}`,
          subtext: 'Optimal morning light window — unlock your apps!',
          bgColor: 'rgba(255, 179, 71, 0.12)',
          borderColor: 'rgba(255, 179, 71, 0.25)',
          textColor: '#B8860B',
        };
      case 'good':
        return {
          icon: Clock,
          iconColor: '#3B82F6',
          message: `Step outside for ${minutesText}`,
          subtext: `${Math.round(4 - hoursSinceSunrise)}h left in optimal window`,
          bgColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.2)',
          textColor: '#2563EB',
        };
      case 'closing':
        return {
          icon: Zap,
          iconColor: '#F59E0B',
          message: `Head outside now — ${minutesText}`,
          subtext: 'Window closing soon, go now!',
          bgColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.2)',
          textColor: '#D97706',
        };
      case 'late':
        return {
          icon: CloudSun,
          iconColor: '#64748B',
          message: `Get ${minutesText} of outdoor light`,
          subtext: 'Afternoon light still counts toward unlocking apps',
          bgColor: 'rgba(100, 116, 139, 0.1)',
          borderColor: 'rgba(100, 116, 139, 0.2)',
          textColor: '#475569',
        };
    }
  };

  const config = getUrgencyConfig();
  const IconComponent = config.icon;

  // Weather adjustment note
  const isAdjusted = goalMinutes > baseGoalMinutes;
  const weatherNote = isAdjusted
    ? `Extended to ${goalMinutes} min for cloudy conditions`
    : null;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {/* Time Urgency Row */}
      <View
        style={[
          styles.urgencyRow,
          { backgroundColor: config.bgColor, borderColor: config.borderColor },
        ]}
      >
        <IconComponent size={18} color={config.iconColor} />
        <View style={styles.textContainer}>
          <Text style={[styles.message, { color: config.textColor }]}>
            {config.message}
          </Text>
          <Text style={styles.subtext}>{config.subtext}</Text>
        </View>
      </View>

      {/* Weather Adjustment Note */}
      {weatherNote && (
        <View style={styles.weatherRow}>
          <Cloud size={14} color="#64748B" />
          <Text style={styles.weatherText}>{weatherNote}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  urgencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  subtext: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#64748B',
    marginTop: 1,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  weatherText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#64748B',
  },
});
