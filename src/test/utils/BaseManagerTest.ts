/**
 * @file BaseManagerTest.ts
 * Base testing utility for managers that provides consistent testing patterns
 *
 * This file provides utility functions to test managers consistently,
 * reducing duplication and ensuring all managers follow the same contract.
 */

import { BaseEvent } from '../../types/events/SharedEventTypes';
import {
  BaseManager,
  EventCapableManager,
  MockManager,
  StateManager,
} from '../../types/managers/SharedManagerTypes';

/**
 * Tests common behavior expected from all managers
 * @param manager Manager instance to test
 * @param options Test options
 */
export function testBaseManagerBehavior<M extends BaseManager>(
  manager: M,
  options?: {
    initiallyInitialized?: boolean;
    skipDispose?: boolean;
  }
) {
  const { initiallyInitialized = false, skipDispose = false } = options || {};

  describe(`BaseManager: ${manager.type}`, () => {
    it('should have a valid ID', () => {
      expect(manager.id).toBeDefined();
      expect(typeof manager.id).toBe('string');
      expect(manager.id.length).toBeGreaterThan(0);
    });

    it('should have a valid type', () => {
      expect(manager.type).toBeDefined();
      expect(typeof manager.type).toBe('string');
      expect(manager.type.length).toBeGreaterThan(0);
    });

    it(`should ${initiallyInitialized ? 'already be' : 'not be'} initialized initially`, () => {
      expect(manager.isInitialized).toBe(initiallyInitialized);
    });

    if (!initiallyInitialized) {
      it('should initialize successfully', async () => {
        const result = await manager.initialize();
        expect(manager.isInitialized).toBe(true);
        return result; // Return for additional assertions if needed
      });
    }

    if (!skipDispose) {
      it('should dispose successfully', () => {
        manager.dispose();
        expect(manager.isInitialized).toBe(false);
      });
    }
  });
}

/**
 * Tests behavior expected from event-capable managers
 * @param manager Event manager instance to test
 */
export function testEventManagerBehavior<E extends BaseEvent, M extends EventCapableManager<E>>(
  manager: M
) {
  describe(`EventCapableManager: ${manager.type}`, () => {
    const testEventType = 'test-event';
    let eventReceived = false;

    beforeEach(() => {
      eventReceived = false;
    });

    it('should provide access to event bus', () => {
      const eventBus = manager.getEventBus();
      expect(eventBus).toBeDefined();
      expect(typeof eventBus.emit).toBe('function');
      expect(typeof eventBus.on).toBe('function');
      expect(typeof eventBus.off).toBe('function');
    });

    it('should allow event subscription and receive events', () => {
      const handler = () => {
        eventReceived = true;
      };
      const unsubscribe = manager.subscribeToEvent(testEventType, handler);

      expect(typeof unsubscribe).toBe('function');

      manager.emitEvent({
        type: testEventType,
        timestamp: Date.now(),
      } as E);

      expect(eventReceived).toBe(true);
    });

    it('should allow event unsubscription', () => {
      const handler = () => {
        eventReceived = true;
      };
      manager.subscribeToEvent(testEventType, handler);

      // Unsubscribe using the dedicated method
      manager.unsubscribeFromEvent(testEventType, handler);

      manager.emitEvent({
        type: testEventType,
        timestamp: Date.now(),
      } as E);

      expect(eventReceived).toBe(false);
    });

    it('should unsubscribe using the returned function', () => {
      const handler = () => {
        eventReceived = true;
      };
      const unsubscribe = manager.subscribeToEvent(testEventType, handler);

      // Unsubscribe using the returned function
      unsubscribe();

      manager.emitEvent({
        type: testEventType,
        timestamp: Date.now(),
      } as E);

      expect(eventReceived).toBe(false);
    });
  });
}

/**
 * Tests behavior expected from state managers
 * @param manager State manager instance to test
 * @param initialState Initial expected state
 */
export function testStateManagerBehavior<T extends object, M extends StateManager<T>>(
  manager: M,
  initialState: T
) {
  describe(`StateManager: ${manager.type}`, () => {
    beforeEach(() => {
      // Reset to initial state before each test
      manager.resetState();
    });

    it('should provide the initial state', () => {
      expect(manager.getState()).toEqual(initialState);
    });

    it('should update state partially', () => {
      // Create a partial state update - this is a simplified approach
      // You may need to adapt this based on your state structure
      const stateKeys = Object.keys(initialState);
      if (stateKeys.length === 0) {
        // Skip test if state has no properties
        return;
      }

      const firstKey = stateKeys[0];
      const partialState: Partial<T> = {
        [firstKey]: 'updated value',
      } as unknown as Partial<T>;

      manager.setState(partialState);

      const updatedState = manager.getState();
      expect(updatedState).not.toEqual(initialState);
      expect(updatedState[firstKey as keyof T]).toEqual('updated value');
    });

    it('should reset state to initial values', () => {
      // First make a change
      const stateKeys = Object.keys(initialState);
      if (stateKeys.length === 0) {
        // Skip test if state has no properties
        return;
      }

      const firstKey = stateKeys[0];
      const partialState: Partial<T> = {
        [firstKey]: 'updated value',
      } as unknown as Partial<T>;

      manager.setState(partialState);

      // Then reset
      manager.resetState();

      // Verify reset worked
      expect(manager.getState()).toEqual(initialState);
    });
  });
}

/**
 * Tests mock capabilities for mock managers
 * @param manager Mock manager instance to test
 */
export function testMockManagerBehavior<M extends MockManager>(manager: M) {
  describe(`MockManager: ${manager.type}`, () => {
    it('should track method calls', () => {
      // Call some methods
      manager.initialize();
      manager.dispose();

      // Check if calls were tracked
      const calls = manager.getMockCalls();
      expect(calls).toBeDefined();

      // This assumes initialize and dispose are being tracked
      // If you have specific methods to test, use those instead
      expect(Object.keys(calls).length).toBeGreaterThan(0);
    });

    it('should clear tracked calls', () => {
      // Call some methods
      manager.initialize();

      // Clear tracked calls
      manager.mockClear();

      // Check if calls were cleared
      const calls = manager.getMockCalls();
      expect(Object.values(calls).every(methodCalls => methodCalls.length === 0)).toBe(true);
    });

    it('should reset mock state', () => {
      // Initialize the manager
      manager.initialize();
      expect(manager.isInitialized).toBe(true);

      // Reset the mock
      manager.mockReset();

      // Check if state was reset
      expect(manager.isInitialized).toBe(false);
    });
  });
}
