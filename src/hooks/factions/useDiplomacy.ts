import { factionManager } from '../../managers/factions/factionManager';
import { useEffect, useState } from 'react';
import { FactionId } from '../../types/ships/FactionTypes';
import { factionRelationshipManager } from '../../managers/factions/FactionRelationshipManager';

interface DiplomacyAction {
  type: 'ceasefire' | 'tradeRoute' | 'alliance' | 'tribute';
  name: string;
  description: string;
  requirements: {
    type: string;
    value: number;
  }[];
  available: boolean;
}

export function useDiplomacy(factionId: FactionId) {
  const [diplomacyState, setDiplomacyState] = useState({
    relationship: 0,
    status: 'neutral' as 'hostile' | 'neutral' | 'friendly',
    tradingEnabled: false,
    lastInteraction: Date.now(),
    availableActions: [] as DiplomacyAction[],
  });

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const state = factionManager.getFactionState(factionId);
      if (state) {
        const relationship = state.relationshipWithPlayer;
        const availableActions = factionRelationshipManager.getAvailableDiplomaticActions(
          factionId,
          'player' as FactionId
        );

        setDiplomacyState({
          relationship,
          status: relationship > 0.3 ? 'friendly' : relationship < -0.3 ? 'hostile' : 'neutral',
          tradingEnabled: relationship >= 0,
          lastInteraction: state.lastActivity,
          availableActions,
        });
      }
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [factionId]);

  const handleDiplomaticAction = (
    action: DiplomacyAction,
    resources?: { type: string; amount: number }[]
  ) => {
    return factionRelationshipManager.handleDiplomaticAction(
      factionId,
      'player' as FactionId,
      action.type,
      resources
    );
  };

  return {
    ...diplomacyState,
    handleDiplomaticAction,
  };
}
