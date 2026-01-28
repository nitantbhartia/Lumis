import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Sun, Cloud, CloudRain, Snowflake, CloudFog, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { WeatherData } from '@/lib/hooks/useWeather';

interface WeatherBarProps {
  weather: WeatherData;
  onPress?: () => void;
}

const getWeatherIcon = (condition: string) => {
  const lowerCondition = condition.toLowerCase();

  if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
    return <Sun size={16} color="#FFB347" />;
  }
  if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <Cloud size={16} color="#9CA3AF" />;
  }
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle') || lowerCondition.includes('shower')) {
    return <CloudRain size={16} color="#60A5FA" />;
  }
  if (lowerCondition.includes('snow')) {
    return <Snowflake size={16} color="#BFDBFE" />;
  }
  if (lowerCondition.includes('fog')) {
    return <CloudFog size={16} color="#9CA3AF" />;
  }
  if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
    return <Zap size={16} color="#FBBF24" />;
  }

  return <Sun size={16} color="#FFB347" />;
};

const getUVLabel = (uvIndex: number): { label: string; color: string } => {
  if (uvIndex <= 2) return { label: 'Low', color: '#10B981' };
  if (uvIndex <= 5) return { label: 'Moderate', color: '#F59E0B' };
  if (uvIndex <= 7) return { label: 'High', color: '#F97316' };
  if (uvIndex <= 10) return { label: 'Very High', color: '#EF4444' };
  return { label: 'Extreme', color: '#7C3AED' };
};

const formatTime = (isoString: string | null): string => {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const getBestTimeText = (sunrise: string | null, sunset: string | null): string => {
  if (!sunrise) return 'Check weather app';

  const sunriseDate = new Date(sunrise);
  // Best time is within first 2 hours after sunrise
  const bestStart = formatTime(sunrise);
  const bestEndDate = new Date(sunriseDate.getTime() + 2 * 60 * 60 * 1000);
  const bestEnd = bestEndDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return `${bestStart} - ${bestEnd}`;
};

export function WeatherBar({ weather, onPress }: WeatherBarProps) {
  const { condition, uvIndex, sunrise, sunset, loading, error } = weather;
  const uv = getUVLabel(uvIndex);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading weather...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Weather unavailable</Text>
      </View>
    );
  }

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.weatherInfo}>
        {getWeatherIcon(condition)}
        <Text style={styles.conditionText}>{condition}</Text>
        <View style={styles.separator} />
        <Text style={[styles.uvText, { color: uv.color }]}>UV {uvIndex}</Text>
      </View>
      <View style={styles.bestTimeContainer}>
        <Text style={styles.bestTimeLabel}>Best light</Text>
        <Text style={styles.bestTimeValue}>{getBestTimeText(sunrise, sunset)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conditionText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  separator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  uvText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  bestTimeContainer: {
    alignItems: 'flex-end',
  },
  bestTimeLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bestTimeValue: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFB347',
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
