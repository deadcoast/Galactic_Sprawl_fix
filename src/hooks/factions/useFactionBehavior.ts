import { CommonShipStats } from '../../types/ships/CommonShipTypes';
import { getShipStats } from '../../config/factions/factionShipStats';
import { useEffect, useState } from "react";

// Faction Types
export type FactionId = "space-rats" | "lost-nova" | "equator-horizon";

export type ShipClass =
  // Space Rats Ships
  | "rat-king"
  | "asteroid-marauder"
  | "rogue-nebula"
  | "rats-revenge"
  | "dark-sector-corsair"
  | "wailing-wreck"
  | "galactic-scourge"
  | "plasma-fang"
  | "vermin-vanguard"
  | "black-void-buccaneer"
  // Lost Nova Ships
  | "eclipse-scythe"
  | "nulls-revenge"
  | "dark-matter-reaper"
  | "quantum-pariah"
  | "entropy-scale"
  | "void-revenant"
  | "scythe-of-andromeda"
  | "nebular-persistence"
  | "oblivions-wake"
  | "forbidden-vanguard"
  // Equator Horizon Ships
  | "celestial-arbiter"
  | "ethereal-galleon"
  | "stellar-equinox"
  | "chronos-sentinel"
  | "nebulas-judgement"
  | "aetherial-horizon"
  | "cosmic-crusader"
  | "balancekeepers-wrath"
  | "ecliptic-watcher"
  | "harmonys-vanguard";

export interface FactionShip {
  id: string;
  class: ShipClass;
  status: "idle" | "patrolling" | "engaging" | "retreating";
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  experience: number;
  target?: string;
  stats: CommonShipStats;
}

export interface FactionFleet {
  ships: FactionShip[];
  formation: {
    type: "offensive" | "defensive" | "stealth";
    spacing: number;
    facing: number;
  };
  strength: number;
}

export interface FactionTerritory {
  center: { x: number; y: number };
  radius: number;
  controlPoints: { x: number; y: number }[];
  resources: {
    minerals: number;
    gas: number;
    exotic: number;
  };
  threatLevel: number;
}

// Define state machine types
type FactionStateType =
  // Space Rats States
  | "patrolling"
  | "pursuing"
  | "attacking"
  | "aggressive"
  | "retreating"
  // Lost Nova States
  | "hiding"
  | "preparing"
  | "ambushing"
  | "retaliating"
  | "withdrawing"
  // Equator Horizon States
  | "dormant"
  | "awakening"
  | "enforcing"
  | "overwhelming"
  | "withdrawing";

type FactionEvent =
  | "DETECT_TARGET"
  | "TAKE_DAMAGE"
  | "ENGAGE_RANGE"
  | "LOSE_TARGET"
  | "TARGET_DESTROYED"
  | "HEAVY_DAMAGE"
  | "SAFE_DISTANCE"
  | "REINFORCEMENTS_ARRIVED"
  | "DETECT_OPPORTUNITY"
  | "PROVOKED"
  | "AMBUSH_READY"
  | "DETECTED"
  | "AMBUSH_SUCCESS"
  | "AMBUSH_FAILED"
  | "THREAT_ELIMINATED"
  | "OVERWHELMING_FORCE"
  | "POWER_THRESHOLD_EXCEEDED"
  | "BALANCE_DISRUPTED"
  | "FLEET_READY"
  | "THREAT_DISAPPEARED"
  | "BALANCE_RESTORED"
  | "RESISTANCE_ENCOUNTERED"
  | "DOMINANCE_ACHIEVED"
  | "OBJECTIVE_COMPLETE"
  | "WITHDRAWAL_COMPLETE"
  | "NO_TARGETS";

interface StateMachineTransition {
  currentState: FactionStateType;
  event: FactionEvent;
  nextState: FactionStateType;
}

// Update FactionBehaviorState interface
interface FactionBehaviorState {
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
    currentTactic: "raid" | "defend" | "expand" | "trade";
    lastAction: string;
    nextAction: string;
  };
  stats: {
    totalShips: number;
    activeFleets: number;
    territorySystems: number;
    resourceIncome: {
      minerals: number;
      gas: number;
      exotic: number;
    };
  };
  stateMachine: {
    current: FactionStateType;
    history: FactionStateType[];
    triggers: Set<FactionEvent>;
  };
}

