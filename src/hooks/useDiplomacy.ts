import { useState, useEffect } from 'react';
import { factionManager } from '../lib/factionManager';

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

export function useDiplomacy(factionId: string) {
  const [diplomacyState, setDiplomacyState] = useState({
    relationship: 0,
    status: 'neutral' as 'hostile' | 'neutral' | 'friendly',
    tradingEnabled: false,
    lastInteraction: Date.now(),
    availableActions: [] as DiplomacyAction[]
  });

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const state = factionManager.getFactionState(factionId);
      if (state) {
        // Update available actions based on faction state
        const actions: DiplomacyAction[] = [];

        // Ceasefire
        if (state.relationshipWithPlayer < 0) {
          actions.push({
            type: 'ceasefire',
            name: 'Negotiate Ceasefire',
            description: 'Attempt to establish a temporary peace',
            requirements: [
              { type: 'Credits', value: 5000 },
              { type: 'Reputation', value: -50 }
            ],
            available: true
          });
        }

        // Trade Route
        if (state.relationshipWithPlayer > -0.3) {
          actions.push({
            type: 'tradeRoute',
            name: 'Establish Trade Route',
            description: 'Create a trade route for resource exchange',
            requirements: [
              { type: 'Credits', value: 10000 },
              { type: 'Reputation', value: 0 }
            ],
            available: state.relationshipWithPlayer >= 0
          });
        }

        // Alliance
        if (state.relationshipWithPlayer > 0.3) {
          actions.push({
            type: 'alliance',
            name: 'Form Alliance',
            description: 'Establish a formal alliance for mutual benefit',
            requirements: [
              { type: 'Credits', value: 25000 },
              { type: 'Reputation', value: 50 }
            ],
            available: state.relationshipWithPlayer >= 0.5
          });
        }

        // Tribute
        actions.push({
          type: 'tribute',
          name: 'Offer Tribute',
          description: 'Improve relations through resource offerings',
          requirements: [
            { type: 'Credits', value: 2500 },
            { type: 'Resources', value: 1000 }
          ],
          available: true
        });

        setDiplomacyState({
          relationship: state.relationshipWithPlayer,
          status: state.relationshipWithPlayer > 0.3 ? 'friendly' :
                 state.relationshipWithPlayer < -0.3 ? 'hostile' : 'neutral',
          tradingEnabled: state.relationshipWithPlayer >= 0,
          lastInteraction: state.lastActivity,
          availableActions: actions
        });
      }
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [factionId]);

  return diplomacyState;
}