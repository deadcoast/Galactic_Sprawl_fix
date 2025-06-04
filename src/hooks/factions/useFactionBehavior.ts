import { useCallback, useEffect, useState } from 'react';
import { SHIP_STATS as CONFIG_SHIP_STATS } from '../../config/ships';
import { ModuleEvent, moduleEventBus } from '../../lib/events/ModuleEventBus'; // Keep one moduleEventBus import
import {
  CombatManager,
  getAsteroidFieldManager,
  getFactionBehaviorManager,
} from '../../managers/ManagerRegistry'; // Import registry accessors
import { CombatUnit } from '../../types/combat/CombatTypes';
import { Position } from '../../types/core/GameTypes';
import { EventType } from '../../types/events/EventTypes'; // Import EventType from types
import { CommonShipStats, ShipStatus as CommonShipStatus, ShipType } from '../../types/ships/CommonShipTypes'; // Correct import for CommonShipStatus
import {
  FactionBehaviorConfig,
  FactionBehaviorType,
  FactionFleet,
  FactionFleetFormation,
  FactionId,
  FactionShip,
  FactionShipClass,
} from '../../types/ships/FactionShipTypes';
import {
  WeaponCategory,
  WeaponConfig,
  WeaponInstance,
  WeaponMount,
  WeaponMountPosition,
  WeaponMountSize,
  WeaponSystem,
} from '../../types/weapons/WeaponTypes';
import {
  convertToFactionCombatUnit,
  convertWeaponSystemToMount,
  isFactionCombatUnit,
} from '../../utils/typeConversions';
import { ResourceType } from './../../types/resources/ResourceTypes';

// Import faction event types and interfaces
import { FactionEventType, FactionFleetEvent } from '../../types/events/FactionEvents';

// Added import for factionConfigs
import { factionConfigs } from '../../config/factions/factions';

// Define the state machine transition type here
interface StateMachineTransition {
  currentState: FactionStateType;
  event: FactionEvent;
  nextState: FactionStateType;
}

// Function to check if a value is a valid FactionShipClass
function isFactionShipClass(value: unknown): value is FactionShipClass {
  const validClasses: string[] = [
    // Base
    'spitflare',
    'starSchooner',
    'orionFrigate',
    'harbringerGalleon',
    'midwayCarrier',
    'motherEarthRevenge',
    // Space Rats
    'ratKing',
    'asteroidMarauder',
    'rogueNebula',
    'ratsRevenge',
    'darkSectorCorsair',
    'wailingWreck',
    'galacticScourge',
    'plasmaFang',
    'verminVanguard',
    'blackVoidBuccaneer',
    // Lost Nova
    'eclipseScythe',
    'nullsRevenge',
    'darkMatterReaper',
    'quantumPariah',
    'entropyScale',
    'voidRevenant',
    'scytheOfAndromeda',
    'nebularPersistence',
    'oblivionsWake',
    'forbiddenVanguard',
    // Equator Horizon
    'celestialArbiter',
    'etherealGalleon',
    'stellarEquinox',
    'chronosSentinel',
    'nebulasJudgement',
    'aetherialHorizon',
    'cosmicCrusader',
    'balancekeepersWrath',
    'eclipticWatcher',
    'harmonysVanguard',
  ];
  return typeof value === 'string' && validClasses.includes(value);
}

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

function convertToWeaponInstance(weapon: WeaponSystem): WeaponInstance {
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

function convertToWeaponMounts(weapons: WeaponSystem[]): WeaponMount[] {
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
    skills: { name: string; level: number }[]; // Align with expected type
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

function hasStatus(unit: CombatUnit | FactionCombatUnit, statusToCheck: string): boolean {
  if (isFactionCombatUnit(unit)) {
    // For FactionCombatUnit, check main status, secondary status, and effects
    return (
      unit.status.main === statusToCheck ||
      (unit.status.secondary !== undefined && unit.status.secondary === statusToCheck) ||
      unit.status.effects.includes(statusToCheck)
    );
  } else {
    // For regular CombatUnit, check if status is a string and compare
    // CombatUnit might not have a status property, or it might be different.
    // Add a check for the 'status' property before accessing it.
    if ('status' in unit && typeof unit.status === 'string') {
      return unit.status === statusToCheck;
    }
    return false; // Or handle as needed if status doesn't exist/isn't a string
  }
}

// Helper function to check if array is FactionCombatUnit[]
function isFactionCombatUnitArray(
  units: CombatUnit[] | FactionCombatUnit[] | FactionShip[]
): units is FactionCombatUnit[] {
  return units.length > 0 && isFactionCombatUnit(units[0] as FactionCombatUnit);
}

// Helper function to check if array is FactionShip[]
function isFactionShipArray(
  units: CombatUnit[] | FactionCombatUnit[] | FactionShip[]
): units is FactionShip[] {
  // Add a more robust check if possible, e.g., check for a property unique to FactionShip
  return (
    units.length > 0 &&
    !isFactionCombatUnit(units[0] as FactionCombatUnit) &&
    'category' in units[0]
  );
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
    const _baseStats = getShipBehaviorStats(unit.type as unknown as ShipType);

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

    // Determine initial status safely
    const initialStatus: FactionCombatUnit['status'] = { main: 'active', effects: [] }; // Match target type
    if (
      'status' in unit &&
      typeof unit.status === 'object' &&
      unit.status !== null &&
      'main' in unit.status
    ) {
      // Check if unit.status matches FactionCombatUnit['status'] structure
      // Safely assign properties, ensuring type compatibility
      if (
        typeof unit.status.main === 'string' &&
        ['active', 'disabled', 'destroyed'].includes(unit.status.main)
      ) {
        initialStatus.main = unit.status.main;
      }
      if ('secondary' in unit.status && typeof unit.status.secondary === 'string') {
        initialStatus.secondary = unit.status.secondary as FactionCombatUnit['status']['secondary'];
      }
      if ('effects' in unit.status && Array.isArray(unit.status.effects)) {
        // Filter effects to ensure they are strings if needed, or trust the source type
        initialStatus.effects = unit.status.effects.filter(
          (e): e is string => typeof e === 'string'
        );
      }
    } else if ('status' in unit && typeof unit.status === 'string' && unit.status === 'destroyed') {
      initialStatus.main = 'destroyed';
    }

    const factionUnit: FactionCombatUnit = {
      id: unit.id,
      type: unit.type,
      position: unit.position,
      rotation: unit.rotation,
      velocity: unit.velocity,
      faction: defaultFaction, // Use the provided defaultFaction
      class: unit.type as FactionShipClass, // Assuming unit.type maps directly
      tactics: {
        formation: 'balanced',
        behavior: 'aggressive' as FactionBehaviorType,
        target: undefined,
      },
      weaponMounts: convertToWeaponMounts(unit.weapons ?? []), // Handle potentially missing weapons
      weapons: (unit.weapons ?? []).map(w => ({
        // Handle potentially missing weapons
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
        armor: _baseStats.defense?.armor ?? 0, // Access armor via defense
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
      status: initialStatus, // Use the determined initial status
      experience: {
        current: 0,
        total: 0,
        level: 1,
        skills: [], // Align with updated interface
      },
    };

    return factionUnit;
  });
}

// Update calculateFleetStrength to handle multiple types
function calculateFleetStrength(units: CombatUnit[] | FactionCombatUnit[] | FactionShip[]): number {
  let totalStrength = 0;

  units.forEach(unit => {
    let unitStrength = 0;
    if (isFactionCombatUnit(unit)) {
      const weaponDamage = unit.weapons.reduce((sum, weapon) => sum + weapon.damage, 0);
      unitStrength = unit.stats.health + unit.stats.shield + weaponDamage; // Example calculation
    } else if (isFactionShipArray([unit])) {
      // Check if it's a FactionShip
      // Access FactionShip properties - assuming 'stats' exists and has health/shield
      const ship = unit as FactionShip;
      // Need to define how weapon strength is calculated for FactionShip if different
      // For now, use health/shield from stats
      unitStrength = ship.health + ship.shield + (ship.stats?.defense?.armor ?? 0); // Example
    } else {
      // Assume CombatUnit
      // Need a way to estimate CombatUnit strength, perhaps using getShipBehaviorStats
      const stats = getShipBehaviorStats(unit.type as ShipType);
      unitStrength = stats.health + stats.shield; // Basic estimation
      const weaponDamage = (unit.weapons ?? []).reduce((sum, weapon) => sum + weapon.damage, 0);
      unitStrength += weaponDamage;
    }
    totalStrength += unitStrength;
  });

  return totalStrength;
}

// Add FACTION_SHIPS constant
const FACTION_SHIPS: Record<FactionId, ShipType[]> = {
  player: ['spitflare', 'starSchooner', 'orionFrigate'] as unknown as ShipType[],
  enemy: ['harbringerGalleon', 'midwayCarrier', 'motherEarthRevenge'] as unknown as ShipType[],
  neutral: ['starSchooner', 'orionFrigate'] as unknown as ShipType[],
  ally: ['spitflare', 'orionFrigate'] as unknown as ShipType[],
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
  ] as unknown as ShipType[],
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
  ] as unknown as ShipType[],
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
  ] as unknown as ShipType[],
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
    currentTactic: 'raid' | 'defend' | 'expand' | 'trade' | 'ambush'; // Added 'ambush'
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

// Use the standardized FactionBehaviorManager instead
const factionBehaviorManager = getFactionBehaviorManager();

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
  | 'defending'
  | 'expanding'

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
  | 'overwhelming';

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

// Assume CombatManager is declared globally or imported
// If it's declared elsewhere, ensure its definition matches this interface
// declare const combatManager: CombatManager;

// If CombatManager needs to be instantiated or accessed via registry:
// import { getCombatManager } from '../../managers/ManagerRegistry';
// const combatManager = getCombatManager();

// Placeholder for CombatManager if not available globally
const combatManager: CombatManager = {
  getUnitsInRange: (position, range) => {
    console.warn('CombatManager.getUnitsInRange not implemented');
    return [];
  },
  getThreatsInTerritory: territory => {
    console.warn('CombatManager.getThreatsInTerritory not implemented');
    return [];
  },
  engageTarget: (unitId, targetId) => {
    console.warn('CombatManager.engageTarget not implemented');
  },
  moveUnit: (unitId, position) => {
    console.warn('CombatManager.moveUnit not implemented');
  },
};

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

// Assume FactionManager is declared globally or imported
// declare const factionManager: FactionManager;

// Placeholder for FactionManager if not available globally
// Access via registry if needed: import { getFactionManager } from '../../managers/ManagerRegistry';
const localFactionManager: FactionManager = {
  getFactionState: factionId => {
    console.warn('FactionManager.getFactionState not implemented for', factionId);
    return undefined;
  },
  getFactionConfig: factionId => {
    console.warn('FactionManager.getFactionConfig not implemented for', factionId);
    return undefined;
  },
  spawnShip: (factionId, position) => {
    console.warn('FactionManager.spawnShip not implemented for', factionId, position);
  },
  expandTerritory: (factionId, position) => {
    console.warn('FactionManager.expandTerritory not implemented for', factionId, position);
  },
};

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
  return STATE_TRANSITIONS[factionId] || [];
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
      // Ensure specialRules and powerThreshold exist before accessing
      if (
        state.specialRules?.powerThreshold !== undefined &&
        calculatePlayerPower() > state.specialRules.powerThreshold
      ) {
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
const asteroidFieldManager = getAsteroidFieldManager();

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

// Add type guards for each event type
interface BehaviorChangedEvent {
  factionId: FactionId;
  oldBehavior: FactionBehaviorType;
  newBehavior: FactionBehaviorType;
}

interface FleetUpdatedEvent {
  factionId: FactionId;
  fleets: FactionFleet[];
}

interface TerritoryChangedEvent {
  factionId: FactionId;
  territory: FactionTerritory;
}

interface RelationshipChangedEvent {
  factionId: FactionId;
  targetFaction: FactionId;
  oldValue: number;
  newValue: number;
}

interface ResourcesUpdatedEvent {
  factionId: FactionId;
  resourceType: ResourceType;
  oldAmount: number;
  newAmount: number;
}

interface CombatTacticsChangedEvent {
  factionId: FactionId;
  oldTactics: FactionBehaviorState['combatTactics'];
  newTactics: FactionBehaviorState['combatTactics'];
}

function isBehaviorChangedEvent(event: unknown): event is BehaviorChangedEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'factionId' in event &&
    'oldBehavior' in event &&
    'newBehavior' in event
  );
}

