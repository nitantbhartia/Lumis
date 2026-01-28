import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

    // Proceed to first unlock experience
    router.push('/onboarding-first-unlock');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: '#1A1F36',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#4A5568',
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 217, 61, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 217, 61, 0.4)',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#1A1F36',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 31, 54, 0.1)',
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
    backgroundColor: '#E1E8ED',
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
    color: '#A0AEC0',
  },
});
