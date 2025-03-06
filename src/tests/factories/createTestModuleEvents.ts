import { ModuleType } from '../../types/buildings/ModuleTypes';

/**
 * Test factory for the ModuleEvents system
 *
 * This file provides a test implementation of the ModuleEvents system that behaves
 * like the real implementation but is isolated for testing purposes.
 * It provides the same interface as the real ModuleEvents module plus helper methods
 * for verifying events in tests.
 */

/**
 * Represents all possible event types that can be emitted by modules in the system.
 * This is a copy of the ModuleEventType from the real implementation.
 */
export type ModuleEventType =
  // Lifecycle events
  | 'MODULE_CREATED'
  | 'MODULE_ATTACHED'
  | 'MODULE_DETACHED'
  | 'MODULE_UPGRADED'
  | 'MODULE_ACTIVATED'
  | 'MODULE_DEACTIVATED'
  | 'MODULE_UPDATED'
  // Attachment events
  | 'ATTACHMENT_STARTED'
  | 'ATTACHMENT_CANCELLED'
  | 'ATTACHMENT_COMPLETED'
  | 'ATTACHMENT_PREVIEW_SHOWN'
  // Resource events
  | 'RESOURCE_PRODUCED'
  | 'RESOURCE_CONSUMED'
  | 'RESOURCE_TRANSFERRED'
  | 'RESOURCE_PRODUCTION_REGISTERED'
  | 'RESOURCE_PRODUCTION_UNREGISTERED'
  | 'RESOURCE_CONSUMPTION_REGISTERED'
  | 'RESOURCE_CONSUMPTION_UNREGISTERED'
  | 'RESOURCE_FLOW_REGISTERED'
  | 'RESOURCE_FLOW_UNREGISTERED'
  | 'RESOURCE_SHORTAGE'
  | 'RESOURCE_UPDATED'
  | 'RESOURCE_DISCOVERED'
  // Automation events
  | 'AUTOMATION_STARTED'
  | 'AUTOMATION_STOPPED'
  | 'AUTOMATION_CYCLE_COMPLETE'
  // Status events
  | 'STATUS_CHANGED'
  | 'ERROR_OCCURRED'
  // Mission events
  | 'MISSION_STARTED'
  | 'MISSION_COMPLETED'
  | 'MISSION_FAILED'
  | 'MISSION_PROGRESS_UPDATED'
  | 'MISSION_REWARD_CLAIMED'
  // Sub-module events
  | 'SUB_MODULE_CREATED'
  | 'SUB_MODULE_ATTACHED'
  | 'SUB_MODULE_DETACHED'
  | 'SUB_MODULE_UPGRADED'
  | 'SUB_MODULE_ACTIVATED'
  | 'SUB_MODULE_DEACTIVATED'
  | 'SUB_MODULE_EFFECT_APPLIED'
  | 'SUB_MODULE_EFFECT_REMOVED'
  // Combat events
  | 'COMBAT_UPDATED'
  // Tech events
  | 'TECH_UNLOCKED'
  | 'TECH_UPDATED';

/**
 * Create a constant object with all module event types.
 * This allows us to reference the types as values, not just types.
 */
