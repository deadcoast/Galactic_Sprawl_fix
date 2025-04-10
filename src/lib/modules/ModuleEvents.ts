import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';
import { ModuleType } from '../../types/buildings/ModuleTypes';

/**
 * Represents all possible event types that can be emitted by modules in the system.
 *
 * These event types are categorized by their functional area:
 * - Lifecycle events: Monitor the creation, attachment, and activation of modules
 * - Attachment events: Track the process of attaching modules to buildings or other modules
 * - Resource events: Monitor resource production, consumption, and transfers
 * - Automation events: Track automation rule execution and cycles
 * - Status events: Report changes in module status and errors
 * - Mission events: Track mission progress and completions
 * - Sub-module events: Monitor the lifecycle of sub-modules
 * - Combat events: Track combat-related updates
 * - Tech events: Monitor technology unlocks and updates
 *
 * @typedef {string} ModuleEventType
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
 * Represents an event emitted by a module in the system.
 *
 * The ModuleEvent interface defines the structure of events that flow through the
 * event system. Each event must include a type, moduleId, moduleType, and timestamp.
 * Additional data can be included in the optional data property.
 *
 * @interface ModuleEvent
 * @property {ModuleEventType} type - The type of event, indicating what action or state change occurred
 * @property {string} moduleId - Unique identifier of the module that emitted the event
 * @property {ModuleType} moduleType - Type of the module that emitted the event (e.g., 'production', 'storage')
 * @property {number} timestamp - Unix timestamp when the event occurred (milliseconds since epoch)
 * @property {Record<string, unknown>} [data] - Optional additional data relevant to the event
 *
 * @example
 * // Example of a module created event
 * const event: ModuleEvent = {
 *   type: 'MODULE_CREATED',
 *   moduleId: 'mining-module-1',
 *   moduleType: 'production',
 *   timestamp: Date.now(),
 *   data: {
 *     location: { x: 100, y: 200 },
 *     createdBy: 'player'
 *   }
 * };
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
 *
 * @callback ModuleEventListener
 * @param {ModuleEvent} event - The event object containing information about what occurred
 * @returns {void}
 */
type ModuleEventListener = (event: ModuleEvent) => void;

/**
 * Event bus that facilitates module communication through events.
 *
 * The ModuleEventBus provides publish-subscribe functionality for module events,
 * allowing modules to communicate with each other without direct dependencies.
 * It manages event listeners, dispatches events to appropriate listeners,
 * and maintains a history of events for analysis and debugging.
 *
 * @class ModuleEventBus
 */
export class ModuleEventBus {
  /**
   * Map of event types to sets of event listeners.
   * @private
   */
  private listeners: Map<ModuleEventType, Set<ModuleEventListener>>;

  /**
   * Array containing event history, with the most recent events at the end.
   * @private
   */
  private history: ModuleEvent[];

  /**
   * Maximum number of events to keep in history.
   * @private
   */
  private maxHistorySize: number;

