import React, { useEffect } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  FadeIn,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/lib/state/auth-store';
import { useLumisStore } from '@/lib/state/lumis-store';
import { Sun, Sparkles, ArrowRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function OnboardingSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const userName = useAuthStore((s) => s.userName);
  const setHasCompletedOnboarding = useLumisStore((s) => s.setHasCompletedOnboarding);

  const sunScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const isPremium = useLumisStore((s) => s.isPremium);
  const isTrialActive = useLumisStore((s) => s.isTrialActive());
  const hasPremiumAccess = isPremium || isTrialActive;

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasCompletedOnboarding(true);

    // Redirect to Paywall if not premium
    if (!hasPremiumAccess) {
      router.replace('/(tabs)/premium');
    } else {
      router.replace('/(tabs)');
    }
  };

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate sun growing
    sunScale.value = withSpring(1, { damping: 12, mass: 1, stiffness: 80 });

    // Glow pulse
    glowOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
      })
    );

    // Text fade in
    textOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));

    // Button fade in
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 800 }));
  }, []);

  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sunScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowOpacity.value, [0, 1], [0, 0.4]),
    transform: [{ scale: interpolate(glowOpacity.value, [0, 1], [0.8, 1.2]) }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: interpolate(textOpacity.value, [0, 1], [20, 0]) }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [
      { translateY: interpolate(buttonOpacity.value, [0, 1], [20, 0]) },
      { scale: buttonScale.value }
    ],
  }));

  const displayName = userName || 'Explorer';

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
        locations={[0, 0.3, 0.7, 1]}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 items-center justify-between px-8"
          style={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }}
        >
          <Animated.View entering={FadeIn.delay(200)} className="items-center">
            <Sparkles size={24} color="#1A1A2E" opacity={0.6} />
          </Animated.View>

          {/* Main Visual Section */}
          <View className="items-center w-full">
            {/* Glow Background */}
            <Animated.View
              style={[
                glowStyle,
                {
                  position: 'absolute',
                  width: width * 0.8,
                  height: width * 0.8,
                  borderRadius: width * 0.4,
                  backgroundColor: '#FFB347',
                  shadowColor: '#FFB347',
                  shadowRadius: 100,
                  shadowOpacity: 0.5,
                },
              ]}
            />

            {/* Sun Hub */}
            <Animated.View style={sunStyle} className="items-center justify-center">
              <LinearGradient
                colors={['#FFE4B5', '#FFB347', '#FF8C00']}
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#FFB347',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 40,
                  elevation: 20,
                }}
              >
                <Sun size={64} color="#1A1A2E" strokeWidth={1.5} />
              </LinearGradient>
            </Animated.View>

            {/* Supportive Text Content */}
            <Animated.View style={textStyle} className="items-center mt-12 px-4">
              <Text
                className="text-4xl text-center leading-tight"
                style={{ fontFamily: 'Outfit_700Bold', color: '#1A1A2E' }}
              >
                Welcome to{'\n'}the Light
              </Text>
              <Text
                className="text-lg text-center mt-4 leading-relaxed"
                style={{ fontFamily: 'Outfit_400Regular', color: '#333' }}
              >
                Your biology is now synced with the sun, <Text style={{ color: '#FF8C00', fontWeight: 'bold' }}>{displayName}</Text>. Let's start your first golden window.
              </Text>
            </Animated.View>
          </View>

          {/* Action Button */}
          <Animated.View style={buttonStyle} className="w-full">
            <Pressable
              onPress={handleContinue}
              onPressIn={() => { buttonScale.value = withSpring(0.96); }}
              onPressOut={() => { buttonScale.value = withSpring(1); }}
              className="w-full"
            >
              <LinearGradient
                colors={['#FFB347', '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 20,
                  borderRadius: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#FF8C00',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  elevation: 5,
                }}
              >
                <Text
                  className="text-lumis-night text-center text-lg font-black uppercase tracking-widest mr-2"
                  style={{ fontFamily: 'Outfit_700Bold' }}
                >
                  Step Into Sunlight
                </Text>
                <ArrowRight size={20} color="#1A1A2E" strokeWidth={3} />
              </LinearGradient>
            </Pressable>

            <Text style={{ color: '#666', textAlign: 'center', marginTop: 24, fontSize: 10, letterSpacing: 2 }}>
              COMPASSIONATELY ENGINEERED
            </Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}
