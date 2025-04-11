import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { BaseState } from '../lib/contexts/BaseContext';
import { EventBus } from '../lib/events/EventBus';
import { gameManager, GameManager, GameManagerEvent } from '../managers/game/gameManager';
import { GameEvent } from '../types/core/GameTypes';
import { BaseEvent, EventType } from '../types/events/EventTypes';
import { ResourceType } from '../types/resources/ResourceTypes';

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
 * Game Action Types as an enum for type safety and intellisense
 */
export enum GameActionType {
  START_GAME = 'game/startGame',
  PAUSE_GAME = 'game/pauseGame',
  RESUME_GAME = 'game/resumeGame',
  STOP_GAME = 'game/stopGame',
  ADD_EVENT = 'game/addEvent',
  UPDATE_RESOURCES = 'game/updateResources',
  UPDATE_RESOURCE_RATES = 'game/updateResourceRates',
  UPDATE_SYSTEMS = 'game/updateSystems',
  UPDATE_GAME_TIME = 'game/updateGameTime',
  ADD_MISSION = 'game/addMission',
  UPDATE_MISSION_STATS = 'game/updateMissionStats',
  UPDATE_SECTOR = 'game/updateSector',
  UPDATE_SHIP = 'game/updateShip',
  SET_LOADING = 'game/setLoading',
  SET_ERROR = 'game/setError',
}

/**
 * Game State Interface
 */
