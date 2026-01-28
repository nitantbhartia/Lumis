import { useMemo } from 'react';
import { formatFirstName } from '@/lib/utils/name-utils';
import { useLumisStore } from '@/lib/state/lumis-store';

export interface MissionBriefing {
    title: string;
    message: string;
    luxScore: string;
    duration: string;
    durationValue: number; // The numeric goal in minutes
    urgency: string;
    urgencyColor: string;
    isAdjusted: boolean; // Flag to indicate if we overrode the baseline
    personalizedTip?: string; // Personalized tip based on onboarding data
}

// Onboarding data types
interface OnboardingData {
    sunlightFrequency: 'daily' | 'few_times' | 'once_a_week' | 'rarely' | null;
    phoneReachTiming: 'immediately' | 'in_bed' | 'coffee' | 'out_door' | null;
    brainFogFrequency: 'yes' | 'no' | 'most' | null;
    screenBeforeBed: 'always' | 'often' | 'sometimes' | 'rarely' | null;
    morningEnergyLevel: 'exhausted' | 'sluggish' | 'okay' | 'energized' | null;
}

/**
 * Get a personalized tip based on onboarding data
 */
function getPersonalizedTip(data: OnboardingData, streak: number): string | undefined {
    // Priority 1: Brain fog users get cognitive benefits messaging
    if (data.brainFogFrequency === 'yes' || data.brainFogFrequency === 'most') {
        if (streak === 0) {
            return "Morning light helps clear brain fog. Your first win starts today.";
        }
        return "Light exposure before screens reduces brain fog throughout the day.";
    }

    // Priority 2: Immediate phone grabbers get habit-breaking messaging
    if (data.phoneReachTiming === 'immediately' || data.phoneReachTiming === 'in_bed') {
        if (streak < 3) {
            return "Light before phone = sharper focus. You're rewiring the habit.";
        }
        return "You're breaking the phone-first pattern. Your brain thanks you.";
    }

    // Priority 3: Poor morning energy gets energy-focused messaging
    if (data.morningEnergyLevel === 'exhausted' || data.morningEnergyLevel === 'sluggish') {
        return "Morning light signals your body to produce natural energy.";
    }

    // Priority 4: Heavy screen-before-bed users get sleep quality messaging
    if (data.screenBeforeBed === 'always' || data.screenBeforeBed === 'often') {
        return "Morning light helps offset evening screen time effects on sleep.";
    }

    // Priority 5: Rare sunlight getters get gentle encouragement
    if (data.sunlightFrequency === 'rarely' || data.sunlightFrequency === 'once_a_week') {
        if (streak >= 7) {
            return "You're getting more light than ever before. Keep it up!";
        }
        return "A few minutes outside is all it takes to feel the difference.";
    }

    return undefined;
}

/**
 * Calculate goal adjustment based on onboarding profile
 */
function getGoalAdjustment(data: OnboardingData): number {
    let adjustment = 0;

    // Rarely gets sunlight = needs longer exposure to build tolerance
    if (data.sunlightFrequency === 'rarely') {
        adjustment += 3;
    } else if (data.sunlightFrequency === 'once_a_week') {
        adjustment += 2;
    }

    // Brain fog = extended exposure helps more
    if (data.brainFogFrequency === 'yes' || data.brainFogFrequency === 'most') {
        adjustment += 2;
    }

    // Poor morning energy = needs more light to reset circadian
    if (data.morningEnergyLevel === 'exhausted') {
        adjustment += 2;
    } else if (data.morningEnergyLevel === 'sluggish') {
        adjustment += 1;
    }

    // Heavy screen before bed = compensate with more morning light
    if (data.screenBeforeBed === 'always') {
        adjustment += 2;
    } else if (data.screenBeforeBed === 'often') {
        adjustment += 1;
    }

    return adjustment;
}

/**
 * Calculates the daily mission based on weather, streak, time, and user profile.
 * Returns a structured mission object including the dynamic target duration.
 */
