/**
 * @file hookTestingUtils.tsx
 * Provides utilities for testing context hooks.
 *
 * This file implements:
 * 1. Test renderers for hooks with mocked contexts
 * 2. State change simulators for testing hook reactivity
 * 3. Selector usage tracking for performance testing
 * 4. Validation utilities for hook behavior verification
 */

import { act, render, RenderResult } from '@testing-library/react';
import { ReactNode, useEffect, useState } from 'react';
import {
  clearHookPerformanceData,
  getHookPerformanceData,
  HookPerformanceConfig,
} from '../performance/hookPerformanceMonitor';

// Import context providers
import { GameProvider } from '../../contexts/GameContext';
import { ModuleProvider } from '../../contexts/ModuleContext';
import { ResourceRatesProvider } from '../../contexts/ResourceRatesContext';

// Base type for state objects
export type StateObject = Record<string, unknown>;

// Type definitions for the test providers and utilities
export interface TestProviderProps {
  children: ReactNode;
  initialState?: StateObject;
}

/**
 * Mock initial states for different context providers
 */
export interface MockContextStates {
  gameState?: StateObject;
  resourceState?: StateObject;
  moduleState?: StateObject;
}

/**
 * Result from a hook test operation
 */
export interface HookTestResult<T> {
  /**
   * The current result of the hook
   */
  result: T;

  /**
   * The render result from React Testing Library
   */
  renderResult: RenderResult;

  /**
   * Function to re-render the hook with updated context
   */
  rerender: (updatedState?: MockContextStates) => void;

  /**
   * Performance data for the hook
   */
  performanceData: () => ReturnType<typeof getHookPerformanceData> | undefined;

  /**
   * Wait for the next re-render of the hook
   */
  waitForNextRender: () => Promise<void>;

  /**
   * Clean up the test
   */
  cleanup: () => void;
}

/**
 * A component that tracks renders of a hook
 */
function HookTestComponent<T, P extends unknown[]>({
  useHook,
  onResult,
  hookParams = [] as unknown as P,
}: {
  useHook: (...args: P) => T;
  onResult: (result: T) => void;
  hookParams?: P;
}) {
  // Call the hook with provided params
  const hookResult = useHook(...hookParams);

  // Notify the test about the hook result
  useEffect(() => {
    onResult(hookResult);
  }, [hookResult, onResult]);

  return null;
}

/**
 * Create a wrapper with all context providers for testing hooks
 */
export function createContextProviders(mockStates: MockContextStates = {}) {
  return ({ children }: { children: ReactNode }) => (
    <GameProvider initialGameState={mockStates.gameState}>
      <ResourceRatesProvider>
        <ModuleProvider>{children}</ModuleProvider>
      </ResourceRatesProvider>
    </GameProvider>
  );
}

/**
 * Renders a hook with mocked context providers for testing
 *
 * @param useHook The hook to test
 * @param mockStates Initial state for context providers
 * @param hookParams Parameters to pass to the hook
 * @returns Test result object with utilities for testing the hook
 */
export function renderHookWithContexts<T, P extends unknown[]>(
  useHook: (...args: P) => T,
  mockStates: MockContextStates = {},
  hookParams: P = [] as unknown as P
): HookTestResult<T> {
  let latestResult: T;
  let renderCount = 0;
  const renderPromises: Array<{
    resolve: () => void;
    reject: (reason?: unknown) => void;
  }> = [];

  // Function to handle hook result updates
  const handleResult = (result: T) => {
    latestResult = result;
    renderCount++;

    // Resolve any pending render promises
    if (renderPromises.length > 0) {
      const promise = renderPromises.shift();
      if (promise) {
        promise.resolve();
      }
    }
  };

  // Render the hook within context providers
  const renderResult = render(
    <HookTestComponent useHook={useHook} onResult={handleResult} hookParams={hookParams} />,
    { wrapper: createContextProviders(mockStates) }
  );

  // Function to rerender with updated state
  const rerender = (updatedState?: MockContextStates) => {
    act(() => {
      renderResult.rerender(
        <HookTestComponent useHook={useHook} onResult={handleResult} hookParams={hookParams} />
      );
    });
  };

  // Function to wait for the next render
  const waitForNextRender = () => {
    const currentRenderCount = renderCount;
    return new Promise<void>((resolve, reject) => {
      // If a render has already happened since we started waiting, resolve immediately
      if (renderCount > currentRenderCount) {
        resolve();
        return;
      }

      // Otherwise, store the promise to be resolved on next render
      renderPromises.push({ resolve, reject });

      // Set a timeout to reject the promise if no render happens
      setTimeout(() => {
        const index = renderPromises.findIndex(p => p.resolve === resolve);
        if (index !== -1) {
          renderPromises.splice(index, 1);
          reject(new Error('Timed out waiting for hook to render'));
        }
      }, 5000);
    });
  };

  // Function to get performance data for the hook
  const getPerformanceData = () => {
    if (typeof useHook.name === 'string') {
      return getHookPerformanceData(useHook.name);
    }
    return undefined;
  };

  // Clean up function
  const cleanup = () => {
    renderResult.unmount();
    if (typeof useHook.name === 'string') {
      clearHookPerformanceData(useHook.name);
    }
    // Reject any pending render promises
    renderPromises.forEach(p => p.reject(new Error('Test was cleaned up')));
    renderPromises.length = 0;
  };

  return {
    result: latestResult!,
    renderResult,
    rerender,
    performanceData: getPerformanceData,
    waitForNextRender,
    cleanup,
  };
}