interface GameState extends BaseState {
  isRunning: boolean;
  isPaused: boolean;
  gameTime: number;
  events: GameEvent[];
  resources: Record<ResourceType, number>;
  resourceRates: Partial<Record<ResourceType, number>>;
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
        type: ResourceType;
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
 * Define typed payload interfaces for each action
 */
interface GamePayloads {
  [GameActionType.START_GAME]: undefined;
  [GameActionType.PAUSE_GAME]: undefined;
  [GameActionType.RESUME_GAME]: undefined;
  [GameActionType.STOP_GAME]: undefined;
  [GameActionType.ADD_EVENT]: GameEvent;
  [GameActionType.UPDATE_RESOURCES]: Partial<Record<ResourceType, number>>;
  [GameActionType.UPDATE_RESOURCE_RATES]: Partial<Record<ResourceType, number>>;
  [GameActionType.UPDATE_SYSTEMS]: Partial<GameState['systems']>;
  [GameActionType.UPDATE_GAME_TIME]: number;
  [GameActionType.ADD_MISSION]: GameState['missions']['history'][0];
  [GameActionType.UPDATE_MISSION_STATS]: Partial<GameState['missions']['statistics']>;
  [GameActionType.UPDATE_SECTOR]: { sectorId: string; data: Partial<SectorData> };
  [GameActionType.UPDATE_SHIP]: {
    shipId: string;
    data: Partial<GameState['exploration']['ships'][string]>;
  };
  [GameActionType.SET_LOADING]: { isLoading: boolean };
  [GameActionType.SET_ERROR]: { error: string | null };
}

/**
 * Game Action Interface with strongly typed payloads
 */
export type GameAction = {
  [K in keyof GamePayloads]: {
    type: K;
    payload: GamePayloads[K];
  };
}[keyof GamePayloads];

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
    [ResourceType.MINERALS]: 1000,
    [ResourceType.ENERGY]: 1000,
    [ResourceType.POPULATION]: 100,
    [ResourceType.RESEARCH]: 0,
    [ResourceType.PLASMA]: 0,
    [ResourceType.GAS]: 0,
    [ResourceType.EXOTIC]: 0,
    [ResourceType.ORGANIC]: 0,
    [ResourceType.FOOD]: 0,
    [ResourceType.IRON]: 0,
    [ResourceType.COPPER]: 0,
    [ResourceType.TITANIUM]: 0,
    [ResourceType.URANIUM]: 0,
    [ResourceType.WATER]: 0,
    [ResourceType.HELIUM]: 0,
    [ResourceType.DEUTERIUM]: 0,
    [ResourceType.ANTIMATTER]: 0,
    [ResourceType.DARK_MATTER]: 0,
    [ResourceType.EXOTIC_MATTER]: 0,
  },
  resourceRates: {
    [ResourceType.MINERALS]: 0,
    [ResourceType.ENERGY]: 0,
    [ResourceType.POPULATION]: 0,
    [ResourceType.RESEARCH]: 0,
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
 * Type-safe action creators
 */
export const createStartGameAction = (): GameAction => ({
  type: GameActionType.START_GAME,
  payload: undefined,
});

export const createPauseGameAction = (): GameAction => ({
  type: GameActionType.PAUSE_GAME,
  payload: undefined,
});

export const createResumeGameAction = (): GameAction => ({
  type: GameActionType.RESUME_GAME,
  payload: undefined,
});

export const createStopGameAction = (): GameAction => ({
  type: GameActionType.STOP_GAME,
  payload: undefined,
});

export const createAddEventAction = (event: GameEvent): GameAction => ({
  type: GameActionType.ADD_EVENT,
  payload: event,
});

export const createUpdateResourcesAction = (
  resources: Partial<Record<ResourceType, number>>
): GameAction => ({
  type: GameActionType.UPDATE_RESOURCES,
  payload: resources,
});

export const createUpdateResourceRatesAction = (
  rates: Partial<Record<ResourceType, number>>
): GameAction => ({
  type: GameActionType.UPDATE_RESOURCE_RATES,
  payload: rates,
});

export const createUpdateSystemsAction = (systems: Partial<GameState['systems']>): GameAction => ({
  type: GameActionType.UPDATE_SYSTEMS,
  payload: systems,
});

export const createUpdateGameTimeAction = (gameTime: number): GameAction => ({
  type: GameActionType.UPDATE_GAME_TIME,
  payload: gameTime,
});

export const createAddMissionAction = (
  mission: GameState['missions']['history'][0]
): GameAction => ({
  type: GameActionType.ADD_MISSION,
  payload: mission,
});

export const createUpdateMissionStatsAction = (
  stats: Partial<GameState['missions']['statistics']>
): GameAction => ({
  type: GameActionType.UPDATE_MISSION_STATS,
  payload: stats,
});

export const createUpdateSectorAction = (
  sectorId: string,
  data: Partial<SectorData>
): GameAction => ({
  type: GameActionType.UPDATE_SECTOR,
  payload: { sectorId, data },
});

export const createUpdateShipAction = (
  shipId: string,
  data: Partial<GameState['exploration']['ships'][string]>
): GameAction => ({
  type: GameActionType.UPDATE_SHIP,
  payload: { shipId, data },
});

export const createSetLoadingAction = (isLoading: boolean): GameAction => ({
  type: GameActionType.SET_LOADING,
  payload: { isLoading },
});

export const createSetErrorAction = (error: string | null): GameAction => ({
  type: GameActionType.SET_ERROR,
  payload: { error },
});

/**
 * Game Reducer
 */
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case GameActionType.START_GAME:
      return { ...state, isRunning: true, lastUpdated: Date.now() };

    case GameActionType.PAUSE_GAME:
      return { ...state, isPaused: true, lastUpdated: Date.now() };

    case GameActionType.RESUME_GAME:
      return { ...state, isPaused: false, lastUpdated: Date.now() };

    case GameActionType.STOP_GAME:
      return { ...state, isRunning: false, isPaused: false, lastUpdated: Date.now() };

    case GameActionType.ADD_EVENT:
      return {
        ...state,
        events: [...state.events, action.payload as GameEvent],
        lastUpdated: Date.now(),
      };

    case GameActionType.UPDATE_RESOURCES: {
      const resourceUpdates = action.payload as Partial<Record<ResourceType, number>>;
      const newResources = { ...state.resources };
      for (const key in resourceUpdates) {
        if (Object.prototype.hasOwnProperty.call(resourceUpdates, key)) {
          const resourceType = key as ResourceType;
          const newValue = resourceUpdates[resourceType];
          if (newValue !== undefined) {
            newResources[resourceType] = Math.max(0, newValue);
          }
        }
      }
      return {
        ...state,
        resources: newResources,
        lastUpdated: Date.now(),
      };
    }

    case GameActionType.UPDATE_RESOURCE_RATES: {
      const rateUpdates = action.payload as Partial<Record<ResourceType, number>>;
      const newRates = { ...state.resourceRates };
      for (const key in rateUpdates) {
        if (Object.prototype.hasOwnProperty.call(rateUpdates, key)) {
          const resourceType = key as ResourceType;
          newRates[resourceType] = rateUpdates[resourceType];
        }
      }
      return {
        ...state,
        resourceRates: newRates,
        lastUpdated: Date.now(),
      };
    }

    case GameActionType.UPDATE_SYSTEMS:
      return {
        ...state,
        systems: { ...state.systems, ...(action.payload as Partial<GameState['systems']>) },
        lastUpdated: Date.now(),
      };

    case GameActionType.UPDATE_GAME_TIME:
      return {
        ...state,
        gameTime: action.payload as number,
        lastUpdated: Date.now(),
      };

    case GameActionType.ADD_MISSION:
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

    case GameActionType.UPDATE_MISSION_STATS:
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

    case GameActionType.UPDATE_SECTOR: {
      const { sectorId, data } = action.payload as {
        sectorId: string;
        data: Partial<SectorData>;
      };
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

    case GameActionType.UPDATE_SHIP: {
      const { shipId, data: shipData } = action.payload as {
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
              ...shipData,
            },
          },
        },
        lastUpdated: Date.now(),
      };
    }

    case GameActionType.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading,
      };

    case GameActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload.error,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Create selectors as functions
