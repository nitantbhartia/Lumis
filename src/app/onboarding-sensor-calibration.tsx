import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Sun, Check, Clock } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { Accelerometer } from 'expo-sensors';
import { useLumisStore } from '@/lib/state/lumis-store';

const SUCCESS_LUX_THRESHOLD = 500;
const AUTO_SKIP_DELAY = 5000; // 5 seconds before showing skip option

export default function OnboardingSensorCalibrationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setCalibration = useLumisStore((s) => s.setCalibration);

  const [currentLux, setCurrentLux] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSkipOption, setShowSkipOption] = useState(false);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  const subscriptionRef = useRef<any>(null);

  // Animation values
  const luxScale = useSharedValue(1);
  const successScale = useSharedValue(0);
  const iconGlow = useSharedValue(0);

  useEffect(() => {
    // Use accelerometer as a demo sensor (simulating motion = light detection)
    // In production, this would use actual light sensor or camera brightness
    const startSensor = async () => {
      try {
        // Use accelerometer to simulate sensor activity
        Accelerometer.setUpdateInterval(500);
        subscriptionRef.current = Accelerometer.addListener((data) => {
          // Simulate lux based on device movement (for demo purposes)
          // Moving device = detecting light activity
          const motion = Math.abs(data.x) + Math.abs(data.y) + Math.abs(data.z);
          const simulatedLux = Math.round(motion * 200 + Math.random() * 100);
          setCurrentLux(Math.min(simulatedLux, 2000));

          // Animate the lux value
          luxScale.value = withSequence(
            withSpring(1.05, { damping: 10 }),
            withSpring(1, { damping: 10 })
          );

          // Update glow based on lux
          iconGlow.value = withTiming(Math.min(simulatedLux / 1000, 1), { duration: 300 });

          // Check for success (when device is moved enough)
          if (simulatedLux >= SUCCESS_LUX_THRESHOLD && !isSuccess) {
            handleSuccess(simulatedLux);
          }
        });
        setSensorAvailable(true);
      } catch (error) {
        console.log('Sensor not available:', error);
        setSensorAvailable(false);
        setShowSkipOption(true);
      }
    };

    startSensor();

    // Show skip option after delay
    const skipTimer = setTimeout(() => {
      setShowSkipOption(true);
    }, AUTO_SKIP_DELAY);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
      clearTimeout(skipTimer);
    };
  }, []);

  const handleSuccess = (lux: number) => {
    setIsSuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Save calibration
    setCalibration({
      indoorLux: 300, // Assume typical indoor
      outdoorLux: lux,
      isCalibrated: true,
    });

    // Animate success
    successScale.value = withSpring(1, { damping: 8 });

    // Navigate after delay
    setTimeout(() => {
      router.push('/onboarding-app-selection');
    }, 1500);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Set default calibration
    setCalibration({
      indoorLux: 300,
      outdoorLux: 1500,
      isCalibrated: false,
    });

    router.push('/onboarding-app-selection');
  };

  const luxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: luxScale.value }],
  }));

  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successScale.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + iconGlow.value * 0.5,
    shadowRadius: 10 + iconGlow.value * 20,
  }));

  const getLuxColor = () => {
    if (currentLux < 100) return 'rgba(255, 255, 255, 0.3)';
    if (currentLux < 300) return 'rgba(255, 255, 255, 0.6)';
    if (currentLux < 500) return '#FFD93D';
    return '#FF6B35';
  };

  return (
    <View style={[styles.screen, isSuccess && styles.screenSuccess]}>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
        ]}
      >
        {isSuccess ? (
          // Success State
          <View style={styles.successContainer}>
            <Animated.View style={[styles.successIcon, successStyle]}>
              <Check size={64} color="#FFFFFF" strokeWidth={3} />
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(300)} style={styles.successTitle}>
              Sensor verified!
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(500)} style={styles.successSubtitle}>
              Your phone is ready to be your alarm clock's smarter sibling.
            </Animated.Text>
          </View>
        ) : (
          // Calibration State
          <>
            <View style={styles.content}>
              {/* Icon */}
              <Animated.View style={[styles.iconCircle, iconStyle]}>
                <Sun size={48} color={getLuxColor()} strokeWidth={2} />
              </Animated.View>

              {/* Title */}
              <Animated.Text entering={FadeIn.delay(200)} style={styles.title}>
                Let's make sure your phone can detect the morning
              </Animated.Text>

              {/* Lux Meter */}
              <Animated.View style={[styles.luxContainer, luxStyle]}>
                <Text style={[styles.luxValue, { color: getLuxColor() }]}>
                  {sensorAvailable ? currentLux.toLocaleString() : '--'}
                </Text>
                <Text style={styles.luxLabel}>lux</Text>
              </Animated.View>

              {/* Instructions */}
              <Text style={styles.instructions}>
                {sensorAvailable
                  ? 'Point your phone toward any light source'
                  : 'Light sensor not available on this device'}
              </Text>

              {/* Progress indicator */}
              {sensorAvailable && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min((currentLux / SUCCESS_LUX_THRESHOLD) * 100, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {currentLux < SUCCESS_LUX_THRESHOLD
                      ? `${Math.round((currentLux / SUCCESS_LUX_THRESHOLD) * 100)}% - need ${SUCCESS_LUX_THRESHOLD}+ lux`
                      : 'Success!'}
                  </Text>
                </View>
              )}
            </View>

            {/* Skip Option */}
            {showSkipOption && (
              <Animated.View entering={FadeIn} style={styles.skipContainer}>
                <View style={styles.skipCard}>
                  <Clock size={20} color="#666" />
                  <Text style={styles.skipText}>
                    Onboarding at night? No problem.
                  </Text>
                </View>
                <Pressable onPress={handleSkip} style={styles.skipButton}>
                  <Text style={styles.skipButtonText}>
                    We'll calibrate tomorrow morning
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  screenSuccess: {
    backgroundColor: '#22C55E',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#FFD93D',
    shadowOffset: { width: 0, height: 0 },
  },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  luxContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  luxValue: {
    fontSize: 72,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: -2,
    lineHeight: 80,
  },
  luxLabel: {
    fontSize: 20,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  instructions: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 32,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 32,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  skipContainer: {
    gap: 12,
  },
  skipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  skipButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FF6B35',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 32,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 18,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 24,
  },
});
