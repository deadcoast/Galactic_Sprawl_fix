import { FactionShipClass, FactionShipStats } from '../../types/ships/FactionShipTypes';
import {
  WeaponMount,
  WeaponMountSize,
  WeaponMountPosition,
  WeaponStatus,
  WeaponInstance,
} from '../../types/weapons/WeaponTypes';
import { FactionId } from '../../types/ships/FactionTypes';
import {
  PLASMA_EFFECT,
  GAUSS_EFFECT,
  EXPLOSIVE_EFFECT,
  DAMAGE_BOOST_EFFECT,
  SHIELD_FIELD_EFFECT,
  SPEED_BOOST_EFFECT,
  STEALTH_EFFECT,
  SPEED_REDUCTION_EFFECT,
} from '../../effects/types_effects/shipEffects';
import { EQUATOR_HORIZON_SHIPS } from './equatorHorizonShips';

// Base template for unimplemented ships
const BASE_SHIP_TEMPLATE: FactionShipStats = {
  health: 1000,
  maxHealth: 1000,
  shield: 500,
  maxShield: 500,
  energy: 500,
  maxEnergy: 500,
  speed: 100,
  turnRate: 2,
  cargo: 200,
  tier: 1,
  faction: 'space-rats' as FactionId,
  weapons: [],
  defense: {
    armor: 300,
    shield: 500,
    evasion: 0.3,
    regeneration: 5,
  },
  mobility: {
    speed: 100,
    turnRate: 2,
    acceleration: 50,
  },
  abilities: [],
};

// Create temporary implementations for missing ships
const SPACE_RATS_REMAINING = {
  ratsRevenge: { ...BASE_SHIP_TEMPLATE },
  darkSectorCorsair: { ...BASE_SHIP_TEMPLATE },
  wailingWreck: { ...BASE_SHIP_TEMPLATE },
  galacticScourge: { ...BASE_SHIP_TEMPLATE },
  plasmaFang: { ...BASE_SHIP_TEMPLATE },
  verminVanguard: { ...BASE_SHIP_TEMPLATE },
  blackVoidBuccaneer: { ...BASE_SHIP_TEMPLATE },
};

const LOST_NOVA_SHIPS = {
  eclipseScythe: { ...BASE_SHIP_TEMPLATE, faction: 'lost-nova' as FactionId },
  nullsRevenge: { ...BASE_SHIP_TEMPLATE, faction: 'lost-nova' as FactionId },
  darkMatterReaper: { ...BASE_SHIP_TEMPLATE, faction: 'lost-nova' as FactionId },
  quantumPariah: { ...BASE_SHIP_TEMPLATE, faction: 'lost-nova' as FactionId },
  entropyScale: { ...BASE_SHIP_TEMPLATE, faction: 'lost-nova' as FactionId },
  voidRevenant: { ...BASE_SHIP_TEMPLATE, faction: 'lost-nova' as FactionId },
  scytheOfAndromeda: { ...BASE_SHIP_TEMPLATE, faction: 'lost-nova' as FactionId },
  nebularPersistence: { ...BASE_SHIP_TEMPLATE, faction: 'lost-nova' as FactionId },
  oblivionsWake: { ...BASE_SHIP_TEMPLATE, faction: 'lost-nova' as FactionId },
  forbiddenVanguard: { ...BASE_SHIP_TEMPLATE, faction: 'lost-nova' as FactionId },
};

