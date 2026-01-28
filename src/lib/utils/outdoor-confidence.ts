/**
 * Outdoor Confidence Score Fusion Algorithm
 *
 * Combines multiple sensor signals into a single confidence score (0-100%)
 * that indicates likelihood of genuine outdoor sunlight exposure.
 */

export interface ConfidenceInputs {
  solarConfidence: number;        // 0-100% from solar position validation
  luxPatternConfidence: number;   // 0-100% from temporal lux analysis
  movementConfidence: number;     // 0-100% from activity-GPS correlation
  uvConfidence?: number;          // 0-100% from UV sensor (optional)
  tempConfidence?: number;        // 0-100% from temperature gradient (optional)
}

export interface ConfidenceResult {
  score: number;          // 0-100% combined confidence
  creditRate: number;     // 0.0, 0.5, or 1.0 multiplier
  signals: {
    solar: number;
    pattern: number;
    movement: number;
    uv?: number;
    temp?: number;
  };
  warnings: string[];     // User-facing explanations
}

/**
 * Calculate weighted outdoor confidence score
 */
export function calculateOutdoorConfidence(inputs: ConfidenceInputs): ConfidenceResult {
  const warnings: string[] = [];

  // Weights (must sum to 1.0)
  const WEIGHTS = {
    solar: 0.40,      // Strongest signal
    pattern: 0.25,    // Medium-high signal
    movement: 0.20,   // Medium signal
    uv: 0.10,         // Bonus signal
    temp: 0.05        // Weak signal
  };

  // Base score from required signals
  let score =
    (inputs.solarConfidence * WEIGHTS.solar) +
    (inputs.luxPatternConfidence * WEIGHTS.pattern) +
    (inputs.movementConfidence * WEIGHTS.movement);

  // Add optional signals if available
  if (inputs.uvConfidence !== undefined) {
    score += inputs.uvConfidence * WEIGHTS.uv;
  } else {
    // Redistribute UV weight to other signals
    const redistribution = WEIGHTS.uv / 3;
    score += inputs.solarConfidence * redistribution;
    score += inputs.luxPatternConfidence * redistribution;
    score += inputs.movementConfidence * redistribution;
  }

  if (inputs.tempConfidence !== undefined) {
    score += inputs.tempConfidence * WEIGHTS.temp;
  } else {
    // Redistribute temp weight
    score += inputs.solarConfidence * (WEIGHTS.temp / 2);
    score += inputs.luxPatternConfidence * (WEIGHTS.temp / 2);
  }

  // Generate warnings based on low signals
  if (inputs.solarConfidence < 40) {
    warnings.push('Light levels don\'t match solar position');
  }
  if (inputs.luxPatternConfidence < 40) {
    warnings.push('Unusual light pattern detected');
  }
  if (inputs.movementConfidence < 40) {
    warnings.push('Movement doesn\'t match activity type');
  }

  // Determine credit rate based on score
  let creditRate: number;
  if (score >= 80) {
    creditRate = 1.0; // Full credit - high confidence outdoor
  } else if (score >= 50) {
    creditRate = 0.5; // Partial credit - borderline case
    warnings.push('Borderline outdoor conditions - getting half credit');
  } else {
    creditRate = 0.0; // No credit - likely cheating or indoors
    warnings.push('Not enough confidence in outdoor exposure');
  }

  return {
    score: Math.round(score),
    creditRate,
    signals: {
      solar: inputs.solarConfidence,
      pattern: inputs.luxPatternConfidence,
      movement: inputs.movementConfidence,
      uv: inputs.uvConfidence,
      temp: inputs.tempConfidence
    },
    warnings
  };
}

/**
 * Calculate movement confidence based on activity type and actual movement
 */
export function calculateMovementConfidence(
  activityType: 'walk' | 'run' | 'meditate' | 'sit_soak' | string,
  steps: number,
  sessionSeconds: number,
  gpsDistance?: number // Distance in meters
): number {
  const minutes = sessionSeconds / 60;

  // Expected movement thresholds per activity
  const ACTIVITY_EXPECTATIONS = {
    walk: {
      minSteps: 20, // steps per minute minimum
      maxSteps: 150,
      minDistance: 25 // meters per minute
    },
    run: {
      minSteps: 60,
      maxSteps: 200,
      minDistance: 80
    },
    meditate: {
      minSteps: 0,
      maxSteps: 10,
      minDistance: 0
    },
    sit_soak: {
      minSteps: 0,
      maxSteps: 15,
      minDistance: 0
    }
  };

  const expectations = ACTIVITY_EXPECTATIONS[activityType as keyof typeof ACTIVITY_EXPECTATIONS];
  if (!expectations) {
    // Unknown activity type - use moderate expectations
    return steps > 10 ? 70 : 40;
  }

  const stepsPerMinute = steps / Math.max(1, minutes);

  // Check if steps match activity
  if (stepsPerMinute < expectations.minSteps * 0.5) {
    // Way too few steps for claimed activity
    return 20;
  }

  if (stepsPerMinute > expectations.maxSteps * 1.5) {
    // Way too many steps (impossible)
    return 30;
  }

  // Check if GPS distance matches (if available)
  if (gpsDistance !== undefined && minutes > 0) {
    const distancePerMinute = gpsDistance / minutes;

    if (activityType === 'walk' || activityType === 'run') {
      if (distancePerMinute < expectations.minDistance * 0.3) {
        // GPS shows no movement but claiming walk/run
        return 10;
      }
      if (distancePerMinute > expectations.minDistance * 10) {
        // Moving too fast (in vehicle?)
        return 15;
      }
    }

    if (activityType === 'meditate' || activityType === 'sit_soak') {
      if (distancePerMinute > 50) {
        // Moving too much for stationary activity
        return 25;
      }
    }
  }

  // Movement matches expectations
  if (stepsPerMinute >= expectations.minSteps && stepsPerMinute <= expectations.maxSteps) {
    return 100;
  }

  // Close enough
  if (stepsPerMinute >= expectations.minSteps * 0.7) {
    return 80;
  }

  // Borderline
  return 60;
}

/**
 * Check if user is likely in a vehicle (GPS speed too high)
 */
export function isInVehicle(gpsSpeed: number): boolean {
  // Speed in m/s, typical walking = 1.4 m/s, running = 3 m/s
  // Anything over 9 m/s (~20 mph) is likely vehicle
  return gpsSpeed > 9;
}

/**
 * Get user-friendly explanation of confidence score
 */
export function getConfidenceExplanation(result: ConfidenceResult): string {
  if (result.score >= 80) {
    return 'Strong outdoor signal detected. Full credit awarded!';
  }
  if (result.score >= 50) {
    return 'Partial outdoor exposure detected. Half credit awarded. ' +
           'Try moving to brighter sunlight for full credit.';
  }
  return 'Unable to verify outdoor exposure. ' +
         result.warnings.join('. ') + '.';
}
