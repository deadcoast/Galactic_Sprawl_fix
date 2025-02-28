import { CommonShipStats, ShipStatus as CommonShipStatus } from '../../types/ships/CommonShipTypes';
import { useEffect, useState, useCallback } from 'react';
import {
  FactionShipClass,
  FactionShipStats,
  FactionFleet,
  FactionShip,
  ShipStatsWithWeapons
} from '../../types/ships/FactionShipTypes';
import { SHIP_STATS as CONFIG_SHIP_STATS } from '../../config/ships';
import { Effect, Position } from '../../types/core/GameTypes';
import { moduleEventBus, ModuleEventType, ModuleEvent } from '../../lib/modules/ModuleEvents';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { CombatUnit, CombatUnitStatus } from '../../types/combat/CombatTypes';
import { EventEmitter } from '../../lib/utils/EventEmitter';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { FactionId, FactionBehaviorType, FactionState } from '../../types/ships/FactionTypes';
import { AsteroidFieldManager } from '../../managers/game/AsteroidFieldManager';
import {
  WeaponConfig,
  WeaponInstance,
  WeaponMount,
  WeaponMountSize,
  WeaponMountPosition,
  WeaponCategory,
  WeaponStatus,
  WeaponType,
  WeaponSystem,
  CombatWeaponStats
} from '../../types/weapons/WeaponTypes';
import {
  Vector2D,
  BoundingBox,
  getDistance,
  getAngle,
  getPointAtDistance,
  getCircularFormationPoints,
  normalizeVector,
  scaleVector,
  addVectors,
  isPointInBox,
  rotatePoint,
  interpolatePosition,
  isWithinRadius
} from '../../utils/geometry';
import {
  convertToFactionCombatUnit,
  convertToBaseCombatUnit,
  convertWeaponMountToSystem,
  convertWeaponSystemToMount,
  isFactionCombatUnit,
  isBaseCombatUnit
} from '../../utils/typeConversions';
import {
  WeaponSystemType,
  isWeaponSystemType,
  convertWeaponCategoryToSystemType,
  convertSystemTypeToWeaponCategory,
  isValidWeaponMount,
  isValidWeaponSystem
} from '../../utils/weapons/weaponTypeConversions';

// Define weapon system interface for faction combat
export interface FactionWeaponSystem extends WeaponSystem {
  mountInfo?: {
    size: WeaponMountSize;
    position: WeaponMountPosition;
    rotation: number;
    allowedCategories: WeaponCategory[];
  };
}

// Convert weapon system to weapon instance
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
      effects: []
    },
    visualAsset: 'default_weapon',
    mountRequirements: {
      size: 'medium' as WeaponMountSize,
      power: 100
    }
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
      effects: []
    },
    effects: []
  };

  return { config, state };
}

// Convert combat unit weapons to weapon mounts
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
export interface FactionCombatUnit extends Omit<CombatUnit, 'status' | 'faction' | 'weapons' | 'stats'> {
  faction: FactionId;
  class: FactionShipClass;
  tactics: FactionBehaviorType;
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

// Keep only one implementation of hasStatus
function hasStatus(unit: CombatUnit | FactionCombatUnit, status: CombatUnitStatus['main'] | CombatUnitStatus['secondary'] | string): boolean {
  if (typeof status === 'string') {
    return unit.status.effects.includes(status);
  }
  return unit.status.main === status || unit.status.secondary === status;
}

// Helper function to check if array is FactionCombatUnit[]
function isFactionCombatUnitArray(units: CombatUnit[] | FactionCombatUnit[]): units is FactionCombatUnit[] {
  return units.length > 0 && isFactionCombatUnit(units[0]);
}

// Helper function to convert CombatUnit to FactionCombatUnit
function convertUnitsToFaction(units: CombatUnit[], defaultFaction: FactionId): FactionCombatUnit[] {
  return units.map(unit => {
    const baseStats = getShipBehaviorStats(unit.type as unknown as ShipClass);
    
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
        behavior: 'aggressive',
        target: undefined
      },
      weaponMounts: unit.weapons.map((weapon, index) => ({
        id: `mount-${index}`,
        size: 'medium' as const,
        position: index % 2 === 0 ? 'front' as const : 'side' as const,
        rotation: 0,
        allowedCategories: [weapon.type as WeaponCategory]
      })),
      weapons: unit.weapons.map(w => ({
        ...w,
        upgrades: []
      })),
      formation: {
        type: 'balanced',
        spacing: 100,
        facing: 0,
        position: 0
      },
      stats: {
        ...unit.stats,
        accuracy: 0.8,
        evasion: 0.2,
        criticalChance: 0.1,
        criticalDamage: 1.5,
        armorPenetration: 0,
        shieldPenetration: 0,
        experience: 0,
        level: 1
      },
      status: unit.status,
      experience: {
        current: 0,
        total: 0,
        level: 1,
        skills: []
      }
    };

    return factionUnit;
  });
}

