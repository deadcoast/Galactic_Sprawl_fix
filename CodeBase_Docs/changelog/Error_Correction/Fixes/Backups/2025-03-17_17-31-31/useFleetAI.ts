import { useEffect, useMemo, useState } from 'react';
import { getCombatManager } from '../../managers/ManagerRegistry';
import { factionManager } from '../../managers/factions/factionManager';
import { Position } from '../../types/core/GameTypes';
import { FactionId } from '../../types/ships/FactionTypes';
import { useAdaptiveAI } from './useAdaptiveAI';
import { useFactionBehavior } from './useFactionBehavior';

interface CombatUnit {
  id: string;
  faction: string;
  type:
    | 'spitflare'
    | 'starSchooner'
    | 'orionFrigate'
    | 'harbringerGalleon'
    | 'midwayCarrier'
    | 'motherEarthRevenge';
  tier: 1 | 2 | 3;
  position: { x: number; y: number };
  status: 'idle' | 'patrolling' | 'engaging' | 'returning' | 'damaged' | 'retreating' | 'disabled';
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: {
    id: string;
    type: 'machineGun' | 'gaussCannon' | 'railGun' | 'mgss' | 'rockets';
    range: number;
    damage: number;
    cooldown: number;
    status: 'ready' | 'charging' | 'cooling';
  }[];
  specialAbilities?: {
    name: string;
    description: string;
    cooldown: number;
    active: boolean;
  }[];
}

export interface Threat {
  id: string;
  position: { x: number; y: number };
  severity: 'low' | 'medium' | 'high';
}

export interface Fleet {
  id: string;
  units: CombatUnit[];
  direction: number;
}

declare module '../../managers/combat/CombatManager' {
  export interface CombatManager {
    getFleetStatus: (fleetId: string) => Fleet | undefined;
    getUnitsInRange: (position: { x: number; y: number }, range: number) => CombatUnit[];
    getThreatsInRange: (position: { x: number; y: number }, range: number) => Threat[];
    moveUnit: (unitId: string, position: { x: number; y: number }) => boolean;
  }
}

interface FleetFormation {
  type: 'line' | 'wedge' | 'circle' | 'scattered' | 'arrow' | 'diamond' | 'shield' | 'spearhead';
  spacing: number;
  facing: number;
  pattern: 'defensive' | 'offensive' | 'balanced';
  adaptiveSpacing: boolean;
  transitionSpeed?: number;
  subFormations?: {
    type: FleetFormation['type'];
    units: string[];
  }[];
}

interface CommandHierarchy {
  primaryOfficer?: {
    id: string;
    rank: number;
    commandRadius: number;
  };
  supportOfficers: Array<{
    id: string;
    rank: number;
    supportRadius: number;
  }>;
}

interface FleetAIState {
  formation: FleetFormation;
  engagementRange: number;
  supportRange: number;
  retreatThreshold: number;
  lastFormationChange: number;
  fleetStrength: number;
  combatStyle: 'aggressive' | 'defensive' | 'balanced';
  adaptiveLevel: number;
  threatAssessment: number;
  currentPositions: Position[];
  specialRules?: {
    alwaysHostile?: boolean;
    requiresProvocation?: boolean;
    powerThreshold?: number;
  };
  // Officer Integration
  assignedOfficer?: {
    id: string;
    rank: number;
    bonuses: {
      combatEfficiency: number;
      formationBonus: number;
      experienceGain: number;
    };
  };
  commandStructure?: CommandHierarchy;
  // Ship Hanger Integration
  hangarStatus: {
    currentTier: 1 | 2 | 3;
    upgradeProgress: number;
    dockingBayCapacity: number;
    repairEfficiency: number;
  };
  // Visual Enhancement Status
  visualState: {
    formationLines: boolean;
    threatIndicators: boolean;
    rangeCircles: boolean;
    effectIntensity: number;
  };
}

