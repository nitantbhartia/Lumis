import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/lib/state/auth-store';
import { ArrowLeft } from 'lucide-react-native';

export default function OnboardingEmailOTPScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  const socialLogin = useAuthStore((s) => s.socialLogin);
  const userName = useAuthStore((s) => s.userName);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      // Simulate OTP verification
      const result = await socialLogin({
        provider: 'google',
        idToken: 'email_otp_' + Date.now(),
        email: userName + '@example.com',
        name: userName ?? 'User',
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push('/onboarding-permissions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      <View className="flex-1">
        <LinearGradient
          colors={['#1A1A2E', '#16213E', '#0F3460']}
          style={{ flex: 1 }}
        >
          <View
            className="flex-1 px-6"
            style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }}
          >
            {/* Header with Back */}
            <View className="flex-row items-center mb-12">
              <Pressable onPress={() => router.back()}>
                <ArrowLeft size={24} color="#FFE4B5" strokeWidth={2} />
              </Pressable>
            </View>

            {/* Title */}
            <View className="mb-8">
              <Text
                className="text-5xl text-lumis-dawn mb-2"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                Check your{'\n'}email
              </Text>
              <Text
                className="text-lg text-lumis-sunrise"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                We sent a 6-digit code to your inbox
              </Text>
            </View>

            {/* OTP Input */}
            <View className="mb-12">
              <Text
                className="text-lumis-golden mb-3"
                style={{ fontFamily: 'Outfit_600SemiBold' }}
              >
                Enter Code
              </Text>
              <TextInput
                placeholder="000000"
                placeholderTextColor="#FFE4B5"
                value={otp}
                onChangeText={setOtp}
                maxLength={6}
                keyboardType="number-pad"
                editable={!isLoading}
                className="w-full px-4 py-4 rounded-lg bg-lumis-twilight text-lumis-dawn text-center text-3xl tracking-widest"
                style={{
                  fontFamily: 'Outfit_600SemiBold',
                  borderWidth: 2,
                  borderColor: otp.length === 6 ? '#FFB347' : '#0F3460',
                }}
              />
            </View>

            {/* Verify Button */}
            <Pressable
              onPress={handleVerify}
              disabled={otp.length !== 6 || isLoading}
              className="active:scale-95 mb-4"
            >
              <LinearGradient
                colors={['#FFB347', '#FF8C00', '#FF6B35']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 16,
                  borderRadius: 12,
                  opacity: otp.length !== 6 || isLoading ? 0.5 : 1,
                }}
              >
                <Text
                  className="text-lg text-lumis-night text-center"
                  style={{ fontFamily: 'Outfit_600SemiBold' }}
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Resend Timer */}
            <View className="items-center">
              {timer > 0 ? (
                <Text
                  className="text-lumis-sunrise text-base"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  Resend code in {timer}s
                </Text>
              ) : (
                <Pressable onPress={() => setTimer(60)}>
                  <Text
                    className="text-lumis-golden text-base"
                    style={{ fontFamily: 'Outfit_600SemiBold' }}
                  >
                    Resend Code
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
  );
}
