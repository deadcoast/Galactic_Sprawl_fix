/**
 * @file ModuleEventBus.ts
 * Standardized implementation of the ModuleEventBus using the new EventBus base class.
 *
 * This file maintains backcombatd compatibility with the original ModuleEvents.ts
 * while leveraging the new standardized architecture.
 */

import { v4 as uuidv4 } from 'uuid';
import
  {
    errorLoggingService,
    ErrorSeverity,
    ErrorType,
  } from '../../services/logging/ErrorLoggingService';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { EventType } from '../../types/events/EventTypes';
import
  {
    isValidModuleStatusEventData,
    isValidPopulationEventData,
    isValidResourceEventData,
    isValidStandardizedEvent,
    isValidTradeRouteEventData,
    StandardizedEvent,
  } from '../../types/events/StandardizedEvents';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { EventBus, EventListener, SubscriptionOptions } from './EventBus';

/**
 * Legacy type definition for ModuleEvent
 * Kept for backcombatd compatibility
 */
export type ModuleEvent = StandardizedEvent;

/**
 * Type for event data that can be emitted
 */
export type EventData = Record<string, unknown>;

/**
 * Singleton instance of the ModuleEventBus
 */
class ModuleEventBus extends EventBus<ModuleEvent> {
  private static instance: ModuleEventBus;

  private constructor() {
    super();
  }

  public static getInstance(): ModuleEventBus {
    if (!ModuleEventBus.instance) {
      ModuleEventBus.instance = new ModuleEventBus();
    }
    return ModuleEventBus.instance;
  }

  /**
   * Emit an event with runtime validation
   */
  public override emit(event: ModuleEvent): void;
  public override emit<T extends EventData>(eventName: string, data: T): void;
  public override emit<T extends EventData>(eventOrName: ModuleEvent | string, data?: T): void {
    if (typeof eventOrName === 'string' && data !== undefined) {
      // Handle string event name with data by creating a ModuleEvent
      const event: ModuleEvent = {
        id: uuidv4(),
        type: eventOrName as EventType,
        name: eventOrName as EventType,
        description: eventOrName as EventType,
        category: eventOrName as EventType,
        subCategory: eventOrName as EventType,
        timestamp: Date.now(),
        moduleId: (data as { moduleId?: string })?.moduleId ?? 'unknown',
        moduleType: (data as { moduleType?: ModuleType })?.moduleType ?? 'radar',
        data: data as Record<string, unknown>,
      };
      super.emit(event);
      return;
    }

    // Handle ModuleEvent
    const event = eventOrName as ModuleEvent;
    if (!isValidStandardizedEvent(event)) {
      errorLoggingService.logError(
        new Error(`Invalid event structure: ${JSON.stringify(event)}`),
        ErrorType.EVENT_HANDLING,
        ErrorSeverity.MEDIUM,
        { componentName: 'ModuleEventBus', action: 'emit' }
      );
      return;
    }

    // Validate event data based on event type
    if (event?.data) {
      let isValid = true;
      switch (event?.type) {
        case EventType.RESOURCE_PRODUCED:
        case EventType.RESOURCE_CONSUMED:
        case EventType.RESOURCE_UPDATED:
          isValid = isValidResourceEventData(event?.data);
          break;
        case EventType.MODULE_UPDATED:
          if (event?.moduleType === ResourceType.POPULATION) {
            isValid = isValidPopulationEventData(event?.data);
          }
          break;
        case EventType.MODULE_STATUS_CHANGED:
          isValid = isValidModuleStatusEventData(event?.data);
          break;
        case EventType.RESOURCE_TRANSFERRED:
          isValid = isValidTradeRouteEventData(event?.data);
          break;
      }

      if (!isValid) {
        errorLoggingService.logError(
          new Error(
            `Invalid event data for type: ${event?.type} Data: ${JSON.stringify(event?.data)}`
          ),
          ErrorType.EVENT_HANDLING,
          ErrorSeverity.MEDIUM,
          { componentName: 'ModuleEventBus', action: 'emit', eventType: event?.type }
        );
        return;
      }
    }

    super.emit(event);
  }

  /**
   * Subscribe to events with optional filtering
   */
  public override subscribe(
    eventType: EventType | '*',
    listener: EventListener<ModuleEvent>,
    options?: SubscriptionOptions & { moduleId?: string; moduleType?: ModuleType }
  ): () => void {
    const wrappedListener: EventListener<ModuleEvent> = (event: ModuleEvent) => {
      if (options?.moduleId && event?.moduleId !== options?.moduleId) {
        return;
      }
      if (options?.moduleType && event?.moduleType !== options?.moduleType) {
        return;
      }
      listener(event);
    };

    return super.subscribe(eventType, wrappedListener, options);
  }

  /**
   * Subscribe to multiple event types with a single listener
   *
   * @param eventTypes Array of event types to subscribe to
   * @param listener Event listener function
   * @param options Subscription options
   * @returns Function to unsubscribe from all events
   */
  public subscribeToMunknown(
    eventTypes: EventType[],
    listener: EventListener<ModuleEvent>,
    options?: SubscriptionOptions & { moduleId?: string; moduleType?: ModuleType }
  ): () => void {
    // Create array to hold all unsubscribe functions
    const unsubscribers: (() => void)[] = [];

    // Subscribe to each event type
    for (const eventType of eventTypes) {
      const unsubscribe = this.subscribe(eventType, listener, options);
      unsubscribers.push(unsubscribe);
    }

    // Return a function that unsubscribes from all event types
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }
}

export const moduleEventBus = ModuleEventBus.getInstance();
