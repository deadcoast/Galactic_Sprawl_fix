import { useEffect, useState } from 'react';
import { factionConfigs } from '../../config/factions/factions';
import { factionManager } from '../../managers/factions/factionManager';
import type { AIState } from '../../types/debug/DebugTypes';
import type { FactionId, FactionShip } from '../../types/ships/FactionShipTypes';

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

export function useFactionAI(factionId: FactionId): FactionAIState {
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

export function useActiveFactions(): FactionId[] {
  const [activeFactions, setActiveFactions] = useState<FactionId[]>([]);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      // Get all known faction IDs from config
      const allFactionIds = Object.keys(factionConfigs) as FactionId[];
      const activeFactionIds: FactionId[] = [];

      allFactionIds.forEach(id => {
        const state = factionManager.getFactionState(id);
        // Check if state exists and faction has fleet strength
        if (state && state.fleetStrength > 0.1) {
          activeFactionIds.push(id);
        }
      });

      // Only update state if the list of active factions has actually changed
      setActiveFactions(currentActive => {
        if (
          currentActive.length === activeFactionIds.length &&
          currentActive.every(id => activeFactionIds.includes(id))
        ) {
          return currentActive; // No change
        }
        return activeFactionIds; // Update state
      });
    }, 1000);

    return () => clearInterval(updateInterval);
  }, []);

  return activeFactions;
}
