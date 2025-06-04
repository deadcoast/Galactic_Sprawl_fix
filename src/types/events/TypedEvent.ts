/**
 * Barrel alias for TypedEvent to satisfy imports in SharedEventTypes and others.
 * Currently maps to a minimal generic interface since event emitter
 * implementations in /lib/events provide concrete shapes.
 */
export interface TypedEvent<T = unknown> {
  type: string;
  timestamp: number;
  data: T;
}

// Re-export BaseEvent for convenience if callers switch.
export type { BaseEvent } from './EventTypes';
