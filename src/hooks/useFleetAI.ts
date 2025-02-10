import { useState, useEffect } from 'react';
import { combatManager } from '../lib/combatManager';
import { factionManager } from '../lib/factionManager';

interface CombatUnit {
  id: string;
  faction: string;
  position: { x: number; y: number };
  status: string;
  health: number;
  maxHealth: number;
  weapons: { range: number }[];
}

interface Threat {
  id: string;
  position: { x: number; y: number };
}

interface Fleet {
  id: string;
  units: CombatUnit[];
  direction: number;
}

declare module '../lib/combatManager' {
  export interface CombatManager {
    getFleetStatus: (fleetId: string) => Fleet | undefined;
    getUnitsInRange: (position: { x: number; y: number }, range: number) => CombatUnit[];
    getThreatsInRange: (position: { x: number; y: number }, range: number) => Threat[];
    moveUnit: (unitId: string, position: { x: number; y: number }) => void;
  }
}

interface FleetFormation {
  type: 'line' | 'wedge' | 'circle' | 'scattered';
  spacing: number;
  facing: number;
}

interface FleetAIState {
  formation: FleetFormation;
  engagementRange: number;
  supportRange: number;
  retreatThreshold: number;
  lastFormationChange: number;
  fleetStrength: number;
}

export function useFleetAI(fleetId: string, factionId: string) {
  const [fleetState, setFleetState] = useState<FleetAIState>({
    formation: {
      type: 'line',
      spacing: 100,
      facing: 0
    },
    engagementRange: 800,
    supportRange: 400,
    retreatThreshold: 0.3,
    lastFormationChange: Date.now(),
    fleetStrength: 1
  });

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const fleet = combatManager.getFleetStatus(fleetId);
      const faction = factionManager.getFactionState(factionId);
      
      if (!fleet || !faction) {
        return;
      }

      // Update fleet behavior and formation
      const newState = updateFleetBehavior(fleet, faction, fleetState);
      setFleetState(newState);
      
      // Apply formation updates to fleet units
      applyFleetFormation(fleet, newState.formation);
    }, 500);

    return () => clearInterval(updateInterval);
  }, [fleetId, factionId, fleetState]);

  return fleetState;
}

function updateFleetBehavior(
  fleet: any,
  faction: any,
  currentState: FleetAIState
): FleetAIState {
  const newState = { ...currentState };
  const now = Date.now();

  // Update fleet strength
  newState.fleetStrength = calculateFleetStrength(fleet);

  // Check for formation changes
  if (shouldChangeFormation(fleet, newState)) {
    newState.formation = selectNewFormation(fleet);
    newState.lastFormationChange = now;
  }

  // Adjust engagement parameters based on situation
  updateEngagementParameters(newState, fleet);

  return newState;
}

function calculateFleetStrength(fleet: any): number {
  const totalStrength = fleet.units.reduce((sum: number, unit: any) => {
    return sum + (unit.health / unit.maxHealth);
  }, 0);
  
  return totalStrength / fleet.units.length;
}

function shouldChangeFormation(fleet: any, state: FleetAIState): boolean {
  const now = Date.now();
  if (now - state.lastFormationChange < 5000) {
    return false;
  }

  // Check for significant changes in situation
  const inCombat = fleet.units.some((unit: any) => unit.status === 'engaging');
  const lowStrength = state.fleetStrength < state.retreatThreshold;
  const spreadTooThin = isFleetSpreadTooThin(fleet, state.formation);

  return inCombat || lowStrength || spreadTooThin;
}

function selectNewFormation(fleet: any): FleetFormation {
  const inCombat = fleet.units.some((unit: any) => unit.status === 'engaging');
  const unitCount = fleet.units.length;

  if (inCombat) {
    // Combat formations
    if (unitCount <= 3) {
      return { type: 'line', spacing: 100, facing: calculateThreatDirection(fleet) };
    } else if (unitCount <= 6) {
      return { type: 'wedge', spacing: 120, facing: calculateThreatDirection(fleet) };
    } else {
      return { type: 'circle', spacing: 150, facing: 0 };
    }
  } else {
    // Travel formation
    return { type: 'scattered', spacing: 200, facing: fleet.direction || 0 };
  }
}

