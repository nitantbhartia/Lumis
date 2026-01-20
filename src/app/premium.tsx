import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Crown, Check, Sparkles, ShieldCheck } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  RevenueCatResult,
} from '@/lib/revenuecatClient';
import { PurchasesPackage } from 'react-native-purchases';

const PREMIUM_FEATURES = [
  {
    icon: '📊',
    title: 'Deep Analytics',
    description: 'Know your best days, worst days, and why.',
  },
  {
    icon: '🎨',
    title: 'Premium Themes',
    description: 'Obsidian night, sunrise gold, and more.',
  },
  {
    icon: '🎯',
    title: 'Custom Targets',
    description: 'Dial your goal from 5 to 60 minutes.',
  },
  {
    icon: '🔓',
    title: 'Unlimited Shields',
    description: 'Block every app that steals your attention.',
  },
  {
    icon: '📱',
    title: 'Lock Screen Widget',
    description: 'Your streak, always visible.',
  },
  {
    icon: '🏃',
    title: 'Apple Health Sync',
    description: 'Export sun minutes to your health data.',
  },
  {
    icon: '👥',
    title: 'Family Sharing',
    description: 'Up to 5 members on one plan.',
  },
  {
    icon: '🌦️',
    title: 'Weather Intelligence',
    description: 'Goals flex with the forecast.',
  },
];

