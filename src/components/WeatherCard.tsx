import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye } from 'lucide-react-native';
import { getWeatherData, getUVLevel, getWeatherEmoji, WeatherData } from '@/lib/weather';

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      // Default to New York if geolocation fails
      try {
        // In production, use expo-location to get real coordinates
        const data = await getWeatherData(40.7128, -74.0060);
        setWeather(data);
      } catch (error) {
        console.error('Error loading weather:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // Refresh every 10 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View className="h-48 bg-lumis-twilight rounded-2xl items-center justify-center">
        <ActivityIndicator size="large" color="#FFB347" />
      </View>
    );
  }

  if (!weather) {
    return (
      <View className="h-48 bg-lumis-twilight rounded-2xl p-4 justify-center">
        <Text className="text-lumis-dawn font-semibold">Unable to load weather</Text>
      </View>
    );
  }

  const uvLevel = getUVLevel(weather.uvIndex);
  const emoji = getWeatherEmoji(weather.condition);
  const isOptimal = weather.isOptimalTime;

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <LinearGradient
        colors={
          isOptimal
            ? ['rgba(255, 179, 71, 0.15)', 'rgba(255, 107, 53, 0.1)']
            : ['rgba(79, 172, 254, 0.15)', 'rgba(100, 150, 255, 0.1)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-2xl p-4 border border-lumis-sunrise/20"
      >
        {/* Header */}
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text className="text-lumis-sunrise/60 text-sm" style={{ fontFamily: 'Outfit_400Regular' }}>
              Current Weather
            </Text>
            <Text className="text-4xl">{emoji}</Text>
          </View>
          <View className="items-end">
            <Text className="text-lumis-dawn text-2xl font-bold" style={{ fontFamily: 'Outfit_700Bold' }}>
              {weather.temperature}°
            </Text>
            <Text className="text-lumis-sunrise/60 text-xs capitalize" style={{ fontFamily: 'Outfit_400Regular' }}>
              {weather.condition}
            </Text>
          </View>
        </View>

        {/* UV Index - Prominent Display */}
        <View className="mb-4 p-3 rounded-xl" style={{ backgroundColor: `${uvLevel.color}15` }}>
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-xl">{uvLevel.emoji}</Text>
              <Text className="text-lumis-dawn font-semibold" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                UV Index: {weather.uvIndex}
              </Text>
            </View>
            <Text
              className="text-xs font-semibold px-2 py-1 rounded-full text-white"
              style={{ backgroundColor: uvLevel.color, fontFamily: 'Outfit_600SemiBold' }}
            >
              {uvLevel.label}
            </Text>
          </View>
          <Text className="text-xs text-lumis-sunrise/80" style={{ fontFamily: 'Outfit_400Regular' }}>
            {uvLevel.description}
          </Text>
        </View>

        {/* Optimal Time Indicator */}
        {isOptimal && (
          <View className="mb-4 p-3 rounded-xl bg-green-500/20 border border-green-500/50">
            <Text className="text-green-400 text-sm font-semibold" style={{ fontFamily: 'Outfit_600SemiBold' }}>
              ✨ Perfect time for outdoor activity!
            </Text>
          </View>
        )}

        {/* Weather Details Grid */}
        <View className="gap-2">
          {/* First Row */}
          <View className="flex-row gap-2">
            {/* Cloud Cover */}
            <View className="flex-1 p-3 rounded-lg bg-lumis-twilight/40">
              <View className="flex-row items-center gap-2 mb-1">
                <Cloud size={16} color="#FFB347" />
                <Text className="text-lumis-sunrise/60 text-xs" style={{ fontFamily: 'Outfit_400Regular' }}>
                  Cloud Cover
                </Text>
              </View>
              <Text className="text-lumis-dawn font-semibold" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                {weather.cloudCover}%
              </Text>
            </View>

            {/* Wind Speed */}
            <View className="flex-1 p-3 rounded-lg bg-lumis-twilight/40">
              <View className="flex-row items-center gap-2 mb-1">
                <Wind size={16} color="#FFB347" />
                <Text className="text-lumis-sunrise/60 text-xs" style={{ fontFamily: 'Outfit_400Regular' }}>
                  Wind
                </Text>
              </View>
              <Text className="text-lumis-dawn font-semibold" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                {weather.windSpeed} m/s
              </Text>
            </View>
          </View>

          {/* Second Row */}
          <View className="flex-row gap-2">
            {/* Humidity */}
            <View className="flex-1 p-3 rounded-lg bg-lumis-twilight/40">
              <View className="flex-row items-center gap-2 mb-1">
                <Droplets size={16} color="#FFB347" />
                <Text className="text-lumis-sunrise/60 text-xs" style={{ fontFamily: 'Outfit_400Regular' }}>
                  Humidity
                </Text>
              </View>
              <Text className="text-lumis-dawn font-semibold" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                {weather.humidity}%
              </Text>
            </View>

            {/* Visibility */}
            <View className="flex-1 p-3 rounded-lg bg-lumis-twilight/40">
              <View className="flex-row items-center gap-2 mb-1">
                <Eye size={16} color="#FFB347" />
                <Text className="text-lumis-sunrise/60 text-xs" style={{ fontFamily: 'Outfit_400Regular' }}>
                  Visibility
                </Text>
              </View>
              <Text className="text-lumis-dawn font-semibold" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                {weather.visibility} km
              </Text>
            </View>
          </View>
        </View>

        {/* Recommendation */}
        <View className="mt-4 p-3 rounded-lg bg-lumis-dawn/10 border border-lumis-sunrise/30">
          <Text className="text-lumis-sunrise text-xs mb-1" style={{ fontFamily: 'Outfit_600SemiBold' }}>
            💡 Recommendation
          </Text>
          <Text className="text-lumis-dawn text-sm" style={{ fontFamily: 'Outfit_400Regular' }}>
            {weather.recommendation}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
