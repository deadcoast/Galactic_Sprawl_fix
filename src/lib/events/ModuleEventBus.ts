/**
 * @file ModuleEventBus.ts
 * Standardized implementation of the ModuleEventBus using the new EventBus base class.
 *
 * This file maintains backward compatibility with the original ModuleEvents.ts
 * while leveraging the new standardized architecture.
 */

import { ModuleType } from '../../types/buildings/ModuleTypes';
import {
  BaseEvent,
  EventType,
  createEvent,
  stringToEventType,
} from '../../types/events/EventTypes';
import { EventBus, EventListener } from './EventBus';

/**
 * Legacy type definition for ModuleEvent
 * Kept for backward compatibility
 */
export interface ModuleEvent extends BaseEvent {
  moduleId: string;
  moduleType: ModuleType;
  timestamp: number;
  data?: Record<string, unknown>;
}

/**
 * Legacy type definition for ModuleEventType
 * Kept for backward compatibility
 */
export type ModuleEventType = string;

/**
 * Legacy type definition for ModuleEventListener
 * Kept for backward compatibility
 */
export type ModuleEventListener = EventListener<ModuleEvent>;

/**
 * ModuleEventBus extension of the base EventBus class
 * Provides backward compatibility with the original ModuleEventBus implementation
 */
export class ModuleEventBus extends EventBus<ModuleEvent> {
  /**
   * Subscribe to a module event type
   * This method maintains the original API for backward compatibility
   *
   * @param type The type of event to subscribe to (string version)
   * @param listener The function to call when events of this type occur
   * @returns A function that, when called, unsubscribes the listener
   */
  subscribe(type: ModuleEventType | '*', listener: ModuleEventListener): () => void {
    // Convert string type to enum if possible
    const eventType =
      type !== '*' ? stringToEventType(type) || (type as unknown as EventType) : '*';

    // Call the parent class subscribe method
    return super.subscribe(eventType, listener, {
      source: 'LegacyModuleEventBus',
    });
  }

  /**
   * Legacy method to maintain compatibility
   * @deprecated Use the function returned by subscribe instead
   */
  legacyUnsubscribe(type: ModuleEventType, listener: ModuleEventListener): void {
    console.warn(
      '[ModuleEventBus] unsubscribe method is deprecated. Use the returned function from subscribe instead.'
    );
    // This method can't be properly implemented with the new architecture
    // The proper approach is to use the function returned by subscribe
  }

  /**
   * Emit a module event
   * This method maintains the original API for backward compatibility
   *
   * @param event The module event to emit
   */
  emit(event: ModuleEvent): void {
    // Ensure event type is a valid EventType enum
    const eventType =
      stringToEventType(event.type.toString()) || (event.type as unknown as EventType);

    // Create a standardized event
    const standardizedEvent: ModuleEvent = {
      ...event,
      type: eventType,
    };

    // Call the parent class emit method
    super.emit(standardizedEvent);
  }

  /**
   * Create and emit a module event in one step
   *
   * @param type The type of event to emit
   * @param moduleId ID of the module emitting the event
   * @param moduleType Type of the module emitting the event
   * @param data Additional data for the event
   */
  emitEvent<T extends Record<string, unknown>>(
    type: EventType | string,
    moduleId: string,
    moduleType: ModuleType,
    data?: T
  ): void {
    const event = createEvent(type, moduleId, moduleType, data);
    this.emit(event as ModuleEvent);
  }

  /**
   * Get module history (maintains backward compatibility)
   *
   * @param moduleId The ID of the module to get history for
   * @returns An array of events for the specified module
   */
  getModuleHistory(moduleId: string): ModuleEvent[] {
    return super.getModuleHistory(moduleId);
  }

  /**
   * Get event type history (maintains backward compatibility)
   *
   * @param type The type of event to get history for
   * @returns An array of events of the specified type
   */
  getEventTypeHistory(type: ModuleEventType): ModuleEvent[] {
    const eventType = stringToEventType(type) || (type as unknown as EventType);
    return super.getEventHistory(eventType);
  }

  /**
   * Clear history (maintains backward compatibility)
   */
  clearHistory(): void {
    super.clearHistory();
  }
}

/**
 * Singleton instance of the ModuleEventBus
 * This maintains the same export pattern as the original ModuleEvents.ts
 */
export const moduleEventBus = new ModuleEventBus();

/**
 * Re-export types from EventTypes.ts for backward compatibility
 */
export type {
  EventCategory,
  EventType,
  BaseEvent as StandardizedModuleEvent,
} from '../../types/events/EventTypes';
