import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
  FadeOut,
} from 'react-native-reanimated';
import { KineticLogo } from '@/components/onboarding/KineticLogo';

export default function OnboardingSplashScreen() {
  const router = useRouter();
  const [logoComplete, setLogoComplete] = useState(false);
  const taglineOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    if (logoComplete) {
      // Fade in tagline after logo completes
      taglineOpacity.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [logoComplete]);

  useEffect(() => {
    // Auto-navigate after 2.5 seconds
    const timer = setTimeout(() => {
      router.push('/onboarding-time-question');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.spacer} />

      <View style={styles.content}>
        <KineticLogo
          text="LUMIS"
          size={72}
          letterDelay={120}
          letterDuration={400}
          onComplete={() => setLogoComplete(true)}
        />

        <Animated.Text style={[styles.tagline, taglineStyle]}>
          Unlock your mornings
        </Animated.Text>
      </View>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  tagline: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
});