interface VisualFeedback {
  formationLines: {
    points: Array<{ x: number; y: number }>;
    style: 'solid' | 'dashed';
    color: string;
    opacity: number;
  };
  threatIndicators: Array<{
    position: { x: number; y: number };
    severity: 'low' | 'medium' | 'high';
    radius: number;
  }>;
  rangeCircles: Array<{
    center: { x: number; y: number };
    radius: number;
    type: 'engagement' | 'support';
    opacity: number;
  }>;
}

export function useFleetAI(fleetId: string, factionId: FactionId) {
  const [fleetState, setFleetState] = useState<FleetAIState>({
    formation: {
      type: 'line',
      spacing: 100,
      facing: 0,
      pattern: 'balanced',
      adaptiveSpacing: true,
    },
    engagementRange: 800,
    supportRange: 400,
    retreatThreshold: 0.3,
    lastFormationChange: Date.now(),
    fleetStrength: 1,
    combatStyle: 'balanced',
    adaptiveLevel: 0,
    threatAssessment: 0,
    currentPositions: [],
    hangarStatus: {
      currentTier: 1,
      upgradeProgress: 0,
      dockingBayCapacity: 5,
      repairEfficiency: 1,
    },
    visualState: {
      formationLines: true,
      threatIndicators: true,
      rangeCircles: true,
      effectIntensity: 1,
    },
  });

  // Integrate with other AI systems
  const adaptiveAI = useAdaptiveAI(fleetId, factionId);
  const factionBehavior = useFactionBehavior(factionId);

  // Memoize formation patterns based on fleet composition and tech level
  const formationPatterns = useMemo(
    () => ({
      defensive: {
        spacing: 150 * (1 + adaptiveAI.experienceLevel * 0.2),
        facing: 0,
        pattern: 'defensive' as const,
        adaptiveSpacing: true,
      },
      offensive: {
        spacing: 100 * (1 + adaptiveAI.experienceLevel * 0.2),
        facing: 0,
        pattern: 'offensive' as const,
        adaptiveSpacing: true,
      },
      balanced: {
        spacing: 120 * (1 + adaptiveAI.experienceLevel * 0.2),
        facing: 0,
        pattern: 'balanced' as const,
        adaptiveSpacing: true,
      },
    }),
    [adaptiveAI.experienceLevel]
  );

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const fleet = getCombatManager().getFleetStatus(fleetId);
      const faction = factionManager.getFactionState(factionId);

      if (!fleet || !faction) {
        return;
      }

      // Update fleet behavior and formation based on adaptive AI and faction behavior
      const newState = updateFleetBehavior(fleet, faction, fleetState, adaptiveAI, factionBehavior);

      // Update current positions
      const positions = fleet.units.map(unit => unit.position);
      setFleetState({ ...newState, currentPositions: positions });

      // Apply formation updates to fleet units
      applyFleetFormation(fleet, newState.formation);
    }, 500);

    return () => clearInterval(updateInterval);
  }, [fleetId, factionId, fleetState, adaptiveAI, factionBehavior]);

  return {
    ...fleetState,
    formationPatterns,
    adaptiveAI,
    factionBehavior,
  };
}

