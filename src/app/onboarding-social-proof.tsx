import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

export default function OnboardingSocialProofScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Animation values
  const statScale = useSharedValue(0.8);
  const statOpacity = useSharedValue(0);
  const descriptionOpacity = useSharedValue(0);
  const descriptionTranslateY = useSharedValue(20);
  const sourceOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Stat number - scale up with spring
    statScale.value = withDelay(200, withSpring(1, { damping: 12 }));
    statOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));

    // Description
    descriptionOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    descriptionTranslateY.value = withDelay(600, withTiming(0, { duration: 400 }));

    // Source
    sourceOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));

    // Button
    buttonOpacity.value = withDelay(1100, withTiming(1, { duration: 300 }));
  }, []);

  const statStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statScale.value }],
    opacity: statOpacity.value,
  }));

  const descriptionStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
    transform: [{ translateY: descriptionTranslateY.value }],
  }));

  const sourceStyle = useAnimatedStyle(() => ({
    opacity: sourceOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding-question-wakeup');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 80 }]}>
      <View style={styles.content}>
        <Animated.View style={[styles.statContainer, statStyle]}>
          <MaskedView
            maskElement={<Text style={styles.statNumber}>40%</Text>}
          >
            <LinearGradient
              colors={['#FFB347', '#FF6B35']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            />
          </MaskedView>
        </Animated.View>

        <Animated.Text style={[styles.statDescription, descriptionStyle]}>
          less time on social media{'\n'}when mornings start outside
        </Animated.Text>

        <Animated.Text style={[styles.source, sourceStyle]}>
          Based on Lumis user data
        </Animated.Text>
      </View>

      <Animated.View style={[{ paddingBottom: insets.bottom }, buttonStyle]}>
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>I'M IN</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  statContainer: {
    marginBottom: 24,
  },
  statNumber: {
    fontSize: 140,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -6,
    textAlign: 'center',
  },
  gradient: {
    width: 280,
    height: 160,
  },
  statDescription: {
    fontSize: 24,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 32,
  },
  source: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
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
