import { useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { gameManager } from '../../managers/game/gameManager';
import { GameEvent } from '../../types/core/GameTypes';

export function useGameState() {
  const { state, dispatch } = useGame();

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
    };
  }, [state.isRunning, state.isPaused, dispatch]);

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
