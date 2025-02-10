import { useState, useEffect } from 'react';
import { combatManager } from '../lib/combatManager';
import { factionManager } from '../lib/factionManager';

interface AdaptiveAIState {
  learningRate: number;
  experienceLevel: number;
  adaptations: {
    combatStyle: 'aggressive' | 'defensive' | 'balanced';
    preferredRange: 'close' | 'medium' | 'long';
    formationPreference: 'tight' | 'loose' | 'flexible';
    retreatThreshold: number;
  };
  performance: {
    winRate: number;
    survivalRate: number;
    damageEfficiency: number;
    objectiveCompletion: number;
  };
}

interface UnitStatus {
  id: string;
  status?: string;
  position?: { x: number; y: number };
}

interface CombatUnit extends UnitStatus {
  inCombat: boolean;
  successfulHits: number;
  combatHistory: { outcome: 'victory' | 'defeat' | 'retreat' }[];
  missionHistory: { survived: boolean }[];
  totalDamageDealt: number;
  totalDamageTaken: number;
  objectives: { completed: boolean }[];
}

interface FactionUnit {
  id: string;
  status: string;
  power: number;
}

export function useAdaptiveAI(unitId: string, factionId: string) {
  const [aiState, setAIState] = useState<AdaptiveAIState>({
    learningRate: 0.1,
    experienceLevel: 0,
    adaptations: {
      combatStyle: 'balanced',
      preferredRange: 'medium',
      formationPreference: 'flexible',
      retreatThreshold: 0.3
    },
    performance: {
      winRate: 0.5,
      survivalRate: 0.7,
      damageEfficiency: 0.6,
      objectiveCompletion: 0.5
    }
  });

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const unit = combatManager.getUnitStatus(unitId) as unknown as CombatUnit;
      const faction = factionManager.getFactionState(factionId) as unknown as FactionUnit;
      
      if (!unit || !faction) {
        return;
      }

      // Update AI adaptations based on performance
      const newState = updateAdaptations(unit, faction, aiState);
      setAIState(newState);
    }, 5000);

    return () => clearInterval(updateInterval);
  }, [unitId, factionId, aiState]);

  return aiState;
}

function updateAdaptations(
  unit: CombatUnit,
  faction: FactionUnit,
  currentState: AdaptiveAIState
): AdaptiveAIState {
  const newState = { ...currentState };

  // Update experience level
  newState.experienceLevel = calculateExperience(unit, currentState.experienceLevel);

  // Update performance metrics
  newState.performance = calculatePerformance(unit, faction);

  // Adapt combat behavior based on performance
  adaptCombatStyle(newState);
  adaptRangePreference(newState);
  adaptFormation(newState);
  adaptRetreatThreshold(newState);

  return newState;
}

function calculateExperience(unit: CombatUnit, currentExp: number): number {
  const combatBonus = unit.inCombat ? 0.001 : 0;
  const successBonus = unit.successfulHits ? unit.successfulHits * 0.002 : 0;
  
  return Math.min(1, currentExp + combatBonus + successBonus);
}

function calculatePerformance(unit: CombatUnit, faction: FactionUnit) {
  return {
    winRate: calculateWinRate(unit),
    survivalRate: calculateSurvivalRate(unit),
    damageEfficiency: calculateDamageEfficiency(unit),
    objectiveCompletion: calculateObjectiveCompletion(unit, faction)
  };
}

function calculateWinRate(unit: CombatUnit): number {
  const totalEngagements = unit.combatHistory?.length || 1;
  const wins = unit.combatHistory?.filter(combat => combat.outcome === 'victory').length || 0;
  return wins / totalEngagements;
}

function calculateSurvivalRate(unit: CombatUnit): number {
  const totalMissions = unit.missionHistory?.length || 1;
  const survivals = unit.missionHistory?.filter(mission => mission.survived).length || 0;
  return survivals / totalMissions;
}

function calculateDamageEfficiency(unit: CombatUnit): number {
  const damageDealt = unit.totalDamageDealt || 0;
  const damageTaken = unit.totalDamageTaken || 1;
  return Math.min(1, damageDealt / (damageDealt + damageTaken));
}

function calculateObjectiveCompletion(unit: CombatUnit, faction: FactionUnit): number {
  const totalObjectives = unit.objectives?.length || 1;
  const completedObjectives = unit.objectives?.filter(obj => obj.completed).length || 0;
  const factionBonus = faction.power > 0 ? 0.1 : 0; // Faction power influences completion rate
  return Math.min(1, (completedObjectives / totalObjectives) + factionBonus);
}

function adaptCombatStyle(state: AdaptiveAIState) {
  const { performance } = state;
  
  // Adjust combat style based on performance metrics
  if (performance.damageEfficiency > 0.7 && performance.survivalRate > 0.8) {
    state.adaptations.combatStyle = 'aggressive';
  } else if (performance.survivalRate < 0.4) {
    state.adaptations.combatStyle = 'defensive';
  } else {
    state.adaptations.combatStyle = 'balanced';
  }
}

function adaptRangePreference(state: AdaptiveAIState) {
  const { performance } = state;
  
  // Adjust preferred engagement range based on performance
  if (performance.damageEfficiency > 0.6 && state.adaptations.combatStyle === 'aggressive') {
    state.adaptations.preferredRange = 'close';
  } else if (performance.survivalRate < 0.5) {
    state.adaptations.preferredRange = 'long';
  } else {
    state.adaptations.preferredRange = 'medium';
  }
}

function adaptFormation(state: AdaptiveAIState) {
  const { performance } = state;
  
  // Adjust formation preferences based on combat performance
  if (performance.survivalRate < 0.5) {
    state.adaptations.formationPreference = 'tight';
  } else if (performance.damageEfficiency > 0.7) {
    state.adaptations.formationPreference = 'loose';
  } else {
    state.adaptations.formationPreference = 'flexible';
  }
}

function adaptRetreatThreshold(state: AdaptiveAIState) {
  const { performance } = state;
  
  // Adjust retreat threshold based on survival rate and damage efficiency
  if (performance.survivalRate < 0.3) {
    state.adaptations.retreatThreshold = Math.min(0.5, state.adaptations.retreatThreshold + 0.1);
  } else if (performance.damageEfficiency > 0.8 && performance.survivalRate > 0.7) {
    state.adaptations.retreatThreshold = Math.max(0.2, state.adaptations.retreatThreshold - 0.1);
  }
}