// Faction-specific behavior configurations
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
  "space-rats": {
    baseAggression: 0.8,
    expansionRate: 0.6,
    tradingPreference: 0.2,
    maxShips: 30,
    spawnRules: {
      minTier: 1,
      spawnInterval: 300, // 5 minutes
    },
    specialRules: {
      alwaysHostile: true,
    },
  },
  "lost-nova": {
    baseAggression: 0.4,
    expansionRate: 0.3,
    tradingPreference: 0.5,
    maxShips: 25,
    spawnRules: {
      minTier: 2,
      requiresCondition: "player-expansion",
      spawnInterval: 600, // 10 minutes
    },
    specialRules: {
      requiresProvocation: true,
    },
  },
  "equator-horizon": {
    baseAggression: 0.6,
    expansionRate: 0.4,
    tradingPreference: 0.3,
    maxShips: 20,
    spawnRules: {
      minTier: 3,
      requiresCondition: "power-threshold",
      spawnInterval: 900, // 15 minutes
    },
    specialRules: {
      powerThreshold: 0.8,
    },
  },
};

interface CombatUnit {
  id: string;
  faction: string;
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  status: string;
  target?: string;
}

interface CombatManager {
  getUnitsInRange: (
    position: { x: number; y: number },
    range: number,
  ) => CombatUnit[];
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

interface FactionState {
  id: string;
  activeShips: number;
  territory: {
    center: { x: number; y: number };
    radius: number;
  };
  fleetStrength: number;
  relationshipWithPlayer: number;
  lastActivity: number;
  isActive: boolean;
}

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
  expandTerritory: (
    factionId: string,
    position: { x: number; y: number },
  ) => void;
}

declare const factionManager: FactionManager;

// Define initial states for each faction
const INITIAL_STATES: Record<FactionId, FactionStateType> = {
  "space-rats": "patrolling",
  "lost-nova": "hiding",
  "equator-horizon": "dormant",
};

