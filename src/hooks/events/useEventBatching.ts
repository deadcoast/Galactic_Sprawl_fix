import { useEffect, useState } from 'react';
import { ModuleEvent, ModuleEventType } from '../../lib/modules/ModuleEvents';
import {
  EventBatch,
  EventBatchConfig,
  createBatchedEventStream,
  getBatchConfig,
  updateBatchConfig,
} from '../../utils/events/EventBatcher';

/**
 * Hook to use batched events for specific event types
 */
export function useEventBatching(
  eventTypes: ModuleEventType[],
  config?: Partial<EventBatchConfig>
): {
  /**
   * Current batch of events
   */
  batch: EventBatch | null;

  /**
   * Current batch configuration
   */
  batchConfig: EventBatchConfig;

  /**
   * Update batch configuration
   */
  updateConfig: (newConfig: Partial<EventBatchConfig>) => void;

  /**
   * Clear the current batch
   */
  clearBatch: () => void;

  /**
   * Whether the batch is empty
   */
  isEmpty: boolean;

  /**
   * Whether the batch has events
   */
  hasEvents: boolean;

  /**
   * Number of events in the batch
   */
  eventCount: number;

  /**
   * Event types in the batch
   */
  eventTypes: Set<ModuleEventType>;

  /**
   * Module IDs in the batch
   */
  moduleIds: Set<string>;

  /**
   * Events in the batch
   */
  events: ModuleEvent[];
} {
  // State for the current batch
  const [batch, setBatch] = useState<EventBatch | null>(null);

  // Get the current batch configuration
  const [batchConfig, setBatchConfig] = useState<EventBatchConfig>(() => {
    // Get the current config or default
    return getBatchConfig(eventTypes);
  });

  // Update batch configuration
  const updateConfig = (newConfig: Partial<EventBatchConfig>) => {
    // Update the config
    updateBatchConfig(eventTypes, newConfig);

    // Update the local state
    setBatchConfig(getBatchConfig(eventTypes));
  };

  // Clear the current batch
  const clearBatch = () => {
    setBatch(null);
  };

  // Subscribe to batched events
  useEffect(() => {
    // Apply the config if provided
    if (config) {
      updateConfig(config);
    }

    // Create a batched event stream
    const batchedStream$ = createBatchedEventStream(eventTypes, config);

    // Subscribe to the stream
    const subscription = batchedStream$.subscribe(newBatch => {
      setBatch(newBatch);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [eventTypes.join('|'), config]);

  // Derived values
  const isEmpty = !batch || batch.events.length === 0;
  const hasEvents = !isEmpty;
  const eventCount = batch?.size ?? 0;
  const batchEventTypes = batch?.eventTypes || new Set<ModuleEventType>();
  const batchModuleIds = batch?.moduleIds || new Set<string>();
  const events = batch?.events ?? [];

  return {
    batch,
    batchConfig,
    updateConfig,
    clearBatch,
    isEmpty,
    hasEvents,
    eventCount,
    eventTypes: batchEventTypes,
    moduleIds: batchModuleIds,
    events,
  };
}

/**
 * Hook to use debounced events for specific event types
 */
export function useEventDebouncing(
  eventTypes: ModuleEventType[],
  debounceTime: number = 300
): {
  /**
   * Latest debounced event
   */
  event: ModuleEvent | null;

  /**
   * Clear the current event
   */
  clearEvent: () => void;

  /**
   * Whether an event is available
   */
  hasEvent: boolean;

  /**
   * Event type of the current event
   */
  eventType: ModuleEventType | null;

  /**
   * Module ID of the current event
   */
  moduleId: string | null;
} {
  // State for the current event
  const [event, setEvent] = useState<ModuleEvent | null>(null);

  // Subscribe to debounced events
  useEffect(() => {
    // Create a batched event stream with a time window equal to the debounce time
    const batchedStream$ = createBatchedEventStream(eventTypes, {
      timeWindow: debounceTime,
      emitEmptyBatches: false,
    });

    // Subscribe to the stream
    const subscription = batchedStream$.subscribe(batch => {
      if (batch.events.length > 0) {
        // Set the last event in the batch
        setEvent(batch.events[batch.events.length - 1]);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [eventTypes.join('|'), debounceTime]);

  // Clear the current event
  const clearEvent = () => {
    setEvent(null);
  };

  // Derived values
  const hasEvent = event !== null;
  const eventType = event?.type || null;
  const moduleId = event?.moduleId || null;

  return {
    event,
    clearEvent,
    hasEvent,
    eventType,
    moduleId,
  };
}

/**
 * Hook to use throttled events for specific event types
 */
export function useEventThrottling(
  eventTypes: ModuleEventType[],
  throttleTime: number = 300
): {
  /**
   * Latest throttled event
   */
  event: ModuleEvent | null;

  /**
   * Clear the current event
   */
  clearEvent: () => void;

  /**
   * Whether an event is available
   */
  hasEvent: boolean;

  /**
   * Event type of the current event
   */
  eventType: ModuleEventType | null;

  /**
   * Module ID of the current event
   */
  moduleId: string | null;
} {
  // State for the current event
  const [event, setEvent] = useState<ModuleEvent | null>(null);

  // Subscribe to throttled events
  useEffect(() => {
    // Create a batched event stream with a time window equal to the throttle time
    const batchedStream$ = createBatchedEventStream(eventTypes, {
      timeWindow: throttleTime,
      emitEmptyBatches: false,
    });

    // Subscribe to the stream
    const subscription = batchedStream$.subscribe(batch => {
      if (batch.events.length > 0) {
        // Set the first event in the batch
        setEvent(batch.events[0]);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [eventTypes.join('|'), throttleTime]);

  // Clear the current event
  const clearEvent = () => {
    setEvent(null);
  };

  // Derived values
  const hasEvent = event !== null;
  const eventType = event?.type || null;
  const moduleId = event?.moduleId || null;

  return {
    event,
    clearEvent,
    hasEvent,
    eventType,
    moduleId,
  };
}
