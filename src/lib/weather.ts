/**
 * Weather Service
 * Provides current weather data, UV index, and optimal outdoor times
 * Uses Open-Meteo API (free, no key required)
 */

export interface WeatherData {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  uvIndex: number;
  cloudCover: number;
  windSpeed: number;
  humidity: number;
  visibility: number;
  isOptimalTime: boolean;
  recommendation: string;
}

export interface UVIndexLevel {
  level: number;
  label: string;
  color: string;
  emoji: string;
  description: string;
}

const UV_LEVELS: UVIndexLevel[] = [
  { level: 0, label: 'None', color: '#8BC34A', emoji: '🟢', description: 'No UV exposure' },
  { level: 1, label: 'Low', color: '#8BC34A', emoji: '🟢', description: 'Safe to be outside' },
  { level: 2, label: 'Low', color: '#8BC34A', emoji: '🟢', description: 'Safe to be outside' },
  { level: 3, label: 'Moderate', color: '#FFC107', emoji: '🟡', description: 'Wear sunscreen' },
  { level: 4, label: 'Moderate', color: '#FFC107', emoji: '🟡', description: 'Wear sunscreen' },
  { level: 5, label: 'Moderate', color: '#FFC107', emoji: '🟡', description: 'Wear sunscreen' },
  { level: 6, label: 'High', color: '#FF9800', emoji: '🟠', description: 'Protection recommended' },
  { level: 7, label: 'High', color: '#FF9800', emoji: '🟠', description: 'Protection recommended' },
  { level: 8, label: 'Very High', color: '#F44336', emoji: '🔴', description: 'Extra protection needed' },
  { level: 9, label: 'Very High', color: '#F44336', emoji: '🔴', description: 'Extra protection needed' },
  { level: 10, label: 'Extreme', color: '#9C27B0', emoji: '🟣', description: 'Avoid sun exposure' },
  { level: 11, label: 'Extreme', color: '#9C27B0', emoji: '🟣', description: 'Avoid sun exposure' },
];

export function getUVLevel(uvIndex: number): UVIndexLevel {
  const index = Math.min(Math.max(0, Math.floor(uvIndex)), 11);
  return UV_LEVELS[index];
}

export async function getWeatherData(latitude: number, latitude_: number): Promise<WeatherData | null> {
  try {
    // Using Open-Meteo API (free, no authentication needed)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${latitude_}&current=temperature_2m,weather_code,cloud_cover,relative_humidity_2m,weather_code,uv_index,wind_speed_10m,visibility&timezone=auto`
    );

    if (!response.ok) throw new Error('Weather API error');

    const data = await response.json();
    const current = data.current;

    // Determine weather condition from WMO code
    const condition = getWeatherCondition(current.weather_code);

    // Calculate if it's optimal time (low cloud cover, good UV index)
    const isOptimalTime = current.cloud_cover < 30 && current.uv_index > 2;

    // Generate recommendation
    const recommendation = generateRecommendation(
      current.cloud_cover,
      current.uv_index,
      current.relative_humidity_2m
    );

    return {
      temperature: Math.round(current.temperature_2m),
      condition,
      uvIndex: Math.round(current.uv_index * 10) / 10,
      cloudCover: current.cloud_cover,
      windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
      humidity: current.relative_humidity_2m,
      visibility: current.visibility / 1000, // Convert to km
      isOptimalTime,
      recommendation,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

function getWeatherCondition(code: number): 'sunny' | 'cloudy' | 'rainy' | 'snowy' {
  // WMO Weather interpretation codes
  if (code === 0 || code === 1) return 'sunny';
  if (code === 2 || code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'cloudy'; // Fog
  if (code >= 51 && code <= 67) return 'rainy'; // Drizzle/Rain
  if (code >= 71 && code <= 77) return 'snowy'; // Snow
  if (code >= 80 && code <= 82) return 'rainy'; // Rain showers
  if (code >= 85 && code <= 86) return 'snowy'; // Snow showers
  if (code >= 80 && code <= 99) return 'rainy'; // Thunderstorm
  return 'cloudy';
}

function generateRecommendation(cloudCover: number, uvIndex: number, humidity: number): string {
  if (uvIndex < 2) {
    return 'UV index is low - limited light exposure benefit';
  }
  if (cloudCover > 70) {
    return 'Cloud cover is high - consider waiting for clearer skies';
  }
  if (uvIndex > 8) {
    return 'Strong UV index - wear protection and take breaks';
  }
  if (humidity > 80) {
    return 'High humidity - early morning or late evening is best';
  }
  return 'Perfect conditions for outdoor time!';
}

export function getWeatherEmoji(condition: string): string {
  switch (condition) {
    case 'sunny':
      return '☀️';
    case 'cloudy':
      return '☁️';
    case 'rainy':
      return '🌧️';
    case 'snowy':
      return '❄️';
    default:
      return '🌤️';
  }
}
