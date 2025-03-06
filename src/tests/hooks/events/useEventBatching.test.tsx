import { act, renderHook } from '@testing-library/react';
import { Observable } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useEventBatching,
  useEventDebouncing,
  useEventThrottling,
} from '../../../hooks/events/useEventBatching';
import { ModuleEventType } from '../../../lib/modules/ModuleEvents';
import * as EventBatcher from '../../../utils/events/EventBatcher';
import { EventBatch } from '../../../utils/events/EventBatcher';

// Define the type for our mock observable
interface MockObservable<T> {
  subscribe: (callback: (value: T) => void) => { unsubscribe: () => void };
  next: (value: T) => void;
  unsubscribeMock: ReturnType<typeof vi.fn>;
}

// Create a mock observable with a subscribe method
const createMockObservable = <T,>(): MockObservable<T> => {
  const callbacks: Array<(data: T) => void> = [];
  const unsubscribeMock = vi.fn();

  return {
    subscribe: vi.fn(callback => {
      callbacks.push(callback);
      return { unsubscribe: unsubscribeMock };
    }),
    next: (data: T) => {
      callbacks.forEach(callback => callback(data));
    },
    unsubscribeMock,
  };
};

describe('useEventBatching', () => {
  const eventTypes = ['MODULE_CREATED', 'MODULE_ATTACHED'] as ModuleEventType[];
  let mockObservable: MockObservable<EventBatch>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockObservable = createMockObservable<EventBatch>();

    // Mock the EventBatcher functions
    vi.spyOn(EventBatcher, 'createBatchedEventStream').mockReturnValue(
      mockObservable as unknown as Observable<EventBatch>
    );
    vi.spyOn(EventBatcher, 'getBatchConfig').mockReturnValue({
      timeWindow: 100,
      maxBatchSize: 100,
      emitEmptyBatches: false,
    });
    vi.spyOn(EventBatcher, 'updateBatchConfig').mockImplementation(() => {});
  });

  it('should initialize with default configuration', () => {
    const { result } = renderHook(() => useEventBatching(eventTypes));

    expect(result.current.batch).toBeNull();
    expect(result.current.batchConfig).toBeDefined();
    expect(result.current.batchConfig.timeWindow).toBe(100);
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.hasEvents).toBe(false);
    expect(result.current.eventCount).toBe(0);
    expect(result.current.events).toHaveLength(0);

    // Verify that createBatchedEventStream was called
    expect(EventBatcher.createBatchedEventStream).toHaveBeenCalledWith(eventTypes, undefined);
    // Verify that subscribe was called
    expect(mockObservable.subscribe).toHaveBeenCalled();
  });

  it('should update batch configuration', () => {
    const { result } = renderHook(() => useEventBatching(eventTypes));

    act(() => {
      result.current.updateConfig({ timeWindow: 200 });
    });

    expect(EventBatcher.updateBatchConfig).toHaveBeenCalledWith(eventTypes, { timeWindow: 200 });
  });

  it('should clear batch', () => {
    const { result } = renderHook(() => useEventBatching(eventTypes));

    // Simulate receiving a batch
    const mockBatch = {
      events: [
        {
          type: 'MODULE_CREATED' as ModuleEventType,
          moduleId: 'module-1',
          moduleType: 'resource-manager',
          timestamp: Date.now(),
        },
      ],
      timestamp: Date.now(),
      size: 1,
      timeWindow: 100,
      eventTypes: new Set(['MODULE_CREATED'] as ModuleEventType[]),
      moduleIds: new Set(['module-1']),
    } as EventBatch;

    // Send the batch through the mock observable
    act(() => {
      mockObservable.next(mockBatch);
    });

    // Verify the batch was set
    expect(result.current.batch).toBe(mockBatch);

    // Clear the batch
    act(() => {
      result.current.clearBatch();
    });

    expect(result.current.batch).toBeNull();
  });

  it('should create a batched event stream with custom configuration', () => {
    const config = { timeWindow: 200 };
    renderHook(() => useEventBatching(eventTypes, config));

    expect(EventBatcher.createBatchedEventStream).toHaveBeenCalledWith(eventTypes, config);
  });

  it('should unsubscribe when unmounted', () => {
    const { unmount } = renderHook(() => useEventBatching(eventTypes));

    unmount();

    expect(mockObservable.unsubscribeMock).toHaveBeenCalled();
  });
});