// Define state transitions for each faction
const STATE_TRANSITIONS: Record<FactionId, StateMachineTransition[]> = {
  "space-rats": [
    {
      currentState: "patrolling",
      event: "DETECT_TARGET",
      nextState: "pursuing",
    },
    {
      currentState: "patrolling",
      event: "TAKE_DAMAGE",
      nextState: "aggressive",
    },
    { currentState: "pursuing", event: "ENGAGE_RANGE", nextState: "attacking" },
    { currentState: "pursuing", event: "LOSE_TARGET", nextState: "patrolling" },
    { currentState: "pursuing", event: "TAKE_DAMAGE", nextState: "aggressive" },
    {
      currentState: "attacking",
      event: "TARGET_DESTROYED",
      nextState: "patrolling",
    },
    {
      currentState: "attacking",
      event: "HEAVY_DAMAGE",
      nextState: "retreating",
    },
    { currentState: "attacking", event: "LOSE_TARGET", nextState: "pursuing" },
    {
      currentState: "aggressive",
      event: "NO_TARGETS",
      nextState: "patrolling",
    },
    {
      currentState: "aggressive",
      event: "HEAVY_DAMAGE",
      nextState: "retreating",
    },
    {
      currentState: "retreating",
      event: "SAFE_DISTANCE",
      nextState: "patrolling",
    },
    {
      currentState: "retreating",
      event: "REINFORCEMENTS_ARRIVED",
      nextState: "aggressive",
    },
  ],
  "lost-nova": [
    {
      currentState: "hiding",
      event: "DETECT_OPPORTUNITY",
      nextState: "preparing",
    },
    { currentState: "hiding", event: "PROVOKED", nextState: "retaliating" },
    {
      currentState: "preparing",
      event: "AMBUSH_READY",
      nextState: "ambushing",
    },
    { currentState: "preparing", event: "DETECTED", nextState: "hiding" },
    { currentState: "ambushing", event: "AMBUSH_SUCCESS", nextState: "hiding" },
    {
      currentState: "ambushing",
      event: "AMBUSH_FAILED",
      nextState: "withdrawing",
    },
    {
      currentState: "ambushing",
      event: "HEAVY_DAMAGE",
      nextState: "withdrawing",
    },
    {
      currentState: "retaliating",
      event: "THREAT_ELIMINATED",
      nextState: "hiding",
    },
    {
      currentState: "retaliating",
      event: "OVERWHELMING_FORCE",
      nextState: "withdrawing",
    },
    {
      currentState: "withdrawing",
      event: "SAFE_DISTANCE",
      nextState: "hiding",
    },
  ],
  "equator-horizon": [
    {
      currentState: "dormant",
      event: "POWER_THRESHOLD_EXCEEDED",
      nextState: "awakening",
    },
    {
      currentState: "dormant",
      event: "BALANCE_DISRUPTED",
      nextState: "awakening",
    },
    { currentState: "awakening", event: "FLEET_READY", nextState: "enforcing" },
    {
      currentState: "awakening",
      event: "THREAT_DISAPPEARED",
      nextState: "dormant",
    },
    {
      currentState: "enforcing",
      event: "BALANCE_RESTORED",
      nextState: "withdrawing",
    },
    {
      currentState: "enforcing",
      event: "RESISTANCE_ENCOUNTERED",
      nextState: "overwhelming",
    },
    {
      currentState: "overwhelming",
      event: "DOMINANCE_ACHIEVED",
      nextState: "enforcing",
    },
    {
      currentState: "overwhelming",
      event: "OBJECTIVE_COMPLETE",
      nextState: "withdrawing",
    },
    {
      currentState: "withdrawing",
      event: "WITHDRAWAL_COMPLETE",
      nextState: "dormant",
    },
    {
      currentState: "withdrawing",
      event: "BALANCE_DISRUPTED",
      nextState: "enforcing",
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
  factionId: FactionId,
): FactionStateType {
  const transitions = getTransitions(factionId);
  const transition = transitions.find(
    (t) => t.currentState === currentState && t.event === event,
  );
  return transition ? transition.nextState : currentState;
}

function handleStateMachineTriggers(state: FactionBehaviorState): void {
  const triggers = new Set<FactionEvent>();

  // Check threat level
  if (state.territory.threatLevel > 0.7) {
    triggers.add("TAKE_DAMAGE");
    triggers.add("HEAVY_DAMAGE");
  }

  // Check for targets
  const nearbyEnemies = findNearbyEnemies(state);
  if (nearbyEnemies.length > 0) {
    triggers.add("DETECT_TARGET");
  } else {
    triggers.add("NO_TARGETS");
  }

  // Faction-specific triggers
  switch (state.id) {
    case "equator-horizon":
      if (
        calculatePlayerPower() >
        FACTION_CONFIGS[state.id].specialRules.powerThreshold!
      ) {
        triggers.add("POWER_THRESHOLD_EXCEEDED");
      }
      break;
    case "lost-nova":
      if (isAmbushOpportunity(state)) {
        triggers.add("DETECT_OPPORTUNITY");
      }
      break;
  }

  // Update state machine triggers
  state.stateMachine.triggers = triggers;

  // Process triggers and update state
  triggers.forEach((trigger) => {
    const nextState = handleStateMachineTransition(
      state.stateMachine.current,
      trigger,
      state.id,
    );
    if (nextState !== state.stateMachine.current) {
      state.stateMachine.history.push(state.stateMachine.current);
      state.stateMachine.current = nextState;
    }
  });
}

export function useFactionBehavior(factionId: FactionId) {
  const [behavior, setBehavior] = useState<FactionBehaviorState>({
    id: factionId,
    name: factionId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
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
    },
    relationships: {
      "space-rats": 0,
      "lost-nova": 0,
      "equator-horizon": 0,
    },
    specialRules: FACTION_CONFIGS[factionId].specialRules,
    behaviorState: {
      aggression: FACTION_CONFIGS[factionId].baseAggression,
      expansion: FACTION_CONFIGS[factionId].expansionRate,
      trading: FACTION_CONFIGS[factionId].tradingPreference,
      currentTactic: "defend",
      lastAction: "initialized",
      nextAction: "patrol",
    },
    stats: {
      totalShips: 0,
      activeFleets: 0,
      territorySystems: 0,
      resourceIncome: {
        minerals: 0,
        gas: 0,
        exotic: 0,
      },
    },
    stateMachine: {
      current: getInitialState(factionId),
      history: [],
      triggers: new Set(),
    },
  });

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const faction = factionManager.getFactionState(factionId);
      if (!faction) {
        return;
      }

      // Get all units belonging to this faction
      const factionUnits = Array.from(
        combatManager.getUnitsInRange({ x: 0, y: 0 }, 2000),
      ).filter((unit) => unit.faction === factionId);

      // Update fleets
      const updatedFleets = updateFleets(factionUnits);

      // Calculate territory and resources
      const updatedTerritory = calculateTerritory(
        factionUnits,
        behavior.territory,
      );

      // Update relationships
      const updatedRelationships = calculateRelationships(
        factionId,
        behavior.relationships,
      );

      // Update behavior state
      const updatedBehaviorState = calculateBehaviorState(
        behavior.behaviorState,
        updatedFleets,
        updatedTerritory,
        updatedRelationships,
      );

      // Update stats
      const updatedStats = {
        totalShips: factionUnits.length,
        activeFleets: updatedFleets.length,
        territorySystems: calculateTerritorySystems(updatedTerritory),
        resourceIncome: calculateResourceIncome(updatedTerritory),
      };

      // Update state machine
      const updatedStateMachine = {
        ...behavior.stateMachine,
        triggers: new Set<FactionEvent>(),
      };

      setBehavior((prev) => ({
        ...prev,
        fleets: updatedFleets,
        territory: updatedTerritory,
        relationships: updatedRelationships,
        behaviorState: updatedBehaviorState,
        stats: updatedStats,
        stateMachine: updatedStateMachine,
      }));

      // Execute faction-level decisions
      executeFactionDecisions(behavior);
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [factionId, behavior]);

  return behavior;
}

