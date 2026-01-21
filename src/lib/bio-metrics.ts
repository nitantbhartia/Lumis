/**
 * Vitamin D Synthesis Calculation
 * 
 * Formula factors:
 * - UV Index (UVI)
 * - Exposure Time (Minutes)
 * - Skin Type (Fitzpatrick Scale 1-6)
 * - Body Surface Area (BSA) - estimated: 0.25 (face/hands/arms)
 * 
 * Reference: Modified Holick formula for Vitamin D IU production
 */

export const calculateVitaminD = (
    uvIndex: number,
    minutes: number,
    skinType: number,
    bsa: number = 0.25
): number => {
    if (uvIndex < 1) return 0; // Negligible synthesis below UVI 1

    // Correction factor for skin type (Type 1 is baseline, higher types need more time)
    // Fitzpatrick scale multipliers: Type 1=1.0, 2=1.2, 3=1.5, 4=2.0, 5=2.5, 6=3.0
    const skinMultipliers: Record<number, number> = {
        1: 1.0,
        2: 1.2,
        3: 1.5,
        4: 2.0,
        5: 2.5,
        6: 3.0,
    };

    const multiplier = skinMultipliers[skinType] || 1.2;

    // Estimated IU synthesis per minute at UVI 1 for 100% skin exposure
    // This is a simplified scientific model
    const baseIUSynthesizedPerMin = 40;

    const synthesis = (baseIUSynthesizedPerMin * uvIndex * minutes * bsa) / multiplier;

    return Math.round(synthesis);
};

/**
 * Morning Light Quality Score
 * 
 * Factors in Lux intensity and Time of Day relative to Sunrise
 */
export const calculateLightQuality = (lux: number, minutesSinceSunrise: number): {
    score: number;
    label: string;
} => {
    let score = 0;

    // Lux factor (The "Anchor" effect)
    if (lux > 10000) score += 50; // Direct sunlight
    else if (lux > 2500) score += 30; // Bright overcast
    else if (lux > 1000) score += 10; // Shady outdoor

    // Time factor (Early morning is high quality)
    if (minutesSinceSunrise <= 60) score += 50; // Golden hour
    else if (minutesSinceSunrise <= 120) score += 30; // Mid morning
    else if (minutesSinceSunrise <= 240) score += 10; // Late morning

    let label = "Low Impact";
    if (score >= 90) label = "Biological Gold";
    else if (score >= 60) label = "High Impact";
    else if (score >= 30) label = "Steady Repair";

    return { score, label };
};