export const ModuleEventTypeValues = {
  // Lifecycle events
  MODULE_CREATED: 'MODULE_CREATED' as ModuleEventType,
  MODULE_ATTACHED: 'MODULE_ATTACHED' as ModuleEventType,
  MODULE_DETACHED: 'MODULE_DETACHED' as ModuleEventType,
  MODULE_UPGRADED: 'MODULE_UPGRADED' as ModuleEventType,
  MODULE_ACTIVATED: 'MODULE_ACTIVATED' as ModuleEventType,
  MODULE_DEACTIVATED: 'MODULE_DEACTIVATED' as ModuleEventType,
  MODULE_UPDATED: 'MODULE_UPDATED' as ModuleEventType,
  // Attachment events
  ATTACHMENT_STARTED: 'ATTACHMENT_STARTED' as ModuleEventType,
  ATTACHMENT_CANCELLED: 'ATTACHMENT_CANCELLED' as ModuleEventType,
  ATTACHMENT_COMPLETED: 'ATTACHMENT_COMPLETED' as ModuleEventType,
  ATTACHMENT_PREVIEW_SHOWN: 'ATTACHMENT_PREVIEW_SHOWN' as ModuleEventType,
  // Resource events
  RESOURCE_PRODUCED: 'RESOURCE_PRODUCED' as ModuleEventType,
  RESOURCE_CONSUMED: 'RESOURCE_CONSUMED' as ModuleEventType,
  RESOURCE_TRANSFERRED: 'RESOURCE_TRANSFERRED' as ModuleEventType,
  RESOURCE_PRODUCTION_REGISTERED: 'RESOURCE_PRODUCTION_REGISTERED' as ModuleEventType,
  RESOURCE_PRODUCTION_UNREGISTERED: 'RESOURCE_PRODUCTION_UNREGISTERED' as ModuleEventType,
  RESOURCE_CONSUMPTION_REGISTERED: 'RESOURCE_CONSUMPTION_REGISTERED' as ModuleEventType,
  RESOURCE_CONSUMPTION_UNREGISTERED: 'RESOURCE_CONSUMPTION_UNREGISTERED' as ModuleEventType,
  RESOURCE_FLOW_REGISTERED: 'RESOURCE_FLOW_REGISTERED' as ModuleEventType,
  RESOURCE_FLOW_UNREGISTERED: 'RESOURCE_FLOW_UNREGISTERED' as ModuleEventType,
  RESOURCE_SHORTAGE: 'RESOURCE_SHORTAGE' as ModuleEventType,
  RESOURCE_UPDATED: 'RESOURCE_UPDATED' as ModuleEventType,
  RESOURCE_DISCOVERED: 'RESOURCE_DISCOVERED' as ModuleEventType,
  // Automation events
  AUTOMATION_STARTED: 'AUTOMATION_STARTED' as ModuleEventType,
  AUTOMATION_STOPPED: 'AUTOMATION_STOPPED' as ModuleEventType,
  AUTOMATION_CYCLE_COMPLETE: 'AUTOMATION_CYCLE_COMPLETE' as ModuleEventType,
  // Status events
  STATUS_CHANGED: 'STATUS_CHANGED' as ModuleEventType,
  ERROR_OCCURRED: 'ERROR_OCCURRED' as ModuleEventType,
  // Mission events
  MISSION_STARTED: 'MISSION_STARTED' as ModuleEventType,
  MISSION_COMPLETED: 'MISSION_COMPLETED' as ModuleEventType,
  MISSION_FAILED: 'MISSION_FAILED' as ModuleEventType,
  MISSION_PROGRESS_UPDATED: 'MISSION_PROGRESS_UPDATED' as ModuleEventType,
  MISSION_REWARD_CLAIMED: 'MISSION_REWARD_CLAIMED' as ModuleEventType,
  // Sub-module events
  SUB_MODULE_CREATED: 'SUB_MODULE_CREATED' as ModuleEventType,
  SUB_MODULE_ATTACHED: 'SUB_MODULE_ATTACHED' as ModuleEventType,
  SUB_MODULE_DETACHED: 'SUB_MODULE_DETACHED' as ModuleEventType,
  SUB_MODULE_UPGRADED: 'SUB_MODULE_UPGRADED' as ModuleEventType,
  SUB_MODULE_ACTIVATED: 'SUB_MODULE_ACTIVATED' as ModuleEventType,
  SUB_MODULE_DEACTIVATED: 'SUB_MODULE_DEACTIVATED' as ModuleEventType,
  SUB_MODULE_EFFECT_APPLIED: 'SUB_MODULE_EFFECT_APPLIED' as ModuleEventType,
  SUB_MODULE_EFFECT_REMOVED: 'SUB_MODULE_EFFECT_REMOVED' as ModuleEventType,
  // Combat events
  COMBAT_UPDATED: 'COMBAT_UPDATED' as ModuleEventType,
  // Tech events
  TECH_UNLOCKED: 'TECH_UNLOCKED' as ModuleEventType,
  TECH_UPDATED: 'TECH_UPDATED' as ModuleEventType,
};

/**
 * Represents an event emitted by a module in the system.
 * This is a copy of the ModuleEvent interface from the real implementation.
 */
export interface ModuleEvent {
  type: ModuleEventType;
  moduleId: string;
  moduleType: ModuleType;
  timestamp: number;
  data?: Record<string, unknown>;
}

/**
 * Function signature for event listeners that handle module events.
 */
type ModuleEventListener = (event: ModuleEvent) => void;

