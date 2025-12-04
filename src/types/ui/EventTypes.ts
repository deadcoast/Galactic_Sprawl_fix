import { EventHandler as BaseEventHandler, EventUnsubscribe } from '../TypeUtils';
import { TypedEvent } from '../events/TypedEvent';

/**
 * @file SharedEventTypes.ts
 * Shared event types and interfaces for both production and test code
 *
 * This file provides unified event types to:
 * 1. Eliminate "as unknown as" casts in event handling
 * 2. Create consistent interfaces for mocks and real implementations
 * 3. Provide type-safe event creation and handling
 */


/**
 * @context: ui-system, type-definitions, event-system
 *
 * UI-specific event type definitions
 */

/**
 * UI-specific event types
 */
export enum UIEventType {
  // Theme events
  THEME_CHANGED = 'THEME_CHANGED',
  THEME_MODE_CHANGED = 'THEME_MODE_CHANGED',

  // Component events
  COMPONENT_MOUNTED = 'COMPONENT_MOUNTED',
  COMPONENT_UPDATED = 'COMPONENT_UPDATED',
  COMPONENT_UNMOUNTED = 'COMPONENT_UNMOUNTED',

  // Modal events
  MODAL_OPENED = 'MODAL_OPENED',
  MODAL_CLOSED = 'MODAL_CLOSED',

  // Form events
  FORM_SUBMITTED = 'FORM_SUBMITTED',
  FORM_VALIDATED = 'FORM_VALIDATED',
  FORM_VALIDATION_ERROR = 'FORM_VALIDATION_ERROR',
  FORM_RESET = 'FORM_RESET',

  // Navigation events
  NAVIGATION_STARTED = 'NAVIGATION_STARTED',
  NAVIGATION_COMPLETED = 'NAVIGATION_COMPLETED',
  NAVIGATION_FAILED = 'NAVIGATION_FAILED',

  // Animation events
  ANIMATION_STARTED = 'ANIMATION_STARTED',
  ANIMATION_COMPLETED = 'ANIMATION_COMPLETED',
  ANIMATION_CANCELLED = 'ANIMATION_CANCELLED',

  // Interaction events
  DRAG_STARTED = 'DRAG_STARTED',
  DRAG_MOVED = 'DRAG_MOVED',
  DRAG_ENDED = 'DRAG_ENDED',
  HOVER_STARTED = 'HOVER_STARTED',
  HOVER_ENDED = 'HOVER_ENDED',
  PRESS_STARTED = 'PRESS_STARTED',
  PRESS_ENDED = 'PRESS_ENDED',
  FOCUS_CHANGED = 'FOCUS_CHANGED',

  // UI state events
  UI_STATE_CHANGED = 'UI_STATE_CHANGED',
  UI_VIEW_CHANGED = 'UI_VIEW_CHANGED',
  UI_LAYOUT_CHANGED = 'UI_LAYOUT_CHANGED',
  UI_BREAKPOINT_CHANGED = 'UI_BREAKPOINT_CHANGED',

  // Notification events
  NOTIFICATION_SHOWN = 'NOTIFICATION_SHOWN',
  NOTIFICATION_HIDDEN = 'NOTIFICATION_HIDDEN',

  // Error events
  UI_ERROR_OCCURRED = 'UI_ERROR_OCCURRED',
}

/**
 * Base interface for all UI events
 */
export interface UIEvent {
  type: UIEventType;
  timestamp: number;
  source?: string;
  data?: Record<string, unknown>;
}

/**
 * Theme changed event data
 */
export interface ThemeChangedEvent extends UIEvent {
  type: UIEventType.THEME_CHANGED;
  data: {
    themeName: string;
    previousThemeName?: string;
  };
}

/**
 * Theme mode changed event data
 */
export interface ThemeModeChangedEvent extends UIEvent {
  type: UIEventType.THEME_MODE_CHANGED;
  data: {
    mode: 'light' | 'dark' | 'system';
    previousMode?: 'light' | 'dark' | 'system';
  };
}

/**
 * Component lifecycle event data
 */
export interface ComponentLifecycleEvent extends UIEvent {
  type:
    | UIEventType.COMPONENT_MOUNTED
    | UIEventType.COMPONENT_UPDATED
    | UIEventType.COMPONENT_UNMOUNTED;
  data: {
    componentId: string;
    componentType: string;
    props?: Record<string, unknown>;
  };
}

/**
 * Modal event data
 */
export interface ModalEvent extends UIEvent {
  type: UIEventType.MODAL_OPENED | UIEventType.MODAL_CLOSED;
  data: {
    modalId: string;
    modalType?: string;
    params?: Record<string, unknown>;
  };
}

/**
 * Form event data
 */
export interface FormEvent extends UIEvent {
  type:
    | UIEventType.FORM_SUBMITTED
    | UIEventType.FORM_VALIDATED
    | UIEventType.FORM_VALIDATION_ERROR
    | UIEventType.FORM_RESET;
  data: {
    formId: string;
    formData?: Record<string, unknown>;
    validationErrors?: Record<string, string[]>;
  };
}

/**
 * Navigation event data
 */
