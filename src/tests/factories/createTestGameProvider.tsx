import * as React from "react";
import { createContext, ReactNode, useCallback, useEffect, useReducer } from 'react';
import { GameContext } from '../../contexts/GameContext';
import { GameEvent } from '../../types/core/GameTypes';
import { Ship } from '../../types/ships/Ship';
import {
  disableAllWebSocketServers,
  disableWebSocketServers,
  getTestWebSocketPort,
  registerTestWebSocketServer,
} from '../setup';
import { registerCleanup } from '../utils/testStateReset';

/**
 * Test factory for the GameContext provider
 *
 * This file provides a test implementation of the GameContext provider that behaves
 * like the real implementation but is simplified for testing purposes.
 * It provides the same interface as the real GameContext provider plus helper methods
 * for setting state and verifying behavior in tests.
 */

/**
 * Basic sector data structure
 */
interface SectorData {
  id: string;
  status: 'unmapped' | 'mapped' | 'scanning';
  resourcePotential: number;
  habitabilityScore: number;
  lastScanned?: number;
  heatMapValue?: number;
}

/**
 * Simplified game state for testing
 */
export interface TestGameState {
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
 * Action types that can be dispatched to the test game reducer
 */
export type TestGameAction =
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'ADD_EVENT'; event: GameEvent }
  | { type: 'UPDATE_RESOURCES'; resources: Partial<TestGameState['resources']> }
  | { type: 'UPDATE_RESOURCE_RATES'; rates: Partial<TestGameState['resourceRates']> }
  | { type: 'UPDATE_SYSTEMS'; systems: Partial<TestGameState['systems']> }
  | { type: 'UPDATE_GAME_TIME'; gameTime: number }
  | { type: 'ADD_MISSION'; mission: TestGameState['missions']['history'][0] }
  | { type: 'UPDATE_MISSION_STATS'; stats: Partial<TestGameState['missions']['statistics']> }
  | { type: 'UPDATE_SECTOR'; sectorId: string; data: Partial<SectorData> }
  | {
      type: 'UPDATE_SHIP';
      shipId: string;
      data: Partial<TestGameState['exploration']['ships'][string]>;
    };

/**
 * Default initial state for tests
 */