function isFleetUpdatedEvent(event: unknown): event is FleetUpdatedEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'factionId' in event &&
    'fleets' in event &&
    Array.isArray((event as FleetUpdatedEvent).fleets)
  );
}

function isTerritoryChangedEvent(event: unknown): event is TerritoryChangedEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'factionId' in event &&
    'territory' in event &&
    typeof (event as TerritoryChangedEvent).territory === 'object'
  );
}

function isRelationshipChangedEvent(event: unknown): event is RelationshipChangedEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'factionId' in event &&
    'targetFaction' in event &&
    'oldValue' in event &&
    'newValue' in event
  );
}

function isResourcesUpdatedEvent(event: unknown): event is ResourcesUpdatedEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'factionId' in event &&
    'resourceType' in event &&
    'oldAmount' in event &&
    'newAmount' in event
  );
}

function isCombatTacticsChangedEvent(event: unknown): event is CombatTacticsChangedEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'factionId' in event &&
    'oldTactics' in event &&
    'newTactics' in event
  );
}

// Placeholder function definition
function calculateOptimalExpansionDirection(state: FactionBehaviorState): Position {
  console.warn(
    'calculateOptimalExpansionDirection is not implemented, returning random direction.'
  );
  // Return a random direction vector (normalized)
  const angle = Math.random() * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function useFactionBehavior(factionId: FactionId) {
  const [behavior, setBehavior] = useState<FactionBehaviorState>(() => {
    const config = factionConfigs[factionId];
    if (!config) {
      throw new Error(`Configuration for faction ${factionId} not found.`);
    }
    return {
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
          [ResourceType.FOOD]: 0,
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
          [ResourceType.ORGANIC]: 0,
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
      specialRules: config.specialRules,
      behaviorState: {
        aggression: config.behavior.baseAggression,
        expansion: config.behavior.expansionRate,
        trading: config.behavior.tradingPreference,
        currentTactic: 'defend',
        lastAction: 'initialized',
        nextAction: 'evaluate',
      },
      stats: {
        totalShips: 0,
        activeFleets: 0,
        territorySystems: Math.floor(100 / 1000), // Calculate directly from initial radius
        resourceIncome: {
          [ResourceType.FOOD]: 0,
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
          [ResourceType.ORGANIC]: 0,
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
          [ResourceType.FOOD]: 0,
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
          [ResourceType.ORGANIC]: 0,
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
    };
  });

  const handleModuleEvent = useCallback(
    (event: ModuleEvent) => {
      switch (event?.type) {
        // Use the correct EventType enum member
        case EventType.MODULE_STATUS_CHANGED:
          if (event?.data?.type === 'tactics') {
            const oldTactics = behavior.combatTactics;
            // Ensure event.data is treated as Record<string, unknown> for safe spread
            const eventData = event.data ?? {};
            const newTactics = {
              ...oldTactics,
              ...eventData, // Spread safely
            };

            setBehavior(prev => ({
              ...prev,
              // Ensure newTactics aligns with expected type
              combatTactics: newTactics as FactionBehaviorState['combatTactics'],
            }));

            factionBehaviorManager.emit(FactionEventType.COMBAT_TACTICS_CHANGED, {
              // Use manager emit
              factionId,
              oldTactics,
              // Ensure newTactics aligns with expected event payload type
              newTactics: newTactics as FactionBehaviorState['combatTactics'],
            });
          }
          break;
      }
    },
    [behavior.combatTactics, factionId] // Dependency array seems correct
  );

  const handleBehaviorEvent = useCallback(
    (eventType: FactionEventType, data: unknown) => {
      // Add useCallback
      // Ensure behavior state is updated correctly based on events
      setBehavior(prev => {
        const newState = { ...prev }; // Start with current state

        switch (eventType) {
          case FactionEventType.BEHAVIOR_CHANGED:
            if (isBehaviorChangedEvent(data)) {
              // Potentially update behaviorState based on this change
              // Example: Adjust aggression based on new behavior type
              if (data.newBehavior === 'aggressive') {
                newState.behaviorState.aggression = Math.min(
                  1,
                  newState.behaviorState.aggression + 0.1
                );
              } else if (data.newBehavior === 'defensive') {
                newState.behaviorState.aggression = Math.max(
                  0,
                  newState.behaviorState.aggression - 0.1
                );
              }
            }
            break;
          case FactionEventType.FLEET_UPDATED:
            if (isFleetUpdatedEvent(data)) {
              newState.fleets = data.fleets; // Update fleets
              newState.stats.totalShips = data.fleets.reduce(
                (sum, fleet) => sum + fleet.ships.length,
                0
              );
              newState.stats.activeFleets = data.fleets.length;
            }
            break;
          case FactionEventType.TERRITORY_CHANGED:
            if (isTerritoryChangedEvent(data)) {
              newState.territory = data.territory; // Update territory
              newState.stats.territorySystems = Math.floor(data.territory.radius / 1000);
            }
            break;
          case FactionEventType.RELATIONSHIP_CHANGED:
            if (isRelationshipChangedEvent(data)) {
              newState.relationships[data.targetFaction] = data.newValue; // Update relationship
            }
            break;
          case FactionEventType.RESOURCES_UPDATED:
            if (isResourcesUpdatedEvent(data)) {
              newState.stats.resourceIncome[data.resourceType] = data.newAmount; // Update resource income
            }
            break;
          case FactionEventType.COMBAT_TACTICS_CHANGED:
            if (isCombatTacticsChangedEvent(data)) {
              newState.combatTactics = data.newTactics; // Update combat tactics
            }
            break;
          default:
            // No state change for unknown events
            break;
        }
        return newState; // Return the potentially updated state
      });
    },
    [setBehavior]
  ); // Add dependencies

  useEffect(() => {
    const unsubscribeBehaviorChanged = factionBehaviorManager.on(
      FactionEventType.BEHAVIOR_CHANGED,
      event => {
        if (isBehaviorChangedEvent(event) && event?.factionId === factionId) {
          handleBehaviorEvent(FactionEventType.BEHAVIOR_CHANGED, {
            factionId,
            oldBehavior: event?.oldBehavior,
            newBehavior: event?.newBehavior,
          });
        }
      }
    );

    const unsubscribeFleetUpdated = factionBehaviorManager.on(
      FactionEventType.FLEET_UPDATED,
      event => {
        if (isFleetUpdatedEvent(event) && event?.factionId === factionId) {
          handleBehaviorEvent(FactionEventType.FLEET_UPDATED, {
            factionId,
            fleets: event?.fleets,
          });
        }
      }
    );

    const unsubscribeTerritoryChanged = factionBehaviorManager.on(
      FactionEventType.TERRITORY_CHANGED,
      event => {
        if (isTerritoryChangedEvent(event) && event?.factionId === factionId) {
          handleBehaviorEvent(FactionEventType.TERRITORY_CHANGED, {
            factionId,
            territory: event?.territory,
          });
        }
      }
    );

    const unsubscribeRelationshipChanged = factionBehaviorManager.on(
      FactionEventType.RELATIONSHIP_CHANGED,
      event => {
        if (isRelationshipChangedEvent(event) && event?.factionId === factionId) {
          handleBehaviorEvent(FactionEventType.RELATIONSHIP_CHANGED, {
            factionId,
            targetFaction: event?.targetFaction,
            oldValue: event?.oldValue,
            newValue: event?.newValue,
          });
        }
      }
    );

    const unsubscribeResourcesUpdated = factionBehaviorManager.on(
      FactionEventType.RESOURCES_UPDATED,
      event => {
        if (isResourcesUpdatedEvent(event) && event?.factionId === factionId) {
          handleBehaviorEvent(FactionEventType.RESOURCES_UPDATED, {
            factionId,
            resourceType: event?.resourceType,
            oldAmount: event?.oldAmount,
            newAmount: event?.newAmount,
          });
        }
      }
    );

    const unsubscribeCombatTacticsChanged = factionBehaviorManager.on(
      FactionEventType.COMBAT_TACTICS_CHANGED,
      event => {
        if (isCombatTacticsChangedEvent(event) && event?.factionId === factionId) {
          handleBehaviorEvent(FactionEventType.COMBAT_TACTICS_CHANGED, {
            factionId,
            oldTactics: event?.oldTactics,
            newTactics: event?.newTactics,
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
  }, [factionId, handleBehaviorEvent]); // Add handleBehaviorEvent to dependency array

  const updateFactionBehavior = useCallback(() => {
    // Use a functional update for setBehavior to ensure we always have the latest state
    setBehavior(currentBehavior => {
      const nearbyUnits = Array.from(
        combatManager.getUnitsInRange(
          currentBehavior.territory.center,
          currentBehavior.territory.radius
        )
      );

      // Update fleets based on nearby units
      const updatedFleets = updateFleets(nearbyUnits);
      let fleetsChanged = false;
      if (
        updatedFleets.length !== currentBehavior.fleets.length ||
        JSON.stringify(updatedFleets) !== JSON.stringify(currentBehavior.fleets)
      ) {
        const eventFleets = updatedFleets.map(convertToEventFleet);
        factionBehaviorManager.updateFleets(factionId, eventFleets);
        fleetsChanged = true; // Mark fleets as changed
      }

      // Update territory based on unit positions
      const updatedTerritory = calculateTerritory(nearbyUnits, currentBehavior.territory);
      let territoryChanged = false;
      if (
        updatedTerritory.radius !== currentBehavior.territory.radius ||
        JSON.stringify(updatedTerritory.center) !== JSON.stringify(currentBehavior.territory.center)
      ) {
        const eventTerritory = convertToEventTerritory(updatedTerritory, factionId);
        factionBehaviorManager.updateTerritory(factionId, eventTerritory);
        territoryChanged = true; // Mark territory as changed
      }

      // Update resource income
      let resourcesChanged = false;
      const newResourceIncome = calculateResourceIncome(updatedTerritory); // Use updated territory
      Object.entries(newResourceIncome).forEach(([resourceKey, newAmount]) => {
        const resourceType = ResourceType[resourceKey.toUpperCase() as keyof typeof ResourceType];
        if (resourceType) {
          const oldAmount = currentBehavior.stats.resourceIncome[resourceType] ?? 0;
          if (oldAmount !== newAmount) {
            factionBehaviorManager.updateResources(factionId, resourceType, newAmount);
            resourcesChanged = true; // Mark resources as changed
          }
        }
      });

      // Update relationships with other factions
      let relationshipsChanged = false;
      const updatedRelationships = calculateRelationships(factionId, currentBehavior.relationships);
      Object.entries(updatedRelationships).forEach(([targetFaction, newValue]) => {
        const oldValue = currentBehavior.relationships[targetFaction as FactionId];
        if (oldValue !== newValue) {
          factionBehaviorManager.updateRelationship(
            factionId,
            targetFaction as FactionId,
            newValue
          );
          relationshipsChanged = true; // Mark relationships as changed
        }
      });

      // Create a working copy of the state for mutation
      const nextBehavior = { ...currentBehavior };

      // Apply changes conditionally based on flags
      if (fleetsChanged) {
        nextBehavior.fleets = updatedFleets;
        nextBehavior.stats = {
          ...nextBehavior.stats,
          totalShips: updatedFleets.reduce((s, f) => s + f.ships.length, 0),
          activeFleets: updatedFleets.length,
        };
      }
      if (territoryChanged) {
        nextBehavior.territory = updatedTerritory;
        nextBehavior.stats = {
          ...nextBehavior.stats,
          territorySystems: Math.floor(updatedTerritory.radius / 1000),
        };
      }
      if (resourcesChanged) {
        nextBehavior.stats = { ...nextBehavior.stats, resourceIncome: newResourceIncome };
      }
      if (relationshipsChanged) {
        nextBehavior.relationships = updatedRelationships;
      }

      // Continue with state machine and tactic updates on the working copy
      handleStateMachineTriggers(nextBehavior);
      const newBehaviorState = calculateBehaviorState(
        nextBehavior.behaviorState,
        nextBehavior.fleets,
        nextBehavior.territory,
        nextBehavior.relationships
      );
      nextBehavior.behaviorState = newBehaviorState; // Update the behavior state
      updateCombatTactics(nextBehavior);
      manageResources(nextBehavior);
      planExpansion(nextBehavior);

      // Execute faction-specific behaviors
      switch (nextBehavior.id) {
        case 'space-rats':
          executeSpaceRatsBehavior(nextBehavior);
          break;
        case 'lost-nova':
          executeLostNovaBehavior(nextBehavior);
          break;
        case 'equator-horizon':
          executeEquatorHorizonBehavior(nextBehavior);
          break;
      }

      // Check spawn conditions
      const currentFactionConfig = factionConfigs[nextBehavior.id];
      if (currentFactionConfig && shouldSpawnNewShip(nextBehavior, currentFactionConfig)) {
        const spawnPoint = selectSpawnPoint(nextBehavior.territory);
        localFactionManager.spawnShip(nextBehavior.id, spawnPoint); // Use local placeholder
        // Note: Spawning might change state, consider re-running or handling asynchronously
      }

      // Return the final, updated state
      return nextBehavior;
    });
  }, [factionId]); // Dependencies: only factionId as setBehavior comes from useState

  useEffect(() => {
    // Use the correct EventType enum member
    const unsubscribeModuleEvents = moduleEventBus.subscribe(
      EventType.MODULE_STATUS_CHANGED,
      handleModuleEvent
    );

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
  // Explicitly type 'letter' as string in the callback
  const camelCase: string = shipClass.replace(/-([a-z])/g, (_, letter: string) =>
    letter.toUpperCase()
  );
  if (isFactionShipClass(camelCase)) {
    return camelCase;
  }
  // Handle invalid mapping, perhaps return a default or throw an error
  console.warn(`Invalid ship class encountered during mapping: ${shipClass}`);
  // Returning a default, adjust as necessary
  return 'spitflare' as FactionShipClass; // Cast to expected type
}

function calculateTerritory(
  units: CombatUnit[],
  currentTerritory: FactionTerritory
): FactionTerritory {
  if (units.length === 0) {
    // If no units, return current territory but potentially reset threat
    return {
      ...currentTerritory,
      threatLevel: calculateThreatLevel({ x: 0, y: 0 }, 0, currentTerritory),
    };
  }

  const positions = units.map(u => u.position);
  const center = {
    x: positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length,
    y: positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length,
  };

  const maxRadius = Math.max(
    currentTerritory.radius, // Keep at least current radius
    ...positions.map(pos => calculateDistance(center, pos)) // Use integrated function
  );

  // Consider a minimum radius or logic to shrink territory if units consolidate
  const effectiveRadius = Math.max(100, maxRadius); // Example minimum radius

  return {
    ...currentTerritory,
    center,
    radius: effectiveRadius,
    controlPoints: generateControlPoints(center, effectiveRadius),
    threatLevel: calculateThreatLevel(center, effectiveRadius, currentTerritory),
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
  const baseFactionModifier = factionModifiers[factionId] ?? 0;

  Object.keys(currentRelationships).forEach(otherFactionIdStr => {
    const otherFactionId = otherFactionIdStr as FactionId; // Cast to FactionId
    const otherFaction = factionConfigs[otherFactionId];
    if (!otherFaction || otherFactionId === factionId) {
      // Skip self and invalid factions
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
      if (updatedRelationships[otherFactionId] < -0.5) {
        relationshipChange += 0.02;
      }
      // If relationship is too positive, be a bit more cautious
      else if (updatedRelationships[otherFactionId] > 0.8) {
        relationshipChange -= 0.01;
      }
    }

    // Apply the base faction modifier and unknown specific changes
    updatedRelationships[otherFactionId] += baseFactionModifier + relationshipChange;

    // Clamp values between -1 and 1
    updatedRelationships[otherFactionId] = Math.max(
      -1,
      Math.min(1, updatedRelationships[otherFactionId])
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
  let nextTactic: FactionBehaviorState['behaviorState']['currentTactic'] = current.currentTactic;

  if (territory.threatLevel > 0.7) {
    nextTactic = 'defend';
  } else if (fleets.length > 3 && current.aggression > 0.6) {
    nextTactic = 'raid';
  } else if (Object.values(relationships).some(r => r > 0.5)) {
    nextTactic = 'trade';
  } else if (current.expansion > 0.5) {
    nextTactic = 'expand';
  } else if (current.currentTactic === 'ambush') {
    // Don't override ambush state unless specific conditions met (handled elsewhere)
    nextTactic = 'ambush';
  } else {
    // Default back to defend/patrol if no strong drivers
    nextTactic = 'defend';
  }

  return {
    ...current,
    currentTactic: nextTactic,
    lastAction: current.nextAction, // Keep track of the intended next action
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

function calculateDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
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
  const mappedClass = mapShipClass(shipClass); // Ensure we map before lookup
  const configStats = CONFIG_SHIP_STATS[mappedClass]; // Use mapped class for lookup

  if (!configStats) {
    console.warn(
      `No config stats found for mapped ship class: ${mappedClass} (original: ${shipClass}). Using defaults.`
    );
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

function determineShipClass(unit: FactionCombatUnit): FactionShipClass {
  // Assuming FactionCombatUnit.class is already the correct FactionShipClass
  return unit.class;
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

function determineShipStatus(unit: FactionCombatUnit): CommonShipStatus {
  // Access health via stats property
  if (unit.stats.health <= 0) {
    return CommonShipStatus.DESTROYED;
  }
  // Direct mapping using the correctly imported CommonShipStatus enum
  switch (unit.status.main) {
    case 'active':
      return CommonShipStatus.ACTIVE;
    case 'disabled':
      return CommonShipStatus.INACTIVE; // Use INACTIVE for disabled
    case 'destroyed':
      return CommonShipStatus.DESTROYED;
    default:
      // Ensure the default case handles 'never' type correctly if possible
      const exhaustiveCheck: never = unit.status.main;
      console.warn(`Unknown main status found for unit ${unit.id}: ${exhaustiveCheck}`);
      return CommonShipStatus.IDLE; // Use IDLE as a fallback
  }
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

function determineFormation(units: FactionCombatUnit[]): FactionFleet['formation'] {
  // Basic implementation: Use the first unit's tactics or a default
  const defaultFormation: FactionFleetFormation = {
    // Use imported type
    type: 'balanced',
    spacing: 100,
    facing: 0,
  };

  if (units.length === 0 || !units[0].tactics) {
    return defaultFormation; // Return valid default
  }

  // Derive formation type from tactics if possible, otherwise use default
  // Ensure FactionFleetFormation['type'] includes 'stealth' if used
  let formationType: FactionFleetFormation['type'] = 'balanced';
  if (units[0].tactics.formation) {
    switch (units[0].tactics.formation.toLowerCase()) {
      case 'offensive':
        formationType = 'offensive';
        break;
      case 'defensive':
        formationType = 'defensive';
        break;
      // case 'stealth': // Uncomment if 'stealth' is added to FactionFleetFormation['type']
      //   formationType = 'stealth';
      //   break;
      default:
        if (units[0].tactics.formation.toLowerCase() === 'stealth') {
          console.warn("Mapping 'stealth' formation tactic to 'balanced' display formation.");
        }
        formationType = 'balanced';
    }
  }

  return {
    type: formationType,
    spacing: defaultFormation.spacing,
    facing: units[0].rotation ?? defaultFormation.facing,
  };
}

// Helper function to calculate resource income
function calculateResourceIncome(territory: FactionTerritory): Record<ResourceType, number> {
  // Use ResourceType enum
  // Initialize income record with all resource types
  const income: Partial<Record<ResourceType, number>> = {};
  for (const resType of Object.values(ResourceType)) {
    income[resType] = 0;
  }

  // Calculate income based on available resources
  income[ResourceType.MINERALS] = Math.floor(
    (territory.resources[ResourceType.MINERALS] ?? 0) * 0.1
  );
  income[ResourceType.ENERGY] = Math.floor(
    (territory.resources[ResourceType.ENERGY] ?? 0) * 0.05 +
      (income[ResourceType.MINERALS] ?? 0) * 0.05
  ); // Example: Energy based on itself + minerals
  income[ResourceType.PLASMA] = Math.floor(
    (territory.resources[ResourceType.PLASMA] ?? 0) * 0.1 +
      (territory.resources[ResourceType.EXOTIC] ?? 0) * 0.2
  ); // Example: Plasma based on itself + exotic
  income[ResourceType.EXOTIC] = Math.floor((territory.resources[ResourceType.EXOTIC] ?? 0) * 0.05);
  income[ResourceType.GAS] = Math.floor((territory.resources[ResourceType.GAS] ?? 0) * 0.1);
  income[ResourceType.POPULATION] = Math.floor(
    (territory.resources[ResourceType.POPULATION] ?? 0) * 0.02 +
      (territory.resources[ResourceType.FOOD] ?? 0) * 0.01
  ); // Example: Pop based on itself + food
  income[ResourceType.RESEARCH] = Math.floor(
    (territory.resources[ResourceType.RESEARCH] ?? 0) * 0.03 +
      (territory.resources[ResourceType.EXOTIC] ?? 0) * 0.02
  ); // Example: Research based on itself + exotic
  income[ResourceType.FOOD] = Math.floor(
    (territory.resources[ResourceType.FOOD] ?? 0) * 0.1 +
      (territory.resources[ResourceType.WATER] ?? 0) * 0.05
  ); // Example: Food based on itself + water
  income[ResourceType.WATER] = Math.floor((territory.resources[ResourceType.WATER] ?? 0) * 0.1);
  // Add calculations for other resources if needed

  return income as Record<ResourceType, number>; // Assert the final object type
}

// Helper function to find nearby enemies
function findNearbyEnemies(state: FactionBehaviorState): CombatUnit[] {
  return Array.from(
    combatManager.getUnitsInRange(state.territory.center, state.territory.radius)
  ).filter(unit => {
    // Safely check for faction property
    const unitFaction = 'faction' in unit ? unit.faction : undefined;
    return unitFaction !== undefined && unitFaction !== state.id && unitFaction !== 'neutral';
  });
}

// Helper function to calculate player power
function calculatePlayerPower(): number {
  // Placeholder implementation - needs access to player state
  const playerFactionId: FactionId = 'player';
  const playerState = factionBehaviorManager.getFactionState(playerFactionId);

  if (!playerState) {
    console.warn('Player state not found for power calculation.');
    return 0;
  }

  // Use fleetStrength as a proxy for totalShips if stats isn't available
  const shipCount = playerState.fleetStrength ?? 0; // Changed from playerState.stats?.totalShips

  const resourceScore = Object.values(playerState.territory?.resources ?? {}).reduce(
    (sum, amount) => sum + (amount || 0), // Use || 0 as amount should be number
    0
  );

  // Simple power calculation - refine as needed
  return shipCount * 100 + resourceScore; // Adjust multiplier as needed
}

// Helper function to check for ambush opportunities
function isAmbushOpportunity(state: FactionBehaviorState): boolean {
  // Check if we have enough stealth ships and the enemy is vulnerable
  const stealthShips = state.fleets
    .flatMap(fleet => fleet.ships)
    .filter(ship => ship.class.toLowerCase().includes('stealth')).length; // Be careful with string matching

  const hasEnoughStealthForces = stealthShips >= 3;

  // Consider enemy strength/composition in vulnerability check
  const nearbyEnemies = findNearbyEnemies(state);
  const enemyStrength = calculateFleetStrength(nearbyEnemies);
  // Adapt calculateFleetStrength if needed for FactionShip[] input
  const ownStrength = calculateFleetStrength(state.fleets.flatMap(f => f.ships));

  const enemyIsVulnerable = state.territory.threatLevel < 0.3 && enemyStrength < ownStrength * 0.8; // Example vulnerability check

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
    case 'ambush':
      return 'execute_ambush';
    default:
      // This should ideally be unreachable if types are correct
      const _exhaustiveCheck: never = tactic;
      return 'patrol';
  }
}

// Helper function to select spawn point
function selectSpawnPoint(territory: FactionTerritory): Position {
  // Spawn near the edge, facing outwards initially
  const angle = Math.random() * Math.PI * 2;
  const radius = territory.radius * (0.8 + Math.random() * 0.2); // Spawn closer to the edge

  return {
    x: territory.center.x + radius * Math.cos(angle),
    y: territory.center.y + radius * Math.sin(angle),
    // Could add rotation based on angle: rotation: angle + Math.PI // Facing outwards
  };
}

// Helper function to check if should spawn new ship
function shouldSpawnNewShip(state: FactionBehaviorState, config: FactionConfig): boolean {
  const { maxShips } = config.spawnConditions; // Access maxShips from config

  // Consider resources as well
  const hasEnoughMinerals = (state.territory.resources[ResourceType.MINERALS] ?? 0) > 500; // Example threshold
  const hasEnoughEnergy = (state.territory.resources[ResourceType.ENERGY] ?? 0) > 200; // Example threshold

  return (
    state.stats.totalShips < maxShips &&
    state.behaviorState.aggression > 0.4 && // Slightly lower aggression threshold
    hasEnoughMinerals &&
    hasEnoughEnergy
  ); // Check resources
}

// Helper function to generate control points
function generateControlPoints(center: Position, radius: number): Position[] {
  const points: Position[] = [];
  const numPoints = Math.max(3, Math.floor(radius / 500)); // More points for larger territories
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const pointRadius = radius * (0.6 + Math.random() * 0.3); // Place points within 60-90% of radius
    points.push({
      x: center.x + pointRadius * Math.cos(angle),
      y: center.y + pointRadius * Math.sin(angle),
    });
  }
  return points;
}

// Helper function to calculate threat level
function calculateThreatLevel(
  center: Position,
  radius: number,
  territory: FactionTerritory // Use territory for context if needed
): number {
  // Use combatManager and filter for non-allied, non-self factions
  const nearbyUnits = combatManager.getUnitsInRange(center, radius);
  const enemyStrength = (nearbyUnits as CombatUnit[]) // Cast or ensure correct type
    .filter(unit => {
      const unitFaction =
        'faction' in unit && typeof unit.faction === 'string'
          ? (unit.faction as FactionId)
          : undefined; // Safe access
      return (
        unitFaction !== undefined &&
        unitFaction !== territory.factionId &&
        unitFaction !== 'neutral' &&
        unitFaction !== 'ally'
      );
    })
    .reduce((sum: number, unit: CombatUnit) => {
      // Add types
      let unitHealth = 100; // Default health
      // Safely access 'type' before using it
      if ('type' in unit && typeof unit.type === 'string') {
        const stats = getShipBehaviorStats(unit.type as ShipClass);
        unitHealth = stats?.health ?? 100;
      } else if (
        'stats' in unit &&
        unit.stats &&
        typeof unit.stats === 'object' &&
        'health' in unit.stats &&
        typeof unit.stats.health === 'number'
      ) {
        // Fallback to stats.health if type is missing but stats exist
        unitHealth = unit.stats.health;
      }
      return sum + unitHealth;
    }, 0);

  // Normalize threat level (e.g., based on expected density or max potential strength)
  const maxExpectedStrength = 10000; // Example normalization factor
  const normalizedThreat = Math.min(1, enemyStrength / maxExpectedStrength);

  return normalizedThreat; // Return the normalized threat
}

// Helper function to normalize ship class safely
function normalizeShipClassSafe(shipClass: string): FactionShipClass | undefined {
  const camelCase: string = shipClass.replace(/-([a-z])/g, (_, letter: string) =>
    letter.toUpperCase()
  );
  if (isFactionShipClass(camelCase)) {
    return camelCase;
  }
  console.warn(`Invalid ship class detected during normalization: ${shipClass}`);
  return undefined; // Indicate failure
}

// Combat tactics update function
function updateCombatTactics(state: FactionBehaviorState): void {
  // Adjust tactics based on current situation (e.g., number of enemies, resources)
  const nearbyEnemies = findNearbyEnemies(state);
  const playerPower = calculatePlayerPower();

  const oldTactics = { ...state.combatTactics }; // Store old tactics for event

  if (nearbyEnemies.length > state.stats.totalShips * 1.5) {
    // Outnumbered, consider defensive tactics or retreat
    state.combatTactics.formationStyle = 'defensive';
    state.combatTactics.retreatThreshold = 0.6; // Retreat earlier
    state.combatTactics.targetPriority = 'stations'; // Focus key targets if defensive
  } else if (playerPower > state.stats.totalShips * 100 * 1.2) {
    // Slightly higher threshold
    // Facing significantly stronger player, be cautious
    state.combatTactics.preferredRange = 'long';
    state.combatTactics.retreatThreshold = 0.7;
    state.combatTactics.formationStyle = 'defensive';
  } else if (state.behaviorState.aggression > 0.7) {
    // Default aggressive tactics if aggression is high
    state.combatTactics.formationStyle = 'aggressive';
    state.combatTactics.preferredRange = 'medium';
    state.combatTactics.retreatThreshold = 0.4;
    state.combatTactics.targetPriority = 'ships'; // Focus enemy ships
  } else {
    // Balanced approach otherwise
    state.combatTactics.formationStyle = 'balanced';
    state.combatTactics.preferredRange = 'medium';
    state.combatTactics.retreatThreshold = 0.5;
    state.combatTactics.targetPriority = 'ships';
  }

  // Check if tactics actually changed before emitting event
  if (JSON.stringify(oldTactics) !== JSON.stringify(state.combatTactics)) {
    const tacticsEvent: CombatTacticsChangedEvent = {
      factionId: state.id,
      oldTactics,
      newTactics: state.combatTactics,
    };
    // Use factionBehaviorManager to emit the event
    factionBehaviorManager.emit(FactionEventType.COMBAT_TACTICS_CHANGED, tacticsEvent);
  }
}

// Resource management function
function manageResources(state: FactionBehaviorState): void {
  // Update resource priorities based on current needs and tactic
  let priority: ResourceType[] = [];
  if (state.behaviorState.currentTactic === 'expand') {
    priority = [ResourceType.MINERALS, ResourceType.ENERGY, ResourceType.POPULATION];
  } else if (
    state.behaviorState.currentTactic === 'raid' ||
    state.combatTactics.formationStyle === 'aggressive'
  ) {
    priority = [ResourceType.ENERGY, ResourceType.PLASMA, ResourceType.MINERALS]; // Fueling ships
  } else {
    // Default/Defensive: Balance needs
    priority = [ResourceType.MINERALS, ResourceType.ENERGY, ResourceType.FOOD, ResourceType.GAS];
  }
  // Add less common resources towards the end
  priority.push(ResourceType.EXOTIC, ResourceType.RESEARCH);

  state.resourceManagement.gatheringPriority = [...new Set(priority)]; // Ensure unique

  // Adjust stockpile thresholds based on expansion plans and current tactic
  // Define some base thresholds (example)
  const baseThresholds: Record<ResourceType, number> = {
    [ResourceType.FOOD]: 1500,
    [ResourceType.MINERALS]: 1500,
    [ResourceType.ENERGY]: 1500,
    [ResourceType.PLASMA]: 800,
    [ResourceType.EXOTIC]: 400,
    [ResourceType.GAS]: 1000,
    [ResourceType.POPULATION]: 400,
    [ResourceType.RESEARCH]: 800,
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
    [ResourceType.ORGANIC]: 600,
  };

  if (state.expansionStrategy.systemPriority === 'resources') {
    state.resourceManagement.stockpileThresholds = {
      ...baseThresholds, // Start with base
      [ResourceType.MINERALS]: 3000, // Higher mineral need for expansion
      [ResourceType.ENERGY]: 2000,
      [ResourceType.GAS]: 1500,
    };
  } else {
    state.resourceManagement.stockpileThresholds = baseThresholds;
  }
}

// Expansion planning function
function planExpansion(state: FactionBehaviorState): void {
  // Calculate optimal expansion direction (placeholder used)
  const newDirection = calculateOptimalExpansionDirection(state);
  state.expansionStrategy.expansionDirection = newDirection;

  // Adjust system priority based on needs
  const lowMinerals = (state.stats.resourceIncome[ResourceType.MINERALS] ?? 0) < 100;
  const lowEnergy = (state.stats.resourceIncome[ResourceType.ENERGY] ?? 0) < 100;
  const lowPopulation = (state.stats.resourceIncome[ResourceType.POPULATION] ?? 0) < 20; // Example threshold

  if (lowMinerals || lowEnergy) {
    state.expansionStrategy.systemPriority = 'resources';
  } else if (lowPopulation && state.stats.territorySystems > 3) {
    // Prioritize population if established
    state.expansionStrategy.systemPriority = ResourceType.POPULATION;
  } else if (state.stats.territorySystems < 5) {
    // Prioritize strategic locations early on
    state.expansionStrategy.systemPriority = 'strategic';
  } else {
    // Default back to resources if other needs met
    state.expansionStrategy.systemPriority = 'resources';
  }

  // Set colonization threshold based on resources and threat
  const resourceScore =
    (state.territory.resources[ResourceType.MINERALS] ?? 0) +
    (state.territory.resources[ResourceType.ENERGY] ?? 0);
  state.expansionStrategy.colonizationThreshold =
    resourceScore > 5000 && state.territory.threatLevel < 0.4 ? 0.8 : 0.5; // Example logic

  // Set max territory based on faction config or other factors
  // Correct nullish coalescing precedence
  const maxTerritoryBase = factionConfigs[state.id]?.spawnConditions?.maxShips;
  state.expansionStrategy.maxTerritory =
    (maxTerritoryBase !== undefined ? maxTerritoryBase * 1000 : undefined) ?? 10000;

  // Set consolidation threshold - e.g., focus on current territory if threat is high
  state.expansionStrategy.consolidationThreshold = state.territory.threatLevel > 0.6 ? 0.7 : 0.3;
}

// Faction-specific behavior functions
function executeSpaceRatsBehavior(state: FactionBehaviorState): void {
  // Specific logic for Space Rats: scavenging, ambushing weak targets
  if (Math.random() < 0.3 && state.behaviorState.currentTactic !== 'raid') {
    // Avoid constant switching
    // Chance to go scavenging
    state.behaviorState.currentTactic = 'raid'; // Represent scavenging as raiding
    state.behaviorState.nextAction = 'Find Scavenge Target';
  } else if (state.behaviorState.currentTactic === 'raid' && Math.random() < 0.1) {
    // Chance to stop raiding/scavenging
    state.behaviorState.currentTactic = 'defend'; // Switch back to patrol/defend
    state.behaviorState.nextAction = 'Patrol Territory';
  } else if (state.behaviorState.currentTactic !== 'raid') {
    // Default patrolling/attacking behavior if not raiding
    updateDefaultBehavior(state);
  }
}

function executeLostNovaBehavior(state: FactionBehaviorState): void {
  // Specific logic for Lost Nova: stealth, high-value targets, hit-and-run
  if (
    state.behaviorState.currentTactic !== 'ambush' &&
    isAmbushOpportunity(state) &&
    Math.random() < 0.4
  ) {
    state.behaviorState.currentTactic = 'ambush'; // Switch to ambush tactic
    state.behaviorState.nextAction = 'Prepare Ambush';
  } else if (state.behaviorState.currentTactic === 'ambush') {
    // Logic to potentially exit ambush state (e.g., after attack or if detected)
    if (
      state.stateMachine.triggers.has('AMBUSH_SUCCESS') ||
      state.stateMachine.triggers.has('AMBUSH_FAILED')
    ) {
      state.behaviorState.currentTactic = 'defend'; // Go back to hiding/defending
      state.behaviorState.nextAction = 'Evaluate';
    }
  } else {
    // Default behavior if not ambushing
    updateDefaultBehavior(state);
  }
}

function executeEquatorHorizonBehavior(state: FactionBehaviorState): void {
  // Specific logic for Equator Horizon: enforcing balance, responding to threats
  const playerPower = calculatePlayerPower();
  // Use nullish coalescing for safer access
  const powerThreshold = state.specialRules?.powerThreshold ?? Infinity;

  if (playerPower > powerThreshold && state.behaviorState.currentTactic !== 'defend') {
    state.behaviorState.currentTactic = 'defend'; // Represent enforcing balance as defend
    state.behaviorState.nextAction = 'Enforce Balance';
  } else if (
    playerPower <= powerThreshold &&
    state.behaviorState.currentTactic === 'defend' &&
    state.behaviorState.lastAction === 'Enforce Balance'
  ) {
    // If balance restored and we were enforcing, switch back
    state.behaviorState.currentTactic = 'defend'; // Or maybe 'trade'/'expand' depending on overall state
    state.behaviorState.nextAction = 'Evaluate';
  } else if (state.behaviorState.currentTactic !== 'defend') {
    // Only update default if not enforcing
    updateDefaultBehavior(state);
  }
}

// Default behavior update logic (can be expanded)
function updateDefaultBehavior(state: FactionBehaviorState): void {
  // Avoid overriding specific states like 'ambush'
  if (['ambush'].includes(state.behaviorState.currentTactic)) {
    return;
  }

  if (state.behaviorState.aggression > 0.7) {
    state.behaviorState.currentTactic = 'raid';
    state.behaviorState.nextAction = 'Find Raid Target';
  } else if (state.behaviorState.expansion > 0.5 && state.territory.threatLevel < 0.5) {
    // Only expand if relatively safe
    state.behaviorState.currentTactic = 'expand';
    state.behaviorState.nextAction = 'Find Expansion Location';
  } else {
    state.behaviorState.currentTactic = 'defend'; // Default to defend/patrol
    state.behaviorState.nextAction = 'Patrol Territory';
  }
}

// Update updateFleets function with proper type handling
function updateFleets(units: CombatUnit[]): FactionFleet[] {
  const fleets: FactionFleet[] = [];
  const assignedUnits = new Set<string>();

  // Group units by faction first
  const unitsByFaction: Partial<Record<FactionId, CombatUnit[]>> = {}; // Initialize as Partial
  units.forEach(unit => {
    // Safely check and get faction, default to 'neutral'
    const factionId: FactionId =
      'faction' in unit && typeof unit.faction === 'string' && unit.faction
        ? (unit.faction as FactionId)
        : 'neutral';

    // Initialize array if it doesn't exist
    if (!unitsByFaction[factionId]) {
      unitsByFaction[factionId] = [];
    }
    // Add unit to the correct faction group
    unitsByFaction[factionId]?.push(unit); // Use optional chaining for safety
  });

  Object.values(unitsByFaction).forEach(factionGroup => {
    if (!factionGroup) return; // Skip if group is undefined (due to Partial)

    factionGroup.forEach(unit => {
      if (assignedUnits.has(unit.id)) {
        return;
      }

      // Find nearby units *of the same faction*
      const nearbyUnits = factionGroup.filter(
        other =>
          !assignedUnits.has(other.id) && calculateDistance(unit.position, other.position) < 500 // Use integrated function
      );

      if (nearbyUnits.length >= 3) {
        // Fleet threshold
        // Safely convert units, filtering out invalid ones
        const factionUnits: FactionCombatUnit[] = nearbyUnits
          .map(u => {
            const normalizedClass = normalizeShipClassSafe(u.type);
            if (!normalizedClass) {
              console.error(`Skipping unit ${u.id} due to invalid type: ${u.type}`);
              return null;
            }
            // Safely check and get faction, default to 'neutral'
            const unitFactionId: FactionId =
              'faction' in u && typeof u.faction === 'string' && u.faction
                ? (u.faction as FactionId)
                : 'neutral';
            return convertToFactionCombatUnit(u, unitFactionId, normalizedClass);
          })
          .filter((unit): unit is FactionCombatUnit => unit !== null); // Filter out nulls

        if (factionUnits.length < 3) {
          return;
        } // Not enough valid units for a fleet

        // Ensure FactionShip.status uses CommonShipStatus or convert
        const factionShips: FactionShip[] = factionUnits.map((u): FactionShip => {
          // Add return type
          const baseStats = getShipBehaviorStats(u.class as unknown as ShipClass);

          const tacticsConfig = u.tactics;
          const rawBehavior = tacticsConfig?.behavior ?? 'defensive';

          let mappedBehavior: FactionBehaviorType;
          switch (rawBehavior) {
            case 'aggressive':
            case 'defensive':
            case 'passive': // Add expected types
            case 'evasive':
              mappedBehavior = rawBehavior;
              break;
            default:
              console.warn(
                `Unknown behavior type '${rawBehavior}' encountered for unit ${u.id}. Defaulting to 'defensive'.`
              );
              mappedBehavior = 'defensive';
              break;
          }

          const shipTactics: FactionBehaviorConfig = {
            formation: tacticsConfig?.formation ?? 'balanced',
            behavior: mappedBehavior,
            target: tacticsConfig?.target,
          };

          // Determine ship status using the helper function
          const currentShipStatus = determineShipStatus(u);

          // Map CommonShipStatus to FactionShip['status'] if needed
          // This depends on the actual definition of FactionShip['status']
          const finalStatus: FactionShip['status'] =
            currentShipStatus as unknown as FactionShip['status']; // Adjust casting/mapping

          return {
            id: u.id,
            name: `${u.class}-${u.id.slice(-4)}`, // More unique name
            category: 'combat', // Or determine based on class/role
            status: finalStatus, // Assign the correctly typed/mapped status
            faction: u.faction,
            class: u.class,
            health: u.stats.health,
            maxHealth: u.stats.maxHealth,
            shield: u.stats.shield,
            maxShield: u.stats.maxShield,
            position: u.position,
            rotation: u.rotation ?? 0,
            tactics: shipTactics,
            stats: {
              // Populate stats more fully if possible
              ...baseStats, // Start with base stats
              health: u.stats.health, // Override with current
              maxHealth: u.stats.maxHealth,
              shield: u.stats.shield,
              maxShield: u.stats.maxShield,
              speed: u.stats.speed,
              turnRate: u.stats.turnRate,
              defense: {
                armor: u.stats.armor,
                shield: u.stats.shield, // Already present? Redundant?
                evasion: u.stats.evasion,
                regeneration: baseStats?.defense?.regeneration ?? 1,
              },
              mobility: {
                speed: u.stats.speed, // Redundant?
                turnRate: u.stats.turnRate, // Redundant?
                acceleration: baseStats?.mobility?.acceleration ?? 50,
              },
            },
            abilities: u.specialAbility ? [{ name: u.specialAbility.name, level: 1 }] : [], // Map special ability if exists
          };
        });

        // Determine fleet status based on CommonShipStatus, then map to FactionFleet['status']
        let commonFleetStatus: CommonShipStatus = CommonShipStatus.IDLE;
        // Use actual CommonShipStatus members for comparison
        if (
          factionShips.some(
            s => s.status === (CommonShipStatus.COMBAT as unknown as FactionShip['status'])
          )
        ) {
          // Compare safely
          commonFleetStatus = CommonShipStatus.COMBAT;
        } else if (
          factionShips.some(
            s => s.status === (CommonShipStatus.MOVING as unknown as FactionShip['status'])
          )
        ) {
          // Compare safely
          commonFleetStatus = CommonShipStatus.MOVING;
        } else if (
          factionShips.every(
            s => s.status === (CommonShipStatus.DESTROYED as unknown as FactionShip['status'])
          )
        ) {
          // Compare safely
          commonFleetStatus = CommonShipStatus.DESTROYED;
        }

        // Map commonFleetStatus to the type expected by FactionFleet['status']
        const finalFleetStatus: FactionFleet['status'] =
          commonFleetStatus as unknown as FactionFleet['status']; // Adjust casting/mapping

        fleets.push({
          id: `fleet-${unit.id}-${Date.now()}`.slice(0, 15),
          name: `Fleet ${fleets.length + 1}`,
          ships: factionShips,
          formation: determineFormation(factionUnits),
          strength: calculateFleetStrength(factionUnits), // Calculate strength on converted units
          status: finalFleetStatus, // Assign the correctly typed/mapped status
        });

        nearbyUnits.forEach(u => assignedUnits.add(u.id));
      }
    });
  });

  return fleets;
}

// Convert local FactionTerritory to StandardizedFactionTerritory\

// Convert local FactionFleet to event FactionFleet
// Assume FactionFleetEvent ship status and formation use compatible types (like CommonShipStatus)
function convertToEventFleet(fleet: FactionFleet): FactionFleetEvent['fleets'][0] {
  // Determine fleet position (e.g., centroid of ships)
  let fleetPosition = { x: 0, y: 0 };
  if (fleet.ships.length > 0) {
    fleetPosition = {
      x: fleet.ships.reduce((sum, s) => sum + s.position.x, 0) / fleet.ships.length,
      y: fleet.ships.reduce((sum, s) => sum + s.position.y, 0) / fleet.ships.length,
    };
  }

  return {
    id: fleet.id,
    name: fleet.name,
    ships: fleet.ships.map(ship => ({
      id: ship.id,
      name: ship.name,
      type: ship.class,
      // Safely access level using optional chaining and nullish coalescing
      level:
        ship.stats &&
        typeof ship.stats === 'object' &&
        'level' in ship.stats &&
        typeof ship.stats.level === 'number'
          ? ship.stats.level
          : 1,
      // Cast or map status to match event definition
      status: ship.status as FactionFleetEvent['fleets'][0]['ships'][0]['status'],
    })),
    formation: {
      // Cast or map formation type to match event definition
      type: fleet.formation.type as FactionFleetEvent['fleets'][0]['formation']['type'],
      spacing: fleet.formation.spacing,
      facing: fleet.formation.facing,
    },
    // Cast or map status to match event definition
    status: fleet.status as FactionFleetEvent['fleets'][0]['status'],
    position: fleetPosition,
  };
}

function convertToEventTerritory(
  territory: FactionTerritory,
  factionId: FactionId
): FactionTerritory {
  // Assuming event expects FactionTerritory type
  return {
    ...territory,
    factionId,
  };
}

// After the existing useFactionBehavior hook, add the new hook

/**
 * Hook for managing faction combat equipment and ship configurations
 *
 * Provides utility functions for:
 * - Converting weapon systems to proper instances and mounts
 * - Checking ship status conditions
 * - Determining optimal ship configurations
 * - Calculating distances and formations
 *
 * @param factionId The ID of the faction
 * @returns Faction combat equipment utilities
 */
export function useFactionCombatEquipment(factionId: FactionId) {
  const [combatEquipment, setCombatEquipment] = useState<{
    weaponInstances: Map<string, WeaponInstance>;
    weaponMounts: Map<string, WeaponMount[]>;
    shipClassMap: Map<string, FactionShipClass>;
    shipStatusMap: Map<string, CommonShipStatus>;
    formationConfigs: Record<
      string,
      {
        type: FactionFleetFormation['type']; // Use imported type
        spacing: number;
        facing: number;
      }
    >;
  }>({
    weaponInstances: new Map(),
    weaponMounts: new Map(),
    shipClassMap: new Map(),
    shipStatusMap: new Map(),
    formationConfigs: {},
  });

  /**
   * Convert a weapon system to a weapon instance with faction-specific adjustments
   * @param weapon The weapon system to convert
   * @param factionModifiers Optional faction-specific modifiers
   * @returns A fully configured weapon instance
   */
  const createWeaponInstance = useCallback(
    (
      weapon: WeaponSystem,
      factionModifiers?: {
        damageMultiplier?: number;
        rangeMultiplier?: number;
        cooldownReduction?: number;
      }
    ): WeaponInstance => {
      const baseInstance = convertToWeaponInstance(weapon);

      if (factionModifiers) {
        const {
          damageMultiplier = 1,
          rangeMultiplier = 1,
          cooldownReduction = 0,
        } = factionModifiers;

        if (damageMultiplier !== 1) {
          baseInstance.state.currentStats.damage = Math.round(
            baseInstance.state.currentStats.damage * damageMultiplier
          );
        }
        if (rangeMultiplier !== 1) {
          baseInstance.state.currentStats.range = Math.round(
            baseInstance.state.currentStats.range * rangeMultiplier
          );
        }
        if (cooldownReduction > 0) {
          baseInstance.state.currentStats.cooldown = Math.max(
            0.25,
            baseInstance.state.currentStats.cooldown - cooldownReduction
          );
        }
      }

      setCombatEquipment(prev => {
        const updatedInstances = new Map(prev.weaponInstances);
        updatedInstances.set(weapon.id, baseInstance);
        return { ...prev, weaponInstances: updatedInstances };
      });

      return baseInstance;
    },
    [factionId]
  );

  /**
   * Generate weapon mounts for a ship with faction-specific configurations
   * @param weapons The weapon systems to convert to mounts
   * @param shipId The ID of the ship
   * @returns Array of weapon mounts
   */
  const createWeaponMounts = useCallback(
    (weapons: WeaponSystem[], shipId: string): WeaponMount[] => {
      const mounts = convertToWeaponMounts(weapons);
      setCombatEquipment(prev => {
        const updatedMounts = new Map(prev.weaponMounts);
        updatedMounts.set(shipId, mounts);
        return { ...prev, weaponMounts: updatedMounts };
      });
      return mounts;
    },
    []
  );

  /**
   * Check if a unit has a specific status effect
   * @param unit The combat unit to check
   * @param statusToCheck The status to check for
   * @returns Whether the unit has the specified status
   */
  const checkUnitStatus = useCallback(
    (unit: CombatUnit | FactionCombatUnit, statusToCheck: string): boolean => {
      return hasStatus(unit, statusToCheck);
    },
    []
  );

  /**
   * Calculate distance between two positions
   * @param a First position
   * @param b Second position
   * @returns Distance between positions
   */
  const getDistanceBetween = useCallback((a: Position, b: Position): number => {
    return calculateDistance(a, b);
  }, []);

  /**
   * Determine appropriate ship class based on faction and unit characteristics
   * @param unit The faction combat unit
   * @returns Appropriate ship class (FactionShipClass - camelCase)
   */
  const getShipClass = useCallback((unit: FactionCombatUnit): FactionShipClass => {
    const shipClass = determineShipClass(unit);
    setCombatEquipment(prev => {
      const updatedShipClassMap = new Map(prev.shipClassMap);
      updatedShipClassMap.set(unit.id, shipClass);
      return { ...prev, shipClassMap: updatedShipClassMap };
    });
    return shipClass;
  }, []);

  /**
   * Determine the current status of a faction ship based on health and other factors
   * @param unit The faction combat unit
   * @returns Current ship status
   */
  const getShipStatus = useCallback((unit: FactionCombatUnit): CommonShipStatus => {
    const status = determineShipStatus(unit);
    setCombatEquipment(prev => {
      const updatedStatusMap = new Map(prev.shipStatusMap);
      updatedStatusMap.set(unit.id, status);
      return { ...prev, shipStatusMap: updatedStatusMap };
    });
    return status;
  }, []);

  /**
   * Calculate optimal formation for a group of ships
   * @param units Array of faction combat units
   * @param formationName Optional name to track this formation
   * @returns Optimal formation configuration
   */
  const getOptimalFormation = useCallback(
    (units: FactionCombatUnit[], formationName?: string): FactionFleet['formation'] => {
      const formation = determineFormation(units);
      if (formationName) {
        setCombatEquipment(prev => {
          const updatedFormationConfigs = { ...prev.formationConfigs };
          updatedFormationConfigs[formationName] = {
            type: formation.type,
            spacing: formation.spacing,
            facing: formation.facing,
          };
          return {
            ...prev,
            formationConfigs: updatedFormationConfigs,
          };
        });
      }
      return formation;
    },
    []
  );

  /**
   * Normalize and validate a ship class string
   * @param shipClass The ship class string to normalize
   * @returns Normalized faction ship class
   */
  const standardizeShipClass = useCallback((shipClass: string): FactionShipClass => {
    const normalized = normalizeShipClassSafe(shipClass);
    if (!normalized) {
      console.error(`Failed to normalize ship class: ${shipClass}. Using default.`);
      return 'spitflare' as FactionShipClass;
    }
    return normalized;
  }, []);

  return {
    // Weapon management
    createWeaponInstance,
    createWeaponMounts,

    // Status and position utilities
    checkUnitStatus,
    getDistanceBetween,

    // Ship classification
    getShipClass,
    getShipStatus,
    standardizeShipClass,

    // Formation management
    getOptimalFormation,

    // Current state
    combatEquipment,
  };
}
