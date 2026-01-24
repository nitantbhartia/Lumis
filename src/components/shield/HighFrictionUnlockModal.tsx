import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  AlertTriangle,
  Flame,
  Shield,
  Clock,
  X,
  Zap,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useLumisStore } from '@/lib/state/lumis-store';

interface HighFrictionUnlockModalProps {
  visible: boolean;
  onClose: () => void;
  onUnlock: () => void;
  currentStreak: number;
}

type Gate = 'warning' | 'timer' | 'confirmation';

const COOLDOWN_SECONDS = 90;
const SHAME_PHRASE = 'I choose distraction';

export function HighFrictionUnlockModal({
  visible,
  onClose,
  onUnlock,
  currentStreak,
}: HighFrictionUnlockModalProps) {
  const router = useRouter();
  const [currentGate, setCurrentGate] = useState<Gate>('warning');
  const [timeRemaining, setTimeRemaining] = useState(COOLDOWN_SECONDS);
  const [inputPhrase, setInputPhrase] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isPremium = useLumisStore((s) => s.isPremium);
  const emergencyFlares = useLumisStore((s) => s.emergencyFlares);
  const consumeEmergencyFlare = useLumisStore((s) => s.consumeEmergencyFlare);
  const getRemainingFreeUnlocks = useLumisStore((s) => s.getRemainingFreeUnlocks);
  const useMonthlyFreeUnlock = useLumisStore((s) => s.useMonthlyFreeUnlock);
  const performEmergencyUnlock = useLumisStore((s) => s.performEmergencyUnlock);
  const freeUnlocksPerMonth = useLumisStore((s) => s.freeUnlocksPerMonth);

  const remainingFreeUnlocks = getRemainingFreeUnlocks();
  const isPhraseCorrect = inputPhrase.toLowerCase().trim() === SHAME_PHRASE.toLowerCase();

  // Pulse animation for warning icon
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    if (currentGate === 'warning') {
      pulseScale.value = withRepeat(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [currentGate]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Timer countdown
  useEffect(() => {
    if (currentGate === 'timer' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setCurrentGate('confirmation');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentGate]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setCurrentGate('warning');
      setTimeRemaining(COOLDOWN_SECONDS);
      setInputPhrase('');
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible]);

  const handleContinueToTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentGate('timer');
  };

  const handleUseFlare = () => {
    if (emergencyFlares > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      consumeEmergencyFlare();
      performEmergencyUnlock();
      onUnlock();
      onClose();
    }
  };

  const handleFreeUnlock = () => {
    if (isPhraseCorrect && remainingFreeUnlocks > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      useMonthlyFreeUnlock();
      performEmergencyUnlock();
      onUnlock();
      onClose();
    }
  };

  const handleGoPro = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push('/(tabs)/premium');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderWarningGate = () => (
    <Animated.View entering={FadeIn.duration(300)} style={styles.gateContent}>
      {/* Warning Icon */}
      <Animated.View style={[styles.warningIconContainer, pulseStyle]}>
        <AlertTriangle size={40} color="#DC2626" />
      </Animated.View>

      <Text style={styles.gateTitle}>Breaking Your Promise?</Text>
      <Text style={styles.gateSubtitle}>
        This action has serious consequences
      </Text>

      {/* Consequences List */}
      <View style={styles.consequencesList}>
        {currentStreak > 0 && (
          <View style={styles.consequenceItem}>
            <Flame size={18} color="#FF6B35" />
            <Text style={styles.consequenceText}>
              Your <Text style={styles.bold}>{currentStreak}-day streak</Text> will be lost
            </Text>
          </View>
        )}

        <View style={styles.consequenceItem}>
          <Shield size={18} color="#64748B" />
          <Text style={styles.consequenceText}>
            Shield Strength stat resets to 0
          </Text>
        </View>

        <View style={styles.consequenceItem}>
          <Zap size={18} color="#F59E0B" />
          <Text style={styles.consequenceText}>
            {remainingFreeUnlocks > 0 ? (
              <>
                You've used{' '}
                <Text style={styles.bold}>
                  {freeUnlocksPerMonth - remainingFreeUnlocks}/{freeUnlocksPerMonth}
                </Text>{' '}
                free unlocks this month
              </>
            ) : (
              <Text style={styles.bold}>No free unlocks remaining this month</Text>
            )}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonGroup}>
        <Pressable
          style={styles.continueButton}
          onPress={handleContinueToTimer}
        >
          <Text style={styles.continueButtonText}>Continue Anyway</Text>
          <ChevronRight size={18} color="#DC2626" />
        </Pressable>

        <Pressable style={styles.goBackButton} onPress={onClose}>
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </Pressable>
      </View>
    </Animated.View>
  );

  const renderTimerGate = () => (
    <Animated.View entering={FadeIn.duration(300)} style={styles.gateContent}>
      {/* Timer Circle */}
      <View style={styles.timerContainer}>
        <View style={styles.timerCircle}>
          <Clock size={28} color="#F59E0B" />
          <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
        </View>
      </View>

      <Text style={styles.gateTitle}>Cooling Down</Text>
      <Text style={styles.timerMessage}>
        Your prefrontal cortex is fighting dopamine right now.{'\n'}
        Wait while it regains control.
      </Text>

      {/* Bio Message */}
      <View style={styles.bioMessageContainer}>
        <Text style={styles.bioMessage}>
          "The impulse to check your phone peaks at 90 seconds.
          If you wait, the urge naturally fades."
        </Text>
      </View>

      {/* Cancel Button */}
      <Pressable style={styles.cancelButton} onPress={onClose}>
        <Text style={styles.cancelButtonText}>
          Cancel — I'll finish my goal
        </Text>
      </Pressable>
    </Animated.View>
  );

  const renderConfirmationGate = () => (
    <Animated.View entering={FadeIn.duration(300)} style={styles.gateContent}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.gateTitle}>Final Step</Text>
        <Text style={styles.gateSubtitle}>
          Choose how to unlock your apps
        </Text>

        {/* Option 1: Type Phrase (if free unlocks remain) */}
        {remainingFreeUnlocks > 0 && (
          <View style={styles.optionCard}>
            <Text style={styles.optionLabel}>FREE UNLOCK ({remainingFreeUnlocks} remaining)</Text>
            <Text style={styles.phraseInstructions}>
              Type: "<Text style={styles.phraseHighlight}>{SHAME_PHRASE}</Text>"
            </Text>
            <TextInput
              style={styles.phraseInput}
              value={inputPhrase}
              onChangeText={setInputPhrase}
              placeholder="Type the phrase..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={[
                styles.unlockButton,
                !isPhraseCorrect && styles.unlockButtonDisabled,
              ]}
              onPress={handleFreeUnlock}
              disabled={!isPhraseCorrect}
            >
              <Text
                style={[
                  styles.unlockButtonText,
                  !isPhraseCorrect && styles.unlockButtonTextDisabled,
                ]}
              >
                Unlock Apps
              </Text>
            </Pressable>
          </View>
        )}

        {/* Divider */}
        {(remainingFreeUnlocks > 0 && (emergencyFlares > 0 || !isPremium)) && (
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
        )}

        {/* Option 2: Use Flare */}
        {emergencyFlares > 0 && (
          <Pressable style={styles.flareButton} onPress={handleUseFlare}>
            <Zap size={20} color="#FFB347" fill="#FFB347" />
            <View style={styles.flareButtonContent}>
              <Text style={styles.flareButtonText}>Use Emergency Flare</Text>
              <Text style={styles.flareCount}>{emergencyFlares} remaining</Text>
            </View>
            <ChevronRight size={18} color="#FFB347" />
          </Pressable>
        )}

        {/* Option 3: Go Pro (if no free unlocks and not premium) */}
        {remainingFreeUnlocks === 0 && !isPremium && (
          <View style={styles.proUpsellCard}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.15)', 'rgba(255, 179, 71, 0.1)']}
              style={styles.proGradient}
            >
              <Sparkles size={24} color="#8B5CF6" />
              <Text style={styles.proTitle}>Lumis Pro</Text>
              <Text style={styles.proDescription}>
                Unlimited emergency unlocks.{'\n'}
                Never type the shame phrase again.
              </Text>
              <Pressable style={styles.proButton} onPress={handleGoPro}>
                <Text style={styles.proButtonText}>View Pro Benefits</Text>
              </Pressable>
            </LinearGradient>
          </View>
        )}

        {/* No options available */}
        {remainingFreeUnlocks === 0 && emergencyFlares === 0 && !isPremium && (
          <View style={styles.noOptionsMessage}>
            <Text style={styles.noOptionsText}>
              You've used all your free unlocks this month.
              Purchase a flare or upgrade to Pro to unlock.
            </Text>
          </View>
        )}

        {/* Premium user - simple unlock */}
        {isPremium && (
          <Pressable
            style={styles.premiumUnlockButton}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              performEmergencyUnlock();
              onUnlock();
              onClose();
            }}
          >
            <Sparkles size={20} color="#FFF" />
            <Text style={styles.premiumUnlockText}>Unlock (Pro Member)</Text>
          </Pressable>
        )}

        {/* Cancel */}
        <Pressable style={styles.finalCancelButton} onPress={onClose}>
          <Text style={styles.finalCancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        </Pressable>

        <Animated.View
          entering={SlideInDown.springify().damping(15)}
          exiting={FadeOut.duration(200)}
          style={styles.modalContent}
        >
          <LinearGradient
            colors={['#1A1A2E', '#16213E']}
            style={styles.modalGradient}
          >
            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#64748B" />
            </Pressable>

            {/* Gate Content */}
            {currentGate === 'warning' && renderWarningGate()}
            {currentGate === 'timer' && renderTimerGate()}
            {currentGate === 'confirmation' && renderConfirmationGate()}
          </LinearGradient>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  modalGradient: {
    padding: 24,
    paddingTop: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  gateContent: {
    paddingTop: 8,
  },
  // Warning Gate
  warningIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  gateTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  gateSubtitle: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  consequencesList: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    marginBottom: 24,
  },
  consequenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  consequenceText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#E2E8F0',
  },
  bold: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFF',
  },
  buttonGroup: {
    gap: 12,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#DC2626',
  },
  goBackButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  goBackButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#64748B',
  },
  // Timer Gate
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 3,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 32,
    fontFamily: 'Outfit_700Bold',
    color: '#F59E0B',
    marginTop: 4,
  },
  timerMessage: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  bioMessageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  bioMessage: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#22C55E',
  },
  // Confirmation Gate
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  phraseInstructions: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#E2E8F0',
    marginBottom: 12,
  },
  phraseHighlight: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#F59E0B',
  },
  phraseInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#FFF',
    marginBottom: 12,
  },
  unlockButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  unlockButtonDisabled: {
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
  },
  unlockButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFF',
  },
  unlockButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#64748B',
    marginHorizontal: 16,
  },
  flareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 179, 71, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 71, 0.2)',
    marginBottom: 16,
  },
  flareButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  flareButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFB347',
  },
  flareCount: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#94A3B8',
  },
  proUpsellCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  proGradient: {
    padding: 20,
    alignItems: 'center',
  },
  proTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#FFF',
    marginTop: 12,
  },
  proDescription: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 20,
  },
  proButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  proButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFF',
  },
  noOptionsMessage: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  noOptionsText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#F87171',
    textAlign: 'center',
    lineHeight: 20,
  },
  premiumUnlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 16,
  },
  premiumUnlockText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFF',
  },
  finalCancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  finalCancelText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#64748B',
  },
});
