/**
 * Barrel alias for TypedEvent to satisfy imports in SharedEventTypes and others.
 * Currently maps to a minimal generic interface since event emitter
 * implementations in /lib/events provide concrete shapes.
 */
export interface TypedEvent<T extends string = string, D = unknown> {
  type: T;
  timestamp: number;
  data: D;
}

/**
 * Simple typed event interface for events with just a type
 */
export interface SimpleTypedEvent<T extends string = string> {
  type: T;
  timestamp: number;
}

/**
 * Type guard for checking if an event matches a specific type
 */
export function isTypedEvent<T extends string>(
  event: unknown,
  type: T
): event is TypedEvent<T> {
  return (
    typeof event === 'object' &&
    event !== null &&
    'type' in event &&
    'timestamp' in event &&
    (event as { type: unknown }).type === type
  );
}

/**
 * Type guard for checking if an event has specific data structure
 */
export function hasTypedEventData<T extends string, D>(
  event: TypedEvent<T>,
  predicate: (data: unknown) => data is D
): event is TypedEvent<T, D> {
  return predicate(event.data);
}

// Re-export BaseEvent for convenience if callers switch.
export type { BaseEvent } from './EventTypes';