export default function PremiumScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isPremium = useLumisStore((s) => s.isPremium);
  const setIsPremium = useLumisStore((s) => s.setIsPremium);
  const trialStartedAt = useLumisStore((s) => s.trialStartedAt);
  const startTrial = useLumisStore((s) => s.startTrial);
  const isTrialActive = useLumisStore((s) => s.isTrialActive());

  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

  // Mock packages for dev/UI testing if RC is not configured
  const mockPackages: any[] = [
    {
      identifier: '$rc_annual',
      product: {
        priceString: '$29.99',
        price: 29.99,
        title: 'Annual',
        description: 'Yearly subscription',
      },
      packageType: 'ANNUAL',
    },
    {
      identifier: '$rc_monthly',
      product: {
        priceString: '$4.99',
        price: 4.99,
        title: 'Monthly',
        description: 'Monthly subscription',
      },
      packageType: 'MONTHLY',
    }
  ];

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const result = await getOfferings();
      if (result.ok && result.data.current) {
        setPackages(result.data.current.availablePackages);
        // Default to annual if available
        const annual = result.data.current.availablePackages.find(p => p.packageType === 'ANNUAL');
        setSelectedPackage(annual || result.data.current.availablePackages[0]);
      } else {
        // Fallback to mock for UI dev
        console.log('Using mock packages');
        setPackages(mockPackages);
        setSelectedPackage(mockPackages[0]);
      }
    } catch (e) {
      console.error('Failed to load offerings', e);
      setPackages(mockPackages);
      setSelectedPackage(mockPackages[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSubscribe = async () => {
    // If user hasn't started their trial yet, give it to them without a card
    if (!trialStartedAt) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      startTrial();
      Alert.alert(
        'Trial Started!',
        'You now have 7 days of Lumis Pro. No credit card required.',
        [{ text: 'Great!', onPress: () => router.back() }]
      );
      return;
    }

    if (!selectedPackage || purchasing) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPurchasing(true);

    try {
      let success = false;

      // If it's a real RC package
      if (selectedPackage.offeringIdentifier) {
        const result = await purchasePackage(selectedPackage);
        if (result.ok && (result.data.entitlements.active['premium'] || result.data.entitlements.active['pro'])) {
          success = true;
        }
      } else {
        // Mock purchase
        await new Promise(r => setTimeout(r, 1500));
        success = true;
      }

      if (success) {
        setIsPremium(true);
        Alert.alert('Welcome to Pro!', 'Your subscription has been activated.');
        setTimeout(() => {
          router.back();
        }, 500);
      }
    } catch (e) {
      Alert.alert('Purchase Failed', 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPurchasing(true);
    try {
      const result = await restorePurchases();
      if (result.ok && (result.data.entitlements.active['premium'] || result.data.entitlements.active['pro'])) {
        setIsPremium(true);
        Alert.alert('Purchases Restored', 'Your subscription has been restored.');
      } else {
        Alert.alert('No Subscription Found', 'We could not find an active subscription to restore.');
      }
    } catch (e) {
      Alert.alert('Restore Failed', 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  if (isPremium || isTrialActive) {
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
              Lumis Pro
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
              <ShieldCheck size={48} color="#FFB347" strokeWidth={1.5} />
            </View>

            <Text
              className="text-3xl text-lumis-dawn mb-3 text-center"
              style={{ fontFamily: 'Outfit_700Bold' }}
            >
              {isPremium ? "You're a Pro." : "Trial Active"}
            </Text>

            <Text
              className="text-lumis-sunrise/60 text-center mb-8 px-4"
              style={{ fontFamily: 'Outfit_400Regular' }}
            >
              {isPremium
                ? "You've unlocked every feature. Go get that sun."
                : "Your 7-day free trial is active. Explore all Pro features now!"}
            </Text>

            {!isPremium && (
              <View className="bg-lumis-twilight/40 rounded-2xl p-6 border border-lumis-golden/30 w-full mb-8">
                <Text className="text-lumis-dawn text-center mb-2" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                  Trial Ends in 7 Days
                </Text>
                <Text className="text-lumis-sunrise/50 text-center text-sm" style={{ fontFamily: 'Outfit_400Regular' }}>
                  You can subscribe any time to keep these features and support our work.
                </Text>
              </View>
            )}
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
          contentContainerStyle={{ paddingBottom: 200 }}
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
              Master Your Mornings
            </Text>

            <Text
              className="text-lumis-sunrise/60 text-center text-lg px-4"
              style={{ fontFamily: 'Outfit_400Regular' }}
            >
              Join the 1% who own their first hour.
            </Text>
          </Animated.View>

          {/* Features */}
          <View className="mb-8">
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

        {/* Pricing & CTA - Fixed Bottom */}
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-lumis-dusk/50"
          style={{
            paddingTop: 20,
            paddingBottom: insets.bottom + 20,
            backgroundColor: '#1A1A2E',
            paddingHorizontal: 20,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFB347" className="py-8" />
          ) : (
            <>
              {/* Pricing Options */}
              <View className="flex-row gap-4 mb-6">
                {packages.map((pkg) => {
                  const isSelected = selectedPackage?.identifier === pkg.identifier;
                  const isAnnual = pkg.packageType === 'ANNUAL';

                  return (
                    <Pressable
                      key={pkg.identifier}
                      className={`flex-1 p-4 rounded-xl border-2 ${isSelected ? 'border-lumis-golden bg-lumis-golden/10' : 'border-lumis-dusk/50 bg-lumis-twilight/30'}`}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedPackage(pkg);
                      }}
                    >
                      {isAnnual && (
                        <View className="absolute -top-3 left-0 right-0 items-center">
                          <View className="bg-lumis-golden px-2 py-0.5 rounded-full">
                            <Text className="text-lumis-night text-[10px] font-bold">SAVE 50%</Text>
                          </View>
                        </View>
                      )}
                      <Text className={`text-lg font-bold text-center mb-1 ${isSelected ? 'text-lumis-golden' : 'text-lumis-dawn'}`}>
                        {pkg.packageType === 'ANNUAL' ? 'Annual' : 'Monthly'}
                      </Text>
                      <Text className="text-lumis-sunrise/80 text-center font-medium">
                        {pkg.product.priceString}
                      </Text>
                      <Text className="text-lumis-sunrise/50 text-xs text-center mt-1">
                        {isAnnual ? 'Just $2.49/mo' : 'Billed monthly'}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              <Pressable onPress={handleSubscribe} disabled={purchasing}>
                <LinearGradient
                  colors={purchasing ? ['#666', '#555'] : ['#FFB347', '#FF8C00', '#FF6B35']}
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
                    opacity: purchasing ? 0.7 : 1
                  }}
                >
                  {purchasing ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Sparkles size={20} color="#1A1A2E" strokeWidth={2.5} />
                      <Text
                        className="text-lumis-night text-lg ml-2"
                        style={{ fontFamily: 'Outfit_700Bold' }}
                      >
                        {trialStartedAt ? 'Unlock Pro' : 'Try Pro for Free'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              <View className="flex-row justify-center gap-6 mt-2">
                <Pressable onPress={handleRestore}>
                  <Text className="text-lumis-sunrise/60 text-xs font-medium">Restore Purchases</Text>
                </Pressable>
                <Pressable onPress={() => Linking.openURL('https://lumis.app/terms')}>
                  <Text className="text-lumis-sunrise/60 text-xs font-medium">Terms</Text>
                </Pressable>
                <Pressable onPress={() => Linking.openURL('https://lumis.app/privacy')}>
                  <Text className="text-lumis-sunrise/60 text-xs font-medium">Privacy</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}
