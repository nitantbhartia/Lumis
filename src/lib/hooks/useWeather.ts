import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface WeatherData {
    temperature: number;
    condition: string;
    city: string;
    humidity: number;
    uvIndex: number;
    loading: boolean;
    error: string | null;
}

export function useWeather() {
    const [data, setData] = useState<WeatherData>({
        temperature: 0,
        condition: 'Loading...',
        city: 'Locating...',
        humidity: 0,
        uvIndex: 0,
        loading: true,
        error: null,
    });

    useEffect(() => {
        let mounted = true;

        const fetchWeather = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    if (mounted) setData(d => ({ ...d, loading: false, error: 'Permission denied', city: 'Permission Denied' }));
                    return;
                }

                const location = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = location.coords;

                // 1. Reverse Geocoding for City using Expo Location
                let city = 'Unknown Location';
                try {
                    const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
                    if (reverseGeocode.length > 0) {
                        const loc = reverseGeocode[0];
                        city = `${loc.city || loc.region}, ${loc.isoCountryCode}`;
                        if (city.startsWith(',')) city = city.substring(2);
                    }
                } catch (e) {
                    console.warn('Reverse geocoding failed', e);
                }

                // 2. Fetch Weather from Open-Meteo
                // https://open-meteo.com/en/docs
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,uv_index`
                );
                const jsonData = await response.json();

                if (jsonData.current && mounted) {
                    const code = jsonData.current.weather_code;
                    const condition = getWeatherCondition(code);

                    setData({
                        temperature: jsonData.current.temperature_2m,
                        condition: condition,
                        city: city,
                        humidity: jsonData.current.relative_humidity_2m,
                        uvIndex: jsonData.current.uv_index || 0, // Note: Open-Meteo provides UV
                        loading: false,
                        error: null,
                    });
                }

            } catch (err) {
                if (mounted) {
                    console.error('Weather fetch error:', err);
                    setData(d => ({ ...d, loading: false, error: 'Failed to fetch weather' }));
                }
            }
        };

        fetchWeather();

        return () => {
            mounted = false;
        };
    }, []);

    return data;
}

// WMO Weather interpretation codes (WW)
// https://open-meteo.com/en/docs
function getWeatherCondition(code: number): string {
    if (code === 0) return 'Clear Sky';
    if (code === 1) return 'Mainly Clear';
    if (code === 2) return 'Partly Cloudy';
    if (code === 3) return 'Overcast';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 55) return 'Drizzle';
    if (code >= 56 && code <= 57) return 'Freezing Drizzle';
    if (code >= 61 && code <= 65) return 'Rain';
    if (code >= 66 && code <= 67) return 'Freezing Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Rain Showers';
    if (code >= 85 && code <= 86) return 'Snow Showers';
    if (code >= 95) return 'Thunderstorm';
    if (code >= 96 && code <= 99) return 'Thunderstorm with Hail';
    return 'Unknown';
}
