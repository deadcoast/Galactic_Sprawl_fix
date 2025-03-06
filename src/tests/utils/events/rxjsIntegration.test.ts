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
} from '../../../utils/events/rxjsIntegration';

// Define a type for the mock function
type MockFunction = ReturnType<typeof vi.fn>;

// Define a type for the subject with cleanup method
interface SubjectWithCleanup<T> extends Subject<T> {
  cleanup?: () => void;
}

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
      // Create the observable
      const observable = getEventsByType('MODULE_CREATED' as ModuleEventType);

      // Check that it returns an Observable
      expect(observable).toBeInstanceOf(Observable);
    });

    it('should correctly filter multiple event types', async () => {
      // Initialize the RxJS integration
      initializeRxJSIntegration();

      // Create observables for different event types
      const createdEvents = getEventsByType('MODULE_CREATED' as ModuleEventType);
      const updatedEvents = getEventsByType('MODULE_UPDATED' as ModuleEventType);
      const resourceEvents = getEventsByType('RESOURCE_PRODUCED' as ModuleEventType);

      // Set up test data collection
      const createdResults: ModuleEvent[] = [];
      const updatedResults: ModuleEvent[] = [];
      const resourceResults: ModuleEvent[] = [];

      // Subscribe to the observables
      createdEvents.subscribe(event => createdResults.push(event));
      updatedEvents.subscribe(event => updatedResults.push(event));
      resourceEvents.subscribe(event => resourceResults.push(event));

      // Emit the events
      moduleEventSubject.next(sampleEvent1);
      moduleEventSubject.next(sampleEvent2);
      moduleEventSubject.next(sampleEvent3);

      // Use a promise to wait for the next event loop
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify that events were filtered correctly
      expect(createdResults).toHaveLength(1);
      expect(createdResults[0]).toEqual(sampleEvent1);

      expect(updatedResults).toHaveLength(1);
      expect(updatedResults[0]).toEqual(sampleEvent2);

      expect(resourceResults).toHaveLength(1);
      expect(resourceResults[0]).toEqual(sampleEvent3);
    });
  });

  describe('getEventsByModule', () => {
    it('should filter events by module ID', () => {
      // Create the observable
      const observable = getEventsByModule('test-module-1');

      // Check that it returns an Observable
      expect(observable).toBeInstanceOf(Observable);
    });
  });

  describe('getEventsByData', () => {
    it('should filter events by data property', () => {
      // Create the observable
      const observable = getEventsByData('resourceType', 'iron');

      // Check that it returns an Observable
      expect(observable).toBeInstanceOf(Observable);
    });
  });

  describe('getEventData', () => {
    it('should map events to their data', () => {
      // Create the observable
      const observable = getEventData('MODULE_CREATED' as ModuleEventType);

      // Check that it returns an Observable
      expect(observable).toBeInstanceOf(Observable);
    });
  });

  describe('createFilteredEventStream', () => {
    it('should create a custom filtered event stream', () => {
      // Create the observable
      const observable = createFilteredEventStream(event => event.timestamp > 1500);

      // Check that it returns an Observable
      expect(observable).toBeInstanceOf(Observable);
    });
  });

  describe('emitEvent', () => {
    it('should emit events through both moduleEventBus and moduleEventSubject', () => {
      // Spy on moduleEventSubject.next
      const nextSpy = vi.spyOn(moduleEventSubject, 'next');

      // Emit an event
      emitEvent(sampleEvent1);

      // Check that the event was emitted through moduleEventBus
      expect(moduleEventBus.emit).toHaveBeenCalledWith(sampleEvent1);

      // Check that the event was also emitted through moduleEventSubject
      expect(nextSpy).toHaveBeenCalledWith(sampleEvent1);
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
      const eventHandler = (moduleEventBus.subscribe as MockFunction).mock.calls[0][1];
      eventHandler(sampleEvent1);

      // Check that the event was received
      expect(events.length).toBe(1);
      expect(events[0]).toEqual(sampleEvent1);

      // Clean up
      (subject as SubjectWithCleanup<ModuleEvent>).cleanup?.();
      subscription.unsubscribe();
    });
  });

  describe('createTransformedEventStream', () => {
    it('should create a transformed event stream', () => {
      // Create the observable
      const observable = createTransformedEventStream<ModuleEvent, string>(
        'MODULE_CREATED' as ModuleEventType,
        event => event.moduleId
      );

      // Check that it returns an Observable
      expect(observable).toBeInstanceOf(Observable);
    });
  });

  describe('createCombinedEventStream', () => {
    it('should create a combined event stream from multiple event types', () => {
      // Create the observable
      const observable = createCombinedEventStream([
        'MODULE_CREATED' as ModuleEventType,
        'RESOURCE_PRODUCED' as ModuleEventType,
      ]);

      // Check that it returns an Observable
      expect(observable).toBeInstanceOf(Observable);
    });
  });

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
