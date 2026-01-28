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
  isCategory?: boolean;
  token?: string;
  tokenData?: string;
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

export interface ActivityCoordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface ActivitySession {
  id: string;
  type: 'walk' | 'run' | 'meditate' | 'sit_soak';
  startTime: string;
  durationSeconds: number;
  lightMinutes: number;
  steps: number;
  calories: number;
  distance: number;
  lux: number;
  uvIndex: number;
  temperature: number;
  vitaminD: number;
  coordinates: ActivityCoordinate[];
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
  syncWithNativeBlockedApps: () => Promise<void>;

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
  hasSeenCompletionToday: boolean;
  setHasSeenCompletionToday: (value: boolean) => void;

  // Streaks
  currentStreak: number;
  longestStreak: number;
  totalDaysCompleted: number;
  incrementStreak: () => void;
  resetStreak: () => void;

  // Stone Collection (Endowed Progress)
  collectedStones: number[]; // Milestone days collected: [1, 7, 14, 30, 60, 100, 365]
  hasReceivedInitialStreak: boolean;
  awardInitialStreak: () => void;

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
  hasSeenLuxPrimer: boolean;
  setHasSeenLuxPrimer: (value: boolean) => void;

  // Passive Verification Analytics
  passiveVerificationSuccessCount: number;
  passiveVerificationFailCount: number;
  incrementPassiveSuccess: () => void;
  incrementPassiveFail: () => void;

  // New Onboarding Data
  sunlightFrequency: 'daily' | 'few_times' | 'once_a_week' | 'rarely' | null;
  setSunlightFrequency: (value: 'daily' | 'few_times' | 'once_a_week' | 'rarely') => void;
  phoneReachTiming: 'immediately' | 'in_bed' | 'coffee' | 'out_door' | null;
  setPhoneReachTiming: (value: 'immediately' | 'in_bed' | 'coffee' | 'out_door') => void;
  brainFogFrequency: 'yes' | 'no' | 'most' | null;
  setBrainFogFrequency: (value: 'yes' | 'no' | 'most') => void;
  screenBeforeBed: 'always' | 'often' | 'sometimes' | 'rarely' | null;
  setScreenBeforeBed: (value: 'always' | 'often' | 'sometimes' | 'rarely') => void;
  morningEnergyLevel: 'exhausted' | 'sluggish' | 'okay' | 'energized' | null;
  setMorningEnergyLevel: (value: 'exhausted' | 'sluggish' | 'okay' | 'energized') => void;
  morningScrollTime: string | null; // Store as minutes string, e.g., "30"
  setMorningScrollTime: (value: string | number) => void;

  // Preferences
  skinType: 1 | 2 | 3 | 4 | 5 | 6; // Fitzpatrick Scale
  setSkinType: (value: 1 | 2 | 3 | 4 | 5 | 6) => void;

  // Daily Activity Selection
  selectedActivity: 'walk' | 'run' | 'meditate' | 'sit_soak' | null;
  setSelectedActivity: (value: 'walk' | 'run' | 'meditate' | 'sit_soak' | null) => void;

  // Skip Passes (Consumables) - formerly Emergency Flares
  skipPasses: number;
  addSkipPasses: (count: number) => void;
  consumeSkipPass: () => void;

  // Legacy aliases for backwards compatibility
  emergencyFlares: number;
  addEmergencyFlares: (count: number) => void;
  consumeEmergencyFlare: () => void;

  // Streak Freeze (Premium Feature)
  streakFreezesUsedThisMonth: number;
  streakFreezesPerMonth: number; // Default: 2 for premium
  lastStreakFreezeResetMonth: string;
  useStreakFreeze: () => boolean;
  getRemainingStreakFreezes: () => number;

  // Activity History
  activityHistory: ActivitySession[];
  lastCompletedSession: ActivitySession | null;
  addActivityToHistory: (session: ActivitySession) => void;

  // Active Session (Timer Persistence)
  activeSession: {
    startTime: string | null;
    accumulatedSeconds: number;
    goalSeconds: number;
    lastSaveTime: string | null;
    isActive: boolean;
  };
  startActiveSession: (goalSeconds?: number) => void;
  updateActiveSession: (additionalSeconds: number) => void;
  completeActiveSession: () => void;
  resumeActiveSession: () => { elapsedSeconds: number; remainingSeconds: number } | null;