export const selectIsRunning = (state: GameState) => state.isRunning;
export const selectIsPaused = (state: GameState) => state.isPaused;
export const selectGameTime = (state: GameState) => state.gameTime;
export const selectResources = (state: GameState) => state.resources;
export const selectResourceRates = (state: GameState) => state.resourceRates;
export const selectSystems = (state: GameState) => state.systems;
export const selectMissions = (state: GameState) => state.missions;
export const selectExplorationData = (state: GameState) => state.exploration;
export const selectSectors = (state: GameState) => state.exploration.sectors;
export const selectShips = (state: GameState) => state.exploration.ships;
export const selectCompletedMissions = (state: GameState) => state.missions.completed;
export const selectMissionsInProgress = (state: GameState) => state.missions.inProgress;

// Event handlers for game events
const handleGameStarted = (_event: GameManagerEvent, dispatch: React.Dispatch<GameAction>) => {
  dispatch(createStartGameAction());
};

const handleGamePaused = (_event: GameManagerEvent, dispatch: React.Dispatch<GameAction>) => {
  dispatch(createPauseGameAction());
};

const handleGameResumed = (_event: GameManagerEvent, dispatch: React.Dispatch<GameAction>) => {
  dispatch(createResumeGameAction());
};

const handleGameStopped = (_event: GameManagerEvent, dispatch: React.Dispatch<GameAction>) => {
  dispatch(createStopGameAction());
};

const handleTimeUpdated = (event: GameManagerEvent, dispatch: React.Dispatch<GameAction>) => {
  if (event?.gameTime !== undefined) {
    dispatch(createUpdateGameTimeAction(event?.gameTime));
  }
};

// Create context
type GameContextType = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  manager?: GameManager;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

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
  // Get initial state from GameManager if available
  const effectiveInitialState = useMemo(() => {
    if (manager) {
      try {
        return {
          ...initialState,
          gameTime: manager.getGameTime(),
          isRunning: manager.isGameRunning(),
          isPaused: manager.isGamePaused(),
          ...(initialGameState ?? {}),
        };
      } catch (error) {
        console.error('Error getting game state from manager:', error);
      }
    }
    return { ...initialState, ...(initialGameState ?? {}) };
  }, [manager, initialGameState]);

  // Create reducer
  const [state, dispatch] = useReducer(gameReducer, effectiveInitialState);

  // Set up event subscriptions with the manager when provided
  useEffect(() => {
    if (manager) {
      // Get the event bus from the manager
      // Use a safer approach to access the eventBus property
      const gameEvents = (manager as unknown as { eventBus: EventBus<BaseEvent> }).eventBus;

      // Use separate handlers for each event type to match test expectations
      // Cast event types to string to avoid type errors with EventBus
      const startedEventType = String(EventType.GAME_STARTED);
      const pausedEventType = String(EventType.GAME_PAUSED);
      const resumedEventType = String(EventType.GAME_RESUMED);
      const stoppedEventType = String(EventType.GAME_STOPPED);
      const timeUpdatedEventType = String(EventType.TIME_UPDATED);

      // Create type-safe wrapper for each handler
      const createSafeHandler = (handler: (event: GameManagerEvent) => void) => {
        return (event: BaseEvent) => handler(event as GameManagerEvent);
      };

      /**
       * IMPORTANT: The use of 'unknown' in the subscribe calls is intentional and necessary
       * due to a type incompatibility between GameManagerEventType and EventType.
       *
       * The proper solution would be to:
       * 1. Refactor the event system to use a single EventType enum
       * 2. Fix the GameManagerEvent interface to ensure compatibility with BaseEvent
       *
       * Until then, this type assertion is a necessary workaround.
       * This has been documented in the System_Scratchpad.md file.
       */

      // Subscribe to individual event types - this approach works with the test mocks
      const unsubStarted = gameEvents.subscribe(
        // eslint-disable-next-line @typescript-eslint/no-explicit-unknown
        startedEventType as unknown,
        createSafeHandler(event => handleGameStarted(event, dispatch))
      );

      const unsubPaused = gameEvents.subscribe(
        // eslint-disable-next-line @typescript-eslint/no-explicit-unknown
        pausedEventType as unknown,
        createSafeHandler(event => handleGamePaused(event, dispatch))
      );

      const unsubResumed = gameEvents.subscribe(
        // eslint-disable-next-line @typescript-eslint/no-explicit-unknown
        resumedEventType as unknown,
        createSafeHandler(event => handleGameResumed(event, dispatch))
      );

      const unsubStopped = gameEvents.subscribe(
        // eslint-disable-next-line @typescript-eslint/no-explicit-unknown
        stoppedEventType as unknown,
        createSafeHandler(event => handleGameStopped(event, dispatch))
      );

      const unsubTimeUpdated = gameEvents.subscribe(
        // eslint-disable-next-line @typescript-eslint/no-explicit-unknown
        timeUpdatedEventType as unknown,
        createSafeHandler(event => handleTimeUpdated(event, dispatch))
      );

      // Clean up subscriptions
      return () => {
        if (typeof unsubStarted === 'function') unsubStarted();
        if (typeof unsubPaused === 'function') unsubPaused();
        if (typeof unsubResumed === 'function') unsubResumed();
        if (typeof unsubStopped === 'function') unsubStopped();
        if (typeof unsubTimeUpdated === 'function') unsubTimeUpdated();
      };
    }
    return undefined;
  }, [manager]);

  // Create context value
  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      manager, // Include manager in context value
    }),
    [state, manager]
  );

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
};

