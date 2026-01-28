// Stone milestone definitions with unique visual properties
// Each stone represents a significant achievement in the user's journey

export interface StoneMilestone {
  day: number;
  name: string;
  subtitle: string;
  description: string;
  // Visual properties
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
  };
  // Animation properties
  animation: {
    type: 'pulse' | 'rotate' | 'float' | 'shimmer' | 'orbit' | 'breathe' | 'radiate';
    intensity: number; // 0-1
    speed: number; // multiplier
  };
  // Icon/symbol inside
  symbol: 'flame' | 'sun' | 'star' | 'moon' | 'diamond' | 'crown' | 'infinity';
  // Shape variant
  shape: 'circle' | 'hexagon' | 'diamond' | 'shield' | 'crystal';
  // Special effects
  effects: {
    hasParticles: boolean;
    hasRays: boolean;
    hasRings: boolean;
    glowIntensity: number; // 0-1
  };
}

// Pro-exclusive stone (awarded for premium membership)
export const PRO_STONE: StoneMilestone = {
  day: -1, // Special marker for Pro stone
  name: 'Aurora Prism',
  subtitle: 'Pro Member',
  description: 'A rare prism that captures the aurora. Exclusive to Lumis Pro members.',
  colors: {
    primary: '#00D9FF',
    secondary: '#7B68EE',
    accent: '#FF69B4',
    glow: 'rgba(123, 104, 238, 0.6)',
  },
  animation: {
    type: 'shimmer',
    intensity: 1.0,
    speed: 0.8,
  },
  symbol: 'star',
  shape: 'crystal',
  effects: {
    hasParticles: true,
    hasRays: true,
    hasRings: true,
    glowIntensity: 0.9,
  },
};

export const STONE_MILESTONES: StoneMilestone[] = [
  {
    day: 1,
    name: 'The Spark',
    subtitle: 'Day 1',
    description: 'Your journey begins with a single spark of intention.',
    colors: {
      primary: '#FFE4B5',
      secondary: '#FFB347',
      accent: '#FF8C00',
      glow: 'rgba(255, 179, 71, 0.5)',
    },
    animation: {
      type: 'pulse',
      intensity: 0.6,
      speed: 1,
    },
    symbol: 'flame',
    shape: 'circle',
    effects: {
      hasParticles: false,
      hasRays: false,
      hasRings: false,
      glowIntensity: 0.4,
    },
  },
  {
    day: 7,
    name: 'Dawn Crystal',
    subtitle: 'Week 1',
    description: 'A week of morning light has crystallized your new habit.',
    colors: {
      primary: '#FFD700',
      secondary: '#FFA500',
      accent: '#FF6B35',
      glow: 'rgba(255, 215, 0, 0.6)',
    },
    animation: {
      type: 'shimmer',
      intensity: 0.7,
      speed: 1.2,
    },
    symbol: 'sun',
    shape: 'hexagon',
    effects: {
      hasParticles: false,
      hasRays: true,
      hasRings: false,
      glowIntensity: 0.5,
    },
  },
  {
    day: 14,
    name: 'Fortnight Flame',
    subtitle: '2 Weeks',
    description: 'Two weeks strong. The flame burns brighter now.',
    colors: {
      primary: '#FF7F50',
      secondary: '#FF6347',
      accent: '#FF4500',
      glow: 'rgba(255, 99, 71, 0.6)',
    },
    animation: {
      type: 'float',
      intensity: 0.8,
      speed: 0.8,
    },
    symbol: 'flame',
    shape: 'diamond',
    effects: {
      hasParticles: true,
      hasRays: false,
      hasRings: false,
      glowIntensity: 0.6,
    },
  },
  {
    day: 30,
    name: 'Lunar Opal',
    subtitle: '1 Month',
    description: 'One full moon cycle of dedication. A true habit is born.',
    colors: {
      primary: '#E6E6FA',
      secondary: '#DDA0DD',
      accent: '#BA55D3',
      glow: 'rgba(186, 85, 211, 0.5)',
    },
    animation: {
      type: 'orbit',
      intensity: 0.9,
      speed: 0.6,
    },
    symbol: 'moon',
    shape: 'circle',
    effects: {
      hasParticles: true,
      hasRays: false,
      hasRings: true,
      glowIntensity: 0.7,
    },
  },
  {
    day: 60,
    name: 'Solar Diamond',
    subtitle: '2 Months',
    description: 'Sixty sunrises. Your discipline shines like a diamond.',
    colors: {
      primary: '#87CEEB',
      secondary: '#00BFFF',
      accent: '#1E90FF',
      glow: 'rgba(30, 144, 255, 0.6)',
    },
    animation: {
      type: 'rotate',
      intensity: 1.0,
      speed: 0.5,
    },
    symbol: 'diamond',
    shape: 'crystal',
    effects: {
      hasParticles: true,
      hasRays: true,
      hasRings: false,
      glowIntensity: 0.8,
    },
  },
  {
    day: 100,
    name: 'Centurion Crown',
    subtitle: '100 Days',
    description: 'One hundred days of mastery. You wear the crown of discipline.',
    colors: {
      primary: '#FFD700',
      secondary: '#DAA520',
      accent: '#B8860B',
      glow: 'rgba(218, 165, 32, 0.7)',
    },
    animation: {
      type: 'radiate',
      intensity: 1.0,
      speed: 0.7,
    },
    symbol: 'crown',
    shape: 'shield',
    effects: {
      hasParticles: true,
      hasRays: true,
      hasRings: true,
      glowIntensity: 0.9,
    },
  },
  {
    day: 365,
    name: 'Eternal Sun',
    subtitle: '1 Year',
    description: 'A full year of sunrise ritual. You have transcended.',
    colors: {
      primary: '#FFFFFF',
      secondary: '#FFE4B5',
      accent: '#FFD700',
      glow: 'rgba(255, 255, 255, 0.8)',
    },
    animation: {
      type: 'breathe',
      intensity: 1.0,
      speed: 0.4,
    },
    symbol: 'infinity',
    shape: 'circle',
    effects: {
      hasParticles: true,
      hasRays: true,
      hasRings: true,
      glowIntensity: 1.0,
    },
  },
];

export const getStoneForDay = (day: number): StoneMilestone | undefined => {
  return STONE_MILESTONES.find((s) => s.day === day);
};

export const getNextMilestone = (currentStreak: number): StoneMilestone | undefined => {
  return STONE_MILESTONES.find((s) => s.day > currentStreak);
};

export const getCollectedStones = (collectedDays: number[]): StoneMilestone[] => {
  return STONE_MILESTONES.filter((s) => collectedDays.includes(s.day));
};

export const getMilestoneProgress = (currentStreak: number): { current: number; next: number; progress: number } => {
  const sortedMilestones = STONE_MILESTONES.map((s) => s.day).sort((a, b) => a - b);

  // Find the current milestone (last one achieved or 0)
  let currentMilestone = 0;
  for (const day of sortedMilestones) {
    if (currentStreak >= day) {
      currentMilestone = day;
    } else {
      break;
    }
  }

  // Find the next milestone
  const nextMilestone = sortedMilestones.find((d) => d > currentStreak) || sortedMilestones[sortedMilestones.length - 1];

  // Calculate progress percentage
  const range = nextMilestone - currentMilestone;
  const progress = range > 0 ? (currentStreak - currentMilestone) / range : 1;

  return {
    current: currentMilestone,
    next: nextMilestone,
    progress: Math.min(1, Math.max(0, progress)),
  };
};
