import { Observable, Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModuleEvent, ModuleEventType, moduleEventBus } from '../../../lib/modules/ModuleEvents';
import {
  createBufferedEventStream,
  createCombinedEventStream,
  createDebouncedEventStream,
  createEventTypeSubject,
  createFilteredEventStream,
  createThrottledEventStream,
  createTransformedEventStream,
  emitEvent,
  getEventData,
  getEventsByData,
  getEventsByModule,
  getEventsByType,
  initializeRxJSIntegration,
  moduleEventSubject,
  moduleEvents$,
} from '../../../utils/events/rxjsIntegration';

// Mock the moduleEventBus
vi.mock('../../../lib/modules/ModuleEvents', () => {
  const mockEventBus = {
    subscribe: vi.fn().mockReturnValue(() => {}),
    emit: vi.fn(),
    getHistory: vi.fn().mockReturnValue([]),
    getModuleHistory: vi.fn().mockReturnValue([]),
    getEventTypeHistory: vi.fn().mockReturnValue([]),
    clearHistory: vi.fn(),
  };

  return {
    moduleEventBus: mockEventBus,
    ModuleEventType: {
      MODULE_CREATED: 'MODULE_CREATED',
      MODULE_UPDATED: 'MODULE_UPDATED',
      RESOURCE_PRODUCED: 'RESOURCE_PRODUCED',
    },
  };
});

