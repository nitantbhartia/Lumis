import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
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
import { Sun, Mail, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '@/lib/state/auth-store';
import { SocialAuthButtons } from '@/components/SocialAuthButtons';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const buttonScale = useSharedValue(1);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError('');

    const result = await login(email, password);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error ?? 'Login failed');
    }
  };

  const handleSignup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/signup');
  };

  const handleForgotPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/forgot-password');
  };

  const handleSocialSuccess = (isNewUser?: boolean) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isNewUser) {
      router.replace('/onboarding');
    } else {
      router.replace('/');
    }
  };

  const handleSocialError = (errorMsg: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setError(errorMsg);
  };

  return (
    <View className="flex-1">
      <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View
            className="flex-1 px-8 justify-between"
            style={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 30 }}
          >
            {/* Header */}
            <Animated.View entering={FadeIn.duration(800)} className="items-center">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-6"
                style={{
                  backgroundColor: 'rgba(255, 179, 71, 0.15)',
                  shadowColor: '#FFB347',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.4,
                  shadowRadius: 20,
                }}
              >
                <Sun size={40} color="#FFB347" strokeWidth={1.5} />
              </View>
              <Text
                className="text-4xl text-lumis-dawn mb-2"
                style={{ fontFamily: 'Outfit_700Bold' }}
              >
                Welcome Back
              </Text>
              <Text
                className="text-lumis-sunrise/60 text-center"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Sign in to continue your light journey
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

              {/* Password input */}
              <View className="bg-lumis-twilight/50 rounded-2xl border border-lumis-dusk/50 flex-row items-center px-4">
                <Lock size={20} color="#FFB34780" strokeWidth={1.5} />
                <TextInput
                  className="flex-1 py-4 px-3 text-lumis-dawn text-base"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                  placeholder="Password"
                  placeholderTextColor="#FFE4B540"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color="#FFB34780" strokeWidth={1.5} />
                  ) : (
                    <Eye size={20} color="#FFB34780" strokeWidth={1.5} />
                  )}
                </Pressable>
              </View>

              {/* Forgot password */}
              <Pressable onPress={handleForgotPassword} className="self-end">
                <Text
                  className="text-lumis-golden text-sm"
                  style={{ fontFamily: 'Outfit_500Medium' }}
                >
                  Forgot password?
                </Text>
              </Pressable>

              {/* Login button */}
              <Animated.View style={buttonAnimStyle} className="pt-4">
                <Pressable
                  onPress={handleLogin}
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
                          Sign In
                        </Text>
                        <ChevronRight size={20} color="#1A1A2E" strokeWidth={2.5} />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              {/* Divider */}
              <View className="flex-row items-center my-4">
                <View className="flex-1 h-[1px] bg-lumis-dusk/50" />
                <Text
                  className="text-lumis-sunrise/40 mx-4 text-sm"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  or continue with
                </Text>
                <View className="flex-1 h-[1px] bg-lumis-dusk/50" />
              </View>

              {/* Social Auth Buttons */}
              <SocialAuthButtons
                onSuccess={handleSocialSuccess}
                onError={handleSocialError}
              />
            </Animated.View>

            {/* Sign up link */}
            <Animated.View entering={FadeInDown.delay(500).duration(600)} className="items-center">
              <Pressable onPress={handleSignup} className="flex-row items-center py-4">
                <Text
                  className="text-lumis-sunrise/60"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                >
                  Don't have an account?{' '}
                </Text>
                <Text className="text-lumis-golden" style={{ fontFamily: 'Outfit_600SemiBold' }}>
                  Sign Up
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