function updateFleets(units: CombatUnit[]): FactionFleet[] {
  const fleets: FactionFleet[] = [];
  const assignedUnits = new Set<string>();

  units.forEach((unit) => {
    if (assignedUnits.has(unit.id)) {
      return;
    }

    const nearbyUnits = units.filter(
      (other) =>
        !assignedUnits.has(other.id) &&
        calculateDistance(unit.position, other.position) < 500,
    );

    if (nearbyUnits.length >= 3) {
      const fleet: FactionFleet = {
        ships: nearbyUnits.map((u) => {
          const shipClass = determineShipClass(u);
          const stats = getShipStats(shipClass);
          return {
            id: u.id,
            class: shipClass,
            status: determineShipStatus(u),
            position: u.position,
            health: u.health,
            maxHealth: stats.health,
            experience: 0,
            stats,
          };
        }),
        formation: determineFormation(nearbyUnits),
        strength: calculateFleetStrength(nearbyUnits),
      };

      fleets.push(fleet);
      nearbyUnits.forEach((u) => assignedUnits.add(u.id));
    }
  });

  return fleets;
}

function calculateTerritory(
  units: CombatUnit[],
  currentTerritory: FactionTerritory,
): FactionTerritory {
  // Calculate territory based on unit positions and control points
  const positions = units.map((u) => u.position);
  const center = {
    x: positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length,
    y: positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length,
  };

  const radius = Math.max(
    currentTerritory.radius,
    ...positions.map((pos) => calculateDistance(center, pos)),
  );

  return {
    ...currentTerritory,
    center,
    radius,
    controlPoints: generateControlPoints(center, radius),
    threatLevel: calculateThreatLevel(center, radius),
  };
}

function calculateRelationships(
  factionId: FactionId,
  currentRelationships: Record<FactionId, number>,
): Record<FactionId, number> {
  const updatedRelationships = { ...currentRelationships };

  Object.keys(updatedRelationships).forEach((otherId) => {
    if (otherId === factionId) {
      return;
    }

    const otherFaction = factionManager.getFactionState(otherId as FactionId);
    if (!otherFaction) {
      return;
    }

    // Update relationship based on recent interactions
    updatedRelationships[otherId as FactionId] += Math.random() * 0.2 - 0.1;
    updatedRelationships[otherId as FactionId] = Math.max(
      -1,
      Math.min(1, updatedRelationships[otherId as FactionId]),
    );
  });

  return updatedRelationships;
}

function calculateBehaviorState(
  current: FactionBehaviorState["behaviorState"],
  fleets: FactionFleet[],
  territory: FactionTerritory,
  relationships: Record<FactionId, number>,
): FactionBehaviorState["behaviorState"] {
  // Determine next action based on current state and conditions
  let nextTactic: "raid" | "defend" | "expand" | "trade" =
    current.currentTactic;

  if (territory.threatLevel > 0.7) {
    nextTactic = "defend";
  } else if (fleets.length > 3 && current.aggression > 0.6) {
    nextTactic = "raid";
  } else if (Object.values(relationships).some((r) => r > 0.5)) {
    nextTactic = "trade";
  } else if (current.expansion > 0.5) {
    nextTactic = "expand";
  }

  return {
    ...current,
    currentTactic: nextTactic,
    lastAction: current.nextAction,
    nextAction: determineNextAction(nextTactic),
  };
}

