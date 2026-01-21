import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Sun, Flame, Unlock, PartyPopper, Heart } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import { Confetti } from '@/components/Confetti';

const { width } = Dimensions.get('window');

export default function VictoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const currentStreak = useLumisStore((s) => s.currentStreak);
  const todayProgress = useLumisStore((s) => s.todayProgress);

  const sunScale = useSharedValue(0);
  const sunRotate = useSharedValue(0);
  const glow = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Trigger haptic celebration
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate sun entrance
    sunScale.value = withDelay(
      200,
      withSpring(1, { damping: 12, stiffness: 100 })
    );

    // Sun rotation
    sunRotate.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    // Glow animation
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Celebration sequence
    const hapticInterval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 600);

    setTimeout(() => clearInterval(hapticInterval), 3000);

    return () => clearInterval(hapticInterval);
  }, []);

  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sunScale.value }, { rotate: `${sunRotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.2, 0.6]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.3]) }],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/dashboard');
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#1A1A2E']}
        style={{ flex: 1 }}
      >
        <Confetti active={true} count={30} colors={['#FFB347', '#FF8C00', '#FF6B35']} />

        <View
          className="flex-1 items-center justify-between px-8"
          style={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }}
        >
          {/* Top Badge */}
          <Animated.View entering={ZoomIn.delay(400)} className="bg-white/5 px-4 py-2 rounded-full border border-white/10 flex-row items-center">
            <Heart size={14} color="#FF6B35" fill="#FF6B35" />
            <Text className="text-lumis-dawn text-xs font-bold ml-2 uppercase tracking-widest">Biological Win</Text>
          </Animated.View>

          {/* Sun Animation Section */}
          <View className="items-center justify-center">
            <Animated.View
              style={[
                glowStyle,
                {
                  position: 'absolute',
                  width: 320,
                  height: 320,
                  borderRadius: 160,
                  backgroundColor: '#FFB347',
                  shadowColor: '#FFB347',
                  shadowRadius: 80,
                  shadowOpacity: 0.4,
                },
              ]}
            />

            <Animated.View style={sunStyle}>
              <LinearGradient
                colors={['#FFE4B5', '#FFB347', '#FF8C00']}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#FF8C00',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 50,
                  elevation: 20,
                }}
              >
                <Sun size={80} color="#1A1A2E" strokeWidth={1.5} />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Main Content */}
          <View className="items-center w-full">
            <Animated.View entering={FadeInDown.delay(600).duration(800)} className="items-center">
              <Text
                className="text-5xl text-lumis-dawn text-center leading-tight"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                Golden{'\n'}Glory
              </Text>

              <Text
                className="text-lg text-lumis-sunrise/70 text-center mt-6 leading-relaxed px-4"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Your circadian rhythm is perfectly synced today.
                <Text className="text-lumis-golden font-bold"> {todayProgress.lightMinutes.toFixed(0)} mins</Text> of morning light received.
              </Text>
            </Animated.View>

            {/* Achievement Cards */}
            <View className="flex-row gap-4 mt-8 w-full">
              <Animated.View
                entering={FadeInDown.delay(800)}
                className="flex-1 bg-white/5 rounded-3xl p-5 border border-white/10 items-center"
              >
                <Flame size={24} color="#FF8C00" />
                <Text className="text-2xl text-lumis-dawn font-bold mt-2">{currentStreak}</Text>
                <Text className="text-xs text-lumis-sunrise/50 uppercase tracking-widest mt-1">Day Streak</Text>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(1000)}
                className="flex-1 bg-white/5 rounded-3xl p-5 border border-white/10 items-center"
              >
                <Unlock size={24} color="#4ADE80" />
                <Text className="text-2xl text-green-400 font-bold mt-2">Open</Text>
                <Text className="text-xs text-lumis-sunrise/50 uppercase tracking-widest mt-1">App Shields</Text>
              </Animated.View>
            </View>
          </View>

          {/* Action Button */}
          <Animated.View entering={FadeIn.delay(1200)} className="w-full">
            <Pressable
              onPress={handleContinue}
              onPressIn={() => { buttonScale.value = withSpring(0.96); }}
              onPressOut={() => { buttonScale.value = withSpring(1); }}
              className="w-full"
            >
              <Animated.View
                style={[
                  {
                    width: '100%',
                    transform: [{ scale: buttonScale.value }]
                  }
                ]}
              >
                <LinearGradient
                  colors={['#FFB347', '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 20,
                    borderRadius: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#FF8C00',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 15,
                  }}
                >
                  <Text
                    className="text-lumis-night text-lg font-black uppercase tracking-[0.15em]"
                    style={{ fontFamily: 'Outfit_700Bold' }}
                  >
                    Harmony Restored
                  </Text>
                </LinearGradient>
              </Animated.View>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}
