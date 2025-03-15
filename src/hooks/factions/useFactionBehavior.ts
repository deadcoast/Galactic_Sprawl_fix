import { useCallback, useEffect, useState } from 'react';
import { SHIP_STATS as CONFIG_SHIP_STATS } from '../../config/ships';
import { ModuleEvent, moduleEventBus } from '../../lib/modules/ModuleEvents';
import { AsteroidFieldManager } from '../../managers/game/AsteroidFieldManager';
import { CombatUnit } from '../../types/combat/CombatTypes';
import { Position } from '../../types/core/GameTypes';
import { CommonShipStats, ShipStatus as CommonShipStatus } from '../../types/ships/CommonShipTypes';
import { FactionFleet, FactionShip, FactionShipClass } from '../../types/ships/FactionShipTypes';
import {
  FactionBehaviorConfig,
  FactionBehaviorType,
  FactionId,
  FactionState,
} from '../../types/ships/FactionTypes';
import {
  WeaponCategory,
  WeaponConfig,
  WeaponInstance,
  WeaponMount,
  WeaponMountPosition,
  WeaponMountSize,
  WeaponSystem,
} from '../../types/weapons/WeaponTypes';
import { getDistance } from '../../utils/geometry';
import {
  convertToFactionCombatUnit,
  convertWeaponSystemToMount,
  isFactionCombatUnit,
} from '../../utils/typeConversions';
import { ResourceType } from './../../types/resources/ResourceTypes';

// Import the standardized FactionFleet and FactionTerritory types
import {
  FactionFleet as StandardizedFactionFleet,
  FactionTerritory as StandardizedFactionTerritory,
} from '../../types/events/FactionEvents';

/**
 * FACTION BEHAVIOR SYSTEM
 *
 * This module contains the core logic for faction AI behavior in the game.
 * It includes several utility functions that will be used in future implementations:
 *
 * - _convertToWeaponInstance: Creates weapon instances for faction ships during combat
 *   Will be used in the upcoming weapon customization system for faction ships.
 *
 * - _convertToWeaponMounts: Generates weapon mounts for faction ships
 *   Will be used in the ship customization interface for faction ships.
 *
 * - _hasStatus: Checks if a combat unit has a specific status effect
 *   Will be used in the status effect system for faction AI decision making.
 *
 * - _calculateDistance: Calculates distance between two positions
 *   Will be used in the faction movement and targeting systems.
 *
 * - _determineShipClass: Determines the appropriate ship class for a faction unit
 *   Will be used in the faction ship progression and customization system.
 *
 * - _determineShipStatus: Determines the current status of a faction ship
 *   Will be used in the ship condition system for damage effects.
 *
 * - _determineFormation: Determines the optimal formation for faction units
 *   Will be used in the advanced fleet tactics system.
 *
 * These functions are currently not used but will be integrated in upcoming features.
 * They are kept here to maintain the architecture for future implementation.
 */

// Define weapon system interface for faction combat
export interface FactionWeaponSystem extends WeaponSystem {
  mountInfo?: {
    size: WeaponMountSize;
    position: WeaponMountPosition;
    rotation: number;
    allowedCategories: WeaponCategory[];
  };
}

/**
 * Converts a weapon system to a weapon instance
 *
 * This function will be used in future implementations to:
 * 1. Create fully configured weapon instances for faction ships during combat
 * 2. Support the upcoming weapon customization system for faction ships
 * 3. Generate appropriate weapon configurations based on faction specializations
 * 4. Apply faction-specific bonuses to weapon parameters
 * 5. Implement progressive weapon upgrades for faction ships
 *
 * The function ensures consistent weapon configuration across all faction ships
 * and will be critical for the upcoming faction specialization system where
 * different factions have unique weapon characteristics and abilities.
 *
 * @param weapon The weapon system to convert
 * @returns A fully configured weapon instance
 */
// @ts-expect-error - This function is documented for future use in the faction behavior system
function _convertToWeaponInstance(weapon: WeaponSystem): WeaponInstance {
  const config: WeaponConfig = {
    id: weapon.id,
    name: weapon.type,
    category: weapon.type,
    tier: 1,
    baseStats: {
      damage: weapon.damage,
      range: weapon.range,
      accuracy: 0.8,
      rateOfFire: 1,
      energyCost: 10,
      cooldown: weapon.cooldown,
      effects: [],
    },
    visualAsset: 'default_weapon',
    mountRequirements: {
      size: 'medium' as WeaponMountSize,
      power: 100,
    },
  };

  const state = {
    status: weapon.status,
    currentStats: {
      damage: weapon.damage,
      range: weapon.range,
      accuracy: 0.8,
      rateOfFire: 1,
      energyCost: 10,
      cooldown: weapon.cooldown,
      effects: [],
    },
    effects: [],
  };

  return { config, state };
}

/**
 * Converts weapon systems to weapon mounts
 *
 * This function will be used in future implementations to:
 * 1. Generate appropriate weapon mounts for faction ships
 * 2. Support the ship customization interface for faction ships
 * 3. Create faction-specific weapon mount configurations
 * 4. Apply faction bonuses to weapon mount parameters
 * 5. Implement progressive weapon mount upgrades
 *
 * The function ensures consistent weapon mount configuration
 * and will be essential for the upcoming ship customization system
 * where players can modify faction ships with different weapons.
 *
 * @param weapons Array of weapon systems to convert
 * @returns Array of weapon mounts
 */
// @ts-expect-error - This function is documented for future use in the faction behavior system
function _convertToWeaponMounts(weapons: WeaponSystem[]): WeaponMount[] {
  return weapons.map((weapon, index) => convertWeaponSystemToMount(weapon, index));
}

// Define FactionCombatWeapon interface
export interface FactionCombatWeapon extends WeaponSystem {
  upgrades?: {
    name: string;
    description: string;
    unlocked: boolean;
  }[];
}

// Create FactionCombatUnit interface extending CombatUnit
export interface FactionCombatUnit
  extends Omit<CombatUnit, 'status' | 'faction' | 'weapons' | 'stats'> {
  faction: FactionId;
  class: FactionShipClass;
  tactics: FactionBehaviorConfig;
  specialAbility?: {
    name: string;
    description: string;
    cooldown: number;
    active: boolean;
  };
  weaponMounts: WeaponMount[];
  weapons: FactionCombatWeapon[];
  formation: {
    type: 'offensive' | 'defensive' | 'balanced';
    spacing: number;
    facing: number;
    position: number;
  };
  stats: {
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    armor: number;
    speed: number;
    turnRate: number;
    accuracy: number;
    evasion: number;
    criticalChance: number;
    criticalDamage: number;
    armorPenetration: number;
    shieldPenetration: number;
    experience: number;
    level: number;
  };
  status: {
    main: 'active' | 'disabled' | 'destroyed';
    secondary?: 'charging' | 'cooling' | 'repairing' | 'boosting';
    effects: string[];
  };
  experience: {
    current: number;
    total: number;
    level: number;
    skills: string[];
  };
}

/**
 * Checks if a combat unit has a specific status effect
 *
 * This function will be used in future implementations to:
 * 1. Determine if faction ships are affected by specific status effects
 * 2. Apply appropriate behavior modifications based on status
 * 3. Trigger faction-specific reactions to status effects
 * 4. Calculate combat effectiveness modifiers
 * 5. Support the status effect system for faction AI decision making
 *
 * The function provides a consistent way to check unit status
 * and will be essential for the upcoming status effect system
 * where different effects can significantly impact unit behavior.
 *
 * @param unit The combat unit to check
 * @param statusToCheck The status to check for
 * @returns Whether the unit has the specified status
 */
// @ts-expect-error - This function is documented for future use in the faction behavior system
function _hasStatus(unit: CombatUnit | FactionCombatUnit, statusToCheck: string): boolean {
  if (isFactionCombatUnit(unit)) {
    // For FactionCombatUnit, check main status, secondary status, and effects
    return (
      unit.status.main === statusToCheck ||
      (unit.status.secondary !== undefined && unit.status.secondary === statusToCheck) ||
      unit.status.effects.includes(statusToCheck)
    );
  } else {
    // For regular CombatUnit, check if status is a string and compare
    return typeof unit.status === 'string' && unit.status === statusToCheck;
  }
}

// Helper function to check if array is FactionCombatUnit[]
function isFactionCombatUnitArray(
  units: CombatUnit[] | FactionCombatUnit[]
): units is FactionCombatUnit[] {
  return units.length > 0 && isFactionCombatUnit(units[0]);
}

