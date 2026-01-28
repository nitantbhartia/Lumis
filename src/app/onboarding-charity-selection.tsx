import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useLumisStore } from '@/lib/state/lumis-store';
import { CharitySelector, CHARITIES, type CharityId } from '@/components/CharitySelector';

export default function OnboardingCharitySelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSelectedCharity = useLumisStore((s) => s.setSelectedCharity);
  const [charity, setCharity] = useState<CharityId | null>(null);

  const handleSelectCharity = (charityId: CharityId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCharity(charityId);
  };

  const handleContinue = () => {
    if (!charity) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCharity(charity);

    // Proceed to success
    router.push('/onboarding-success');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCharity(null);
    router.push('/onboarding-success');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <Text style={styles.title}>Where should penalties go?</Text>
          <Text style={styles.subtitle}>
            When you skip, $1 goes to your chosen charity
          </Text>
        </Animated.View>

        {/* Charity Selector */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <CharitySelector selected={charity} onSelect={handleSelectCharity} />
        </Animated.View>

        {/* Info Card */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 100% of penalties are donated. No fees.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Continue Button */}
      <Animated.View
        entering={FadeInDown.delay(600)}
        style={[styles.buttonContainer, { paddingBottom: insets.bottom + 20 }]}
      >
        <Pressable
          onPress={handleContinue}
          disabled={!charity}
          style={({ pressed }) => [
            styles.button,
            !charity && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.buttonText, !charity && styles.buttonTextDisabled]}>
            Continue
          </Text>
        </Pressable>

        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Choose later</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 32,
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
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 217, 61, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 217, 61, 0.2)',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#FFD93D',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingTop: 16,
    backgroundColor: '#0F172A',
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  buttonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
