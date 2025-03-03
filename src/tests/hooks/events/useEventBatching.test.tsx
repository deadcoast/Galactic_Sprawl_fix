import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useEventBatching,
  useEventDebouncing,
  useEventThrottling,
} from '../../../hooks/events/useEventBatching';
import { ModuleEventType } from '../../../lib/modules/ModuleEvents';
import * as EventBatcher from '../../../utils/events/EventBatcher';
import { EventBatch } from '../../../utils/events/EventBatcher';

// Mock the EventBatcher module
vi.mock('../../../utils/events/EventBatcher', () => {
  const mockBatchedStream = {
    subscribe: vi.fn().mockReturnValue({
      unsubscribe: vi.fn(),
    }),
  };

  return {
    createBatchedEventStream: vi.fn().mockReturnValue(mockBatchedStream),
    getBatchConfig: vi.fn().mockReturnValue({
      timeWindow: 100,
      maxBatchSize: 100,
      emitEmptyBatches: false,
    }),
    updateBatchConfig: vi.fn(),
    EventBatch: vi.fn(),
    EventBatchConfig: vi.fn(),
  };
});

describe('useEventBatching', () => {
  const eventTypes = ['MODULE_CREATED', 'MODULE_ATTACHED'] as ModuleEventType[];

  beforeEach(() => {
    vi.clearAllMocks();
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

    // Set a mock batch
    act(() => {
      // Directly set the batch for testing purposes
      result.current.batch = {
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
    });

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
});

describe('useEventDebouncing', () => {
  const eventTypes = ['MODULE_CREATED', 'MODULE_ATTACHED'] as ModuleEventType[];
  const mockBatchSubject = {
    subscribe: vi.fn().mockImplementation(callback => {
      // Store the callback for later use
      mockBatchSubject.callback = callback;
      return {
        unsubscribe: vi.fn(),
      };
    }),
    // Add a property to store the callback
    callback: null as ((batch: EventBatch) => void) | null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock implementation
    (EventBatcher.createBatchedEventStream as ReturnType<typeof vi.fn>).mockReturnValue(
      mockBatchSubject
    );
  });

  it('should initialize with null event', () => {
    const { result } = renderHook(() => useEventDebouncing(eventTypes));

    expect(result.current.event).toBeNull();
    expect(result.current.hasEvent).toBe(false);
    expect(result.current.eventType).toBeNull();
    expect(result.current.moduleId).toBeNull();
  });

  it('should update event when batch is received', () => {
    const { result } = renderHook(() => useEventDebouncing(eventTypes));

    // Simulate receiving a batch
    act(() => {
      if (mockBatchSubject.callback) {
        mockBatchSubject.callback({
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
        } as EventBatch);
      }
    });

    expect(result.current.event).not.toBeNull();
    expect(result.current.hasEvent).toBe(true);
    expect(result.current.eventType).toBe('MODULE_ATTACHED');
    expect(result.current.moduleId).toBe('module-2');
  });

  it('should clear event', () => {
    const { result } = renderHook(() => useEventDebouncing(eventTypes));

    // Simulate receiving a batch
    act(() => {
      if (mockBatchSubject.callback) {
        mockBatchSubject.callback({
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
        } as EventBatch);
      }
    });

    act(() => {
      result.current.clearEvent();
    });

    expect(result.current.event).toBeNull();
    expect(result.current.hasEvent).toBe(false);
  });
});

describe('useEventThrottling', () => {
  const eventTypes = ['MODULE_CREATED', 'MODULE_ATTACHED'] as ModuleEventType[];
  const mockBatchSubject = {
    subscribe: vi.fn().mockImplementation(callback => {
      // Store the callback for later use
      mockBatchSubject.callback = callback;
      return {
        unsubscribe: vi.fn(),
      };
    }),
    // Add a property to store the callback
    callback: null as ((batch: EventBatch) => void) | null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock implementation
    (EventBatcher.createBatchedEventStream as ReturnType<typeof vi.fn>).mockReturnValue(
      mockBatchSubject
    );
  });

  it('should initialize with null event', () => {
    const { result } = renderHook(() => useEventThrottling(eventTypes));

    expect(result.current.event).toBeNull();
    expect(result.current.hasEvent).toBe(false);
    expect(result.current.eventType).toBeNull();
    expect(result.current.moduleId).toBeNull();
  });

  it('should update event when batch is received', () => {
    const { result } = renderHook(() => useEventThrottling(eventTypes));

    // Simulate receiving a batch
    act(() => {
      if (mockBatchSubject.callback) {
        mockBatchSubject.callback({
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
        } as EventBatch);
      }
    });

    expect(result.current.event).not.toBeNull();
    expect(result.current.hasEvent).toBe(true);
    expect(result.current.eventType).toBe('MODULE_CREATED');
    expect(result.current.moduleId).toBe('module-1');
  });

  it('should clear event', () => {
    const { result } = renderHook(() => useEventThrottling(eventTypes));

    // Simulate receiving a batch
    act(() => {
      if (mockBatchSubject.callback) {
        mockBatchSubject.callback({
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
        } as EventBatch);
      }
    });

    act(() => {
      result.current.clearEvent();
    });

    expect(result.current.event).toBeNull();
    expect(result.current.hasEvent).toBe(false);
  });
});