/**
 * Mocks a game state update for testing hooks
 *
 * @param renderResult The render result from renderHookWithContexts
 * @param stateUpdates State updates to apply
 */
export function mockGameStateUpdate(renderResult: RenderResult, stateUpdates: StateObject) {
  const gameContext = renderResult.container.querySelector('[data-testid="game-context"]');
  if (!gameContext) {
    throw new Error('Game context not found');
  }

  act(() => {
    // Dispatch a state update event to the game context
    const updateEvent = new CustomEvent('state-update', {
      detail: stateUpdates,
    });
    gameContext.dispatchEvent(updateEvent);
  });
}

/**
 * Mocks a resource state update for testing hooks
 *
 * @param renderResult The render result from renderHookWithContexts
 * @param stateUpdates State updates to apply
 */
export function mockResourceStateUpdate(renderResult: RenderResult, stateUpdates: StateObject) {
  const resourceContext = renderResult.container.querySelector('[data-testid="resource-context"]');
  if (!resourceContext) {
    throw new Error('Resource context not found');
  }

  act(() => {
    // Dispatch a state update event to the resource context
    const updateEvent = new CustomEvent('state-update', {
      detail: stateUpdates,
    });
    resourceContext.dispatchEvent(updateEvent);
  });
}

/**
 * Mocks a module state update for testing hooks
 *
 * @param renderResult The render result from renderHookWithContexts
 * @param stateUpdates State updates to apply
 */
export function mockModuleStateUpdate(renderResult: RenderResult, stateUpdates: StateObject) {
  const moduleContext = renderResult.container.querySelector('[data-testid="module-context"]');
  if (!moduleContext) {
    throw new Error('Module context not found');
  }

  act(() => {
    // Dispatch a state update event to the module context
    const updateEvent = new CustomEvent('state-update', {
      detail: stateUpdates,
    });
    moduleContext.dispatchEvent(updateEvent);
  });
}

/**
 * Tracks the number of renders of a hook
 *
 * @param useHook The hook to track
 * @param mockStates Initial state for context providers
 * @param hookParams Parameters to pass to the hook
 * @returns The number of times the hook was rendered
 */
export function trackHookRenders<T, P extends unknown[]>(
  useHook: (...args: P) => T,
  mockStates: MockContextStates = {},
  hookParams: P = [] as unknown as P
): number {
  let renderCount = 0;

  // Create a test component that just tracks renders
  function RenderTracker() {
    useHook(...hookParams);
    renderCount++;
    return null;
  }

  // Render the component
  const { unmount } = render(<RenderTracker />, {
    wrapper: createContextProviders(mockStates),
  });

  // Clean up
  unmount();

  return renderCount;
}

/**
 * Verifies that a hook correctly subscribes to context changes
 *
 * @param useHook The hook to test
 * @param mockStates Initial state for context providers
 * @param stateUpdates State updates to apply
 * @param shouldRerender Whether the hook should rerender in response to the state update
 * @returns Promise that resolves to true if the hook behaved as expected
 */