function updateFleetBehavior(
  fleet: { units: CombatUnit[] },
  faction: {
    fleetStrength: number;
    specialRules?: FleetAIState['specialRules'];
  },
  currentState: FleetAIState,
  adaptiveAI: ReturnType<typeof useAdaptiveAI>,
  factionBehavior: ReturnType<typeof useFactionBehavior>
): FleetAIState & { visualFeedback: VisualFeedback } {
  const newState = { ...currentState };
  const now = Date.now();

  // Apply officer bonuses if assigned
  const officerBonuses = currentState.assignedOfficer?.bonuses || {
    combatEfficiency: 1,
    formationBonus: 1,
    experienceGain: 1,
  };

  // Apply command hierarchy bonuses
  const commandBonus = calculateCommandBonus(currentState.commandStructure, fleet);

  // Apply hangar tier bonuses
  const hangarBonus = calculateHangarBonus(currentState.hangarStatus, fleet);

  // Update fleet strength with all bonuses
  newState.fleetStrength =
    calculateFleetStrength(fleet) *
    officerBonuses.combatEfficiency *
    commandBonus *
    hangarBonus.strengthMultiplier;

  newState.threatAssessment = calculateThreatLevel(fleet, faction);

  // Track combat experience for officer
  if (currentState.assignedOfficer && fleet.units.some(unit => unit.status === 'engaging')) {
    const experienceGained = Math.min(0.1, newState.fleetStrength * officerBonuses.experienceGain);
    emitOfficerExperience(currentState.assignedOfficer.id, experienceGained);
  }

  // Update hangar status based on fleet activity
  updateHangarStatus(newState, fleet);

  // Adapt combat style based on all influences
  newState.combatStyle = determineCombatStyle(
    adaptiveAI.adaptations.combatStyle,
    factionBehavior.behaviorState.aggression * officerBonuses.combatEfficiency * commandBonus,
    newState.fleetStrength
  );

  // Check for formation changes
  let formationPositions: Array<{ x: number; y: number }> = [];
  if (shouldChangeFormation(fleet, newState, adaptiveAI)) {
    newState.formation = selectNewFormation(fleet, newState, adaptiveAI, factionBehavior);
    // Apply all formation bonuses
    const totalFormationBonus =
      officerBonuses.formationBonus * commandBonus * hangarBonus.formationMultiplier;
    newState.formation.spacing *= totalFormationBonus;
    newState.lastFormationChange = now;
    formationPositions = calculateFormationPositions(fleet, newState.formation);
  }

  // Update engagement parameters
  updateEngagementParameters(newState, fleet, adaptiveAI);

  // Generate visual feedback based on current state
  const visualFeedback = generateVisualFeedback(
    fleet,
    newState,
    formationPositions,
    hangarBonus.strengthMultiplier
  );

  return { ...newState, visualFeedback };
}

// Helper function to emit officer experience events
function emitOfficerExperience(officerId: string, amount: number) {
  // This would be connected to your event system
  console.warn(`Officer ${officerId} gained ${amount} experience`);
}

function calculateFleetStrength(fleet: { units: CombatUnit[] }): number {
  const totalStrength = fleet.units.reduce((sum, unit) => {
    const healthFactor = unit.health / unit.maxHealth;
    const shieldFactor = unit.shield / unit.maxShield;
    const weaponFactor = unit.weapons.reduce((acc, w) => acc + w.damage, 0) / unit.weapons.length;

    return sum + (healthFactor * 0.4 + shieldFactor * 0.3 + weaponFactor * 0.3);
  }, 0);

  return totalStrength / fleet.units.length;
}

function calculateThreatLevel(
  fleet: { units: CombatUnit[] },
  faction: { fleetStrength: number }
): number {
  const nearbyThreats = getCombatManager().getThreatsInRange(getFleetCenter(fleet), 1500);
  let threatLevel = 0;

  nearbyThreats.forEach(threat => {
    const distance = getDistance(getFleetCenter(fleet), threat.position);
    const distanceFactor = 1 - Math.min(distance / 1500, 1);
    threatLevel +=
      distanceFactor * (threat.severity === 'high' ? 1 : threat.severity === 'medium' ? 0.6 : 0.3);
  });

  return Math.min(1, threatLevel * (1 / Math.max(0.1, faction.fleetStrength)));
}

function determineCombatStyle(
  aiStyle: 'aggressive' | 'defensive' | 'balanced',
  aggressionLevel: number,
  fleetStrength: number
): FleetAIState['combatStyle'] {
  if (fleetStrength < 0.3) {
    return 'defensive';
  }
  if (aggressionLevel > 0.7 && fleetStrength > 0.6) {
    return 'aggressive';
  }
  if (aggressionLevel < 0.3 || fleetStrength < 0.5) {
    return 'defensive';
  }
  return aiStyle;
}

