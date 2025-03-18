/**
 * @file EventBatcher.ts
 * Provides event batching functionality to improve performance when processing multiple events.
 *
 * This utility:
 * 1. Collects events over a specified time window
 * 2. Processes them in batches to reduce processing overhead
 * 3. Prioritizes events for critical systems
 * 4. Provides performance metrics for batch processing
 */

import {
  BaseEvent,
  EventCategory,
  EventType,
  getEventTypesByCategory,
} from '../../types/events/EventTypes';
import { EventBus } from './EventBus';

/**
 * Configuration options for the EventBatcher
 */
export interface EventBatcherConfig {
  /**
   * Time window in milliseconds to collect events before processing
   */
  batchTimeWindow: number;

  /**
   * Maximum number of events to process in a single batch
   */
  maxBatchSize: number;

  /**
   * Whether to track performance metrics
   */
  trackPerformance?: boolean;

  /**
   * Event types that should be processed immediately, bypassing batching
   */
  priorityEventTypes?: EventType[];

  /**
   * Event categories that should be processed immediately, bypassing batching
   */
  priorityCategories?: EventCategory[];
}

/**
 * Performance metrics for event batching
 */
export interface BatchingMetrics {
  /**
   * Total number of events processed
   */
  totalEventsProcessed: number;

  /**
   * Total number of batches processed
   */
  totalBatchesProcessed: number;

  /**
   * Average batch size
   */
  averageBatchSize: number;

  /**
   * Average processing time per batch in milliseconds
   */
  averageBatchProcessingTime: number;

  /**
   * Maximum processing time for a batch in milliseconds
   */
  maxBatchProcessingTime: number;

  /**
   * Average processing time per event in milliseconds
   */
  averageEventProcessingTime: number;

  /**
   * Number of events processed immediately (bypassing batching)
   */
  immediateEventCount: number;
}

/**
 * EventBatcher class for efficient event processing
 */
export class EventBatcher<T extends BaseEvent = BaseEvent> {
  /**
   * Current batch of events waiting to be processed
   */
  private currentBatch: T[] = [];

  /**
   * Timer ID for the current batch processing
   */
  private batchTimerId: number | null = null;

  /**
   * Performance metrics for batch processing
   */
  private metrics: BatchingMetrics = {
    totalEventsProcessed: 0,
    totalBatchesProcessed: 0,
    averageBatchSize: 0,
    averageBatchProcessingTime: 0,
    maxBatchProcessingTime: 0,
    averageEventProcessingTime: 0,
    immediateEventCount: 0,
  };

  /**
   * Priority event types that bypass batching
   */
  private priorityEventTypes: Set<EventType>;

  /**
   * Creates a new EventBatcher
   * @param targetEventBus The event bus to forward processed events to
   * @param config Configuration options for batching
   */
  constructor(
    private readonly targetEventBus: EventBus<T>,
    private readonly config: EventBatcherConfig
  ) {
    // Initialize priority event types
    this.priorityEventTypes = new Set(config.priorityEventTypes ?? []);

    // Add event types from priority categories
    if (config.priorityCategories) {
      for (const category of config.priorityCategories) {
        getEventTypesByCategory(category).forEach(eventType => {
          this.priorityEventTypes.add(eventType);
        });
      }
    }
  }

  /**
   * Add an event to the batch
   * @param event The event to add
   */
  addEvent(event: T): void {
    // Check if this is a priority event that should bypass batching
    if (this.priorityEventTypes.has(event?.type)) {
      this.processImmediately(event);
      return;
    }

    // Add event to the current batch
    this.currentBatch.push(event);

    // If we've reached the max batch size, process immediately
    if (this.currentBatch.length >= this.config.maxBatchSize) {
      this.processBatch();
      return;
    }

    // Schedule batch processing if not already scheduled
    if (this.batchTimerId === null) {
      this.batchTimerId = window.setTimeout(() => {
        this.processBatch();
      }, this.config.batchTimeWindow);
    }
  }

  /**
   * Process the current batch of events
   */
  private processBatch(): void {
    // Clear the timer
    if (this.batchTimerId !== null) {
      clearTimeout(this.batchTimerId);
      this.batchTimerId = null;
    }

    // If there are no events, do nothing
    if (this.currentBatch.length === 0) {
      return;
    }

    const batchSize = this.currentBatch.length;
    const startTime = this.config.trackPerformance ? performance.now() : 0;

    // Process each event in the batch
    for (const event of this.currentBatch) {
      this.targetEventBus.emit(event);
    }

    // Update metrics if tracking performance
    if (this.config.trackPerformance) {
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      this.updateMetrics(batchSize, processingTime);
    }

    // Clear the batch
    this.currentBatch = [];
  }

  /**
   * Process an event immediately, bypassing batching
   * @param event The event to process
   */
  private processImmediately(event: T): void {
    const startTime = this.config.trackPerformance ? performance.now() : 0;

    // Emit the event directly
    this.targetEventBus.emit(event);

    // Update metrics if tracking performance
    if (this.config.trackPerformance) {
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      this.metrics.immediateEventCount++;
      this.metrics.totalEventsProcessed++;
      this.metrics.averageEventProcessingTime =
        (this.metrics.averageEventProcessingTime * (this.metrics.totalEventsProcessed - 1) +
          processingTime) /
        this.metrics.totalEventsProcessed;
    }
  }

  /**
   * Update performance metrics after batch processing
   * @param batchSize Size of the batch that was processed
   * @param processingTime Time taken to process the batch in milliseconds
   */
  private updateMetrics(batchSize: number, processingTime: number): void {
    this.metrics.totalEventsProcessed += batchSize;
    this.metrics.totalBatchesProcessed++;

    // Update average batch size
    this.metrics.averageBatchSize =
      (this.metrics.averageBatchSize * (this.metrics.totalBatchesProcessed - 1) + batchSize) /
      this.metrics.totalBatchesProcessed;

    // Update batch processing time metrics
    this.metrics.averageBatchProcessingTime =
      (this.metrics.averageBatchProcessingTime * (this.metrics.totalBatchesProcessed - 1) +
        processingTime) /
      this.metrics.totalBatchesProcessed;

    this.metrics.maxBatchProcessingTime = Math.max(
      this.metrics.maxBatchProcessingTime,
      processingTime
    );

    // Update average event processing time
    this.metrics.averageEventProcessingTime =
      (this.metrics.averageEventProcessingTime * (this.metrics.totalEventsProcessed - batchSize) +
        (processingTime / batchSize) * batchSize) /
      this.metrics.totalEventsProcessed;
  }

  /**
   * Force processing of the current batch immediately
   */
  flush(): void {
    this.processBatch();
  }

  /**
   * Get current performance metrics
   * @returns Current batching metrics
   */
  getMetrics(): BatchingMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalEventsProcessed: 0,
      totalBatchesProcessed: 0,
      averageBatchSize: 0,
      averageBatchProcessingTime: 0,
      maxBatchProcessingTime: 0,
      averageEventProcessingTime: 0,
      immediateEventCount: 0,
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.batchTimerId !== null) {
      clearTimeout(this.batchTimerId);
      this.batchTimerId = null;
    }

    this.processBatch();
  }
}