// Update calculateFleetStrength to handle type conversion
function calculateFleetStrength(units: CombatUnit[] | FactionCombatUnit[]): number {
  const factionUnits = isFactionCombatUnitArray(units) ? units : convertUnitsToFaction(units, 'neutral');
  return factionUnits.reduce((total, unit) => {
    const weaponDamage = unit.weapons.reduce((sum, weapon) => sum + weapon.damage, 0);
    return total + weaponDamage;
  }, 0);
}

// Add FACTION_SHIPS constant
const FACTION_SHIPS: Record<FactionId, ShipClass[]> = {
  'player': ['spitflare', 'starSchooner', 'orionFrigate'] as ShipClass[],
  'enemy': ['harbringerGalleon', 'midwayCarrier', 'motherEarthRevenge'] as ShipClass[],
  'neutral': ['starSchooner', 'orionFrigate'] as ShipClass[],
  'ally': ['spitflare', 'orionFrigate'] as ShipClass[],
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
    'black-void-buccaneer'
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
    'forbidden-vanguard'
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
    'harmonys-vanguard'
  ] as ShipClass[]
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
  resources: {
    minerals: number;
    gas: number;
    exotic: number;
  };
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
    resourceIncome: {
      minerals: number;
      energy: number;
      plasma: number;
      exotic: number;
      gas: number;
      population: number;
      research: number;
    };
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
    systemPriority: 'resources' | 'strategic' | 'population';
    colonizationThreshold: number;
    maxTerritory: number;
    consolidationThreshold: number;
  };
}

