import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Crown, Check, Sparkles } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';

const PREMIUM_FEATURES = [
  {
    icon: '📊',
    title: 'Advanced Analytics',
    description: 'Monthly trends, best times, and detailed insights',
  },
  {
    icon: '🎨',
    title: 'Custom Themes',
    description: 'Choose from multiple beautiful theme options',
  },
  {
    icon: '🎯',
    title: 'Flexible Goals',
    description: 'Set custom daily goals beyond 30 minutes',
  },
  {
    icon: '🔓',
    title: 'Unlimited Apps',
    description: 'Block as many apps as you want',
  },
  {
    icon: '📱',
    title: 'Home Screen Widget',
    description: 'See your progress at a glance',
  },
  {
    icon: '🏃',
    title: 'Health App Sync',
    description: 'Export data to Apple Health',
  },
  {
    icon: '👥',
    title: 'Leaderboards',
    description: 'Compete with friends on streaks',
  },
  {
    icon: '💫',
    title: 'Priority Support',
    description: 'Get help when you need it',
  },
];

export default function PremiumScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isPremium = useLumisStore((s) => s.isPremium);
  const setIsPremium = useLumisStore((s) => s.setIsPremium);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSubscribe = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In production, this would trigger RevenueCat paywall
    // For now, just unlock premium for demo
    setIsPremium(true);
    setTimeout(() => {
      router.back();
    }, 500);
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In production, this would restore RevenueCat purchases
    console.log('Restore purchases');
  };

  if (isPremium) {
    return (
      <View className="flex-1 bg-lumis-night">
        <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={{ flex: 1 }}>
          <View
            className="flex-row items-center justify-between px-6 pb-4 border-b border-lumis-dusk/30"
            style={{ paddingTop: insets.top + 16 }}
          >
            <Text
              className="text-2xl text-lumis-dawn"
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              Premium
            </Text>
            <Pressable
              onPress={handleClose}
              className="w-10 h-10 rounded-full bg-lumis-twilight/50 items-center justify-center"
            >
              <X size={20} color="#FFB347" strokeWidth={2} />
            </Pressable>
          </View>

          <View className="flex-1 items-center justify-center px-6">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{
                backgroundColor: 'rgba(255, 179, 71, 0.15)',
                shadowColor: '#FFB347',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 30,
              }}
            >
              <Crown size={48} color="#FFB347" strokeWidth={1.5} />
            </View>

            <Text
              className="text-3xl text-lumis-dawn mb-3 text-center"
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              You're Premium!
            </Text>

            <Text
              className="text-lumis-sunrise/60 text-center mb-8"
              style={{ fontFamily: 'Outfit_400Regular' }}
            >
              Thank you for supporting Lumis. Enjoy all premium features!
            </Text>

            <View className="bg-lumis-twilight/40 rounded-2xl p-6 border border-lumis-golden/30 w-full">
              {PREMIUM_FEATURES.slice(0, 4).map((feature, index) => (
                <View key={index} className="flex-row items-center mb-4 last:mb-0">
                  <View className="w-10 h-10 rounded-xl bg-lumis-golden/20 items-center justify-center mr-3">
                    <Text style={{ fontSize: 20 }}>{feature.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-lumis-dawn"
                      style={{ fontFamily: 'Outfit_600SemiBold' }}
                    >
                      {feature.title}
                    </Text>
                  </View>
                  <Check size={20} color="#FFB347" strokeWidth={2.5} />
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-lumis-night">
      <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={{ flex: 1 }}>
        {/* Header */}
        <View
          className="flex-row items-center justify-end px-6 pb-4"
          style={{ paddingTop: insets.top + 16 }}
        >
          <Pressable
            onPress={handleClose}
            className="w-10 h-10 rounded-full bg-lumis-twilight/50 items-center justify-center"
          >
            <X size={20} color="#FFB347" strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <Animated.View entering={FadeInDown.duration(600)} className="items-center mb-8">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{
                backgroundColor: 'rgba(255, 179, 71, 0.15)',
                shadowColor: '#FFB347',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 30,
              }}
            >
              <Crown size={48} color="#FFB347" strokeWidth={1.5} />
            </View>

            <Text
              className="text-4xl text-lumis-dawn mb-3 text-center"
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              Upgrade to Premium
            </Text>

            <Text
              className="text-lumis-sunrise/60 text-center text-lg"
              style={{ fontFamily: 'Outfit_400Regular' }}
            >
              Unlock all features and supercharge your wellness journey
            </Text>
          </Animated.View>

          {/* Features */}
          <View className="mb-6">
            {PREMIUM_FEATURES.map((feature, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(index * 50 + 300).duration(400)}
                className="mb-4"
              >
                <View className="bg-lumis-twilight/40 rounded-2xl p-4 border border-lumis-dusk/30 flex-row items-center">
                  <View className="w-12 h-12 rounded-xl bg-lumis-golden/20 items-center justify-center mr-4">
                    <Text style={{ fontSize: 24 }}>{feature.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-lumis-dawn text-lg mb-1"
                      style={{ fontFamily: 'Outfit_600SemiBold' }}
                    >
                      {feature.title}
                    </Text>
                    <Text
                      className="text-lumis-sunrise/60"
                      style={{ fontFamily: 'Outfit_400Regular', fontSize: 13 }}
                    >
                      {feature.description}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        </ScrollView>

        {/* CTA */}
        <View
          className="absolute bottom-0 left-0 right-0 px-6 border-t border-lumis-dusk/50"
          style={{
            paddingTop: 20,
            paddingBottom: insets.bottom + 20,
            backgroundColor: '#1A1A2E',
          }}
        >
          <Pressable onPress={handleSubscribe}>
            <LinearGradient
              colors={['#FFB347', '#FF8C00', '#FF6B35']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 18,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#FF8C00',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
                marginBottom: 12,
              }}
            >
              <Sparkles size={20} color="#1A1A2E" strokeWidth={2.5} />
              <Text
                className="text-lumis-night text-lg ml-2"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                Start Free Trial
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={handleRestore}>
            <Text
              className="text-lumis-sunrise/60 text-center"
              style={{ fontFamily: 'Outfit_500Medium' }}
            >
              Restore Purchases
            </Text>
          </Pressable>

          <Text
            className="text-lumis-sunrise/40 text-center text-xs mt-3"
            style={{ fontFamily: 'Outfit_400Regular' }}
          >
            7-day free trial, then $4.99/month. Cancel anytime.
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
