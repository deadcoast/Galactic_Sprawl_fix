import { useState, useEffect } from 'react';

interface CombatUnit {
  id: string;
  faction: string;
  position: { x: number; y: number };
}

interface CombatManager {
  getUnitsInRange: (position: { x: number; y: number }, range: number) => CombatUnit[];
  getThreatsInTerritory: (territory: { center: { x: number; y: number }; radius: number }) => Threat[];
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
  expandTerritory: (factionId: string, position: { x: number; y: number }) => void;
}

declare const factionManager: FactionManager;

interface FactionBehavior {
  aggressionLevel: number;
  expansionPriority: number;
  tradingPreference: number;
  territorialControl: {
    center: { x: number; y: number };
    radius: number;
    controlPoints: { x: number; y: number }[];
  };
  activeFleets: number;
  maxFleets: number;
  fleetStrength: number;
  threatResponse: 'passive' | 'defensive' | 'aggressive';
  specialRules: {
    alwaysHostile?: boolean;
    requiresProvocation?: boolean;
    powerThreshold?: number;
  };
}

export function useFactionBehavior(factionId: string) {
  const [behavior, setBehavior] = useState<FactionBehavior>({
    aggressionLevel: 0.5,
    expansionPriority: 0.5,
    tradingPreference: 0.5,
    territorialControl: {
      center: { x: 0, y: 0 },
      radius: 100,
      controlPoints: []
    },
    activeFleets: 0,
    maxFleets: 10,
    fleetStrength: 0,
    threatResponse: 'defensive',
    specialRules: {}
  });

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const faction = factionManager.getFactionState(factionId);
      if (!faction) {
        return;
      }

      // Update behavior based on current state
      const newBehavior = calculateFactionBehavior(faction);
      setBehavior(newBehavior);

      // Execute faction-level decisions
      executeFactionDecisions(newBehavior, faction);
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [factionId]);

  return behavior;
}

function calculateFactionBehavior(faction: FactionState): FactionBehavior {
  const config = factionManager.getFactionConfig(faction.id);
  if (!config) {
    throw new Error(`No config for faction ${faction.id}`);
  }

  // Calculate dynamic behavior values
  const aggressionLevel = calculateAggressionLevel(faction, config);
  const expansionPriority = calculateExpansionPriority(faction, config);
  const tradingPreference = calculateTradingPreference(faction, config);

  // Update territorial control
  const territory = updateTerritorialControl(faction);

  return {
    aggressionLevel,
    expansionPriority,
    tradingPreference,
    territorialControl: territory,
    activeFleets: faction.activeShips,
    maxFleets: config.spawnConditions.maxShips,
    fleetStrength: faction.fleetStrength,
    threatResponse: determineThreatResponse(aggressionLevel),
    specialRules: config.specialRules
  };
}

function calculateAggressionLevel(faction: FactionState, config: FactionConfig): number {
  let aggression = config.behavior.baseAggression;

  // Modify based on current state
  if (faction.fleetStrength < 0.5) {
    aggression *= 0.5;
  }
  if (faction.relationshipWithPlayer < -0.5) {
    aggression *= 1.5;
  }

  // Special rules modifications
  if (config.specialRules.alwaysHostile) {
    aggression = Math.max(0.8, aggression);
  }
  if (config.specialRules.requiresProvocation && faction.relationshipWithPlayer > -0.3) {
    aggression *= 0.3;
  }

  return Math.min(1, Math.max(0, aggression));
}

function calculateExpansionPriority(faction: FactionState, config: FactionConfig): number {
  let priority = config.behavior.expansionRate;

  // Modify based on current state
  const territoryUtilization = faction.activeShips / config.spawnConditions.maxShips;
  priority *= (1 - territoryUtilization);

  // Reduce expansion when under threat
  const threats = combatManager.getThreatsInTerritory(faction.territory);
  if (threats.length > 0) {
    priority *= 0.5;
  }

  return Math.min(1, Math.max(0, priority));
}

