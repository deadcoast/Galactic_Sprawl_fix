import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameEvent, GameEventType } from '../types/core/GameTypes';

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
  systems: {
    total: number;
    colonized: number;
    explored: number;
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
  | { type: 'UPDATE_GAME_TIME'; gameTime: number };

// Initial State
const initialState: GameState = {
  isRunning: false,
  isPaused: false,
  gameTime: 0,
  events: [],
  resources: {
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
    default:
      return state;
  }
}

// Context
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider
interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
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