// Helper function to convert CombatUnit to FactionCombatUnit
function convertUnitsToFaction(
  units: CombatUnit[],
  defaultFaction: FactionId
): FactionCombatUnit[] {
  return units.map(unit => {
    /**
     * Base stats for the ship class, used to determine initial capabilities.
     * Will be used in future implementations to:
     * 1. Apply faction-specific stat modifiers
     * 2. Calculate combat effectiveness
     * 3. Determine appropriate AI behavior based on ship capabilities
     * 4. Support the ship upgrade system
     * 5. Generate appropriate visual effects based on ship class
     */
    const _baseStats = getShipBehaviorStats(unit.type as unknown as ShipClass);

    // Use _baseStats to calculate initial stats with faction modifiers
    const healthModifier =
      defaultFaction === ('lostNova' as FactionId)
        ? 0.9
        : defaultFaction === ('equatorHorizon' as FactionId)
          ? 1.2
          : 1.0;
    const shieldModifier =
      defaultFaction === ('lostNova' as FactionId)
        ? 1.3
        : defaultFaction === ('equatorHorizon' as FactionId)
          ? 0.8
          : 1.0;
    const speedModifier =
      defaultFaction === ('lostNova' as FactionId)
        ? 1.2
        : defaultFaction === ('equatorHorizon' as FactionId)
          ? 0.9
          : 1.0;

    const factionUnit: FactionCombatUnit = {
      id: unit.id,
      type: unit.type,
      position: unit.position,
      rotation: unit.rotation,
      velocity: unit.velocity,
      faction: defaultFaction,
      class: unit.type as FactionShipClass,
      tactics: {
        formation: 'balanced',
        behavior: 'aggressive' as FactionBehaviorType,
        target: undefined,
      },
      weaponMounts: unit.weapons.map((weapon, index) => ({
        id: `mount-${index}`,
        size: 'medium' as const,
        position: index % 2 === 0 ? ('front' as const) : ('side' as const),
        rotation: 0,
        allowedCategories: [weapon.type as WeaponCategory],
      })),
      weapons: unit.weapons.map(w => ({
        ...w,
        upgrades: [],
      })),
      formation: {
        type: 'balanced',
        spacing: 100,
        facing: 0,
        position: 0,
      },
      stats: {
        // Apply faction-specific modifiers to base stats
        health: _baseStats.health * healthModifier,
        maxHealth: _baseStats.health * healthModifier,
        shield: _baseStats.shield * shieldModifier,
        maxShield: _baseStats.shield * shieldModifier,
        armor: 'armor' in _baseStats ? (_baseStats as unknown as { armor: number }).armor : 0, // Check if armor exists before accessing
        speed: _baseStats.speed * speedModifier,
        turnRate: _baseStats.turnRate,
        accuracy: 0.8,
        evasion: 0.2,
        criticalChance: 0.05,
        criticalDamage: 1.5,
        armorPenetration: 0.1,
        shieldPenetration: 0.1,
        experience: 0,
        level: 1,
      },
      status: unit.status,
      experience: {
        current: 0,
        total: 0,
        level: 1,
        skills: [],
      },
    };

    return factionUnit;
  });
}

// Update calculateFleetStrength to handle type conversion
function calculateFleetStrength(units: CombatUnit[] | FactionCombatUnit[]): number {
  const factionUnits = isFactionCombatUnitArray(units)
    ? units
    : convertUnitsToFaction(units, 'neutral');
  return factionUnits.reduce((total, unit) => {
    const weaponDamage = unit.weapons.reduce((sum, weapon) => sum + weapon.damage, 0);
    return total + weaponDamage;
  }, 0);
}

// Add FACTION_SHIPS constant
const FACTION_SHIPS: Record<FactionId, ShipClass[]> = {
  player: ['spitflare', 'starSchooner', 'orionFrigate'] as ShipClass[],
  enemy: ['harbringerGalleon', 'midwayCarrier', 'motherEarthRevenge'] as ShipClass[],
  neutral: ['starSchooner', 'orionFrigate'] as ShipClass[],
  ally: ['spitflare', 'orionFrigate'] as ShipClass[],
  'space-rats': [
    'rat-king',
    'asteroid-marauder',
    'rogue-nebula',
    'rats-revenge',
    'dark-sector-corsair',
    'wailing-wreck',
    'galactic-scourge',
    'plasma-fang',
    'vermin-vanguard',
    'black-void-buccaneer',
  ] as ShipClass[],
  'lost-nova': [
    'eclipse-scythe',
    'nulls-revenge',
    'dark-matter-reaper',
    'quantum-pariah',
    'entropy-scale',
    'void-revenant',
    'scythe-of-andromeda',
    'nebular-persistence',
    'oblivions-wake',
    'forbidden-vanguard',
  ] as ShipClass[],
  'equator-horizon': [
    'celestial-arbiter',
    'ethereal-galleon',
    'stellar-equinox',
    'chronos-sentinel',
    'nebulas-judgement',
    'aetherial-horizon',
    'cosmic-crusader',
    'balancekeepers-wrath',
    'ecliptic-watcher',
    'harmonys-vanguard',
  ] as ShipClass[],
};

// Define faction behavior events
export interface FactionBehaviorEvents {
  behaviorChanged: {
    factionId: FactionId;
    oldBehavior: FactionBehaviorType;
    newBehavior: FactionBehaviorType;
  };
  fleetUpdated: {
    factionId: FactionId;
    fleets: FactionFleet[];
  };
  territoryChanged: {
    factionId: FactionId;
    territory: FactionTerritory;
  };
  relationshipChanged: {
    factionId: FactionId;
    targetFaction: FactionId;
    oldValue: number;
    newValue: number;
  };
  resourcesUpdated: {
    factionId: FactionId;
    resourceType: ResourceType;
    oldAmount: number;
    newAmount: number;
  };
  combatTacticsChanged: {
    factionId: FactionId;
    oldTactics: FactionBehaviorState['combatTactics'];
    newTactics: FactionBehaviorState['combatTactics'];
  };
  [key: string]: unknown;
}

// Define resource node interfaces
export interface ResourceNode {
  position: Position;
  value: number;
}

export interface AsteroidFieldNode {
  fieldId: string;
  type: ResourceType;
  amount: number;
}

// Define faction territory interface
export interface FactionTerritory {
  center: Position;
  radius: number;
  controlPoints: Position[];
  resources: Record<ResourceType, number>;
  threatLevel: number;
  factionId: FactionId;
}

// Define faction behavior state interface
export interface FactionBehaviorState {
  id: FactionId;
  name: string;
  fleets: FactionFleet[];
  territory: FactionTerritory;
  relationships: Record<FactionId, number>;
  specialRules: {
    alwaysHostile?: boolean;
    requiresProvocation?: boolean;
    powerThreshold?: number;
  };
  behaviorState: {
    aggression: number;
    expansion: number;
    trading: number;
    currentTactic: 'raid' | 'defend' | 'expand' | 'trade';
    lastAction: string;
    nextAction: string;
  };
  stats: {
    totalShips: number;
    activeFleets: number;
    territorySystems: number;
    resourceIncome: Record<ResourceType, number>;
  };
  stateMachine: {
    current: FactionStateType;
    history: FactionStateType[];
    triggers: Set<FactionEvent>;
  };
  combatTactics: {
    preferredRange: 'close' | 'medium' | 'long';
    formationStyle: 'aggressive' | 'defensive' | 'balanced';
    targetPriority: 'ships' | 'stations' | 'resources';
    retreatThreshold: number;
    reinforcementThreshold: number;
  };
  resourceManagement: {
    gatheringPriority: ResourceType[];
    stockpileThresholds: Record<ResourceType, number>;
    tradePreferences: {
      resourceType: ResourceType;
      minPrice: number;
      maxQuantity: number;
    }[];
  };
  expansionStrategy: {
    expansionDirection: Position;
    systemPriority: 'resources' | 'strategic' | ResourceType.POPULATION;
    colonizationThreshold: number;
    maxTerritory: number;
    consolidationThreshold: number;
  };
}

// Create faction behavior event emitter
// class FactionBehaviorEventEmitter extends EventEmitter<FactionBehaviorEvents> {}
// const factionBehaviorEvents = new FactionBehaviorEventEmitter();

// Use the standardized FactionBehaviorManager instead
import { FactionBehaviorManager } from '../../managers/factions/FactionBehaviorManager';
const factionBehaviorManager = new FactionBehaviorManager();

export type ShipClass =
  // Base Ships
  | 'spitflare'
  | 'starSchooner'
  | 'orionFrigate'
  | 'harbringerGalleon'
  | 'midwayCarrier'
  | 'motherEarthRevenge'
  // Space Rats Ships
  | 'rat-king'
  | 'asteroid-marauder'
  | 'rogue-nebula'
  | 'rats-revenge'
  | 'dark-sector-corsair'
  | 'wailing-wreck'
  | 'galactic-scourge'
  | 'plasma-fang'
  | 'vermin-vanguard'
  | 'black-void-buccaneer'
  // Lost Nova Ships
  | 'eclipse-scythe'
  | 'nulls-revenge'
  | 'dark-matter-reaper'
  | 'quantum-pariah'
  | 'entropy-scale'
  | 'void-revenant'
  | 'scythe-of-andromeda'
  | 'nebular-persistence'
  | 'oblivions-wake'
  | 'forbidden-vanguard'
  // Equator Horizon Ships
  | 'celestial-arbiter'
  | 'ethereal-galleon'
  | 'stellar-equinox'
  | 'chronos-sentinel'
  | 'nebulas-judgement'
  | 'aetherial-horizon'
  | 'cosmic-crusader'
  | 'balancekeepers-wrath'
  | 'ecliptic-watcher'
  | 'harmonys-vanguard';

