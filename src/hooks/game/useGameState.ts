/**
 * @file useGameState.ts
 * Provides standardized hooks for accessing GameContext with selector pattern.
 *
 * This implementation:
 * 1. Uses selector pattern for better performance
 * 2. Provides type safety for game state data
 * 3. Maintains the same functionality as the previous implementation
 * 4. Follows the standardized context access pattern
 * 5. Includes performance monitoring for selectors and computations
 */

import { useCallback, useEffect } from 'react';
import {
  GameActionType,
  selectGameTime,
  selectIsPaused,
  selectIsRunning,
  selectMissions,
  selectResourceRates,
  selectResources,
  selectSectors,
  selectShips,
  selectSystems,
  useGameDispatch,
  useGameSelector,
} from '../../contexts/GameContext';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { gameManager } from '../../managers/game/gameManager';
import { GameEvent } from '../../types/core/GameTypes';
import {
  HookPerformanceConfig,
  defaultPerformanceConfig,
  measureComputationTime,
  measureSelectorTime,
  trackHookRender,
} from '../../utils/performance/hookPerformanceMonitor';

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

// Performance monitoring configuration
const gameStatePerformanceConfig: HookPerformanceConfig = {
  ...defaultPerformanceConfig,
  hookName: 'useGameState',
};

/**
 * Hook to access game state with selector pattern for performance optimization
 *
 * @returns The game state with action methods
 */
export function useGameState() {
  // Track hook render
  trackHookRender(gameStatePerformanceConfig);

  // Use selectors for individual pieces of state to prevent unnecessary re-renders
  const isRunning = measureSelectorTime(
    'isRunning',
    () => useGameSelector(selectIsRunning),
    gameStatePerformanceConfig
  );

  const isPaused = measureSelectorTime(
    'isPaused',
    () => useGameSelector(selectIsPaused),
    gameStatePerformanceConfig
  );

  const gameTime = measureSelectorTime(
    'gameTime',
    () => useGameSelector(selectGameTime),
    gameStatePerformanceConfig
  );

  const resources = measureSelectorTime(
    'resources',
    () => useGameSelector(selectResources),
    gameStatePerformanceConfig
  );

  const resourceRates = measureSelectorTime(
    'resourceRates',
    () => useGameSelector(selectResourceRates),
    gameStatePerformanceConfig
  );

  const systems = measureSelectorTime(
    'systems',
    () => useGameSelector(selectSystems),
    gameStatePerformanceConfig
  );

  const missions = measureSelectorTime(
    'missions',
    () => useGameSelector(selectMissions),
    gameStatePerformanceConfig
  );

  const sectors = measureSelectorTime(
    'sectors',
    () => useGameSelector(selectSectors),
    gameStatePerformanceConfig
  );

  const ships = measureSelectorTime(
    'ships',
    () => useGameSelector(selectShips),
    gameStatePerformanceConfig
  );

  // Get dispatch function for actions
  const dispatch = useGameDispatch();

  // Action creators with standardized pattern
  const startGame = useCallback(
    () => dispatch({ type: GameActionType.START_GAME, payload: undefined }),
    [dispatch]
  );
  const pauseGame = useCallback(
    () => dispatch({ type: GameActionType.PAUSE_GAME, payload: undefined }),
    [dispatch]
  );
  const resumeGame = useCallback(
    () => dispatch({ type: GameActionType.RESUME_GAME, payload: undefined }),
    [dispatch]
  );
  const dispatchEvent = useCallback(
    (event: GameEvent) => {
      gameManager.dispatchEvent(event);
      dispatch({ type: GameActionType.ADD_EVENT, payload: event });
    },
    [dispatch]
  );

  useEffect(() => {
    // Sync game manager state with context
    const unsubscribe = gameManager.subscribeToGameTime(gameTime => {
      // Update game time in context
      dispatch({
        type: GameActionType.UPDATE_GAME_TIME,
        payload: gameTime,
      });
    });

    // Listen for game events
    const unsubscribeEvents = gameManager.addEventListener('*', (event: GameEvent) => {
      dispatch({
        type: GameActionType.ADD_EVENT,
        payload: event,
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
          type: GameActionType.ADD_MISSION,
          payload: {
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
          type: GameActionType.UPDATE_MISSION_STATS,
          payload: {
            totalXP: missions.statistics.totalXP + (missionData.xpGained || 0),
            discoveries:
              missions.statistics.discoveries + (missionData.type === 'discovery' ? 1 : 0),
            anomalies: missions.statistics.anomalies + (missionData.type === 'anomaly' ? 1 : 0),
            resourcesFound:
              missions.statistics.resourcesFound + (missionData.resourcesFound?.length || 0),
            highPriorityCompleted:
              missions.statistics.highPriorityCompleted +
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
            type: GameActionType.UPDATE_SECTOR,
            payload: {
              sectorId: sectorData.task.target.id,
              data: {
                status: 'mapped' as const,
                resourcePotential: sectorData.resourcePotential || 0,
                habitabilityScore: sectorData.habitabilityScore || 0,
                heatMapValue: sectorData.heatMapValue || 0,
                lastScanned: Date.now(),
              },
            },
          });
        }
      }
    );

    // Sync running state
    if (isRunning && !gameManager.isGameRunning()) {
      gameManager.start();
    }

    // Sync pause state
    if (isPaused !== gameManager.isGamePaused()) {
      if (isPaused) {
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
  }, [isRunning, isPaused, missions.statistics, dispatch]);

  // Return the game state with action methods - measure computation time for complex derived state
  return measureComputationTime(
    'returnStateObject',
    () => ({
      isRunning,
      isPaused,
      gameTime,
      resources,
      resourceRates,
      systems,
      missions,
      exploration: {
        sectors,
        ships,
      },
      startGame,
      pauseGame,
      resumeGame,
      dispatchEvent,
    }),
    gameStatePerformanceConfig
  );
}

/**
 * Hook to select only the resources from game state
 * Example of a specialized selector hook
 */
export function useGameResources() {
  // Track hook render with a specific config for this specialized hook
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useGameResources',
  };
  trackHookRender(performanceConfig);

  return measureSelectorTime(
    'resources',
    () => useGameSelector(selectResources),
    performanceConfig
  );
}

/**
 * Hook to select only the resource rates from game state
 * Example of a specialized selector hook
 */
export function useGameResourceRates() {
  // Track hook render with a specific config for this specialized hook
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useGameResourceRates',
  };
  trackHookRender(performanceConfig);

  return measureSelectorTime(
    'resourceRates',
    () => useGameSelector(selectResourceRates),
    performanceConfig
  );
}

/**
 * Hook to select only the missions from game state
 * Example of a specialized selector hook
 */
export function useGameMissions() {
  // Track hook render with a specific config for this specialized hook
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useGameMissions',
  };
  trackHookRender(performanceConfig);

  return measureSelectorTime('missions', () => useGameSelector(selectMissions), performanceConfig);
}

/**
 * Hook to select only the exploration data from game state
 * Example of a specialized selector hook
 */
export function useGameExploration() {
  // Track hook render with a specific config for this specialized hook
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useGameExploration',
  };
  trackHookRender(performanceConfig);

  const sectors = measureSelectorTime(
    'sectors',
    () => useGameSelector(selectSectors),
    performanceConfig
  );

  const ships = measureSelectorTime('ships', () => useGameSelector(selectShips), performanceConfig);

  return measureComputationTime(
    'returnExplorationObject',
    () => ({
      sectors,
      ships,
    }),
    performanceConfig
  );
}
