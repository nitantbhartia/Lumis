import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CreditCard, Lock } from 'lucide-react-native';

export default function OnboardingPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Placeholder - no actual payment processing
    router.push('/onboarding-permissions');
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
    return formatted.slice(0, 19);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      <View style={styles.content}>
        <Animated.Text entering={FadeIn.delay(100)} style={styles.title}>
          Add payment method
        </Animated.Text>

        <Animated.Text entering={FadeIn.delay(200)} style={styles.subtitle}>
          Your card will only be charged if you skip your morning reset.
        </Animated.Text>

        {/* Card Input Form */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.form}>
          <View style={styles.inputContainer}>
            <CreditCard
              size={20}
              color="rgba(255,255,255,0.4)"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Card number"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              keyboardType="number-pad"
              maxLength={19}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.inputHalf]}>
              <TextInput
                style={styles.input}
                placeholder="MM/YY"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={expiry}
                onChangeText={(text) => setExpiry(formatExpiry(text))}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
            <View style={[styles.inputContainer, styles.inputHalf]}>
              <TextInput
                style={styles.input}
                placeholder="CVV"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={cvv}
                onChangeText={(text) => setCvv(text.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>
        </Animated.View>

        {/* Reassurance */}
        <Animated.View entering={FadeIn.delay(500)} style={styles.reassurance}>
          <Lock size={16} color="rgba(255,255,255,0.4)" />
          <Text style={styles.reassuranceText}>
            Secured with 256-bit encryption
          </Text>
        </Animated.View>

        {/* Explanation */}
        <Animated.View entering={FadeIn.delay(600)} style={styles.explanation}>
          <Text style={styles.explanationTitle}>How it works</Text>
          <Text style={styles.explanationText}>
            Complete your morning goal = $0 charge
          </Text>
          <Text style={styles.explanationText}>
            Skip your goal = $1 goes to charity
          </Text>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeIn.delay(700)}
        style={{ paddingBottom: insets.bottom }}
      >
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>CONFIRM</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    lineHeight: 44,
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 24,
    marginBottom: 32,
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 18,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  inputHalf: {
    flex: 1,
  },
  reassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  reassuranceText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  explanation: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
  },
  explanationTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  explanationText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
    lineHeight: 28,
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
