import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Lock, Sun, Check, Sparkles } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  FadeIn,
  FadeInDown,
  FadeOut,
  Easing,
} from 'react-native-reanimated';

export default function OnboardingFirstUnlockScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<'intro' | 'locked' | 'unlocking' | 'unlocked'>('intro');

  // Animation values
  const lockScale = useSharedValue(1);
  const lockRotate = useSharedValue(0);
  const successScale = useSharedValue(0);
  const sunGlow = useSharedValue(0);
  const appGridOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Phase 1: Show intro briefly
    const introTimer = setTimeout(() => {
      setPhase('locked');
      // Animate lock appearing
      lockScale.value = withSpring(1, { damping: 8 });
    }, 500);

    // Phase 2: After 2.5s, simulate light detection
    const unlockTimer = setTimeout(() => {
      handleUnlock();
    }, 3000);

    return () => {
      clearTimeout(introTimer);
      clearTimeout(unlockTimer);
    };
  }, []);

  const handleUnlock = () => {
    setPhase('unlocking');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Sun glow animation
    sunGlow.value = withTiming(1, { duration: 400 });

    // Lock shake and disappear
    lockRotate.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );

    lockScale.value = withDelay(
      200,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) })
    );

    // App grid brightens
    appGridOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));

    // Show success after animation
    setTimeout(() => {
      setPhase('unlocked');
      successScale.value = withSpring(1, { damping: 8 });
    }, 800);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding-permission-notifications');
  };

  const lockStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: lockScale.value },
      { rotate: `${lockRotate.value}deg` },
    ],
    opacity: lockScale.value,
  }));

  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successScale.value,
  }));

  const sunGlowStyle = useAnimatedStyle(() => ({
    opacity: sunGlow.value,
    transform: [{ scale: 1 + sunGlow.value * 0.3 }],
  }));

  const appGridStyle = useAnimatedStyle(() => ({
    opacity: appGridOpacity.value,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background app icons mockup */}
      <Animated.View style={[styles.appGrid, appGridStyle]}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={styles.mockAppIcon}>
            {i === 0 && <View style={[styles.appIconInner, { backgroundColor: '#E1306C' }]} />}
            {i === 1 && <View style={[styles.appIconInner, { backgroundColor: '#000000' }]} />}
            {i === 2 && <View style={[styles.appIconInner, { backgroundColor: '#1DA1F2' }]} />}
            {i === 3 && <View style={[styles.appIconInner, { backgroundColor: '#FF0000' }]} />}
            {i === 4 && <View style={[styles.appIconInner, { backgroundColor: '#FF4500' }]} />}
            {i > 4 && <View style={[styles.appIconInner, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />}
          </View>
        ))}
      </Animated.View>

      {/* Dimmed overlay when locked */}
      {(phase === 'intro' || phase === 'locked') && (
        <View style={styles.dimOverlay} />
      )}

      {/* Sun glow effect during unlock */}
      {phase === 'unlocking' && (
        <Animated.View style={[styles.sunGlow, sunGlowStyle]} />
      )}

      {/* Content */}
      <View style={styles.content}>
        {(phase === 'intro' || phase === 'locked') && (
          <>
            <Animated.View entering={FadeIn.delay(300)} style={styles.lockContainer}>
              <Animated.View style={[styles.lockCircle, lockStyle]}>
                <Lock size={48} color="#FF6B35" strokeWidth={2} />
              </Animated.View>
            </Animated.View>

            <Animated.Text entering={FadeInDown.delay(500)} style={styles.title}>
              This is tomorrow morning
            </Animated.Text>

            <Animated.Text entering={FadeInDown.delay(700)} style={styles.subtitle}>
              Your apps are locked until you step outside...
            </Animated.Text>

            <Animated.View entering={FadeIn.delay(1500)} style={styles.waitingIndicator}>
              <Sun size={20} color="#FF6B35" />
              <Text style={styles.waitingText}>Detecting sunlight...</Text>
            </Animated.View>
          </>
        )}

        {phase === 'unlocking' && (
          <Animated.View entering={FadeIn} style={styles.unlockingContainer}>
            <Sparkles size={64} color="#FFD93D" strokeWidth={1.5} />
          </Animated.View>
        )}

        {phase === 'unlocked' && (
          <>
            <Animated.View style={[styles.successCircle, successStyle]}>
              <Check size={48} color="#FFFFFF" strokeWidth={3} />
            </Animated.View>

            <Animated.Text entering={FadeInDown.delay(200)} style={styles.successTitle}>
              Apps unlocked!
            </Animated.Text>

            <Animated.Text entering={FadeInDown.delay(400)} style={styles.successSubtitle}>
              That feeling?{'\n'}That's your morning back.
            </Animated.Text>
          </>
        )}
      </View>

      {/* Continue button (only after unlock) */}
      {phase === 'unlocked' && (
        <Animated.View
          entering={FadeInDown.delay(800)}
          style={{ paddingBottom: insets.bottom }}
        >
          <Pressable onPress={handleContinue} style={styles.button}>
            <Text style={styles.buttonText}>I'M READY</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  appGrid: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  mockAppIcon: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  appIconInner: {
    flex: 1,
    borderRadius: 14,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 46, 0.7)',
  },
  sunGlow: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 217, 61, 0.3)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  lockContainer: {
    marginBottom: 32,
  },
  lockCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 26,
  },
  waitingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  waitingText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#FF6B35',
  },
  unlockingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  successTitle: {
    fontSize: 32,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 20,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 30,
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 22,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});