  // Morning Shield Scheduling
  scheduledWakeTime: string | null; // "06:30"
  setScheduledWakeTime: (time: string | null) => void;
  isShieldScheduled: boolean;
  setIsShieldScheduled: (value: boolean) => void;

  // Monthly Emergency Unlock Limits
  monthlyFreeUnlocksUsed: number;
  lastUnlockResetMonth: string; // "2026-01" format
  freeUnlocksPerMonth: number; // Default: 3
  useMonthlyFreeUnlock: () => boolean; // Returns true if unlock was available
  getRemainingFreeUnlocks: () => number;
  performEmergencyUnlock: () => void; // Full unlock flow with all consequences

  // Shield State (Synced with Native)
  isShieldEngaged: boolean;
  setShieldEngaged: (engaged: boolean) => void;

  // Stakes & Accountability (V2 Pivot)
  stakesEnabled: boolean;
  setStakesEnabled: (enabled: boolean) => void;
  selectedCharity: 'red-cross' | 'doctors-without-borders' | 'world-wildlife' | 'feeding-america' | 'team-trees' | null;
  setSelectedCharity: (charity: 'red-cross' | 'doctors-without-borders' | 'world-wildlife' | 'feeding-america' | 'team-trees') => void;
  penaltiesThisMonth: number;
  lastPenaltyResetMonth: string; // "2026-01"
  totalDonatedAmount: number;
  recordPenalty: (amount: number) => void;

  // Progressive Difficulty (V2 Pivot)
  firstSessionDate: string | null; // ISO date of first completed session
  setFirstSessionDate: (date: string) => void;
  getDaysInProgram: () => number;

  // App Version
  appVersion: string;

  // Focus Score (V2 Pivot)
  focusScore: number;
  focusScoreTimestamp: string | null;
  distractingMinutesToday: number;
  focusSunlightBonusApplied: boolean;
  focusRatio: number;
  focusPenaltyDeductions: number;
  outdoorLuxSecondsToday: number;
  updateFocusScore: (data: {
    score: number;
    timestamp: string;
    distractingMinutes: number;
    sunlightBonusApplied: boolean;
    focusRatio: number;
    penaltyDeductions: number;
  }) => void;
  incrementOutdoorLuxSeconds: () => void;
  resetDailyFocusMetrics: () => void;
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
      hasSeenLuxPrimer: false,
      setHasSeenLuxPrimer: (value) => set({ hasSeenLuxPrimer: value }),

      // Passive Verification Analytics
      passiveVerificationSuccessCount: 0,
      passiveVerificationFailCount: 0,
      incrementPassiveSuccess: () => set((s) => ({ passiveVerificationSuccessCount: s.passiveVerificationSuccessCount + 1 })),
      incrementPassiveFail: () => set((s) => ({ passiveVerificationFailCount: s.passiveVerificationFailCount + 1 })),

      // Calibration
      calibration: {
        indoorLux: 100,
        outdoorLux: 10000,
        isCalibrated: false,
      },
      setCalibration: (calibration) => set({ calibration }),

      // Blocked Apps
      blockedApps: [],
      setBlockedApps: (apps) => set({ blockedApps: apps }),

      // We no longer manually toggle generic apps. We sync with Native Picker.
      // But we keep this for UI optimistic updates if needed, logic changed to support syncing.
      toggleAppBlocked: (appId) => { },

      syncWithNativeBlockedApps: async () => {
        try {
          const { getAppToggles } = require('@/lib/screen-time');
          const toggles = getAppToggles ? getAppToggles() : [];

          console.log('[LumisStore] Syncing with native toggles:', toggles.length);

          // If we have toggles, map them. If not, and we already have apps, keep them 
          // (maybe native module is just initializing)
          if (toggles.length === 0 && get().blockedApps.length > 0) {
            console.log('[LumisStore] Native list empty, keeping existing apps');
            return;
          }

          const sanitizeName = (name: string, isCat: boolean) => {
            if (!name) return isCat ? "Category" : "Shielded App";
            const lower = name.toLowerCase().trim();
            if (lower === "unknown app" || lower === "unknown" || lower.includes("unknown") || lower === "unim") {
              return isCat ? "Category" : "Shielded App";
            }
            return name;
          };

          const mappedApps = toggles.map((t: any, index: number) => ({
            id: t.tokenData || t.token || t.name || `${t.isCategory ? 'cat' : 'app'}-${index}`,
            name: sanitizeName(t.name, t.isCategory === true),
            icon: 'shield',
            isBlocked: t.isEnabled !== false,
            token: t.tokenData || t.token,
            isCategory: t.isCategory === true,
            tokenData: t.tokenData
          }));

          set({ blockedApps: mappedApps });
        } catch (e) {
          console.error("[LumisStore] Failed to sync blocked apps:", e);
        }
      },