  /**
   * Creates a new ModuleEventBus instance.
   *
   * @param {number} [maxHistorySize=1000] - Maximum number of events to keep in history
   */
  constructor(maxHistorySize = 1000) {
    this.listeners = new Map();
    this.history = [];
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Subscribes to a specific type of module event?.
   *
   * This method registers a listener function to be called whenever an event
   * of the specified type is emitted. It returns an unsubscribe function that
   * can be called to remove the listener.
   *
   * @param {ModuleEventType} type - The type of event to subscribe to
   * @param {ModuleEventListener} listener - The function to call when events of this type occur
   * @returns {Function} An unsubscribe function that, when called, removes the listener
   *
   * @example
   * // Subscribe to MODULE_CREATED events
   * const unsubscribe = moduleEventBus.subscribe('MODULE_CREATED', (event) => {
   *   console.warn(`New module created: ${event?.moduleId}`);
   * });
   *
   * // Later, to stop receiving events
   * unsubscribe();
   */
  subscribe(type: ModuleEventType, listener: ModuleEventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)!.add(listener);

    // Return unsubscribe function
    return () => {
      const typeListeners = this.listeners.get(type);
      if (typeListeners) {
        typeListeners.delete(listener);
        if (typeListeners.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  /**
   * Emits an event to all subscribed listeners.
   *
   * This method adds the event to the event history and notifies all listeners
   * subscribed to the event's type. If an error occurs in a listener, it is
   * caught and logged, allowing other listeners to continue receiving the event?.
   *
   * @param {ModuleEvent} event - The event to emit
   * @returns {void}
   *
   * @example
   * // Emit a MODULE_ACTIVATED event
   * moduleEventBus.emit({
   *   type: 'MODULE_ACTIVATED',
   *   moduleId: 'mining-module-1',
   *   moduleType: 'production',
   *   timestamp: Date.now(),
   *   data: { activatedBy: 'player' }
   * });
   */
  emit(event: ModuleEvent): void {
    // Add to history
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Notify listeners
    const typeListeners = this.listeners.get(event?.type);
    if (typeListeners) {
      typeListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          errorLoggingService.logError(
            error instanceof Error ? error : new Error('Error in module event listener'),
            ErrorType.EVENT_HANDLING,
            ErrorSeverity.MEDIUM,
            {
              componentName: 'ModuleEventBus',
              action: 'emit (listener execution)',
              eventType: event?.type,
              moduleId: event?.moduleId,
            }
          );
        }
      });
    }
  }

  /**
   * Retrieves the complete event history.
   *
   * Returns a copy of the entire event history array, preserving the original
   * history in the event bus. Events are ordered from oldest (index 0) to newest.
   *
   * @returns {ModuleEvent[]} Array containing all events in the history
   *
   * @example
   * // Get complete event history and count events by type
   * const history = moduleEventBus.getHistory();
   * const eventCounts = history.reduce((counts, event) => {
   *   counts[event?.type] = (counts[event?.type] ?? 0) + 1;
   *   return counts;
   * }, {});
   * console.warn('Event counts:', eventCounts);
   */
  getHistory(): ModuleEvent[] {
    return [...this.history];
  }

  /**
   * Retrieves event history for a specific module.
   *
   * Filters the event history to return only events related to the specified module ID.
   * Returns a copy of the filtered events, ordered from oldest to newest.
   *
   * @param {string} moduleId - ID of the module to get history for
   * @returns {ModuleEvent[]} Array containing events for the specified module
   *
   * @example
   * // Get history for a specific module and analyze its lifecycle
   * const moduleHistory = moduleEventBus.getModuleHistory('mining-module-1');
   * const creationEvent = moduleHistory.find(event => event?.type === 'MODULE_CREATED');
   * if (creationEvent) {
   *   console.warn(`Module created at: ${new Date(creationEvent.timestamp).toLocaleString()}`);
   * }
   */
  getModuleHistory(moduleId: string): ModuleEvent[] {
    return this.history.filter(event => event?.moduleId === moduleId);
  }

  /**
   * Retrieves event history for a specific event type.
   *
   * Filters the event history to return only events of the specified type.
   * Returns a copy of the filtered events, ordered from oldest to newest.
   *
   * @param {ModuleEventType} type - Type of events to retrieve
   * @returns {ModuleEvent[]} Array containing events of the specified type
   *
   * @example
   * // Get all resource shortage events and identify affected resources
   * const shortages = moduleEventBus.getEventTypeHistory('RESOURCE_SHORTAGE');
   * const affectedResources = shortages.map(event => event?.data?.resourceType).filter(Boolean);
   * console.warn('Resources with shortages:', affectedResources);
   */
  getEventTypeHistory(type: ModuleEventType): ModuleEvent[] {
    return this.history.filter(event => event?.type === type);
  }

  /**
   * Clears the entire event history.
   *
   * This method removes all events from the history array. This can be useful
   * for managing memory usage or resetting the state for testing.
   *
   * @returns {void}
   *
   * @example
   * // Clear event history at the start of a new game session
   * moduleEventBus.clearHistory();
   */
  clearHistory(): void {
    this.history = [];
  }
}

/**
 * Singleton instance of the ModuleEventBus.
 *
 * This exported instance should be used throughout the application to ensure
 * that all modules communicate through the same event bus.
 *
 * @type {ModuleEventBus}
 *
 * @example
 * import { moduleEventBus } from '../../lib/modules/ModuleEvents';
 *
 * // Subscribe to events
 * moduleEventBus.subscribe('MODULE_ACTIVATED', handleModuleActivated);
 *
 * // Emit events
 * moduleEventBus.emit({
 *   type: 'MODULE_ACTIVATED',
 *   moduleId: 'mining-module-1',
 *   moduleType: 'production',
 *   timestamp: Date.now()
 * });
 */
export const moduleEventBus = new ModuleEventBus();
