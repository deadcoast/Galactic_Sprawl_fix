import { CombatUnit, CombatUnitStatus, FactionCombatUnit } from '../types/combat/CombatTypes';
import { FactionId, FactionBehaviorType } from '../types/ships/FactionTypes';
import { 
  WeaponMount, 
  WeaponSystem, 
  WeaponInstance, 
  WeaponConfig, 
  WeaponState, 
  WeaponStatus,
  WeaponCategory
} from '../types/weapons/WeaponTypes';
import { FactionShipClass } from '../types/ships/FactionShipTypes';
import { Position } from '../types/core/GameTypes';
import {
  WeaponSystemType,
  isWeaponSystemType,
  convertWeaponCategoryToSystemType,
  convertSystemTypeToWeaponCategory,
  isValidWeaponMount,
  isValidWeaponSystem
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
      unlocked: false
    }))
  };
}

export function convertWeaponSystemToMount(weapon: WeaponSystem, index: number): WeaponMount {
  const category = convertSystemTypeToWeaponCategory(weapon.type);
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
          effects: []
        },
        visualAsset: `weapons/${weapon.type}.png`,
        mountRequirements: {
          size: 'medium',
          power: 1
        },
        requirements: weapon.upgrades ? {
          tech: weapon.upgrades.map(upgrade => upgrade.name),
          resources: []
        } : undefined
      },
      state: {
        currentStats: {
          damage: weapon.damage,
          range: weapon.range,
          cooldown: weapon.cooldown,
          accuracy: 0.8,
          rateOfFire: 1,
          energyCost: 1,
          effects: []
        },
        status: weapon.status,
        effects: []
      }
    }
  };
}

export function convertToFactionCombatUnit(unit: CombatUnit, factionId: FactionId, shipClass: FactionShipClass): FactionCombatUnit {
  const weaponMounts = unit.weapons.map((weapon, index) => convertWeaponSystemToMount(weapon, index));
  const weaponSystems = weaponMounts.map(convertWeaponMountToSystem);
  
  return {
    ...unit,
    faction: factionId,
    class: shipClass,
    tactics: 'balance',
    weaponMounts,
    weapons: weaponSystems,
    formation: {
      type: unit.formation?.type ?? 'balanced',
      spacing: unit.formation?.spacing ?? 100,
      facing: unit.formation?.facing ?? 0,
      position: 0
    },
    stats: {
      accuracy: 0.8,
      evasion: 0.2,
      criticalChance: 0.1,
      criticalDamage: 1.5,
      armorPenetration: 0,
      shieldPenetration: 0
    },
    status: {
      main: unit.status,
      secondary: undefined,
      effects: []
    },
    experience: {
      level: 1,
      current: 0,
      next: 1000,
      bonuses: {}
    }
  };
}

export function convertToBaseCombatUnit(unit: FactionCombatUnit): CombatUnit {
  return {
    id: unit.id,
    type: unit.type,
    tier: unit.tier,
    position: unit.position,
    status: unit.status.main,
    health: unit.health,
    maxHealth: unit.maxHealth,
    shield: unit.shield,
    maxShield: unit.maxShield,
    target: unit.target,
    faction: unit.faction,
    weapons: unit.weapons,
    formation: unit.formation ? {
      type: unit.formation.type,
      spacing: unit.formation.spacing,
      facing: unit.formation.facing
    } : undefined
  };
}

// Type guard functions
export function isFactionCombatUnit(unit: CombatUnit | FactionCombatUnit): unit is FactionCombatUnit {
  return 'class' in unit && 'tactics' in unit && 'weaponMounts' in unit;
}

export function isBaseCombatUnit(unit: CombatUnit | FactionCombatUnit): unit is CombatUnit {
  return !isFactionCombatUnit(unit);
} 