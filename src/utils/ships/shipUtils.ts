import { BaseStatus, Position, Velocity } from '../../types/core/GameTypes';
import {
    CommonShip as Ship,
    CommonShipDisplayStats as ShipDisplayStats,
    CommonShipStats as ShipStats
} from '../../types/ships/CommonShipTypes';
import { Ship as ShipUnion } from '../../types/ships/ShipTypes';
import { WeaponCategory, WeaponInstance, WeaponState } from '../../types/weapons/WeaponTypes';

// Status Conversions
export function normalizeShipStatus(status: string): BaseStatus {
  const normalized = status.toLowerCase();
  if (normalized.includes('patrol')) {
    return 'patrolling';
  }
  if (normalized.includes('engag')) {
    return 'engaging';
  }
  if (normalized.includes('retreat')) {
    return 'retreating';
  }
  if (normalized.includes('damag') || normalized.includes('critical')) {
    return 'damaged';
  }
  if (normalized.includes('disabl')) {
    return 'disabled';
  }
  return 'idle';
}

// Stats Calculations
export function calculateCurrentStats(
  baseStats: ShipStats,
  modifiers: Partial<ShipStats> = {}
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
  deltaTime: number
): Position {
  return {
    x: currentPos.x + velocity.dx * deltaTime * Math.cos(rotation),
    y: currentPos.y + velocity.dy * deltaTime * Math.sin(rotation),
  };
}

// Weapon Type Conversions
export function normalizeWeaponCategory(category: string): WeaponCategory {
  const normalized = category.toLowerCase().replace(/[-_\s]/g, '');

  const categoryMap: Record<string, WeaponCategory> = {
    mg: 'machineGun',
    machinegun: 'machineGun',
    gauss: 'gaussCannon',
    gausscannon: 'gaussCannon',
    rail: 'railGun',
    railgun: 'railGun',
    mgss: 'mgss',
    rocket: 'rockets',
    rockets: 'rockets',
    pointdefense: 'pointDefense',
    flak: 'flakCannon',
    flakcannon: 'flakCannon',
    capital: 'capitalLaser',
    capitallaser: 'capitalLaser',
    torpedo: 'torpedoes',
    torpedoes: 'torpedoes',
  };

  return categoryMap[normalized] || 'machineGun';
}

// Display Stats Conversion
export function getDisplayStats(ship: Ship): ShipDisplayStats {
  const { stats } = ship;

  return {
    weapons: {
      damage: stats.weapons.reduce(
        (total, mount) => total + (mount.currentWeapon?.config.baseStats.damage ?? 0),
        0
      ),
      range:
        stats.weapons.filter(mount => mount.currentWeapon).length > 0
          ? stats.weapons.reduce(
              (total, mount) => total + (mount.currentWeapon?.config.baseStats.range ?? 0),
              0
            ) / stats.weapons.filter(mount => mount.currentWeapon).length
          : 0,
      accuracy:
        stats.weapons.filter(mount => mount.currentWeapon).length > 0
          ? stats.weapons.reduce(
              (total, mount) => total + (mount.currentWeapon?.config.baseStats.accuracy ?? 0),
              0
            ) / stats.weapons.filter(mount => mount.currentWeapon).length
          : 0,
    },
    defense: {
      hull: stats.health,
      shield: stats.defense.shield,
      armor: stats.defense.armor,
    },
    mobility: {
      speed: stats.mobility.speed,
      agility: stats.mobility.turnRate,
      jumpRange: 0, // TODO: Implement jump range calculation
    },
    systems: {
      power: stats.energy,
      radar: 0, // TODO: Implement radar system
      efficiency: 0, // TODO: Implement efficiency calculation
    },
  };
}

// Combat Utilities
export function canFireWeapon(weapon: WeaponInstance, shipEnergy: number): boolean {
  // Check if the weapon has ammo constraints
  const hasAmmo = (weapon.state as WeaponState & { currentAmmo?: number }).currentAmmo;

  return (
    weapon.state.status === 'ready' &&
    (hasAmmo === undefined || hasAmmo > 0) &&
    shipEnergy >= weapon.config.baseStats.energyCost
  );
}

export function isInRange(source: Position, target: Position, range: number): boolean {
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
  maxRange: number
): number {
  const distanceMultiplier = Math.max(0, 1 - distance / maxRange);
  const armorReduction = Math.max(0, 1 - targetArmor / 1000); // Armor reduces damage up to 100%
  const hit = Math.random() <= accuracy;

  if (!hit) {
    return 0;
  }

  return baseDamage * distanceMultiplier * armorReduction;
}

// --- Cargo Calculation ---

// Interface for resource item within cargo
interface CargoResource {
  amount?: number;
}

/**
 * Calculates the total amount of resources currently held in a ship's cargo.
 * @param ship The ship object (can be any type from the Ship union or null).
 * @returns The total cargo amount used, or 0 if no cargo/resources.
 */
export function calculateTotalCargoUsed(ship: ShipUnion | null): number {
  // Use optional chaining as suggested by lint
  if (!Array.isArray(ship?.cargo?.resources)) {
    return 0;
  }

  // Directly use ship.cargo.resources, known to be an array here
  // Cast explicitly within reduce to ensure correct type inference for 'resource'
  return (ship?.cargo.resources as CargoResource[]).reduce(
    (total: number, resource: CargoResource) => {
      // Explicitly check if amount is a number before adding
      const amount = resource?.amount;
      return total + (typeof amount === 'number' ? amount : 0);
    },
    0 // Ensure initial value is 0
  );
}