// Helper functions
function calculateDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Ship class configurations
interface ShipStats {
  health: number;
  shield: number;
  armor: number;
  speed: number;
  turnRate: number;
  weapons: WeaponMount[];
  abilities: SpecialAbility[];
}

interface WeaponMount {
  type: "machineGun" | "gaussCannon" | "railGun" | "MGSS" | "rockets";
  damage: number;
  range: number;
  cooldown: number;
  accuracy: number;
  effects: WeaponEffect[];
}

interface WeaponEffect {
  type: "plasma" | "spark" | "gauss" | "explosive";
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
  type: "stealth" | "shield" | "speed" | "damage";
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

// Ship class configurations
const SHIP_STATS: Partial<Record<ShipClass, ShipStats>> = {
  // Space Rats Ships
  "rat-king": {
    health: 1000,
    shield: 500,
    armor: 300,
    speed: 100,
    turnRate: 2,
    weapons: [
      {
        type: "MGSS",
        damage: 50,
        range: 800,
        cooldown: 0.1,
        accuracy: 0.7,
        effects: [{ type: "plasma", damage: 10, duration: 3 }],
      },
      {
        type: "rockets",
        damage: 200,
        range: 1200,
        cooldown: 5,
        accuracy: 0.8,
        effects: [{ type: "explosive", damage: 100, duration: 1, radius: 50 }],
      },
    ],
    abilities: [
      {
        name: "Pirate's Fury",
        cooldown: 30,
        duration: 10,
        effect: { type: "damage", magnitude: 2 },
      },
    ],
  },
  // ... similar configurations for other Space Rats ships

  // Lost Nova Ships
  "eclipse-scythe": {
    health: 800,
    shield: 800,
    armor: 200,
    speed: 150,
    turnRate: 3,
    weapons: [
      {
        type: "gaussCannon",
        damage: 150,
        range: 1000,
        cooldown: 2,
        accuracy: 0.9,
        effects: [{ type: "gauss", damage: 50, duration: 2 }],
      },
    ],
    abilities: [
      {
        name: "Phase Shift",
        cooldown: 20,
        duration: 5,
        effect: { type: "stealth", magnitude: 1 },
      },
    ],
  },
  // ... similar configurations for other Lost Nova ships

  // Equator Horizon Ships
  "celestial-arbiter": {
    health: 1500,
    shield: 1000,
    armor: 500,
    speed: 80,
    turnRate: 1,
    weapons: [
      {
        type: "railGun",
        damage: 300,
        range: 1500,
        cooldown: 3,
        accuracy: 0.95,
        effects: [{ type: "gauss", damage: 100, duration: 3 }],
      },
    ],
    abilities: [
      {
        name: "Balance Restoration",
        cooldown: 45,
        duration: 15,
        effect: { type: "shield", magnitude: 2, radius: 500 },
      },
    ],
  },
  // ... similar configurations for other Equator Horizon ships
};

// Update ship class determination to use stats
function determineShipClass(unit: CombatUnit): ShipClass {
  const faction = unit.faction as FactionId;
  const status = unit.status.toLowerCase();

  // Get available ship classes for faction
  const factionShips = Object.keys(SHIP_STATS).filter((shipClass) => {
    if (faction === "space-rats") {
      return (
        shipClass.includes("rat") ||
        shipClass.includes("marauder") ||
        shipClass.includes("scourge")
      );
    }
    if (faction === "lost-nova") {
      return (
        shipClass.includes("nova") ||
        shipClass.includes("void") ||
        shipClass.includes("scythe")
      );
    }
    if (faction === "equator-horizon") {
      return (
        shipClass.includes("celestial") ||
        shipClass.includes("horizon") ||
        shipClass.includes("arbiter")
      );
    }
    return false;
  }) as ShipClass[];

  // Match ship class based on unit status and role
  if (status.includes("flagship")) {
    return (
      factionShips.find(
        (s) => (SHIP_STATS[s] || DEFAULT_SHIP_STATS).health > 1000,
      ) || factionShips[0]
    );
  }
  if (status.includes("stealth")) {
    return (
      factionShips.find((s) =>
        (SHIP_STATS[s] || DEFAULT_SHIP_STATS).abilities.some(
          (a) => a.effect.type === "stealth",
        ),
      ) || factionShips[0]
    );
  }
  if (status.includes("heavy")) {
    return (
      factionShips.find(
        (s) => (SHIP_STATS[s] || DEFAULT_SHIP_STATS).armor > 300,
      ) || factionShips[0]
    );
  }

  // Default to first available ship class
  return factionShips[0];
}

// Update fleet strength calculation to use stats
function calculateFleetStrength(units: CombatUnit[]): number {
  return units.reduce((total, unit) => {
    const shipClass = determineShipClass(unit);
    const stats = SHIP_STATS[shipClass] || DEFAULT_SHIP_STATS;
    const healthPercent = unit.health / unit.maxHealth;

    const baseStrength = stats.health + stats.shield + stats.armor;
    const weaponStrength = stats.weapons.reduce(
      (sum, w) => sum + w.damage * w.accuracy,
      0,
    );
    const abilityStrength = stats.abilities.reduce((sum, a) => {
      if (a.effect.type === "damage") {
        return sum + a.effect.magnitude * 100;
      }
      return sum + 50; // Base value for utility abilities
    }, 0);

    return (
      total + (baseStrength + weaponStrength + abilityStrength) * healthPercent
    );
  }, 0);
}

function determineShipStatus(unit: CombatUnit): FactionShip["status"] {
  // Determine ship status based on unit state
  if (unit.target) {
    return "engaging";
  }
  return "patrolling";
}

function determineFormation(units: CombatUnit[]): FactionFleet["formation"] {
  return {
    type: "defensive",
    spacing: 50,
    facing: Math.atan2(units[0].position.y, units[0].position.x),
  };
}

function generateControlPoints(
  center: { x: number; y: number },
  radius: number,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
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

function calculateThreatLevel(
  center: { x: number; y: number },
  radius: number,
): number {
  const threats = combatManager.getThreatsInTerritory({
    center,
    radius,
  });

  return Math.min(1, threats.length / 10);
}

function calculateTerritorySystems(territory: FactionTerritory): number {
  // Placeholder - implement actual system counting logic
  return Math.floor(territory.radius / 1000);
}

function calculateResourceIncome(territory: FactionTerritory): {
  minerals: number;
  gas: number;
  exotic: number;
} {
  // Placeholder - implement actual resource calculation logic
  return {
    minerals: territory.resources.minerals * 0.1,
    gas: territory.resources.gas * 0.1,
    exotic: territory.resources.exotic * 0.1,
  };
}

function determineNextAction(
  tactic: FactionBehaviorState["behaviorState"]["currentTactic"],
): string {
  switch (tactic) {
    case "raid":
      return "prepare_raid_fleet";
    case "defend":
      return "fortify_positions";
    case "expand":
      return "scout_territory";
    case "trade":
      return "establish_trade_route";
    default:
      return "patrol";
  }
}

function executeFactionDecisions(state: FactionBehaviorState): void {
  const config = FACTION_CONFIGS[state.id];

  // Handle state machine triggers
  handleStateMachineTriggers(state);

  // Execute faction-specific behavior based on current state
  switch (state.id) {
    case "space-rats":
      executeSpaceRatsBehavior(state);
      break;
    case "lost-nova":
      executeLostNovaBehavior(state);
      break;
    case "equator-horizon":
      executeEquatorHorizonBehavior(state);
      break;
  }

  // Check spawn conditions
  if (shouldSpawnNewShip(state, config)) {
    const spawnPoint = selectSpawnPoint(state.territory);
    factionManager.spawnShip(state.id, spawnPoint);
  }
}

function findNearbyEnemies(state: FactionBehaviorState): CombatUnit[] {
  return Array.from(
    combatManager.getUnitsInRange(
      state.territory.center,
      state.territory.radius,
    ),
  ).filter((unit) => unit.faction !== state.id);
}

function calculatePlayerPower(): number {
  // Placeholder: Implement actual player power calculation
  return Math.random();
}

function isAmbushOpportunity(state: FactionBehaviorState): boolean {
  // Check if we have enough stealth ships and the enemy is vulnerable
  const stealthShips = state.fleets
    .flatMap((fleet) => fleet.ships)
    .filter(
      (ship) =>
        ship.class === "quantum-pariah" || ship.class === "rogue-nebula",
    ).length;

  const hasEnoughStealthForces = stealthShips >= 3;
  const enemyIsVulnerable = state.territory.threatLevel < 0.3;

  return hasEnoughStealthForces && enemyIsVulnerable;
}

function shouldSpawnNewShip(
  state: FactionBehaviorState,
  config: (typeof FACTION_CONFIGS)[FactionId],
): boolean {
  if (state.stats.totalShips >= config.maxShips) {
    return false;
  }

  // Faction-specific spawn conditions
  switch (state.id) {
    case "space-rats":
      return Math.random() < 0.1; // Regular spawning
    case "lost-nova":
      return state.behaviorState.aggression > 0.5 && Math.random() < 0.05;
    case "equator-horizon":
      return state.stateMachine.current !== "dormant" && Math.random() < 0.03;
    default:
      return false;
  }
}

// Faction-specific behavior implementations
function executeSpaceRatsBehavior(state: FactionBehaviorState): void {
  switch (state.stateMachine.current) {
    case "patrolling":
      executePatrolPattern(state);
      break;
    case "aggressive":
      executeAggressiveRaids(state);
      break;
    case "pursuing":
      executePursuit(state);
      break;
  }
}

function executeLostNovaBehavior(state: FactionBehaviorState): void {
  switch (state.stateMachine.current) {
    case "hiding":
      executeStealthMode(state);
      break;
    case "preparing":
      prepareAmbush(state);
      break;
    case "ambushing":
      executeAmbush(state);
      break;
  }
}

function executeEquatorHorizonBehavior(state: FactionBehaviorState): void {
  switch (state.stateMachine.current) {
    case "enforcing":
      executeBalanceEnforcement(state);
      break;
    case "overwhelming":
      executeOverwhelmingForce(state);
      break;
    case "withdrawing":
      executeStrategicWithdrawal(state);
      break;
  }
}

// Placeholder implementations for behavior patterns
function executePatrolPattern(state: FactionBehaviorState): void {
  if (!state.fleets.length) {
    return;
  }

  state.fleets.forEach((fleet) => {
    const patrolPoints = generatePatrolPoints(state.territory);
    fleet.ships.forEach((ship, index) => {
      const targetPoint = patrolPoints[index % patrolPoints.length];
      combatManager.moveUnit(ship.id, targetPoint);
    });
  });
}

function executeAggressiveRaids(state: FactionBehaviorState): void {
  state.fleets.forEach((fleet) => {
    const nearbyEnemies = findNearbyEnemies(state);
    if (nearbyEnemies.length > 0) {
      const target = nearbyEnemies[0];
      fleet.ships.forEach((ship) => {
        combatManager.engageTarget(ship.id, target.id);
      });
    }
  });
}

function executePursuit(state: FactionBehaviorState): void {
  state.fleets.forEach((fleet) => {
    const leadShip = fleet.ships[0];
    if (leadShip?.target) {
      const targetUnit = Array.from(
        combatManager.getUnitsInRange(leadShip.position, 1000),
      ).find((unit) => unit.id === leadShip.target);
      if (targetUnit) {
        fleet.ships.forEach((ship) => {
          combatManager.moveUnit(ship.id, targetUnit.position);
        });
      }
    }
  });
}

function executeStealthMode(state: FactionBehaviorState): void {
  state.fleets.forEach((fleet) => {
    const safePoints = findStealthPoints(state.territory);
    fleet.ships.forEach((ship, index) => {
      const targetPoint = safePoints[index % safePoints.length];
      combatManager.moveUnit(ship.id, targetPoint);
    });
  });
}

function prepareAmbush(state: FactionBehaviorState): void {
  state.fleets.forEach((fleet) => {
    const ambushPoints = calculateAmbushPoints(state.territory);
    fleet.ships.forEach((ship, index) => {
      const targetPoint = ambushPoints[index % ambushPoints.length];
      combatManager.moveUnit(ship.id, targetPoint);
    });
  });
}

function executeAmbush(state: FactionBehaviorState): void {
  state.fleets.forEach((fleet) => {
    const nearbyTargets = findNearbyEnemies(state);
    if (nearbyTargets.length > 0) {
      fleet.ships.forEach((ship) => {
        const target =
          nearbyTargets[Math.floor(Math.random() * nearbyTargets.length)];
        combatManager.engageTarget(ship.id, target.id);
      });
    }
  });
}

function executeBalanceEnforcement(state: FactionBehaviorState): void {
  state.fleets.forEach((fleet) => {
    const dominantFaction = findDominantFaction(state);
    if (dominantFaction) {
      const targets = Array.from(
        combatManager.getUnitsInRange(fleet.ships[0].position, 1000),
      ).filter((unit) => unit.faction === dominantFaction);
      if (targets.length > 0) {
        fleet.ships.forEach((ship) => {
          const target = targets[Math.floor(Math.random() * targets.length)];
          combatManager.engageTarget(ship.id, target.id);
        });
      }
    }
  });
}

function executeOverwhelmingForce(state: FactionBehaviorState): void {
  state.fleets.forEach((fleet) => {
    const target = findHighValueTarget(state);
    if (target) {
      fleet.ships.forEach((ship) => {
        combatManager.engageTarget(ship.id, target.id);
      });
    }
  });
}

function executeStrategicWithdrawal(state: FactionBehaviorState): void {
  state.fleets.forEach((fleet) => {
    const retreatPoints = findRetreatPoints(state.territory);
    fleet.ships.forEach((ship, index) => {
      const targetPoint = retreatPoints[index % retreatPoints.length];
      combatManager.moveUnit(ship.id, targetPoint);
    });
  });
}

// Additional helper functions for behavior implementations
function generatePatrolPoints(
  territory: FactionTerritory,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const count = 8;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    points.push({
      x: territory.center.x + Math.cos(angle) * territory.radius * 0.8,
      y: territory.center.y + Math.sin(angle) * territory.radius * 0.8,
    });
  }
  return points;
}

function findStealthPoints(
  territory: FactionTerritory,
): Array<{ x: number; y: number }> {
  // Find points with good cover or minimal enemy presence
  return generatePatrolPoints(territory).map((point) => ({
    x: point.x + (Math.random() - 0.5) * 100,
    y: point.y + (Math.random() - 0.5) * 100,
  }));
}

function calculateAmbushPoints(
  territory: FactionTerritory,
): Array<{ x: number; y: number }> {
  // Calculate strategic points for ambush
  return generatePatrolPoints(territory).map((point) => ({
    x: point.x + (Math.random() - 0.5) * 200,
    y: point.y + (Math.random() - 0.5) * 200,
  }));
}

function findRetreatPoints(
  territory: FactionTerritory,
): Array<{ x: number; y: number }> {
  // Find safe points away from combat
  return generatePatrolPoints(territory).map((point) => ({
    x: point.x + (Math.random() - 0.5) * 300,
    y: point.y + (Math.random() - 0.5) * 300,
  }));
}

function findDominantFaction(state: FactionBehaviorState): string | undefined {
  const factionStrengths = new Map<string, number>();

  // Calculate strength for each faction
  Array.from(
    combatManager.getUnitsInRange(
      state.territory.center,
      state.territory.radius,
    ),
  ).forEach((unit) => {
    const strength = factionStrengths.get(unit.faction) || 0;
    factionStrengths.set(unit.faction, strength + 1);
  });

  // Find faction with highest strength
  let maxStrength = 0;
  let dominantFaction: string | undefined;

  factionStrengths.forEach((strength, faction) => {
    if (strength > maxStrength && faction !== state.id) {
      maxStrength = strength;
      dominantFaction = faction;
    }
  });

  return dominantFaction;
}

function findHighValueTarget(
  state: FactionBehaviorState,
): CombatUnit | undefined {
  const targets = Array.from(
    combatManager.getUnitsInRange(
      state.territory.center,
      state.territory.radius,
    ),
  )
    .filter((unit) => unit.faction !== state.id)
    .sort((a, b) => b.maxHealth - b.health - (a.maxHealth - a.health));

  return targets[0];
}

function selectSpawnPoint(territory: FactionTerritory): {
  x: number;
  y: number;
} {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * territory.radius * 0.8;

  return {
    x: territory.center.x + Math.cos(angle) * distance,
    y: territory.center.y + Math.sin(angle) * distance,
  };
}