describe('useEventDebouncing', () => {
  const eventTypes = ['MODULE_CREATED', 'MODULE_ATTACHED'] as ModuleEventType[];
  let mockObservable: MockObservable<EventBatch>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockObservable = createMockObservable<EventBatch>();

    // Mock the EventBatcher functions
    vi.spyOn(EventBatcher, 'createBatchedEventStream').mockReturnValue(
      mockObservable as unknown as Observable<EventBatch>
    );
  });

  it('should initialize with null event', () => {
    const { result } = renderHook(() => useEventDebouncing(eventTypes));

    expect(result.current.event).toBeNull();
    expect(result.current.hasEvent).toBe(false);
    expect(result.current.eventType).toBeNull();
    expect(result.current.moduleId).toBeNull();

    // Verify that createBatchedEventStream was called
    expect(EventBatcher.createBatchedEventStream).toHaveBeenCalledWith(eventTypes, {
      timeWindow: 300,
      emitEmptyBatches: false,
    });
    // Verify that subscribe was called
    expect(mockObservable.subscribe).toHaveBeenCalled();
  });

  it('should update event when batch is received', () => {
    const { result } = renderHook(() => useEventDebouncing(eventTypes));

    // Create a mock batch
    const mockBatch = {
      events: [
        {
          type: 'MODULE_CREATED' as ModuleEventType,
          moduleId: 'module-1',
          moduleType: 'resource-manager',
          timestamp: Date.now(),
        },
        {
          type: 'MODULE_ATTACHED' as ModuleEventType,
          moduleId: 'module-2',
          moduleType: 'resource-manager',
          timestamp: Date.now(),
        },
      ],
      timestamp: Date.now(),
      size: 2,
      timeWindow: 100,
      eventTypes: new Set(['MODULE_CREATED', 'MODULE_ATTACHED'] as ModuleEventType[]),
      moduleIds: new Set(['module-1', 'module-2']),
    } as EventBatch;

    // Send the batch through the mock observable
    act(() => {
      mockObservable.next(mockBatch);
    });

    // Verify the event was set to the last event in the batch
    expect(result.current.event).toEqual(mockBatch.events[1]);
    expect(result.current.hasEvent).toBe(true);
    expect(result.current.eventType).toBe('MODULE_ATTACHED');
    expect(result.current.moduleId).toBe('module-2');
  });

  it('should clear event', () => {
    const { result } = renderHook(() => useEventDebouncing(eventTypes));

    // Create a mock batch
    const mockBatch = {
      events: [
        {
          type: 'MODULE_CREATED' as ModuleEventType,
          moduleId: 'module-1',
          moduleType: 'resource-manager',
          timestamp: Date.now(),
        },
      ],
      timestamp: Date.now(),
      size: 1,
      timeWindow: 100,
      eventTypes: new Set(['MODULE_CREATED'] as ModuleEventType[]),
      moduleIds: new Set(['module-1']),
    } as EventBatch;

    // Send the batch through the mock observable
    act(() => {
      mockObservable.next(mockBatch);
    });

    // Verify the event was set
    expect(result.current.event).toEqual(mockBatch.events[0]);

    // Clear the event
    act(() => {
      result.current.clearEvent();
    });

    expect(result.current.event).toBeNull();
    expect(result.current.hasEvent).toBe(false);
  });

  it('should unsubscribe when unmounted', () => {
    const { unmount } = renderHook(() => useEventDebouncing(eventTypes));

    unmount();

    expect(mockObservable.unsubscribeMock).toHaveBeenCalled();
  });
});

describe('useEventThrottling', () => {
  const eventTypes = ['MODULE_CREATED', 'MODULE_ATTACHED'] as ModuleEventType[];
  let mockObservable: MockObservable<EventBatch>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockObservable = createMockObservable<EventBatch>();

    // Mock the EventBatcher functions
    vi.spyOn(EventBatcher, 'createBatchedEventStream').mockReturnValue(
      mockObservable as unknown as Observable<EventBatch>
    );
  });

  it('should initialize with null event', () => {
    const { result } = renderHook(() => useEventThrottling(eventTypes));

    expect(result.current.event).toBeNull();
    expect(result.current.hasEvent).toBe(false);
    expect(result.current.eventType).toBeNull();
    expect(result.current.moduleId).toBeNull();

    // Verify that createBatchedEventStream was called
    expect(EventBatcher.createBatchedEventStream).toHaveBeenCalledWith(eventTypes, {
      timeWindow: 300,
      emitEmptyBatches: false,
    });
    // Verify that subscribe was called
    expect(mockObservable.subscribe).toHaveBeenCalled();
  });

  it('should update event when batch is received', () => {
    const { result } = renderHook(() => useEventThrottling(eventTypes));

    // Create a mock batch
    const mockBatch = {
      events: [
        {
          type: 'MODULE_CREATED' as ModuleEventType,
          moduleId: 'module-1',
          moduleType: 'resource-manager',
          timestamp: Date.now(),
        },
        {
          type: 'MODULE_ATTACHED' as ModuleEventType,
          moduleId: 'module-2',
          moduleType: 'resource-manager',
          timestamp: Date.now(),
        },
      ],
      timestamp: Date.now(),
      size: 2,
      timeWindow: 100,
      eventTypes: new Set(['MODULE_CREATED', 'MODULE_ATTACHED'] as ModuleEventType[]),
      moduleIds: new Set(['module-1', 'module-2']),
    } as EventBatch;

    // Send the batch through the mock observable
    act(() => {
      mockObservable.next(mockBatch);
    });

    // Verify the event was set to the first event in the batch
    expect(result.current.event).toEqual(mockBatch.events[0]);
    expect(result.current.hasEvent).toBe(true);
    expect(result.current.eventType).toBe('MODULE_CREATED');
    expect(result.current.moduleId).toBe('module-1');
  });

  it('should clear event', () => {
    const { result } = renderHook(() => useEventThrottling(eventTypes));

    // Create a mock batch
    const mockBatch = {
      events: [
        {
          type: 'MODULE_CREATED' as ModuleEventType,
          moduleId: 'module-1',
          moduleType: 'resource-manager',
          timestamp: Date.now(),
        },
      ],
      timestamp: Date.now(),
      size: 1,
      timeWindow: 100,
      eventTypes: new Set(['MODULE_CREATED'] as ModuleEventType[]),
      moduleIds: new Set(['module-1']),
    } as EventBatch;

    // Send the batch through the mock observable
    act(() => {
      mockObservable.next(mockBatch);
    });

    // Verify the event was set
    expect(result.current.event).toEqual(mockBatch.events[0]);

    // Clear the event
    act(() => {
      result.current.clearEvent();
    });

    expect(result.current.event).toBeNull();
    expect(result.current.hasEvent).toBe(false);
  });

  it('should unsubscribe when unmounted', () => {
    const { unmount } = renderHook(() => useEventThrottling(eventTypes));

    unmount();

    expect(mockObservable.unsubscribeMock).toHaveBeenCalled();
  });
});
