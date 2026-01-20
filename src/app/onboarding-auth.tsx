import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Mail, Apple, Chrome } from 'lucide-react-native';
import { useAuthStore } from '@/lib/state/auth-store';
import { cn } from '@/lib/cn';

export default function OnboardingAuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [authMethod, setAuthMethod] = useState<'apple' | 'google' | 'email' | null>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const socialLogin = useAuthStore((s) => s.socialLogin);
  const setUserName = useAuthStore((s) => s.setUserName);

  const handleAppleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      // In production, this would use expo-apple-authentication
      const result = await socialLogin({
        provider: 'apple',
        idToken: 'mock_token_' + Date.now(),
        email: 'user@icloud.com',
        name: 'Apple User',
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUserName('Apple User');
        router.push('/onboarding-permissions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      // In production, this would use @react-native-google-signin/google-signin
      const result = await socialLogin({
        provider: 'google',
        idToken: 'mock_token_' + Date.now(),
        email: 'user@gmail.com',
        name: 'Google User',
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUserName('Google User');
        router.push('/onboarding-permissions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailOTP = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setUserName(email.split('@')[0]);
      router.push('/onboarding-email-otp');
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      <View className="flex-1">
        <LinearGradient
          colors={['#1A1A2E', '#16213E', '#0F3460']}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 40,
              paddingHorizontal: 24,
            }}
            scrollEnabled={false}
          >
            <View className="flex-1 gap-8">
              {/* Header */}
              <View>
                <Text
                  className="text-5xl text-lumis-dawn mb-2"
                  style={{ fontFamily: 'Outfit_700Bold' }}
                >
                  Save your{'\n'}progress
                </Text>
                <Text
                  className="text-lg text-lumis-sunrise"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  Who are we waking up?
                </Text>
              </View>

              {/* Auth Methods */}
              <View className="gap-3">
                {/* Apple Sign In */}
                <Pressable
                  onPress={handleAppleSignIn}
                  disabled={isLoading}
                  className="active:scale-95"
                >
                  <LinearGradient
                    colors={['#FFFFFF', '#F5F5F5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingVertical: 16,
                      borderRadius: 12,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    <Apple size={20} color="#000" strokeWidth={2} />
                    <Text
                      className="text-lg text-black"
                      style={{ fontFamily: 'Outfit_600SemiBold' }}
                    >
                      Continue with Apple
                    </Text>
                  </LinearGradient>
                </Pressable>

                {/* Google Sign In */}
                <Pressable
                  onPress={handleGoogleSignIn}
                  disabled={isLoading}
                  className="active:scale-95"
                >
                  <LinearGradient
                    colors={['#FFFFFF', '#F5F5F5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingVertical: 16,
                      borderRadius: 12,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    <Chrome size={20} color="#1F2937" strokeWidth={2} />
                    <Text
                      className="text-lg text-black"
                      style={{ fontFamily: 'Outfit_600SemiBold' }}
                    >
                      Continue with Google
                    </Text>
                  </LinearGradient>
                </Pressable>

                {/* Divider */}
                <View className="flex-row items-center gap-4 my-2">
                  <View className="flex-1 h-px bg-lumis-dusk" />
                  <Text
                    className="text-lumis-sunrise text-sm"
                    style={{ fontFamily: 'Outfit_400Regular' }}
                  >
                    or
                  </Text>
                  <View className="flex-1 h-px bg-lumis-dusk" />
                </View>

                {/* Email Input */}
                {authMethod === 'email' ? (
                  <View className="gap-3">
                    <TextInput
                      placeholder="your@email.com"
                      placeholderTextColor="#FFE4B5"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!isLoading}
                      className="w-full px-4 py-4 rounded-lg bg-lumis-twilight text-lumis-dawn"
                      style={{
                        fontFamily: 'Outfit_400Regular',
                        borderWidth: 1,
                        borderColor: '#0F3460',
                      }}
                    />
                    <Pressable
                      onPress={handleEmailOTP}
                      disabled={!email || isLoading}
                      className="active:scale-95"
                    >
                      <LinearGradient
                        colors={['#FFB347', '#FF8C00', '#FF6B35']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          paddingVertical: 16,
                          borderRadius: 12,
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 8,
                          opacity: !email || isLoading ? 0.5 : 1,
                        }}
                      >
                        <Text
                          className="text-lg text-lumis-night"
                          style={{ fontFamily: 'Outfit_600SemiBold' }}
                        >
                          Send Magic Link
                        </Text>
                      </LinearGradient>
                    </Pressable>
                    <Pressable onPress={() => setAuthMethod(null)}>
                      <Text
                        className="text-lumis-sunrise text-center text-base"
                        style={{ fontFamily: 'Outfit_500Medium' }}
                      >
                        Back
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setAuthMethod('email');
                    }}
                    className="active:scale-95"
                  >
                    <View
                      style={{
                        paddingVertical: 16,
                        borderRadius: 12,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 8,
                        borderWidth: 1,
                        borderColor: '#FFB347',
                      }}
                    >
                      <Mail size={20} color="#FFB347" strokeWidth={2} />
                      <Text
                        className="text-lg text-lumis-golden"
                        style={{ fontFamily: 'Outfit_600SemiBold' }}
                      >
                        Use Email
                      </Text>
                    </View>
                  </Pressable>
                )}
              </View>

              {/* Security Note */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: '#16213E',
                  borderRadius: 8,
                  borderLeftWidth: 3,
                  borderLeftColor: '#FFB347',
                }}
              >
                <Text
                  className="text-sm text-lumis-sunrise"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  Your authentication is secure. This data never leaves your device.
                </Text>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
  );
}
