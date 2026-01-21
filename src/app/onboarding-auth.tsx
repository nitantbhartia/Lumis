import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Apple } from 'lucide-react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { useAuthStore } from '@/lib/state/auth-store';

const SunBurstIcon = () => (
  <Svg width={180} height={180} viewBox="0 0 100 100">
    <G transform="translate(50, 50)">
      {Array.from({ length: 16 }).map((_, i) => (
        <Path
          key={i}
          d="M0 -35 L0 -45"
          stroke="#1A1A2E"
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={`rotate(${(i * 360) / 16})`}
        />
      ))}
      <Circle cx="0" cy="0" r="10" fill="none" stroke="#1A1A2E" strokeWidth="1.5" />
    </G>
  </Svg>
);

export default function OnboardingAuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const socialLogin = useAuthStore((s) => s.socialLogin);
  const setUserName = useAuthStore((s) => s.setUserName);

  const handleAppleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      const result = await socialLogin({
        provider: 'apple',
        idToken: 'mock_token_' + Date.now(),
        email: 'user@icloud.com',
        name: 'Apple User',
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUserName('Apple User');
        router.push('/onboarding-success');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
        locations={[0, 0.3, 0.7, 1]}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 32,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Icon Section */}
          <View style={styles.iconContainer}>
            <SunBurstIcon />
          </View>

          {/* Text Section */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              Sign up or log in to start seeking the Sun
            </Text>
          </View>

          {/* Action Section */}
          <View style={styles.actionsContainer}>
            <Pressable
              onPress={handleAppleSignIn}
              disabled={isLoading}
            >
              <View style={[
                styles.appleButton,
                { backgroundColor: '#000000' }, // Hardcoded black
                isLoading && { opacity: 0.5 }
              ]}>
                <Apple size={24} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
              </View>
            </Pressable>

            {/* Terms & Privacy */}
            <Text style={styles.footerText}>
              By continuing to use Lumis, you agree to our{' '}
              <Text
                style={styles.linkText}
                onPress={() => Linking.openURL('https://example.com/terms')}
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                style={styles.linkText}
                onPress={() => Linking.openURL('https://example.com/privacy')}
              >
                Privacy Policy
              </Text>
              . Personal data added to Lumis is private.
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    marginTop: 40,
  },
  textContainer: {
    width: '100%',
    paddingHorizontal: 0,
    marginTop: 20,
  },
  title: {
    fontSize: 42,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
    lineHeight: 52,
    textAlign: 'left',
  },
  actionsContainer: {
    width: '100%',
    gap: 20,
    marginBottom: 20,
  },
  appleButton: {
    flexDirection: 'row',
    backgroundColor: '#000000', // Pure black
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#000',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Outfit_500Medium',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#1A1A2E',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
});
