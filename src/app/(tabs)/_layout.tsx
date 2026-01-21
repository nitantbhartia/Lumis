import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, BarChart3, Shield, Sparkles, Plus } from 'lucide-react-native';

export default function TabLayout() {
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
                name="shield"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{ alignItems: 'center' }}>
                            <Plus size={28} color={color} strokeWidth={focused ? 3 : 2} />
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