function calculateTradingPreference(faction: FactionState, config: FactionConfig): number {
  let preference = config.behavior.tradingPreference;

  // Modify based on relationships
  if (faction.relationshipWithPlayer > 0) {
    preference *= 1.5;
  }

  // Special rules modifications
  if (config.specialRules.alwaysHostile) {
    preference = 0;
  }

  return Math.min(1, Math.max(0, preference));
}

function updateTerritorialControl(faction: FactionState) {
  const territory = { ...faction.territory };
  const controlPoints: { x: number; y: number }[] = [];

  // Generate control points around territory
  const points = 8;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    controlPoints.push({
      x: territory.center.x + Math.cos(angle) * territory.radius,
      y: territory.center.y + Math.sin(angle) * territory.radius
    });
  }

  return {
    ...territory,
    controlPoints
  };
}

function determineThreatResponse(aggressionLevel: number): FactionBehavior['threatResponse'] {
  if (aggressionLevel > 0.7) {
    return 'aggressive';
  }
  if (aggressionLevel < 0.3) {
    return 'passive';
  }
  return 'defensive';
}

function executeFactionDecisions(behavior: FactionBehavior, faction: FactionState) {
  // Spawn new ships if needed
  if (behavior.activeFleets < behavior.maxFleets && Math.random() < 0.1) {
    const spawnPoint = selectSpawnPoint(behavior.territorialControl);
    factionManager.spawnShip(faction.id, spawnPoint);
  }

  // Adjust territory
  if (behavior.expansionPriority > 0.7) {
    const expansionPoint = selectExpansionPoint(behavior.territorialControl);
    factionManager.expandTerritory(faction.id, expansionPoint);
  }

  // Handle threats
  if (behavior.threatResponse !== 'passive') {
    const threats = combatManager.getThreatsInTerritory(behavior.territorialControl);
    if (threats.length > 0) {
      handleThreats(threats, behavior, faction);
    }
  }
}

function selectSpawnPoint(territory: FactionBehavior['territorialControl']): { x: number; y: number } {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * territory.radius * 0.8;
  
  return {
    x: territory.center.x + Math.cos(angle) * distance,
    y: territory.center.y + Math.sin(angle) * distance
  };
}

function selectExpansionPoint(territory: FactionBehavior['territorialControl']): { x: number; y: number } {
  // Find the largest gap between control points
  let maxGap = 0;
  let gapCenter = { x: 0, y: 0 };
  
  for (let i = 0; i < territory.controlPoints.length; i++) {
    const p1 = territory.controlPoints[i];
    const p2 = territory.controlPoints[(i + 1) % territory.controlPoints.length];
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > maxGap) {
      maxGap = distance;
      gapCenter = {
        x: p1.x + dx / 2,
        y: p1.y + dy / 2
      };
    }
  }
  
  return gapCenter;
}

function handleThreats(threats: Threat[], behavior: FactionBehavior, faction: FactionState) {
  threats.forEach(threat => {
    if (behavior.threatResponse === 'aggressive') {
      // Send attack fleet
      const nearbyShips = combatManager.getUnitsInRange(threat.position, 500)
        .filter((unit: CombatUnit) => unit.faction === faction.id);
      
      if (nearbyShips.length >= 3) {
        nearbyShips.forEach((ship: CombatUnit) => {
          combatManager.engageTarget(ship.id, threat.id);
        });
      }
    } else {
      // Defensive response - protect territory
      const nearbyShips = combatManager.getUnitsInRange(threat.position, 800)
        .filter((unit: CombatUnit) => unit.faction === faction.id);
      
      nearbyShips.forEach((ship: CombatUnit) => {
        const defensivePosition = calculateDefensivePosition(threat, behavior.territorialControl);
        combatManager.moveUnit(ship.id, defensivePosition);
      });
    }
  });
}

function calculateDefensivePosition(
  threat: Threat,
  territory: FactionBehavior['territorialControl']
): { x: number; y: number } {
  // Position between threat and territory center
  const dx = territory.center.x - threat.position.x;
  const dy = territory.center.y - threat.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return {
    x: threat.position.x + (dx / distance) * 400,
    y: threat.position.y + (dy / distance) * 400
  };
}