function updateEngagementParameters(state: FleetAIState, fleet: any) {
  // Adjust ranges based on fleet composition and strength
  const hasLongRangeUnits = fleet.units.some((unit: any) => 
    unit.weapons.some((w: any) => w.range > 1000)
  );

  if (hasLongRangeUnits) {
    state.engagementRange = 1200;
    state.supportRange = 600;
  } else {
    state.engagementRange = 800;
    state.supportRange = 400;
  }

  // Adjust based on fleet strength
  if (state.fleetStrength < 0.5) {
    state.engagementRange *= 1.5; // Stay further back when weakened
    state.retreatThreshold = 0.4; // Retreat earlier
  } else {
    state.retreatThreshold = 0.3;
  }
}

function applyFleetFormation(fleet: any, formation: FleetFormation) {
  const positions = calculateFormationPositions(fleet, formation);
  
  // Apply positions to units
  fleet.units.forEach((unit: any, index: number) => {
    if (index < positions.length) {
      combatManager.moveUnit(unit.id, positions[index]);
    }
  });
}

function calculateFormationPositions(
  fleet: any,
  formation: FleetFormation
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const center = getFleetCenter(fleet);
  const unitCount = fleet.units.length;

  switch (formation.type) {
    case 'line':
      // Line formation
      for (let i = 0; i < unitCount; i++) {
        const offset = (i - (unitCount - 1) / 2) * formation.spacing;
        positions.push({
          x: center.x + Math.cos(formation.facing) * offset,
          y: center.y + Math.sin(formation.facing) * offset
        });
      }
      break;

    case 'wedge':
      // Wedge/V formation
      for (let i = 0; i < unitCount; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2 === 0 ? -1 : 1;
        positions.push({
          x: center.x + Math.cos(formation.facing) * row * formation.spacing +
             Math.cos(formation.facing + Math.PI/2) * col * formation.spacing,
          y: center.y + Math.sin(formation.facing) * row * formation.spacing +
             Math.sin(formation.facing + Math.PI/2) * col * formation.spacing
        });
      }
      break;

    case 'circle':
      // Circular formation
      for (let i = 0; i < unitCount; i++) {
        const angle = (i / unitCount) * Math.PI * 2;
        positions.push({
          x: center.x + Math.cos(angle) * formation.spacing,
          y: center.y + Math.sin(angle) * formation.spacing
        });
      }
      break;

    case 'scattered':
      // Scattered/flexible formation
      for (let i = 0; i < unitCount; i++) {
        const angle = (i / unitCount) * Math.PI * 2 + Math.random() * 0.5;
        const distance = formation.spacing * (0.8 + Math.random() * 0.4);
        positions.push({
          x: center.x + Math.cos(angle) * distance,
          y: center.y + Math.sin(angle) * distance
        });
      }
      break;
  }

  return positions;
}

function getFleetCenter(fleet: any): { x: number; y: number } {
  const center = fleet.units.reduce(
    (acc: { x: number; y: number }, unit: any) => ({
      x: acc.x + unit.position.x / fleet.units.length,
      y: acc.y + unit.position.y / fleet.units.length
    }),
    { x: 0, y: 0 }
  );
  
  return center;
}

function calculateThreatDirection(fleet: any): number {
  const threats = combatManager.getThreatsInRange(getFleetCenter(fleet), 1500);
  if (threats.length === 0) {
    return fleet.direction || 0;
  }

  // Calculate average threat position
  const avgThreat = threats.reduce(
    (acc: { x: number; y: number }, threat: any) => ({
      x: acc.x + threat.position.x / threats.length,
      y: acc.y + threat.position.y / threats.length
    }),
    { x: 0, y: 0 }
  );

  // Calculate angle to face threats
  const center = getFleetCenter(fleet);
  return Math.atan2(
    avgThreat.y - center.y,
    avgThreat.x - center.x
  );
}

function isFleetSpreadTooThin(fleet: any, formation: FleetFormation): boolean {
  const positions = calculateFormationPositions(fleet, formation);
  const center = getFleetCenter(fleet);
  
  // Check if any unit is too far from the center
  return positions.some(pos => {
    const dx = pos.x - center.x;
    const dy = pos.y - center.y;
    return Math.sqrt(dx * dx + dy * dy) > formation.spacing * 2;
  });
}