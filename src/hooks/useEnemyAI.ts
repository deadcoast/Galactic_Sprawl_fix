import { useState, useEffect } from 'react';
import { factionManager } from '../lib/factionManager';

interface CombatManager {
  getUnitStatus: (unitId: string) => CombatUnit | undefined;
  engageTarget: (unitId: string, targetId: string) => void;
  moveUnit: (unitId: string, position: { x: number; y: number }) => void;
  getUnitsInRange: (position: { x: number; y: number }, range: number) => CombatUnit[];
}

declare const combatManager: CombatManager;

interface AIState {
  behaviorState: 'idle' | 'patrolling' | 'engaging' | 'retreating';
  targetId?: string;
  lastDecision: number;
  currentPath?: { x: number; y: number }[];
  fleetStrength: number;
  threatLevel: number;
}

interface CombatUnit {
  id: string;
  health: number;
  maxHealth: number;
  position: { x: number; y: number };
  faction: string;
  status: string;
}

interface FactionState {
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

export function useEnemyAI(unitId: string, factionId: string) {
  const [aiState, setAIState] = useState<AIState>({
    behaviorState: 'idle',
    lastDecision: Date.now(),
    fleetStrength: 1,
    threatLevel: 0
  });

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const unit = combatManager.getUnitStatus(unitId);
      const faction = factionManager.getFactionState(factionId);
      
      if (!unit || !faction) {
        return;
      }

      // Update AI state based on behavior tree evaluation
      const newState = evaluateBehaviorTree(unit, faction, aiState);
      setAIState(newState);
      
      // Execute actions based on state
      executeAIActions(newState, unit);
    }, 250); // Fast updates for combat

    return () => clearInterval(updateInterval);
  }, [unitId, factionId, aiState]);

  return aiState;
}

function evaluateBehaviorTree(
  unit: CombatUnit,
  faction: FactionState,
  currentState: AIState
): AIState {
  const newState = { ...currentState };
  const now = Date.now();

  // Only make new decisions periodically
  if (now - currentState.lastDecision < 1000) {
    return currentState;
  }

  // Update metrics
  newState.fleetStrength = unit.health / unit.maxHealth;
  newState.threatLevel = calculateThreatLevel(unit) * (faction.fleetStrength > 0.5 ? 0.8 : 1.2); // Adjust threat based on faction strength
  newState.lastDecision = now;

  // Behavior Tree Logic
  if (shouldRetreat(unit, newState.threatLevel)) {
    newState.behaviorState = 'retreating';
    newState.targetId = undefined;
    return newState;
  }

  if (unit.status === 'disabled') {
    newState.behaviorState = 'idle';
    newState.targetId = undefined;
    return newState;
  }

  const nearbyTarget = findNearbyTarget(unit);
  if (nearbyTarget) {
    newState.behaviorState = 'engaging';
    newState.targetId = nearbyTarget.id;
    return newState;
  }

  if (currentState.behaviorState !== 'patrolling') {
    newState.behaviorState = 'patrolling';
    newState.currentPath = generatePatrolPath(unit);
  }

  return newState;
}

function executeAIActions(state: AIState, unit: CombatUnit) {
  switch (state.behaviorState) {
    case 'engaging':
      if (state.targetId) {
        combatManager.engageTarget(unit.id, state.targetId);
      }
      break;
      
    case 'retreating': {
      const retreatPoint = findRetreatPoint(unit);
      combatManager.moveUnit(unit.id, retreatPoint);
      break;
    }
      
    case 'patrolling': {
      if (state.currentPath && state.currentPath.length > 0) {
        const nextPoint = state.currentPath[0];
        combatManager.moveUnit(unit.id, nextPoint);
      }
      break;
    }
  }
}

function shouldRetreat(unit: CombatUnit, threatLevel: number): boolean {
  // Retreat if health is low or overwhelmed
  return unit.health < unit.maxHealth * 0.3 || threatLevel > 0.7;
}

function calculateThreatLevel(unit: CombatUnit): number {
  // Calculate based on nearby enemies and their strength
  const nearbyEnemies = findNearbyEnemies(unit);
  let threat = 0;
  
  nearbyEnemies.forEach(enemy => {
    const distance = getDistance(unit.position, enemy.position);
    const healthFactor = enemy.health / enemy.maxHealth;
    threat += (healthFactor * (1 - distance / 1000));
  });
  
  return Math.min(1, threat);
}

function findNearbyTarget(unit: CombatUnit) {
  const targets = findNearbyEnemies(unit);
  if (targets.length === 0) {
    return null;
  }
  
  return targets.slice(1).reduce((closest, current) => {
    const closestDist = getDistance(unit.position, closest.position);
    const currentDist = getDistance(unit.position, current.position);
    return currentDist < closestDist ? current : closest;
  }, targets[0]);
}

function findNearbyEnemies(unit: CombatUnit) {
  // Get all units within detection range
  return combatManager.getUnitsInRange(unit.position, 1000)
    .filter(other => other.faction !== unit.faction);
}

function generatePatrolPath(unit: CombatUnit) {
  // Generate a patrol route around current position
  const points = [];
  const radius = 200;
  const steps = 8;
  
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    points.push({
      x: unit.position.x + Math.cos(angle) * radius,
      y: unit.position.y + Math.sin(angle) * radius
    });
  }
  
  return points;
}

function findRetreatPoint(unit: CombatUnit) {
  // Find safe direction away from threats
  const threats = findNearbyEnemies(unit);
  if (threats.length === 0) {
    return {
      x: unit.position.x - 500,
      y: unit.position.y - 500
    };
  }
  
  // Average threat position
  const avgThreat = threats.reduce(
    (acc, threat) => ({
      x: acc.x + threat.position.x / threats.length,
      y: acc.y + threat.position.y / threats.length
    }),
    { x: 0, y: 0 }
  );
  
  // Retreat in opposite direction
  const dx = unit.position.x - avgThreat.x;
  const dy = unit.position.y - avgThreat.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  return {
    x: unit.position.x + (dx / dist) * 500,
    y: unit.position.y + (dy / dist) * 500
  };
}

function getDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}