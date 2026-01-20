import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
// Set your API base URL in the ENV tab of Vibecode
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.lumis.app';

// Token storage keys
const ACCESS_TOKEN_KEY = 'lumis_access_token';
const REFRESH_TOKEN_KEY = 'lumis_refresh_token';

// Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  isPremium: boolean;
  premiumExpiresAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface ProgressData {
  date: string;
  lightMinutes: number;
  steps: number;
  completed: boolean;
  unlockTime?: string;
}

export interface UserSettings {
  dailyGoalMinutes: number;
  wakeWindowStart: string;
  wakeWindowEnd: string;
  blockedApps: string[];
  calibration: {
    indoorLux: number;
    outdoorLux: number;
  };
}

export interface SyncData {
  settings: UserSettings;
  currentStreak: number;
  longestStreak: number;
  totalDaysCompleted: number;
  progressHistory: ProgressData[];
}

// Token Management
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async init(): Promise<void> {
    this.accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    this.refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  async setTokens(tokens: AuthTokens): Promise<void> {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  async clearTokens(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }
}

export const tokenManager = new TokenManager();

// API Client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const accessToken = tokenManager.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 - try to refresh token
        if (response.status === 401 && tokenManager.getRefreshToken()) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            // Retry the request with new token
            return this.request<T>(endpoint, options);
          }
        }

        return {
          success: false,
          error: data.message || data.error || 'Request failed',
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await tokenManager.clearTokens();
        return false;
      }

      const data = await response.json();
      await tokenManager.setTokens(data.tokens);
      return true;
    } catch {
      await tokenManager.clearTokens();
      return false;
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<{ user: UserProfile; tokens: AuthTokens }>> {
    const result = await this.request<{ user: UserProfile; tokens: AuthTokens }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (result.success && result.data?.tokens) {
      await tokenManager.setTokens(result.data.tokens);
    }

    return result;
  }

  async signup(data: SignupRequest): Promise<ApiResponse<{ user: UserProfile; tokens: AuthTokens }>> {
    const result = await this.request<{ user: UserProfile; tokens: AuthTokens }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.success && result.data?.tokens) {
      await tokenManager.setTokens(result.data.tokens);
    }

    return result;
  }

  async logout(): Promise<ApiResponse<void>> {
    const result = await this.request<void>('/auth/logout', {
      method: 'POST',
    });
    await tokenManager.clearTokens();
    return result;
  }

  async resetPassword(email: string): Promise<ApiResponse<void>> {
    return this.request<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyResetToken(token: string, newPassword: string): Promise<ApiResponse<void>> {
    return this.request<void>('/auth/reset-password/verify', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async socialLogin(data: {
    provider: string;
    idToken: string;
    email?: string | null;
    name?: string | null;
    avatarUrl?: string | null;
  }): Promise<ApiResponse<{ user: UserProfile; tokens: AuthTokens; isNewUser: boolean }>> {
    const result = await this.request<{ user: UserProfile; tokens: AuthTokens; isNewUser: boolean }>('/auth/social', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.success && result.data?.tokens) {
      await tokenManager.setTokens(result.data.tokens);
    }

    return result;
  }

  // User endpoints
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/user/profile');
  }

  async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(): Promise<ApiResponse<void>> {
    const result = await this.request<void>('/user/account', {
      method: 'DELETE',
    });
    if (result.success) {
      await tokenManager.clearTokens();
    }
    return result;
  }

  // Sync endpoints
  async syncData(data: SyncData): Promise<ApiResponse<SyncData>> {
    return this.request<SyncData>('/user/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSyncData(): Promise<ApiResponse<SyncData>> {
    return this.request<SyncData>('/user/sync');
  }

  // Progress endpoints
  async saveProgress(progress: ProgressData): Promise<ApiResponse<ProgressData>> {
    return this.request<ProgressData>('/progress', {
      method: 'POST',
      body: JSON.stringify(progress),
    });
  }

  async getProgressHistory(days: number = 30): Promise<ApiResponse<ProgressData[]>> {
    return this.request<ProgressData[]>(`/progress/history?days=${days}`);
  }

  // Streak endpoints
  async getStreakInfo(): Promise<ApiResponse<{ current: number; longest: number; total: number }>> {
    return this.request<{ current: number; longest: number; total: number }>('/progress/streak');
  }

  // Premium/Subscription endpoints
  async checkPremiumStatus(): Promise<ApiResponse<{ isPremium: boolean; expiresAt?: string }>> {
    return this.request<{ isPremium: boolean; expiresAt?: string }>('/subscription/status');
  }

  async validateReceipt(receipt: string, platform: 'ios' | 'android'): Promise<ApiResponse<{ isPremium: boolean; expiresAt: string }>> {
    return this.request<{ isPremium: boolean; expiresAt: string }>('/subscription/validate', {
      method: 'POST',
      body: JSON.stringify({ receipt, platform }),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Initialize token manager on import
tokenManager.init().catch(console.error);