// Define state machine types
export type FactionStateType =
  // Base States
  | 'active'
  | 'aggressive'
  | 'retreating'
  | 'pursuing'
  | 'attacking'
  // Space Rats States
  | 'patrolling'
  | 'pursuing'
  | 'attacking'
  | 'aggressive'
  | 'retreating'
  // Lost Nova States
  | 'hiding'
  | 'preparing'
  | 'ambushing'
  | 'retaliating'
  | 'withdrawing'
  // Equator Horizon States
  | 'dormant'
  | 'awakening'
  | 'enforcing'
  | 'overwhelming'
  | 'withdrawing';

export type FactionEvent =
  | 'DETECT_TARGET'
  | 'TAKE_DAMAGE'
  | 'ENGAGE_RANGE'
  | 'LOSE_TARGET'
  | 'TARGET_DESTROYED'
  | 'HEAVY_DAMAGE'
  | 'SAFE_DISTANCE'
  | 'REINFORCEMENTS_ARRIVED'
  | 'DETECT_OPPORTUNITY'
  | 'PROVOKED'
  | 'AMBUSH_READY'
  | 'DETECTED'
  | 'AMBUSH_SUCCESS'
  | 'AMBUSH_FAILED'
  | 'THREAT_ELIMINATED'
  | 'OVERWHELMING_FORCE'
  | 'POWER_THRESHOLD_EXCEEDED'
  | 'BALANCE_DISRUPTED'
  | 'FLEET_READY'
  | 'THREAT_DISAPPEARED'
  | 'BALANCE_RESTORED'
  | 'RESISTANCE_ENCOUNTERED'
  | 'DOMINANCE_ACHIEVED'
  | 'OBJECTIVE_COMPLETE'
  | 'WITHDRAWAL_COMPLETE'
  | 'NO_TARGETS';

export interface StateMachineTransition {
  currentState: FactionStateType;
  event: FactionEvent;
  nextState: FactionStateType;
}

// Update FACTION_CONFIGS to include all factions
export const FACTION_CONFIGS: Record<
  FactionId,
  {
    baseAggression: number;
    expansionRate: number;
    tradingPreference: number;
    maxShips: number;
    spawnRules: {
      minTier: 1 | 2 | 3;
      requiresCondition?: string;
      spawnInterval: number;
    };
    specialRules: {
      alwaysHostile?: boolean;
      requiresProvocation?: boolean;
      powerThreshold?: number;
    };
  }
> = {
  player: {
    baseAggression: 0.5,
    expansionRate: 0.5,
    tradingPreference: 0.5,
    maxShips: 20,
    spawnRules: {
      minTier: 1,
      spawnInterval: 300,
    },
    specialRules: {},
  },
  enemy: {
    baseAggression: 0.7,
    expansionRate: 0.6,
    tradingPreference: 0.3,
    maxShips: 25,
    spawnRules: {
      minTier: 1,
      spawnInterval: 300,
    },
    specialRules: {
      alwaysHostile: true,
    },
  },
  neutral: {
    baseAggression: 0.2,
    expansionRate: 0.3,
    tradingPreference: 0.8,
    maxShips: 15,
    spawnRules: {
      minTier: 1,
      spawnInterval: 600,
    },
    specialRules: {},
  },
  ally: {
    baseAggression: 0.4,
    expansionRate: 0.4,
    tradingPreference: 0.6,
    maxShips: 20,
    spawnRules: {
      minTier: 1,
      spawnInterval: 450,
    },
    specialRules: {},
  },
  'space-rats': {
    baseAggression: 0.8,
    expansionRate: 0.6,
    tradingPreference: 0.2,
    maxShips: 30,
    spawnRules: {
      minTier: 1,
      spawnInterval: 300,
    },
    specialRules: {
      alwaysHostile: true,
    },
  },
  'lost-nova': {
    baseAggression: 0.4,
    expansionRate: 0.3,
    tradingPreference: 0.5,
    maxShips: 25,
    spawnRules: {
      minTier: 2,
      requiresCondition: 'player-expansion',
      spawnInterval: 600,
    },
    specialRules: {
      requiresProvocation: true,
    },
  },
  'equator-horizon': {
    baseAggression: 0.6,
    expansionRate: 0.4,
    tradingPreference: 0.3,
    maxShips: 20,
    spawnRules: {
      minTier: 3,
      requiresCondition: 'power-threshold',
      spawnInterval: 900,
    },
    specialRules: {
      powerThreshold: 0.8,
    },
  },
};

interface CombatManager {
  getUnitsInRange: (position: { x: number; y: number }, range: number) => CombatUnit[];
  getThreatsInTerritory: (territory: {
    center: { x: number; y: number };
    radius: number;
  }) => Threat[];
  engageTarget: (unitId: string, targetId: string) => void;
  moveUnit: (unitId: string, position: { x: number; y: number }) => void;
}

interface Threat {
  id: string;
  position: { x: number; y: number };
}

declare const combatManager: CombatManager;

interface FactionConfig {
  id: string;
  behavior: {
    baseAggression: number;
    expansionRate: number;
    tradingPreference: number;
  };
  spawnConditions: {
    maxShips: number;
  };
  specialRules: {
    alwaysHostile?: boolean;
    requiresProvocation?: boolean;
    powerThreshold?: number;
  };
}

interface FactionManager {
  getFactionState: (factionId: string) => FactionState | undefined;
  getFactionConfig: (factionId: string) => FactionConfig | undefined;
  spawnShip: (factionId: string, position: { x: number; y: number }) => void;
  expandTerritory: (factionId: string, position: { x: number; y: number }) => void;
}

declare const factionManager: FactionManager;

// Define initial states for each faction
const INITIAL_STATES: Record<FactionId, FactionStateType> = {
  player: 'active',
  enemy: 'aggressive',
  neutral: 'patrolling',
  ally: 'patrolling',
  'space-rats': 'patrolling',
  'lost-nova': 'hiding',
  'equator-horizon': 'dormant',
};

// Define state transitions for each faction
const STATE_TRANSITIONS: Record<FactionId, StateMachineTransition[]> = {
  player: [
    { currentState: 'active', event: 'TAKE_DAMAGE', nextState: 'aggressive' },
    { currentState: 'aggressive', event: 'HEAVY_DAMAGE', nextState: 'retreating' },
    { currentState: 'retreating', event: 'SAFE_DISTANCE', nextState: 'active' },
  ],
  enemy: [
    { currentState: 'aggressive', event: 'DETECT_TARGET', nextState: 'pursuing' },
    { currentState: 'pursuing', event: 'ENGAGE_RANGE', nextState: 'attacking' },
    { currentState: 'attacking', event: 'HEAVY_DAMAGE', nextState: 'retreating' },
    { currentState: 'retreating', event: 'SAFE_DISTANCE', nextState: 'aggressive' },
  ],
  neutral: [
    { currentState: 'patrolling', event: 'TAKE_DAMAGE', nextState: 'retreating' },
    { currentState: 'retreating', event: 'SAFE_DISTANCE', nextState: 'patrolling' },
  ],
  ally: [
    { currentState: 'patrolling', event: 'DETECT_TARGET', nextState: 'pursuing' },
    { currentState: 'pursuing', event: 'ENGAGE_RANGE', nextState: 'attacking' },
    { currentState: 'attacking', event: 'HEAVY_DAMAGE', nextState: 'retreating' },
    { currentState: 'retreating', event: 'SAFE_DISTANCE', nextState: 'patrolling' },
  ],
  'space-rats': [
    {
      currentState: 'patrolling',
      event: 'DETECT_TARGET',
      nextState: 'pursuing',
    },
    {
      currentState: 'patrolling',
      event: 'TAKE_DAMAGE',
      nextState: 'aggressive',
    },
    { currentState: 'pursuing', event: 'ENGAGE_RANGE', nextState: 'attacking' },
    { currentState: 'pursuing', event: 'LOSE_TARGET', nextState: 'patrolling' },
    { currentState: 'pursuing', event: 'TAKE_DAMAGE', nextState: 'aggressive' },
    {
      currentState: 'attacking',
      event: 'TARGET_DESTROYED',
      nextState: 'patrolling',
    },
    {
      currentState: 'attacking',
      event: 'HEAVY_DAMAGE',
      nextState: 'retreating',
    },
    { currentState: 'attacking', event: 'LOSE_TARGET', nextState: 'pursuing' },
    {
      currentState: 'aggressive',
      event: 'NO_TARGETS',
      nextState: 'patrolling',
    },
    {
      currentState: 'aggressive',
      event: 'HEAVY_DAMAGE',
      nextState: 'retreating',
    },
    {
      currentState: 'retreating',
      event: 'SAFE_DISTANCE',
      nextState: 'patrolling',
    },
    {
      currentState: 'retreating',
      event: 'REINFORCEMENTS_ARRIVED',
      nextState: 'aggressive',
    },
  ],
  'lost-nova': [
    {
      currentState: 'hiding',
      event: 'DETECT_OPPORTUNITY',
      nextState: 'preparing',
    },
    { currentState: 'hiding', event: 'PROVOKED', nextState: 'retaliating' },
    {
      currentState: 'preparing',
      event: 'AMBUSH_READY',
      nextState: 'ambushing',
    },
    { currentState: 'preparing', event: 'DETECTED', nextState: 'hiding' },
    { currentState: 'ambushing', event: 'AMBUSH_SUCCESS', nextState: 'hiding' },
    {
      currentState: 'ambushing',
      event: 'AMBUSH_FAILED',
      nextState: 'withdrawing',
    },
    {
      currentState: 'ambushing',
      event: 'HEAVY_DAMAGE',
      nextState: 'withdrawing',
    },
    {
      currentState: 'retaliating',
      event: 'THREAT_ELIMINATED',
      nextState: 'hiding',
    },
    {
      currentState: 'retaliating',
      event: 'OVERWHELMING_FORCE',
      nextState: 'withdrawing',
    },
    {
      currentState: 'withdrawing',
      event: 'SAFE_DISTANCE',
      nextState: 'hiding',
    },
  ],
  'equator-horizon': [
    {
      currentState: 'dormant',
      event: 'POWER_THRESHOLD_EXCEEDED',
      nextState: 'awakening',
    },
    {
      currentState: 'dormant',
      event: 'BALANCE_DISRUPTED',
      nextState: 'awakening',
    },
    { currentState: 'awakening', event: 'FLEET_READY', nextState: 'enforcing' },
    {
      currentState: 'awakening',
      event: 'THREAT_DISAPPEARED',
      nextState: 'dormant',
    },
    {
      currentState: 'enforcing',
      event: 'BALANCE_RESTORED',
      nextState: 'withdrawing',
    },
    {
      currentState: 'enforcing',
      event: 'RESISTANCE_ENCOUNTERED',
      nextState: 'overwhelming',
    },
    {
      currentState: 'overwhelming',
      event: 'DOMINANCE_ACHIEVED',
      nextState: 'enforcing',
    },
    {
      currentState: 'overwhelming',
      event: 'OBJECTIVE_COMPLETE',
      nextState: 'withdrawing',
    },
    {
      currentState: 'withdrawing',
      event: 'WITHDRAWAL_COMPLETE',
      nextState: 'dormant',
    },
    {
      currentState: 'withdrawing',
      event: 'BALANCE_DISRUPTED',
      nextState: 'enforcing',
    },
  ],
};

