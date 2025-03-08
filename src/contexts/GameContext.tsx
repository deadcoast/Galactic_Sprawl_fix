import React, { ReactNode, useCallback } from 'react';
import {
  BaseAction,
  BaseState,
  ContextOptions,
  createPropertySelector,
  createSelector,
  createStandardContext,
  ManagerConfig,
} from '../lib/contexts/BaseContext';
import { EventBus } from '../lib/events/EventBus';
import {
  gameManager,
  GameManager,
  GameManagerEvent,
  GameManagerEventType,
} from '../managers/game/gameManager';
import { GameEvent } from '../types/core/GameTypes';
import { BaseEvent, EventType } from '../types/events/EventTypes';

// Type definitions
interface SectorData {
  id: string;
  status: 'unmapped' | 'mapped' | 'scanning';
  resourcePotential: number;
  habitabilityScore: number;
  lastScanned?: number;
  heatMapValue?: number;
}

/**
 * Game State Interface
 */
interface GameState extends BaseState {
  isRunning: boolean;
  isPaused: boolean;
  gameTime: number;
  events: GameEvent[];
  resources: {
    minerals: number;
    energy: number;
    population: number;
    research: number;
  };
  resourceRates: {
    minerals: number;
    energy: number;
    population: number;
    research: number;
  };
  systems: {
    total: number;
    colonized: number;
    explored: number;
  };
  missions: {
    completed: number;
    inProgress: number;
    history: Array<{
      id: string;
      type: 'discovery' | 'anomaly' | 'completion';
      timestamp: number;
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
    }>;
    statistics: {
      totalXP: number;
      discoveries: number;
      anomalies: number;
      resourcesFound: number;
      highPriorityCompleted: number;
    };
  };
  exploration: {
    sectors: Record<string, SectorData>;
    ships: Record<
      string,
      {
        id: string;
        status: 'idle' | 'scanning' | 'investigating' | 'returning';
        experience: number;
        stealthActive: boolean;
        currentTask?: string;
      }
    >;
  };
}

/**
 * Action Types
 */
type GameActionType =
  | 'START_GAME'
  | 'PAUSE_GAME'
  | 'RESUME_GAME'
  | 'STOP_GAME'
  | 'ADD_EVENT'
  | 'UPDATE_RESOURCES'
  | 'UPDATE_RESOURCE_RATES'
  | 'UPDATE_SYSTEMS'
  | 'UPDATE_GAME_TIME'
  | 'ADD_MISSION'
  | 'UPDATE_MISSION_STATS'
  | 'UPDATE_SECTOR'
  | 'UPDATE_SHIP';

/**
 * Game Action Interface
 */
interface GameAction extends BaseAction<GameActionType> {
  payload?: unknown;
}

/**
 * Initial State
 */
const initialState: GameState = {
  isLoading: false,
  error: null,
  lastUpdated: Date.now(),
  isRunning: false,
  isPaused: false,
  gameTime: 0,
  events: [],
  resources: {
    minerals: 1000,
    energy: 1000,
    population: 100,
    research: 0,
  },
  resourceRates: {
    minerals: 0,
    energy: 0,
    population: 0,
    research: 0,
  },
  systems: {
    total: 1,
    colonized: 1,
    explored: 1,
  },
  missions: {
    completed: 0,
    inProgress: 0,
    history: [],
    statistics: {
      totalXP: 0,
      discoveries: 0,
      anomalies: 0,
      resourcesFound: 0,
      highPriorityCompleted: 0,
    },
  },
  exploration: {
    sectors: {},
    ships: {},
  },
};