export const SHIP_STATS: Record<FactionShipClass, FactionShipStats> = {
  // Space Rats ships
  ratKing: {
    health: 1000,
    maxHealth: 1000,
    shield: 500,
    maxShield: 500,
    energy: 500,
    maxEnergy: 500,
    speed: 100,
    turnRate: 2,
    cargo: 200,
    tier: 3,
    faction: 'space-rats' as FactionId,
    weapons: [
      {
        id: 'mgss-1',
        size: 'medium' as WeaponMountSize,
        position: 'front' as WeaponMountPosition,
        rotation: 0,
        allowedCategories: ['mgss'],
        currentWeapon: {
          config: {
            id: 'mgss-cannon',
            name: 'MGSS Cannon',
            category: 'mgss',
            tier: 2,
            baseStats: {
              damage: 35,
              range: 600,
              accuracy: 0.8,
              rateOfFire: 8,
              energyCost: 5,
              cooldown: 0.2,
              effects: [PLASMA_EFFECT],
            },
            visualAsset: 'weapons/mgss/basic',
            mountRequirements: {
              size: 'medium' as WeaponMountSize,
              power: 20,
            },
          },
          state: {
            status: 'ready' as WeaponStatus,
            currentStats: {
              damage: 35,
              range: 600,
              accuracy: 0.8,
              rateOfFire: 8,
              energyCost: 5,
              cooldown: 0.2,
              effects: [PLASMA_EFFECT],
            },
            effects: [PLASMA_EFFECT],
          },
        } as WeaponInstance,
      },
    ],
    defense: {
      armor: 300,
      shield: 500,
      evasion: 0.3,
      regeneration: 5,
    },
    mobility: {
      speed: 100,
      turnRate: 2,
      acceleration: 50,
    },
    abilities: [
      {
        name: "Pirate's Fury",
        description: 'Increases weapon damage for a short duration',
        cooldown: 30,
        duration: 10,
        active: false,
        effect: DAMAGE_BOOST_EFFECT,
      },
    ],
  },
  asteroidMarauder: {
    health: 600,
    maxHealth: 600,
    shield: 300,
    maxShield: 300,
    energy: 400,
    maxEnergy: 400,
    speed: 120,
    turnRate: 3,
    cargo: 150,
    tier: 2,
    faction: 'space-rats' as FactionId,
    weapons: [
      {
        id: 'mg-1',
        size: 'small' as WeaponMountSize,
        position: 'front' as WeaponMountPosition,
        rotation: 0,
        allowedCategories: ['machineGun'],
        currentWeapon: {
          config: {
            id: 'basic-mg',
            name: 'Basic Machine Gun',
            category: 'machineGun',
            tier: 1,
            baseStats: {
              damage: 30,
              range: 600,
              accuracy: 0.8,
              rateOfFire: 8,
              energyCost: 2,
              cooldown: 0.2,
              effects: [GAUSS_EFFECT],
            },
            visualAsset: 'weapons/machinegun/basic',
            mountRequirements: {
              size: 'small' as WeaponMountSize,
              power: 10,
            },
          },
          state: {
            status: 'ready' as WeaponStatus,
            currentStats: {
              damage: 30,
              range: 600,
              accuracy: 0.8,
              rateOfFire: 8,
              energyCost: 2,
              cooldown: 0.2,
              effects: [GAUSS_EFFECT],
            },
            effects: [GAUSS_EFFECT],
          },
        } as WeaponInstance,
      },
    ],
    defense: {
      armor: 200,
      shield: 300,
      evasion: 0.4,
      regeneration: 3,
    },
    mobility: {
      speed: 120,
      turnRate: 3,
      acceleration: 60,
    },
    abilities: [
      {
        name: 'Scavenger Boost',
        description: 'Temporarily increases movement speed',
        cooldown: 15,
        duration: 5,
        active: false,
        effect: SPEED_BOOST_EFFECT,
      },
    ],
  },
  rogueNebula: {
    health: 500,
    maxHealth: 500,
    shield: 400,
    maxShield: 400,
    energy: 450,
    maxEnergy: 450,
    speed: 150,
    turnRate: 3.5,
    cargo: 150,
    tier: 2,
    faction: 'space-rats' as FactionId,
    weapons: [
      {
        id: 'railgun-1',
        size: 'medium' as WeaponMountSize,
        position: 'front' as WeaponMountPosition,
        rotation: 0,
        allowedCategories: ['railGun'],
        currentWeapon: {
          config: {
            id: 'advanced-railgun',
            name: 'Advanced Railgun',
            category: 'railGun',
            tier: 2,
            baseStats: {
              damage: 200,
              range: 1100,
              accuracy: 0.85,
              rateOfFire: 5,
              energyCost: 8,
              cooldown: 0.3,
              effects: [GAUSS_EFFECT],
            },
            visualAsset: 'weapons/railgun/advanced',
            mountRequirements: {
              size: 'medium' as WeaponMountSize,
              power: 25,
            },
          },
          state: {
            status: 'ready' as WeaponStatus,
            currentStats: {
              damage: 200,
              range: 1100,
              accuracy: 0.85,
              rateOfFire: 5,
              energyCost: 8,
              cooldown: 0.3,
              effects: [GAUSS_EFFECT],
            },
            effects: [GAUSS_EFFECT],
          },
        } as WeaponInstance,
      },
    ],
    defense: {
      armor: 150,
      shield: 400,
      evasion: 0.4,
      regeneration: 4,
    },
    mobility: {
      speed: 150,
      turnRate: 3.5,
      acceleration: 65,
    },
    abilities: [
      {
        name: 'Stealth Drive',
        description: 'Temporarily becomes stealthier',
        cooldown: 25,
        duration: 8,
        active: false,
        effect: STEALTH_EFFECT,
      },
    ],
  },
  ...SPACE_RATS_REMAINING,
  ...LOST_NOVA_SHIPS,
  ...EQUATOR_HORIZON_SHIPS,
};

export function getShipStats(shipClass: FactionShipClass): FactionShipStats {
  const stats = SHIP_STATS[shipClass];
  if (!stats) {
    throw new Error(`No stats found for ship class: ${shipClass}`);
  }
  return stats;
}