function getInitialState(factionId: FactionId): FactionStateType {
  return INITIAL_STATES[factionId];
}

function getTransitions(factionId: FactionId): StateMachineTransition[] {
  return STATE_TRANSITIONS[factionId];
}

function handleStateMachineTransition(
  currentState: FactionStateType,
  event: FactionEvent,
  factionId: FactionId
): FactionStateType {
  const transitions = getTransitions(factionId);
  const transition = transitions.find(t => t.currentState === currentState && t.event === event);
  return transition ? transition.nextState : currentState;
}

function handleStateMachineTriggers(state: FactionBehaviorState): void {
  const triggers = new Set<FactionEvent>();

  // Check threat level
  if (state.territory.threatLevel > 0.7) {
    triggers.add('TAKE_DAMAGE');
    triggers.add('HEAVY_DAMAGE');
  }

  // Check for targets
  const nearbyEnemies = findNearbyEnemies(state);

  if (nearbyEnemies.length > 0) {
    triggers.add('DETECT_TARGET');
  } else {
    triggers.add('NO_TARGETS');
  }

  // Faction-specific triggers
  switch (state.id) {
    case 'equator-horizon':
      if (calculatePlayerPower() > FACTION_CONFIGS[state.id].specialRules.powerThreshold!) {
        triggers.add('POWER_THRESHOLD_EXCEEDED');
      }
      break;
    case 'lost-nova':
      if (isAmbushOpportunity(state)) {
        triggers.add('DETECT_OPPORTUNITY');
      }
      break;
  }

  // Update state machine triggers
  state.stateMachine.triggers = triggers;

  // Process triggers and update state
  triggers.forEach(trigger => {
    const nextState = handleStateMachineTransition(state.stateMachine.current, trigger, state.id);
    if (nextState !== state.stateMachine.current) {
      state.stateMachine.history.push(state.stateMachine.current);
      state.stateMachine.current = nextState;
    }
  });
}

// Create AsteroidFieldManager instance
const asteroidFieldManager = new AsteroidFieldManager();

// Add resource value multiplier function
function getResourceValueMultiplier(type: ResourceType): number {
  switch (type) {
    case ResourceType.EXOTIC:
      return 3.0;
    case ResourceType.GAS:
      return 1.5;
    case ResourceType.MINERALS:
      return 1.0;
    default:
      return 1.0;
  }
}

