import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar as CalendarIcon } from 'lucide-react-native';

// Calendar tab - placeholder for future calendar feature
export default function CalendarTab() {
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={['#1A1A2E', '#16213E', '#0F3460']}
                style={{ flex: 1 }}
            >
                <View
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingTop: insets.top,
                        paddingBottom: insets.bottom,
                    }}
                >
                    <CalendarIcon size={64} color="#FFB347" strokeWidth={1} />
                    <Text style={styles.title}>Calendar</Text>
                    <Text style={styles.subtitle}>Coming soon...</Text>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: '#FFF8E7',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255, 248, 231, 0.6)',
        marginTop: 8,
    },
});
