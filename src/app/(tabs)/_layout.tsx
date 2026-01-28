import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Home, BarChart3, Shield, Sparkles } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useLumisStore } from '@/lib/state/lumis-store';

export default function TabLayout() {
    const blockedApps = useLumisStore((s) => s.blockedApps);
    const hasActiveShields = blockedApps.some((a) => a.isBlocked);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    height: 80,
                    paddingBottom: 20,
                    paddingTop: 10,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                },
                tabBarBackground: () => (
                    <BlurView
                        intensity={80}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                ),
                tabBarActiveTintColor: '#FF8C00',
                tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{ alignItems: 'center' }}>
                            <Home size={24} color={color} strokeWidth={focused ? 2.5 : 1.5} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="shield"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{ alignItems: 'center' }}>
                            <Shield size={24} color={color} strokeWidth={focused ? 2.5 : 1.5} />
                            {hasActiveShields && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: -2,
                                        right: -2,
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: '#FF6B6B',
                                        borderWidth: 1,
                                        borderColor: '#0F172A',
                                    }}
                                />
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{ alignItems: 'center' }}>
                            <BarChart3 size={24} color={color} strokeWidth={focused ? 2.5 : 1.5} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="premium"
                options={{
                    tabBarStyle: { display: 'none' },
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{ alignItems: 'center' }}>
                            <Sparkles size={24} color={color} strokeWidth={focused ? 2.5 : 1.5} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}
