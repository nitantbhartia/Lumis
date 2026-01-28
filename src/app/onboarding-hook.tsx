import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function OnboardingHookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const line1Opacity = useSharedValue(0);
  const line1TranslateY = useSharedValue(20);
  const dividerWidth = useSharedValue(0);
  const line2Opacity = useSharedValue(0);
  const line2TranslateY = useSharedValue(20);

  useEffect(() => {
    // Line 1 fades in
    line1Opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    line1TranslateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });

    // Divider draws across
    dividerWidth.value = withDelay(
      400,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) })
    );

    // Line 2 fades in
    line2Opacity.value = withDelay(
      600,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
    );
    line2TranslateY.value = withDelay(
      600,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) })
    );
  }, []);

  const line1Style = useAnimatedStyle(() => ({
    opacity: line1Opacity.value,
    transform: [{ translateY: line1TranslateY.value }],
  }));

  const dividerStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: dividerWidth.value }],
  }));

  const line2Style = useAnimatedStyle(() => ({
    opacity: line2Opacity.value,
    transform: [{ translateY: line2TranslateY.value }],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding-how-it-works');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
        <View style={styles.textContainer}>
          <Animated.Text style={[styles.headline, line1Style]}>
            $1 to stay in bed.
          </Animated.Text>

          <Animated.View style={[styles.divider, dividerStyle]} />

          <Animated.Text style={[styles.headline, styles.headlineSecond, line2Style]}>
            Or just get up.
          </Animated.Text>
        </View>
      </View>

      <Animated.View
        entering={FadeInUp.delay(800).duration(400)}
        style={{ paddingBottom: insets.bottom }}
      >
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>GET STARTED</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  headline: {
    fontSize: 48,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    lineHeight: 56,
    letterSpacing: -2,
  },
  headlineSecond: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  divider: {
    width: 80,
    height: 3,
    backgroundColor: '#FF6B35',
    marginVertical: 24,
    transformOrigin: 'left',
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 22,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#E85D04',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});
