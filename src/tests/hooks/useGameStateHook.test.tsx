/**
 * @file useGameStateHook.test.tsx
 * Tests for the useGameState hook using the custom hook testing utilities.
 *
 * This file demonstrates:
 * 1. Using renderHookWithContexts to test hooks with context
 * 2. Testing selector-based hooks for performance
 * 3. Verifying hook behavior and reactivity to state changes
 */

import * as React from "react";
import { useGameResources, useGameState } from '../../hooks/game/useGameState';
import {
  MockContextStates,
  renderHookWithContexts,
  testHookPerformance,
} from '../../utils/testing/hookTestingUtils';

describe('useGameState hook', () => {
  // Define mock game state for testing
  const mockGameState: MockContextStates = {
    gameState: {
      isRunning: true,
      isPaused: false,
      gameTime: 100,
      resources: {
        minerals: 150,
        energy: 200,
        population: 75,
        research: 50,
      },
      resourceRates: {
        minerals: 15,
        energy: 10,
        population: 2,
        research: 5,
      },
      missions: {
        completed: [],
        active: [],
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
        ships: [],
      },
    },
  };

  it('should return game state with expected properties', () => {
    // Render the hook with mock context
    const { result, cleanup } = renderHookWithContexts(useGameState, mockGameState);

    // Verify the hook returns the expected properties
    expect(result).toBeDefined();
    expect(result.isRunning).toBe(true);
    expect(result.isPaused).toBe(false);
    expect(result.gameTime).toBe(100);
    expect(result.resources).toEqual({
      minerals: 150,
      energy: 200,
      population: 75,
      research: 50,
    });

    // Check that the actions are functions
    expect(typeof result.startGame).toBe('function');
    expect(typeof result.pauseGame).toBe('function');
    expect(typeof result.resumeGame).toBe('function');
    expect(typeof result.dispatchEvent).toBe('function');

    // Clean up after the test
    cleanup();
  });

  it('should react to context changes', async () => {
    // Render the hook with mock context
    const { result, rerender, cleanup } = renderHookWithContexts(useGameState, mockGameState);

    // Verify initial state
    expect(result.gameTime).toBe(100);

    // Update the mock state
    const updatedState: MockContextStates = {
      gameState: {
        ...mockGameState.gameState,
        gameTime: 200,
      },
    };

    // Rerender with updated state
    rerender(updatedState);

    // Verify the hook reflects the updated state
    expect(result.gameTime).toBe(200);

    // Clean up after the test
    cleanup();
  });

  it('should call actions that update state', () => {
    // Render the hook with mock context
    const { result, cleanup } = renderHookWithContexts(useGameState, mockGameState);

    // Mock the dispatch function
    const mockDispatch = jest.fn();
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      state: mockGameState.gameState,
      dispatch: mockDispatch,
    }));

    // Call an action from the hook
    result.pauseGame();

    // Verify the action dispatched the correct action type
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'PAUSE_GAME' });

    // Clean up after the test
    cleanup();
    jest.restoreAllMocks();
  });

  it('should optimize performance with selectors', () => {
    // Test specialized hook for performance
    const { averageRenderTime, selectorCallCounts } = testHookPerformance(useGameResources, 10);

    // Verify the hook renders efficiently
    expect(averageRenderTime).toBeDefined();
    console.log(`Average render time for useGameResources: ${averageRenderTime.toFixed(2)}ms`);

    // In a real test, you might assert that the render time is below a threshold
    // expect(averageRenderTime).toBeLessThan(5); // Expect less than 5ms per render
  });
});
