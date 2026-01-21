import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, BarChart3, Shield, Sparkles, Plus } from 'lucide-react-native';
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
                    backgroundColor: '#FFFFFF',
                    borderTopColor: '#E0E0E0',
                    borderTopWidth: 1,
                    height: 80,
                    paddingBottom: 20,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: '#FF8C00',
                tabBarInactiveTintColor: '#999999',
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
                                        borderColor: '#FFF',
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