function shouldChangeFormation(
  fleet: { units: CombatUnit[] },
  state: FleetAIState,
  adaptiveAI: ReturnType<typeof useAdaptiveAI>
): boolean {
  const now = Date.now();
  if (now - state.lastFormationChange < 5000) {
    return false;
  }

  const inCombat = fleet.units.some(unit => unit.status === 'engaging');
  const lowStrength = state.fleetStrength < state.retreatThreshold;
  const adaptiveChange = adaptiveAI.performance.survivalRate < 0.5;
  const spreadTooThin = isFleetSpreadTooThin(fleet, state.formation);

  return inCombat || lowStrength || adaptiveChange || spreadTooThin;
}

function selectNewFormation(
  fleet: { units: CombatUnit[] },
  state: FleetAIState,
  adaptiveAI: ReturnType<typeof useAdaptiveAI>,
  factionBehavior: ReturnType<typeof useFactionBehavior>
): FleetFormation {
  const unitCount = fleet.units.length;
  const inCombat = fleet.units.some(unit => unit.status === 'engaging');
  const hasCapitalShip = fleet.units.some(
    unit => unit.type === 'midwayCarrier' || unit.type === 'motherEarthRevenge'
  );

  // Determine optimal formation based on multiple factors
  if (inCombat) {
    if (state.combatStyle === 'defensive' || state.fleetStrength < 0.5) {
      return {
        type: 'shield',
        spacing: 150 * (1 + adaptiveAI.experienceLevel * 0.2),
        facing: calculateThreatDirection(fleet),
        pattern: 'defensive',
        adaptiveSpacing: true,
        transitionSpeed: 1.5,
      };
    }

    if (hasCapitalShip) {
      return {
        type: 'diamond',
        spacing: 120 * (1 + adaptiveAI.experienceLevel * 0.2),
        facing: calculateThreatDirection(fleet),
        pattern: 'balanced',
        adaptiveSpacing: true,
        transitionSpeed: 1.2,
      };
    }

    if (state.combatStyle === 'aggressive' && state.fleetStrength > 0.8) {
      return {
        type: 'spearhead',
        spacing: 100 * (1 + adaptiveAI.experienceLevel * 0.2),
        facing: calculateThreatDirection(fleet),
        pattern: 'offensive',
        adaptiveSpacing: true,
        transitionSpeed: 2.0,
      };
    }

    if (unitCount <= 3) {
      return {
        type: 'arrow',
        spacing: 100 * (1 + adaptiveAI.experienceLevel * 0.2),
        facing: calculateThreatDirection(fleet),
        pattern: 'offensive',
        adaptiveSpacing: true,
        transitionSpeed: 1.8,
      };
    }
  }

  // Default to scattered formation for non-combat situations
  return {
    type: 'scattered',
    spacing: 200 * (1 + adaptiveAI.experienceLevel * 0.1),
    facing: Math.atan2(factionBehavior.territory.center.y, factionBehavior.territory.center.x),
    pattern: 'balanced',
    adaptiveSpacing: true,
    transitionSpeed: 1.0,
  };
}

function updateEngagementParameters(
  state: FleetAIState,
  fleet: { units: CombatUnit[] },
  adaptiveAI: ReturnType<typeof useAdaptiveAI>
) {
  // Adjust ranges based on fleet composition and AI learning
  const hasLongRangeUnits = fleet.units.some(unit => unit.weapons.some(w => w.range > 1000));

  const experienceFactor = 1 + adaptiveAI.experienceLevel * 0.3;

  if (hasLongRangeUnits) {
    state.engagementRange = 1200 * experienceFactor;
    state.supportRange = 600 * experienceFactor;
  } else {
    state.engagementRange = 800 * experienceFactor;
    state.supportRange = 400 * experienceFactor;
  }

  // Adjust retreat threshold based on performance and fleet strength
  if (adaptiveAI.performance.survivalRate < 0.4) {
    state.retreatThreshold = Math.min(0.5, state.retreatThreshold + 0.1);
  } else if (adaptiveAI.performance.damageEfficiency > 0.7) {
    state.retreatThreshold = Math.max(0.2, state.retreatThreshold - 0.05);
  }
}