export interface NavigationEvent extends UIEvent {
  type:
    | UIEventType.NAVIGATION_STARTED
    | UIEventType.NAVIGATION_COMPLETED
    | UIEventType.NAVIGATION_FAILED;
  data: {
    from?: string;
    to: string;
    params?: Record<string, unknown>;
    error?: string;
  };
}

/**
 * Animation event data
 */
export interface AnimationEvent extends UIEvent {
  type:
    | UIEventType.ANIMATION_STARTED
    | UIEventType.ANIMATION_COMPLETED
    | UIEventType.ANIMATION_CANCELLED;
  data: {
    animationId: string;
    elementId?: string;
    animationType?: string;
    duration?: number;
  };
}

/**
 * Drag event data
 */
export interface DragEvent extends UIEvent {
  type: UIEventType.DRAG_STARTED | UIEventType.DRAG_MOVED | UIEventType.DRAG_ENDED;
  data: {
    elementId: string;
    position: { x: number; y: number };
    delta?: { x: number; y: number };
    source?: string;
    target?: string;
  };
}

/**
 * Hover event data
 */
export interface HoverEvent extends UIEvent {
  type: UIEventType.HOVER_STARTED | UIEventType.HOVER_ENDED;
  data: {
    elementId: string;
    position?: { x: number; y: number };
  };
}

/**
 * UI state changed event data
 */
export interface UIStateChangedEvent extends UIEvent {
  type: UIEventType.UI_STATE_CHANGED;
  data: {
    stateKey: string;
    oldValue?: unknown;
    newValue: unknown;
  };
}

/**
 * UI error event data
 */
export interface UIErrorEvent extends UIEvent {
  type: UIEventType.UI_ERROR_OCCURRED;
  data: {
    errorCode: string;
    message: string;
    componentId?: string;
    stack?: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Notification event data
 */
export interface NotificationEvent extends UIEvent {
  type: UIEventType.NOTIFICATION_SHOWN | UIEventType.NOTIFICATION_HIDDEN;
  data: {
    notificationId: string;
    notificationType: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration?: number;
  };
}

/**
 * Type guard for checking if an event is a UIEvent
 */
export function isUIEvent(event: unknown): event is UIEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'type' in event &&
    'timestamp' in event &&
    Object.values(UIEventType).includes((event as UIEvent).type)
  );
}

/**
 * Type guard for checking if an event is a theme changed event
 */
export function isThemeChangedEvent(event: UIEvent): event is ThemeChangedEvent {
  return (
    event.type === UIEventType.THEME_CHANGED &&
    event.data !== undefined &&
    typeof event.data === 'object' &&
    'themeName' in event.data
  );
}

/**
 * Type guard for checking if an event is a theme mode changed event
 */
export function isThemeModeChangedEvent(event: UIEvent): event is ThemeModeChangedEvent {
  return (
    event.type === UIEventType.THEME_MODE_CHANGED &&
    event.data !== undefined &&
    typeof event.data === 'object' &&
    'mode' in event.data
  );
}

/**
 * Type guard for checking if an event is a component lifecycle event
 */
export function isComponentLifecycleEvent(event: UIEvent): event is ComponentLifecycleEvent {
  return (
    (event.type === UIEventType.COMPONENT_MOUNTED ||
      event.type === UIEventType.COMPONENT_UPDATED ||
      event.type === UIEventType.COMPONENT_UNMOUNTED) &&
    event.data !== undefined &&
    typeof event.data === 'object' &&
    'componentId' in event.data &&
    'componentType' in event.data
  );
}

/**
 * Type guard for checking if an event is a modal event
 */
export function isModalEvent(event: UIEvent): event is ModalEvent {
  return (
    (event.type === UIEventType.MODAL_OPENED || event.type === UIEventType.MODAL_CLOSED) &&
    event.data !== undefined &&
    typeof event.data === 'object' &&
    'modalId' in event.data
  );
}

/**
 * Type guard for checking if an event is a UI error event
 */
export function isUIErrorEvent(event: UIEvent): event is UIErrorEvent {
  return (
    event.type === UIEventType.UI_ERROR_OCCURRED &&
    event.data !== undefined &&
    typeof event.data === 'object' &&
    'errorCode' in event.data &&
    'message' in event.data
  );
}

/**
 * Creates a UI event with the specified type and data
 */
export function createUIEvent<T extends UIEventType>(
  type: T,
  data?: Record<string, unknown>,
  source?: string
): UIEvent {
  return {
    type,
    timestamp: Date.now(),
    source,
    data,
  };
}

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
  getSubscriptions(): Map<string, EventHandler<E>[]>;
  reset(): void;
}

/**
 * Type-safe event creator - ensures proper event structure
 */
export function createEvent<T extends string, D>(type: T, data?: D): TypedEvent<T, D | undefined> {
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
export function isEventOfType<T extends string>(event: BaseEvent, type: T): event is BaseEvent & TypedEvent<T, unknown> {
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
export type EventDataMap = Record<string, unknown>;

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
export type BaseEventData = Record<string, unknown>;

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
export interface AppEventMap {
  USER_LOGIN: SpecificEvent<'USER_LOGIN', UserLoginData>;
  ITEM_PURCHASED: SpecificEvent<'ITEM_PURCHASED', ItemPurchaseData>;
  // Add other application-specific events here
}