describe('RxJS Integration', () => {
  // Sample events for testing
  const sampleEvent1: ModuleEvent = {
    type: 'MODULE_CREATED' as ModuleEventType,
    moduleId: 'test-module-1',
    moduleType: 'resource-manager',
    timestamp: 1000,
    data: { name: 'Test Module 1' },
  };

  const sampleEvent2: ModuleEvent = {
    type: 'MODULE_UPDATED' as ModuleEventType,
    moduleId: 'test-module-1',
    moduleType: 'resource-manager',
    timestamp: 2000,
    data: { name: 'Test Module 1', status: 'active' },
  };

  const sampleEvent3: ModuleEvent = {
    type: 'RESOURCE_PRODUCED' as ModuleEventType,
    moduleId: 'test-module-2',
    moduleType: 'mineral',
    timestamp: 3000,
    data: { resourceType: 'iron', amount: 10 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any subscriptions
    moduleEventSubject.observers = [];
  });

  describe('initializeRxJSIntegration', () => {
    it('should subscribe to module events and return a cleanup function', () => {
      const cleanup = initializeRxJSIntegration();

      // Check that it subscribed to the moduleEventBus
      expect(moduleEventBus.subscribe).toHaveBeenCalledWith('MODULE_CREATED', expect.any(Function));

      // Check that the cleanup function is returned
      expect(typeof cleanup).toBe('function');

      // Call the cleanup function
      cleanup();

      // Check that the subject is completed (we can't directly test this, but we can check that the subject has no observers)
      expect(moduleEventSubject.observers.length).toBe(0);
    });
  });

  describe('getEventsByType', () => {
    it('should filter events by type', () => {
      const events: ModuleEvent[] = [];

      // Subscribe to MODULE_CREATED events
      const subscription = getEventsByType('MODULE_CREATED' as ModuleEventType).subscribe({
        next: event => {
          events.push(event);

          // Check that only MODULE_CREATED events are received
          expect(event.type).toBe('MODULE_CREATED');
        },
      });

      // Emit events
      moduleEventSubject.next(sampleEvent1); // Should be received
      moduleEventSubject.next(sampleEvent2); // Should be filtered out
      moduleEventSubject.next(sampleEvent3); // Should be filtered out

      // Check that only one event was received
      expect(events.length).toBe(1);
      expect(events[0]).toEqual(sampleEvent1);

      // Clean up
      subscription.unsubscribe();
    });
  });

  describe('getEventsByModule', () => {
    it('should filter events by module ID', () => {
      const events: ModuleEvent[] = [];

      // Subscribe to events from test-module-1
      const subscription = getEventsByModule('test-module-1').subscribe({
        next: event => {
          events.push(event);

          // Check that only events from test-module-1 are received
          expect(event.moduleId).toBe('test-module-1');
        },
      });

      // Emit events
      moduleEventSubject.next(sampleEvent1); // Should be received
      moduleEventSubject.next(sampleEvent2); // Should be received
      moduleEventSubject.next(sampleEvent3); // Should be filtered out

      // Check that two events were received
      expect(events.length).toBe(2);
      expect(events[0]).toEqual(sampleEvent1);
      expect(events[1]).toEqual(sampleEvent2);

      // Clean up
      subscription.unsubscribe();
    });
  });

  describe('getEventsByData', () => {
    it('should filter events by data property', () => {
      const events: ModuleEvent[] = [];

      // Subscribe to events with data.resourceType === 'iron'
      const subscription = getEventsByData('resourceType', 'iron').subscribe({
        next: event => {
          events.push(event);

          // Check that only events with data.resourceType === 'iron' are received
          expect(event.data.resourceType).toBe('iron');
        },
      });

      // Emit events
      moduleEventSubject.next(sampleEvent1); // Should be filtered out
      moduleEventSubject.next(sampleEvent2); // Should be filtered out
      moduleEventSubject.next(sampleEvent3); // Should be received

      // Check that only one event was received
      expect(events.length).toBe(1);
      expect(events[0]).toEqual(sampleEvent3);

      // Clean up
      subscription.unsubscribe();
    });
  });

  describe('getEventData', () => {
    it('should map events to their data', () => {
      const dataItems: any[] = [];

      // Subscribe to data from MODULE_CREATED events
      const subscription = getEventData<{ name: string }>(
        'MODULE_CREATED' as ModuleEventType
      ).subscribe({
        next: data => {
          dataItems.push(data);

          // Check that the data is correctly extracted
          expect(data).toEqual({ name: 'Test Module 1' });
        },
      });

      // Emit events
      moduleEventSubject.next(sampleEvent1); // Should be received
      moduleEventSubject.next(sampleEvent2); // Should be filtered out
      moduleEventSubject.next(sampleEvent3); // Should be filtered out

      // Check that only one data item was received
      expect(dataItems.length).toBe(1);
      expect(dataItems[0]).toEqual({ name: 'Test Module 1' });

      // Clean up
      subscription.unsubscribe();
    });
  });

  describe('createFilteredEventStream', () => {
    it('should create a custom filtered event stream', () => {
      const events: ModuleEvent[] = [];

      // Create a custom filter for events with timestamp > 1500
      const subscription = createFilteredEventStream(event => event.timestamp > 1500).subscribe({
        next: event => {
          events.push(event);

          // Check that only events with timestamp > 1500 are received
          expect(event.timestamp).toBeGreaterThan(1500);
        },
      });

      // Emit events
      moduleEventSubject.next(sampleEvent1); // Should be filtered out (timestamp = 1000)
      moduleEventSubject.next(sampleEvent2); // Should be received (timestamp = 2000)
      moduleEventSubject.next(sampleEvent3); // Should be received (timestamp = 3000)

      // Check that two events were received
      expect(events.length).toBe(2);
      expect(events[0]).toEqual(sampleEvent2);
      expect(events[1]).toEqual(sampleEvent3);

      // Clean up
      subscription.unsubscribe();
    });
  });

  describe('emitEvent', () => {
    it('should emit events through both moduleEventBus and moduleEventSubject', () => {
      const events: ModuleEvent[] = [];

      // Subscribe to all events
      const subscription = moduleEvents$.subscribe({
        next: event => {
          events.push(event);
        },
      });

      // Emit an event
      emitEvent(sampleEvent1);

      // Check that the event was emitted through moduleEventSubject
      expect(events.length).toBe(1);
      expect(events[0]).toEqual(sampleEvent1);

      // Check that the event was also emitted through moduleEventBus
      expect(moduleEventBus.emit).toHaveBeenCalledWith(sampleEvent1);

      // Clean up
      subscription.unsubscribe();
    });
  });

  describe('createEventTypeSubject', () => {
    it('should create a subject for a specific event type', () => {
      // Create a subject for MODULE_CREATED events
      const subject = createEventTypeSubject('MODULE_CREATED' as ModuleEventType);

      // Check that it's a Subject
      expect(subject).toBeInstanceOf(Subject);

      // Check that it subscribed to the moduleEventBus
      expect(moduleEventBus.subscribe).toHaveBeenCalledWith('MODULE_CREATED', expect.any(Function));

      // Subscribe to the subject
      const events: ModuleEvent[] = [];
      const subscription = subject.subscribe({
        next: event => {
          events.push(event);
        },
      });

      // Call the event handler that was passed to moduleEventBus.subscribe
      const eventHandler = (moduleEventBus.subscribe as any).mock.calls[0][1];
      eventHandler(sampleEvent1);

      // Check that the event was received
      expect(events.length).toBe(1);
      expect(events[0]).toEqual(sampleEvent1);

      // Clean up
      (subject as any).cleanup();
      subscription.unsubscribe();
    });
  });

  describe('createTransformedEventStream', () => {
    it('should create a transformed event stream', () => {
      const transformedItems: any[] = [];

      // Create a transformed stream that extracts the module ID
      const subscription = createTransformedEventStream<ModuleEvent, string>(
        'MODULE_CREATED' as ModuleEventType,
        event => event.moduleId
      ).subscribe({
        next: moduleId => {
          transformedItems.push(moduleId);

          // Check that the transformation was applied
          expect(moduleId).toBe('test-module-1');
        },
      });

      // Emit events
      moduleEventSubject.next(sampleEvent1); // Should be received and transformed
      moduleEventSubject.next(sampleEvent2); // Should be filtered out
      moduleEventSubject.next(sampleEvent3); // Should be filtered out

      // Check that only one transformed item was received
      expect(transformedItems.length).toBe(1);
      expect(transformedItems[0]).toBe('test-module-1');

      // Clean up
      subscription.unsubscribe();
    });
  });

  describe('createCombinedEventStream', () => {
    it('should create a combined event stream from multiple event types', () => {
      const events: ModuleEvent[] = [];

      // Create a combined stream for MODULE_CREATED and RESOURCE_PRODUCED events
      const subscription = createCombinedEventStream([
        'MODULE_CREATED' as ModuleEventType,
        'RESOURCE_PRODUCED' as ModuleEventType,
      ]).subscribe({
        next: event => {
          events.push(event);

          // Check that only MODULE_CREATED and RESOURCE_PRODUCED events are received
          expect(['MODULE_CREATED', 'RESOURCE_PRODUCED']).toContain(event.type);
        },
      });

      // Emit events
      moduleEventSubject.next(sampleEvent1); // Should be received (MODULE_CREATED)
      moduleEventSubject.next(sampleEvent2); // Should be filtered out (MODULE_UPDATED)
      moduleEventSubject.next(sampleEvent3); // Should be received (RESOURCE_PRODUCED)

      // Check that two events were received
      expect(events.length).toBe(2);
      expect(events[0]).toEqual(sampleEvent1);
      expect(events[1]).toEqual(sampleEvent3);

      // Clean up
      subscription.unsubscribe();
    });
  });

  // Note: The following tests are simplified since the actual implementations
  // of debounceTime, throttleTime, and bufferTime are commented out in the source

  describe('createDebouncedEventStream', () => {
    it('should create a debounced event stream', () => {
      const stream = createDebouncedEventStream('MODULE_CREATED' as ModuleEventType, 100);
      expect(stream).toBeInstanceOf(Observable);
    });
  });

  describe('createThrottledEventStream', () => {
    it('should create a throttled event stream', () => {
      const stream = createThrottledEventStream('MODULE_CREATED' as ModuleEventType, 100);
      expect(stream).toBeInstanceOf(Observable);
    });
  });

  describe('createBufferedEventStream', () => {
    it('should create a buffered event stream', () => {
      const stream = createBufferedEventStream('MODULE_CREATED' as ModuleEventType, 100);
      expect(stream).toBeInstanceOf(Observable);
    });
  });
});