/**
 * Event bus interface that facilitates module communication through events.
 * This matches the public interface of the real ModuleEventBus.
 */
export interface ModuleEventBus {
  subscribe(type: ModuleEventType, listener: ModuleEventListener): () => void;
  emit(event: ModuleEvent): void;
  getHistory(): ModuleEvent[];
  getModuleHistory(moduleId: string): ModuleEvent[];
  getEventTypeHistory(type: ModuleEventType): ModuleEvent[];
  clearHistory(): void;
}

/**
 * Interface for the test module events factory.
 * Includes the exported values from the real ModuleEvents module
 * plus additional helper methods for testing.
 */
export interface TestModuleEvents {
  ModuleEventType: typeof ModuleEventTypeValues;
  moduleEventBus: ModuleEventBus;

  // Test helper methods
  getEmittedEvents(eventType?: string): ModuleEvent[];
  clearEvents(): void;
  getEventListenerCount(eventType?: string): number;
}

/**
 * Creates a test implementation of the ModuleEvents system.
 *
 * This function returns an object that matches the exports of the real ModuleEvents module
 * but is isolated for testing purposes. It provides the same functionality plus
 * helper methods for verifying events in tests.
 *
 * @returns {TestModuleEvents} An object that can be used to replace the ModuleEvents module in tests
 */
export function createTestModuleEvents(): TestModuleEvents {
  // Storage for events emitted during tests
  const events: ModuleEvent[] = [];

  // Map of event types to listeners
  const listeners: Map<string, Set<ModuleEventListener>> = new Map();

  // Create a real event bus implementation
  const moduleEventBus: ModuleEventBus = {
    /**
     * Subscribes to a specific event type
     */
    subscribe(type: ModuleEventType, listener: ModuleEventListener): () => void {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }

      listeners.get(type)!.add(listener);

      // Return unsubscribe function
      return () => {
        const typeListeners = listeners.get(type);
        if (typeListeners) {
          typeListeners.delete(listener);
          if (typeListeners.size === 0) {
            listeners.delete(type);
          }
        }
      };
    },

    /**
     * Emits an event to all subscribed listeners
     */
    emit(event: ModuleEvent): void {
      // Add to event history
      events.push({ ...event });

      // Notify listeners
      const typeListeners = listeners.get(event.type);
      if (typeListeners) {
        typeListeners.forEach(listener => {
          try {
            listener({ ...event });
          } catch (error) {
            console.error('Error in module event listener:', error);
          }
        });
      }
    },

    /**
     * Gets the complete event history
     */
    getHistory(): ModuleEvent[] {
      return [...events];
    },

    /**
     * Gets events for a specific module
     */
    getModuleHistory(moduleId: string): ModuleEvent[] {
      return events.filter(event => event.moduleId === moduleId);
    },

    /**
     * Gets events of a specific type
     */
    getEventTypeHistory(type: ModuleEventType): ModuleEvent[] {
      return events.filter(event => event.type === type);
    },

    /**
     * Clears the event history
     */
    clearHistory(): void {
      events.length = 0;
    },
  };

  // Return the test implementation
  return {
    // Export the ModuleEventType enum
    ModuleEventType: ModuleEventTypeValues,

    // Export the event bus
    moduleEventBus: {
      ...moduleEventBus,

      // Override the original subscribe method to track subscriptions for later removal
      subscribe(type: ModuleEventType, listener: ModuleEventListener): () => void {
        return moduleEventBus.subscribe(type, listener);
      },
    },

    // Helper methods for testing
    /**
     * Gets events emitted during tests, optionally filtered by type
     */
    getEmittedEvents(eventType?: string): ModuleEvent[] {
      if (eventType) {
        return events.filter(event => event.type === eventType);
      }
      return [...events];
    },

    /**
     * Clears all events and listeners
     */
    clearEvents(): void {
      events.length = 0;

      // Create a new empty map for listeners
      listeners.clear();
    },

    /**
     * Gets the number of listeners for an event type or total listeners
     */
    getEventListenerCount(eventType?: string): number {
      if (eventType) {
        const typeListeners = listeners.get(eventType);
        return typeListeners ? typeListeners.size : 0;
      }

      // Sum all listeners
      let count = 0;
      listeners.forEach(typeListeners => {
        count += typeListeners.size;
      });
      return count;
    },
  };
}