/**
 * Game Reducer
 */
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME':
      return { ...state, isRunning: true, lastUpdated: Date.now() };

    case 'PAUSE_GAME':
      return { ...state, isPaused: true, lastUpdated: Date.now() };

    case 'RESUME_GAME':
      return { ...state, isPaused: false, lastUpdated: Date.now() };

    case 'STOP_GAME':
      return { ...state, isRunning: false, isPaused: false, lastUpdated: Date.now() };

    case 'ADD_EVENT':
      return {
        ...state,
        events: [...state.events, action.payload as GameEvent],
        lastUpdated: Date.now(),
      };

    case 'UPDATE_RESOURCES':
      return {
        ...state,
        resources: { ...state.resources, ...(action.payload as Partial<GameState['resources']>) },
        lastUpdated: Date.now(),
      };

    case 'UPDATE_RESOURCE_RATES':
      return {
        ...state,
        resourceRates: {
          ...state.resourceRates,
          ...(action.payload as Partial<GameState['resourceRates']>),
        },
        lastUpdated: Date.now(),
      };

    case 'UPDATE_SYSTEMS':
      return {
        ...state,
        systems: { ...state.systems, ...(action.payload as Partial<GameState['systems']>) },
        lastUpdated: Date.now(),
      };

    case 'UPDATE_GAME_TIME':
      return {
        ...state,
        gameTime: action.payload as number,
        lastUpdated: Date.now(),
      };

    case 'ADD_MISSION':
      return {
        ...state,
        missions: {
          ...state.missions,
          history: [
            ...state.missions.history,
            action.payload as GameState['missions']['history'][0],
          ],
        },
        lastUpdated: Date.now(),
      };

    case 'UPDATE_MISSION_STATS':
      return {
        ...state,
        missions: {
          ...state.missions,
          statistics: {
            ...state.missions.statistics,
            ...(action.payload as Partial<GameState['missions']['statistics']>),
          },
        },
        lastUpdated: Date.now(),
      };

    case 'UPDATE_SECTOR': {
      const { sectorId, data } = action.payload as { sectorId: string; data: Partial<SectorData> };
      return {
        ...state,
        exploration: {
          ...state.exploration,
          sectors: {
            ...state.exploration.sectors,
            [sectorId]: {
              ...state.exploration.sectors[sectorId],
              ...data,
            },
          },
        },
        lastUpdated: Date.now(),
      };
    }

    case 'UPDATE_SHIP': {
      const { shipId, data } = action.payload as {
        shipId: string;
        data: Partial<GameState['exploration']['ships'][string]>;
      };
      return {
        ...state,
        exploration: {
          ...state.exploration,
          ships: {
            ...state.exploration.ships,
            [shipId]: {
              ...state.exploration.ships[shipId],
              ...data,
            },
          },
        },
        lastUpdated: Date.now(),
      };
    }

    default:
      return state;
  }
};

/**
 * Context creation options
 */
const gameContextOptions: ContextOptions<GameState, GameAction> = {
  name: 'GameContext',
  initialState,
  reducer: gameReducer,
  performanceMonitoring: {
    enabled: true,
    reducerThreshold: 5, // Warn if reducer takes more than 5ms
    selectorThreshold: 2, // Warn if selector takes more than 2ms
  },
  debug: {
    logStateChanges: process.env.NODE_ENV === 'development',
    logActions: process.env.NODE_ENV === 'development',
  },
};

// Create the context
const {
  Context: GameContext,
  Provider: BaseGameProvider,
  useContextState: useGameState,
  useContextDispatch: useGameDispatch,
  useContextSelector: useGameSelector,
  connectToManager: connectGameToManager,
} = createStandardContext<GameState, GameAction, GameManager>(gameContextOptions);

// Create selectors for various parts of the state
export const selectIsRunning = createPropertySelector<GameState, 'isRunning'>('isRunning');
export const selectIsPaused = createPropertySelector<GameState, 'isPaused'>('isPaused');
export const selectGameTime = createPropertySelector<GameState, 'gameTime'>('gameTime');
export const selectResources = createPropertySelector<GameState, 'resources'>('resources');
export const selectResourceRates = createPropertySelector<GameState, 'resourceRates'>(
  'resourceRates'
);
export const selectSystems = createPropertySelector<GameState, 'systems'>('systems');
export const selectMissions = createPropertySelector<GameState, 'missions'>('missions');
export const selectExplorationData = createPropertySelector<GameState, 'exploration'>(
  'exploration'
);

export const selectSectors = createSelector<GameState, Record<string, SectorData>>(
  state => state.exploration.sectors
);

export const selectShips = createSelector<GameState, GameState['exploration']['ships']>(
  state => state.exploration.ships
);

export const selectCompletedMissions = createSelector<GameState, number>(
  state => state.missions.completed
);

