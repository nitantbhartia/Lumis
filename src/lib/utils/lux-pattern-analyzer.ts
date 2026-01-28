/**
 * Lux Pattern Analyzer
 *
 * Analyzes temporal patterns in lux readings to detect fake/artificial light sources.
 * Natural sunlight has smooth gradients, while indoor lights are constant or flickering.
 */

export interface LuxPattern {
  mean: number;
  stdDev: number;
  variance: number;
  minValue: number;
  maxValue: number;
  range: number;
  hasSpikes: boolean;
  isConstant: boolean;
  confidence: number; // 0-100% that this is natural outdoor light
}

/**
 * Analyze a history of lux readings to determine if pattern is natural
 * @param luxHistory - Array of recent lux readings (typically last 30 seconds)
 * @returns Pattern analysis with confidence score
 */
export function analyzeLuxPattern(luxHistory: number[]): LuxPattern {
  if (luxHistory.length < 5) {
    // Not enough data
    return {
      mean: luxHistory[0] || 0,
      stdDev: 0,
      variance: 0,
      minValue: luxHistory[0] || 0,
      maxValue: luxHistory[0] || 0,
      range: 0,
      hasSpikes: false,
      isConstant: false,
      confidence: 50 // Neutral - need more data
    };
  }

  // Calculate basic statistics
  const mean = luxHistory.reduce((sum, val) => sum + val, 0) / luxHistory.length;
  const minValue = Math.min(...luxHistory);
  const maxValue = Math.max(...luxHistory);
  const range = maxValue - minValue;

  // Calculate variance and standard deviation
  const squaredDiffs = luxHistory.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / luxHistory.length;
  const stdDev = Math.sqrt(variance);

  // Detect spikes (sudden jumps > 2x baseline)
  const hasSpikes = detectSpikes(luxHistory, mean);

  // Detect unnatural constancy
  const coefficientOfVariation = stdDev / (mean + 1); // +1 to avoid divide by zero
  const isConstant = coefficientOfVariation < 0.03; // Less than 3% variation

  // Calculate confidence score
  const confidence = calculatePatternConfidence(
    mean,
    stdDev,
    coefficientOfVariation,
    hasSpikes,
    isConstant,
    range,
    luxHistory
  );

  return {
    mean,
    stdDev,
    variance,
    minValue,
    maxValue,
    range,
    hasSpikes,
    isConstant,
    confidence
  };
}

/**
 * Detect sudden spikes that indicate artificial light
 */
function detectSpikes(luxHistory: number[], mean: number): boolean {
  for (let i = 1; i < luxHistory.length; i++) {
    const prev = luxHistory[i - 1];
    const curr = luxHistory[i];
    const change = Math.abs(curr - prev);

    // Spike if change is > 2x the mean or > 5000 lux jump
    if (change > mean * 2 || change > 5000) {
      return true;
    }
  }
  return false;
}

/**
 * Calculate confidence score that pattern is natural outdoor light
 */
function calculatePatternConfidence(
  mean: number,
  stdDev: number,
  coefficientOfVariation: number,
  hasSpikes: boolean,
  isConstant: boolean,
  range: number,
  luxHistory: number[]
): number {
  let confidence = 100;

  // 1. Check for spikes (flashlight/lamp turned on suddenly)
  if (hasSpikes) {
    confidence -= 40; // Major red flag
  }

  // 2. Check for unnatural constancy (lamp pointed at phone)
  if (isConstant && mean > 500) {
    // High lux but zero variation = likely artificial
    confidence -= 35;
  }

  // 3. Natural outdoor light should have 5-15% coefficient of variation
  if (mean > 500) {
    // Daylight hours
    if (coefficientOfVariation < 0.05) {
      // Too constant for outdoor
      confidence -= 25;
    } else if (coefficientOfVariation > 0.30) {
      // Too erratic (flickering or changing light sources)
      confidence -= 20;
    }
  }

  // 4. Check trend direction (outdoor light follows solar path)
  const trend = calculateTrend(luxHistory);
  if (Math.abs(trend) > 0.5) {
    // Natural outdoor light changes gradually with sun position
    confidence += 10; // Bonus for realistic gradient
  }

  // 5. Range check
  if (mean > 1000) {
    const relativeRange = range / mean;
    if (relativeRange < 0.1) {
      // High lux but no variation = suspicious
      confidence -= 15;
    }
  }

  // 6. Low light at night should be very stable
  if (mean < 100) {
    if (stdDev > 50) {
      // Nighttime with high variance = likely indoor with changing lights
      confidence -= 20;
    } else {
      // Stable low light = genuine night/indoor
      confidence += 5;
    }
  }

  // 7. Very high lux (> 30000) is rare even outdoors - check pattern
  if (mean > 30000) {
    // Direct sunlight pointed at sensor OR flashlight
    if (isConstant) {
      confidence -= 30; // Likely flashlight
    }
  }

  // Clamp confidence to 0-100
  return Math.max(0, Math.min(100, confidence));
}

/**
 * Calculate trend (slope) of lux readings over time
 * Positive = increasing, negative = decreasing, near-zero = stable
 */
function calculateTrend(luxHistory: number[]): number {
  if (luxHistory.length < 3) return 0;

  // Simple linear regression
  const n = luxHistory.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += luxHistory[i];
    sumXY += i * luxHistory[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  // Normalize slope by mean to get relative trend
  const mean = sumY / n;
  return slope / (mean + 1);
}

/**
 * Quick check: Is current lux reading consistent with recent history?
 * Used for real-time anomaly detection
 */
export function isLuxAnomalous(
  currentLux: number,
  recentHistory: number[]
): boolean {
  if (recentHistory.length < 3) return false;

  const recentMean = recentHistory.reduce((sum, val) => sum + val, 0) / recentHistory.length;
  const recentMax = Math.max(...recentHistory);

  // Anomalous if:
  // 1. Sudden jump > 3x recent mean
  // 2. Sudden jump > 10000 lux
  // 3. Drops to near-zero when it was high

  if (currentLux > recentMean * 3 && currentLux - recentMean > 10000) {
    return true; // Sudden bright spike
  }

  if (recentMean > 1000 && currentLux < 50) {
    return true; // Sudden darkness (covered sensor?)
  }

  return false;
}

/**
 * Determine if lux pattern suggests phone is in pocket/bag
 * Low lux but occasional spikes when user checks phone
 */
export function isInPocketPattern(luxHistory: number[]): boolean {
  if (luxHistory.length < 10) return false;

  let lowCount = 0;
  let spikeCount = 0;

  for (let i = 0; i < luxHistory.length; i++) {
    if (luxHistory[i] < 20) {
      lowCount++;
    }
    if (i > 0 && luxHistory[i] > luxHistory[i - 1] * 10) {
      spikeCount++; // Brief spike when phone removed from pocket
    }
  }

  // Mostly dark with occasional spikes
  return lowCount > luxHistory.length * 0.7 && spikeCount >= 1;
}
