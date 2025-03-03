import { ModuleEvent, ModuleEventType } from '../../lib/modules/ModuleEvents';

/**
 * Configuration for event filtering
 */
export interface EventFilterConfig {
  /** Maximum number of events to process in a single batch */
  batchSize?: number;
  /** Whether to use indexed filtering for large event histories */
  useIndexedFiltering?: boolean;
  /** Threshold for switching to indexed filtering */
  indexedFilteringThreshold?: number;
}

/**
 * Default configuration for event filtering
 */
export const DEFAULT_FILTER_CONFIG: EventFilterConfig = {
  batchSize: 1000,
  useIndexedFiltering: true,
  indexedFilteringThreshold: 5000,
};

/**
 * Filter criteria for events
 */
export interface EventFilterCriteria {
  /** Event types to include */
  eventTypes?: ModuleEventType[];
  /** Module IDs to include */
  moduleIds?: string[];
  /** Time range to filter by (start timestamp) */
  startTime?: number;
  /** Time range to filter by (end timestamp) */
  endTime?: number;
  /** Custom filter function */
  customFilter?: (event: ModuleEvent) => boolean;
}

/**
 * Index structure for efficient event filtering
 */
interface EventIndex {
  /** Index by event type */
  byEventType: Map<ModuleEventType, Set<number>>;
  /** Index by module ID */
  byModuleId: Map<string, Set<number>>;
  /** Index by time range (bucketed) */
  byTimeRange: Map<number, Set<number>>;
}

/**
 * Class for efficient event filtering
 */
export class EventFilter {
  private config: EventFilterConfig;
  private eventIndex: EventIndex | null = null;
  private indexedEvents: ModuleEvent[] = [];
  private timeBucketSize = 60000; // 1 minute buckets for time indexing

  /**
   * Create a new EventFilter
   * @param config Configuration for the filter
   */
  constructor(config: EventFilterConfig = DEFAULT_FILTER_CONFIG) {
    this.config = { ...DEFAULT_FILTER_CONFIG, ...config };
  }

  /**
   * Update the filter configuration
   * @param config New configuration
   */
  updateConfig(config: Partial<EventFilterConfig>): void {
    this.config = { ...this.config, ...config };

    // Clear index if we're disabling indexed filtering
    if (config.useIndexedFiltering === false) {
      this.clearIndex();
    }
  }

  /**
   * Filter events based on criteria
   * @param events Events to filter
   * @param criteria Filter criteria
   * @returns Filtered events
   */
  filterEvents(events: ModuleEvent[], criteria: EventFilterCriteria): ModuleEvent[] {
    // If no criteria provided, return all events
    if (this.isEmptyCriteria(criteria)) {
      return [...events];
    }

    // Use indexed filtering for large event histories if enabled
    if (
      this.config.useIndexedFiltering &&
      events.length > (this.config.indexedFilteringThreshold || 0)
    ) {
      return this.filterEventsWithIndex(events, criteria);
    }

    // Use batch processing for large event arrays
    if (events.length > (this.config.batchSize || 1)) {
      return this.filterEventsInBatches(events, criteria);
    }

    // Standard filtering for smaller arrays
    return this.filterEventsStandard(events, criteria);
  }

  /**
   * Check if filter criteria is empty
   * @param criteria Filter criteria
   * @returns True if criteria is empty
   */
  private isEmptyCriteria(criteria: EventFilterCriteria): boolean {
    return (
      !criteria.eventTypes?.length &&
      !criteria.moduleIds?.length &&
      !criteria.startTime &&
      !criteria.endTime &&
      !criteria.customFilter
    );
  }

  /**
   * Standard event filtering implementation
   * @param events Events to filter
   * @param criteria Filter criteria
   * @returns Filtered events
   */
  private filterEventsStandard(
    events: ModuleEvent[],
    criteria: EventFilterCriteria
  ): ModuleEvent[] {
    return events.filter(event => this.matchesCriteria(event, criteria));
  }

  /**
   * Batch processing for filtering large event arrays
   * @param events Events to filter
   * @param criteria Filter criteria
   * @returns Filtered events
   */
  private filterEventsInBatches(
    events: ModuleEvent[],
    criteria: EventFilterCriteria
  ): ModuleEvent[] {
    const batchSize = this.config.batchSize || 1000;
    const result: ModuleEvent[] = [];

    // Process in batches to avoid blocking the main thread
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const filteredBatch = this.filterEventsStandard(batch, criteria);
      result.push(...filteredBatch);
    }

