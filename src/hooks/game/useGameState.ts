import { useContext, useEffect } from 'react';
import { GameContext } from '../../contexts/GameContext';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { gameManager } from '../../managers/game/gameManager';
import { GameEvent } from '../../types/core/GameTypes';

interface Resource {
  type: string;
  amount: number;
}

// Define interfaces for event data types
interface MissionCompletedEventData {
  type: 'discovery' | 'anomaly' | 'completion';
  description: string;
  sector: string;
  importance: 'low' | 'medium' | 'high';
  xpGained?: number;
  resourcesFound?: Array<{ type: string; amount: number }>;
  anomalyDetails?: {
    type: string;
    severity: string;
    investigated: boolean;
  };
}

interface SectorUpdateEventData {
  heatMapValue: number;
  task: {
    target: {
      id: string;
    };
  };
  resourcePotential: number;
  habitabilityScore: number;
}

// Type guard functions
function isMissionCompletedEventData(data: unknown): data is MissionCompletedEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const missionData = data as Record<string, unknown>;

  return (
    (missionData.type === 'discovery' ||
      missionData.type === 'anomaly' ||
      missionData.type === 'completion') &&
    typeof missionData.description === 'string' &&
    typeof missionData.sector === 'string' &&
    (missionData.importance === 'low' ||
      missionData.importance === 'medium' ||
      missionData.importance === 'high')
  );
}

function isSectorUpdateEventData(data: unknown): data is SectorUpdateEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const sectorData = data as Record<string, unknown>;

  // Use explicit boolean checks for each condition
  const hasHeatMapValue = typeof sectorData.heatMapValue === 'number';
  const hasTask = sectorData.task !== undefined && sectorData.task !== null;
  const isTaskObject = hasTask && typeof sectorData.task === 'object';
  const hasTarget = isTaskObject && 'target' in (sectorData.task as object);
  const isTargetObject =
    hasTarget && typeof (sectorData.task as Record<string, unknown>).target === 'object';
  const hasId =
    isTargetObject && 'id' in ((sectorData.task as Record<string, unknown>).target as object);
  const isIdString =
    hasId &&
    typeof ((sectorData.task as Record<string, unknown>).target as Record<string, unknown>).id ===
      'string';

  return hasHeatMapValue && isTaskObject && hasTarget && isTargetObject && hasId && isIdString;
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
      if (event.moduleType === 'radar' && event.data) {
        if (!isMissionCompletedEventData(event.data)) {
          console.warn('Invalid mission data format:', event.data);
          return;
        }

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
            discoveries:
              state.missions.statistics.discoveries + (missionData.type === 'discovery' ? 1 : 0),
            anomalies:
              state.missions.statistics.anomalies + (missionData.type === 'anomaly' ? 1 : 0),
            resourcesFound:
              state.missions.statistics.resourcesFound +
              (missionData.resourcesFound?.reduce(
                (sum: number, r: Resource) => sum + r.amount,
                0
              ) || 0),
            highPriorityCompleted:
              state.missions.statistics.highPriorityCompleted +
              (missionData.importance === 'high' ? 1 : 0),
          },
        });
      }
    });

    // Listen for sector updates
    const unsubscribeSectorUpdates = moduleEventBus.subscribe(
      'AUTOMATION_CYCLE_COMPLETE',
      event => {
        if (event.moduleType === 'radar' && event.data) {
          if (!isSectorUpdateEventData(event.data)) {
            console.warn('Invalid sector update data format:', event.data);
            return;
          }

          const sectorData = event.data;
          dispatch({
            type: 'UPDATE_SECTOR',
            sectorId: sectorData.task.target.id,
            data: {
              status: 'mapped' as const,
              resourcePotential: sectorData.resourcePotential || 0,
              habitabilityScore: sectorData.habitabilityScore || 0,
              lastScanned: event.timestamp,
              heatMapValue: sectorData.heatMapValue,
            },
          });
        }
      }
    );

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
