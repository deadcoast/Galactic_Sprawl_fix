import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModuleEventType } from '../../../lib/modules/ModuleEvents';
import {
  EventBatch,
  createBatchedEventStream,
  filterBatch,
  getBatchConfig,
  getBatchStats,
  groupBatchByEventType,
  groupBatchByModuleId,
  initializeEventBatcher,
  mapBatch,
  reduceBatch,
  updateBatchConfig,
} from '../../../utils/events/EventBatcher';

// Mock the moduleEventBus
vi.mock('../../../lib/modules/ModuleEvents', () => {
  const mockSubscribe = vi.fn().mockReturnValue(() => {});
  const mockEmit = vi.fn();

  return {
    moduleEventBus: {
      subscribe: mockSubscribe,
      emit: mockEmit,
    },
    ModuleEventType: {
      MODULE_CREATED: 'MODULE_CREATED',
      MODULE_ATTACHED: 'MODULE_ATTACHED',
      RESOURCE_PRODUCED: 'RESOURCE_PRODUCED',
      RESOURCE_CONSUMED: 'RESOURCE_CONSUMED',
    },
  };
});

describe('EventBatcher', () => {
  let cleanup: () => void;
  let mockBatch: EventBatch;

  beforeEach(() => {
    // Initialize the event batcher
    cleanup = initializeEventBatcher();

    // Create a mock batch
    mockBatch = {
      events: [
        {
          type: 'MODULE_CREATED' as ModuleEventType,
          moduleId: 'module-1',
          moduleType: 'resource-manager',
          timestamp: Date.now(),
          data: { name: 'Module 1' },
        },
        {
          type: 'MODULE_ATTACHED' as ModuleEventType,
          moduleId: 'module-1',
          moduleType: 'resource-manager',
          timestamp: Date.now(),
          data: { attachedTo: 'building-1' },
        },
        {
          type: 'RESOURCE_PRODUCED' as ModuleEventType,
          moduleId: 'module-2',
          moduleType: 'resource-manager',
          timestamp: Date.now(),
          data: { resourceType: 'energy', amount: 100 },
        },
        {
          type: 'RESOURCE_CONSUMED' as ModuleEventType,
          moduleId: 'module-2',
          moduleType: 'resource-manager',
          timestamp: Date.now(),
          data: { resourceType: 'energy', amount: 50 },
        },
      ],
      timestamp: Date.now(),
      size: 4,
      timeWindow: 100,
      eventTypes: new Set([
        'MODULE_CREATED',
        'MODULE_ATTACHED',
        'RESOURCE_PRODUCED',
        'RESOURCE_CONSUMED',
      ] as ModuleEventType[]),
      moduleIds: new Set(['module-1', 'module-2']),
    };
  });

  afterEach(() => {
    // Clean up the event batcher
    cleanup();
    vi.clearAllMocks();
  });

  it('should create a batched event stream', () => {
    const eventTypes = ['MODULE_CREATED', 'MODULE_ATTACHED'] as ModuleEventType[];
    const stream$ = createBatchedEventStream(eventTypes);
    expect(stream$).toBeDefined();
  });

  it('should get batch configuration', () => {
    const eventTypes = ['MODULE_CREATED', 'MODULE_ATTACHED'] as ModuleEventType[];
    const config = getBatchConfig(eventTypes);
    expect(config).toBeDefined();
    expect(config.timeWindow).toBe(100);
  });

  it('should update batch configuration', () => {
    const eventTypes = ['MODULE_CREATED', 'MODULE_ATTACHED'] as ModuleEventType[];
    updateBatchConfig(eventTypes, { timeWindow: 200 });
    const config = getBatchConfig(eventTypes);
    expect(config.timeWindow).toBe(200);
  });

  it('should group batch by event type', () => {
    const grouped = groupBatchByEventType(mockBatch);
    expect(grouped).toBeDefined();
    expect(grouped['MODULE_CREATED']).toHaveLength(1);
    expect(grouped['MODULE_ATTACHED']).toHaveLength(1);
    expect(grouped['RESOURCE_PRODUCED']).toHaveLength(1);
    expect(grouped['RESOURCE_CONSUMED']).toHaveLength(1);
  });

  it('should group batch by module ID', () => {
    const grouped = groupBatchByModuleId(mockBatch);
    expect(grouped).toBeDefined();
    expect(grouped['module-1']).toHaveLength(2);
    expect(grouped['module-2']).toHaveLength(2);
  });

  it('should filter batch', () => {
    const filtered = filterBatch(mockBatch, event => event.moduleId === 'module-1');
    expect(filtered).toBeDefined();
    expect(filtered.events).toHaveLength(2);
    expect(filtered.size).toBe(2);
    expect(filtered.eventTypes.size).toBe(2);
    expect(filtered.moduleIds.size).toBe(1);
  });

  it('should map batch', () => {
    const mapped = mapBatch(mockBatch, event => event.moduleId);
    expect(mapped).toBeDefined();
    expect(mapped).toHaveLength(4);
    expect(mapped).toContain('module-1');
    expect(mapped).toContain('module-2');
  });

  it('should reduce batch', () => {
    const reduced = reduceBatch(
      mockBatch,
      (acc, event) => {
        if (event.type === 'RESOURCE_PRODUCED') {
          return acc + ((event.data?.amount as number) || 0);
        }
        if (event.type === 'RESOURCE_CONSUMED') {
          return acc - ((event.data?.amount as number) || 0);
        }
        return acc;
      },
      0
    );
    expect(reduced).toBe(50); // 100 produced - 50 consumed
  });

  it('should get batch stats', () => {
    const stats = getBatchStats(mockBatch);
    expect(stats).toBeDefined();
    expect(stats.eventCount).toBe(4);
    expect(stats.eventTypeCount).toBe(4);
    expect(stats.moduleIdCount).toBe(2);
    expect(stats.eventTypeCounts['MODULE_CREATED']).toBe(1);
    expect(stats.eventTypeCounts['MODULE_ATTACHED']).toBe(1);
    expect(stats.eventTypeCounts['RESOURCE_PRODUCED']).toBe(1);
    expect(stats.eventTypeCounts['RESOURCE_CONSUMED']).toBe(1);
    expect(stats.moduleIdCounts['module-1']).toBe(2);
    expect(stats.moduleIdCounts['module-2']).toBe(2);
  });
});