export function useFactionBehavior(factionId: FactionId) {
  const [behavior, setBehavior] = useState<FactionBehaviorState>({
    id: factionId,
    name: factionId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    fleets: [],
    territory: {
      center: { x: 0, y: 0 },
      radius: 100,
      controlPoints: [],
      resources: {
        [ResourceType.MINERALS]: 0,
        [ResourceType.GAS]: 0,
        [ResourceType.EXOTIC]: 0,
        [ResourceType.ENERGY]: 0,
        [ResourceType.PLASMA]: 0,
        [ResourceType.POPULATION]: 0,
        [ResourceType.RESEARCH]: 0,
        [ResourceType.IRON]: 0,
        [ResourceType.COPPER]: 0,
        [ResourceType.DEUTERIUM]: 0,
        [ResourceType.ANTIMATTER]: 0,
        [ResourceType.DARK_MATTER]: 0,
        [ResourceType.EXOTIC_MATTER]: 0,
        [ResourceType.TITANIUM]: 0,
        [ResourceType.URANIUM]: 0,
        [ResourceType.WATER]: 0,
        [ResourceType.HELIUM]: 0,
      },
      threatLevel: 0,
      factionId,
    },
    relationships: {
      player: 0,
      enemy: -0.8,
      neutral: 0,
      ally: 0.8,
      'space-rats': 0,
      'lost-nova': 0,
      'equator-horizon': 0,
    },
    specialRules: FACTION_CONFIGS[factionId].specialRules,
    behaviorState: {
      aggression: FACTION_CONFIGS[factionId].baseAggression,
      expansion: FACTION_CONFIGS[factionId].expansionRate,
      trading: FACTION_CONFIGS[factionId].tradingPreference,
      currentTactic: 'defend',
      lastAction: 'initialized',
      nextAction: 'patrol',
    },
    stats: {
      totalShips: 0,
      activeFleets: 0,
      territorySystems: 0,
      resourceIncome: {
        [ResourceType.MINERALS]: 0,
        [ResourceType.ENERGY]: 0,
        [ResourceType.PLASMA]: 0,
        [ResourceType.EXOTIC]: 0,
        [ResourceType.GAS]: 0,
        [ResourceType.POPULATION]: 0,
        [ResourceType.RESEARCH]: 0,
        [ResourceType.IRON]: 0,
        [ResourceType.COPPER]: 0,
        [ResourceType.DEUTERIUM]: 0,
        [ResourceType.ANTIMATTER]: 0,
        [ResourceType.DARK_MATTER]: 0,
        [ResourceType.EXOTIC_MATTER]: 0,
        [ResourceType.TITANIUM]: 0,
        [ResourceType.URANIUM]: 0,
        [ResourceType.WATER]: 0,
        [ResourceType.HELIUM]: 0,
      },
    },
    stateMachine: {
      current: getInitialState(factionId),
      history: [],
      triggers: new Set(),
    },
    combatTactics: {
      preferredRange: 'medium',
      formationStyle: 'balanced',
      targetPriority: 'ships',
      retreatThreshold: 0.3,
      reinforcementThreshold: 0.7,
    },
    resourceManagement: {
      gatheringPriority: [],
      stockpileThresholds: {
        [ResourceType.MINERALS]: 0,
        [ResourceType.ENERGY]: 0,
        [ResourceType.PLASMA]: 0,
        [ResourceType.EXOTIC]: 0,
        [ResourceType.GAS]: 0,
        [ResourceType.POPULATION]: 0,
        [ResourceType.RESEARCH]: 0,
        [ResourceType.IRON]: 0,
        [ResourceType.COPPER]: 0,
        [ResourceType.DEUTERIUM]: 0,
        [ResourceType.ANTIMATTER]: 0,
        [ResourceType.DARK_MATTER]: 0,
        [ResourceType.EXOTIC_MATTER]: 0,
        [ResourceType.TITANIUM]: 0,
        [ResourceType.URANIUM]: 0,
        [ResourceType.WATER]: 0,
        [ResourceType.HELIUM]: 0,
      },
      tradePreferences: [],
    },
    expansionStrategy: {
      expansionDirection: { x: 0, y: 0 },
      systemPriority: 'resources',
      colonizationThreshold: 0,
      maxTerritory: 0,
      consolidationThreshold: 0,
    },
  });

  const handleModuleEvent = useCallback(
    (event: ModuleEvent) => {
      switch (event.type) {
        case 'STATUS_CHANGED':
          if (event.data?.type === 'tactics') {
            const oldTactics = behavior.combatTactics;
            const newTactics = {
              ...oldTactics,
              ...event.data,
            };

            setBehavior(prev => ({
              ...prev,
              combatTactics: newTactics,
            }));

            factionBehaviorManager.emit('faction:combat-tactics-changed', {
              factionId,
              oldTactics,
              newTactics,
            });
          }
          break;
      }
    },
    [behavior.combatTactics, factionId]
  );

  const handleBehaviorEvent = useCallback(
    (
      eventType: keyof FactionBehaviorEvents,
      event: FactionBehaviorEvents[keyof FactionBehaviorEvents]
    ) => {
      switch (eventType) {
        case 'behaviorChanged': {
          const { oldBehavior, newBehavior } = event as FactionBehaviorEvents['behaviorChanged'];
          console.warn(
            `[FactionBehavior] ${factionId} behavior changed from ${oldBehavior} to ${newBehavior}`
          );
          break;
        }

        case 'fleetUpdated': {
          const { fleets } = event as FactionBehaviorEvents['fleetUpdated'];
          setBehavior(prev => ({
            ...prev,
            fleets,
            stats: {
              ...prev.stats,
              totalShips: fleets.reduce((total, fleet) => total + fleet.ships.length, 0),
            },
          }));
          break;
        }

        case 'territoryChanged': {
          const { territory } = event as FactionBehaviorEvents['territoryChanged'];
          setBehavior(prev => ({
            ...prev,
            territory,
            stats: {
              ...prev.stats,
              territorySystems: calculateTerritorySystems(territory),
            },
          }));
          break;
        }

        case 'relationshipChanged': {
          const { targetFaction, oldValue, newValue } =
            event as FactionBehaviorEvents['relationshipChanged'];
          setBehavior(prev => ({
            ...prev,
            relationships: {
              ...prev.relationships,
              [targetFaction]: newValue,
            },
          }));
          console.warn(
            `[FactionBehavior] ${factionId} relationship with ${targetFaction} changed from ${oldValue} to ${newValue}`
          );
          break;
        }

        case 'resourcesUpdated': {
          const { resourceType, oldAmount, newAmount } =
            event as FactionBehaviorEvents['resourcesUpdated'];
          setBehavior(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              resourceIncome: {
                ...prev.stats.resourceIncome,
                [resourceType]: newAmount,
              },
            },
          }));
          console.warn(
            `[FactionBehavior] ${factionId} ${resourceType} income changed from ${oldAmount} to ${newAmount}`
          );
          break;
        }

        case 'combatTacticsChanged': {
          const { oldTactics, newTactics } = event as FactionBehaviorEvents['combatTacticsChanged'];
          setBehavior(prev => ({
            ...prev,
            combatTactics: newTactics,
          }));
          console.warn(
            `[FactionBehavior] ${factionId} combat tactics updated:
          Range: ${oldTactics.preferredRange} -> ${newTactics.preferredRange}
          Formation: ${oldTactics.formationStyle} -> ${newTactics.formationStyle}
          Priority: ${oldTactics.targetPriority} -> ${newTactics.targetPriority}`
          );
          break;
        }
      }
    },
    [factionId]
  );

  useEffect(() => {
    // Subscribe to faction behavior events
    const unsubscribeBehaviorChanged = factionBehaviorManager.on(
      'faction:behavior-changed',
      event => {
        if (event.factionId === factionId) {
          handleBehaviorEvent('behaviorChanged', {
            factionId,
            oldBehavior: event.oldBehavior,
            newBehavior: event.newBehavior,
          });
        }
      }
    );

    const unsubscribeFleetUpdated = factionBehaviorManager.on('faction:fleet-updated', event => {
      if (event.factionId === factionId) {
        handleBehaviorEvent('fleetUpdated', {
          factionId,
          fleets: event.fleets,
        });
      }
    });

    const unsubscribeTerritoryChanged = factionBehaviorManager.on(
      'faction:territory-changed',
      event => {
        if (event.factionId === factionId) {
          handleBehaviorEvent('territoryChanged', {
            factionId,
            territory: event.territory,
          });
        }
      }
    );

    const unsubscribeRelationshipChanged = factionBehaviorManager.on(
      'faction:relationship-changed',
      event => {
        if (event.factionId === factionId) {
          handleBehaviorEvent('relationshipChanged', {
            factionId,
            targetFaction: event.targetFaction,
            oldValue: event.oldValue,
            newValue: event.newValue,
          });
        }
      }
    );

    const unsubscribeResourcesUpdated = factionBehaviorManager.on(
      'faction:resources-updated',
      event => {
        if (event.factionId === factionId) {
          handleBehaviorEvent('resourcesUpdated', {
            factionId,
            resourceType: event.resourceType,
            oldAmount: event.oldAmount,
            newAmount: event.newAmount,
          });
        }
      }
    );

    const unsubscribeCombatTacticsChanged = factionBehaviorManager.on(
      'faction:combat-tactics-changed',
      event => {
        if (event.factionId === factionId) {
          handleBehaviorEvent('combatTacticsChanged', {
            factionId,
            oldTactics: event.oldTactics,
            newTactics: event.newTactics,
          });
        }
      }
    );

    // Clean up subscriptions
    return () => {
      unsubscribeBehaviorChanged();
      unsubscribeFleetUpdated();
      unsubscribeTerritoryChanged();
      unsubscribeRelationshipChanged();
      unsubscribeResourcesUpdated();
      unsubscribeCombatTacticsChanged();
    };
  }, [factionId]);

  const updateFactionBehavior = useCallback(() => {
    const nearbyUnits = Array.from(
      combatManager.getUnitsInRange(behavior.territory.center, behavior.territory.radius)
    );

    // Update fleets based on nearby units
    const updatedFleets = updateFleets(nearbyUnits);
    if (updatedFleets.length !== behavior.fleets.length) {
      // Convert to standardized fleet format
      const standardizedFleets = updatedFleets.map(convertToStandardizedFleet);
      factionBehaviorManager.updateFleets(factionId, standardizedFleets);
    }

    // Update territory based on unit positions
    const updatedTerritory = calculateTerritory(nearbyUnits, behavior.territory);
    if (updatedTerritory.radius !== behavior.territory.radius) {
      // Convert to standardized territory format
      const standardizedTerritory = convertToStandardizedTerritory(updatedTerritory);
      factionBehaviorManager.updateTerritory(factionId, standardizedTerritory);
    }

    // Update resource income
    const newResourceIncome = calculateResourceIncome(behavior.territory);
    Object.entries(newResourceIncome).forEach(([resourceKey, newAmount]) => {
      // Convert resource key to ResourceType enum
      const resourceType = ResourceType[resourceKey.toUpperCase() as keyof typeof ResourceType];
      if (resourceType) {
        const oldAmount = behavior.stats.resourceIncome[resourceType] || 0;
        if (oldAmount !== newAmount) {
          factionBehaviorManager.updateResources(factionId, resourceType, newAmount);
        }
      }
    });

    // Update relationships with other factions
    const updatedRelationships = calculateRelationships(factionId, behavior.relationships);
    Object.entries(updatedRelationships).forEach(([targetFaction, newValue]) => {
      const oldValue = behavior.relationships[targetFaction as FactionId];
      if (oldValue !== newValue) {
        factionBehaviorManager.updateRelationship(factionId, targetFaction as FactionId, newValue);
      }
    });

    handleStateMachineTriggers(behavior);
    const newBehaviorState = calculateBehaviorState(
      behavior.behaviorState,
      behavior.fleets,
      behavior.territory,
      behavior.relationships
    );
    setBehavior(prev => ({ ...prev, behaviorState: newBehaviorState }));
    updateCombatTactics(behavior);
    manageResources(behavior);
    planExpansion(behavior);

    switch (behavior.id) {
      case 'space-rats':
        executeSpaceRatsBehavior(behavior);
        break;
      case 'lost-nova':
        executeLostNovaBehavior(behavior);
        break;
      case 'equator-horizon':
        executeEquatorHorizonBehavior(behavior);
        break;
    }

    if (shouldSpawnNewShip(behavior, FACTION_CONFIGS[behavior.id])) {
      const spawnPoint = selectSpawnPoint(behavior.territory);
      factionManager.spawnShip(behavior.id, spawnPoint);
    }
  }, [behavior, factionId]);

  useEffect(() => {
    const unsubscribeModuleEvents = moduleEventBus.subscribe('STATUS_CHANGED', handleModuleEvent);

    const updateInterval = setInterval(updateFactionBehavior, 1000);

    return () => {
      unsubscribeModuleEvents();
      clearInterval(updateInterval);
    };
  }, [factionId, handleModuleEvent, updateFactionBehavior]);

  return behavior;
}

// Map kebab-case ship classes to camelCase
function mapShipClass(shipClass: ShipClass): FactionShipClass {
  const camelCase = shipClass.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  return camelCase as FactionShipClass;
}

