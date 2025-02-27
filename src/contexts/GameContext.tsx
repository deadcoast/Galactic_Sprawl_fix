import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect, useState } from 'react';
import { GameEvent, GameEventType } from '../types/core/GameTypes';
import { Ship } from '../types/ships/Ship';

interface SectorData {
  id: string;
  status: 'unmapped' | 'mapped' | 'scanning';
  resourcePotential: number;
  habitabilityScore: number;
  lastScanned?: number;
  heatMapValue?: number;
}

// Game State Interface
interface GameState {
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
    ships: Record<string, {
      id: string;
      status: 'idle' | 'scanning' | 'investigating' | 'returning';
      experience: number;
      stealthActive: boolean;
      currentTask?: string;
    }>;
  };
}

// Action Types
type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'ADD_EVENT'; event: GameEvent }
  | { type: 'UPDATE_RESOURCES'; resources: Partial<GameState['resources']> }
  | { type: 'UPDATE_SYSTEMS'; systems: Partial<GameState['systems']> }
  | { type: 'UPDATE_GAME_TIME'; gameTime: number }
  | { type: 'ADD_MISSION'; mission: GameState['missions']['history'][0] }
  | { type: 'UPDATE_MISSION_STATS'; stats: Partial<GameState['missions']['statistics']> }
  | { type: 'UPDATE_SECTOR'; sectorId: string; data: Partial<SectorData> }
  | { type: 'UPDATE_SHIP'; shipId: string; data: Partial<GameState['exploration']['ships'][string]> };

// Initial State
const initialState: GameState = {
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

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
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
        resources: { ...state.resources, ...action.resources },
      };
    case 'UPDATE_SYSTEMS':
      return {
        ...state,
        systems: { ...state.systems, ...action.systems },
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
        },
      };
    case 'UPDATE_MISSION_STATS':
      return {
        ...state,
        missions: {
          ...state.missions,
          statistics: { ...state.missions.statistics, ...action.stats },
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

// Context
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  updateShip: (shipId: string, updates: Partial<Ship>) => void;
  addMission: (mission: GameState['missions']['history'][0]) => void;
  updateSector: (sectorId: string, updates: Partial<GameState['exploration']['sectors'][0]>) => void;
}

const GameContext = createContext<GameContextType | null>(null);

// Provider
interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const updateShip = useCallback((shipId: string, updates: Partial<Ship>) => {
    dispatch({ type: 'UPDATE_SHIP', shipId, data: updates });
  }, []);

  const addMission = useCallback((mission: GameState['missions']['history'][0]) => {
    dispatch({ type: 'ADD_MISSION', mission });
  }, []);

  const updateSector = useCallback((sectorId: string, updates: Partial<GameState['exploration']['sectors'][0]>) => {
    dispatch({ type: 'UPDATE_SECTOR', sectorId, data: updates });
  }, []);

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        updateShip,
        addMission,
        updateSector,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// Hook
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// Helper hooks
export function useResources() {
  const { state } = useGame();
  return state.resources;
}

export function useSystems() {
  const { state } = useGame();
  return state.systems;
}

export function useGameTime() {
  const { state } = useGame();
  return state.gameTime;
}

export function useGameRunning() {
  const { state } = useGame();
  return state.isRunning;
}

export function useGamePaused() {
  const { state } = useGame();
  return state.isPaused;
}
