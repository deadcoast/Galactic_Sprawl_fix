import { CombatUnit, FactionCombatUnit } from '../types/combat/CombatTypes';
import { FactionShipClass } from '../types/ships/FactionShipTypes';
import { FactionId } from '../types/ships/FactionTypes';
import {
  WeaponCategory,
  WeaponMount,
  WeaponStatus,
  WeaponSystem,
} from '../types/weapons/WeaponTypes';
import {
  WeaponSystemType,
  convertSystemTypeToWeaponCategory,
  convertWeaponCategoryToSystemType,
} from './weapons/weaponTypeConversions';

export function convertWeaponMountToSystem(mount: WeaponMount): WeaponSystem {
  if (!mount.currentWeapon) {
    return {
      id: mount.id,
      type: convertWeaponCategoryToSystemType(mount.allowedCategories[0] || 'machineGun'),
      damage: 0,
      range: 0,
      cooldown: 0,
      status: 'ready',
    };
  }

  const weapon = mount.currentWeapon;
  return {
    id: weapon.config.id,
    type: convertWeaponCategoryToSystemType(weapon.config.category),
    damage: weapon.state.currentStats.damage,
    range: weapon.state.currentStats.range,
    cooldown: weapon.state.currentStats.cooldown,
    status: weapon.state.status as 'ready' | 'charging' | 'cooling',
    upgrades: weapon.config.requirements?.tech.map(tech => ({
      name: tech,
      description: `Requires ${tech}`,
      unlocked: false,
    })),
  };
}

export function convertWeaponSystemToMount(weapon: WeaponSystem, index: number): WeaponMount {
  const category = convertSystemTypeToWeaponCategory(weapon.type as WeaponSystemType);
  return {
    id: `mount-${index}`,
    size: 'medium',
    position: index % 2 === 0 ? 'front' : 'side',
    rotation: 0,
    allowedCategories: [category],
    currentWeapon: {
      config: {
        id: weapon.id,
        name: weapon.type,
        category,
        tier: 1,
        baseStats: {
          damage: weapon.damage,
          range: weapon.range,
          cooldown: weapon.cooldown,
          accuracy: 0.8,
          rateOfFire: 1,
          energyCost: 1,
          effects: [],
        },
        visualAsset: `weapons/${weapon.type}.png`,
        mountRequirements: {
          size: 'medium',
          power: 1,
        },
        requirements: weapon.upgrades
          ? {
              tech: weapon.upgrades.map(upgrade => upgrade.name),
              resources: [],
            }
          : undefined,
      },
      state: {
        currentStats: {
          damage: weapon.damage,
          range: weapon.range,
          cooldown: weapon.cooldown,
          accuracy: 0.8,
          rateOfFire: 1,
          energyCost: 1,
          effects: [],
        },
        status: weapon.status,
        effects: [],
      },
    },
  };
}

export function convertToFactionCombatUnit(
  unit: CombatUnit,
  factionId: FactionId,
  shipClass: FactionShipClass,
): FactionCombatUnit {
  const weaponMounts = unit.weapons.map((weapon, index) =>
    convertWeaponSystemToMount(weapon, index),
  );
  const weaponSystems = weaponMounts.map(convertWeaponMountToSystem);

  // Get formation data with safe defaults
  interface FormationData {
    type?: string;
    spacing?: number;
    facing?: number;
  }
  const unitWithFormation = unit as CombatUnit & { formation?: FormationData };
  const formationType = unitWithFormation.formation?.type ?? 'balanced';
  const formationSpacing = unitWithFormation.formation?.spacing ?? 100;
  const formationFacing = unitWithFormation.formation?.facing ?? 0;

  return {
    ...unit,
    faction: factionId,
    class: shipClass,
    tactics: {
      formation: 'standard',
      behavior: 'balanced',
      target: undefined,
    },
    weaponMounts,
    weapons: weaponSystems,
    formation: {
      type: formationType as 'balanced' | 'offensive' | 'defensive',
      spacing: formationSpacing,
      facing: formationFacing,
      position: 0,
    },
    stats: {
      health: unit.stats?.health || 100,
      maxHealth: unit.stats?.maxHealth || 100,
      shield: unit.stats?.shield || 50,
      maxShield: unit.stats?.maxShield || 50,
      armor: unit.stats?.armor || 0,
      speed: unit.stats?.speed || 5,
      turnRate: unit.stats?.turnRate || 1,
      accuracy: 0.8,
      evasion: 0.2,
      criticalChance: 0.1,
      criticalDamage: 1.5,
      armorPenetration: 0,
      shieldPenetration: 0,
      experience: 0,
      level: 1,
    },
    status: {
      main: unit.status?.main || 'active',
      secondary: unit.status?.secondary,
      effects: unit.status?.effects || [],
    },
    experience: {
      current: 0,
      total: 0,
      level: 1,
      skills: [],
    },
  };
}

export function convertToBaseCombatUnit(unit: FactionCombatUnit): CombatUnit {
  return {
    id: unit.id,
    type: unit.type,
    position: unit.position,
    rotation: unit.rotation || 0,
    velocity: unit.velocity || { x: 0, y: 0 },
    status: unit.status,
    weapons: unit.weapons,
    stats: {
      health: unit.stats.health,
      maxHealth: unit.stats.maxHealth,
      shield: unit.stats.shield,
      maxShield: unit.stats.maxShield,
      armor: unit.stats.armor,
      speed: unit.stats.speed,
      turnRate: unit.stats.turnRate,
    },
  };
}