export async function verifyHookSubscription<T, P extends unknown[]>(
  useHook: (...args: P) => T,
  mockStates: MockContextStates = {},
  stateUpdates: MockContextStates,
  shouldRerender: boolean
): Promise<boolean> {
  let renderCount = 0;

  // Create a test component that tracks renders
  function SubscriptionTestComponent() {
    useHook(...([] as unknown as P));
    renderCount++;
    return null;
  }

  // Create wrapper with all contexts
  const AllContexts = createContextProviders(mockStates);

  // Set up a component with state that we can update
  function TestContainer() {
    const [state, setState] = useState(mockStates);

    // Effect to update state after initial render
    useEffect(() => {
      // Wait a bit to ensure initial render is complete
      const timer = setTimeout(() => {
        act(() => {
          setState({ ...state, ...stateUpdates });
        });
      }, 100);

      return () => clearTimeout(timer);
    }, []);

    return (
      <AllContexts>
        <SubscriptionTestComponent />
      </AllContexts>
    );
  }

  // Render the component
  const initialRenderCount = renderCount;
  const { unmount } = render(<TestContainer />);

  // Wait for potential rerenders
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check if the hook rerendered as expected
  const didRerender = renderCount > initialRenderCount + 1; // +1 for initial render

  // Clean up
  unmount();

  return didRerender === shouldRerender;
}

/**
 * Creates a mock for a specific context hook for testing components
 *
 * @param hookName The name of the hook to mock
 * @param mockReturn The value to return from the hook
 * @returns A Jest mock function that can be used to replace the hook
 */
export function createHookMock<T>(hookName: string, mockReturn: T): jest.Mock<T> {
  const mock = jest.fn().mockImplementation(() => mockReturn);
  mock.mockName(hookName);
  return mock;
}

/**
 * Creates a test component that tests a hook's behavior on performance
 *
 * @param useHook The hook to test
 * @param iterations Number of times to render
 * @returns Performance statistics for the hook
 */
export function testHookPerformance<T, P extends unknown[]>(
  useHook: (...args: P) => T,
  iterations: number = 100
): {
  averageRenderTime: number;
  minRenderTime: number;
  maxRenderTime: number;
  totalRenderTime: number;
  selectorCallCounts: Record<string, number>;
} {
  const renderTimes: number[] = [];
  const selectorCalls: Record<string, number> = {};

  // Clear any existing performance data
  if (typeof useHook.name === 'string') {
    clearHookPerformanceData(useHook.name);
  }

  // Create a custom performance config for testing
  const testPerformanceConfig: HookPerformanceConfig = {
    enabled: true,
    hookName: typeof useHook.name === 'string' ? useHook.name : 'anonymous-hook',
    selectorThreshold: 100, // High threshold to avoid noise in test output
    computationThreshold: 100,
    verbose: false,
  };

  // Create a component that renders the hook repeatedly
  function PerformanceTestComponent() {
    const startTime = performance.now();
    const result = useHook(...([] as unknown as P));
    const endTime = performance.now();

    renderTimes.push(endTime - startTime);

    // Track selector usage if available from the hook result
    if (result && typeof result === 'object' && 'selectorCalls' in result) {
      const calls = result.selectorCalls as Record<string, number>;
      Object.entries(calls).forEach(([selector, count]) => {
        selectorCalls[selector] = (selectorCalls[selector] || 0) + count;
      });
    }

    return null;
  }

  // Render the component multiple times
  const { rerender, unmount } = render(<PerformanceTestComponent />);

  // Rerender the specified number of times
  for (let i = 0; i < iterations - 1; i++) {
    act(() => {
      rerender(<PerformanceTestComponent />);
    });
  }

  // Calculate statistics
  const totalRenderTime = renderTimes.reduce((sum, time) => sum + time, 0);
  const averageRenderTime = totalRenderTime / renderTimes.length;
  const minRenderTime = Math.min(...renderTimes);
  const maxRenderTime = Math.max(...renderTimes);

  // Clean up
  unmount();

  return {
    averageRenderTime,
    minRenderTime,
    maxRenderTime,
    totalRenderTime,
    selectorCallCounts: selectorCalls,
  };
}

// Type for module object with the minimum required properties
interface ModuleBase {
  id: string;
  isActive: boolean;
  [key: string]: unknown;
}

/**
 * Mock implementation of GameContext for testing hooks
 */
export class MockGameContext {
  public state: StateObject;
  private listeners: Array<(state: StateObject) => void> = [];