// Create faction behavior event emitter
class FactionBehaviorEventEmitter extends EventEmitter<FactionBehaviorEvents> {}
const factionBehaviorEvents = new FactionBehaviorEventEmitter();

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
export const FACTION_CONFIGS: Record<FactionId, {
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
}> = {
  'player': {
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
  'enemy': {
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
  'neutral': {
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
  'ally': {
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
  'player': 'active',
  'enemy': 'aggressive',
  'neutral': 'patrolling',
  'ally': 'patrolling',
  'space-rats': 'patrolling',
  'lost-nova': 'hiding',
  'equator-horizon': 'dormant'
};

// Define state transitions for each faction
const STATE_TRANSITIONS: Record<FactionId, StateMachineTransition[]> = {
  'player': [
    { currentState: 'active', event: 'TAKE_DAMAGE', nextState: 'aggressive' },
    { currentState: 'aggressive', event: 'HEAVY_DAMAGE', nextState: 'retreating' },
    { currentState: 'retreating', event: 'SAFE_DISTANCE', nextState: 'active' }
  ],
  'enemy': [
    { currentState: 'aggressive', event: 'DETECT_TARGET', nextState: 'pursuing' },
    { currentState: 'pursuing', event: 'ENGAGE_RANGE', nextState: 'attacking' },
    { currentState: 'attacking', event: 'HEAVY_DAMAGE', nextState: 'retreating' },
    { currentState: 'retreating', event: 'SAFE_DISTANCE', nextState: 'aggressive' }
  ],
  'neutral': [
    { currentState: 'patrolling', event: 'TAKE_DAMAGE', nextState: 'retreating' },
    { currentState: 'retreating', event: 'SAFE_DISTANCE', nextState: 'patrolling' }
  ],
  'ally': [
    { currentState: 'patrolling', event: 'DETECT_TARGET', nextState: 'pursuing' },
    { currentState: 'pursuing', event: 'ENGAGE_RANGE', nextState: 'attacking' },
    { currentState: 'attacking', event: 'HEAVY_DAMAGE', nextState: 'retreating' },
    { currentState: 'retreating', event: 'SAFE_DISTANCE', nextState: 'patrolling' }
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
    case 'exotic':
      return 3.0;
    case 'gas':
      return 2.0;
    case 'minerals':
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
        minerals: 0,
        gas: 0,
        exotic: 0,
      },
      threatLevel: 0,
      factionId,
    },
    relationships: {
      'player': 0,
      'enemy': -0.8,
      'neutral': 0,
      'ally': 0.8,
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
        minerals: 0,
        energy: 0,
        plasma: 0,
        exotic: 0,
        gas: 0,
        population: 0,
        research: 0,
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
        minerals: 0,
        energy: 0,
        plasma: 0,
        exotic: 0,
        gas: 0,
        population: 0,
        research: 0,
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

            factionBehaviorEvents.emit('combatTacticsChanged', {
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
        case 'behaviorChanged':
          const { oldBehavior, newBehavior } = event as FactionBehaviorEvents['behaviorChanged'];
          console.debug(
            `[FactionBehavior] ${factionId} behavior changed from ${oldBehavior} to ${newBehavior}`
          );
          break;

        case 'fleetUpdated':
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

        case 'territoryChanged':
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

        case 'relationshipChanged':
          const { targetFaction, oldValue, newValue } =
            event as FactionBehaviorEvents['relationshipChanged'];
          setBehavior(prev => ({
            ...prev,
            relationships: {
              ...prev.relationships,
              [targetFaction]: newValue,
            },
          }));
          console.debug(
            `[FactionBehavior] ${factionId} relationship with ${targetFaction} changed from ${oldValue} to ${newValue}`
          );
          break;

        case 'resourcesUpdated':
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
          console.debug(
            `[FactionBehavior] ${factionId} ${resourceType} income changed from ${oldAmount} to ${newAmount}`
          );
          break;

        case 'combatTacticsChanged':
          const { oldTactics, newTactics } = event as FactionBehaviorEvents['combatTacticsChanged'];
          setBehavior(prev => ({
            ...prev,
            combatTactics: newTactics,
          }));
          console.debug(
            `[FactionBehavior] ${factionId} combat tactics updated:
          Range: ${oldTactics.preferredRange} -> ${newTactics.preferredRange}
          Formation: ${oldTactics.formationStyle} -> ${newTactics.formationStyle}
          Priority: ${oldTactics.targetPriority} -> ${newTactics.targetPriority}`
          );
          break;
      }
    },
    [factionId]
  );

  const updateFactionBehavior = useCallback(() => {
    const nearbyUnits = Array.from(
      combatManager.getUnitsInRange(behavior.territory.center, behavior.territory.radius)
    );

    // Update fleets based on nearby units
    const updatedFleets = updateFleets(nearbyUnits);
    if (updatedFleets.length !== behavior.fleets.length) {
      factionBehaviorEvents.emit('fleetUpdated', {
        factionId,
        fleets: updatedFleets,
      });
    }

    // Update territory based on unit positions
    const updatedTerritory = calculateTerritory(nearbyUnits, behavior.territory);
    if (updatedTerritory.radius !== behavior.territory.radius) {
      factionBehaviorEvents.emit('territoryChanged', {
        factionId,
        territory: updatedTerritory,
      });
    }

    // Update resource income
    const newResourceIncome = calculateResourceIncome(behavior.territory);
    Object.entries(newResourceIncome).forEach(([resourceType, newAmount]) => {
      const oldAmount =
        behavior.stats.resourceIncome[resourceType as keyof typeof newResourceIncome];
      if (oldAmount !== newAmount) {
        factionBehaviorEvents.emit('resourcesUpdated', {
          factionId,
          resourceType: resourceType as ResourceType,
          oldAmount,
          newAmount,
        });
      }
    });

    // Update relationships with other factions
    const updatedRelationships = calculateRelationships(factionId, behavior.relationships);
    Object.entries(updatedRelationships).forEach(([targetFaction, newValue]) => {
      const oldValue = behavior.relationships[targetFaction as FactionId];
      if (oldValue !== newValue) {
        factionBehaviorEvents.emit('relationshipChanged', {
          factionId,
          targetFaction: targetFaction as FactionId,
          oldValue,
          newValue,
        });
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

    const unsubscribeCallbacks = [
      'behaviorChanged',
      'fleetUpdated',
      'territoryChanged',
      'relationshipChanged',
      'resourcesUpdated',
      'combatTacticsChanged',
    ].map(eventType => {
      const callback = (event: FactionBehaviorEvents[keyof FactionBehaviorEvents]) => {
        if ('factionId' in event && event.factionId === factionId) {
          handleBehaviorEvent(eventType as keyof FactionBehaviorEvents, event);
        }
      };
      factionBehaviorEvents.subscribe(eventType as keyof FactionBehaviorEvents, callback);
      return () =>
        factionBehaviorEvents.unsubscribe(eventType as keyof FactionBehaviorEvents, callback);
    });

    const updateInterval = setInterval(updateFactionBehavior, 1000);

    return () => {
      unsubscribeModuleEvents();
      unsubscribeCallbacks.forEach(callback => callback());
      clearInterval(updateInterval);
    };
  }, [factionId, handleModuleEvent, handleBehaviorEvent, updateFactionBehavior]);

  return behavior;
}

// Map kebab-case ship classes to camelCase
function mapShipClass(shipClass: ShipClass): FactionShipClass {
  const camelCase = shipClass.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  return camelCase as FactionShipClass;
}

function calculateTerritory(units: CombatUnit[], currentTerritory: FactionTerritory): FactionTerritory {
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
    threatLevel: calculateThreatLevel(center, maxRadius, currentTerritory)
  };
}

function calculateRelationships(
  factionId: FactionId,
  currentRelationships: Record<FactionId, number>
): Record<FactionId, number> {
  const updatedRelationships = { ...currentRelationships };

  Object.keys(currentRelationships).forEach(otherFactionId => {
    const otherFaction = FACTION_CONFIGS[otherFactionId as FactionId];
    if (!otherFaction) {
      return;
    }
    // ... rest of the function ...
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

// Helper functions
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
  type: 'plasma' | 'spark' | 'gauss' | 'explosive';
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
        effects: [{ type: 'plasma', damage: 10, duration: 3 }],
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

// Helper function to determine ship class based on unit status
function determineShipClass(unit: FactionCombatUnit): ShipClass {
  const status = unit.status;
  const factionShips = FACTION_SHIPS[unit.faction] || [];

  if (status.effects.includes('flagship')) {
    return factionShips.find(s => (SHIP_STATS[s] || DEFAULT_SHIP_STATS).health > 1000) || factionShips[0];
  }
  if (status.effects.includes('stealth')) {
    return factionShips.find(s =>
      (SHIP_STATS[s] || DEFAULT_SHIP_STATS).abilities.some(a => a.effect.type === 'stealth')
    ) || factionShips[0];
  }
  if (status.effects.includes('heavy')) {
    return factionShips.find(s => (SHIP_STATS[s] || DEFAULT_SHIP_STATS).armor > 300) || factionShips[0];
  }

  return factionShips[0];
}

// Update determineShipStatus function to handle complex status
function determineShipStatus(unit: FactionCombatUnit): CommonShipStatus {
  const status = unit.status.main;
  if (status === 'active') {
    return 'ready' as CommonShipStatus;
  }
  if (status === 'disabled') {
    return 'disabled' as CommonShipStatus;
  }
  return 'destroyed' as CommonShipStatus;
}

// Helper function to determine formation
function determineFormation(units: FactionCombatUnit[]): FactionFleet['formation'] {
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
function calculateResourceIncome(territory: FactionTerritory): {
  minerals: number;
  energy: number;
  plasma: number;
  exotic: number;
  gas: number;
  population: number;
  research: number;
} {
  return {
    minerals: territory.resources.minerals * 0.1,
    energy: 0,
    plasma: 0,
    exotic: territory.resources.exotic * 0.1,
    gas: territory.resources.gas * 0.1,
    population: 0,
    research: 0,
  };
}

// Helper function to find nearby enemies
function findNearbyEnemies(state: FactionBehaviorState): FactionCombatUnit[] {
  return Array.from(
    combatManager.getUnitsInRange(state.territory.center, state.territory.radius)
  ).filter(unit => 
    isFactionCombatUnit(unit) && unit.faction !== state.id
  ) as FactionCombatUnit[];
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

// Update calculateThreatLevel function with proper type handling
function calculateThreatLevel(center: Position, radius: number, territory: FactionTerritory): number {
  const threats = Array.from(combatManager.getUnitsInRange(center, radius))
    .filter(unit => isFactionCombatUnit(unit) && unit.faction !== territory.factionId);

  return Math.min(1, threats.length / 10);
}

// Helper function to normalize ship class
function normalizeShipClass(shipClass: string): FactionShipClass {
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
  if (state.stats.resourceIncome.minerals < 100) {
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
      minerals: 2000,
      energy: 1500,
      plasma: 1000,
      exotic: 500,
      gas: 1000,
      population: 500,
      research: 1000,
    };
  }
}

// Expansion planning function
function planExpansion(state: FactionBehaviorState): void {
  // Calculate optimal expansion direction
  const newDirection = calculateOptimalExpansionDirection(state);
  state.expansionStrategy.expansionDirection = newDirection;

  // Adjust system priority based on needs
  if (state.stats.resourceIncome.minerals < 100 || state.stats.resourceIncome.energy < 100) {
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
      other =>
        !assignedUnits.has(other.id) && getDistance(unit.position, other.position) < 500
    );

    if (nearbyUnits.length >= 3) {
      const factionUnits = nearbyUnits.map(u => convertToFactionCombatUnit(u, 'neutral', unit.type as FactionShipClass));
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
          behavior: 'defensive'
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
            regeneration: 1
          },
          mobility: {
            speed: u.stats.speed,
            turnRate: u.stats.turnRate,
            acceleration: 50
          },
          weapons: [],
          abilities: []
        },
        abilities: []
      }));
      
      fleets.push({
        ships: factionShips,
        formation: {
          type: 'defensive',
          spacing: 100,
          facing: 0
        },
        strength: calculateFleetStrength(nearbyUnits)
      });

      nearbyUnits.forEach(u => assignedUnits.add(u.id));
    }
  });

  return fleets;
}

// Update updateFleet function with proper type handling
function updateFleet(fleet: FactionFleet, units: CombatUnit[]): FactionFleet {
  const factionUnits = units.map(u => convertToFactionCombatUnit(u, 'neutral', u.type as FactionShipClass));
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
      behavior: 'defensive'
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
        regeneration: 1
      },
      mobility: {
        speed: u.stats.speed,
        turnRate: u.stats.turnRate,
        acceleration: 50
      },
      weapons: [],
      abilities: []
    },
    abilities: []
  }));

  return {
    ...fleet,
    ships: factionShips,
    strength: calculateFleetStrength(units)
  };
}