export const DEFAULT_TEST_GAME_STATE: TestGameState = {
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
 * Game reducer for test provider
 */
function testGameReducer(state: TestGameState, action: TestGameAction): TestGameState {
  switch (action.type) {
    case 'START_GAME':
      return { ...state, isRunning: true };
    case 'PAUSE_GAME':
      return { ...state, isPaused: true };
    case 'RESUME_GAME':
      return { ...state, isPaused: false };
    case 'ADD_EVENT':
      return {
        ...state,
        events: [...state.events, action.event],
      };
    case 'UPDATE_RESOURCES':
      return {
        ...state,
        resources: {
          ...state.resources,
          ...action.resources,
        },
      };
    case 'UPDATE_RESOURCE_RATES':
      return {
        ...state,
        resourceRates: {
          ...state.resourceRates,
          ...action.rates,
        },
      };
    case 'UPDATE_SYSTEMS':
      return {
        ...state,
        systems: {
          ...state.systems,
          ...action.systems,
        },
      };
    case 'UPDATE_GAME_TIME':
      return {
        ...state,
        gameTime: action.gameTime,
      };
    case 'ADD_MISSION':
      return {
        ...state,
        missions: {
          ...state.missions,
          history: [...state.missions.history, action.mission],
          completed: state.missions.completed + (action.mission.type === 'completion' ? 1 : 0),
          inProgress: state.missions.inProgress + (action.mission.type !== 'completion' ? 1 : -1),
        },
      };
    case 'UPDATE_MISSION_STATS':
      return {
        ...state,
        missions: {
          ...state.missions,
          statistics: {
            ...state.missions.statistics,
            ...action.stats,
          },
        },
      };
    case 'UPDATE_SECTOR':
      return {
        ...state,
        exploration: {
          ...state.exploration,
          sectors: {
            ...state.exploration.sectors,
            [action.sectorId]: {
              ...state.exploration.sectors[action.sectorId],
              ...action.data,
            },
          },
        },
      };
    case 'UPDATE_SHIP':
      return {
        ...state,
        exploration: {
          ...state.exploration,
          ships: {
            ...state.exploration.ships,
            [action.shipId]: {
              ...state.exploration.ships[action.shipId],
              ...action.data,
            },
          },
        },
      };
    default:
      return state;
  }
}

/**
 * Context for test helper methods
 */
export interface TestGameHelpers {
  // Set state directly without dispatching actions
  setResources: (resources: Partial<TestGameState['resources']>) => void;
  setResourceRates: (rates: Partial<TestGameState['resourceRates']>) => void;
  addShip: (ship: TestGameState['exploration']['ships'][string]) => void;
  addSector: (sector: SectorData) => void;
  resetState: () => void;
  setInitialState: (initialState: Partial<TestGameState>) => void;
}

// Create a context for the test helpers
export const TestGameHelperContext = createContext<TestGameHelpers | null>(null);

/**
 * Props for the TestGameProvider
 */
interface TestGameProviderProps {
  children: ReactNode;
  initialState?: Partial<TestGameState>;
  webSocketPort?: number;
}

/**
 * Creates a test game provider component that can be used in tests
 *
 * @param props Component props including children and optional initial state
 * @returns A React component that provides a test implementation of the game context
 */
export function TestGameProvider({
  children,
  initialState = {},
  webSocketPort,
}: TestGameProviderProps) {
  // Get a WebSocket port if none is provided
  const portRef = React.useRef<number | null>(null);

  // Setup WebSocket server if needed
  useEffect(() => {
    // Skip WebSocket setup if disabled globally
    if (disableWebSocketServers) {
      console.warn('[TestGameProvider] WebSocket servers are disabled globally, skipping setup');
      return;
    }

    // Use provided port or get a new one
    const port = webSocketPort || getTestWebSocketPort('TestGameProvider');
    portRef.current = port;

    console.warn(`[TestGameProvider] Using WebSocket port: ${port}`);

    // Mock WebSocket server setup
    const mockServer = {
      clients: new Set(),
      close: () => {
        console.warn(`[TestGameProvider] Closing WebSocket server on port ${port}`);
      },
    };

    // Register cleanup function
    const cleanup = () => {
      if (portRef.current) {
        console.warn(`[TestGameProvider] Cleaning up WebSocket server on port ${portRef.current}`);
        mockServer.close();
        portRef.current = null;
      }
    };

    // Register the server for cleanup
    registerTestWebSocketServer(port, mockServer.close);

    // Register the cleanup function to ensure it's called
    const unregister = registerCleanup(cleanup);

    return () => {
      // Clean up when the component is unmounted
      cleanup();
      unregister();
    };
  }, [webSocketPort]);

  // Merge the default state with any provided initial state
  const mergedInitialState = {
    ...DEFAULT_TEST_GAME_STATE,
    ...initialState,
    resources: {
      ...DEFAULT_TEST_GAME_STATE.resources,
      ...(initialState.resources || {}),
    },
    resourceRates: {
      ...DEFAULT_TEST_GAME_STATE.resourceRates,
      ...(initialState.resourceRates || {}),
    },
    systems: {
      ...DEFAULT_TEST_GAME_STATE.systems,
      ...(initialState.systems || {}),
    },
    missions: {
      ...DEFAULT_TEST_GAME_STATE.missions,
      ...(initialState.missions || {}),
      statistics: {
        ...DEFAULT_TEST_GAME_STATE.missions.statistics,
        ...(initialState.missions?.statistics || {}),
      },
    },
    exploration: {
      ...DEFAULT_TEST_GAME_STATE.exploration,
      ...(initialState.exploration || {}),
      sectors: {
        ...DEFAULT_TEST_GAME_STATE.exploration.sectors,
        ...(initialState.exploration?.sectors || {}),
      },
      ships: {
        ...DEFAULT_TEST_GAME_STATE.exploration.ships,
        ...(initialState.exploration?.ships || {}),
      },
    },
  };

  const [state, dispatch] = useReducer(testGameReducer, mergedInitialState);

  const updateShip = useCallback((shipId: string, updates: Partial<Ship>) => {
    dispatch({
      type: 'UPDATE_SHIP',
      shipId,
      data: updates,
    });
  }, []);

  const addMission = useCallback((mission: TestGameState['missions']['history'][0]) => {
    dispatch({
      type: 'ADD_MISSION',
      mission,
    });
  }, []);

  const updateSector = useCallback((sectorId: string, updates: Partial<SectorData>) => {
    dispatch({
      type: 'UPDATE_SECTOR',
      sectorId,
      data: updates,
    });
  }, []);

  // Test helper methods
  const setResources = useCallback((resources: Partial<TestGameState['resources']>) => {
    dispatch({
      type: 'UPDATE_RESOURCES',
      resources,
    });
  }, []);

  const setResourceRates = useCallback((rates: Partial<TestGameState['resourceRates']>) => {
    dispatch({
      type: 'UPDATE_RESOURCE_RATES',
      rates,
    });
  }, []);

  const addShip = useCallback((ship: TestGameState['exploration']['ships'][string]) => {
    if (!ship.id) {
      throw new Error('Ship must have an id');
    }

    dispatch({
      type: 'UPDATE_SHIP',
      shipId: ship.id,
      data: ship,
    });
  }, []);

  const addSector = useCallback((sector: SectorData) => {
    if (!sector.id) {
      throw new Error('Sector must have an id');
    }

    dispatch({
      type: 'UPDATE_SECTOR',
      sectorId: sector.id,
      data: sector,
    });
  }, []);

  // Store the initial state in a ref to avoid dependency issues
  const initialStateRef = React.useRef(mergedInitialState);

  const resetState = useCallback(() => {
    // Use the stored initial state instead of creating a new reducer
    const resetToState = initialStateRef.current;

    // Update resources
    dispatch({
      type: 'UPDATE_RESOURCES',
      resources: resetToState.resources,
    });

    // Update resource rates
    dispatch({
      type: 'UPDATE_RESOURCE_RATES',
      rates: resetToState.resourceRates,
    });

    // Update systems
    dispatch({
      type: 'UPDATE_SYSTEMS',
      systems: resetToState.systems,
    });

    // Reset game state
    if (resetToState.isRunning !== state.isRunning) {
      dispatch({
        type: resetToState.isRunning ? 'START_GAME' : 'RESUME_GAME',
      });
    }

    if (resetToState.isPaused !== state.isPaused) {
      dispatch({
        type: resetToState.isPaused ? 'PAUSE_GAME' : 'RESUME_GAME',
      });
    }

    // Reset game time
    dispatch({
      type: 'UPDATE_GAME_TIME',
      gameTime: resetToState.gameTime,
    });
  }, [state.isRunning, state.isPaused, dispatch]);

  const setInitialState = useCallback(
    (newState: Partial<TestGameState>) => {
      // Update resources if provided
      if (newState.resources) {
        dispatch({
          type: 'UPDATE_RESOURCES',
          resources: newState.resources,
        });
      }

      // Update resource rates if provided
      if (newState.resourceRates) {
        dispatch({
          type: 'UPDATE_RESOURCE_RATES',
          rates: newState.resourceRates,
        });
      }

      // Update systems if provided
      if (newState.systems) {
        dispatch({
          type: 'UPDATE_SYSTEMS',
          systems: newState.systems,
        });
      }

      // Update game time if provided
      if (newState.gameTime !== undefined) {
        dispatch({
          type: 'UPDATE_GAME_TIME',
          gameTime: newState.gameTime,
        });
      }

      // Update game state if provided
      if (newState.isRunning !== undefined && newState.isRunning !== state.isRunning) {
        dispatch({
          type: newState.isRunning ? 'START_GAME' : 'RESUME_GAME',
        });
      }

      if (newState.isPaused !== undefined && newState.isPaused !== state.isPaused) {
        dispatch({
          type: newState.isPaused ? 'PAUSE_GAME' : 'RESUME_GAME',
        });
      }
    },
    [state.isRunning, state.isPaused]
  );

  // Create the test helpers context value
  const testHelpers: TestGameHelpers = {
    setResources,
    setResourceRates,
    addShip,
    addSector,
    resetState,
    setInitialState,
  };

  // Create the game context value
  const gameContextValue = {
    state,
    dispatch,
    updateShip,
    addMission,
    updateSector,
  };

  return (
    <TestGameHelperContext.Provider value={testHelpers}>
      <GameContext.Provider
        value={
          gameContextValue as unknown as React.ComponentProps<typeof GameContext.Provider>['value']
        }
      >
        {children}
      </GameContext.Provider>
    </TestGameHelperContext.Provider>
  );
}

/**
 * Custom hook to access test game helper methods
 */
export function useTestGameHelpers(): TestGameHelpers {
  const context = React.useContext(TestGameHelperContext);
  if (!context) {
    throw new Error('useTestGameHelpers must be used within a TestGameProvider');
  }
  return context;
}

/**
 * Creates a test game provider for use in tests
 *
 * @param initialState Optional initial state to use for the provider
 * @param options Optional configuration options
 * @returns A function that wraps components with the test game provider
 */
export function createTestGameProvider(
  initialState: Partial<TestGameState> = {},
  options: {
    webSocketPort?: number;
  } = {}
) {
  // To ensure WebSockets are properly disabled, call disableAllWebSocketServers
  // when this factory is used for testing
  disableAllWebSocketServers();

  return function wrapWithTestGameProvider(ui: React.ReactElement) {
    return (
      <TestGameProvider initialState={initialState} webSocketPort={options.webSocketPort}>
        {ui}
      </TestGameProvider>
    );
  };
}