  constructor(initialState: StateObject = {}) {
    this.state = {
      isRunning: false,
      isPaused: false,
      gameTime: 0,
      resources: {
        minerals: 100,
        energy: 100,
        population: 50,
        research: 0,
      },
      resourceRates: {
        minerals: 10,
        energy: 5,
        population: 1,
        research: 2,
      },
      systems: [],
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
      ...initialState,
    };
  }

  updateState(update: StateObject) {
    this.state = { ...this.state, ...update };
    this.notifyListeners();
  }

  subscribe(listener: (state: StateObject) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Mock all the common game context actions
  startGame = jest.fn().mockImplementation(() => {
    this.updateState({ isRunning: true, isPaused: false });
  });

  pauseGame = jest.fn().mockImplementation(() => {
    this.updateState({ isPaused: true });
  });

  resumeGame = jest.fn().mockImplementation(() => {
    this.updateState({ isPaused: false });
  });

  dispatchEvent = jest.fn();
}

/**
 * Mock implementation of ResourceRatesContext for testing hooks
 */
export class MockResourceRatesContext {
  public state: StateObject;
  private listeners: Array<(state: StateObject) => void> = [];

  constructor(initialState: StateObject = {}) {
    this.state = {
      minerals: { production: 10, consumption: 5, net: 5 },
      energy: { production: 15, consumption: 10, net: 5 },
      population: { production: 2, consumption: 1, net: 1 },
      research: { production: 5, consumption: 2, net: 3 },
      lastUpdated: Date.now(),
      ...initialState,
    };
  }

  updateState(update: StateObject) {
    this.state = { ...this.state, ...update };
    this.notifyListeners();
  }

  subscribe(listener: (state: StateObject) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Mock common resource context actions
  updateRates = jest.fn().mockImplementation((type, production, consumption) => {
    this.updateState({
      [type]: {
        production,
        consumption,
        net: production - consumption,
      },
      lastUpdated: Date.now(),
    });
  });

  resetRates = jest.fn().mockImplementation(() => {
    this.updateState({
      minerals: { production: 0, consumption: 0, net: 0 },
      energy: { production: 0, consumption: 0, net: 0 },
      population: { production: 0, consumption: 0, net: 0 },
      research: { production: 0, consumption: 0, net: 0 },
      lastUpdated: Date.now(),
    });
  });
}

/**
 * Mock implementation of ModuleContext for testing hooks
 */
export class MockModuleContext {
  public state: StateObject;
  private listeners: Array<(state: StateObject) => void> = [];

  constructor(initialState: StateObject = {}) {
    this.state = {
      activeModules: [],
      buildings: [],
      selectedModuleId: undefined,
      selectedBuildingId: undefined,
      ...initialState,
    };
  }

  updateState(update: StateObject) {
    this.state = { ...this.state, ...update };
    this.notifyListeners();
  }

  subscribe(listener: (state: StateObject) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Mock common module context actions
  dispatch = jest.fn().mockImplementation(action => {
    switch (action.type) {
      case 'SELECT_MODULE':
        this.updateState({ selectedModuleId: action.moduleId });
        break;

      case 'SELECT_BUILDING':
        this.updateState({ selectedBuildingId: action.buildingId });
        break;

      case 'SET_MODULE_ACTIVE': {
        // Find the module and update its active state
        const updatedModules = (this.state.activeModules as ModuleBase[]).map(
          (module: ModuleBase) =>
            module.id === action.moduleId ? { ...module, isActive: action.active } : module
        );
        this.updateState({ activeModules: updatedModules });
        break;
      }

      case 'REGISTER_BUILDING':
        this.updateState({
          buildings: [...(this.state.buildings as unknown[]), action.building],
        });
        break;

      case 'UPDATE_ACTIVE_MODULES':
        this.updateState({ activeModules: action.modules });
        break;

      default:
        // Other actions would typically interact with module manager
        break;
    }
  });
}

/**
 * Export hook testing utilities for use in tests
 */
export const HookTestingUtilities = {
  renderHookWithContexts,
  mockGameStateUpdate,
  mockResourceStateUpdate,
  mockModuleStateUpdate,
  trackHookRenders,
  verifyHookSubscription,
  createHookMock,
  testHookPerformance,
  MockGameContext,
  MockResourceRatesContext,
  MockModuleContext,
};