export const selectMissionsInProgress = createSelector<GameState, number>(
  state => state.missions.inProgress
);

// Action creators
export const gameActions = {
  startGame: () => ({ type: 'START_GAME' as const }),
  pauseGame: () => ({ type: 'PAUSE_GAME' as const }),
  resumeGame: () => ({ type: 'RESUME_GAME' as const }),
  stopGame: () => ({ type: 'STOP_GAME' as const }),
  addEvent: (event: GameEvent) => ({ type: 'ADD_EVENT' as const, payload: event }),
  updateResources: (resources: Partial<GameState['resources']>) => ({
    type: 'UPDATE_RESOURCES' as const,
    payload: resources,
  }),
  updateResourceRates: (rates: Partial<GameState['resourceRates']>) => ({
    type: 'UPDATE_RESOURCE_RATES' as const,
    payload: rates,
  }),
  updateSystems: (systems: Partial<GameState['systems']>) => ({
    type: 'UPDATE_SYSTEMS' as const,
    payload: systems,
  }),
  updateGameTime: (gameTime: number) => ({
    type: 'UPDATE_GAME_TIME' as const,
    payload: gameTime,
  }),
  addMission: (mission: GameState['missions']['history'][0]) => ({
    type: 'ADD_MISSION' as const,
    payload: mission,
  }),
  updateMissionStats: (stats: Partial<GameState['missions']['statistics']>) => ({
    type: 'UPDATE_MISSION_STATS' as const,
    payload: stats,
  }),
  updateSector: (sectorId: string, data: Partial<SectorData>) => ({
    type: 'UPDATE_SECTOR' as const,
    payload: { sectorId, data },
  }),
  updateShip: (shipId: string, data: Partial<GameState['exploration']['ships'][string]>) => ({
    type: 'UPDATE_SHIP' as const,
    payload: { shipId, data },
  }),
};

// Custom hook to get game actions
export const useGameActions = () => {
  const dispatch = useGameDispatch();

  return {
    startGame: useCallback(() => {
      dispatch(gameActions.startGame());
      gameManager.start();
    }, [dispatch]),

    pauseGame: useCallback(() => {
      dispatch(gameActions.pauseGame());
      gameManager.pause();
    }, [dispatch]),

    resumeGame: useCallback(() => {
      dispatch(gameActions.resumeGame());
      gameManager.resume();
    }, [dispatch]),

    stopGame: useCallback(() => {
      dispatch(gameActions.stopGame());
      gameManager.stop();
    }, [dispatch]),

    addEvent: useCallback((event: GameEvent) => dispatch(gameActions.addEvent(event)), [dispatch]),

    updateResources: useCallback(
      (resources: Partial<GameState['resources']>) =>
        dispatch(gameActions.updateResources(resources)),
      [dispatch]
    ),

    updateResourceRates: useCallback(
      (rates: Partial<GameState['resourceRates']>) =>
        dispatch(gameActions.updateResourceRates(rates)),
      [dispatch]
    ),

    updateSystems: useCallback(
      (systems: Partial<GameState['systems']>) => dispatch(gameActions.updateSystems(systems)),
      [dispatch]
    ),

    addMission: useCallback(
      (mission: GameState['missions']['history'][0]) => dispatch(gameActions.addMission(mission)),
      [dispatch]
    ),

    updateMissionStats: useCallback(
      (stats: Partial<GameState['missions']['statistics']>) =>
        dispatch(gameActions.updateMissionStats(stats)),
      [dispatch]
    ),

    updateSector: useCallback(
      (sectorId: string, updates: Partial<SectorData>) =>
        dispatch(gameActions.updateSector(sectorId, updates)),
      [dispatch]
    ),

    updateShip: useCallback(
      (shipId: string, updates: Partial<GameState['exploration']['ships'][string]>) =>
        dispatch(gameActions.updateShip(shipId, updates)),
      [dispatch]
    ),
  };
};

