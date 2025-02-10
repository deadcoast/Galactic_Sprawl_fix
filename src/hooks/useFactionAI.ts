import { useState, useEffect } from 'react';
import { factionManager } from '../lib/factionManager';

export function useFactionAI(factionId: string) {
  const [aiState, setAIState] = useState({
    isActive: false,
    behavior: {
      isHostile: false,
      willAttack: false,
      expansionPriority: 0,
      reinforcementNeeded: false
    },
    lastUpdate: Date.now()
  });

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const state = factionManager.getFactionState(factionId);
      const behavior = factionManager.getFactionBehavior(factionId);

      if (state && behavior) {
        setAIState({
          isActive: state.isActive,
          behavior,
          lastUpdate: Date.now()
        });
      }
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [factionId]);

  return aiState;
}

export function useActiveFactions() {
  const [activeFactions, setActiveFactions] = useState<string[]>([]);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const active = Object.keys(factionManager.getFactionState)
        .filter(id => factionManager.getFactionState(id)?.isActive);
      
      setActiveFactions(active);
    }, 1000);

    return () => clearInterval(updateInterval);
  }, []);

  return activeFactions;
}