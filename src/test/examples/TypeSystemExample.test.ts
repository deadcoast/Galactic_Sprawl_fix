/**
 * @file TypeSystemExample.test.ts
 * Example tests demonstrating how to use the unified type system for managers
 *
 * This file shows how to use the new types and mocks without resorting to "as unknown as" casts.
 */

import { BaseEvent } from '../../types/events/SharedEventTypes';
import {
  createMockEventManager,
  createMockStateManager,
} from '../../types/managers/MockManagerFactory';
import {
  EventCapableManager,
  MockEventManager,
  MockStateManager,
  StateManager,
} from '../../types/managers/SharedManagerTypes';
import {
  testBaseManagerBehavior,
  testEventManagerBehavior,
  testMockManagerBehavior,
  testStateManagerBehavior,
} from '../utils/BaseManagerTest';

// Example state shape for our manager
interface ExampleState {
  count: number;
  name: string;
  isActive: boolean;
}

// Example event type
interface CountChangedEvent extends BaseEvent {
  type: 'countChanged';
  data: {
    oldCount: number;
    newCount: number;
  };
}

// Extended interface for custom state manager
interface ExampleStateManager extends StateManager<ExampleState> {
  incrementCount(amount?: number): number;
}

// Extended interface for custom event manager
interface ExampleEventManager extends EventCapableManager<BaseEvent> {
  processCountChange(oldCount: number, newCount: number): boolean;
}

describe('Type System Examples', () => {
  describe('Example: Mock State Manager', () => {
    // Create a mock state manager with initial state
    const initialState: ExampleState = {
      count: 0,
      name: 'Initial',
      isActive: false,
    };

    // Create a mock state manager with our extended interface
    const mockStateManager = createMockStateManager<ExampleState>(
      initialState,
      {
        // Additional custom methods for this manager
        incrementCount: jest.fn().mockImplementation(function (
          this: StateManager<ExampleState>,
          amount = 1
        ) {
          const currentState = this.getState();
          this.setState({ count: currentState.count + amount });
          return currentState.count + amount;
        }),
      },
      'exampleStateManager'
    ) as ExampleStateManager & MockStateManager<ExampleState>;

    // Run the standard test suites provided by BaseManagerTest
    testBaseManagerBehavior(mockStateManager);
    testStateManagerBehavior(mockStateManager, initialState);
    testMockManagerBehavior(mockStateManager);

    // Add specific tests for our custom functionality
    it('should increment count correctly', () => {
      // No need for type assertions - types are correctly inferred
      expect(mockStateManager.getState().count).toBe(0);

      // Call our custom method
      const newValue = mockStateManager.incrementCount(5);

      // Check the return value
      expect(newValue).toBe(5);

      // Check the updated state
      expect(mockStateManager.getState().count).toBe(5);
    });

    it('should track custom method calls', () => {
      // Reset mock state
      mockStateManager.mockReset();

      // Call methods
      mockStateManager.incrementCount(1);
      mockStateManager.incrementCount(2);

      // Check call tracking - no need for casting to access mock methods
      const calls = mockStateManager.getMockCalls();
      expect(calls.incrementCount).toBeDefined();
      expect(calls.incrementCount.length).toBe(2);
      expect(calls.incrementCount[0][0]).toBe(1); // First call, first argument
      expect(calls.incrementCount[1][0]).toBe(2); // Second call, first argument
    });
  });

  describe('Example: Mock Event Manager', () => {
    // Create a mock event manager with our extended interface
    const mockEventManager = createMockEventManager<BaseEvent>(
      {
        // Additional methods specific to this manager
        processCountChange: jest.fn().mockImplementation(function (
          this: EventCapableManager<BaseEvent>,
          oldCount: number,
          newCount: number
        ) {
          const event: CountChangedEvent = {
            type: 'countChanged',
            timestamp: Date.now(),
            data: {
              oldCount,
              newCount,
            },
          };

          this.emitEvent(event);
          return true;
        }),
      },
      'exampleEventManager'
    ) as ExampleEventManager & MockEventManager<BaseEvent>;

    // Run the standard test suites
    testBaseManagerBehavior(mockEventManager);
    testEventManagerBehavior(mockEventManager);
    testMockManagerBehavior(mockEventManager);

    // Add specific tests for event handling
    it('should emit count changed events', () => {
      // Reset emitted events
      mockEventManager.mockReset();

      // Set up event listener
      let receivedEvent: CountChangedEvent | null = null;
      mockEventManager.subscribeToEvent('countChanged', (event: BaseEvent) => {
        if (event.type === 'countChanged') {
          // Type assertion only needed here because we're narrowing the generic BaseEvent
          // to our specific CountChangedEvent type - but we've checked the type first
          receivedEvent = event as CountChangedEvent;
        }
      });

      // Trigger event emission
      mockEventManager.processCountChange(5, 10);

      // Check emitted events
      const emittedEvents = mockEventManager.getEmittedEvents();
      expect(emittedEvents.length).toBe(1);
      expect(emittedEvents[0].type).toBe('countChanged');

      // Check that our listener received the event
      expect(receivedEvent).not.toBeNull();
      if (receivedEvent && receivedEvent.data) {
        expect(receivedEvent.data.oldCount).toBe(5);
        expect(receivedEvent.data.newCount).toBe(10);
      }
    });
  });
});
