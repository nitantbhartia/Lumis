import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Mail, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react-native';
import { useAuthStore } from '@/lib/state/auth-store';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const resetPassword = useAuthStore((s) => s.resetPassword);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const buttonScale = useSharedValue(1);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleResetPassword = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError('');

    const result = await resetPassword(email);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error ?? 'Failed to send reset email');
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (success) {
    return (
      <View className="flex-1">
        <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={{ flex: 1 }}>
          <View
            className="flex-1 px-8 items-center justify-center"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
          >
            <Animated.View entering={FadeIn.duration(800)} className="items-center">
              <View
                className="w-24 h-24 rounded-full items-center justify-center mb-8"
                style={{
                  backgroundColor: 'rgba(74, 222, 128, 0.15)',
                  shadowColor: '#4ADE80',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.4,
                  shadowRadius: 20,
                }}
              >
                <CheckCircle size={48} color="#4ADE80" strokeWidth={1.5} />
              </View>
              <Text
                className="text-3xl text-lumis-dawn mb-4 text-center"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                Check Your Email
              </Text>
              <Text
                className="text-lumis-sunrise/60 text-center mb-8"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                We've sent a password reset link to{'\n'}
                <Text className="text-lumis-golden">{email}</Text>
              </Text>
              <Pressable
                onPress={handleBack}
                className="bg-lumis-twilight/50 border border-lumis-dusk rounded-xl px-8 py-4"
              >
                <Text
                  className="text-lumis-golden"
                  style={{ fontFamily: 'Outfit_600SemiBold' }}
                >
                  Back to Login
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View
            className="flex-1 px-8"
            style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 }}
          >
            {/* Back button */}
            <Pressable onPress={handleBack} className="flex-row items-center mb-8">
              <ChevronLeft size={24} color="#FFB347" strokeWidth={2} />
              <Text
                className="text-lumis-golden ml-1"
                style={{ fontFamily: 'Outfit_500Medium' }}
              >
                Back
              </Text>
            </Pressable>

            {/* Header */}
            <Animated.View entering={FadeIn.duration(800)} className="mb-8">
              <Text
                className="text-4xl text-lumis-dawn mb-4"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                Reset Password
              </Text>
              <Text
                className="text-lumis-sunrise/60"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Enter your email address and we'll send you a link to reset your password.
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(300).duration(600)} className="space-y-4">
              {/* Error message */}
              {error ? (
                <Animated.View
                  entering={FadeIn.duration(300)}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-2"
                >
                  <Text
                    className="text-red-400 text-center"
                    style={{ fontFamily: 'Outfit_500Medium' }}
                  >
                    {error}
                  </Text>
                </Animated.View>
              ) : null}

              {/* Email input */}
              <View className="bg-lumis-twilight/50 rounded-2xl border border-lumis-dusk/50 flex-row items-center px-4">
                <Mail size={20} color="#FFB34780" strokeWidth={1.5} />
                <TextInput
                  className="flex-1 py-4 px-3 text-lumis-dawn text-base"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                  placeholder="Email address"
                  placeholderTextColor="#FFE4B540"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Reset button */}
              <Animated.View style={buttonAnimStyle} className="pt-4">
                <Pressable
                  onPress={handleResetPassword}
                  onPressIn={() => {
                    buttonScale.value = withSpring(0.95);
                  }}
                  onPressOut={() => {
                    buttonScale.value = withSpring(1);
                  }}
                  disabled={isLoading}
                  className="w-full"
                >
                  <LinearGradient
                    colors={isLoading ? ['#16213E', '#0F3460'] : ['#FFB347', '#FF8C00', '#FF6B35']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingVertical: 18,
                      borderRadius: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: isLoading ? 'transparent' : '#FF8C00',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.4,
                      shadowRadius: 12,
                      elevation: 8,
                    }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFB347" />
                    ) : (
                      <>
                        <Text
                          className="text-lumis-night text-lg mr-2"
                          style={{ fontFamily: 'Outfit_600SemiBold' }}
                        >
                          Send Reset Link
                        </Text>
                        <ChevronRight size={20} color="#1A1A2E" strokeWidth={2.5} />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
