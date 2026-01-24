import { useMemo } from 'react';
import { formatFirstName } from '@/lib/utils/name-utils';

export interface MissionBriefing {
    title: string;
    message: string;
    luxScore: string;
    duration: string;
    durationValue: number; // The numeric goal in minutes
    urgency: string;
    urgencyColor: string;
    isAdjusted: boolean; // Flag to indicate if we overrode the baseline
}

/**
 * Calculates the daily mission based on weather, streak, and time.
 * Returns a structured mission object including the dynamic target duration.
 */
export function useMissionBriefing(
    weatherCondition: string,
    hoursSinceSunrise: number,
    streak: number,
    userName: string | null,
    baselineGoal: number = 16
): MissionBriefing {
    const name = formatFirstName(userName) || 'User';

    return useMemo(() => {
        const condition = weatherCondition.toLowerCase();
        const isCloudy = condition.includes('cloud') || condition.includes('rain') || condition.includes('overcast');
        const isClear = condition.includes('sunny') || condition.includes('clear');

        // 1. Streak Defense (Priority if streak is good)
        if (streak >= 4) {
            return {
                title: "Streak Defense",
                message: `You've unlocked your apps before 8 AM for ${streak} days straight. Don't let the streak break today.`,
                luxScore: "Streak: " + streak,
                duration: "10 min",
                durationValue: 10, // Or keep baseline? Usually streak defense implies just getting out. Let's say 10 min sprint.
                urgency: "High Priority",
                urgencyColor: "#FF6B6B",
                isAdjusted: true
            };
        }

        // 2. Clear Sky Sprint
        if (isClear || !isCloudy) {
            return {
                title: "Clear Sky Sprint",
                message: `${name}, local light is at peak Lux (10,000+). Your mission today is a 10-minute sprint to full energy.`,
                luxScore: "10,000+ Lux",
                duration: "10-12 min",
                durationValue: 12, // Sprint is shorter
                urgency: "Optimal",
                urgencyColor: "#4CAF50",
                isAdjusted: true
            };
        }

        // 3. Cloudy Anchor Protocol (The User's specific request)
        // "If Lux is < 5,000 (implied by cloudy), set TargetDuration to 22."
        return {
            title: "Cloudy Anchor Protocol",
            message: `Overcast skies detected. Extended goal to keep your circadian clock anchored.`,
            luxScore: "~2,500 Lux",
            duration: "20-25 min",
            durationValue: 22,
            urgency: "Adjusted",
            urgencyColor: "#FF9800", // Orange
            isAdjusted: true
        };
    }, [weatherCondition, hoursSinceSunrise, streak, name, baselineGoal]);
}