// Type guard functions
export function isFactionCombatUnit(
  unit: CombatUnit | FactionCombatUnit,
): unit is FactionCombatUnit {
  return 'class' in unit && 'tactics' in unit && 'weaponMounts' in unit;
}

export function isBaseCombatUnit(unit: CombatUnit | FactionCombatUnit): unit is CombatUnit {
  return !isFactionCombatUnit(unit);
}

/**
 * Converts a CombatUnit from combatManager.ts to a CombatUnit from CombatTypes.ts
 */
interface ManagerCombatUnit {
  id: string;
  type: string;
  position: { x: number; y: number };
  status?: string;
  health?: number;
  maxHealth?: number;
  shield?: number;
  maxShield?: number;
  armor?: number;
  speed?: number;
  turnRate?: number;
  weapons: ManagerWeapon[];
  faction?: string;
  tier?: number;
  target?: string;
}

interface ManagerWeapon {
  id: string;
  type: string;
  damage: number;
  cooldown: number;
  range: number;
  status?: string;
  lastFired?: number;
}

export function convertToCombatTypesUnit(
  unit: ManagerCombatUnit,
): import('../types/combat/CombatTypes').CombatUnit {
  // Create a CombatUnit that matches the interface in CombatTypes.ts
  return {
    id: unit.id,
    type: unit.type,
    position: unit.position,
    rotation: 0, // Default value if not present
    velocity: { x: 0, y: 0 }, // Default value if not present
    status: {
      main: convertStatusToMain(unit.status || 'active'),
      secondary: undefined,
      effects: [],
    },
    weapons: unit.weapons.map(w => ({
      id: w.id,
      type: convertToWeaponCategory(w.type),
      damage: w.damage,
      cooldown: w.cooldown,
      range: w.range,
      status: convertToWeaponStatus(w.status || 'ready'),
    })),
    stats: {
      health: unit.health || 0,
      maxHealth: unit.maxHealth || 0,
      shield: unit.shield || 0,
      maxShield: unit.maxShield || 0,
      armor: unit.armor || 0,
      speed: unit.speed || 0,
      turnRate: unit.turnRate || 0,
    },
  };
}

/**
 * Helper function to convert a string to a valid WeaponCategory
 */
function convertToWeaponCategory(type: string): WeaponCategory {
  const validCategories: WeaponCategory[] = [
    'machineGun',
    'gaussCannon',
    'railGun',
    'mgss',
    'rockets',
    'pointDefense',
    'flakCannon',
    'capitalLaser',
    'torpedoes',
    'harmonicCannon',
    'temporalCannon',
    'quantumCannon',
    'plasmaCannon',
    'beamWeapon',
    'pulseWeapon',
    'disruptor',
    'ionCannon',
  ];

  return validCategories.includes(type as WeaponCategory) ? (type as WeaponCategory) : 'machineGun'; // Default to machineGun if not a valid category
}

/**
 * Helper function to convert a string to a valid WeaponStatus
 */
function convertToWeaponStatus(status: string): WeaponStatus {
  const validStatuses: WeaponStatus[] = ['ready', 'charging', 'cooling', 'disabled'];

  return validStatuses.includes(status as WeaponStatus) ? (status as WeaponStatus) : 'ready'; // Default to ready if not a valid status
}

/**
 * Converts a status string from combatManager.ts to a main status in CombatTypes.ts
 */
function convertStatusToMain(status: string): 'active' | 'disabled' | 'destroyed' {
  if (status === 'disabled') {
    return 'disabled';
  }
  if (status === 'destroyed') {
    return 'destroyed';
  }
  return 'active'; // Default for all other statuses
}

/**
 * Converts a main status from CombatTypes.ts to a status string in combatManager.ts
 */
function convertMainToStatus(main: 'active' | 'disabled' | 'destroyed'): string {
  if (main === 'disabled') {
    return 'disabled';
  }
  if (main === 'destroyed') {
    return 'destroyed';
  }
  return 'idle'; // Default for 'active'
}

/**
 * Converts a CombatUnit from CombatTypes.ts to a CombatUnit from combatManager.ts
 */
export function convertToManagerUnit(
  unit: import('../types/combat/CombatTypes').CombatUnit,
): ManagerCombatUnit {
  // Create a CombatUnit that matches the interface in combatManager.ts
  return {
    id: unit.id,
    faction: 'unknown', // Default value if not present
    type: unit.type,
    tier: 1, // Default value if not present
    position: unit.position,
    status: convertMainToStatus(unit.status.main),
    health: unit.stats.health,
    maxHealth: unit.stats.maxHealth,
    shield: unit.stats.shield,
    maxShield: unit.stats.maxShield,
    target: undefined, // Default value if not present
    weapons: unit.weapons.map(w => {
      // Extract weapon properties safely
      const weaponId = w.id;
      const weaponType = w.type;
      const weaponRange = w.range || 0;
      const weaponDamage = w.damage;
      const weaponCooldown = w.cooldown;

      return {
        id: weaponId,
        type: weaponType,
        range: weaponRange,
        damage: weaponDamage,
        cooldown: weaponCooldown,
        status: w.status,
        lastFired: 0, // Default value
      };
    }),
  };
}
