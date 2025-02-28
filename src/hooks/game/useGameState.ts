import { useEffect, useContext } from 'react';
import { GameContext } from '../../contexts/GameContext';
import { gameManager } from '../../managers/game/gameManager';
import { GameEvent } from '../../types/core/GameTypes';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';

interface Resource {
  type: string;
  amount: number;
}

export function useGameState() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  const { state, dispatch } = context;

  useEffect(() => {
    // Sync game manager state with context
    const unsubscribe = gameManager.subscribe(gameTime => {
      // Update game time in context
      dispatch({
        type: 'UPDATE_GAME_TIME',
        gameTime,
      });
    });

    // Listen for game events
    const unsubscribeEvents = gameManager.addEventListener('*', (event: GameEvent) => {
      dispatch({
        type: 'ADD_EVENT',
        event,
      });
    });

    // Listen for mission events
    const unsubscribeMissionEvents = moduleEventBus.subscribe('MISSION_COMPLETED', event => {
      if (event.moduleType === 'radar') {
        const missionData = event.data;
        dispatch({
          type: 'ADD_MISSION',
          mission: {
            id: `mission-${Date.now()}`,
            type: missionData.type,
            timestamp: event.timestamp,
            description: missionData.description,
            sector: missionData.sector,
            importance: missionData.importance,
            xpGained: missionData.xpGained,
            resourcesFound: missionData.resourcesFound,
            anomalyDetails: missionData.anomalyDetails,
          },
        });

        // Update mission statistics
        dispatch({
          type: 'UPDATE_MISSION_STATS',
          stats: {
            totalXP: state.missions.statistics.totalXP + (missionData.xpGained || 0),
            discoveries: state.missions.statistics.discoveries + (missionData.type === 'discovery' ? 1 : 0),
            anomalies: state.missions.statistics.anomalies + (missionData.type === 'anomaly' ? 1 : 0),
            resourcesFound: state.missions.statistics.resourcesFound + 
              (missionData.resourcesFound?.reduce((sum: number, r: Resource) => sum + r.amount, 0) || 0),
            highPriorityCompleted: state.missions.statistics.highPriorityCompleted + 
              (missionData.importance === 'high' ? 1 : 0),
          },
        });
      }
    });

    // Listen for sector updates
    const unsubscribeSectorUpdates = moduleEventBus.subscribe('AUTOMATION_CYCLE_COMPLETE', event => {
      if (event.moduleType === 'radar' && event.data.heatMapValue !== undefined) {
        dispatch({
          type: 'UPDATE_SECTOR',
          sectorId: event.data.task.target.id,
          data: {
            status: 'mapped' as const,
            resourcePotential: event.data.resourcePotential || 0,
            habitabilityScore: event.data.habitabilityScore || 0,
            lastScanned: event.timestamp,
            heatMapValue: event.data.heatMapValue,
          },
        });
      }
    });

    // Sync running state
    if (state.isRunning && !gameManager.isGameRunning()) {
      gameManager.start();
    }

    // Sync pause state
    if (state.isPaused !== gameManager.isGamePaused()) {
      if (state.isPaused) {
        gameManager.pause();
      } else {
        gameManager.resume();
      }
    }

    return () => {
      unsubscribe();
      unsubscribeEvents();
      unsubscribeMissionEvents();
      unsubscribeSectorUpdates();
    };
  }, [state.isRunning, state.isPaused, state.missions.statistics, dispatch]);

  return {
    ...state,
    startGame: () => dispatch({ type: 'START_GAME' }),
    pauseGame: () => dispatch({ type: 'PAUSE_GAME' }),
    resumeGame: () => dispatch({ type: 'RESUME_GAME' }),
    dispatchEvent: (event: GameEvent) => {
      gameManager.dispatchEvent(event);
      dispatch({ type: 'ADD_EVENT', event });
    },
  };
}
