/**
 * @file SharedEventTypes.ts
 * Shared event types barrel file for both production and test code
 *
 * This file provides unified event type exports to:
 * 1. Eliminate "as unknown as" casts in event handling
 * 2. Create consistent interfaces for mocks and real implementations  
 * 3. Provide type-safe event creation and handling
 */

// Re-export key event types from different modules
export type { BaseEvent, EventType } from './EventTypes';
export { hasTypedEventData, isTypedEvent } from './TypedEvent';
export type { SimpleTypedEvent, TypedEvent } from './TypedEvent';

// Re-export event handling types from UnifiedEventSystem
export type { BaseEvent as UnifiedBaseEvent } from '../../lib/events/UnifiedEventSystem';

// Re-export EventBus classes and types from EventBus
export
{
    EventBus,
    TypedEventEmitter
} from '../../lib/events/EventBus';

export type {
    EventHandler,
    EventListener,
    IEventBus,
    IEventEmitter
} from '../../lib/events/EventBus';

// Re-export EventEmitter types
export type { EventHandler as EmitterEventHandler } from '../../lib/events/EventEmitter';

// Re-export UI event types that are also used in SharedEventTypes context  
export { typedEmit, typedSubscribe } from '../ui/EventTypes';
export type {
    EventDataMap, EventEmitter, MockEventBus, PayloadType, SpecificEvent, TypedEventData,
    TypedEventHandler, TypedEventMap, EventBus as UIEventBus
} from '../ui/EventTypes';

// Re-export common types
export type { EventCallback } from '../shared/index';
export type { EventHandler as BaseEventHandler, EventUnsubscribe } from '../TypeUtils';

