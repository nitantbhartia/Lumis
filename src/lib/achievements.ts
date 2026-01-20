export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'hours' | 'consistency' | 'special';
  requirement: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
}

export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  // Streak Achievements
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'streak',
    requirement: 7,
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '💎',
    category: 'streak',
    requirement: 30,
  },
  {
    id: 'streak_50',
    title: 'Unstoppable',
    description: 'Maintain a 50-day streak',
    icon: '⚡',
    category: 'streak',
    requirement: 50,
  },
  {
    id: 'streak_100',
    title: 'Centurion',
    description: 'Maintain a 100-day streak',
    icon: '🏆',
    category: 'streak',
    requirement: 100,
  },
  {
    id: 'streak_365',
    title: 'Year of Light',
    description: 'Maintain a 365-day streak',
    icon: '👑',
    category: 'streak',
    requirement: 365,
  },

  // Total Hours Achievements
  {
    id: 'hours_10',
    title: 'First Steps',
    description: 'Log 10 total hours in sunlight',
    icon: '🌅',
    category: 'hours',
    requirement: 10,
  },
  {
    id: 'hours_50',
    title: 'Sun Seeker',
    description: 'Log 50 total hours in sunlight',
    icon: '☀️',
    category: 'hours',
    requirement: 50,
  },
  {
    id: 'hours_100',
    title: 'Light Enthusiast',
    description: 'Log 100 total hours in sunlight',
    icon: '🌞',
    category: 'hours',
    requirement: 100,
  },
  {
    id: 'hours_500',
    title: 'Sunshine Champion',
    description: 'Log 500 total hours in sunlight',
    icon: '🌟',
    category: 'hours',
    requirement: 500,
  },
  {
    id: 'hours_1000',
    title: 'Solar Deity',
    description: 'Log 1000 total hours in sunlight',
    icon: '🌠',
    category: 'hours',
    requirement: 1000,
  },

  // Consistency Achievements
  {
    id: 'early_bird_7',
    title: 'Early Bird',
    description: 'Complete goal before 8 AM for 7 days',
    icon: '🐦',
    category: 'consistency',
    requirement: 7,
  },
  {
    id: 'early_bird_30',
    title: 'Dawn Chaser',
    description: 'Complete goal before 8 AM for 30 days',
    icon: '🌄',
    category: 'consistency',
    requirement: 30,
  },
  {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Complete every day this week',
    icon: '✨',
    category: 'consistency',
    requirement: 7,
  },
  {
    id: 'overachiever',
    title: 'Overachiever',
    description: 'Exceed daily goal by 2x for 7 days',
    icon: '🚀',
    category: 'consistency',
    requirement: 7,
  },

  // Special Achievements
  {
    id: 'first_goal',
    title: 'First Light',
    description: 'Complete your first daily goal',
    icon: '✅',
    category: 'special',
    requirement: 1,
  },
  {
    id: 'comeback',
    title: 'Phoenix Rising',
    description: 'Start a new streak after breaking one',
    icon: '🔄',
    category: 'special',
    requirement: 1,
  },
  {
    id: 'dedicated',
    title: 'Dedicated',
    description: 'Complete goal every day for a month',
    icon: '🎯',
    category: 'special',
    requirement: 30,
  },
  {
    id: 'no_emergency',
    title: 'Self Control Master',
    description: 'Go 30 days without using emergency unlock',
    icon: '🛡️',
    category: 'special',
    requirement: 30,
  },
];

export function checkAchievements(
  currentStreak: number,
  totalHours: number,
  earlyBirdDays: number,
  overachieverDays: number,
  goalsCompleted: number,
  daysWithoutEmergency: number,
  hasHadStreakBefore: boolean,
  achievements: Achievement[]
): Achievement[] {
  const updates: Achievement[] = [];

  for (const achievement of achievements) {
    if (achievement.unlocked) continue;

    let shouldUnlock = false;
    let progress = 0;

    switch (achievement.id) {
      // Streak achievements
      case 'streak_7':
      case 'streak_30':
      case 'streak_50':
      case 'streak_100':
      case 'streak_365':
        progress = currentStreak;
        shouldUnlock = currentStreak >= achievement.requirement;
        break;

      // Total hours achievements
      case 'hours_10':
      case 'hours_50':
      case 'hours_100':
      case 'hours_500':
      case 'hours_1000':
        progress = totalHours;
        shouldUnlock = totalHours >= achievement.requirement;
        break;

      // Early bird achievements
      case 'early_bird_7':
      case 'early_bird_30':
        progress = earlyBirdDays;
        shouldUnlock = earlyBirdDays >= achievement.requirement;
        break;

      // Overachiever
      case 'overachiever':
        progress = overachieverDays;
        shouldUnlock = overachieverDays >= achievement.requirement;
        break;

      // Perfect week / Dedicated
      case 'perfect_week':
      case 'dedicated':
        progress = currentStreak;
        shouldUnlock = currentStreak >= achievement.requirement;
        break;

      // First goal
      case 'first_goal':
        progress = goalsCompleted;
        shouldUnlock = goalsCompleted >= 1;
        break;

      // Comeback
      case 'comeback':
        progress = hasHadStreakBefore && currentStreak >= 1 ? 1 : 0;
        shouldUnlock = hasHadStreakBefore && currentStreak >= 1;
        break;

      // No emergency
      case 'no_emergency':
        progress = daysWithoutEmergency;
        shouldUnlock = daysWithoutEmergency >= achievement.requirement;
        break;
    }

    if (shouldUnlock && !achievement.unlocked) {
      updates.push({
        ...achievement,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        progress: achievement.requirement,
      });
    } else if (!achievement.unlocked) {
      updates.push({
        ...achievement,
        progress: Math.min(progress, achievement.requirement),
      });
    }
  }

  return updates;
}

export function getAchievementsByCategory(achievements: Achievement[]) {
  return {
    streak: achievements.filter((a) => a.category === 'streak'),
    hours: achievements.filter((a) => a.category === 'hours'),
    consistency: achievements.filter((a) => a.category === 'consistency'),
    special: achievements.filter((a) => a.category === 'special'),
  };
}

export function getUnlockedCount(achievements: Achievement[]): number {
  return achievements.filter((a) => a.unlocked).length;
}

export function getTotalCount(): number {
  return ACHIEVEMENTS.length;
}
