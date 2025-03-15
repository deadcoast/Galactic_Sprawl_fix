import * as React from "react";
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  GameProvider,
  useGameActions,
  useGameTimeState,
  usePausedState,
  useRunningState,
} from '../../contexts/GameContext';
import { EventBus } from '../../lib/events/EventBus';
import {
  GameManager,
  GameManagerEvent,
  GameManagerEventType,
} from '../../managers/game/gameManager';

// Mock GameManager
vi.mock('../../managers/game/gameManager', () => {
  // Create a mock EventBus class
  const MockEventBus = vi.fn().mockImplementation(() => ({
    subscribe: vi.fn().mockReturnValue(vi.fn()),
    emit: vi.fn(),
  }));

  // Create a mock GameManager
  const MockGameManager = vi.fn().mockImplementation(() => ({
    getGameTime: vi.fn().mockReturnValue(0),
    isGameRunning: vi.fn().mockReturnValue(false),
    isGamePaused: vi.fn().mockReturnValue(false),
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    eventBus: new MockEventBus(),
  }));

  return {
    GameManagerEventType: {
      GAME_STARTED: 'GAME_STARTED',
      GAME_PAUSED: 'GAME_PAUSED',
      GAME_RESUMED: 'GAME_RESUMED',
      GAME_STOPPED: 'GAME_STOPPED',
      TIME_UPDATED: 'TIME_UPDATED',
    },
    gameManager: new MockGameManager(),
    GameManager: MockGameManager,
  };
});

describe('GameContext', () => {
  let mockGameManager: GameManager;
  let mockEventBus: EventBus<GameManagerEvent>;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a mock EventBus
    mockEventBus = new EventBus<GameManagerEvent>();

    // Create a mock GameManager with eventBus
    mockGameManager = {
      getGameTime: vi.fn().mockReturnValue(0),
      isGameRunning: vi.fn().mockReturnValue(false),
      isGamePaused: vi.fn().mockReturnValue(false),
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      stop: vi.fn(),
      subscribeToEvent: vi.fn().mockImplementation(() => {
        return vi.fn(); // Return a cleanup function
      }),
      eventBus: mockEventBus,
    } as unknown as GameManager;
  });

  // TestComponent that uses the GameContext
  const TestComponent = () => {
    const isRunning = useRunningState();
    const isPaused = usePausedState();
    const gameTime = useGameTimeState();
    const { startGame, pauseGame, resumeGame, stopGame } = useGameActions();

    return (
      <div>
        <div data-testid="isRunning">{isRunning ? 'Running' : 'Not Running'}</div>
        <div data-testid="isPaused">{isPaused ? 'Paused' : 'Not Paused'}</div>
        <div data-testid="gameTime">{gameTime !== undefined ? gameTime : 'No Time'}</div>
        <button data-testid="startButton" onClick={startGame}>
          Start
        </button>
        <button data-testid="pauseButton" onClick={pauseGame}>
          Pause
        </button>
        <button data-testid="resumeButton" onClick={resumeGame}>
          Resume
        </button>
        <button data-testid="stopButton" onClick={stopGame}>
          Stop
        </button>
      </div>
    );
  };

  test('should initialize with default game state when no manager is provided', () => {
    // Use explicit initialGameState to ensure the TestComponent has values to display
    render(
      <GameProvider initialGameState={{ gameTime: 0 }}>
        <TestComponent />
      </GameProvider>
    );

    // Default values
    expect(screen.getByTestId('isRunning')).toHaveTextContent('Not Running');
    expect(screen.getByTestId('isPaused')).toHaveTextContent('Not Paused');
    expect(screen.getByTestId('gameTime')).toHaveTextContent('0');
  });

  test('should initialize with state from GameManager', () => {
    mockGameManager.getGameTime = vi.fn().mockReturnValue(123);
    mockGameManager.isGameRunning = vi.fn().mockReturnValue(true);
    mockGameManager.isGamePaused = vi.fn().mockReturnValue(false);

    render(
      <GameProvider manager={mockGameManager}>
        <TestComponent />
      </GameProvider>
    );

    // Values from mock GameManager
    expect(screen.getByTestId('isRunning')).toHaveTextContent('Running');
    expect(screen.getByTestId('isPaused')).toHaveTextContent('Not Paused');
    expect(screen.getByTestId('gameTime')).toHaveTextContent('123');
  });

  test('should call GameManager methods when using game actions', () => {
    render(
      <GameProvider manager={mockGameManager}>
        <TestComponent />
      </GameProvider>
    );

    // Click action buttons
    act(() => {
      screen.getByTestId('startButton').click();
    });
    expect(mockGameManager.start).toHaveBeenCalled();

    act(() => {
      screen.getByTestId('pauseButton').click();
    });
    expect(mockGameManager.pause).toHaveBeenCalled();

    act(() => {
      screen.getByTestId('resumeButton').click();
    });
    expect(mockGameManager.resume).toHaveBeenCalled();

    act(() => {
      screen.getByTestId('stopButton').click();
    });
    expect(mockGameManager.stop).toHaveBeenCalled();
  });

  test('should update state when game events are emitted', () => {
    // Store event handlers to simulate event firing
    const eventHandlers: Record<string, (event: GameManagerEvent) => void> = {};

    // Mock the EventBus subscribe method to capture the handlers
    mockEventBus.subscribe = vi.fn().mockImplementation((eventType, handler) => {
      eventHandlers[eventType as string] = handler;
      return vi.fn(); // Return cleanup function
    });

    render(
      <GameProvider manager={mockGameManager}>
        <TestComponent />
      </GameProvider>
    );

    // Verify initial state
    expect(screen.getByTestId('isRunning')).toHaveTextContent('Not Running');

    // Simulate a game started event
    act(() => {
      const handler = eventHandlers[GameManagerEventType.GAME_STARTED];
      if (handler) {
        handler({
          type: GameManagerEventType.GAME_STARTED,
          timestamp: Date.now(),
          moduleId: 'test',
          moduleType: 'test',
        } as unknown as GameManagerEvent);
      }
    });

    // State should be updated
    expect(screen.getByTestId('isRunning')).toHaveTextContent('Running');

    // Simulate a time update event
    act(() => {
      const handler = eventHandlers[GameManagerEventType.TIME_UPDATED];
      if (handler) {
        handler({
          type: GameManagerEventType.TIME_UPDATED,
          gameTime: 42,
          timestamp: Date.now(),
          moduleId: 'test',
          moduleType: 'test',
        } as unknown as GameManagerEvent);
      }
    });

    // Game time should be updated
    expect(screen.getByTestId('gameTime')).toHaveTextContent('42');
  });

  test('should clean up subscriptions on unmount', () => {
    const unsubscribeMock = vi.fn();

    // Make the EventBus subscribe return our mock unsubscribe function
    mockEventBus.subscribe = vi.fn().mockReturnValue(unsubscribeMock);

    const { unmount } = render(
      <GameProvider manager={mockGameManager}>
        <TestComponent />
      </GameProvider>
    );

    // Expect subscriptions to be set up
    expect(mockEventBus.subscribe).toHaveBeenCalled();

    // Unmount the component
    unmount();

    // Unsubscribe function should be called for each subscription
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
