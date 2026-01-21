import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api/client';
import { Achievement, ACHIEVEMENTS, checkAchievements } from '@/lib/achievements';
import { NotificationPreferences, DEFAULT_NOTIFICATION_PREFS, notificationService } from '@/lib/notifications';

export interface BlockedApp {
  id: string;
  name: string;
  icon: string;
  isBlocked: boolean;
}

export interface DailyProgress {
  date: string;
  lightMinutes: number;
  steps: number;
  completed: boolean;
  unlockTime?: string;
}

export interface Calibration {
  indoorLux: number;
  outdoorLux: number;
  isCalibrated: boolean;
}

interface LumisState {
  // Onboarding
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;

  // Calibration
  calibration: Calibration;
  setCalibration: (calibration: Calibration) => void;

  // Blocked Apps
  blockedApps: BlockedApp[];
  setBlockedApps: (apps: BlockedApp[]) => void;
  toggleAppBlocked: (appId: string) => void;

  // Daily Goal
  dailyGoalMinutes: number;
  setDailyGoalMinutes: (minutes: number) => void;

  // Wake Window
  wakeWindowStart: string; // "06:00"
  wakeWindowEnd: string; // "10:00"
  setWakeWindow: (start: string, end: string) => void;

  // Progress
  todayProgress: DailyProgress;
  updateTodayProgress: (progress: Partial<DailyProgress>) => void;
  resetTodayProgress: () => void;

  // Streaks
  currentStreak: number;
  longestStreak: number;
  totalDaysCompleted: number;
  incrementStreak: () => void;
  resetStreak: () => void;

  // History
  progressHistory: DailyProgress[];
  addToHistory: (progress: DailyProgress) => void;

  // Emergency Unlock
  emergencyUnlockUsedToday: boolean;
  useEmergencyUnlock: () => void;

  // Active Session
  isTrackingActive: boolean;
  setTrackingActive: (active: boolean) => void;
  sessionStartTime: string | null;
  setSessionStartTime: (time: string | null) => void;

  // Sync
  lastSyncedAt: string | null;
  isSyncing: boolean;
  syncToServer: () => Promise<void>;
  syncFromServer: () => Promise<void>;

  // Achievements
  achievements: Achievement[];
  checkAndUnlockAchievements: () => void;

  // Notifications
  notificationPreferences: NotificationPreferences;
  setNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  setupNotifications: () => Promise<void>;

  // Premium
  isPremium: boolean;
  setIsPremium: (value: boolean) => void;

  // Trial (No Credit Card)
  trialStartedAt: string | null;
  startTrial: () => void;
  isTrialActive: () => boolean;

  // Weather Adaptive Goals
  weatherAdaptiveGoalsEnabled: boolean;
  setWeatherAdaptiveGoalsEnabled: (value: boolean) => void;

  // Stats for achievements
  totalHoursInSunlight: number;
  earlyBirdDaysCount: number;
  overachieverDaysCount: number;
  daysWithoutEmergencyUnlock: number;
  hasHadStreakBefore: boolean;

  // New Onboarding Data
  sunlightFrequency: 'daily' | 'few_times' | 'once_a_week' | 'rarely' | null;
  setSunlightFrequency: (value: 'daily' | 'few_times' | 'once_a_week' | 'rarely') => void;

