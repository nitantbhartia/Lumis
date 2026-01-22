import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { initRevenueCat } from '@/lib/revenuecat';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const LumisDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#1A1A2E',
    card: '#16213E',
    text: '#FFF8E7',
    border: '#0F3460',
    primary: '#FFB347',
  },
};

function RootLayoutNav() {
  const router = useRouter();

  // Handle deep links from shield button
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('[DeepLink] Received:', event.url);
      if (event.url.includes('start-session')) {
        // User tapped "Open Lumis" from the shield - go directly to tracking
        router.push('/tracking');
      }
    };

    // Listen for incoming deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('start-session')) {
        console.log('[DeepLink] Initial URL:', url);
        router.push('/tracking');
      }
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <ThemeProvider value={LumisDarkTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1A1A2E' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding-splash" />
        <Stack.Screen name="onboarding-question-sunlight" />
        <Stack.Screen name="onboarding-question-wakeup" />
        <Stack.Screen name="onboarding-goal-setup" />
        <Stack.Screen name="onboarding-permission-location" />
        <Stack.Screen name="onboarding-permission-motion" />
        <Stack.Screen name="onboarding-permission-screentime" />
        <Stack.Screen name="onboarding-permission-notifications" />
        <Stack.Screen name="onboarding-value-prop" />
        <Stack.Screen name="onboarding-calibration" />
        <Stack.Screen name="onboarding-auth" />
        <Stack.Screen name="onboarding-email-otp" />
        <Stack.Screen name="onboarding-permissions" />
        <Stack.Screen name="onboarding-success" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="calibration" />
        <Stack.Screen name="app-selection" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="compass-lux" />
        <Stack.Screen name="tracking" />
        <Stack.Screen name="victory" options={{ animation: 'fade' }} />
        <Stack.Screen name="activity-summary" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="analytics" options={{ presentation: 'modal' }} />
        <Stack.Screen name="achievements" options={{ presentation: 'modal' }} />
        <Stack.Screen name="leaderboard" options={{ presentation: 'modal' }} />
        <Stack.Screen name="friends" options={{ presentation: 'modal' }} />
        <Stack.Screen name="insights" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Syne_700Bold,
    Syne_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      initRevenueCat();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style="light" />
          <GlobalErrorBoundary>
            <RootLayoutNav />
          </GlobalErrorBoundary>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
