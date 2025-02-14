import { factionManager } from '../../lib/factions/factionManager';
import { useEffect, useState } from 'react';
import type { FactionShip } from '../../types/ships/FactionShipTypes';
import type { FactionId } from '../../types/ships/FactionTypes';
import type { AIState } from '../../types/debug/DebugTypes';

interface FactionBehavior {
  isHostile: boolean;
  willAttack: boolean;
  expansionPriority: number;
  reinforcementNeeded: boolean;
  ships: FactionShip[];
  currentFormation: {
    type: 'offensive' | 'defensive' | 'stealth';
    spacing: number;
    facing: number;
  };
  cooldowns: Record<string, number>;
}

interface FactionAIState {
  isActive: boolean;
  behavior: AIState;
  lastUpdate: number;
}

export function useFactionAI(factionId: FactionId) {
  const [aiState, setAIState] = useState<FactionAIState>({
    isActive: false,
    behavior: {
      behaviorState: 'idle',
      fleetStrength: 0,
      threatLevel: 0,
      lastAction: 'initialized',
      nextAction: 'patrol',
      cooldowns: {},
    },
    lastUpdate: Date.now(),
  });

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const state = factionManager.getFactionState(factionId);
      const rawBehavior = factionManager.getFactionBehavior(factionId);

      // Only proceed if we have both state and behavior data
      if (state && rawBehavior) {
        // Convert raw behavior to FactionBehavior type
        const behavior: FactionBehavior = {
          ...rawBehavior,
          ships: [], // Will be populated from fleet data
          currentFormation: {
            type: rawBehavior.willAttack
              ? 'offensive'
              : rawBehavior.isHostile
                ? 'defensive'
                : 'stealth',
            spacing: 100,
            facing: 0,
          },
          cooldowns: {}, // Track ability cooldowns
        };

        // Update AI state with behavior data
        setAIState({
          isActive: state.isActive,
          behavior: {
            behaviorState: behavior.willAttack
              ? 'attacking'
              : behavior.isHostile
                ? 'hostile'
                : 'neutral',
            fleetStrength: state.fleetStrength,
            threatLevel: behavior.isHostile ? 1 : 0,
            lastAction: behavior.willAttack ? 'preparing attack' : 'patrolling',
            nextAction: behavior.reinforcementNeeded
              ? 'reinforcing'
              : behavior.willAttack
                ? 'attack'
                : 'patrol',
            cooldowns: behavior.cooldowns,
          },
          lastUpdate: Date.now(),
        });
      }
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [factionId]);

  return aiState;
}

export function useActiveFactions() {
  const [activeFactions, setActiveFactions] = useState<FactionId[]>([]);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const active = Object.keys(factionManager.getFactionState).filter(
        id => factionManager.getFactionState(id)?.isActive
      ) as FactionId[];

      setActiveFactions(active);
    }, 1000);

    return () => clearInterval(updateInterval);
  }, []);

  return activeFactions;
}
