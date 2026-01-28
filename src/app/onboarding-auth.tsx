import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Apple } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { useAuthStore } from '@/lib/state/auth-store';

const SunBurstIcon = () => (
  <Svg width={180} height={180} viewBox="0 0 100 100">
    <G transform="translate(50, 50)">
      {Array.from({ length: 16 }).map((_, i) => (
        <Path
          key={i}
          d="M0 -35 L0 -45"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={`rotate(${(i * 360) / 16})`}
        />
      ))}
      <Circle cx="0" cy="0" r="10" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
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
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        alert('Apple Sign In is not available on this device');
        setIsLoading(false);
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const hasName = credential.fullName?.givenName;
      const fullName = hasName
        ? `${credential.fullName?.givenName} ${credential.fullName?.familyName || ''}`.trim()
        : null;

      const result = await socialLogin({
        provider: 'apple',
        idToken: credential.identityToken!,
        email: credential.email,
        name: fullName || undefined,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (fullName) {
          setUserName(fullName);
        }
        // Returning user - go directly to dashboard
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      if (e.code !== 'ERR_CANCELED') {
        console.error('Apple Sign In Error:', e);
        alert('Failed to sign in with Apple. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
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
                isLoading && { opacity: 0.5 }
              ]}>
                <Apple size={24} color="#000000" fill="#000000" />
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
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  appleButtonText: {
    color: '#000000',
    fontSize: 22,
    fontFamily: 'Outfit_500Medium',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
});
