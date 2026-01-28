import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Target, Heart } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';

export default function OnboardingStakesChoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setStakesEnabled = useLumisStore((s) => s.setStakesEnabled);
  const [selectedMode, setSelectedMode] = useState<'stakes' | 'free' | null>(null);

  const handleSelectStakes = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMode('stakes');
  };

  const handleSelectFree = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMode('free');
  };

  const handleContinue = () => {
    if (!selectedMode) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStakesEnabled(selectedMode === 'stakes');

    // If stakes enabled, go to charity selection
    // Otherwise, skip to first unlock experience
    if (selectedMode === 'stakes') {
      router.push('/onboarding-charity-selection');
    } else {
      router.push('/onboarding-first-unlock');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <Text style={styles.title}>Choose your mode</Text>
          <Text style={styles.subtitle}>You can always change this later</Text>
        </Animated.View>

        {/* Stakes Card */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Pressable
            onPress={handleSelectStakes}
            style={({ pressed }) => [
              styles.card,
              styles.stakesCard,
              selectedMode === 'stakes' && styles.cardSelected,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Target size={24} color="#FF6B35" strokeWidth={2.5} />
              </View>
              <Text style={styles.cardTitle}>WITH STAKES</Text>
            </View>
            <Text style={styles.cardDescription}>
              $1 penalty if you skip
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>⭐ 3x more effective</Text>
            </View>
            {selectedMode === 'stakes' && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* Divider */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Free Card */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Pressable
            onPress={handleSelectFree}
            style={({ pressed }) => [
              styles.card,
              styles.freeCard,
              selectedMode === 'free' && styles.cardSelected,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, styles.iconContainerSecondary]}>
                <Heart size={24} color="#4A90E2" strokeWidth={2.5} />
              </View>
              <Text style={styles.cardTitle}>NO STAKES (for now)</Text>
            </View>
            <Text style={styles.cardDescription}>
              Just breaks your streak
            </Text>
            <Text style={styles.cardHint}>
              Try it first, add stakes later
            </Text>
            {selectedMode === 'free' && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>
      </View>

      {/* Continue Button */}
      <Animated.View
        entering={FadeInDown.delay(600)}
        style={[styles.buttonContainer, { paddingBottom: insets.bottom + 20 }]}
      >
        <Pressable
          onPress={handleContinue}
          disabled={!selectedMode}
          style={({ pressed }) => [
            styles.button,
            !selectedMode && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.buttonText, !selectedMode && styles.buttonTextDisabled]}>
            Continue
          </Text>
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
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stakesCard: {
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  freeCard: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerSecondary: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(255, 217, 61, 0.2)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 217, 61, 0.4)',
  },
  badgeText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFD93D',
  },
  cardHint: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  buttonContainer: {
    paddingHorizontal: 32,
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 0,
    paddingVertical: 20,
    marginHorizontal: -32,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  buttonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
});
