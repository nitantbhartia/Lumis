import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Activity, Clock, Bell, ChevronRight, Check } from 'lucide-react-native';

const PERMISSIONS = [
  {
    id: 'motion',
    icon: Activity,
    title: 'Motion & Fitness',
    description: 'Track your steps to prevent app spoofing',
    color: '#FF8C00',
  },
  {
    id: 'screen-time',
    icon: Clock,
    title: 'Screen Time',
    description: 'Lock apps until you\'ve earned your screen time',
    color: '#FFB347',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Morning reminders and achievement updates',
    color: '#FF6B35',
  },
];

export default function OnboardingPermissionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const handleGrantPermission = async (permissionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Simulate permission request
    new Promise((resolve) => setTimeout(resolve, 500)).then(() => {
      setGranted((prev) => new Set([...prev, permissionId]));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    // Navigate to success screen
    setTimeout(() => {
      router.push('/onboarding-success');
    }, 500);
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: 24,
          }}
          scrollEnabled={false}
        >
          <View className="gap-8">
            {/* Header */}
            <View>
              <Text
                className="text-5xl text-lumis-dawn mb-2"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                The Big Three
              </Text>
              <Text
                className="text-lg text-lumis-sunrise"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                We need a few permissions. Your data never leaves your device.
              </Text>
            </View>

            {/* Permissions List */}
            <View className="gap-3">
              {PERMISSIONS.map((permission, idx) => {
                const IconComponent = permission.icon;
                const isGranted = granted.has(permission.id);

                return (
                  <Animated.View
                    key={permission.id}
                    entering={FadeIn.delay(idx * 100)}
                  >
                    <Pressable
                      onPress={() => handleGrantPermission(permission.id)}
                      disabled={isGranted}
                      className="active:scale-98"
                    >
                      <View
                        style={{
                          padding: 16,
                          borderRadius: 12,
                          backgroundColor: '#16213E',
                          borderWidth: 2,
                          borderColor: isGranted
                            ? permission.color
                            : '#0F3460',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 10,
                            backgroundColor: permission.color + '20',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <IconComponent
                            size={28}
                            color={permission.color}
                            strokeWidth={1.5}
                          />
                        </View>

                        <View className="flex-1">
                          <Text
                            className="text-lg text-lumis-dawn"
                            style={{ fontFamily: 'Outfit_600SemiBold' }}
                          >
                            {permission.title}
                          </Text>
                          <Text
                            className="text-sm text-lumis-sunrise mt-1"
                            style={{ fontFamily: 'Outfit_400Regular' }}
                          >
                            {permission.description}
                          </Text>
                        </View>

                        {isGranted ? (
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: permission.color,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <Check size={18} color="#1A1A2E" strokeWidth={3} />
                          </View>
                        ) : (
                          <ChevronRight
                            size={24}
                            color={permission.color}
                            strokeWidth={2}
                          />
                        )}
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            {/* Info Box */}
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: '#16213E',
                borderRadius: 8,
                borderLeftWidth: 3,
                borderLeftColor: '#FFB347',
              }}
            >
              <Text
                className="text-sm text-lumis-sunrise"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                These permissions are required for Lumis to work properly. You can change them anytime in Settings.
              </Text>
            </View>

            {/* Continue Button */}
            <View className="gap-3">
              <Pressable
                onPress={handleContinue}
                disabled={granted.size < 3 || isLoading}
                className="active:scale-95"
              >
                <LinearGradient
                  colors={
                    granted.size === 3
                      ? ['#FFB347', '#FF8C00', '#FF6B35']
                      : ['#666', '#555', '#444']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 16,
                    borderRadius: 12,
                    opacity: granted.size < 3 || isLoading ? 0.5 : 1,
                  }}
                >
                  <Text
                    className="text-lg text-center"
                    style={{
                      fontFamily: 'Outfit_600SemiBold',
                      color: granted.size === 3 ? '#1A1A2E' : '#999',
                    }}
                  >
                    {granted.size}/3 Permissions Granted
                  </Text>
                </LinearGradient>
              </Pressable>

              {granted.size < 3 && (
                <Pressable onPress={handleContinue} disabled={isLoading}>
                  <Text
                    className="text-lumis-sunrise text-center text-base"
                    style={{ fontFamily: 'Outfit_500Medium' }}
                  >
                    Maybe later
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