      // Daily Goal
      dailyGoalMinutes: 2, // V2 Pivot: Start at 2 minutes
      setDailyGoalMinutes: (minutes) => set({ dailyGoalMinutes: minutes }),

      // Wake Window
      wakeWindowStart: '06:00',
      wakeWindowEnd: '10:00',
      setWakeWindow: (start, end) => set({ wakeWindowStart: start, wakeWindowEnd: end }),

      // Progress
      todayProgress: initialProgress,
      hasSeenCompletionToday: false,
      setHasSeenCompletionToday: (value) => set({ hasSeenCompletionToday: value }),
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
          hasSeenCompletionToday: false,
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

        // Check for stone milestones to award
        const STONE_MILESTONES = [1, 7, 14, 30, 60, 100, 365];
        const newStones = [...state.collectedStones];
        if (STONE_MILESTONES.includes(newStreak) && !newStones.includes(newStreak)) {
          newStones.push(newStreak);
        }

        set({
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, state.longestStreak),
          totalDaysCompleted: state.totalDaysCompleted + 1,
          collectedStones: newStones,
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

      // Stone Collection (Endowed Progress)
      collectedStones: [],
      hasReceivedInitialStreak: false,
      awardInitialStreak: () => {
        const state = get();
        // Prevent double-awarding
        if (state.hasReceivedInitialStreak) return;

        set({
          currentStreak: 1,
          longestStreak: Math.max(1, state.longestStreak),
          collectedStones: [1], // First stone collected
          hasReceivedInitialStreak: true,
          firstSessionDate: state.firstSessionDate || new Date().toISOString(),
        });
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
      phoneReachTiming: null,
      setPhoneReachTiming: (value) => set({ phoneReachTiming: value }),
      brainFogFrequency: null,
      setBrainFogFrequency: (value) => set({ brainFogFrequency: value }),
      screenBeforeBed: null,
      setScreenBeforeBed: (value) => set({ screenBeforeBed: value }),
      morningEnergyLevel: null,
      setMorningEnergyLevel: (value) => set({ morningEnergyLevel: value }),
      morningScrollTime: null,
      setMorningScrollTime: (value) => set({ morningScrollTime: String(value) }),

      // Preferences
      skinType: 2,
      setSkinType: (value) => set({ skinType: value }),

      // Daily Activity Selection
      selectedActivity: null,
      setSelectedActivity: (value) => set({ selectedActivity: value }),

      // Activity History
      activityHistory: [],
      lastCompletedSession: null,
      addActivityToHistory: (session) => set((s) => ({
        activityHistory: [session, ...s.activityHistory].slice(0, 50),
        lastCompletedSession: session
      })),

      // Skip Passes (formerly Emergency Flares)
      skipPasses: 0,
      addSkipPasses: (count) => set((s) => ({ skipPasses: s.skipPasses + count })),
      consumeSkipPass: () => set((s) => ({ skipPasses: Math.max(0, s.skipPasses - 1) })),

      // Legacy aliases - map to new skipPasses for backwards compatibility
      get emergencyFlares() { return get().skipPasses; },
      addEmergencyFlares: (count) => set((s) => ({ skipPasses: s.skipPasses + count })),
      consumeEmergencyFlare: () => set((s) => ({ skipPasses: Math.max(0, s.skipPasses - 1) })),

      // Streak Freeze (Premium Feature)
      streakFreezesUsedThisMonth: 0,
      streakFreezesPerMonth: 2,
      lastStreakFreezeResetMonth: new Date().toISOString().slice(0, 7),

      useStreakFreeze: () => {
        const state = get();
        // Only premium users can use streak freezes
        if (!state.isPremium && !state.isTrialActive()) return false;

        const currentMonth = new Date().toISOString().slice(0, 7);

        // Reset counter if new month
        if (state.lastStreakFreezeResetMonth !== currentMonth) {
          set({
            streakFreezesUsedThisMonth: 0,
            lastStreakFreezeResetMonth: currentMonth,
          });
        }

        const updatedState = get();
        if (updatedState.streakFreezesUsedThisMonth < updatedState.streakFreezesPerMonth) {
          set({ streakFreezesUsedThisMonth: updatedState.streakFreezesUsedThisMonth + 1 });
          return true;
        }
        return false;
      },

      getRemainingStreakFreezes: () => {
        const state = get();
        // Non-premium users get 0 freezes
        if (!state.isPremium && !state.isTrialActive()) return 0;

        const currentMonth = new Date().toISOString().slice(0, 7);
        if (state.lastStreakFreezeResetMonth !== currentMonth) {
          return state.streakFreezesPerMonth;
        }
        return Math.max(0, state.streakFreezesPerMonth - state.streakFreezesUsedThisMonth);
      },

      // Active Session (Timer Persistence)
      activeSession: {
        startTime: null,
        accumulatedSeconds: 0,
        goalSeconds: 120, // V2 Pivot: 2 minutes default
        lastSaveTime: null,
        isActive: false,
      },
      startActiveSession: (goalSeconds = 120) => set({
        activeSession: {
          startTime: new Date().toISOString(),
          accumulatedSeconds: 0,
          goalSeconds,
          lastSaveTime: new Date().toISOString(),
          isActive: true,
        }
      }),
      updateActiveSession: (additionalSeconds) => set((s) => ({
        activeSession: {
          ...s.activeSession,
          accumulatedSeconds: s.activeSession.accumulatedSeconds + additionalSeconds,
          lastSaveTime: new Date().toISOString(),
        }
      })),
      completeActiveSession: () => set({
        activeSession: {
          startTime: null,
          accumulatedSeconds: 0,
          goalSeconds: 960,
          lastSaveTime: null,
          isActive: false,
        }
      }),
      resumeActiveSession: () => {
        const state = get();
        if (!state.activeSession.isActive || !state.activeSession.startTime) {
          return null;
        }
        const elapsedSeconds = state.activeSession.accumulatedSeconds;
        const remainingSeconds = Math.max(0, state.activeSession.goalSeconds - elapsedSeconds);
        return { elapsedSeconds, remainingSeconds };
      },

      // Morning Shield Scheduling
      scheduledWakeTime: null,
      setScheduledWakeTime: (time) => set({ scheduledWakeTime: time }),
      isShieldScheduled: false,
      setIsShieldScheduled: (value) => set({ isShieldScheduled: value }),

      // Monthly Emergency Unlock Limits
      monthlyFreeUnlocksUsed: 0,
      lastUnlockResetMonth: new Date().toISOString().slice(0, 7), // "2026-01"
      freeUnlocksPerMonth: 3,

      useMonthlyFreeUnlock: () => {
        const state = get();
        const currentMonth = new Date().toISOString().slice(0, 7);

        // Reset counter if new month
        if (state.lastUnlockResetMonth !== currentMonth) {
          set({
            monthlyFreeUnlocksUsed: 0,
            lastUnlockResetMonth: currentMonth,
          });
        }

        // Check if free unlocks available
        const updatedState = get();
        if (updatedState.monthlyFreeUnlocksUsed < updatedState.freeUnlocksPerMonth) {
          set({ monthlyFreeUnlocksUsed: updatedState.monthlyFreeUnlocksUsed + 1 });
          return true;
        }
        return false;
      },

      getRemainingFreeUnlocks: () => {
        const state = get();
        const currentMonth = new Date().toISOString().slice(0, 7);

        // If new month, return full amount
        if (state.lastUnlockResetMonth !== currentMonth) {
          return state.freeUnlocksPerMonth;
        }

        return Math.max(0, state.freeUnlocksPerMonth - state.monthlyFreeUnlocksUsed);
      },

      performEmergencyUnlock: () => {
        const state = get();

        // Reset streak (ALWAYS - maximum consequence)
        if (state.currentStreak > 0) {
          set({ hasHadStreakBefore: true, currentStreak: 0 });
        }

        // Reset days without emergency unlock
        set({
          daysWithoutEmergencyUnlock: 0,
          emergencyUnlockUsedToday: true,
        });
      },

      // Shield State
      isShieldEngaged: false,
      setShieldEngaged: (engaged) => set({ isShieldEngaged: engaged }),

      // Stakes & Accountability (V2 Pivot)
      stakesEnabled: false, // Opt-in only
      setStakesEnabled: (enabled) => set({ stakesEnabled: enabled }),
      selectedCharity: null,
      setSelectedCharity: (charity) => set({ selectedCharity: charity }),
      penaltiesThisMonth: 0,
      lastPenaltyResetMonth: new Date().toISOString().slice(0, 7),
      totalDonatedAmount: 0,
      recordPenalty: (amount) => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const state = get();

        // Reset counter if new month
        if (state.lastPenaltyResetMonth !== currentMonth) {
          set({ penaltiesThisMonth: 0, lastPenaltyResetMonth: currentMonth });
        }

        set({
          penaltiesThisMonth: state.penaltiesThisMonth + 1,
          totalDonatedAmount: state.totalDonatedAmount + amount
        });
      },

      // Progressive Difficulty (V2 Pivot)
      firstSessionDate: null,
      setFirstSessionDate: (date) => set({ firstSessionDate: date }),
      getDaysInProgram: () => {
        const state = get();
        if (!state.firstSessionDate) return 0;
        const start = new Date(state.firstSessionDate);
        const now = new Date();
        const diffMs = now.getTime() - start.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      },

      // App Version
      appVersion: '2.0.0',

      // Focus Score (V2 Pivot)
      focusScore: 0,
      focusScoreTimestamp: null,
      distractingMinutesToday: 0,
      focusSunlightBonusApplied: false,
      focusRatio: 0,
      focusPenaltyDeductions: 0,
      outdoorLuxSecondsToday: 0,

      updateFocusScore: (data) => set({
        focusScore: data.score,
        focusScoreTimestamp: data.timestamp,
        distractingMinutesToday: data.distractingMinutes,
        focusSunlightBonusApplied: data.sunlightBonusApplied,
        focusRatio: data.focusRatio,
        focusPenaltyDeductions: data.penaltyDeductions,
      }),

      incrementOutdoorLuxSeconds: () => set((s) => ({
        outdoorLuxSecondsToday: s.outdoorLuxSecondsToday + 1,
      })),

      resetDailyFocusMetrics: () => set({
        focusScore: 0,
        focusScoreTimestamp: null,
        distractingMinutesToday: 0,
        focusSunlightBonusApplied: false,
        focusRatio: 0,
        focusPenaltyDeductions: 0,
        outdoorLuxSecondsToday: 0,
      }),
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
        skipPasses: state.skipPasses,
        streakFreezesUsedThisMonth: state.streakFreezesUsedThisMonth,
        lastStreakFreezeResetMonth: state.lastStreakFreezeResetMonth,
        activityHistory: state.activityHistory,
        lastCompletedSession: state.lastCompletedSession,
        activeSession: state.activeSession,
        scheduledWakeTime: state.scheduledWakeTime,
        isShieldScheduled: state.isShieldScheduled,
        hasSeenLuxPrimer: state.hasSeenLuxPrimer,
        passiveVerificationSuccessCount: state.passiveVerificationSuccessCount,
        passiveVerificationFailCount: state.passiveVerificationFailCount,
        isShieldEngaged: state.isShieldEngaged,
        monthlyFreeUnlocksUsed: state.monthlyFreeUnlocksUsed,
        lastUnlockResetMonth: state.lastUnlockResetMonth,
        sunlightFrequency: state.sunlightFrequency,
        phoneReachTiming: state.phoneReachTiming,
        brainFogFrequency: state.brainFogFrequency,
        screenBeforeBed: state.screenBeforeBed,
        morningEnergyLevel: state.morningEnergyLevel,
        todayProgress: state.todayProgress,
        hasSeenCompletionToday: state.hasSeenCompletionToday,
        // V2 Pivot Fields
        stakesEnabled: state.stakesEnabled,
        selectedCharity: state.selectedCharity,
        penaltiesThisMonth: state.penaltiesThisMonth,
        lastPenaltyResetMonth: state.lastPenaltyResetMonth,
        totalDonatedAmount: state.totalDonatedAmount,
        firstSessionDate: state.firstSessionDate,
        appVersion: state.appVersion,
        // Focus Score
        focusScore: state.focusScore,
        focusScoreTimestamp: state.focusScoreTimestamp,
        distractingMinutesToday: state.distractingMinutesToday,
        focusSunlightBonusApplied: state.focusSunlightBonusApplied,
        focusRatio: state.focusRatio,
        focusPenaltyDeductions: state.focusPenaltyDeductions,
        outdoorLuxSecondsToday: state.outdoorLuxSecondsToday,
        // Stone Collection
        collectedStones: state.collectedStones,
        hasReceivedInitialStreak: state.hasReceivedInitialStreak,
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