// Configure connection to GameManager
const configureGameManager = (manager: GameManager): ManagerConfig<GameManager> => {
  // Create a Record with all required EventType keys
  const subscriptions: Record<EventType, (event: BaseEvent, draft: unknown) => void> = {} as Record<
    EventType,
    (event: BaseEvent, draft: unknown) => void
  >;

  // Add our specific handlers
  subscriptions[GameManagerEventType.TIME_UPDATED as unknown as EventType] = (
    event: BaseEvent,
    dispatch: React.Dispatch<GameAction>
  ) => {
    const gameEvent = event as GameManagerEvent;
    if (gameEvent.gameTime !== undefined) {
      dispatch(gameActions.updateGameTime(gameEvent.gameTime));
    }
  };

  subscriptions[GameManagerEventType.GAME_STARTED as unknown as EventType] = (
    event: BaseEvent,
    dispatch: React.Dispatch<GameAction>
  ) => {
    dispatch(gameActions.startGame());
  };

  subscriptions[GameManagerEventType.GAME_PAUSED as unknown as EventType] = (
    event: BaseEvent,
    dispatch: React.Dispatch<GameAction>
  ) => {
    dispatch(gameActions.pauseGame());
  };

  subscriptions[GameManagerEventType.GAME_RESUMED as unknown as EventType] = (
    event: BaseEvent,
    dispatch: React.Dispatch<GameAction>
  ) => {
    dispatch(gameActions.resumeGame());
  };

  subscriptions[GameManagerEventType.GAME_STOPPED as unknown as EventType] = (
    event: BaseEvent,
    dispatch: React.Dispatch<GameAction>
  ) => {
    dispatch(gameActions.stopGame());
  };

  return {
    manager,
    methods: {
      getGameTime: manager => manager.getGameTime(),
      isGameRunning: manager => manager.isGameRunning(),
      isGamePaused: manager => manager.isGamePaused(),
    },
    events: {
      eventBus: manager.eventBus as unknown as EventBus<BaseEvent>,
      subscriptions: {
        [GameManagerEventType.TIME_UPDATED as unknown as EventType]: (
          event: BaseEvent,
          dispatch: React.Dispatch<GameAction>
        ) => {
          const gameEvent = event as GameManagerEvent;
          if (gameEvent.gameTime !== undefined) {
            dispatch(gameActions.updateGameTime(gameEvent.gameTime));
          }
        },
        [GameManagerEventType.GAME_STARTED as unknown as EventType]: (
          event: BaseEvent,
          dispatch: React.Dispatch<GameAction>
        ) => {
          dispatch(gameActions.startGame());
        },
        [GameManagerEventType.GAME_PAUSED as unknown as EventType]: (
          event: BaseEvent,
          dispatch: React.Dispatch<GameAction>
        ) => {
          dispatch(gameActions.pauseGame());
        },
        [GameManagerEventType.GAME_RESUMED as unknown as EventType]: (
          event: BaseEvent,
          dispatch: React.Dispatch<GameAction>
        ) => {
          dispatch(gameActions.resumeGame());
        },
        [GameManagerEventType.GAME_STOPPED as unknown as EventType]: (
          event: BaseEvent,
          dispatch: React.Dispatch<GameAction>
        ) => {
          dispatch(gameActions.stopGame());
        },
      },
    },
  };
};

// Connect the game context to the game manager
connectGameToManager(configureGameManager(gameManager));

// Create wrapper provider for additional functionality
interface GameProviderProps {
  children: ReactNode;
  manager?: GameManager;
  initialGameState?: Partial<GameState>;
}

export const GameProvider: React.FC<GameProviderProps> = ({
  children,
  manager = gameManager,
  initialGameState,
}) => {
  return (
    <BaseGameProvider manager={manager} initialState={initialGameState}>
      {children}
    </BaseGameProvider>
  );
};

// Export hooks for accessing specific parts of state
export const useRunningState = () => useGameSelector(selectIsRunning);
export const usePausedState = () => useGameSelector(selectIsPaused);
export const useGameTimeState = () => useGameSelector(selectGameTime);
export const useResourcesState = () => useGameSelector(selectResources);
export const useResourceRatesState = () => useGameSelector(selectResourceRates);
export const useSystemsState = () => useGameSelector(selectSystems);
export const useMissionsState = () => useGameSelector(selectMissions);
export const useSectorsState = () => useGameSelector(selectSectors);
export const useShipsState = () => useGameSelector(selectShips);

// Export the context for direct use
export { GameContext, useGameDispatch, useGameSelector, useGameState };