function applyFleetFormation(fleet: { units: CombatUnit[] }, formation: FleetFormation) {
  const positions = calculateFormationPositions(fleet, formation);

  fleet.units.forEach((unit, index) => {
    if (index < positions.length) {
      getCombatManager().moveUnit(unit.id, positions[index]);
    }
  });
}

function calculateFormationPositions(
  fleet: { units: CombatUnit[] },
  formation: FleetFormation
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const center = getFleetCenter(fleet);
  const unitCount = fleet.units.length;

  switch (formation.type) {
    case 'line':
      for (let i = 0; i < unitCount; i++) {
        const offset = (i - (unitCount - 1) / 2) * formation.spacing;
        positions.push({
          x: center.x + Math.cos(formation.facing) * offset,
          y: center.y + Math.sin(formation.facing) * offset,
        });
      }
      break;

    case 'wedge':
      for (let i = 0; i < unitCount; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2 === 0 ? -1 : 1;
        positions.push({
          x:
            center.x +
            Math.cos(formation.facing) * row * formation.spacing +
            Math.cos(formation.facing + Math.PI / 2) * col * formation.spacing,
          y:
            center.y +
            Math.sin(formation.facing) * row * formation.spacing +
            Math.sin(formation.facing + Math.PI / 2) * col * formation.spacing,
        });
      }
      break;

    case 'circle':
      for (let i = 0; i < unitCount; i++) {
        const angle = (i / unitCount) * Math.PI * 2;
        positions.push({
          x: center.x + Math.cos(angle) * formation.spacing,
          y: center.y + Math.sin(angle) * formation.spacing,
        });
      }
      break;

    case 'scattered':
      for (let i = 0; i < unitCount; i++) {
        const angle = (i / unitCount) * Math.PI * 2 + Math.random() * 0.5;
        const distance = formation.spacing * (0.8 + Math.random() * 0.4);
        positions.push({
          x: center.x + Math.cos(angle) * distance,
          y: center.y + Math.sin(angle) * distance,
        });
      }
      break;

    case 'arrow': {
      const arrowDepth = Math.ceil(unitCount / 3);
      for (let i = 0; i < unitCount; i++) {
        const row = Math.floor(i / 3);
        const col = (i % 3) - 1;
        positions.push({
          x:
            center.x +
            Math.cos(formation.facing) * row * formation.spacing +
            Math.cos(formation.facing + Math.PI / 2) *
              col *
              formation.spacing *
              (1 - row / arrowDepth),
          y:
            center.y +
            Math.sin(formation.facing) * row * formation.spacing +
            Math.sin(formation.facing + Math.PI / 2) *
              col *
              formation.spacing *
              (1 - row / arrowDepth),
        });
      }
      break;
    }

    case 'diamond': {
      for (let i = 0; i < unitCount; i++) {
        const layer = Math.floor(i / 4);
        const position = i % 4;
        const angle = (position * Math.PI) / 2 + formation.facing;
        const distance = layer * formation.spacing;
        positions.push({
          x: center.x + Math.cos(angle) * distance,
          y: center.y + Math.sin(angle) * distance,
        });
      }
      break;
    }

    case 'shield': {
      const frontArc = Math.PI * 0.6; // 108 degrees
      const rearArc = Math.PI * 0.3; // 54 degrees
      const frontUnits = Math.ceil(unitCount * 0.7);
      const rearUnits = unitCount - frontUnits;

      // Front arc
      for (let i = 0; i < frontUnits; i++) {
        const angle = formation.facing - frontArc / 2 + (i / (frontUnits - 1)) * frontArc;
        positions.push({
          x: center.x + Math.cos(angle) * formation.spacing,
          y: center.y + Math.sin(angle) * formation.spacing,
        });
      }

      // Rear arc
      for (let i = 0; i < rearUnits; i++) {
        const angle =
          formation.facing + Math.PI - rearArc / 2 + (i / Math.max(1, rearUnits - 1)) * rearArc;
        positions.push({
          x: center.x + Math.cos(angle) * (formation.spacing * 0.7),
          y: center.y + Math.sin(angle) * (formation.spacing * 0.7),
        });
      }
      break;
    }

    case 'spearhead': {
      const spearUnits = Math.ceil(unitCount * 0.3);
      const wingUnits = Math.floor((unitCount - spearUnits) / 2);

      // Spear tip
      for (let i = 0; i < spearUnits; i++) {
        positions.push({
          x: center.x + Math.cos(formation.facing) * i * formation.spacing,
          y: center.y + Math.sin(formation.facing) * i * formation.spacing,
        });
      }

      // Left wing
      for (let i = 0; i < wingUnits; i++) {
        positions.push({
          x: center.x + Math.cos(formation.facing + Math.PI * 0.8) * i * formation.spacing,
          y: center.y + Math.sin(formation.facing + Math.PI * 0.8) * i * formation.spacing,
        });
      }

      // Right wing
      for (let i = 0; i < wingUnits; i++) {
        positions.push({
          x: center.x + Math.cos(formation.facing - Math.PI * 0.8) * i * formation.spacing,
          y: center.y + Math.sin(formation.facing - Math.PI * 0.8) * i * formation.spacing,
        });
      }
      break;
    }
  }

  return positions;
}

