import { View, Text, Pressable, Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '@/lib/state/auth-store';
import { useState } from 'react';
import Svg, { Path } from 'react-native-svg';

WebBrowser.maybeCompleteAuthSession();

interface SocialAuthButtonsProps {
  onSuccess?: (isNewUser?: boolean) => void;
  onError?: (error: string) => void;
}

export function SocialAuthButtons({ onSuccess, onError }: SocialAuthButtonsProps) {
  const socialLogin = useAuthStore(s => s.socialLogin);
  const [isLoading, setIsLoading] = useState<'apple' | 'google' | null>(null);

  const handleAppleSignIn = async () => {
    setIsLoading('apple');

    try {
      // Since expo-apple-authentication is not installed,
      // we use mock mode which simulates the Apple sign-in flow
      const result = await socialLogin({
        provider: 'apple',
        idToken: 'mock_apple_token',
        email: 'user@icloud.com',
        name: 'Apple User',
      });

      setIsLoading(null);

      if (result.success) {
        onSuccess?.(result.isNewUser);
      } else {
        onError?.(result.error || 'Apple sign in failed');
      }
    } catch {
      setIsLoading(null);
      onError?.('Apple sign in failed');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading('google');

    try {
      // Use mock mode for demo - in production, you would configure
      // Google OAuth credentials in the ENV tab
      const result = await socialLogin({
        provider: 'google',
        idToken: 'mock_google_token',
        email: 'user@gmail.com',
        name: 'Google User',
      });

      setIsLoading(null);

      if (result.success) {
        onSuccess?.(result.isNewUser);
      } else {
        onError?.(result.error || 'Google sign in failed');
      }
    } catch {
      setIsLoading(null);
      onError?.('Google sign in failed');
    }
  };

  return (
    <View className="gap-3">
      {/* Apple Sign In */}
      {Platform.OS === 'ios' && (
        <Pressable
          onPress={handleAppleSignIn}
          disabled={isLoading !== null}
          className="flex-row items-center justify-center bg-white rounded-xl py-4 px-6 gap-3"
          style={{ opacity: isLoading === 'apple' ? 0.7 : 1 }}
        >
          <AppleIcon />
          <Text className="text-black text-lg font-semibold">
            {isLoading === 'apple' ? 'Signing in...' : 'Continue with Apple'}
          </Text>
        </Pressable>
      )}

      {/* Google Sign In */}
      <Pressable
        onPress={handleGoogleSignIn}
        disabled={isLoading !== null}
        className="flex-row items-center justify-center bg-white rounded-xl py-4 px-6 gap-3 border border-gray-200"
        style={{ opacity: isLoading === 'google' ? 0.7 : 1 }}
      >
        <GoogleIcon />
        <Text className="text-gray-800 text-lg font-semibold">
          {isLoading === 'google' ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </Pressable>
    </View>
  );
}

// Apple logo icon
function AppleIcon() {
  return (
    <Svg width={20} height={24} viewBox="0 0 17 20" fill="none">
      <Path
        d="M8.434 4.688c.807 0 1.819-.542 2.422-1.266.542-.651 1.024-1.603 1.024-2.555 0-.127-.012-.254-.036-.363-.976.036-2.157.651-2.867 1.471-.542.614-1.096 1.554-1.096 2.52 0 .14.024.278.036.326.06.012.156.024.252.024zm-2.495 12.96c1.108 0 1.603-.735 2.978-.735 1.398 0 1.713.711 2.953.711 1.217 0 2.036-1.12 2.808-2.217.868-1.253 1.23-2.482 1.254-2.542-.085-.024-2.446-.976-2.446-3.64 0-2.313 1.844-3.35 1.94-3.422-1.205-1.723-3.039-1.783-3.532-1.783-1.35 0-2.447.807-3.133.807-.735 0-1.713-.759-2.893-.759C3.33 4.068.813 6.141.813 10.1c0 2.446.952 5.03 2.133 6.74.976 1.435 1.832 2.808 2.993 2.808z"
        fill="#000"
      />
    </Svg>
  );
}

// Google G logo icon
function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}
