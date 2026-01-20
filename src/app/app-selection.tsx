import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Instagram,
  Video,
  Twitter,
  Facebook,
  Youtube,
  MessageCircle,
  Ghost,
  Film,
  Check,
  ChevronRight,
  Shield,
} from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import { GlassCard } from '@/components/GlassCard';

const iconMap: Record<string, React.ReactNode> = {
  instagram: <Instagram size={28} color="#FFF8E7" strokeWidth={1.5} />,
  video: <Video size={28} color="#FFF8E7" strokeWidth={1.5} />,
  twitter: <Twitter size={28} color="#FFF8E7" strokeWidth={1.5} />,
  facebook: <Facebook size={28} color="#FFF8E7" strokeWidth={1.5} />,
  youtube: <Youtube size={28} color="#FFF8E7" strokeWidth={1.5} />,
  'message-circle': <MessageCircle size={28} color="#FFF8E7" strokeWidth={1.5} />,
  ghost: <Ghost size={28} color="#FFF8E7" strokeWidth={1.5} />,
  film: <Film size={28} color="#FFF8E7" strokeWidth={1.5} />,
};

export default function AppSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const blockedApps = useLumisStore((s) => s.blockedApps);
  const toggleAppBlocked = useLumisStore((s) => s.toggleAppBlocked);
  const setHasCompletedOnboarding = useLumisStore((s) => s.setHasCompletedOnboarding);

  const buttonScale = useSharedValue(1);

  const isPremium = useLumisStore((s) => s.isPremium);
  const isTrialActive = useLumisStore((s) => s.isTrialActive());
  const hasPremiumAccess = isPremium || isTrialActive;

  const selectedCount = blockedApps.filter((app) => app.isBlocked).length;

  const handleToggle = (appId: string) => {
    const app = blockedApps.find((a) => a.id === appId);

    // Check limit for free users (allow unblocking, but block adding 4th)
    if (!hasPremiumAccess && selectedCount >= 3 && app && !app.isBlocked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/premium');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleAppBlocked(appId);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Don't set onboarding complete yet, now moving to Auth -> Permissions
    router.push('/onboarding-auth');
  };

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View className="flex-1">
      <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={{ flex: 1 }}>
        <View className="flex-1" style={{ paddingTop: insets.top + 20 }}>
          {/* Header */}
          <View className="px-8 mb-6">
            <View className="flex-row items-center mb-2">
              <Shield size={28} color="#FFB347" strokeWidth={1.5} />
              <Text
                className="text-3xl text-lumis-dawn ml-3"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                Shield Apps
              </Text>
            </View>
            <Text
              className="text-base text-lumis-sunrise/70"
              style={{ fontFamily: 'Outfit_400Regular' }}
            >
              Select the apps you want to lock until you get your morning light.
            </Text>
          </View>

          {/* Selection counter */}
          <View className="px-8 mb-4">
            <GlassCard variant="flat">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-lumis-golden/20 items-center justify-center mr-3">
                  <Text className="text-lumis-golden text-lg" style={{ fontFamily: 'Outfit_700Bold' }}>
                    {selectedCount}
                  </Text>
                </View>
                <Text
                  className="text-lumis-sunrise text-base"
                  style={{ fontFamily: 'Outfit_500Medium' }}
                >
                  {selectedCount === 1 ? 'app' : 'apps'} will be shielded each morning
                </Text>
              </View>
            </GlassCard>
          </View>

          {/* App list */}
          <ScrollView
            className="flex-1 px-8"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {blockedApps.map((app, index) => (
              <Animated.View
                key={app.id}
                entering={FadeInDown.delay(index * 50).duration(400)}
                layout={Layout.springify()}
                className="mb-3"
              >
                <GlassCard
                  variant={app.isBlocked ? 'elevated' : 'default'}
                  onPress={() => handleToggle(app.id)}
                  glow={app.isBlocked}
                >
                  <View className="flex-row items-center">
                    {/* App icon */}
                    <View
                      className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${app.isBlocked ? 'bg-lumis-golden/20' : 'bg-lumis-dusk/40'
                        }`}
                    >
                      {iconMap[app.icon]}
                    </View>

                    {/* App name */}
                    <View className="flex-1">
                      <Text
                        className="text-lumis-dawn text-lg"
                        style={{ fontFamily: 'Outfit_600SemiBold' }}
                      >
                        {app.name}
                      </Text>
                      <Text
                        className={`text-sm ${app.isBlocked ? 'text-lumis-golden/80' : 'text-lumis-sunrise/50'
                          }`}
                        style={{ fontFamily: 'Outfit_400Regular' }}
                      >
                        {app.isBlocked ? 'Will be shielded' : 'Tap to shield'}
                      </Text>
                    </View>

                    {/* Checkbox */}
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center ${app.isBlocked ? 'bg-lumis-golden' : 'border-2 border-lumis-dusk/50'
                        }`}
                    >
                      {app.isBlocked && <Check size={18} color="#1A1A2E" strokeWidth={3} />}
                    </View>
                  </View>
                </GlassCard>
              </Animated.View>
            ))}
          </ScrollView>

          {/* Continue button */}
          <View className="px-8" style={{ paddingBottom: insets.bottom + 20 }}>
            <Animated.View style={buttonAnimStyle}>
              <Pressable
                onPress={handleContinue}
                onPressIn={() => {
                  buttonScale.value = withSpring(0.95);
                }}
                onPressOut={() => {
                  buttonScale.value = withSpring(1);
                }}
                disabled={selectedCount === 0}
                className="w-full"
              >
                <LinearGradient
                  colors={
                    selectedCount === 0
                      ? ['#16213E', '#0F3460', '#16213E']
                      : ['#FFB347', '#FF8C00', '#FF6B35']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 18,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: selectedCount === 0 ? 'transparent' : '#FF8C00',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <Text
                    className={`text-lg mr-2 ${selectedCount === 0 ? 'text-lumis-sunrise/40' : 'text-lumis-night'}`}
                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                  >
                    {selectedCount === 0 ? 'Select at least 1 app' : 'Start Your Journey'}
                  </Text>
                  {selectedCount > 0 && (
                    <ChevronRight size={20} color="#1A1A2E" strokeWidth={2.5} />
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