function getFleetCenter(fleet: { units: CombatUnit[] }): {
  x: number;
  y: number;
} {
  return fleet.units.reduce(
    (acc, unit) => ({
      x: acc.x + unit.position.x / fleet.units.length,
      y: acc.y + unit.position.y / fleet.units.length,
    }),
    { x: 0, y: 0 }
  );
}

function calculateThreatDirection(fleet: { units: CombatUnit[] }): number {
  const threats = getCombatManager().getThreatsInRange(getFleetCenter(fleet), 1500);
  if (threats.length === 0) {
    return 0;
  }

  const avgThreat = threats.reduce(
    (acc, threat) => ({
      x: acc.x + threat.position.x / threats.length,
      y: acc.y + threat.position.y / threats.length,
    }),
    { x: 0, y: 0 }
  );

  const center = getFleetCenter(fleet);
  return Math.atan2(avgThreat.y - center.y, avgThreat.x - center.x);
}

function isFleetSpreadTooThin(fleet: { units: CombatUnit[] }, formation: FleetFormation): boolean {
  const positions = calculateFormationPositions(fleet, formation);
  const center = getFleetCenter(fleet);

  return positions.some(pos => {
    const dx = pos.x - center.x;
    const dy = pos.y - center.y;
    return Math.sqrt(dx * dx + dy * dy) > formation.spacing * 2;
  });
}

function getDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function calculateCommandBonus(
  commandStructure?: CommandHierarchy,
  fleet?: { units: CombatUnit[] }
): number {
  if (!commandStructure || !fleet) {
    return 1;
  }

  let bonus = 1;
  const fleetCenter = getFleetCenter(fleet);

  // Primary officer bonus
  if (commandStructure.primaryOfficer) {
    const { rank, commandRadius } = commandStructure.primaryOfficer;
    // Calculate distance-based command effectiveness
    const distanceFactor = Math.max(
      0,
      1 - getDistance(fleetCenter, { x: 0, y: 0 }) / commandRadius
    );
    bonus *= 1 + rank * 0.1 * distanceFactor; // 10% bonus per rank, scaled by distance
  }

  // Support officers bonus
  commandStructure.supportOfficers.forEach(officer => {
    const { rank, supportRadius } = officer;
    // Calculate distance-based support effectiveness
    const distanceFactor = Math.max(
      0,
      1 - getDistance(fleetCenter, { x: 0, y: 0 }) / supportRadius
    );
    // Diminishing returns for support officers
    bonus *= 1 + rank * 0.05 * distanceFactor; // 5% bonus per rank for support, scaled by distance
  });

  return Math.min(2, bonus); // Cap total bonus at 100%
}

