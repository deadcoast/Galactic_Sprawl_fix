import { CombatUnit } from '../../types/combat/CombatTypes';

/**
 * Scan radius calculation utilities for the combat system.
 * These functions help determine effective scanning ranges for different unit types
 * and handle environmental factors that might affect scanning capabilities.
 */

// Basic configuration for different ship classes
export enum ScannerClass {
  SHORT_RANGE = 'short_range',
  MEDIUM_RANGE = 'medium_range',
  LONG_RANGE = 'long_range',
  ULTRA_LONG_RANGE = 'ultra_long_range',
}

export interface ScannerProfile {
  baseRadius: number;
  powerConsumption: number;
  resolutionFactor: number; // Higher means better ability to distinguish objects
  interferenceResistance: number; // 0-1, higher means more resistant to jamming
}

// Scanner profiles by class
const SCANNER_PROFILES: Record<ScannerClass, ScannerProfile> = {
  [ScannerClass.SHORT_RANGE]: {
    baseRadius: 300,
    powerConsumption: 10,
    resolutionFactor: 0.8,
    interferenceResistance: 0.3,
  },
  [ScannerClass.MEDIUM_RANGE]: {
    baseRadius: 600,
    powerConsumption: 25,
    resolutionFactor: 0.6,
    interferenceResistance: 0.5,
  },
  [ScannerClass.LONG_RANGE]: {
    baseRadius: 1000,
    powerConsumption: 50,
    resolutionFactor: 0.4,
    interferenceResistance: 0.7,
  },
  [ScannerClass.ULTRA_LONG_RANGE]: {
    baseRadius: 2000,
    powerConsumption: 100,
    resolutionFactor: 0.3,
    interferenceResistance: 0.9,
  },
};

// Environmental factors affecting scan radius
export interface EnvironmentalFactors {
  nebulaDensity?: number; // 0-1, higher means denser nebula (reduces scan range)
  solarActivity?: number; // 0-1, higher means more solar flares (reduces scan accuracy)
  asteroidDensity?: number; // 0-1, higher means more asteroids (can block scans)
  ionicInterference?: number; // 0-1, higher means more interference
  gravitationalDistortion?: number; // 0-1, higher means more distortion (bends scans)
}

/**
 * Calculate the effective scan radius for a unit based on its scanner class,
 * unknown tech bonuses, and environmental factors.
 *
 * @param scannerClass The class of scanner equipped on the unit
 * @param techBonuses Optional percentage bonus from technology (1.0 = no bonus, 1.5 = 50% bonus)
 * @param environmentalFactors Optional environmental conditions affecting scanning
 * @returns The effective scan radius in spatial units
 */
export function calculateScanRadius(
  scannerClass: ScannerClass,
  techBonuses = 1.0,
  environmentalFactors: EnvironmentalFactors = {}
): number {
  const profile = SCANNER_PROFILES[scannerClass];

  // Start with base radius
  let effectiveRadius = profile.baseRadius * techBonuses;

  // Apply environmental penalties
  if (environmentalFactors.nebulaDensity) {
    effectiveRadius *= 1 - environmentalFactors.nebulaDensity * 0.7;
  }

  if (environmentalFactors.solarActivity) {
    // Solar activity primarily affects accuracy, but also reduces range slightly
    effectiveRadius *= 1 - environmentalFactors.solarActivity * 0.3;
  }

  if (environmentalFactors.asteroidDensity) {
    // Asteroids can block line of sight
    effectiveRadius *= 1 - environmentalFactors.asteroidDensity * 0.5;
  }

  if (environmentalFactors.ionicInterference) {
    // Ionic interference can be countered by interference resistance
    const effectiveInterference =
      environmentalFactors.ionicInterference * (1 - profile.interferenceResistance);
    effectiveRadius *= 1 - effectiveInterference * 0.6;
  }

  if (environmentalFactors.gravitationalDistortion) {
    // Gravitational distortion bends scan waves, reducing effective range
    effectiveRadius *= 1 - environmentalFactors.gravitationalDistortion * 0.4;
  }

  // Ensure minimum scan radius
  return Math.max(effectiveRadius, profile.baseRadius * 0.3);
}

/**
 * Calculate detection probability for a target at a given distance
 *
 * @param distance Distance to the target
 * @param scanRadius Effective scan radius of the scanning unit
 * @param targetSignature How visible the target is (0-1, higher is more visible)
 * @returns Probability (0-1) of detecting the target
 */
export function calculateDetectionProbability(
  distance: number,
  scanRadius: number,
  targetSignature = 0.5
): number {
  if (distance <= scanRadius * 0.5) {
    // Objects within 50% of scan radius are almost certainly detected
    return Math.min(0.99, targetSignature * 1.5);
  }

  if (distance > scanRadius) {
    // Objects beyond scan radius have minimal chance of detection
    return Math.max(0.01, targetSignature * 0.2 * (scanRadius / distance));
  }

  // Linear falloff between 50% and 100% of scan radius
  const distanceRatio = (scanRadius - distance) / (scanRadius * 0.5);
  return Math.max(0.05, targetSignature * distanceRatio);
}

/**
 * Get target signature based on target type and status
 *
 * @param target The combat unit to check signature for
 * @returns Signature value from 0-1, higher is more visible
 */
export function getTargetSignature(target: CombatUnit): number {
  // Base signature depends on ship size/class
  let baseSignature = 0.5;

  // Adjust based on ship type
  if (target.type.includes('Frigate')) {
    baseSignature = 0.4;
  } else if (target.type.includes('Destroyer')) {
    baseSignature = 0.5;
  } else if (target.type.includes('Cruiser')) {
    baseSignature = 0.6;
  } else if (target.type.includes('Battleship')) {
    baseSignature = 0.8;
  } else if (target.type.includes('Carrier')) {
    baseSignature = 0.9;
  }

  // Active weapons increase signature
  if (target.weapons.some(weapon => weapon.status === 'ready')) {
    baseSignature += 0.2;
  }

  // Damaged ships are more visible
  const healthRatio = target.stats.health / target.stats.maxHealth;
  if (healthRatio < 0.5) {
    baseSignature += (0.5 - healthRatio) * 0.4;
  }

  // Cloaking or stealth technology would reduce signature
  // This would need to be implemented based on your game's stealth mechanics

  // Cap signature between 0.1 and 1.0
  return Math.min(1.0, Math.max(0.1, baseSignature));
}

/**
 * Calculate the distance between two points in 2D space
 */
export function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Determine if a target is within effective scan range
 */
export function isTargetDetectable(
  scanner: { position: { x: number; y: number }; scanRadius: number },
  target: { position: { x: number; y: number }; signature?: number }
): boolean {
  const distance = getDistance(scanner.position, target.position);
  const signature = target.signature ?? 0.5;

  // Calculate detection probability
  const detectionProbability = calculateDetectionProbability(
    distance,
    scanner.scanRadius,
    signature
  );

  // Random check based on probability
  return Math.random() < detectionProbability;
}
