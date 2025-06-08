/**
 * @file SharedManagerTypes.ts
 * Shared manager interfaces and types for both production and test code
 *
 * This file provides unified manager types to:
 * 1. Eliminate "as unknown as" casts when accessing manager properties
 * 2. Create consistent interfaces for mocks and real implementations
 * 3. Make tests work with the same types as production code
 */

import { BaseEvent, EventBus, EventHandler, TypedEvent } from '../events/SharedEventTypes';
import { Manager } from '../TypeUtils';

/**
 * Base manager interface that all managers should implement
 */
export interface BaseManager extends Manager {
  readonly id: string;
  readonly type: string;
  readonly isInitialized: boolean;
  initialize(): Promise<void> | void;
  dispose(): void;
}

/**
 * Event-capable manager interface
 */
export interface EventCapableManager<E extends BaseEvent = BaseEvent> extends BaseManager {
  subscribeToEvent(type: string, handler: EventHandler<E>): () => void;
  unsubscribeFromEvent(type: string, handler: EventHandler<E>): void;
  emitEvent(event: E): void;
  getEventBus(): EventBus<E>;
}

/**
 * Generic store interface for managers that maintain state
 */
export interface StateManager<T> extends BaseManager {
  getState(): T;
  setState(state: Partial<T>): void;
  resetState(): void;
}

/**
 * Generic manager configuration
 */
export interface ManagerConfig {
  id?: string;
  type: string;
  options?: Record<string, unknown>;
}

/**
 * Manager factory interface for creating manager instances
 */
export interface ManagerFactory<M extends BaseManager, C extends ManagerConfig = ManagerConfig> {
  create(config: C): M;
  canHandleType(type: string): boolean;
}

/**
 * Registry service interface for storing and retrieving managers
 */
export interface ManagerRegistry {
  register<M extends BaseManager>(manager: M): void;
  unregister(managerId: string): void;
  getManager<M extends BaseManager>(managerId: string): M | undefined;
  getManagersByType<M extends BaseManager>(managerType: string): M[];
  getAllManagers<M extends BaseManager>(): M[];
}

/**
 * Mock manager base interface for testing
 */
export interface MockManager extends BaseManager {
  mockClear(): void;
  mockReset(): void;
  getMockCalls(): Record<string, unknown[][]>;
}

/**
 * Mock event manager interface for testing
 */
export interface MockEventManager<E extends BaseEvent = BaseEvent>
  extends EventCapableManager<E>,
    MockManager {
  getEmittedEvents(): E[];
  getEventSubscriptions(): Map<string, EventHandler<E>[]>;
  mockEmitEvent(event: E): void;
}

/**
 * Mock state manager interface for testing
 */
export interface MockStateManager<T> extends StateManager<T>, MockManager {
  getStateHistory(): T[];
  simulateStateChange(state: Partial<T>): void;
}

/**
 * Manager with dependency injection capabilities
 */
export interface DependencyInjectableManager extends BaseManager {
  setDependency<T extends BaseManager>(dependency: T): void;
  getDependency<T extends BaseManager>(type: string): T | undefined;
  removeDependency(type: string): void;
}

/**
 * Create a safe manager getter function to access internal properties
 * This helps avoid "as unknown as" casts when accessing private properties
 */
export function createManagerAccessor<M extends BaseManager, I extends Record<string, unknown>>(
  manager: M
): (property: keyof I) => I[keyof I] | undefined {
  return (property: keyof I) => {
    // Type-safe access to internal properties
    if (property in manager) {
      return (manager as unknown as I)[property];
    }
    return undefined;
  };
}

/**
 * Base DTO interface for data transfer objects
 */
export interface BaseDTO {
  id: string;
  type: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Manager event type mapping interface
 */
export type ManagerEventMap = Record<string, unknown>;

/**
 * Type-safe way to create manager events
 */
export function createManagerEvent<M extends ManagerEventMap, K extends keyof M & string>(
  type: K,
  data: M[K],
  managerId: string
): TypedEvent<K, M[K] & { managerId: string }> {
  return {
    type,
    timestamp: Date.now(),
    data: {
      ...(data as object),
      managerId,
    } as M[K] & { managerId: string },
  };
}

/**
 * Helper to create mock managers for testing
 */
export function createMockManager<M extends BaseManager>(
  partialImplementation: Partial<M>,
  type = 'mockManager',
  id = `mock-${type}-${Math.random().toString(36).substr(2, 9)}`
): M & MockManager {
  const calls: Record<string, unknown[][]> = {};

  // Since we can't use jest in this file, create mock function types
  interface MockFunction {
    mockClear: () => void;
    mockReset: () => void;
    mockImplementation: (fn: (...args: unknown[]) => unknown) => MockFunction;
  }

  // Create mock function
  const createMockFn = (): MockFunction & ((...args: unknown[]) => unknown) => {
    const fn = (...args: unknown[]) => {
      return fn.implementation ? fn.implementation(...args) : undefined;
    };

    // Add mock properties
    fn.implementation = null as unknown as (...args: unknown[]) => unknown;
    fn.mockClear = () => fn;
    fn.mockReset = () => {
      fn.implementation = null as unknown as (...args: unknown[]) => unknown;
      return fn;
    };
    fn.mockImplementation = (implementation: (...args: unknown[]) => unknown) => {
      fn.implementation = implementation;
      return fn as MockFunction;
    };

    return fn as unknown as MockFunction & ((...args: unknown[]) => unknown);
  };

  // Create a mutable state object for internal tracking
  const internalState = {
    isInitialized: false,
  };

  // Build the base mock implementation
  const mockBase: BaseManager & MockManager = {
    id,
    type,
    get isInitialized() {
      return internalState.isInitialized;
    },

    initialize: createMockFn().mockImplementation(() => {
      internalState.isInitialized = true;
      return Promise.resolve();
    }) as unknown as () => Promise<void>,

    dispose: createMockFn().mockImplementation(() => {
      internalState.isInitialized = false;
    }) as unknown as () => void,

    // Mock manager specific methods
    mockClear: () => {
      Object.keys(calls).forEach(key => {
        calls[key] = [];
      });

      // Clear all mocked functions
      Object.values(mockBase)
        .filter(value => typeof value === 'function' && 'mockClear' in value)
        .forEach(mockFn => {
          if (typeof mockFn === 'function' && 'mockClear' in mockFn) {
            (mockFn as unknown as MockFunction).mockClear();
          }
        });
    },

    mockReset: () => {
      mockBase.mockClear();
      internalState.isInitialized = false;

      // Reset all mocked functions
      Object.values(mockBase)
        .filter(value => typeof value === 'function' && 'mockReset' in value)
        .forEach(mockFn => {
          if (typeof mockFn === 'function' && 'mockReset' in mockFn) {
            (mockFn as unknown as MockFunction).mockReset();
          }
        });
    },

    getMockCalls: () => calls,
  };

  // Merge the implementations with proper type safety
  const mockImplementation = Object.assign(mockBase, partialImplementation);

  // Add tracking for methods that aren't mocked yet
  Object.keys(partialImplementation).forEach(key => {
    const value = partialImplementation[key as keyof typeof partialImplementation];
    if (typeof value === 'function' && !('mockImplementation' in value)) {
      calls[key] = [];
      // Use proper function wrapping with tracking
      (mockImplementation as Record<string, unknown>)[key] = (...args: unknown[]) => {
        calls[key].push(args);
        return value.apply(mockImplementation, args);
      };
    }
  });

  // Return with proper type assertion after validation
  return mockImplementation as M & MockManager;
}