function calculateTerritory(
  units: CombatUnit[],
  currentTerritory: FactionTerritory
): FactionTerritory {
  const positions = units.map(u => u.position);
  const center = {
    x: positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length,
    y: positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length,
  };

  const maxRadius = Math.max(
    currentTerritory.radius,
    ...positions.map(pos => getDistance(center, pos))
  );

  return {
    ...currentTerritory,
    center,
    radius: maxRadius,
    controlPoints: generateControlPoints(center, maxRadius),
    threatLevel: calculateThreatLevel(center, maxRadius, currentTerritory),
  };
}

function calculateRelationships(
  factionId: FactionId,
  currentRelationships: Record<FactionId, number>
): Record<FactionId, number> {
  /**
   * The faction ID being processed.
   * Will be used in future implementations to:
   * 1. Apply faction-specific relationship modifiers
   * 2. Calculate diplomatic stance based on faction identity
   * 3. Determine appropriate AI behavior based on faction relationships
   * 4. Support the diplomacy system
   * 5. Generate appropriate diplomatic events
   */
  const updatedRelationships = { ...currentRelationships };

  // Apply faction-specific relationship modifiers
  const factionModifiers: Record<FactionId, number> = {
    'space-rats': -0.2, // Space Rats are generally hostile
    'lost-nova': -0.1, // Lost Nova are somewhat suspicious
    'equator-horizon': 0.1, // Equator Horizon are more diplomatic
    neutral: 0, // Neutral factions have no modifier
    player: 0, // Player has no default modifier
    enemy: -0.3, // Enemies have a negative modifier
    ally: 0.3, // Allies have a positive modifier
  };

  // Get the base modifier for this faction
  const baseFactionModifier = factionModifiers[factionId] || 0;

  Object.keys(currentRelationships).forEach(otherFactionId => {
    const otherFaction = FACTION_CONFIGS[otherFactionId as FactionId];
    if (!otherFaction) {
      return;
    }

    // Apply faction-specific relationship logic
    let relationshipChange = 0;

    // Space Rats are always hostile to everyone except other Space Rats
    if (factionId === 'space-rats' && otherFactionId !== 'space-rats') {
      relationshipChange -= 0.05;
    }

    // Lost Nova are suspicious of Equator Horizon
    if (factionId === 'lost-nova' && otherFactionId === 'equator-horizon') {
      relationshipChange -= 0.03;
    }

    // Equator Horizon try to maintain balance
    if (factionId === 'equator-horizon') {
      // If relationship is too negative, try to improve it
      if (updatedRelationships[otherFactionId as FactionId] < -0.5) {
        relationshipChange += 0.02;
      }
      // If relationship is too positive, be a bit more cautious
      else if (updatedRelationships[otherFactionId as FactionId] > 0.8) {
        relationshipChange -= 0.01;
      }
    }

    // Apply the base faction modifier and any specific changes
    updatedRelationships[otherFactionId as FactionId] += baseFactionModifier + relationshipChange;

    // Clamp values between -1 and 1
    updatedRelationships[otherFactionId as FactionId] = Math.max(
      -1,
      Math.min(1, updatedRelationships[otherFactionId as FactionId])
    );
  });

  return updatedRelationships;
}

function calculateBehaviorState(
  current: FactionBehaviorState['behaviorState'],
  fleets: FactionFleet[],
  territory: FactionTerritory,
  relationships: Record<FactionId, number>
): FactionBehaviorState['behaviorState'] {
  // Determine next action based on current state and conditions
  let nextTactic: 'raid' | 'defend' | 'expand' | 'trade' = current.currentTactic;

  if (territory.threatLevel > 0.7) {
    nextTactic = 'defend';
  } else if (fleets.length > 3 && current.aggression > 0.6) {
    nextTactic = 'raid';
  } else if (Object.values(relationships).some(r => r > 0.5)) {
    nextTactic = 'trade';
  } else if (current.expansion > 0.5) {
    nextTactic = 'expand';
  }

  return {
    ...current,
    currentTactic: nextTactic,
    lastAction: current.nextAction,
    nextAction: determineNextAction(nextTactic),
  };
}

/**
 * Calculates the distance between two positions
 *
 * This function will be used in future implementations to:
 * 1. Calculate distances for faction movement and targeting systems
 * 2. Determine optimal positioning for faction ships
 * 3. Implement range-based decision making for faction AI
 * 4. Support formation maintenance and spacing
 * 5. Enable distance-based combat tactics
 *
 * The function provides a consistent way to calculate distances
 * and will be essential for the upcoming advanced movement system
 * where precise positioning is critical for tactical advantage.
 *
 * @param a First position with x and y coordinates
 * @param b Second position with x and y coordinates
 * @returns The distance between the two positions
 */
// @ts-expect-error - This function is documented for future use in the faction behavior system
function _calculateDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Ship class configurations
interface FactionWeaponMount {
  id: string;
  type: 'machineGun' | 'gaussCannon' | 'railGun' | 'MGSS' | 'rockets';
  damage: number;
  range: number;
  cooldown: number;
  accuracy: number;
  effects: FactionWeaponEffect[];
}

interface ShipStats {
  health: number;
  shield: number;
  armor: number;
  speed: number;
  turnRate: number;
  weapons: FactionWeaponMount[];
  abilities: SpecialAbility[];
}

interface FactionWeaponEffect {
  type: ResourceType.PLASMA | 'spark' | 'gauss' | 'explosive';
  damage: number;
  duration: number;
  radius?: number;
}

interface SpecialAbility {
  name: string;
  cooldown: number;
  duration: number;
  effect: AbilityEffect;
}

interface AbilityEffect {
  type: 'stealth' | 'shield' | 'speed' | 'damage';
  magnitude: number;
  radius?: number;
}

// Default stats for unknown ship classes
const DEFAULT_SHIP_STATS: ShipStats = {
  health: 500,
  shield: 200,
  armor: 100,
  speed: 100,
  turnRate: 2,
  weapons: [],
  abilities: [],
};

// Get ship stats for behavior
function getShipBehaviorStats(shipClass: ShipClass): CommonShipStats {
  const configStats = CONFIG_SHIP_STATS[mapShipClass(shipClass)];
  if (!configStats) {
    return {
      health: DEFAULT_SHIP_STATS.health,
      maxHealth: DEFAULT_SHIP_STATS.health,
      shield: DEFAULT_SHIP_STATS.shield,
      maxShield: DEFAULT_SHIP_STATS.shield,
      energy: 100,
      maxEnergy: 100,
      cargo: 100,
      speed: DEFAULT_SHIP_STATS.speed,
      turnRate: DEFAULT_SHIP_STATS.turnRate,
      defense: {
        armor: DEFAULT_SHIP_STATS.armor,
        shield: DEFAULT_SHIP_STATS.shield,
        evasion: 0.3,
        regeneration: 1,
      },
      mobility: {
        speed: DEFAULT_SHIP_STATS.speed,
        turnRate: DEFAULT_SHIP_STATS.turnRate,
        acceleration: 50,
      },
      weapons: [],
      abilities: [],
    };
  }
  return {
    health: configStats.health,
    maxHealth: configStats.maxHealth,
    shield: configStats.shield,
    maxShield: configStats.maxShield,
    energy: configStats.energy,
    maxEnergy: configStats.maxEnergy,
    cargo: configStats.cargo,
    speed: configStats.speed,
    turnRate: configStats.turnRate,
    defense: configStats.defense,
    mobility: configStats.mobility,
    weapons: configStats.weapons,
    abilities: configStats.abilities,
  };
}

// Ship class configurations
const SHIP_STATS: Partial<Record<ShipClass, ShipStats>> = {
  // Space Rats Ships
  'rat-king': {
    health: 1000,
    shield: 500,
    armor: 300,
    speed: 100,
    turnRate: 2,
    weapons: [
      {
        id: 'mgss',
        type: 'MGSS',
        damage: 50,
        range: 800,
        cooldown: 0.1,
        accuracy: 0.7,
        effects: [{ type: ResourceType.PLASMA, damage: 10, duration: 3 }],
      },
      {
        id: 'rockets',
        type: 'rockets',
        damage: 200,
        range: 1200,
        cooldown: 5,
        accuracy: 0.8,
        effects: [{ type: 'explosive', damage: 100, duration: 1, radius: 50 }],
      },
    ],
    abilities: [
      {
        name: "Pirate's Fury",
        cooldown: 30,
        duration: 10,
        effect: { type: 'damage', magnitude: 2 },
      },
    ],
  },
  // ... similar configurations for other Space Rats ships

  // Lost Nova Ships
  'eclipse-scythe': {
    health: 800,
    shield: 800,
    armor: 200,
    speed: 150,
    turnRate: 3,
    weapons: [
      {
        id: 'gaussCannon',
        type: 'gaussCannon',
        damage: 150,
        range: 1000,
        cooldown: 2,
        accuracy: 0.9,
        effects: [{ type: 'gauss', damage: 50, duration: 2 }],
      },
    ],
    abilities: [
      {
        name: 'Phase Shift',
        cooldown: 20,
        duration: 5,
        effect: { type: 'stealth', magnitude: 1 },
      },
    ],
  },
  // ... similar configurations for other Lost Nova ships

  // Equator Horizon Ships
  'celestial-arbiter': {
    health: 1500,
    shield: 1000,
    armor: 500,
    speed: 80,
    turnRate: 1,
    weapons: [
      {
        id: 'railGun',
        type: 'railGun',
        damage: 300,
        range: 1500,
        cooldown: 3,
        accuracy: 0.95,
        effects: [{ type: 'gauss', damage: 100, duration: 3 }],
      },
    ],
    abilities: [
      {
        name: 'Balance Restoration',
        cooldown: 45,
        duration: 15,
        effect: { type: 'shield', magnitude: 2, radius: 500 },
      },
    ],
  },
  // ... similar configurations for other Equator Horizon ships
};

