import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Clock, Target, Sparkles, Check, LucideIcon } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

type CommitmentLevel = 'free' | 'committed' | 'pro';

interface CommitmentOption {
  id: CommitmentLevel;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  badge?: string;
  isRecommended?: boolean;
  features: string[];
}

const OPTIONS: CommitmentOption[] = [
  {
    id: 'free',
    title: 'Free',
    subtitle: 'Try it out for 7 days',
    icon: Clock,
    features: ['App blocking', 'Morning light tracking', 'Basic streaks'],
  },
  {
    id: 'committed',
    title: 'Committed',
    subtitle: '$1 penalty if you skip',
    icon: Target,
    badge: 'MOST EFFECTIVE',
    isRecommended: true,
    features: ['Everything in Free', 'Real stakes for motivation', 'Choose your charity'],
  },
  {
    id: 'pro',
    title: 'Pro',
    subtitle: '$4.99/mo',
    icon: Sparkles,
    features: ['Everything in Committed', 'Detailed progress insights', 'Skip passes (3/mo)', 'Priority support'],
  },
];

export default function OnboardingCommitmentChoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<CommitmentLevel | null>('committed');
  const setStakesEnabled = useLumisStore((s) => s.setStakesEnabled);
  const setIsPremium = useLumisStore((s) => s.setIsPremium);

  // Animation values
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const cardsOpacity = OPTIONS.map(() => useSharedValue(0));
  const cardsTranslateX = OPTIONS.map(() => useSharedValue(40));
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Title
    titleOpacity.value = withTiming(1, { duration: 400 });
    titleTranslateY.value = withTiming(0, { duration: 400 });

    // Staggered cards slide in from right
    OPTIONS.forEach((_, index) => {
      const delay = 200 + index * 100;
      cardsOpacity[index].value = withDelay(delay, withTiming(1, { duration: 300 }));
      cardsTranslateX[index].value = withDelay(delay, withTiming(0, { duration: 300 }));
    });

    // Button
    buttonOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleSelect = (option: CommitmentLevel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(option);
  };

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Set states based on selection
    setStakesEnabled(selected === 'committed' || selected === 'pro');
    setIsPremium(selected === 'pro');

    // Route based on selection
    if (selected === 'committed' || selected === 'pro') {
      router.push('/onboarding-payment');
    } else {
      router.push('/onboarding-permissions');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text style={[styles.title, titleStyle]}>
          Choose your{'\n'}commitment level
        </Animated.Text>

        <View style={styles.options}>
          {OPTIONS.map((option, index) => {
            const Icon = option.icon;
            const isSelected = selected === option.id;
            const cardStyle = useAnimatedStyle(() => ({
              opacity: cardsOpacity[index].value,
              transform: [{ translateX: cardsTranslateX[index].value }],
            }));
            return (
              <Animated.View key={option.id} style={cardStyle}>
                <Pressable
                  onPress={() => handleSelect(option.id)}
                  style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                    option.isRecommended && styles.cardRecommended,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.iconContainer,
                        isSelected && styles.iconContainerSelected,
                      ]}
                    >
                      <Icon
                        size={24}
                        color={isSelected ? '#FF6B35' : 'rgba(255,255,255,0.6)'}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={styles.textContainer}>
                      <View style={styles.titleRow}>
                        <Text style={styles.cardTitle}>{option.title}</Text>
                        {option.badge && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{option.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
                    </View>
                    <View style={[styles.checkmark, !isSelected && styles.checkmarkHidden]}>
                      <Check size={16} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  </View>
                  {/* Features list */}
                  <View style={styles.featuresList}>
                    {option.features.map((feature, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <Check size={14} color={isSelected ? '#FF6B35' : 'rgba(255,255,255,0.4)'} strokeWidth={2.5} />
                        <Text style={[styles.featureText, isSelected && styles.featureTextSelected]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed button at bottom */}
      <Animated.View style={[styles.buttonContainer, { paddingBottom: insets.bottom }, buttonStyle]}>
        <Pressable
          onPress={handleContinue}
          disabled={!selected}
          style={[
            styles.button,
            !selected && styles.buttonDisabled,
          ]}
        >
          <Text
            style={[styles.buttonText, !selected && styles.buttonTextDisabled]}
          >
            CONTINUE
          </Text>
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
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 40,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    lineHeight: 48,
    letterSpacing: -1,
    marginBottom: 40,
  },
  options: {
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  cardRecommended: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#FFB347',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkmarkHidden: {
    opacity: 0,
  },
  featuresList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  featureTextSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  buttonContainer: {
    backgroundColor: '#0F172A',
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 22,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  buttonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
});
