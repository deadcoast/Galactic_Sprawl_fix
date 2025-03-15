import { ResourceType } from "./../../../types/resources/ResourceTypes";
import { beforeEach, describe, expect, it } from 'vitest';
import { ModuleEvent, ModuleEventType } from '../../../lib/modules/ModuleEvents';
import { EventFilter } from '../../../utils/events/EventFilter';

describe('EventFilter', () => {
  // Mock events for testing
  const mockEvents: ModuleEvent[] = [
    {
      type: 'MODULE_CREATED' as ModuleEventType,
      moduleId: 'module-1',
      moduleType: 'resource-manager',
      timestamp: 1000,
    },
    {
      type: 'MODULE_ATTACHED' as ModuleEventType,
      moduleId: 'module-2',
      moduleType: 'radar',
      timestamp: 2000,
    },
    {
      type: 'RESOURCE_PRODUCED' as ModuleEventType,
      moduleId: 'module-1',
      moduleType: 'resource-manager',
      timestamp: 3000,
      data: { resourceType: ResourceType.ENERGY, amount: 100 },
    },
    {
      type: 'RESOURCE_CONSUMED' as ModuleEventType,
      moduleId: 'module-2',
      moduleType: 'radar',
      timestamp: 4000,
      data: { resourceType: ResourceType.ENERGY, amount: 50 },
    },
    {
      type: 'MODULE_CREATED' as ModuleEventType,
      moduleId: 'module-3',
      moduleType: 'defense',
      timestamp: 5000,
    },
  ];

  // Create a large event array for performance testing
  const createLargeEventArray = (size: number): ModuleEvent[] => {
    const result: ModuleEvent[] = [];
    const eventTypes: ModuleEventType[] = [
      'MODULE_CREATED',
      'MODULE_ATTACHED',
      'RESOURCE_PRODUCED',
      'RESOURCE_CONSUMED',
    ] as ModuleEventType[];
    const moduleIds = ['module-1', 'module-2', 'module-3', 'module-4', 'module-5'];
    const moduleTypes = ['resource-manager', 'radar', 'defense'];

    for (let i = 0; i < size; i++) {
      result.push({
        type: eventTypes[i % eventTypes.length],
        moduleId: moduleIds[i % moduleIds.length],
        moduleType: moduleTypes[i % moduleTypes.length] as 'resource-manager' | 'radar' | 'defense',
        timestamp: i * 1000,
        data: i % 2 === 0 ? { resourceType: ResourceType.ENERGY, amount: i * 10 } : undefined,
      });
    }

    return result;
  };

  describe('Basic filtering', () => {
    let eventFilter: EventFilter;

    beforeEach(() => {
      eventFilter = new EventFilter();
    });

    it('should return all events when no criteria is provided', () => {
      const result = eventFilter.filterEvents(mockEvents, {});
      expect(result).toHaveLength(mockEvents.length);
      expect(result).toEqual(mockEvents);
    });

    it('should filter events by event type', () => {
      const result = eventFilter.filterEvents(mockEvents, {
        eventTypes: ['MODULE_CREATED'] as ModuleEventType[],
      });
      expect(result).toHaveLength(2);
      expect(result[0].moduleId).toBe('module-1');
      expect(result[1].moduleId).toBe('module-3');
    });

    it('should filter events by module ID', () => {
      const result = eventFilter.filterEvents(mockEvents, {
        moduleIds: ['module-1'],
      });
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('MODULE_CREATED');
      expect(result[1].type).toBe('RESOURCE_PRODUCED');
    });

    it('should filter events by time range', () => {
      const result = eventFilter.filterEvents(mockEvents, {
        startTime: 2000,
        endTime: 4000,
      });
      expect(result).toHaveLength(3);
      expect(result[0].timestamp).toBe(2000);
      expect(result[2].timestamp).toBe(4000);
    });

    it('should apply custom filter function', () => {
      const result = eventFilter.filterEvents(mockEvents, {
        customFilter: event => event.data?.resourceType === ResourceType.ENERGY,
      });
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('RESOURCE_PRODUCED');
      expect(result[1].type).toBe('RESOURCE_CONSUMED');
    });

    it('should combine multiple filter criteria', () => {
      const result = eventFilter.filterEvents(mockEvents, {
        eventTypes: ['RESOURCE_PRODUCED', 'RESOURCE_CONSUMED'] as ModuleEventType[],
        moduleIds: ['module-1'],
        startTime: 2000,
      });
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('RESOURCE_PRODUCED');
      expect(result[0].moduleId).toBe('module-1');
    });
  });

  describe('Batch processing', () => {
    let eventFilter: EventFilter;
    const largeEventArray = createLargeEventArray(10000);

    beforeEach(() => {
      eventFilter = new EventFilter({
        batchSize: 1000,
        useIndexedFiltering: false,
      });
    });

    it('should process large arrays in batches', () => {
      const result = eventFilter.filterEvents(largeEventArray, {
        eventTypes: ['MODULE_CREATED'] as ModuleEventType[],
      });
      expect(result.length).toBe(2500); // 1/4 of events are MODULE_CREATED
      expect(result.every(event => event.type === 'MODULE_CREATED')).toBe(true);
    });

    it('should handle complex filtering in batches', () => {
      // We've verified that there are only 2 events that match all criteria:
      // - MODULE_CREATED type
      // - module-1 ID
      // - timestamp between 5000 and 50000
      const result = eventFilter.filterEvents(largeEventArray, {
        eventTypes: ['MODULE_CREATED'] as ModuleEventType[],
        moduleIds: ['module-1'],
        startTime: 5000,
        endTime: 50000,
      });

      // Only 2 events match all criteria
      expect(result.length).toBe(2);
      expect(
        result.every(
          event =>
            event.type === 'MODULE_CREATED' &&
            event.moduleId === 'module-1' &&
            event.timestamp >= 5000 &&
            event.timestamp <= 50000
        )
      ).toBe(true);
    });
  });

  describe('Indexed filtering', () => {
    let eventFilter: EventFilter;
    const largeEventArray = createLargeEventArray(10000);

    beforeEach(() => {
      eventFilter = new EventFilter({
        batchSize: 1000,
        useIndexedFiltering: true,
        indexedFilteringThreshold: 5000,
      });
    });

    it('should use indexed filtering for large arrays', () => {
      const result = eventFilter.filterEvents(largeEventArray, {
        eventTypes: ['MODULE_CREATED'] as ModuleEventType[],
      });
      expect(result.length).toBe(2500); // 1/4 of events are MODULE_CREATED
      expect(result.every(event => event.type === 'MODULE_CREATED')).toBe(true);
    });

    it('should handle complex filtering with indexing', () => {
      // We've verified that there are only 2 events that match all criteria:
      // - MODULE_CREATED type
      // - module-1 ID
      // - timestamp between 5000 and 50000
      const result = eventFilter.filterEvents(largeEventArray, {
        eventTypes: ['MODULE_CREATED'] as ModuleEventType[],
        moduleIds: ['module-1'],
        startTime: 5000,
        endTime: 50000,
      });

      // Only 2 events match all criteria
      expect(result.length).toBe(2);
      expect(
        result.every(
          event =>
            event.type === 'MODULE_CREATED' &&
            event.moduleId === 'module-1' &&
            event.timestamp >= 5000 &&
            event.timestamp <= 50000
        )
      ).toBe(true);
    });

    it('should handle custom filters with indexed filtering', () => {
      const result = eventFilter.filterEvents(largeEventArray, {
        eventTypes: ['MODULE_CREATED'] as ModuleEventType[],
        customFilter: event => (event.data?.amount as number) > 100,
      });

      // Custom filter is applied after index filtering
      expect(
        result.every(
          event => event.type === 'MODULE_CREATED' && (event.data?.amount as number) > 100
        )
      ).toBe(true);
    });
  });

  describe('Configuration updates', () => {
    let eventFilter: EventFilter;

    beforeEach(() => {
      eventFilter = new EventFilter();
    });

    it('should update configuration', () => {
      eventFilter.updateConfig({
        batchSize: 500,
        useIndexedFiltering: false,
      });

      // This is an indirect test since we can't access private properties
      // We're just ensuring the method doesn't throw
      expect(() => {
        eventFilter.filterEvents(mockEvents, {
          eventTypes: ['MODULE_CREATED'] as ModuleEventType[],
        });
      }).not.toThrow();
    });

    it('should disable indexed filtering when configured', () => {
      // First enable indexed filtering
      eventFilter.updateConfig({
        useIndexedFiltering: true,
        indexedFilteringThreshold: 0, // Force indexed filtering
      });

      // Then filter to build the index
      eventFilter.filterEvents(mockEvents, {
        eventTypes: ['MODULE_CREATED'] as ModuleEventType[],
      });

      // Now disable indexed filtering
      eventFilter.updateConfig({
        useIndexedFiltering: false,
      });

      // This should now use standard filtering
      const result = eventFilter.filterEvents(mockEvents, {
        eventTypes: ['MODULE_CREATED'] as ModuleEventType[],
      });

      expect(result).toHaveLength(2);
    });
  });
});
