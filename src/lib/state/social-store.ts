import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Friend {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currentStreak: number;
  longestStreak: number;
  totalHours: number;
  lastActivityAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl?: string;
  streakDays: number;
  totalHours: number;
  isCurrentUser?: boolean;
}

export interface SharedAchievement {
  id: string;
  userId: string;
  userName: string;
  achievementId: string;
  achievementTitle: string;
  achievementIcon: string;
  sharedAt: string;
  message?: string;
}

interface SocialState {
  // Friends
  friends: Friend[];
  addFriend: (friend: Friend) => void;
  removeFriend: (friendId: string) => void;
  updateFriendStreak: (friendId: string, streak: number) => void;

  // Leaderboard
  leaderboard: LeaderboardEntry[];
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  getUserRank: (userId: string) => number | null;

  // Shared Achievements
  sharedAchievements: SharedAchievement[];
  shareAchievement: (
    achievementId: string,
    achievementTitle: string,
    achievementIcon: string,
    message?: string
  ) => void;
  getFriendSharedAchievements: (friendId: string) => SharedAchievement[];

  // Social Stats
  totalChallenges: number;
  activeChallenges: number;
  recordChallenge: () => void;
}

// Mock leaderboard data for demo
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: 'user_001',
    name: 'Sarah',
    streakDays: 127,
    totalHours: 847,
  },
  {
    rank: 2,
    userId: 'user_002',
    name: 'Mike',
    streakDays: 89,
    totalHours: 612,
  },
  {
    rank: 3,
    userId: 'user_003',
    name: 'Alex',
    streakDays: 67,
    totalHours: 489,
    isCurrentUser: true,
  },
  {
    rank: 4,
    userId: 'user_004',
    name: 'Emma',
    streakDays: 45,
    totalHours: 298,
  },
  {
    rank: 5,
    userId: 'user_005',
    name: 'James',
    streakDays: 34,
    totalHours: 201,
  },
];

// Mock friends data for demo
const MOCK_FRIENDS: Friend[] = [
  {
    id: 'friend_001',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    currentStreak: 127,
    longestStreak: 145,
    totalHours: 847,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
  },
  {
    id: 'friend_002',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    currentStreak: 89,
    longestStreak: 92,
    totalHours: 612,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'friend_003',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    currentStreak: 45,
    longestStreak: 67,
    totalHours: 298,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
];

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      // Friends
      friends: MOCK_FRIENDS,

      addFriend: (friend) =>
        set((state) => ({
          friends: [...state.friends, friend],
        })),

      removeFriend: (friendId) =>
        set((state) => ({
          friends: state.friends.filter((f) => f.id !== friendId),
        })),

      updateFriendStreak: (friendId, streak) =>
        set((state) => ({
          friends: state.friends.map((f) =>
            f.id === friendId
              ? {
                  ...f,
                  currentStreak: streak,
                  longestStreak: Math.max(f.longestStreak, streak),
                }
              : f
          ),
        })),

      // Leaderboard
      leaderboard: MOCK_LEADERBOARD,

      setLeaderboard: (entries) => set({ leaderboard: entries }),

      getUserRank: (userId) => {
        const state = get();
        const entry = state.leaderboard.find((e) => e.userId === userId);
        return entry?.rank ?? null;
      },

      // Shared Achievements
      sharedAchievements: [],

      shareAchievement: (achievementId, achievementTitle, achievementIcon, message) => {
        const now = new Date().toISOString();
        const userId = 'current_user'; // In real app, get from auth store

        set((state) => ({
          sharedAchievements: [
            {
              id: `${userId}_${achievementId}_${Date.now()}`,
              userId,
              userName: 'You',
              achievementId,
              achievementTitle,
              achievementIcon,
              sharedAt: now,
              message,
            },
            ...state.sharedAchievements,
          ],
        }));
      },

      getFriendSharedAchievements: (friendId) => {
        const state = get();
        return state.sharedAchievements.filter((a) => a.userId === friendId);
      },

      // Social Stats
      totalChallenges: 0,
      activeChallenges: 0,

      recordChallenge: () =>
        set((state) => ({
          totalChallenges: state.totalChallenges + 1,
          activeChallenges: state.activeChallenges + 1,
        })),
    }),
    {
      name: 'social-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        friends: state.friends,
        leaderboard: state.leaderboard,
        sharedAchievements: state.sharedAchievements,
        totalChallenges: state.totalChallenges,
        activeChallenges: state.activeChallenges,
      }),
    }
  )
);