// Hook to use the context
export const useGameState = <T,>(selector: (state: GameState) => T): T => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return selector(context.state);
};

// Hook to use the dispatch function
export const useGameDispatch = (): React.Dispatch<GameAction> => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameDispatch must be used within a GameProvider');
  }
  return context.dispatch;
};

// Hook for selecting specific state parts
export const useGameSelector = <T,>(selector: (state: GameState) => T): T => {
  return useGameState(selector);
};

/**
 * Custom hook to get game actions
 */
export const useGameActions = () => {
  const dispatch = useGameDispatch();
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameActions must be used within a GameProvider');
  }

  // Safely get the manager reference
  const managerRef = useMemo(() => {
    /**
     * IMPORTANT: Using type assertion here is necessary due to TypeScript's limitations
     * with discriminated union types. We know the context has a manager property but
     * TypeScript cannot infer this properly from the union type.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-unknown
    return (context as unknown).manager || gameManager;
  }, [context]);

  return {
    startGame: useCallback(() => {
      dispatch(createStartGameAction());
      managerRef?.start?.();
    }, [dispatch, managerRef]),

    pauseGame: useCallback(() => {
      dispatch(createPauseGameAction());
      managerRef?.pause?.();
    }, [dispatch, managerRef]),

    resumeGame: useCallback(() => {
      dispatch(createResumeGameAction());
      managerRef?.resume?.();
    }, [dispatch, managerRef]),

    stopGame: useCallback(() => {
      dispatch(createStopGameAction());
      managerRef?.stop?.();
    }, [dispatch, managerRef]),

    addEvent: useCallback((event: GameEvent) => dispatch(createAddEventAction(event)), [dispatch]),

    updateResources: useCallback(
      (resources: Partial<Record<ResourceType, number>>) =>
        dispatch(createUpdateResourcesAction(resources)),
      [dispatch]
    ),

    updateResourceRates: useCallback(
      (rates: Partial<Record<ResourceType, number>>) =>
        dispatch(createUpdateResourceRatesAction(rates)),
      [dispatch]
    ),

    updateSystems: useCallback(
      (systems: Partial<GameState['systems']>) => dispatch(createUpdateSystemsAction(systems)),
      [dispatch]
    ),

    addMission: useCallback(
      (mission: GameState['missions']['history'][0]) => dispatch(createAddMissionAction(mission)),
      [dispatch]
    ),

    updateMissionStats: useCallback(
      (stats: Partial<GameState['missions']['statistics']>) =>
        dispatch(createUpdateMissionStatsAction(stats)),
      [dispatch]
    ),

    updateSector: useCallback(
      (sectorId: string, updates: Partial<SectorData>) =>
        dispatch(createUpdateSectorAction(sectorId, updates)),
      [dispatch]
    ),

    updateShip: useCallback(
      (shipId: string, updates: Partial<GameState['exploration']['ships'][string]>) =>
        dispatch(createUpdateShipAction(shipId, updates)),
      [dispatch]
    ),
  };
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
