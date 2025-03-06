import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestModuleEvents, ModuleEvent } from './createTestModuleEvents';

describe('createTestModuleEvents', () => {
  let testModuleEvents: ReturnType<typeof createTestModuleEvents>;

  beforeEach(() => {
    testModuleEvents = createTestModuleEvents();
  });

  describe('moduleEventBus', () => {
    it('should emit and track events', () => {
      // Arrange
      const event: ModuleEvent = {
        type: 'MODULE_CREATED',
        moduleId: 'test-module',
        moduleType: 'mineral',
        timestamp: Date.now(),
        data: { location: { x: 100, y: 200 } },
      };

      // Act
      testModuleEvents.moduleEventBus.emit(event);

      // Assert
      const events = testModuleEvents.getEmittedEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('MODULE_CREATED');
      expect(events[0].moduleId).toBe('test-module');
      expect(events[0].data).toEqual({ location: { x: 100, y: 200 } });
    });

    it('should notify subscribers when events are emitted', () => {
      // Arrange
      const listener = vi.fn();
      const unsubscribe = testModuleEvents.moduleEventBus.subscribe('MODULE_CREATED', listener);

      const event: ModuleEvent = {
        type: 'MODULE_CREATED',
        moduleId: 'test-module',
        moduleType: 'mineral',
        timestamp: Date.now(),
      };

      // Act
      testModuleEvents.moduleEventBus.emit(event);

      // Assert
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MODULE_CREATED',
          moduleId: 'test-module',
        })
      );

      // Act again - unsubscribe
      unsubscribe();
      testModuleEvents.moduleEventBus.emit(event);

      // Assert - should not be called again
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should filter events by type', () => {
      // Arrange
      const createEvent: ModuleEvent = {
        type: 'MODULE_CREATED',
        moduleId: 'test-module',
        moduleType: 'mineral',
        timestamp: Date.now(),
      };

      const activateEvent: ModuleEvent = {
        type: 'MODULE_ACTIVATED',
        moduleId: 'test-module',
        moduleType: 'mineral',
        timestamp: Date.now(),
      };

      // Act
      testModuleEvents.moduleEventBus.emit(createEvent);
      testModuleEvents.moduleEventBus.emit(activateEvent);

      // Assert
      const createdEvents = testModuleEvents.getEmittedEvents('MODULE_CREATED');
      expect(createdEvents.length).toBe(1);
      expect(createdEvents[0].type).toBe('MODULE_CREATED');

      const activatedEvents = testModuleEvents.getEmittedEvents('MODULE_ACTIVATED');
      expect(activatedEvents.length).toBe(1);
      expect(activatedEvents[0].type).toBe('MODULE_ACTIVATED');
    });

    it('should filter events by module ID', () => {
      // Arrange
      const event1: ModuleEvent = {
        type: 'MODULE_CREATED',
        moduleId: 'module-1',
        moduleType: 'mineral',
        timestamp: Date.now(),
      };

      const event2: ModuleEvent = {
        type: 'MODULE_CREATED',
        moduleId: 'module-2',
        moduleType: 'resource-manager',
        timestamp: Date.now(),
      };

      // Act
      testModuleEvents.moduleEventBus.emit(event1);
      testModuleEvents.moduleEventBus.emit(event2);

      // Assert
      const module1Events = testModuleEvents.moduleEventBus.getModuleHistory('module-1');
      expect(module1Events.length).toBe(1);
      expect(module1Events[0].moduleId).toBe('module-1');

      const module2Events = testModuleEvents.moduleEventBus.getModuleHistory('module-2');
      expect(module2Events.length).toBe(1);
      expect(module2Events[0].moduleId).toBe('module-2');
    });

    it('should clear history when requested', () => {
      // Arrange
      const event: ModuleEvent = {
        type: 'MODULE_CREATED',
        moduleId: 'test-module',
        moduleType: 'mineral',
        timestamp: Date.now(),
      };

      // Act
      testModuleEvents.moduleEventBus.emit(event);
      expect(testModuleEvents.getEmittedEvents().length).toBe(1);

      // Clear history
      testModuleEvents.moduleEventBus.clearHistory();

      // Assert
      expect(testModuleEvents.getEmittedEvents().length).toBe(0);
    });
  });

  describe('helper methods', () => {
    it('should track event listener counts', () => {
      // Arrange
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      // Act - subscribe
      testModuleEvents.moduleEventBus.subscribe('MODULE_CREATED', listener1);
      testModuleEvents.moduleEventBus.subscribe('MODULE_CREATED', listener2);
      testModuleEvents.moduleEventBus.subscribe('MODULE_ACTIVATED', listener3);

      // Assert
      expect(testModuleEvents.getEventListenerCount()).toBe(3);
      expect(testModuleEvents.getEventListenerCount('MODULE_CREATED')).toBe(2);
      expect(testModuleEvents.getEventListenerCount('MODULE_ACTIVATED')).toBe(1);
      expect(testModuleEvents.getEventListenerCount('MODULE_UPDATED')).toBe(0);
    });

    it('should clear all events and listeners', () => {
      // Arrange
      const listener = vi.fn();
      testModuleEvents.moduleEventBus.subscribe('MODULE_CREATED', listener);

      const event: ModuleEvent = {
        type: 'MODULE_CREATED',
        moduleId: 'test-module',
        moduleType: 'mineral',
        timestamp: Date.now(),
      };

      testModuleEvents.moduleEventBus.emit(event);

      // Verify initial setup
      expect(listener).toHaveBeenCalledTimes(1);
      expect(testModuleEvents.getEmittedEvents().length).toBe(1);
      expect(testModuleEvents.getEventListenerCount()).toBe(1);

      // Act
      testModuleEvents.clearEvents();

      // Assert
      expect(testModuleEvents.getEmittedEvents().length).toBe(0);
      expect(testModuleEvents.getEventListenerCount()).toBe(0);

      // Reset the listener mock
      listener.mockReset();

      // Emit another event - listener should be gone
      testModuleEvents.moduleEventBus.emit(event);
      expect(listener).not.toHaveBeenCalled();

      // Also verify by subscriber count
      expect(testModuleEvents.getEventListenerCount()).toBe(0);
    });
  });

  describe('ModuleEventType values', () => {
    it('should export event type constants', () => {
      // Assert
      expect(testModuleEvents.ModuleEventType.MODULE_CREATED).toBe('MODULE_CREATED');
      expect(testModuleEvents.ModuleEventType.RESOURCE_PRODUCED).toBe('RESOURCE_PRODUCED');
      expect(testModuleEvents.ModuleEventType.MISSION_COMPLETED).toBe('MISSION_COMPLETED');

      // Use the constants in an event
      const event: ModuleEvent = {
        type: testModuleEvents.ModuleEventType.MODULE_CREATED,
        moduleId: 'test-module',
        moduleType: 'mineral',
        timestamp: Date.now(),
      };

      testModuleEvents.moduleEventBus.emit(event);
      const events = testModuleEvents.getEmittedEvents();
      expect(events[0].type).toBe('MODULE_CREATED');
    });
  });

  describe('error handling', () => {
    it('should continue processing events if a listener throws an error', () => {
      // Arrange
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const normalListener = vi.fn();

      // Spy on console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Subscribe both listeners
      testModuleEvents.moduleEventBus.subscribe('MODULE_CREATED', errorListener);
      testModuleEvents.moduleEventBus.subscribe('MODULE_CREATED', normalListener);

      // Act
      const event: ModuleEvent = {
        type: 'MODULE_CREATED',
        moduleId: 'test-module',
        moduleType: 'mineral',
        timestamp: Date.now(),
      };

      testModuleEvents.moduleEventBus.emit(event);

      // Assert
      expect(errorListener).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled(); // Should still be called despite the error
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});
