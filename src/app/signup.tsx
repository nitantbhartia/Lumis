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
import { Sun, Mail, Lock, Eye, EyeOff, User, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useAuthStore } from '@/lib/state/auth-store';
import { SocialAuthButtons } from '@/components/SocialAuthButtons';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const signup = useAuthStore((s) => s.signup);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const buttonScale = useSharedValue(1);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleSignup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const result = await signup(email, password, name);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/onboarding');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error ?? 'Signup failed');
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSocialSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/onboarding');
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
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 30,
              paddingHorizontal: 32,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
            <Animated.View entering={FadeIn.duration(800)} className="items-center mb-8">
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
                Create Account
              </Text>
              <Text
                className="text-lumis-sunrise/60 text-center"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                Start your journey to better mornings
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

              {/* Name input */}
              <View className="bg-lumis-twilight/50 rounded-2xl border border-lumis-dusk/50 flex-row items-center px-4">
                <User size={20} color="#FFB34780" strokeWidth={1.5} />
                <TextInput
                  className="flex-1 py-4 px-3 text-lumis-dawn text-base"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                  placeholder="Your name"
                  placeholderTextColor="#FFE4B540"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

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
                  placeholder="Password (min 6 characters)"
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

              {/* Confirm password input */}
              <View className="bg-lumis-twilight/50 rounded-2xl border border-lumis-dusk/50 flex-row items-center px-4">
                <Lock size={20} color="#FFB34780" strokeWidth={1.5} />
                <TextInput
                  className="flex-1 py-4 px-3 text-lumis-dawn text-base"
                  style={{ fontFamily: 'Outfit_400Regular' }}
                  placeholder="Confirm password"
                  placeholderTextColor="#FFE4B540"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>

              {/* Signup button */}
              <Animated.View style={buttonAnimStyle} className="pt-4">
                <Pressable
                  onPress={handleSignup}
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
                          Create Account
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
                  or sign up with
                </Text>
                <View className="flex-1 h-[1px] bg-lumis-dusk/50" />
              </View>

              {/* Social Auth Buttons */}
              <SocialAuthButtons
                onSuccess={handleSocialSuccess}
                onError={handleSocialError}
              />
            </Animated.View>

            {/* Terms */}
            <Animated.View entering={FadeInDown.delay(500).duration(600)} className="mt-6">
              <Text
                className="text-lumis-sunrise/40 text-center text-sm"
                style={{ fontFamily: 'Outfit_400Regular' }}
              >
                By creating an account, you agree to our{' '}
                <Text className="text-lumis-golden">Terms of Service</Text> and{' '}
                <Text className="text-lumis-golden">Privacy Policy</Text>
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