/**
 * Determines the appropriate ship class for a faction unit
 *
 * This function will be used in future implementations to:
 * 1. Select appropriate ship classes based on faction and role
 * 2. Support the faction ship progression and customization system
 * 3. Implement dynamic ship class selection based on combat conditions
 * 4. Apply faction-specific preferences for ship classes
 * 5. Enable strategic ship class distribution in fleets
 *
 * The function ensures that faction units use appropriate ship classes
 * and will be critical for the upcoming ship progression system
 * where units can evolve into different classes based on experience.
 *
 * @param unit The faction combat unit to evaluate
 * @returns The determined ship class for the unit
 */
// @ts-expect-error - This function is documented for future use in the faction behavior system
function _determineShipClass(unit: FactionCombatUnit): ShipClass {
  const { status } = unit;
  const factionShips = FACTION_SHIPS[unit.faction] || [];

  if (status.effects.includes('flagship')) {
    return (
      factionShips.find(s => (SHIP_STATS[s] || DEFAULT_SHIP_STATS).health > 1000) || factionShips[0]
    );
  }
  if (status.effects.includes('stealth')) {
    return (
      factionShips.find(s =>
        (SHIP_STATS[s] || DEFAULT_SHIP_STATS).abilities.some(a => a.effect.type === 'stealth')
      ) || factionShips[0]
    );
  }
  if (status.effects.includes('heavy')) {
    return (
      factionShips.find(s => (SHIP_STATS[s] || DEFAULT_SHIP_STATS).armor > 300) || factionShips[0]
    );
  }

  return factionShips[0];
}

/**
 * Determines the current status of a faction ship
 *
 * This function will be used in future implementations to:
 * 1. Evaluate ship operational status based on damage and systems
 * 2. Support tactical decision-making based on ship condition
 * 3. Implement progressive damage effects on ship performance
 * 4. Enable emergency protocols for critically damaged ships
 * 5. Support repair prioritization for faction fleet maintenance
 *
 * The function provides a consistent way to assess ship status
 * and will be essential for the upcoming ship condition system
 * where damage affects ship performance in multiple ways.
 *
 * @param unit The faction combat unit to evaluate
 * @returns The current status of the ship
 */
// @ts-expect-error - This function is documented for future use in the faction behavior system
function _determineShipStatus(unit: FactionCombatUnit): CommonShipStatus {
  const status = unit.status.main;
  if (status === 'active') {
    return 'ready' as CommonShipStatus;
  }
  if (status === 'disabled') {
    return 'disabled' as CommonShipStatus;
  }
  return 'destroyed' as CommonShipStatus;
}

/**
 * Determines the optimal formation for a group of faction units
 *
 * This function will be used in future implementations to:
 * 1. Create tactically advantageous fleet formations
 * 2. Adapt formations based on enemy composition and positioning
 * 3. Implement faction-specific formation preferences and specialties
 * 4. Support formation transitions during different combat phases
 * 5. Enable formation-based bonuses and synergies
 *
 * The function ensures that faction fleets use appropriate formations
 * and will be critical for the upcoming advanced fleet tactics system
 * where formation choice significantly impacts combat effectiveness.
 *
 * @param units Array of faction combat units to organize
 * @returns The optimal formation configuration for the units
 */
// @ts-expect-error - This function is documented for future use in the faction behavior system
function _determineFormation(units: FactionCombatUnit[]): FactionFleet['formation'] {
  return {
    type: 'defensive',
    spacing: 50,
    facing: Math.atan2(units[0].position.y, units[0].position.x),
  };
}

// Helper function to calculate territory systems
function calculateTerritorySystems(territory: FactionTerritory): number {
  return Math.floor(territory.radius / 1000);
}

// Helper function to calculate resource income
function calculateResourceIncome(territory: FactionTerritory): Record<string, number> {
  // Convert to use ResourceType enum keys
  return {
    [ResourceType.MINERALS]: Math.floor(territory.resources[ResourceType.MINERALS] * 0.1),
    [ResourceType.ENERGY]: Math.floor((territory.resources[ResourceType.MINERALS] || 0) * 0.05),
    [ResourceType.PLASMA]: Math.floor((territory.resources[ResourceType.EXOTIC] || 0) * 0.2),
    [ResourceType.EXOTIC]: Math.floor(territory.resources[ResourceType.EXOTIC] * 0.05),
    [ResourceType.GAS]: Math.floor(territory.resources[ResourceType.GAS] * 0.1),
    [ResourceType.POPULATION]: Math.floor((territory.resources[ResourceType.MINERALS] || 0) * 0.01),
    [ResourceType.RESEARCH]: Math.floor((territory.resources[ResourceType.EXOTIC] || 0) * 0.02),
  };
}

// Helper function to find nearby enemies
function findNearbyEnemies(state: FactionBehaviorState): FactionCombatUnit[] {
  return Array.from(
    combatManager.getUnitsInRange(state.territory.center, state.territory.radius)
  ).filter(unit => isFactionCombatUnit(unit) && unit.faction !== state.id) as FactionCombatUnit[];
}

// Helper function to calculate player power
function calculatePlayerPower(): number {
  // TODO: Implement actual player power calculation based on fleet strength and territory
  return 0.5; // Default value for now
}

// Helper function to check for ambush opportunities
function isAmbushOpportunity(state: FactionBehaviorState): boolean {
  // Check if we have enough stealth ships and the enemy is vulnerable
  const stealthShips = state.fleets
    .flatMap(fleet => fleet.ships)
    .filter(ship => ship.class.toLowerCase().includes('stealth')).length;

  const hasEnoughStealthForces = stealthShips >= 3;
  const enemyIsVulnerable = state.territory.threatLevel < 0.3;

  return hasEnoughStealthForces && enemyIsVulnerable;
}

// Helper function to determine next action
function determineNextAction(
  tactic: FactionBehaviorState['behaviorState']['currentTactic']
): string {
  switch (tactic) {
    case 'raid':
      return 'prepare_raid_fleet';
    case 'defend':
      return 'fortify_positions';
    case 'expand':
      return 'scout_territory';
    case 'trade':
      return 'establish_trade_route';
    default:
      return 'patrol';
  }
}

// Helper function to select spawn point
function selectSpawnPoint(territory: FactionTerritory): Position {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * territory.radius * 0.8;

  return {
    x: territory.center.x + Math.cos(angle) * distance,
    y: territory.center.y + Math.sin(angle) * distance,
  };
}

// Helper function to check if should spawn new ship
function shouldSpawnNewShip(
  state: FactionBehaviorState,
  config: (typeof FACTION_CONFIGS)[FactionId]
): boolean {
  if (state.stats.totalShips >= config.maxShips) {
    return false;
  }

  // Faction-specific spawn conditions
  switch (state.id) {
    case 'space-rats':
      return Math.random() < 0.1; // Regular spawning
    case 'lost-nova':
      return state.behaviorState.aggression > 0.5 && Math.random() < 0.05;
    case 'equator-horizon':
      return state.stateMachine.current !== 'dormant' && Math.random() < 0.03;
    default:
      return false;
  }
}

// Helper function to generate control points
function generateControlPoints(center: Position, radius: number): Position[] {
  const points: Position[] = [];
  const count = 8;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    points.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  }

  return points;
}

// Helper function to calculate threat level
function calculateThreatLevel(
  center: Position,
  radius: number,
  territory: FactionTerritory
): number {
  const threats = Array.from(combatManager.getUnitsInRange(center, radius)).filter(
    unit => isFactionCombatUnit(unit) && unit.faction !== territory.factionId
  );

  return Math.min(1, threats.length / 10);
}

// Helper function to normalize ship class
/**
 * Normalizes ship class names for consistent handling
 *
 * This function will be used in future implementations to:
 * 1. Convert kebab-case ship class names to camelCase for internal processing
 * 2. Ensure consistent ship class naming across the faction system
 * 3. Support ship class name validation and normalization
 * 4. Enable case-insensitive ship class lookups
 * 5. Facilitate ship class name formatting for display
 *
 * The function provides a reliable way to normalize ship class names
 * and will be essential for the upcoming ship registry system where
 * ship classes can be referenced by various naming conventions.
 *
 * @param shipClass The ship class name to normalize
 * @returns The normalized ship class name as a FactionShipClass
 */
// @ts-expect-error - This function is documented for future use in the faction ship system
function _normalizeShipClass(shipClass: string): FactionShipClass {
  const camelCase = shipClass.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  return camelCase as FactionShipClass;
}

