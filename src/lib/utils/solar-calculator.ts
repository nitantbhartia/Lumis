/**
 * Solar Position Calculator
 *
 * Calculates sun position (altitude, azimuth) and expected outdoor lux levels
 * based on geographic coordinates and time. Used for outdoor verification.
 *
 * Algorithm based on simplified NOAA solar position calculations.
 */

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export interface SolarPosition {
  altitude: number;  // Degrees above horizon (-90 to 90)
  azimuth: number;   // Degrees from north (0 to 360)
  zenith: number;    // Degrees from vertical (0 to 180)
}

export interface ExpectedLuxRange {
  min: number;
  max: number;
  typical: number;
}

/**
 * Calculate solar position for given coordinates and time
 */
export function calculateSolarPosition(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): SolarPosition {
  // Julian day calculation
  const jd = getJulianDay(date);
  const jc = (jd - 2451545.0) / 36525.0; // Julian century

  // Sun's geometric mean longitude (degrees)
  const L0 = (280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360;

  // Sun's mean anomaly (degrees)
  const M = (357.52911 + jc * (35999.05029 - 0.0001537 * jc)) % 360;

  // Sun's equation of center
  const C = Math.sin(M * DEG_TO_RAD) * (1.914602 - jc * (0.004817 + 0.000014 * jc)) +
            Math.sin(2 * M * DEG_TO_RAD) * (0.019993 - 0.000101 * jc) +
            Math.sin(3 * M * DEG_TO_RAD) * 0.000289;

  // Sun's true longitude (degrees)
  const sunLon = L0 + C;

  // Sun's apparent longitude (degrees)
  const omega = 125.04 - 1934.136 * jc;
  const lambda = sunLon - 0.00569 - 0.00478 * Math.sin(omega * DEG_TO_RAD);

  // Obliquity of ecliptic (degrees)
  const epsilon = 23.439 - 0.0000004 * jc;

  // Sun's declination (degrees)
  const declination = Math.asin(Math.sin(epsilon * DEG_TO_RAD) *
                                 Math.sin(lambda * DEG_TO_RAD)) * RAD_TO_DEG;

  // Equation of time (minutes)
  const eqTime = 4 * (L0 - 0.0057183 - lambda + C);

  // Hour angle (degrees)
  const timeOffset = eqTime + 4 * longitude;
  const tst = date.getHours() * 60 + date.getMinutes() +
              date.getSeconds() / 60 + date.getMilliseconds() / 60000 + timeOffset;
  const hourAngle = (tst / 4) - 180;

  // Solar zenith angle (degrees from vertical)
  const zenithRad = Math.acos(
    Math.sin(latitude * DEG_TO_RAD) * Math.sin(declination * DEG_TO_RAD) +
    Math.cos(latitude * DEG_TO_RAD) * Math.cos(declination * DEG_TO_RAD) *
    Math.cos(hourAngle * DEG_TO_RAD)
  );
  const zenith = zenithRad * RAD_TO_DEG;

  // Solar altitude (degrees above horizon)
  const altitude = 90 - zenith;

  // Solar azimuth (degrees from north, clockwise)
  const azimuthRad = Math.acos(
    ((Math.sin(latitude * DEG_TO_RAD) * Math.cos(zenithRad)) -
     Math.sin(declination * DEG_TO_RAD)) /
    (Math.cos(latitude * DEG_TO_RAD) * Math.sin(zenithRad))
  );

  let azimuth = azimuthRad * RAD_TO_DEG;
  if (hourAngle > 0) {
    azimuth = 360 - azimuth;
  }

  return { altitude, azimuth, zenith };
}

/**
 * Calculate expected outdoor lux level based on solar position and weather
 */
export function calculateExpectedLux(
  latitude: number,
  longitude: number,
  date: Date,
  cloudCoverPercent: number = 0,
  uvIndex: number = 0
): ExpectedLuxRange {
  const { altitude, zenith } = calculateSolarPosition(latitude, longitude, date);

  // Sun below horizon = nighttime
  if (altitude < -6) {
    return { min: 0, max: 1, typical: 0 };
  }

  // Twilight (sun between -6° and 0°)
  if (altitude < 0) {
    const twilightFactor = (altitude + 6) / 6; // 0 to 1
    const twilightLux = 10 * twilightFactor;
    return {
      min: Math.max(0, twilightLux * 0.5),
      max: twilightLux * 2,
      typical: twilightLux
    };
  }

  // Base clear-sky lux calculation
  // Air mass coefficient (accounts for atmosphere thickness)
  const airMass = 1 / (Math.cos(zenith * DEG_TO_RAD) + 0.50572 *
                       Math.pow(96.07995 - zenith, -1.6364));

  // Maximum direct sunlight at zenith (perpendicular to sun)
  const maxDirectLux = 120000; // Typical direct sunlight

  // Atmospheric attenuation factor
  const atmosphericTransmittance = Math.pow(0.7, Math.pow(airMass, 0.678));

  // Direct sunlight component
  const directLux = maxDirectLux * Math.sin(altitude * DEG_TO_RAD) *
                    atmosphericTransmittance;

  // Diffuse skylight component (scattered light)
  const diffuseLux = directLux * 0.15; // ~15% of direct

  // Total clear-sky illuminance
  const clearSkyLux = directLux + diffuseLux;

  // Apply cloud cover reduction
  // Overcast reduces lux by 80-90%, partial clouds by 30-70%
  const cloudFactor = 1 - (cloudCoverPercent / 100) * 0.85;
  const cloudAdjustedLux = clearSkyLux * cloudFactor;

  // Apply UV index as validation signal
  // High UV = more direct sunlight = higher confidence in calculation
  const uvBonus = uvIndex > 0 ? 1.0 + (uvIndex * 0.05) : 1.0;

  // Calculate range with margins for sensor variance and local conditions
  const typical = cloudAdjustedLux * uvBonus;
  const min = typical * 0.5;  // Allow 50% lower (shade, obstacles)
  const max = typical * 1.8;  // Allow 80% higher (reflections, snow)

  return {
    min: Math.max(0, min),
    max,
    typical
  };
}

/**
 * Validate if measured lux matches expected outdoor conditions
 * Returns confidence score 0-100%
 */
export function validateSolarLux(
  measuredLux: number,
  latitude: number,
  longitude: number,
  date: Date,
  cloudCoverPercent: number = 0,
  uvIndex: number = 0
): number {
  const expected = calculateExpectedLux(latitude, longitude, date, cloudCoverPercent, uvIndex);

  // Nighttime check
  if (expected.typical < 10) {
    // At night, any high lux reading is suspicious
    if (measuredLux > 500) {
      return 0; // Definitely fake (flashlight/lamp)
    }
    if (measuredLux < 50) {
      return 100; // Correctly low at night
    }
    return 50; // Borderline
  }

  // Daytime validation
  if (measuredLux >= expected.min && measuredLux <= expected.max) {
    // Within expected range - high confidence
    return 100;
  }

  if (measuredLux < expected.min) {
    // Too dark for conditions
    const ratio = measuredLux / expected.min;
    if (ratio > 0.3) {
      // Close enough (maybe phone in shade/pocket)
      return 60;
    }
    // Very dark = likely indoors
    return 20;
  }

  // measuredLux > expected.max
  // Too bright for conditions - suspicious
  const excessRatio = measuredLux / expected.max;
  if (excessRatio < 1.5) {
    // Slightly over (maybe reflections)
    return 80;
  }
  if (excessRatio < 3) {
    // Significantly over (flashlight?)
    return 40;
  }
  // Way too bright = definitely fake
  return 10;
}

/**
 * Helper: Convert Date to Julian Day
 */
function getJulianDay(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 +
               date.getUTCSeconds() / 3600;

  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;

  let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
            Math.floor(y / 4) - Math.floor(y / 100) +
            Math.floor(y / 400) - 32045;

  return jdn + (hour - 12) / 24;
}

/**
 * Check if it's daytime based on solar altitude
 */
export function isDaytime(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): boolean {
  const { altitude } = calculateSolarPosition(latitude, longitude, date);
  return altitude > -6; // Civil twilight threshold
}

/**
 * Get sunrise and sunset times for a given date and location
 */
export function getSunTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): { sunrise: Date; sunset: Date } {
  // Simplified calculation - find when altitude crosses 0°
  const baseDate = new Date(date);
  baseDate.setHours(0, 0, 0, 0);

  let sunrise: Date | null = null;
  let sunset: Date | null = null;

  // Check every 15 minutes through the day
  for (let hour = 0; hour < 24; hour += 0.25) {
    const checkTime = new Date(baseDate);
    checkTime.setHours(0, Math.floor(hour * 60), 0, 0);

    const { altitude } = calculateSolarPosition(latitude, longitude, checkTime);

    if (altitude > -0.5 && !sunrise) {
      sunrise = checkTime;
    }
    if (altitude < -0.5 && sunrise && !sunset) {
      sunset = checkTime;
      break;
    }
  }

  // Fallback times if calculation fails
  const fallbackSunrise = new Date(baseDate);
  fallbackSunrise.setHours(6, 0, 0, 0);
  const fallbackSunset = new Date(baseDate);
  fallbackSunset.setHours(18, 0, 0, 0);

  return {
    sunrise: sunrise || fallbackSunrise,
    sunset: sunset || fallbackSunset
  };
}
