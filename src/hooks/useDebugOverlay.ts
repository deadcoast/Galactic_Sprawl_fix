import { useState, useEffect } from 'react';
import { combatManager } from '../lib/combatManager';
import { factionManager } from '../lib/factionManager';

interface DebugState {
  aiState: {
    behaviorState: string;
    targetId?: string;
    fleetStrength: number;
    threatLevel: number;
  };
  formation?: {
    type: string;
    spacing: number;
    facing: number;
  };
  position: { x: number; y: number };
}

export function useDebugOverlay() {
  const [visible, setVisible] = useState(false);
  const [debugStates, setDebugStates] = useState<Record<string, DebugState>>({});

  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (!visible) return;

      // Collect debug information from all active units
      const states: Record<string, DebugState> = {};
      
      // Get all active units
      const units = combatManager.getAllUnits();
      units.forEach(unit => {
        const aiState = combatManager.getUnitAIState(unit.id);
        const formation = combatManager.getUnitFormation(unit.id);
        
        states[unit.id] = {
          aiState: {
            behaviorState: aiState.behaviorState,
            targetId: aiState.targetId,
            fleetStrength: aiState.fleetStrength,
            threatLevel: aiState.threatLevel
          },
          formation: formation ? {
            type: formation.type,
            spacing: formation.spacing,
            facing: formation.facing
          } : undefined,
          position: unit.position
        };
      });

      setDebugStates(states);
    }, 250);

    return () => clearInterval(updateInterval);
  }, [visible]);

  const toggleVisibility = () => setVisible(prev => !prev);

  return {
    visible,
    debugStates,
    toggleVisibility
  };
}