```typescript
import { useCallback, useEffect, useState } from 'react';
import { SHIP_STATS as CONFIG_SHIP_STATS } from '../../config/ships';
import { ModuleEvent, moduleEventBus } from '../../lib/events/ModuleEventBus';
// Import actual managers and types from registry/definitions
import {
  CombatManager,
  FactionManager,
  getAsteroidFieldManager,
  getCombatManager,
  getFactionBehaviorManager,
  getFactionManager,
} from '../../managers/ManagerRegistry'; // Added FactionManager, getFactionManager, getCombatManager
import { CombatUnit } from '../../types/combat/CombatTypes'; // Assuming this is the correct CombatUnit type
import { Position } from '../../types/core/GameTypes';
import { EventType } from '../../types/events/EventTypes'; // Import EventType from types
import { CommonShipStats, ShipStatus as CommonShipStatus } from '../../types/ships/CommonShipTypes'; // Correct import for CommonShipStatus
// Import FactionShipTypes and define FactionState locally if needed, or import if exported
import {
  FactionBehaviorConfig,
  FactionBehaviorType,
  FactionFleet,
  FactionFleetFormation,
  FactionId,
  FactionShip,
  FactionShipClass,
  FactionState as FactionStateTypeDefinition, // Renamed to avoid conflict if FactionState is defined locally
} from '../../types/ships/FactionShipTypes';
// Define ShipStatus based on actual definition or import
import { ShipStatus } from '../../types/ships/ShipTypes'; // Assuming ShipStatus is defined here
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

// Get actual manager instances
const combatManager: CombatManager = getCombatManager();
const factionManager: FactionManager = getFactionManager();
const factionBehaviorManager = getFactionBehaviorManager(); // Already correctly imported

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
 * Checks if a combat unit has a specific status effect
 */
function hasStatus(unit: CombatUnit | FactionCombatUnit, statusToCheck: string): boolean {
  if (isFactionCombatUnit(unit)) {
    return (
      unit.status.main === statusToCheck ||
      (unit.status.secondary !== undefined && unit.status.secondary === statusToCheck) ||
      unit.status.effects.includes(statusToCheck)
    );
  } else {
    // Check the structure of CombatUnit's status based on CombatTypes.ts
    if (
      'status' in unit &&
      typeof unit.status === 'object' &&
      unit.status !== null &&
      'main' in unit.status &&
      typeof unit.status.main === 'string'
    ) {
      return unit.status.main === statusToCheck;
    }
    return false;
  }
}

// Helper function to check if array is FactionCombatUnit[]
function isFactionCombatUnitArray(
  units: ReadonlyArray<CombatUnit | FactionCombatUnit | FactionShip>
): units is ReadonlyArray<FactionCombatUnit> {
  // Need a runtime check that differentiates FactionCombatUnit from CombatUnit/FactionShip
  // Checking for a property unique to FactionCombatUnit, like 'experience'
  return (
    units.length > 0 &&
    typeof units[0] === 'object' &&
    units[0] !== null &&
    'experience' in units[0] &&
    'weaponMounts' in units[0]
  );
}

// Helper function to check if array is FactionShip[]
function isFactionShipArray(
  units: ReadonlyArray<CombatUnit | FactionCombatUnit | FactionShip>
): units is ReadonlyArray<FactionShip> {
  // Runtime check for properties unique to FactionShip vs CombatUnit/FactionCombatUnit
  // FactionShip has 'category', FactionCombatUnit has 'experience'
  return (
    units.length > 0 &&
    typeof units[0] === 'object' &&
    units[0] !== null &&
    'category' in units[0] &&
    !('experience' in units[0])
  );
}

// Helper function to convert CombatUnit to FactionCombatUnit
function convertUnitsToFaction(
  units: ReadonlyArray<CombatUnit>,
  defaultFaction: FactionId
): FactionCombatUnit[] {
  return units.map((unit): FactionCombatUnit => {
    const shipClassType = unit.type as unknown as ShipClass; // Assuming type maps to ShipClass
    const _baseStats = getShipBehaviorStats(shipClassType);

    const healthModifier =
      defaultFaction === 'lostNova' ? 0.9 : defaultFaction === 'equatorHorizon' ? 1.2 : 1.0;
    const shieldModifier =
      defaultFaction === 'lostNova' ? 1.3 : defaultFaction === 'equatorHorizon' ? 0.8 : 1.0;
    const speedModifier =
      defaultFaction === 'lostNova' ? 1.2 : defaultFaction === 'equatorHorizon' ? 0.9 : 1.0;

    // Convert CombatUnitStatus to FactionCombatUnit['status']
    let initialStatus: FactionCombatUnit['status'] = { main: 'active', effects: [] };
    if (unit.status && typeof unit.status === 'object' && 'main' in unit.status) {
      if (
        typeof unit.status.main === 'string' &&
        ['active', 'disabled', 'destroyed'].includes(unit.status.main)
      ) {
        initialStatus.main = unit.status.main as FactionCombatUnit['status']['main'];
      }
      if ('secondary' in unit.status && typeof unit.status.secondary === 'string') {
        initialStatus.secondary = unit.status.secondary as FactionCombatUnit['status']['secondary'];
      }
      if ('effects' in unit.status && Array.isArray(unit.status.effects)) {
        initialStatus.effects = unit.status.effects.filter(
          (e): e is string => typeof e === 'string'
        );
      }
    }

    const factionUnit: FactionCombatUnit = {
      id: unit.id,
      type: unit.type,
      position: unit.position,
      rotation: unit.rotation,
      velocity: unit.velocity,
      faction: defaultFaction,
      class: unit.type as FactionShipClass, // Assuming unit.type maps directly
      tactics: {
        formation: 'balanced',
        behavior: 'aggressive' as FactionBehaviorType,
        target: undefined,
      },
      weaponMounts: convertToWeaponMounts(unit.weapons ?? []),
      weapons: (unit.weapons ?? []).map(
        (w): FactionCombatWeapon => ({
          ...w,
          upgrades: [],
        })
      ),
      formation: {
        type: 'balanced',
        spacing: 100,
        facing: 0,
        position: 0,
      },
      stats: {
        health: _baseStats.health * healthModifier,
        maxHealth: _baseStats.health * healthModifier,
        shield: _baseStats.shield * shieldModifier,
        maxShield: _baseStats.shield * shieldModifier,
        armor: _baseStats.defense?.armor ?? 0,
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
      status: initialStatus,
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

// Update calculateFleetStrength to handle multiple types correctly
function calculateFleetStrength(
  units: ReadonlyArray<CombatUnit | FactionCombatUnit | FactionShip>
): number {
  let totalStrength = 0;

  units.forEach(unit => {
    let unitStrength = 0;
    if (isFactionCombatUnit(unit)) {
      // Check if FactionCombatUnit
      const weaponDamage = unit.weapons.reduce(
        (sum: number, weapon: FactionCombatWeapon) => sum + weapon.damage,
        0
      );
      unitStrength = unit.stats.health + unit.stats.shield + weaponDamage;
    } else if (isFactionShipArray([unit as CombatUnit | FactionShip])) {
      // Check if FactionShip
      const ship = unit as FactionShip;
      const armor = ship.stats?.defense?.armor ?? 0;
      // FactionShip doesn't have weapons directly, use health/shield/armor
      unitStrength = ship.health + ship.shield + armor;
    } else if ('type' in unit && 'weapons' in unit && Array.isArray(unit.weapons)) {
      // Check if it's CombatUnit (with type and weapons)
      const stats = getShipBehaviorStats(unit.type as ShipClass);
      unitStrength = stats.health + stats.shield;
      const weaponDamage = unit.weapons.reduce(
        (sum: number, weapon: WeaponSystem) => sum + weapon.damage,
        0
      );
      unitStrength += weaponDamage;
    } else {
      // Fallback for unknown types or CombatUnit missing properties
      unitStrength =
        ('health' in unit && typeof unit.health === 'number' ? unit.health : 100) +
        ('shield' in unit && typeof unit.shield === 'number' ? unit.shield : 50);
    }
    totalStrength += unitStrength;
  });

  return totalStrength;
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

// Define faction behavior events (assuming structure is correct)
export interface FactionBehaviorEvents {
  // ... (event definitions) ...
}

// Define resource node interfaces (assuming structure is correct)
export interface ResourceNode {
  // ...
}

export interface AsteroidFieldNode {
  // ...
}

// Define faction territory interface (assuming structure is correct)
export interface FactionTerritory {
  // ...
}

// Define faction behavior state interface (assuming structure is correct)
// Use imported FactionState type if it matches this structure
// export interface FactionBehaviorState { ... }
type FactionBehaviorState = FactionStateTypeDefinition; // Use imported type

// Define ShipClass type (already defined above)
// export type ShipClass = ...

// Define state machine types (already defined above)
// export type FactionStateType = ...
// export type FactionEvent = ...

// Define Threat type if not imported
interface Threat {
  id: string;
  position: Position;
  // Add other relevant properties like strength, faction, etc.
}

// Define FactionConfig type (imported from factionConfigs)
// interface FactionConfig { ... }

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
  // ... (transitions remain the same) ...
};

function getInitialState(factionId: FactionId): FactionStateType {
  return INITIAL_STATES[factionId];
}

function getTransitions(factionId: FactionId): StateMachineTransition[] {
  return STATE_TRANSITIONS[factionId] ?? []; // Use nullish coalescing
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

// Add type guards for each event type (assuming definitions are correct)
interface BehaviorChangedEvent {
  /* ... */
}
interface FleetUpdatedEvent {
  /* ... */
}
interface TerritoryChangedEvent {
  /* ... */
}
interface RelationshipChangedEvent {
  /* ... */
}
interface ResourcesUpdatedEvent {
  /* ... */
}
interface CombatTacticsChangedEvent {
  /* ... */
}

function isBehaviorChangedEvent(event: unknown): event is BehaviorChangedEvent {
  /* ... */
}
function isFleetUpdatedEvent(event: unknown): event is FleetUpdatedEvent {
  /* ... */
}
function isTerritoryChangedEvent(event: unknown): event is TerritoryChangedEvent {
  /* ... */
}
function isRelationshipChangedEvent(event: unknown): event is RelationshipChangedEvent {
  /* ... */
}
function isResourcesUpdatedEvent(event: unknown): event is ResourcesUpdatedEvent {
  /* ... */
}
function isCombatTacticsChangedEvent(event: unknown): event is CombatTacticsChangedEvent {
  /* ... */
}

// Placeholder function definition
function calculateOptimalExpansionDirection(state: FactionBehaviorState): Position {
  console.warn(
    'calculateOptimalExpansionDirection is not implemented, returning random direction.'
  );
  const angle = Math.random() * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function useFactionBehavior(factionId: FactionId) {
  const [behavior, setBehavior] = useState<FactionBehaviorState>(() => {
    const config = factionConfigs[factionId];
    if (!config) {
      throw new Error(`Configuration for faction ${factionId} not found.`);
    }
    // Initialize state based on FactionStateTypeDefinition or the structure defined in FactionManager
    // This needs to match the actual FactionState type used by factionManager.getFactionState
    // Example initialization (adjust based on actual FactionState type):
    const initialStateFromManager = factionManager.getFactionState(factionId);
    return {
      id: factionId,
      name: config.name ?? factionId, // Use config name if available
      fleets: initialStateFromManager?.fleets ?? [],
      territory: initialStateFromManager?.territory ?? {
        center: { x: 0, y: 0 },
        radius: 100,
        controlPoints: [],
        resources: {},
        threatLevel: 0,
        factionId: factionId,
      },
      relationships: initialStateFromManager?.relationships ?? {
        player: 0,
        enemy: -0.8,
        neutral: 0,
        ally: 0.8,
        'space-rats': 0,
        'lost-nova': 0,
        'equator-horizon': 0,
      }, // Ensure all factions listed
      specialRules: config.specialRules ?? {},
      behaviorState: {
        aggression: config.behavior?.baseAggression ?? 0.5,
        expansion: config.behavior?.expansionRate ?? 0.1,
        trading: config.behavior?.tradingPreference ?? 0.5,
        currentTactic: 'defend',
        lastAction: 'initialized',
        nextAction: 'evaluate',
      },
      stats: {
        // Initialize stats based on expected structure
        totalShips: initialStateFromManager?.activeShips?.length ?? 0, // Estimate from activeShips?
        activeFleets: initialStateFromManager?.fleets?.length ?? 0,
        territorySystems: Math.floor((initialStateFromManager?.territory?.radius ?? 100) / 1000),
        resourceIncome: {} as Record<ResourceType, number>, // Initialize empty
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
        stockpileThresholds: {} as Record<ResourceType, number>, // Initialize empty
        tradePreferences: [],
      },
      expansionStrategy: {
        expansionDirection: { x: 0, y: 0 },
        systemPriority: 'resources',
        colonizationThreshold: 0,
        maxTerritory: 0,
        consolidationThreshold: 0,
      },
      // Ensure all properties from FactionStateTypeDefinition are initialized
      fleetStrength: initialStateFromManager?.fleetStrength ?? 0,
      threatLevel: initialStateFromManager?.threatLevel ?? 0,
      activeShips: initialStateFromManager?.activeShips ?? [],
      currentBehavior: initialStateFromManager?.currentBehavior ?? {
        id: 'default',
        type: 'passive',
        priority: 'defend',
        conditions: {
          healthThreshold: 0.5,
          shieldThreshold: 0.5,
          targetDistance: 1000,
          allySupport: false,
        },
      },
      lastActivity: Date.now(),
      isActive: initialStateFromManager?.isActive ?? false,
    };
  });

  const handleModuleEvent = useCallback(
    (event: ModuleEvent) => {
      switch (event?.type) {
        case EventType.MODULE_STATUS_CHANGED: // Use correct Enum
          if (event?.data?.type === 'tactics') {
            const oldTactics = behavior.combatTactics;
            const eventData = event.data ?? {};
            const newTactics = {
              ...oldTactics,
              ...eventData,
            };

            setBehavior(prev => ({
              ...prev,
              combatTactics: newTactics as FactionBehaviorState['combatTactics'],
            }));

            factionBehaviorManager.emit(FactionEventType.COMBAT_TACTICS_CHANGED, {
              factionId,
              oldTactics,
              newTactics: newTactics as FactionBehaviorState['combatTactics'],
            });
          }
          break;
      }
    },
    [behavior.combatTactics, factionId]
  );

  const handleBehaviorEvent = useCallback(
    (eventType: FactionEventType, data: unknown) => {
      setBehavior(prev => {
        const newState = { ...prev };
        // ... (switch cases for event types, ensure properties exist on newState) ...
        switch (eventType) {
          case FactionEventType.BEHAVIOR_CHANGED:
            if (isBehaviorChangedEvent(data)) {
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
              newState.fleets = data.fleets; // Ensure data.fleets matches FactionFleet[]
              newState.stats.totalShips = data.fleets.reduce(
                (sum, fleet) => sum + fleet.ships.length,
                0
              );
              newState.stats.activeFleets = data.fleets.length;
            }
            break;
          case FactionEventType.TERRITORY_CHANGED:
            if (isTerritoryChangedEvent(data)) {
              newState.territory = data.territory; // Ensure data.territory matches FactionTerritory
              newState.stats.territorySystems = Math.floor(data.territory.radius / 1000);
            }
            break;
          case FactionEventType.RELATIONSHIP_CHANGED:
            if (isRelationshipChangedEvent(data)) {
              newState.relationships[data.targetFaction] = data.newValue;
            }
            break;
          case FactionEventType.RESOURCES_UPDATED:
            if (isResourcesUpdatedEvent(data)) {
              // Check if resourceIncome exists before assignment
              if (!newState.stats.resourceIncome) {
                newState.stats.resourceIncome = {} as Record<ResourceType, number>;
              }
              newState.stats.resourceIncome[data.resourceType] = data.newAmount;
            }
            break;
          case FactionEventType.COMBAT_TACTICS_CHANGED:
            if (isCombatTacticsChangedEvent(data)) {
              newState.combatTactics = data.newTactics; // Ensure data.newTactics matches
            }
            break;
          default:
            break; // No change
        }
        return newState;
      });
    },
    [setBehavior]
  );

  useEffect(() => {
    // ... (event subscriptions using factionBehaviorManager.on) ...
    const unsubscribeBehaviorChanged = factionBehaviorManager.on(/* ... */);
    const unsubscribeFleetUpdated = factionBehaviorManager.on(/* ... */);
    const unsubscribeTerritoryChanged = factionBehaviorManager.on(/* ... */);
    const unsubscribeRelationshipChanged = factionBehaviorManager.on(/* ... */);
    const unsubscribeResourcesUpdated = factionBehaviorManager.on(/* ... */);
    const unsubscribeCombatTacticsChanged = factionBehaviorManager.on(/* ... */);

    return () => {
      unsubscribeBehaviorChanged();
      unsubscribeFleetUpdated();
      unsubscribeTerritoryChanged();
      unsubscribeRelationshipChanged();
      unsubscribeResourcesUpdated();
      unsubscribeCombatTacticsChanged();
    };
  }, [factionId, handleBehaviorEvent]);

  const updateFactionBehavior = useCallback(() => {
    setBehavior(currentBehavior => {
      // Use actual combatManager instance
      const nearbyUnits = combatManager.getUnitsInRange(
        currentBehavior.territory.center,
        currentBehavior.territory.radius
      );

      // Ensure nearbyUnits is CombatUnit[] before passing
      const combatUnits = nearbyUnits as CombatUnit[];

      const updatedFleets = updateFleets(combatUnits); // Pass CombatUnit[]
      let fleetsChanged = false;
      if (
        updatedFleets.length !== currentBehavior.fleets.length ||
        JSON.stringify(updatedFleets) !== JSON.stringify(currentBehavior.fleets)
      ) {
        const eventFleets = updatedFleets.map(convertToEventFleet);
        factionBehaviorManager.updateFleets(factionId, eventFleets);
        fleetsChanged = true;
      }

      const updatedTerritory = calculateTerritory(combatUnits, currentBehavior.territory); // Pass CombatUnit[]
      let territoryChanged = false;
      if (
        updatedTerritory.radius !== currentBehavior.territory.radius ||
        JSON.stringify(updatedTerritory.center) !== JSON.stringify(currentBehavior.territory.center)
      ) {
        const eventTerritory = convertToEventTerritory(updatedTerritory, factionId);
        factionBehaviorManager.updateTerritory(factionId, eventTerritory);
        territoryChanged = true;
      }

      let resourcesChanged = false;
      const newResourceIncome = calculateResourceIncome(updatedTerritory);
      Object.entries(newResourceIncome).forEach(([resourceKey, newAmount]) => {
        const resourceType = ResourceType[resourceKey.toUpperCase() as keyof typeof ResourceType];
        if (resourceType) {
          const oldAmount = currentBehavior.stats.resourceIncome[resourceType] ?? 0;
          if (oldAmount !== newAmount) {
            factionBehaviorManager.updateResources(factionId, resourceType, newAmount);
            resourcesChanged = true;
          }
        }
      });

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
          relationshipsChanged = true;
        }
      });

      const nextBehavior = { ...currentBehavior };

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
        // Ensure resourceIncome exists
        if (!nextBehavior.stats.resourceIncome) {
          nextBehavior.stats.resourceIncome = {} as Record<ResourceType, number>;
        }
        nextBehavior.stats.resourceIncome = newResourceIncome;
      }
      if (relationshipsChanged) {
        nextBehavior.relationships = updatedRelationships;
      }

      handleStateMachineTriggers(nextBehavior);
      const newBehaviorState = calculateBehaviorState(
        nextBehavior.behaviorState,
        nextBehavior.fleets,
        nextBehavior.territory,
        nextBehavior.relationships
      );
      nextBehavior.behaviorState = newBehaviorState;
      updateCombatTactics(nextBehavior);
      manageResources(nextBehavior);
      planExpansion(nextBehavior);

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

      const currentFactionConfig = factionConfigs[nextBehavior.id];
      if (currentFactionConfig && shouldSpawnNewShip(nextBehavior, currentFactionConfig)) {
        const spawnPoint = selectSpawnPoint(nextBehavior.territory);
        factionManager.spawnShip(nextBehavior.id, spawnPoint); // Use actual manager
      }

      return nextBehavior;
    });
  }, [factionId]);

  useEffect(() => {
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
  // ... (implementation remains the same) ...
}

// Ensure input type matches what combatManager.getUnitsInRange actually returns
function calculateTerritory(
  units: ReadonlyArray<CombatUnit>, // Use ReadonlyArray and correct CombatUnit type
  currentTerritory: FactionTerritory
): FactionTerritory {
  // ... (implementation remains the same) ...
}

function calculateRelationships(
  factionId: FactionId,
  currentRelationships: Record<FactionId, number>
): Record<FactionId, number> {
  // ... (implementation remains the same) ...
}

function calculateBehaviorState(
  current: FactionBehaviorState['behaviorState'],
  fleets: FactionFleet[],
  territory: FactionTerritory,
  relationships: Record<FactionId, number>
): FactionBehaviorState['behaviorState'] {
  // ... (implementation remains the same) ...
}

/**
 * Calculates the distance between two positions
 */
function calculateDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  // ... (implementation remains the same) ...
}

// Define Default CommonShipStats based on actual type
const DEFAULT_COMMON_SHIP_STATS: CommonShipStats = {
  health: 500,
  maxHealth: 500,
  shield: 200,
  maxShield: 200,
  energy: 100,
  maxEnergy: 100,
  cargo: 100,
  speed: 100,
  turnRate: 2,
  defense: { armor: 100, shield: 200, evasion: 0.3, regeneration: 1 },
  mobility: { speed: 100, turnRate: 2, acceleration: 50 },
  weapons: [],
  abilities: [],
};

// Get ship stats for behavior
function getShipBehaviorStats(shipClass: ShipClass): CommonShipStats {
  const mappedClass = mapShipClass(shipClass);
  const configStats = CONFIG_SHIP_STATS[mappedClass];

  if (!configStats) {
    console.warn(
      `No config stats found for mapped ship class: ${mappedClass} (original: ${shipClass}). Using defaults.`
    );
    return DEFAULT_COMMON_SHIP_STATS; // Use the correctly typed default
  }
  // Map configStats to CommonShipStats structure
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
    weapons: configStats.weapons, // Assuming types are compatible
    abilities: configStats.abilities, // Assuming types are compatible
  };
}

/**
 * Determines the appropriate ship class for a faction unit
 */
function determineShipClass(unit: FactionCombatUnit): FactionShipClass {
  return unit.class;
}

/**
 * Determines the current status of a faction ship using CommonShipStatus
 */
function determineShipStatus(unit: FactionCombatUnit): CommonShipStatus {
  if (unit.stats.health <= 0) {
    return CommonShipStatus.DESTROYED;
  }
  switch (unit.status.main) {
    case 'active':
      return CommonShipStatus.ACTIVE; // Use actual enum member
    case 'disabled':
      // Use INACTIVE or DISABLED based on CommonShipStatus definition
      return CommonShipStatus.INACTIVE ?? CommonShipStatus.DISABLED ?? CommonShipStatus.IDLE;
    case 'destroyed':
      return CommonShipStatus.DESTROYED;
    default:
      console.warn(`Unknown main status found for unit ${unit.id}: ${unit.status.main}`);
      return CommonShipStatus.IDLE; // Fallback to IDLE
  }
}

/**
 * Determines the optimal formation for a group of faction units
 */
function determineFormation(units: ReadonlyArray<FactionCombatUnit>): FactionFleet['formation'] {
  // ... (implementation remains the same, ensure FactionFleetFormation types match) ...
}

// Helper function to calculate resource income
function calculateResourceIncome(territory: FactionTerritory): Record<ResourceType, number> {
  // ... (implementation remains the same) ...
}

// Helper function to find nearby enemies using the correct CombatUnit type
function findNearbyEnemies(state: FactionBehaviorState): CombatUnit[] {
  const unitsInRange = combatManager.getUnitsInRange(
    state.territory.center,
    state.territory.radius
  );
  // Filter based on CombatUnit type from CombatTypes.ts
  return (unitsInRange as CombatUnit[]).filter(unit => {
    // CombatUnit from CombatTypes lacks 'faction'. Need alternative way to identify enemies.
    // Placeholder: Assume non-player units are enemies (needs refinement)
    // This requires a way to identify the player unit ID or faction ID reliably.
    const isPlayerUnit = unit.id === 'player_controlled_unit_id'; // Example placeholder
    return !isPlayerUnit; // Extremely basic enemy identification
  });
}

// Helper function to calculate player power
function calculatePlayerPower(): number {
  const playerFactionId: FactionId = 'player';
  const playerState = factionManager.getFactionState(playerFactionId);

  if (!playerState) {
    console.warn('Player state not found for power calculation.');
    return 0;
  }
  // Use fleetStrength from FactionState definition in factionManager.ts
  const shipCount = playerState.fleetStrength ?? 0;

  const resourceScore = Object.values(playerState.territory?.resources ?? {}).reduce(
    (sum: number, amount: unknown) => sum + (typeof amount === 'number' ? amount : 0),
    0
  );

  return shipCount * 100 + resourceScore;
}

// Helper function to check for ambush opportunities
function isAmbushOpportunity(state: FactionBehaviorState): boolean {
  const stealthShips = state.fleets
    .flatMap(fleet => fleet.ships)
    .filter(ship => ship.class.toLowerCase().includes('stealth')).length;

  const hasEnoughStealthForces = stealthShips >= 3;

  const nearbyEnemies = findNearbyEnemies(state);
  const enemyStrength = calculateFleetStrength(nearbyEnemies);
  const ownStrength = calculateFleetStrength(state.fleets.flatMap(f => f.ships));

  const enemyIsVulnerable = state.territory.threatLevel < 0.3 && enemyStrength < ownStrength * 0.8;

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
      console.warn(`Unhandled tactic in determineNextAction: ${tactic}`);
      return 'patrol';
  }
}

// Helper function to select spawn point
function selectSpawnPoint(territory: FactionTerritory): Position {
  // ... (implementation remains the same) ...
}

// Helper function to check if should spawn new ship
function shouldSpawnNewShip(state: FactionBehaviorState, config: FactionConfig): boolean {
  const maxShips = config.spawnConditions?.maxShips ?? Infinity;

  const hasEnoughMinerals = (state.territory.resources[ResourceType.MINERALS] ?? 0) > 500;
  const hasEnoughEnergy = (state.territory.resources[ResourceType.ENERGY] ?? 0) > 200;

  // Use stats.totalShips from FactionBehaviorState
  return (
    state.stats.totalShips < maxShips &&
    state.behaviorState.aggression > 0.4 &&
    hasEnoughMinerals &&
    hasEnoughEnergy
  );
}

// Helper function to generate control points
function generateControlPoints(center: Position, radius: number): Position[] {
  // ... (implementation remains the same) ...
}

// Helper function to calculate threat level
function calculateThreatLevel(
  center: Position,
  radius: number,
  territory: FactionTerritory
): number {
  const nearbyUnits = combatManager.getUnitsInRange(center, radius);
  const enemyStrength = (nearbyUnits as CombatUnit[]) // Cast based on CombatTypes definition
    .filter(unit => {
      // Cannot filter by faction as CombatUnit lacks it.
      // Filter based on other criteria if possible, or assume all non-self are threats.
      // This needs a reliable way to identify enemy units.
      const isPlayerUnit = unit.id === 'player_controlled_unit_id'; // Placeholder
      return !isPlayerUnit && unit.id !== territory.factionId; // Basic threat check
    })
    .reduce((sum: number, unit: CombatUnit) => {
      let unitHealth = 100; // Default health
      if (unit.stats && typeof unit.stats.health === 'number') {
        // Access stats directly from CombatUnit
        unitHealth = unit.stats.health;
      }
      return sum + unitHealth;
    }, 0);

  const maxExpectedStrength = 10000;
  const normalizedThreat = Math.min(1, enemyStrength / maxExpectedStrength);

  return normalizedThreat;
}

// Helper function to normalize ship class safely
function normalizeShipClassSafe(shipClass: string): FactionShipClass | undefined {
  // ... (implementation remains the same) ...
}

// Combat tactics update function
function updateCombatTactics(state: FactionBehaviorState): void {
  // ... (implementation remains the same, ensure property access is valid for FactionBehaviorState) ...
}

// Resource management function
function manageResources(state: FactionBehaviorState): void {
  // ... (implementation remains the same, ensure property access is valid for FactionBehaviorState) ...
}

// Expansion planning function
function planExpansion(state: FactionBehaviorState): void {
  // ... (implementation remains the same, ensure property access is valid for FactionBehaviorState) ...
  // Correct nullish coalescing precedence
  const maxTerritoryBase = factionConfigs[state.id]?.spawnConditions?.maxShips;
  state.expansionStrategy.maxTerritory =
    (maxTerritoryBase !== undefined ? maxTerritoryBase * 1000 : undefined) ?? 10000;
  // ... rest of the implementation ...
}

// Faction-specific behavior functions
function executeSpaceRatsBehavior(state: FactionBehaviorState): void {
  // ... (implementation remains the same) ...
}

function executeLostNovaBehavior(state: FactionBehaviorState): void {
  // ... (implementation remains the same) ...
}

function executeEquatorHorizonBehavior(state: FactionBehaviorState): void {
  // ... (implementation remains the same) ...
}

// Default behavior update logic
function updateDefaultBehavior(state: FactionBehaviorState): void {
  // ... (implementation remains the same) ...
}

// Map CommonShipStatus to the ShipStatus type expected by FactionShip
function mapToFactionShipStatus(status: CommonShipStatus): ShipStatus {
  // This mapping depends on the actual definition of ShipStatus in ShipTypes.ts
  // Example mapping (adjust based on actual ShipStatus members):
  switch (status) {
    case CommonShipStatus.ACTIVE:
      return ShipStatus.IDLE; // Or ShipStatus.ACTIVE if exists
    case CommonShipStatus.IDLE:
      return ShipStatus.IDLE;
    case CommonShipStatus.MOVING:
      return ShipStatus.IDLE; // Map MOVING if ShipStatus doesn't have it
    case CommonShipStatus.COMBAT:
      return ShipStatus.ENGAGING; // Map COMBAT to ENGAGING
    case CommonShipStatus.INACTIVE:
      return ShipStatus.DAMAGED; // Map INACTIVE to DAMAGED? Needs clarification
    case CommonShipStatus.DISABLED:
      return ShipStatus.DAMAGED; // Map DISABLED to DAMAGED? Needs clarification
    case CommonShipStatus.DESTROYED:
      return ShipStatus.IDLE; // Cannot be destroyed in FactionShip? Map to IDLE?
    default:
      return ShipStatus.IDLE;
  }
}

// Map CommonShipStatus to the status type expected by FactionFleet
function mapToFactionFleetStatus(status: CommonShipStatus): FactionFleet['status'] {
  // This mapping depends on FactionFleet['status'] definition in FactionShipTypes.ts
  // ('idle' | 'moving' | 'attacking' | 'retreating' | 'defending')
  switch (status) {
    case CommonShipStatus.ACTIVE:
      return 'idle';
    case CommonShipStatus.IDLE:
      return 'idle';
    case CommonShipStatus.MOVING:
      return 'moving';
    case CommonShipStatus.COMBAT:
      return 'attacking'; // Map COMBAT to attacking
    case CommonShipStatus.INACTIVE:
      return 'idle'; // Or 'defending'?
    case CommonShipStatus.DISABLED:
      return 'idle'; // Or 'defending'?
    case CommonShipStatus.DESTROYED:
      return 'idle'; // Fleet can't be destroyed?
    default:
      return 'idle';
  }
}

// Update updateFleets function with proper type handling
function updateFleets(units: ReadonlyArray<CombatUnit>): FactionFleet[] {
  // Expect CombatUnit[]
  const fleets: FactionFleet[] = [];
  const assignedUnits = new Set<string>();

  // Cannot group by faction as CombatUnit lacks it. Fleet logic needs rework.
  // TEMPORARY: Treat all non-player units as one potential fleet pool (needs faction context)
  const potentialFleetUnits = units.filter(u => u.id !== 'player_id'); // Placeholder player ID check

  potentialFleetUnits.forEach(unit => {
    if (assignedUnits.has(unit.id)) return;

    const nearbyUnits = potentialFleetUnits.filter(
      other =>
        !assignedUnits.has(other.id) && calculateDistance(unit.position, other.position) < 500
    );

    if (nearbyUnits.length >= 3) {
      // Identify the dominant faction in this group if possible, otherwise use a default like 'neutral'
      // This requires faction info which is missing from CombatUnit
      const fleetFactionId: FactionId = 'neutral'; // Placeholder

      const factionUnits: FactionCombatUnit[] = nearbyUnits
        .map(u => {
          const normalizedClass = normalizeShipClassSafe(u.type);
          if (!normalizedClass) {
            console.error(`Skipping unit ${u.id} due to invalid type: ${u.type}`);
            return null;
          }
          // Use the determined/placeholder fleet faction
          return convertToFactionCombatUnit(u, fleetFactionId, normalizedClass);
        })
        .filter((unit): unit is FactionCombatUnit => unit !== null);

      if (factionUnits.length < 3) return;

      const factionShips: FactionShip[] = factionUnits.map((u): FactionShip => {
        const baseStats = getShipBehaviorStats(u.class as unknown as ShipClass);
        const tacticsConfig = u.tactics;
        const rawBehavior = tacticsConfig?.behavior ?? 'defensive';
        let mappedBehavior: FactionBehaviorType;
        switch (rawBehavior) {
          case 'aggressive':
          case 'defensive':
          case 'passive':
          case 'evasive':
            mappedBehavior = rawBehavior;
            break;
          default:
            mappedBehavior = 'defensive';
            break;
        }
        const shipTactics: FactionBehaviorConfig = {
          formation: tacticsConfig?.formation ?? 'balanced',
          behavior: mappedBehavior,
          target: tacticsConfig?.target,
        };
        const commonStatus = determineShipStatus(u);
        const finalStatus = mapToFactionShipStatus(commonStatus); // Map to ShipStatus

        return {
          id: u.id,
          name: `${u.class}-${u.id.slice(-4)}`,
          category: 'combat',
          status: finalStatus,
          faction: u.faction,
          class: u.class,
          health: u.stats.health,
          maxHealth: u.stats.maxHealth,
          shield: u.stats.shield,
          maxShield: u.stats.maxShield,
          position: u.position,
          rotation: u.rotation ?? 0,
          tactics: shipTactics,
          stats: baseStats, // FactionShip expects CommonShipStats
          abilities: u.specialAbility ? [u.specialAbility.name] : [], // Map ability name to string[]
        };
      });

      let commonFleetStatus: CommonShipStatus = CommonShipStatus.IDLE;
      // Determine status based on CommonShipStatus of the source FactionCombatUnits
      if (factionUnits.some(u => determineShipStatus(u) === CommonShipStatus.COMBAT)) {
        commonFleetStatus = CommonShipStatus.COMBAT;
      } else if (factionUnits.some(u => determineShipStatus(u) === CommonShipStatus.MOVING)) {
        commonFleetStatus = CommonShipStatus.MOVING;
      } else if (factionUnits.every(u => determineShipStatus(u) === CommonShipStatus.DESTROYED)) {
        commonFleetStatus = CommonShipStatus.DESTROYED;
      }

      const finalFleetStatus = mapToFactionFleetStatus(commonFleetStatus); // Map to FactionFleet['status']

      fleets.push({
        id: `fleet-${unit.id}-${Date.now()}`.slice(0, 15),
        name: `Fleet ${fleets.length + 1}`,
        ships: factionShips,
        formation: determineFormation(factionUnits), // Pass FactionCombatUnit[]
        strength: calculateFleetStrength(factionUnits), // Pass FactionCombatUnit[]
        status: finalFleetStatus,
      });

      nearbyUnits.forEach(u => assignedUnits.add(u.id));
    }
  });

  return fleets;
}

// Map FactionFleet['status'] to the type expected by FactionFleetEvent
function mapToFactionFleetEventStatus(
  status: FactionFleet['status']
): FactionFleetEvent['fleets'][0]['status'] {
  // ('idle' | 'patrolling' | 'engaging' | 'retreating')
  switch (status) {
    case 'idle':
      return 'idle';
    case 'moving':
      return 'patrolling'; // Map 'moving' to 'patrolling'
    case 'attacking':
      return 'engaging';
    case 'retreating':
      return 'retreating';
    case 'defending':
      return 'idle'; // Map 'defending' to 'idle'?
    default:
      return 'idle';
  }
}

// Map FactionShip['status'] to the type expected by FactionFleetEvent's ship status
function mapToFactionEventShipStatus(
  status: FactionShip['status']
): FactionFleetEvent['fleets'][0]['ships'][0]['status'] {
  // ('idle' | 'engaging' | 'retreating' | 'damaged')
  switch (status) {
    case ShipStatus.IDLE:
      return 'idle';
    case ShipStatus.ENGAGING:
      return 'engaging';
    case ShipStatus.RETREATING:
      return 'retreating';
    case ShipStatus.DAMAGED:
      return 'damaged';
    default:
      return 'idle'; // Fallback
  }
}

// Map FactionFleetFormation['type'] to the type expected by FactionFleetEvent's formation type
function mapToFactionEventFormationType(
  type: FactionFleetFormation['type']
): FactionFleetEvent['fleets'][0]['formation']['type'] {
  // ('offensive' | 'defensive' | 'balanced')
  switch (type) {
    case 'offensive':
      return 'offensive';
    case 'defensive':
      return 'defensive';
    case 'balanced':
      return 'balanced';
    case 'stealth':
      return 'balanced'; // Map stealth to balanced for the event
    default:
      return 'balanced';
  }
}

// Convert local FactionFleet to event FactionFleet
function convertToEventFleet(fleet: FactionFleet): FactionFleetEvent['fleets'][0] {
  let fleetPosition = { x: 0, y: 0 };
  if (fleet.ships.length > 0) {
    fleetPosition = {
      x: fleet.ships.reduce((sum, s) => sum + s.position.x, 0) / fleet.ships.length,
      y: fleet.ships.reduce((sum, s) => sum + s.position.y, 0) / fleet.ships.length,
    };
  }

  // Ensure the returned object matches FactionFleetEvent['fleets'][0] type definition
  return {
    id: fleet.id,
    name: fleet.name,
    ships: fleet.ships.map(ship => ({
      id: ship.id,
      name: ship.name,
      type: ship.class,
      level: ship.stats?.level ?? 1, // Use safe access and default
      status: mapToFactionEventShipStatus(ship.status), // Map status
    })),
    formation: {
      type: mapToFactionEventFormationType(fleet.formation.type), // Map formation type
      spacing: fleet.formation.spacing,
      facing: fleet.formation.facing,
    },
    status: mapToFactionFleetEventStatus(fleet.status), // Map status
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

/**
 * Hook for managing faction combat equipment and ship configurations
 */
export function useFactionCombatEquipment(factionId: FactionId) {
  // ... (implementation remains the same, assuming internal types are consistent) ...
}
```