    return result;
  }

  /**
   * Index-based filtering for very large event histories
   * @param events Events to filter
   * @param criteria Filter criteria
   * @returns Filtered events
   */
  private filterEventsWithIndex(
    events: ModuleEvent[],
    criteria: EventFilterCriteria
  ): ModuleEvent[] {
    // Build or update index if needed
    if (!this.eventIndex || this.indexedEvents !== events) {
      this.buildIndex(events);
    }

    // Find candidate indices using the index
    const candidateIndices = this.getCandidateIndices(criteria);

    // If no candidates found, return empty array
    if (candidateIndices.size === 0) {
      return [];
    }

    // Convert to array and sort
    const indices = Array.from(candidateIndices).sort((a, b) => a - b);

    // Get events at the candidate indices
    const candidates = indices.map(index => events[index]);

    // Apply custom filter if provided
    if (criteria.customFilter) {
      return candidates.filter(criteria.customFilter);
    }

    return candidates;
  }

  /**
   * Build index for efficient filtering
   * @param events Events to index
   */
  private buildIndex(events: ModuleEvent[]): void {
    console.warn('Building event index for', events.length, 'events');

    this.eventIndex = {
      byEventType: new Map(),
      byModuleId: new Map(),
      byTimeRange: new Map(),
    };

    this.indexedEvents = events;

    // Build indices
    events.forEach((event, index) => {
      // Index by event type
      if (!this.eventIndex!.byEventType.has(event.type)) {
        this.eventIndex!.byEventType.set(event.type, new Set());
      }
      this.eventIndex!.byEventType.get(event.type)!.add(index);

      // Index by module ID
      if (!this.eventIndex!.byModuleId.has(event.moduleId)) {
        this.eventIndex!.byModuleId.set(event.moduleId, new Set());
      }
      this.eventIndex!.byModuleId.get(event.moduleId)!.add(index);

      // Index by time range (bucketed)
      const timeBucket = Math.floor(event.timestamp / this.timeBucketSize) * this.timeBucketSize;
      if (!this.eventIndex!.byTimeRange.has(timeBucket)) {
        this.eventIndex!.byTimeRange.set(timeBucket, new Set());
      }
      this.eventIndex!.byTimeRange.get(timeBucket)!.add(index);
    });
  }

  /**
   * Clear the event index
   */
  private clearIndex(): void {
    this.eventIndex = null;
    this.indexedEvents = [];
  }

  /**
   * Get candidate indices based on filter criteria
   * @param criteria Filter criteria
   * @returns Set of candidate indices
   */
  private getCandidateIndices(criteria: EventFilterCriteria): Set<number> {
    const candidateSets: Set<number>[] = [];

    // Get candidates by event type
    if (criteria.eventTypes?.length) {
      const typeIndices = new Set<number>();
      criteria.eventTypes.forEach(type => {
        const indices = this.eventIndex!.byEventType.get(type);
        if (indices) {
          indices.forEach(index => typeIndices.add(index));
        }
      });
      candidateSets.push(typeIndices);
    }

    // Get candidates by module ID
    if (criteria.moduleIds?.length) {
      const moduleIndices = new Set<number>();
      criteria.moduleIds.forEach(moduleId => {
        const indices = this.eventIndex!.byModuleId.get(moduleId);
        if (indices) {
          indices.forEach(index => moduleIndices.add(index));
        }
      });
      candidateSets.push(moduleIndices);
    }

    // Get candidates by time range
    if (criteria.startTime || criteria.endTime) {
      const timeIndices = new Set<number>();
      const startBucket = criteria.startTime
        ? Math.floor(criteria.startTime / this.timeBucketSize) * this.timeBucketSize
        : 0;
      const endBucket = criteria.endTime
        ? Math.floor(criteria.endTime / this.timeBucketSize) * this.timeBucketSize
        : Number.MAX_SAFE_INTEGER;

      // Get all buckets in the range
      for (const [bucket, indices] of this.eventIndex!.byTimeRange.entries()) {
        if (bucket >= startBucket && bucket <= endBucket) {
          indices.forEach(index => timeIndices.add(index));
        }
      }
      candidateSets.push(timeIndices);
    }

    // If no criteria were applied, return empty set
    if (candidateSets.length === 0) {
      return new Set<number>();
    }

    // Intersect all candidate sets
    return this.intersectSets(candidateSets);
  }

  /**
   * Intersect multiple sets
   * @param sets Sets to intersect
   * @returns Intersection of all sets
   */
  private intersectSets(sets: Set<number>[]): Set<number> {
    if (sets.length === 0) {
      return new Set<number>();
    }
    if (sets.length === 1) {
      return sets[0];
    }

    // Start with the smallest set for efficiency
    const sortedSets = [...sets].sort((a, b) => a.size - b.size);
    let result = new Set(sortedSets[0]);

    for (let i = 1; i < sortedSets.length; i++) {
      result = new Set([...result].filter(x => sortedSets[i].has(x)));
    }

    return result;
  }

  /**
   * Check if an event matches the filter criteria
   * @param event Event to check
   * @param criteria Filter criteria
   * @returns True if the event matches
   */
  private matchesCriteria(event: ModuleEvent, criteria: EventFilterCriteria): boolean {
    // Check event type
    if (criteria.eventTypes?.length && !criteria.eventTypes.includes(event.type)) {
      return false;
    }

    // Check module ID
    if (criteria.moduleIds?.length && !criteria.moduleIds.includes(event.moduleId)) {
      return false;
    }

    // Check time range
    if (criteria.startTime && event.timestamp < criteria.startTime) {
      return false;
    }
    if (criteria.endTime && event.timestamp > criteria.endTime) {
      return false;
    }

    // Apply custom filter if provided
    if (criteria.customFilter && !criteria.customFilter(event)) {
      return false;
    }

    return true;
  }
}