interface HangarBonus {
  strengthMultiplier: number;
  formationMultiplier: number;
  repairRate: number;
}

function calculateHangarBonus(
  hangarStatus: FleetAIState['hangarStatus'],
  fleet: { units: CombatUnit[] }
): HangarBonus {
  const { currentTier, upgradeProgress, repairEfficiency, dockingBayCapacity } = hangarStatus;

  // Base multipliers increase with tier
  const baseMultiplier = 1 + (currentTier - 1) * 0.2; // 20% increase per tier

  // Additional bonus from upgrade progress
  const progressBonus = upgradeProgress * 0.1; // Up to 10% from progress

  // Calculate capacity utilization factor
  const capacityFactor = Math.min(1, dockingBayCapacity / fleet.units.length);

  // Adjust multipliers based on fleet composition
  const advancedShipCount = fleet.units.filter(unit => unit.tier >= currentTier).length;
  const compositionBonus = (advancedShipCount / fleet.units.length) * 0.15; // Up to 15% bonus for advanced ships

  // Calculate repair rate based on tier, efficiency, and fleet size
  const repairRate = currentTier * 0.05 * repairEfficiency * capacityFactor;

  return {
    strengthMultiplier: (baseMultiplier + progressBonus + compositionBonus) * capacityFactor,
    formationMultiplier: baseMultiplier * capacityFactor,
    repairRate,
  };
}

function updateHangarStatus(state: FleetAIState, fleet: { units: CombatUnit[] }) {
  const { hangarStatus } = state;
  const activeUnits = fleet.units.length;

  // Check docking bay capacity
  if (activeUnits > hangarStatus.dockingBayCapacity) {
    // Reduce repair efficiency when over capacity
    hangarStatus.repairEfficiency *= 0.8;
  } else {
    // Restore repair efficiency when within capacity
    hangarStatus.repairEfficiency = Math.min(1, hangarStatus.repairEfficiency * 1.2);
  }

  // Update upgrade progress based on fleet performance
  if (state.fleetStrength > 0.8 && hangarStatus.currentTier < 3) {
    hangarStatus.upgradeProgress = Math.min(1, hangarStatus.upgradeProgress + 0.001);

    // Check for tier upgrade
    if (hangarStatus.upgradeProgress >= 1) {
      hangarStatus.currentTier = Math.min(3, hangarStatus.currentTier + 1) as 1 | 2 | 3;
      hangarStatus.upgradeProgress = 0;
      hangarStatus.dockingBayCapacity += 5; // Increase capacity with tier
    }
  }
}

function generateVisualFeedback(
  fleet: { units: CombatUnit[] },
  state: FleetAIState,
  formationPositions: Array<{ x: number; y: number }>,
  strengthMultiplier: number
): VisualFeedback {
  const center = getFleetCenter(fleet);

  // Generate formation lines
  const formationLines = {
    points: formationPositions,
    style: state.fleetStrength > 0.7 ? 'solid' : 'dashed',
    color:
      state.combatStyle === 'aggressive'
        ? '#ef4444'
        : state.combatStyle === 'defensive'
          ? '#3b82f6'
          : '#a855f7',
    opacity: state.visualState.effectIntensity * strengthMultiplier,
  } as const;

  // Generate threat indicators
  const threats = getCombatManager().getThreatsInRange(center, 1500);
  const threatIndicators = threats.map(threat => ({
    position: threat.position,
    severity: threat.severity,
    radius: 30 * (threat.severity === 'high' ? 1.5 : threat.severity === 'medium' ? 1.2 : 1),
  }));

  // Generate range circles
  const rangeCircles = [
    {
      center,
      radius: state.engagementRange,
      type: 'engagement' as const,
      opacity: state.visualState.effectIntensity * 0.3,
    },
    {
      center,
      radius: state.supportRange,
      type: 'support' as const,
      opacity: state.visualState.effectIntensity * 0.2,
    },
  ];

  return {
    formationLines,
    threatIndicators,
    rangeCircles,
  };
}
