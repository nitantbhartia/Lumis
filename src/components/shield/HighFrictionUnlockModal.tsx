import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, Heart, DollarSign } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useLumisStore } from '@/lib/state/lumis-store';
import { CHARITIES } from '@/components/CharitySelector';

interface HighFrictionUnlockModalProps {
  visible: boolean;
  onClose: () => void;
  onUnlock: () => void;
  currentStreak: number;
}

const PENALTY_AMOUNT = 1.00;

export function HighFrictionUnlockModal({
  visible,
  onClose,
  onUnlock,
  currentStreak,
}: HighFrictionUnlockModalProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get stakes settings from store
  const stakesEnabled = useLumisStore((s) => s.stakesEnabled);
  const selectedCharity = useLumisStore((s) => s.selectedCharity);
  const isPremium = useLumisStore((s) => s.isPremium);
  const performEmergencyUnlock = useLumisStore((s) => s.performEmergencyUnlock);
  const recordPenalty = useLumisStore((s) => s.recordPenalty);

  // Get charity name
  const charity = CHARITIES.find((c) => c.id === selectedCharity);
  const charityName = charity?.name || 'your selected charity';

  // Pulse animation for warning
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      pulseScale.value = withRepeat(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [visible]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleUnlockFree = () => {
    // Free mode: just warn and reset streak
    Alert.alert(
      'Break your streak?',
      `Your ${currentStreak}-day streak will reset to 0. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Break Streak',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            performEmergencyUnlock();
            onUnlock();
            onClose();
          },
        },
      ]
    );
  };

  const handleUnlockWithPenalty = async () => {
    // Stakes mode: charge $1 via RevenueCat
    Alert.alert(
      `Pay $${PENALTY_AMOUNT.toFixed(2)} to unlock?`,
      `This will go to ${charityName}. Your ${currentStreak}-day streak will also reset.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Pay $${PENALTY_AMOUNT.toFixed(2)}`,
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              // TODO: Integrate RevenueCat for $1 penalty payment
              // For now, we'll simulate the payment and just record it

              // Simulate payment processing
              await new Promise((resolve) => setTimeout(resolve, 1000));

              // Record penalty in store
              recordPenalty(PENALTY_AMOUNT);

              // Reset streak
              performEmergencyUnlock();

              // Unlock and close
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onUnlock();
              onClose();

              // Show success message
              setTimeout(() => {
                Alert.alert(
                  '💔 Streak Broken',
                  `$${PENALTY_AMOUNT.toFixed(2)} → ${charityName}\n\nYour ${currentStreak}-day run is over. Start fresh tomorrow.`,
                  [{ text: 'OK' }]
                );
              }, 500);
            } catch (error) {
              Alert.alert('Payment Failed', 'Unable to process payment. Try again.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handlePremiumBypass = () => {
    // Premium users can bypass without penalty
    Alert.alert(
      'Premium Unlock',
      'Use your premium bypass? Your streak will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onUnlock();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
            <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
              {/* Warning Icon */}
              <Animated.View style={[styles.iconContainer, pulseStyle]}>
                {stakesEnabled ? (
                  <DollarSign size={40} color="#E74C3C" strokeWidth={2.5} />
                ) : (
                  <AlertTriangle size={40} color="#E74C3C" strokeWidth={2.5} />
                )}
              </Animated.View>

              {/* Title */}
              <Text style={styles.title}>
                {stakesEnabled
                  ? `Break your streak? That'll be $${PENALTY_AMOUNT.toFixed(0)}.`
                  : 'Break your streak?'}
              </Text>

              {/* Subtitle */}
              <Text style={styles.subtitle}>
                {stakesEnabled
                  ? `This donation goes 100% to ${charityName}. Are you sure?`
                  : `Your ${currentStreak}-day streak will reset to 0.`}
              </Text>

              {/* Info Cards */}
              <View style={styles.infoContainer}>
                {currentStreak > 0 && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoEmoji}>🔥</Text>
                    <Text style={styles.infoText}>
                      {currentStreak} day streak → 0 days
                    </Text>
                  </View>
                )}

                {stakesEnabled && (
                  <View style={[styles.infoCard, styles.penaltyCard]}>
                    <Text style={styles.infoEmoji}>{charity?.emoji || '❤️'}</Text>
                    <Text style={styles.infoText}>
                      ${PENALTY_AMOUNT.toFixed(2)} → {charity?.name}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonGroup}>
                {/* Primary destructive action */}
                {isPremium ? (
                  <Pressable
                    onPress={handlePremiumBypass}
                    disabled={isProcessing}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      styles.premiumButton,
                      pressed && styles.buttonPressed,
                      isProcessing && styles.buttonDisabled,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      Premium Unlock
                    </Text>
                  </Pressable>
                ) : stakesEnabled ? (
                  <Pressable
                    onPress={handleUnlockWithPenalty}
                    disabled={isProcessing}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      styles.dangerButton,
                      pressed && styles.buttonPressed,
                      isProcessing && styles.buttonDisabled,
                    ]}
                  >
                    <DollarSign size={18} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.primaryButtonText}>
                      {isProcessing
                        ? 'Processing...'
                        : `Pay $${PENALTY_AMOUNT.toFixed(0)} to Unlock`}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleUnlockFree}
                    disabled={isProcessing}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      styles.dangerButton,
                      pressed && styles.buttonPressed,
                      isProcessing && styles.buttonDisabled,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>Break Streak</Text>
                  </Pressable>
                )}

                {/* Cancel */}
                <Pressable
                  onPress={onClose}
                  disabled={isProcessing}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>
                    I'll get my light
                  </Text>
                </Pressable>
              </View>

              {/* Footer hint */}
              {!isPremium && stakesEnabled && (
                <Pressable
                  onPress={() => {
                    onClose();
                    router.push('/(tabs)/premium');
                  }}
                  style={styles.footer}
                >
                  <Text style={styles.footerText}>
                    ⭐ Premium: Unlimited bypasses
                  </Text>
                </Pressable>
              )}
            </Animated.View>
          </Pressable>
        </Pressable>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE8E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1F36',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    padding: 16,
  },
  penaltyCard: {
    backgroundColor: '#FFE8E0',
  },
  infoEmoji: {
    fontSize: 24,
  },
  infoText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#1A1F36',
    flex: 1,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  dangerButton: {
    backgroundColor: '#E74C3C',
  },
  premiumButton: {
    backgroundColor: '#FFD93D',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#4A90E2',
  },
  footer: {
    marginTop: 16,
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#A0AEC0',
    textAlign: 'center',
  },
});