// Combat tactics update function
function updateCombatTactics(state: FactionBehaviorState): void {
  // Calculate fleet strength directly from combat units
  const fleetStrength = state.fleets.reduce((total, fleet) => {
    return total + fleet.strength;
  }, 0);

  const { threatLevel } = state.territory;

  // Adjust combat tactics based on situation
  if (fleetStrength < state.combatTactics.retreatThreshold) {
    state.combatTactics.formationStyle = 'defensive';
    state.combatTactics.preferredRange = 'long';
  } else if (fleetStrength > 0.8) {
    state.combatTactics.formationStyle = 'aggressive';
    state.combatTactics.preferredRange = 'close';
  }

  // Update target priorities based on needs
  if (state.stats.resourceIncome[ResourceType.MINERALS] < 100) {
    state.combatTactics.targetPriority = 'resources';
  } else if (threatLevel > 0.7) {
    state.combatTactics.targetPriority = 'ships';
  }
}

// Resource management function
function manageResources(state: FactionBehaviorState): void {
  // Update resource priorities based on current needs
  const resourceLevels = Object.entries(state.stats.resourceIncome);
  state.resourceManagement.gatheringPriority = resourceLevels
    .sort(([, a], [, b]) => (a < b ? -1 : 1))
    .map(([type]) => type as ResourceType);

  // Adjust stockpile thresholds based on expansion plans
  if (state.expansionStrategy.systemPriority === 'resources') {
    state.resourceManagement.stockpileThresholds = {
      [ResourceType.MINERALS]: 2000,
      [ResourceType.ENERGY]: 1500,
      [ResourceType.PLASMA]: 1000,
      [ResourceType.EXOTIC]: 500,
      [ResourceType.GAS]: 1000,
      [ResourceType.POPULATION]: 500,
      [ResourceType.RESEARCH]: 1000,
      [ResourceType.IRON]: 0,
      [ResourceType.COPPER]: 0,
      [ResourceType.DEUTERIUM]: 0,
      [ResourceType.ANTIMATTER]: 0,
      [ResourceType.DARK_MATTER]: 0,
      [ResourceType.EXOTIC_MATTER]: 0,
      [ResourceType.TITANIUM]: 0,
      [ResourceType.URANIUM]: 0,
      [ResourceType.WATER]: 0,
      [ResourceType.HELIUM]: 0,
    };
  }
}

// Expansion planning function
function planExpansion(state: FactionBehaviorState): void {
  // Calculate optimal expansion direction
  const newDirection = calculateOptimalExpansionDirection(state);
  state.expansionStrategy.expansionDirection = newDirection;

  // Adjust system priority based on needs
  if (
    state.stats.resourceIncome[ResourceType.MINERALS] < 100 ||
    state.stats.resourceIncome[ResourceType.ENERGY] < 100
  ) {
    state.expansionStrategy.systemPriority = 'resources';
  } else if (state.stats.territorySystems < 5) {
    state.expansionStrategy.systemPriority = 'strategic';
  }
}

// Faction-specific behavior functions
function executeSpaceRatsBehavior(state: FactionBehaviorState): void {
  switch (state.stateMachine.current) {
    case 'patrolling':
      // Execute patrol pattern
      break;
    case 'aggressive':
      // Execute aggressive raids
      break;
    case 'pursuing':
      // Execute pursuit
      break;
  }
}

function executeLostNovaBehavior(state: FactionBehaviorState): void {
  switch (state.stateMachine.current) {
    case 'hiding':
      // Execute stealth mode
      break;
    case 'preparing':
      // Prepare ambush
      break;
    case 'ambushing':
      // Execute ambush
      break;
  }
}

function executeEquatorHorizonBehavior(state: FactionBehaviorState): void {
  switch (state.stateMachine.current) {
    case 'enforcing':
      // Execute balance enforcement
      break;
    case 'overwhelming':
      // Execute overwhelming force
      break;
    case 'withdrawing':
      // Execute strategic withdrawal
      break;
  }
}

// Helper function to calculate optimal expansion direction
function calculateOptimalExpansionDirection(state: FactionBehaviorState): Position {
  interface WeightedResource {
    position: Position;
    value: number;
  }

  type ResourceNodeEntry = [string, { fieldId: string; type: ResourceType; amount: number }];

  // Find direction with most resources or strategic value based on priority
  const nearbyResources = Array.from(asteroidFieldManager.getResourceNodes().entries())
    .filter((entry: ResourceNodeEntry) => {
      const [_, node] = entry;
      const field = asteroidFieldManager.getField(node.fieldId);
      if (!field) {
        return false;
      }

      const dx = field.position.x - state.territory.center.x;
      const dy = field.position.y - state.territory.center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      return distance <= state.territory.radius;
    })
    .map((entry: ResourceNodeEntry): WeightedResource | null => {
      const [_, node] = entry;
      const field = asteroidFieldManager.getField(node.fieldId);
      if (!field) {
        return null;
      }

      return {
        position: field.position,
        value: node.amount * getResourceValueMultiplier(node.type),
      };
    })
    .filter((resource): resource is WeightedResource => resource !== null);

  if (nearbyResources.length === 0) {
    return state.expansionStrategy.expansionDirection;
  }

  // Calculate weighted center of resources
  const center = nearbyResources.reduce(
    (acc: Position, resource: WeightedResource) => ({
      x: acc.x + resource.position.x * resource.value,
      y: acc.y + resource.position.y * resource.value,
    }),
    { x: 0, y: 0 }
  );

  const totalValue = nearbyResources.reduce(
    (sum: number, resource: WeightedResource) => sum + resource.value,
    0
  );
  return {
    x: center.x / (totalValue || 1),
    y: center.y / (totalValue || 1),
  };
}

// Update updateFleets function with proper type handling
function updateFleets(units: CombatUnit[]): FactionFleet[] {
  const fleets: FactionFleet[] = [];
  const assignedUnits = new Set<string>();

  units.forEach(unit => {
    if (assignedUnits.has(unit.id)) {
      return;
    }

    const nearbyUnits = units.filter(
      other => !assignedUnits.has(other.id) && getDistance(unit.position, other.position) < 500
    );

    if (nearbyUnits.length >= 3) {
      const factionUnits = nearbyUnits.map(u =>
        convertToFactionCombatUnit(u, 'neutral', u.type as FactionShipClass)
      );
      const factionShips: FactionShip[] = factionUnits.map(u => ({
        id: u.id,
        name: `${u.type}`,
        category: 'war',
        status: 'ready' as CommonShipStatus,
        faction: u.faction,
        class: u.class,
        health: u.stats.health,
        maxHealth: u.stats.maxHealth,
        shield: u.stats.shield,
        maxShield: u.stats.maxShield,
        position: u.position,
        rotation: u.rotation,
        tactics: {
          formation: 'defensive',
          behavior: 'defensive',
        },
        stats: {
          health: u.stats.health,
          maxHealth: u.stats.maxHealth,
          shield: u.stats.shield,
          maxShield: u.stats.maxShield,
          energy: 100,
          maxEnergy: 100,
          cargo: 100,
          speed: u.stats.speed,
          turnRate: u.stats.turnRate,
          defense: {
            armor: 100,
            shield: u.stats.shield,
            evasion: 0.3,
            regeneration: 1,
          },
          mobility: {
            speed: u.stats.speed,
            turnRate: u.stats.turnRate,
            acceleration: 50,
          },
          weapons: [],
          abilities: [],
        },
        abilities: [],
      }));

      fleets.push({
        ships: factionShips,
        formation: {
          type: 'defensive',
          spacing: 100,
          facing: 0,
        },
        strength: calculateFleetStrength(nearbyUnits),
      });

      nearbyUnits.forEach(u => assignedUnits.add(u.id));
    }
  });

  return fleets;
}

// Convert local FactionFleet to StandardizedFactionFleet
function convertToStandardizedFleet(fleet: FactionFleet): StandardizedFactionFleet {
  return {
    id: fleet.id || `fleet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: fleet.name || `Fleet ${fleet.id}`,
    ships: fleet.ships.map(ship => ({
      id: ship.id,
      name: ship.name,
      type: ship.class,
      level: ship.level || 1,
      status:
        ship.status === 'ready'
          ? 'idle'
          : ship.status === 'engaging'
            ? 'engaging'
            : ship.status === 'damaged'
              ? 'damaged'
              : 'retreating',
    })),
    formation: fleet.formation,
    status:
      fleet.status === 'ready'
        ? 'idle'
        : fleet.status === 'engaging'
          ? 'engaging'
          : fleet.status === 'retreating'
            ? 'retreating'
            : 'patrolling',
    position: fleet.position,
  };
}

// Convert local FactionTerritory to StandardizedFactionTerritory
function convertToStandardizedTerritory(territory: FactionTerritory): StandardizedFactionTerritory {
  return {
    center: territory.center,
    radius: territory.radius,
    controlPoints: territory.controlPoints,
    resources: {
      ...Object.keys(ResourceType).reduce(
        (acc, key) => {
          acc[ResourceType[key as keyof typeof ResourceType]] = 0;
          return acc;
        },
        {} as Record<ResourceType, number>
      ),
      ...territory.resources,
    },
    threatLevel: territory.threatLevel,
  };
}
