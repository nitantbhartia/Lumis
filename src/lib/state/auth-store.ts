import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, tokenManager, type UserProfile } from '@/lib/api/client';

// Re-export User type for compatibility
export type User = UserProfile;

export type SocialProvider = 'apple' | 'google';

interface SocialAuthData {
  provider: SocialProvider;
  idToken: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
}

interface AuthState {
  // User
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Passwordless flow state
  onboardingStep: 'value-prop' | 'calibration' | 'auth' | 'permissions' | 'success' | null;
  sensorCalibration: { light: number; timestamp: number } | null;
  userName: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingStep: (step: AuthState['onboardingStep']) => void;
  setSensorCalibration: (calibration: { light: number; timestamp: number } | null) => void;
  setUserName: (name: string | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  socialLogin: (data: SocialAuthData) => Promise<{ success: boolean; error?: string; isNewUser?: boolean }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  resetOnboarding: () => void;
}

// Check if we're using mock mode (no API URL set)
const USE_MOCK_API = !process.env.EXPO_PUBLIC_API_URL;

// Simulated API delay for mock mode
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simple email validation
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      onboardingStep: null,
      sensorCalibration: null,
      userName: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      setSensorCalibration: (calibration) => set({ sensorCalibration: calibration }),
      setUserName: (name) => set({ userName: name }),
      resetOnboarding: () => set({ onboardingStep: null, sensorCalibration: null, userName: null }),

      login: async (email, password) => {
        set({ isLoading: true });

        try {
          // Validation
          if (!email || !password) {
            set({ isLoading: false });
            return { success: false, error: 'Please fill in all fields' };
          }

          if (!isValidEmail(email)) {
            set({ isLoading: false });
            return { success: false, error: 'Please enter a valid email' };
          }

          if (password.length < 6) {
            set({ isLoading: false });
            return { success: false, error: 'Password must be at least 6 characters' };
          }

          // Use mock API if no backend URL is configured
          if (USE_MOCK_API) {
            await delay(1500);

            const user: User = {
              id: 'user_' + Math.random().toString(36).substr(2, 9),
              email: email.toLowerCase(),
              name: email.split('@')[0],
              createdAt: new Date().toISOString(),
              isPremium: false,
            };

            set({ user, isAuthenticated: true, isLoading: false });
            return { success: true };
          }

          // Real API call
          const result = await api.login({ email, password });

          if (result.success && result.data) {
            set({
              user: result.data.user,
              isAuthenticated: true,
              isLoading: false
            });
            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: result.error || 'Login failed' };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Something went wrong. Please try again.' };
        }
      },

      signup: async (email, password, name) => {
        set({ isLoading: true });

        try {
          // Validation
          if (!email || !password || !name) {
            set({ isLoading: false });
            return { success: false, error: 'Please fill in all fields' };
          }

          if (!isValidEmail(email)) {
            set({ isLoading: false });
            return { success: false, error: 'Please enter a valid email' };
          }

          if (password.length < 6) {
            set({ isLoading: false });
            return { success: false, error: 'Password must be at least 6 characters' };
          }

          if (name.length < 2) {
            set({ isLoading: false });
            return { success: false, error: 'Name must be at least 2 characters' };
          }

          // Use mock API if no backend URL is configured
          if (USE_MOCK_API) {
            await delay(1500);

            const user: User = {
              id: 'user_' + Math.random().toString(36).substr(2, 9),
              email: email.toLowerCase(),
              name,
              createdAt: new Date().toISOString(),
              isPremium: false,
            };

            set({ user, isAuthenticated: true, isLoading: false });
            return { success: true };
          }

          // Real API call
          const result = await api.signup({ email, password, name });

          if (result.success && result.data) {
            set({
              user: result.data.user,
              isAuthenticated: true,
              isLoading: false
            });
            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: result.error || 'Signup failed' };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Something went wrong. Please try again.' };
        }
      },

      socialLogin: async (data: SocialAuthData) => {
        set({ isLoading: true });

        try {
          // Use mock API if no backend URL is configured
          if (USE_MOCK_API) {
            await delay(1000);

            const finalName = data.name || get().userName || 'Explorer';
            const user: User = {
              id: 'user_' + Math.random().toString(36).substr(2, 9),
              email: data.email ?? `${data.provider}user@example.com`,
              name: finalName,
              avatarUrl: data.avatarUrl ?? undefined,
              createdAt: new Date().toISOString(),
              isPremium: false,
            };

            set({ user, isAuthenticated: true, isLoading: false, userName: finalName });
            // Simulate new user for onboarding flow
            return { success: true, isNewUser: true };
          }

          // Real API call - send social auth data to backend
          const result = await api.socialLogin(data);

          if (result.success && result.data) {
            set({
              user: result.data.user,
              isAuthenticated: true,
              isLoading: false
            });
            return { success: true, isNewUser: result.data.isNewUser };
          }

          set({ isLoading: false });
          return { success: false, error: result.error || 'Social login failed' };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Something went wrong. Please try again.' };
        }
      },

      logout: async () => {
        if (!USE_MOCK_API) {
          await api.logout();
        }
        await tokenManager.clearTokens();
        set({ user: null, isAuthenticated: false });
      },

      resetPassword: async (email) => {
        set({ isLoading: true });

        try {
          if (!email) {
            set({ isLoading: false });
            return { success: false, error: 'Please enter your email' };
          }

          if (!isValidEmail(email)) {
            set({ isLoading: false });
            return { success: false, error: 'Please enter a valid email' };
          }

          // Use mock API if no backend URL is configured
          if (USE_MOCK_API) {
            await delay(1500);
            set({ isLoading: false });
            return { success: true };
          }

          // Real API call
          const result = await api.resetPassword(email);

          set({ isLoading: false });

          if (result.success) {
            return { success: true };
          }

          return { success: false, error: result.error || 'Failed to send reset email' };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Something went wrong. Please try again.' };
        }
      },

      refreshProfile: async () => {
        if (USE_MOCK_API) return;

        const result = await api.getProfile();
        if (result.success && result.data) {
          set({ user: result.data });
        }
      },
    }),
    {
      name: 'lumis-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        onboardingStep: state.onboardingStep,
        sensorCalibration: state.sensorCalibration,
        userName: state.userName,
      }),
    }
  )
);
