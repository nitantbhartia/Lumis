/**
 * Insights Service
 * Calculates trends, patterns, and generates monthly reports
 */

import { DailyProgress } from './state/lumis-store';

export interface InsightMetrics {
  totalMinutes: number;
  averageMinutes: number;
  longestStreak: number;
  currentStreak: number;
  consistency: number; // percentage of days tracked
  bestDay: DayPerformance;
  worstDay: DayPerformance;
  trend: 'improving' | 'stable' | 'declining';
  weeklyAverage: number[];
  monthlyTotal: number;
}

export interface DayPerformance {
  date: string;
  minutes: number;
  dayOfWeek: string;
}

export interface MonthlyReport {
  month: string;
  year: number;
  totalMinutes: number;
  totalDays: number;
  daysActive: number;
  consistencyScore: number; // 0-100
  bestWeek: number;
  mostActiveDay: string;
  improvements: string[];
  recommendations: string[];
}

export function calculateInsights(history: DailyProgress[]): InsightMetrics {
  if (history.length === 0) {
    return {
      totalMinutes: 0,
      averageMinutes: 0,
      longestStreak: 0,
      currentStreak: 0,
      consistency: 0,
      bestDay: { date: '', minutes: 0, dayOfWeek: '' },
      worstDay: { date: '', minutes: 0, dayOfWeek: '' },
      trend: 'stable',
      weeklyAverage: [0, 0, 0, 0, 0, 0, 0],
      monthlyTotal: 0,
    };
  }

  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const totalMinutes = sorted.reduce((sum, d) => sum + d.lightMinutes, 0);
  const averageMinutes = Math.round(totalMinutes / sorted.length);

  // Find best and worst days
  const bestDay = sorted.reduce((best, current) =>
    current.lightMinutes > best.lightMinutes ? current : best
  );
  const worstDay = sorted.reduce((worst, current) =>
    current.lightMinutes < worst.lightMinutes ? current : worst
  );

  // Calculate consistency
  const totalDays = Math.floor((Date.now() - new Date(sorted[0].date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const consistency = Math.round((sorted.length / totalDays) * 100);

  // Calculate weekly averages
  const weeklyData = [0, 0, 0, 0, 0, 0, 0];
  const weeklyCounts = [0, 0, 0, 0, 0, 0, 0];
  sorted.forEach(day => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    weeklyData[dayOfWeek] += day.lightMinutes;
    weeklyCounts[dayOfWeek]++;
  });
  const weeklyAverage = weeklyData.map((total, idx) =>
    weeklyCounts[idx] > 0 ? Math.round(total / weeklyCounts[idx]) : 0
  );

  // Calculate trend (compare last 7 days with previous 7 days)
  const recentData = sorted.slice(-7);
  const previousData = sorted.slice(-14, -7);
  const recentAvg = recentData.reduce((sum, d) => sum + d.lightMinutes, 0) / recentData.length;
  const previousAvg = previousData.length > 0 ? previousData.reduce((sum, d) => sum + d.lightMinutes, 0) / previousData.length : recentAvg;
  const trendDiff = recentAvg - previousAvg;
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (trendDiff > 5) trend = 'improving';
  if (trendDiff < -5) trend = 'declining';

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  sorted.forEach((day, idx) => {
    if (day.lightMinutes > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
      if (idx === sorted.length - 1) currentStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  });

  // Calculate monthly total
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyTotal = sorted
    .filter(d => new Date(d.date) >= monthStart)
    .reduce((sum, d) => sum + d.lightMinutes, 0);

  return {
    totalMinutes,
    averageMinutes,
    longestStreak,
    currentStreak,
    consistency,
    bestDay: {
      date: bestDay.date,
      minutes: bestDay.lightMinutes,
      dayOfWeek: new Date(bestDay.date).toLocaleDateString('en-US', { weekday: 'long' }),
    },
    worstDay: {
      date: worstDay.date,
      minutes: worstDay.lightMinutes,
      dayOfWeek: new Date(worstDay.date).toLocaleDateString('en-US', { weekday: 'long' }),
    },
    trend,
    weeklyAverage,
    monthlyTotal,
  };
}

export function generateMonthlyReport(history: DailyProgress[], month: number, year: number): MonthlyReport {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const daysInMonth = monthEnd.getDate();

  const monthlyData = history.filter(d => {
    const date = new Date(d.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });

  const totalMinutes = monthlyData.reduce((sum, d) => sum + d.lightMinutes, 0);
  const daysActive = monthlyData.filter(d => d.lightMinutes > 0).length;
  const consistencyScore = Math.round((daysActive / daysInMonth) * 100);

  // Find best week
  const weeks: number[] = [0, 0, 0, 0, 0];
  monthlyData.forEach(day => {
    const date = new Date(day.date);
    const weekOfMonth = Math.floor((date.getDate() - 1) / 7);
    weeks[weekOfMonth] += day.lightMinutes;
  });
  const bestWeek = Math.max(...weeks);

  // Find most active day
  const dayTotals: { [key: string]: number } = {};
  monthlyData.forEach(day => {
    const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
    dayTotals[dayName] = (dayTotals[dayName] || 0) + day.lightMinutes;
  });
  const mostActiveDay = Object.keys(dayTotals).reduce((a, b) =>
    dayTotals[a] > dayTotals[b] ? a : b
  ) || 'N/A';

  // Generate insights
  const improvements: string[] = [];
  const recommendations: string[] = [];

  if (consistencyScore >= 80) {
    improvements.push('🔥 Excellent consistency - kept up daily habit!');
  } else if (consistencyScore >= 60) {
    improvements.push('✨ Good progress - stay committed to your routine');
  }

  if (totalMinutes > 300) {
    improvements.push('☀️ Outstanding light exposure - keep it up!');
  }

  if (consistencyScore < 50) {
    recommendations.push('Try setting a reminder alarm for optimal outdoor time');
  }

  if (daysActive < 5) {
    recommendations.push('Aim for outdoor time on more days this month');
  }

  const avgPerDay = Math.round(totalMinutes / daysActive);
  if (avgPerDay < 15) {
    recommendations.push('Increase duration - aim for 20+ minutes per day');
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain your current outdoor routine!');
  }

  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });

  return {
    month: monthName,
    year,
    totalMinutes,
    totalDays: daysInMonth,
    daysActive,
    consistencyScore,
    bestWeek,
    mostActiveDay,
    improvements,
    recommendations,
  };
}
