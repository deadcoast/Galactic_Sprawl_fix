/**
 * @file SharedEventTypes.ts
 * Shared event types and interfaces for both production and test code
 *
 * This file provides unified event types to:
 * 1. Eliminate "as unknown as" casts in event handling
 * 2. Create consistent interfaces for mocks and real implementations
 * 3. Provide type-safe event creation and handling
 */

import { EventHandler as BaseEventHandler, EventUnsubscribe } from '../TypeUtils';

/**
 * Event Emitter interface compatible with both production and test code
 */
export interface EventEmitter<E extends BaseEvent = BaseEvent> {
  emit(event: E): void;
  on(eventType: string, handler: EventHandler<E>): EventUnsubscribe;
  off(eventType: string, handler: EventHandler<E>): void;
}

/**
 * Event Bus interface for more complex event routing
 */
export interface EventBus<E extends BaseEvent = BaseEvent> extends EventEmitter<E> {
  subscribe(eventType: string, handler: EventHandler<E>): EventUnsubscribe;
  unsubscribe(eventType: string, handler: EventHandler<E>): void;
  subscribeToMultiple(eventTypes: string[], handler: EventHandler<E>): EventUnsubscribe;
  clear(): void;
}

/**
 * Mock Event Bus for testing - implements the same interface
 */
export interface MockEventBus<E extends BaseEvent = BaseEvent> extends EventBus<E> {
  getEmittedEvents(): E[];
  getSubscriptions(): Map<string, Array<EventHandler<E>>>;
  reset(): void;
}

/**
 * Type-safe event creator - ensures proper event structure
 */
export function createEvent<T extends string, D>(type: T, data?: D): TypedEvent<T, D> {
  return {
    type,
    timestamp: Date.now(),
    data,
  };
}

/**
 * Type-safe event data extractor - safely extracts data from events
 */
export function getEventData<T>(event: BaseEvent): T | undefined {
  return event?.data as T | undefined;
}

/**
 * Event type guard - checks if an event is of a specific type
 */
export function isEventOfType<T extends string>(event: BaseEvent, type: T): event is TypedEvent<T> {
  return event?.type === type;
}

/**
 * Event data type guard - checks if event data conforms to a specific shape
 */
export function hasEventData<T>(
  event: BaseEvent,
  predicate: (data: unknown) => data is T
): event is BaseEvent & { data: T } {
  return event?.data !== undefined && predicate(event?.data);
}

/**
 * Event handler with type filtering - only calls handler for matching event types
 */
export function createTypedEventHandler<T extends string, E extends BaseEvent, D>(
  type: T,
  handler: (data: D, event: E) => void
): EventHandler<E> {
  return (event: E) => {
    if (event?.type === type && event?.data !== undefined) {
      handler(event?.data as D, event);
    }
  };
}

/**
 * Common event object pattern shared across the application
 */
export interface EventObject<T extends string = string> {
  eventType: T;
  payload: unknown;
}

/**
 * Generic event map interface for strongly typed event data
 */
export interface EventDataMap {
  [eventType: string]: unknown;
}

/**
 * Type-safe event subscription helper
 */
export function typedSubscribe<
  E extends BaseEvent,
  T extends string,
  M extends EventDataMap,
  K extends keyof M & string,
>(
  bus: EventBus<E>,
  eventType: K,
  handler: (data: M[K], event: TypedEvent<K, M[K]>) => void
): EventUnsubscribe {
  const wrappedHandler: EventHandler<E> = (event: E) => {
    if (event?.type === eventType) {
      handler(event?.data as M[K], event as unknown as TypedEvent<K, M[K]>);
    }
  };

  return bus.subscribe(eventType, wrappedHandler);
}

/**
 * Type-safe event emission helper
 */
export function typedEmit<E extends BaseEvent, M extends EventDataMap, K extends keyof M & string>(
  bus: EventEmitter<E>,
  eventType: K,
  data: M[K]
): void {
  const event: TypedEvent<K, M[K]> = {
    type: eventType,
    timestamp: Date.now(),
    data,
  };

  bus.emit(event as unknown as E);
}

// Re-export these types
export type EventHandler<T> = BaseEventHandler<T>;
export type { EventUnsubscribe };

/**
 * Base structure for event data payloads.
 */
export interface BaseEventData {
  [key: string]: unknown;
}

/**
 * Interface for events carrying specific payload types, enhancing type safety.
 * @template P The type of the payload data.
 */
export interface TypedEventData<P> extends BaseEventData {
  payload: P;
}

/**
 * Type-safe event handler for events with specific payloads.
 * @template P Payload type.
 */
export type TypedEventHandler<P> = (event: BaseEvent & { data: TypedEventData<P> }) => void;

// Define EventType and ModuleEventType if they are missing
// Example placeholder, adjust based on actual types
export declare enum EventType /* ... */ {}
export declare enum ModuleEventType /* ... */ {}

/**
 * Base structure for all events within the system.
 * Ensures consistency in event handling and propagation.
 */
export interface BaseEvent {
  /** Unique identifier for the event instance. */
  id: string;
  /** Type identifier for the event category (e.g., 'resource', 'module', 'ui'). */
  type: EventType | ModuleEventType | string; // Allow string for custom types
  /** Timestamp when the event was created. */
  timestamp: number;
  /** Optional data payload associated with the event. */
  data?: BaseEventData | TypedEventData<unknown>; // Allow both base and typed data
  /** Optional source identifier (e.g., component ID, service name). */
  source?: string;
  /** Optional metadata for additional context. */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a specific event type with a defined payload structure.
 * @template E The string literal type for the event (e.g., 'RESOURCE_UPDATED').
 * @template P The type of the payload data associated with this event type.
 */
export interface SpecificEvent<E extends string, P> extends BaseEvent {
  type: E;
  data: TypedEventData<P>;
}

/**
 * Helper type to extract the payload type from a SpecificEvent.
 * @template SE A SpecificEvent type.
 */
export type PayloadType<SE extends SpecificEvent<string, unknown>> =
  SE extends SpecificEvent<string, infer P> ? P : never;

/**
 * Type for defining event maps used by EventEmitters.
 * Maps event type strings to their corresponding payload types.
 * Example: { 'USER_LOGIN': UserData, 'ITEM_PURCHASED': ItemDetails }
 */
export type EventMap = Record<string, unknown>; // Base type, requires refinement or type guards

/**
 * Type-safe event map using SpecificEvent definitions.
 * @template _T A record mapping event type strings to their SpecificEvent types.
 * Example: { 'USER_LOGIN': SpecificEvent<'USER_LOGIN', UserData>, ... }
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TypedEventMap<_T extends Record<string, SpecificEvent<string, unknown>>> = {
  [K in keyof _T]: PayloadType<_T[K]>;
};

// --- Concrete Event Examples (Illustrative) ---

/** Represents user login data. */
export interface UserLoginData {
  userId: string;
  username: string;
}

/** Represents item purchase details. */
export interface ItemPurchaseData {
  itemId: string;
  quantity: number;
  price: number;
}

// Example of a TypedEventMap using these concrete events
export type AppEventMap = {
  USER_LOGIN: SpecificEvent<'USER_LOGIN', UserLoginData>;
  ITEM_PURCHASED: SpecificEvent<'ITEM_PURCHASED', ItemPurchaseData>;
  // Add other application-specific events here
};