  // Daily Activity Selection
  selectedActivity: 'walk' | 'run' | 'meditate' | 'sit_soak' | null;
  setSelectedActivity: (value: 'walk' | 'run' | 'meditate' | 'sit_soak' | null) => void;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

const initialProgress: DailyProgress = {
  date: getTodayDate(),
  lightMinutes: 0,
  steps: 0,
  completed: false,
};

// Check if we're using mock mode (no API URL set)
const USE_MOCK_API = !process.env.EXPO_PUBLIC_API_URL;

export const useLumisStore = create<LumisState>()(
  persist(
    (set, get) => ({
      // Onboarding
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (value) => set({ hasCompletedOnboarding: value }),

      // Calibration
      calibration: {
        indoorLux: 100,
        outdoorLux: 10000,
        isCalibrated: false,
      },
      setCalibration: (calibration) => set({ calibration }),

      // Blocked Apps
      blockedApps: [
        { id: 'instagram', name: 'Instagram', icon: 'instagram', isBlocked: false },
        { id: 'tiktok', name: 'TikTok', icon: 'video', isBlocked: false },
        { id: 'twitter', name: 'X / Twitter', icon: 'twitter', isBlocked: false },
        { id: 'facebook', name: 'Facebook', icon: 'facebook', isBlocked: false },
        { id: 'youtube', name: 'YouTube', icon: 'youtube', isBlocked: false },
        { id: 'reddit', name: 'Reddit', icon: 'message-circle', isBlocked: false },
        { id: 'snapchat', name: 'Snapchat', icon: 'ghost', isBlocked: false },
        { id: 'netflix', name: 'Netflix', icon: 'film', isBlocked: false },
      ],
      setBlockedApps: (apps) => set({ blockedApps: apps }),
      toggleAppBlocked: (appId) =>
        set((state) => ({
          blockedApps: state.blockedApps.map((app) =>
            app.id === appId ? { ...app, isBlocked: !app.isBlocked } : app
          ),
        })),

      // Daily Goal
      dailyGoalMinutes: 10,
      setDailyGoalMinutes: (minutes) => set({ dailyGoalMinutes: minutes }),

      // Wake Window
      wakeWindowStart: '06:00',
      wakeWindowEnd: '10:00',
      setWakeWindow: (start, end) => set({ wakeWindowStart: start, wakeWindowEnd: end }),

      // Progress
      todayProgress: initialProgress,
      updateTodayProgress: (progress) => {
        const state = get();
        const updated = { ...state.todayProgress, ...progress };

        set({ todayProgress: updated });

        // Check if goal was just completed
        if (
          updated.completed &&
          !state.todayProgress.completed &&
          state.notificationPreferences.goalCompleteNotification
        ) {
          notificationService.sendGoalCompleteNotification();
        }

        // Update total hours in sunlight
        const hoursAdded = (updated.lightMinutes - state.todayProgress.lightMinutes) / 60;
        if (hoursAdded > 0) {
          set((s) => ({
            totalHoursInSunlight: s.totalHoursInSunlight + hoursAdded,
          }));
        }

        // Check for early bird (completed before 8 AM)
        if (updated.completed && updated.unlockTime) {
          const unlockHour = new Date(updated.unlockTime).getHours();
          if (unlockHour < 8) {
            set((s) => ({ earlyBirdDaysCount: s.earlyBirdDaysCount + 1 }));
          }
        }

        // Check for overachiever (2x goal)
        if (updated.lightMinutes >= state.dailyGoalMinutes * 2) {
          set((s) => ({ overachieverDaysCount: s.overachieverDaysCount + 1 }));
        }

        // Check achievements after progress update
        get().checkAndUnlockAchievements();
      },
      resetTodayProgress: () => {
        const state = get();
        // Increment days without emergency unlock if it wasn't used today
        set({
          todayProgress: { ...initialProgress, date: getTodayDate() },
          emergencyUnlockUsedToday: false,
          daysWithoutEmergencyUnlock: state.emergencyUnlockUsedToday
            ? 0
            : state.daysWithoutEmergencyUnlock + 1,
        });
      },

      // Streaks
      currentStreak: 0,
      longestStreak: 0,
      totalDaysCompleted: 0,
      incrementStreak: () => {
        const state = get();
        const newStreak = state.currentStreak + 1;

        // Track if user has ever had a streak
        if (newStreak === 1 && state.longestStreak > 0) {
          set({ hasHadStreakBefore: true });
        }

        set({
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, state.longestStreak),
          totalDaysCompleted: state.totalDaysCompleted + 1,
        });

        // Send streak milestone notifications
        notificationService.sendStreakMilestoneNotification(newStreak);

        // Check achievements after streak update
        get().checkAndUnlockAchievements();
      },
      resetStreak: () => {
        const state = get();
        if (state.currentStreak > 0) {
          set({ hasHadStreakBefore: true, currentStreak: 0 });
        }
      },

      // History
      progressHistory: [],
      addToHistory: (progress) =>
        set((state) => ({
          progressHistory: [...state.progressHistory.slice(-29), progress],
        })),

      // Emergency Unlock
      emergencyUnlockUsedToday: false,
      useEmergencyUnlock: () => {
        set({ emergencyUnlockUsedToday: true, daysWithoutEmergencyUnlock: 0 });
      },

      // Active Session
      isTrackingActive: false,
      setTrackingActive: (active) => set({ isTrackingActive: active }),
      sessionStartTime: null,
      setSessionStartTime: (time) => set({ sessionStartTime: time }),

      // Sync
      lastSyncedAt: null,
      isSyncing: false,

      syncToServer: async () => {
        if (USE_MOCK_API) return;

        const state = get();
        set({ isSyncing: true });

        try {
          const syncData = {
            settings: {
              dailyGoalMinutes: state.dailyGoalMinutes,
              wakeWindowStart: state.wakeWindowStart,
              wakeWindowEnd: state.wakeWindowEnd,
              blockedApps: state.blockedApps.filter(app => app.isBlocked).map(app => app.id),
              calibration: {
                indoorLux: state.calibration.indoorLux,
                outdoorLux: state.calibration.outdoorLux,
              },
            },
            currentStreak: state.currentStreak,
            longestStreak: state.longestStreak,
            totalDaysCompleted: state.totalDaysCompleted,
            progressHistory: state.progressHistory,
          };

          const result = await api.syncData(syncData);

          if (result.success) {
            set({
              lastSyncedAt: new Date().toISOString(),
              isSyncing: false,
            });
          } else {
            set({ isSyncing: false });
          }
        } catch (error) {
          console.error('Sync to server failed:', error);
          set({ isSyncing: false });
        }
      },

      syncFromServer: async () => {
        if (USE_MOCK_API) return;

        set({ isSyncing: true });

        try {
          const result = await api.getSyncData();

          if (result.success && result.data) {
            const serverData = result.data;

            // Merge server data with local data
            // Server data takes precedence for streaks and history
            set((state) => ({
              dailyGoalMinutes: serverData.settings.dailyGoalMinutes,
              wakeWindowStart: serverData.settings.wakeWindowStart,
              wakeWindowEnd: serverData.settings.wakeWindowEnd,
              calibration: {
                ...state.calibration,
                indoorLux: serverData.settings.calibration.indoorLux,
                outdoorLux: serverData.settings.calibration.outdoorLux,
              },
              blockedApps: state.blockedApps.map(app => ({
                ...app,
                isBlocked: serverData.settings.blockedApps.includes(app.id),
              })),
              currentStreak: Math.max(state.currentStreak, serverData.currentStreak),
              longestStreak: Math.max(state.longestStreak, serverData.longestStreak),
              totalDaysCompleted: Math.max(state.totalDaysCompleted, serverData.totalDaysCompleted),
              progressHistory: mergeProgressHistory(state.progressHistory, serverData.progressHistory),
              lastSyncedAt: new Date().toISOString(),
              isSyncing: false,
            }));
          } else {
            set({ isSyncing: false });
          }
        } catch (error) {
          console.error('Sync from server failed:', error);
          set({ isSyncing: false });
        }
      },

      // Achievements
      achievements: ACHIEVEMENTS.map(a => ({ ...a, unlocked: false, progress: 0 })),

      checkAndUnlockAchievements: () => {
        const state = get();
        const updates = checkAchievements(
          state.currentStreak,
          state.totalHoursInSunlight,
          state.earlyBirdDaysCount,
          state.overachieverDaysCount,
          state.totalDaysCompleted,
          state.daysWithoutEmergencyUnlock,
          state.hasHadStreakBefore,
          state.achievements
        );

        // Find newly unlocked achievements
        const newlyUnlocked = updates.filter((updated) => {
          const current = state.achievements.find((a) => a.id === updated.id);
          return updated.unlocked && current && !current.unlocked;
        });

        // Send notifications for newly unlocked achievements
        for (const achievement of newlyUnlocked) {
          notificationService.sendAchievementUnlocked(achievement.title, achievement.description);
        }

        // Update achievements state
        set({
          achievements: state.achievements.map((a) => {
            const update = updates.find((u) => u.id === a.id);
            return update || a;
          }),
        });
      },

      // Notifications
      notificationPreferences: DEFAULT_NOTIFICATION_PREFS,

      setNotificationPreferences: (prefs) => {
        set((state) => ({
          notificationPreferences: { ...state.notificationPreferences, ...prefs },
        }));
        // Re-setup notifications with new preferences
        get().setupNotifications();
      },

      setupNotifications: async () => {
        const prefs = get().notificationPreferences;
        await notificationService.setupNotifications(prefs);
      },

      // Premium
      isPremium: false,
      setIsPremium: (value) => set({ isPremium: value }),

      // Trial (No Credit Card)
      trialStartedAt: null,
      startTrial: () => set({ trialStartedAt: new Date().toISOString() }),
      isTrialActive: () => {
        const state = get();
        if (state.isPremium) return true;
        if (!state.trialStartedAt) return false;

        const trialDate = new Date(state.trialStartedAt);
        const now = new Date();
        const diffDays = (now.getTime() - trialDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      },

      // Weather Adaptive Goals
      weatherAdaptiveGoalsEnabled: false,
      setWeatherAdaptiveGoalsEnabled: (value) => set({ weatherAdaptiveGoalsEnabled: value }),

      // Achievement stats
      totalHoursInSunlight: 0,
      earlyBirdDaysCount: 0,
      overachieverDaysCount: 0,
      daysWithoutEmergencyUnlock: 0,
      hasHadStreakBefore: false,

      // New Onboarding Data
      sunlightFrequency: null,
      setSunlightFrequency: (value) => set({ sunlightFrequency: value }),

      // Daily Activity Selection
      selectedActivity: null,
      setSelectedActivity: (value) => set({ selectedActivity: value }),
    }),
    {
      name: 'lumis-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        calibration: state.calibration,
        blockedApps: state.blockedApps,
        dailyGoalMinutes: state.dailyGoalMinutes,
        wakeWindowStart: state.wakeWindowStart,
        wakeWindowEnd: state.wakeWindowEnd,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        totalDaysCompleted: state.totalDaysCompleted,
        progressHistory: state.progressHistory,
        lastSyncedAt: state.lastSyncedAt,
        achievements: state.achievements,
        notificationPreferences: state.notificationPreferences,
        isPremium: state.isPremium,
        trialStartedAt: state.trialStartedAt,
        weatherAdaptiveGoalsEnabled: state.weatherAdaptiveGoalsEnabled,
        totalHoursInSunlight: state.totalHoursInSunlight,
        earlyBirdDaysCount: state.earlyBirdDaysCount,
        overachieverDaysCount: state.overachieverDaysCount,
        daysWithoutEmergencyUnlock: state.daysWithoutEmergencyUnlock,
        hasHadStreakBefore: state.hasHadStreakBefore,
      }),
    }
  )
);

// Helper function to merge progress history from local and server
function mergeProgressHistory(local: DailyProgress[], server: DailyProgress[]): DailyProgress[] {
  const merged = new Map<string, DailyProgress>();

  // Add local entries
  for (const entry of local) {
    merged.set(entry.date, entry);
  }

  // Server entries override local (server is source of truth)
  for (const entry of server) {
    merged.set(entry.date, entry);
  }

  // Sort by date and return last 30 days
  return Array.from(merged.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
}
