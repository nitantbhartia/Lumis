/**
 * Progressive Difficulty System
 *
 * Gradually increases daily goal time based on days in program:
 * - Days 1-3: 2 minutes (Getting Started)
 * - Days 4-14: 3 minutes (Building Momentum)
 * - Days 15-30: 4 minutes (Committed)
 * - Days 31-60: 5 minutes (Veteran)
 * - Days 61+: 3 minutes (Earned flexibility - reset to sustainable level)
 */

export function calculateGoalMinutes(daysInProgram: number): number {
  if (daysInProgram <= 3) return 2;
  if (daysInProgram <= 14) return 3;
  if (daysInProgram <= 30) return 4;
  if (daysInProgram <= 60) return 5;
  return 3; // After 60 days, reset to 3min (earned flexibility)
}

export function getDifficultyLabel(minutes: number): string {
  if (minutes === 2) return "Getting Started";
  if (minutes === 3) return "Building Momentum";
  if (minutes === 4) return "Committed";
  if (minutes === 5) return "Veteran";
  return "Custom";
}

export function getDifficultyEmoji(minutes: number): string {
  if (minutes === 2) return "🌱"; // Seedling
  if (minutes === 3) return "🔥"; // Fire
  if (minutes === 4) return "💪"; // Flex
  if (minutes === 5) return "👑"; // Crown
  return "⚡"; // Lightning (custom)
}

export function getNextMilestone(daysInProgram: number): {
  daysUntil: number;
  nextLevel: string;
  nextMinutes: number;
} | null {
  if (daysInProgram < 3) {
    return {
      daysUntil: 3 - daysInProgram,
      nextLevel: "Building Momentum",
      nextMinutes: 3
    };
  }
  if (daysInProgram < 14) {
    return {
      daysUntil: 14 - daysInProgram,
      nextLevel: "Committed",
      nextMinutes: 4
    };
  }
  if (daysInProgram < 30) {
    return {
      daysUntil: 30 - daysInProgram,
      nextLevel: "Veteran",
      nextMinutes: 5
    };
  }
  if (daysInProgram < 60) {
    return {
      daysUntil: 60 - daysInProgram,
      nextLevel: "Earned Flexibility",
      nextMinutes: 3
    };
  }
  return null; // Max level reached
}
