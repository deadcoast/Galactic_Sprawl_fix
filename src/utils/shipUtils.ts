import { BaseStatus, Position, Velocity } from "../types/core/GameTypes";
import {
  Ship,
  ShipDisplayStats,
  ShipStats,
} from "../types/ships/CommonShipTypes";
import { WeaponCategory, WeaponInstance } from "../types/ships/WeaponTypes";

// Status Conversions
export function normalizeShipStatus(status: string): BaseStatus {
  const normalized = status.toLowerCase();
  if (normalized.includes("patrol")) {
    return "patrolling";
  }
  if (normalized.includes("engag")) {
    return "engaging";
  }
  if (normalized.includes("retreat")) {
    return "retreating";
  }
  if (normalized.includes("damag") || normalized.includes("critical")) {
    return "damaged";
  }
  if (normalized.includes("disabl")) {
    return "disabled";
  }
  return "idle";
}

// Stats Calculations
export function calculateCurrentStats(
  baseStats: ShipStats,
  modifiers: Partial<ShipStats> = {},
): ShipStats {
  return {
    ...baseStats,
    ...modifiers,
    health: Math.min(baseStats.maxHealth, modifiers.health ?? baseStats.health),
    shield: Math.min(baseStats.maxShield, modifiers.shield ?? baseStats.shield),
    energy: Math.min(baseStats.maxEnergy, modifiers.energy ?? baseStats.energy),
  };
}

// Movement Calculations
export function calculateNewPosition(
  currentPos: Position,
  velocity: Velocity,
  rotation: number,
  deltaTime: number,
): Position {
  return {
    x: currentPos.x + velocity.dx * deltaTime * Math.cos(rotation),
    y: currentPos.y + velocity.dy * deltaTime * Math.sin(rotation),
  };
}

// Weapon Type Conversions
export function normalizeWeaponCategory(category: string): WeaponCategory {
  const normalized = category.toLowerCase().replace(/[-_\s]/g, "");

  const categoryMap: Record<string, WeaponCategory> = {
    mg: "machineGun",
    machinegun: "machineGun",
    gauss: "gaussCannon",
    gausscannon: "gaussCannon",
    rail: "railGun",
    railgun: "railGun",
    mgss: "mgss",
    rocket: "rockets",
    rockets: "rockets",
    pointdefense: "pointDefense",
    flak: "flakCannon",
    flakcannon: "flakCannon",
    capital: "capitalLaser",
    capitallaser: "capitalLaser",
    torpedo: "torpedoes",
    torpedoes: "torpedoes",
  };

  return categoryMap[normalized] || "machineGun";
}

// Display Stats Conversion
export function getDisplayStats(ship: Ship): ShipDisplayStats {
  const { currentStats } = ship.state;

  return {
    hull: {
      current: currentStats.health,
      max: currentStats.maxHealth,
    },
    shield: {
      current: currentStats.shield,
      max: currentStats.maxShield,
    },
    armor: currentStats.armor,
    speed: currentStats.speed,
    energy: {
      current: currentStats.energy,
      max: currentStats.maxEnergy,
    },
  };
}

// Combat Utilities
export function canFireWeapon(
  weapon: WeaponInstance,
  shipEnergy: number,
): boolean {
  return (
    weapon.state.status === "ready" &&
    (!weapon.state.currentAmmo || weapon.state.currentAmmo > 0) &&
    shipEnergy >= weapon.config.baseStats.energyCost
  );
}

export function isInRange(
  source: Position,
  target: Position,
  range: number,
): boolean {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  return Math.sqrt(dx * dx + dy * dy) <= range;
}

// Damage Calculations
export function calculateDamage(
  baseDamage: number,
  accuracy: number,
  targetArmor: number,
  distance: number,
  maxRange: number,
): number {
  const distanceMultiplier = Math.max(0, 1 - distance / maxRange);
  const armorReduction = Math.max(0, 1 - targetArmor / 1000); // Armor reduces damage up to 100%
  const hit = Math.random() <= accuracy;

  if (!hit) {
    return 0;
  }

  return baseDamage * distanceMultiplier * armorReduction;
}