export function useMissionBriefing(
    weatherCondition: string,
    isDaylight: boolean,
    streak: number,
    userName: string | null,
    baselineGoal: number = 16
): MissionBriefing {
    const name = formatFirstName(userName) || 'User';

    // Get onboarding data from store
    const sunlightFrequency = useLumisStore((s) => s.sunlightFrequency);
    const phoneReachTiming = useLumisStore((s) => s.phoneReachTiming);
    const brainFogFrequency = useLumisStore((s) => s.brainFogFrequency);
    const screenBeforeBed = useLumisStore((s) => s.screenBeforeBed);
    const morningEnergyLevel = useLumisStore((s) => s.morningEnergyLevel);

    const onboardingData: OnboardingData = {
        sunlightFrequency,
        phoneReachTiming,
        brainFogFrequency,
        screenBeforeBed,
        morningEnergyLevel,
    };

    return useMemo(() => {
        const condition = weatherCondition.toLowerCase();
        const isCloudy = condition.includes('cloud') || condition.includes('rain') || condition.includes('overcast');
        const isClear = condition.includes('sunny') || condition.includes('clear');

        // Get personalized adjustments
        const personalizedTip = getPersonalizedTip(onboardingData, streak);
        const goalAdjustment = getGoalAdjustment(onboardingData);

        // 0. Night Rest Protocol (Highest priority - when sun is down)
        if (!isDaylight) {
            return {
                title: "Night Rest Protocol",
                message: `${name}, natural light isn't available right now. Your circadian rhythm benefits from rest and dim light in the evening. Come back tomorrow at sunrise for your mission.`,
                luxScore: "Night Mode",
                duration: "Paused",
                durationValue: 0,
                urgency: "Paused",
                urgencyColor: "#9CA3AF",
                isAdjusted: true,
                personalizedTip: screenBeforeBed === 'always' || screenBeforeBed === 'often'
                    ? "Try dimming screens tonight for better morning energy."
                    : undefined
            };
        }

        // 1. Streak Defense (Priority if streak is good)
        if (streak >= 4) {
            const baseDuration = 10;
            return {
                title: "Streak Defense",
                message: `You've unlocked your apps before 8 AM for ${streak} days straight. Don't let the streak break today.`,
                luxScore: "Streak: " + streak,
                duration: `${baseDuration} min`,
                durationValue: baseDuration,
                urgency: "High Priority",
                urgencyColor: "#FF6B6B",
                isAdjusted: true,
                personalizedTip
            };
        }

        // 2. Clear Sky Sprint
        if (isClear || !isCloudy) {
            const baseDuration = 12 + Math.min(goalAdjustment, 3); // Cap adjustment at 3 for clear days
            return {
                title: "Clear Sky Sprint",
                message: `${name}, local light is at peak Lux (10,000+). Your mission today is a quick sprint to full energy.`,
                luxScore: "10,000+ Lux",
                duration: `${baseDuration - 2}-${baseDuration} min`,
                durationValue: baseDuration,
                urgency: "Optimal",
                urgencyColor: "#4CAF50",
                isAdjusted: goalAdjustment > 0,
                personalizedTip
            };
        }

        // 3. Cloudy Anchor Protocol
        const baseDuration = 22 + goalAdjustment;
        return {
            title: "Cloudy Anchor Protocol",
            message: `Overcast skies detected. Extended goal to keep your circadian clock anchored.`,
            luxScore: "~2,500 Lux",
            duration: `${baseDuration - 2}-${baseDuration + 3} min`,
            durationValue: baseDuration,
            urgency: "Adjusted",
            urgencyColor: "#FF9800",
            isAdjusted: true,
            personalizedTip
        };
    }, [weatherCondition, isDaylight, streak, name, baselineGoal, sunlightFrequency, phoneReachTiming, brainFogFrequency, screenBeforeBed, morningEnergyLevel]);
}
