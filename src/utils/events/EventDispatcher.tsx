import { ResourceType } from "./../../types/resources/ResourceTypes";
import * as React from "react";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { ModuleEvent, moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';

/**
 * Interface defining the context type for the EventDispatcher.
 * Provides methods for subscribing to events, emitting events, accessing event history,
 * filtering events, and accessing the latest events by type.
 *
 * @interface EventDispatcherContextType
 * @property {Function} subscribe - Function to subscribe to specific event types
 * @property {Function} emit - Function to emit events to the event bus
 * @property {Function} getHistory - Function to get the complete event history
 * @property {Function} getModuleHistory - Function to get events for a specific module
 * @property {Function} getEventTypeHistory - Function to get events of a specific type
 * @property {Function} clearHistory - Function to clear the event history
 * @property {Function} getFilteredEvents - Function to get events matching a filter function
 * @property {Map<ModuleEventType, ModuleEvent>} latestEvents - Map of the most recent event of each type
 */
interface EventDispatcherContextType {
  // Event subscription
  subscribe: (type: ModuleEventType, listener: (event: ModuleEvent) => void) => () => void;

  // Event emission
  emit: (event: ModuleEvent) => void;

  // Event history
  getHistory: () => ModuleEvent[];
  getModuleHistory: (moduleId: string) => ModuleEvent[];
  getEventTypeHistory: (type: ModuleEventType) => ModuleEvent[];
  clearHistory: () => void;

  // Event filtering
  getFilteredEvents: (filter: (event: ModuleEvent) => boolean) => ModuleEvent[];

  // Latest events by type
  latestEvents: Map<ModuleEventType, ModuleEvent>;
}

/**
 * Props for the EventDispatcherProvider component.
 *
 * @interface EventDispatcherProviderProps
 * @property {ReactNode} children - Child components that will have access to the event context
 * @property {number} [__maxHistorySize=1000] - Maximum number of events to keep in history
 */
interface EventDispatcherProviderProps {
  children: ReactNode;
  /**
   * Maximum number of events to keep in history
   * Controls the maximum size of the event history to prevent excessive memory usage
   */
  __maxHistorySize?: number;
}

/**
 * React Context for the EventDispatcher.
 * Initially set to null and properly initialized in the EventDispatcherProvider.
 */
const EventDispatcherContext = createContext<EventDispatcherContextType | null>(null);

/**
 * Provider component for the event dispatcher system.
 *
 * This component sets up a React context that provides access to the event system
 * throughout the component tree. It handles:
 * - Tracking the latest events by type
 * - Managing history size limits
 * - Subscribing to events from the underlying moduleEventBus
 * - Providing methods to interact with the event system
 *
 * All components that need to work with events should be descendants of this provider.
 *
 * @component
 * @example
 * // In your application's root component
 * import { EventDispatcherProvider } from '../utils/events/EventDispatcher';
 *
 * const App = () => {
 *   return (
 *     <EventDispatcherProvider>
 *       <YourComponents />
 *     </EventDispatcherProvider>
 *   );
 * };
 */
export const EventDispatcherProvider: React.FC<EventDispatcherProviderProps> = ({
  children,
  __maxHistorySize = 1000,
}) => {
  // Store the latest event of each type
  const [latestEvents, setLatestEvents] = useState<Map<ModuleEventType, ModuleEvent>>(new Map());

  // Reference to track the current max history size
  const maxHistorySizeRef = useRef<number>(__maxHistorySize);

  // Update the ref when the prop changes
  useEffect(() => {
    maxHistorySizeRef.current = __maxHistorySize;
    console.warn(`[EventDispatcher] Setting max history size to ${__maxHistorySize}`);

    // Update the moduleEventBus maxHistorySize if possible
    // Note: This is a workaround since we can't directly access the private property
    try {
      // @ts-expect-error - Accessing private property for configuration
      if (moduleEventBus.maxHistorySize !== undefined) {
        // @ts-expect-error - Accessing private property for configuration
        moduleEventBus.maxHistorySize = __maxHistorySize;
        console.warn(
          `[EventDispatcher] Updated moduleEventBus history size to ${__maxHistorySize}`
        );
      }
    } catch (error) {
      console.warn('[EventDispatcher] Could not update moduleEventBus history size:', error);
    }
  }, [__maxHistorySize]);

  // Subscribe to all module events
  useEffect(() => {
    // Create a handler for all events
    const handleEvent = (event: ModuleEvent) => {
      setLatestEvents(prev => {
        const newMap = new Map(prev);
        newMap.set(event.type, event);
        return newMap;
      });
    };

    // Get all possible event types
    const eventTypes: ModuleEventType[] = [
      'MODULE_CREATED',
      'MODULE_ATTACHED',
      'MODULE_DETACHED',
      'MODULE_UPGRADED',
      'MODULE_ACTIVATED',
      'MODULE_DEACTIVATED',
      'ATTACHMENT_STARTED',
      'ATTACHMENT_CANCELLED',
      'ATTACHMENT_COMPLETED',
      'ATTACHMENT_PREVIEW_SHOWN',
      'RESOURCE_PRODUCED',
      'RESOURCE_CONSUMED',
      'RESOURCE_TRANSFERRED',
      'RESOURCE_PRODUCTION_REGISTERED',
      'RESOURCE_PRODUCTION_UNREGISTERED',
      'RESOURCE_CONSUMPTION_REGISTERED',
      'RESOURCE_CONSUMPTION_UNREGISTERED',
      'RESOURCE_FLOW_REGISTERED',
      'RESOURCE_FLOW_UNREGISTERED',
      'RESOURCE_SHORTAGE',
      'AUTOMATION_STARTED',
      'AUTOMATION_STOPPED',
      'AUTOMATION_CYCLE_COMPLETE',
      'STATUS_CHANGED',
      'ERROR_OCCURRED',
      'MISSION_STARTED',
      'MISSION_COMPLETED',
      'MISSION_FAILED',
      'MISSION_PROGRESS_UPDATED',
      'MISSION_REWARD_CLAIMED',
      'SUB_MODULE_CREATED',
      'SUB_MODULE_ATTACHED',
      'SUB_MODULE_DETACHED',
      'SUB_MODULE_UPGRADED',
      'SUB_MODULE_ACTIVATED',
      'SUB_MODULE_DEACTIVATED',
      'SUB_MODULE_EFFECT_APPLIED',
      'SUB_MODULE_EFFECT_REMOVED',
    ];

    // Subscribe to all event types
    const unsubscribers = eventTypes.map(type => moduleEventBus.subscribe(type, handleEvent));

    // Cleanup subscriptions
    return () => {
      unsubscribers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, []);

  // Context value
  const value: EventDispatcherContextType = {
    // Event subscription - delegate to moduleEventBus
    subscribe: (type, listener) => moduleEventBus.subscribe(type, listener),

    // Event emission - delegate to moduleEventBus
    emit: event => moduleEventBus.emit(event),

    // Event history - delegate to moduleEventBus with size limit
    getHistory: () => {
      const history = moduleEventBus.getHistory();
      // Apply our own size limit if the history is too large
      return history.length > maxHistorySizeRef.current
        ? history.slice(history.length - maxHistorySizeRef.current)
        : history;
    },
    getModuleHistory: moduleId => {
      const history = moduleEventBus.getModuleHistory(moduleId);
      // Apply our own size limit if the history is too large
      return history.length > maxHistorySizeRef.current
        ? history.slice(history.length - maxHistorySizeRef.current)
        : history;
    },
    getEventTypeHistory: type => {
      const history = moduleEventBus.getEventTypeHistory(type);
      // Apply our own size limit if the history is too large
      return history.length > maxHistorySizeRef.current
        ? history.slice(history.length - maxHistorySizeRef.current)
        : history;
    },
    clearHistory: () => moduleEventBus.clearHistory(),

    // Event filtering with size limit
    getFilteredEvents: filter => {
      const history = moduleEventBus.getHistory();
      const filtered = history.filter(filter);
      // Apply our own size limit if the filtered history is too large
      return filtered.length > maxHistorySizeRef.current
        ? filtered.slice(filtered.length - maxHistorySizeRef.current)
        : filtered;
    },

    // Latest events by type
    latestEvents,
  };

  return (
    <EventDispatcherContext.Provider value={value}>{children}</EventDispatcherContext.Provider>
  );
};

/**
 * Hook to access the event dispatcher context.
 *
 * Provides access to all event operations such as subscribing to events,
 * emitting events, accessing event history, and viewing the latest events.
 *
 * @returns {EventDispatcherContextType} The event dispatcher context
 * @throws {Error} If used outside of an EventDispatcherProvider
 *
 * @example
 * const MyComponent = () => {
 *   const { emit, getHistory } = useEventDispatcher();
 *
 *   const handleButtonClick = () => {
 *     emit({
 *       type: 'MODULE_ACTIVATED',
 *       moduleId: 'module-1',
 *       moduleType: 'production',
 *       timestamp: Date.now()
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleButtonClick}>Activate Module</button>
 *       <div>Total Events: {getHistory().length}</div>
 *     </div>
 *   );
 * };
 */
export const useEventDispatcher = (): EventDispatcherContextType => {
  const context = useContext(EventDispatcherContext);

  if (!context) {
    throw new Error('useEventDispatcher must be used within an EventDispatcherProvider');
  }

  return context;
};

/**
 * Hook to subscribe to a specific event type.
 *
 * This hook simplifies the process of subscribing to events by automatically
 * handling subscription and cleanup. The callback will be called whenever
 * an event of the specified type is emitted.
 *
 * @template T - The specific event type to subscribe to
 * @param {T} eventType - The event type to subscribe to
 * @param {Function} callback - Function to call when an event of this type occurs
 * @param {React.DependencyList} [deps=[]] - Additional dependencies for the effect
 *
 * @example
 * // Subscribe to MODULE_CREATED events
 * const ModuleTracker = () => {
 *   const [moduleCount, setModuleCount] = useState(0);
 *
 *   useEventSubscription('MODULE_CREATED', (event) => {
 *     setModuleCount(prev => prev + 1);
 *     console.warn(`New module created: ${event.moduleId}`);
 *   });
 *
 *   return <div>Total modules created: {moduleCount}</div>;
 * };
 */
export const useEventSubscription = <T extends ModuleEventType>(
  eventType: T,
  callback: (event: ModuleEvent) => void,
  deps: React.DependencyList = []
): void => {
  const { subscribe } = useEventDispatcher();

  useEffect(() => {
    return subscribe(eventType, callback);
  }, [eventType, callback, subscribe, ...deps]);
};

/**
 * Hook to get the latest event of a specific type.
 *
 * Retrieves the most recent event of the specified type that has been
 * emitted in the system. Returns undefined if no event of that type
 * has been emitted yet.
 *
 * @template T - The specific event type to query
 * @param {T} eventType - The event type to get the latest event for
 * @returns {ModuleEvent | undefined} The latest event of the specified type, or undefined if none exists
 *
 * @example
 * // Display information about the most recent error
 * const ErrorDisplay = () => {
 *   const latestError = useLatestEvent('ERROR_OCCURRED');
 *
 *   if (!latestError) {
 *     return <div>No errors reported</div>;
 *   }
 *
 *   return (
 *     <div className="error-panel">
 *       <h3>Latest Error</h3>
 *       <p>Module: {latestError.moduleId}</p>
 *       <p>Time: {new Date(latestError.timestamp).toLocaleString()}</p>
 *       <p>Message: {latestError.data?.message || 'Unknown error'}</p>
 *     </div>
 *   );
 * };
 */
export const useLatestEvent = <T extends ModuleEventType>(
  eventType: T
): ModuleEvent | undefined => {
  const { latestEvents } = useEventDispatcher();
  return latestEvents.get(eventType);
};

/**
 * Hook to get events that match a filter function.
 *
 * Allows for complex event filtering beyond just module ID or event type.
 * Automatically updates when new events are emitted that match the filter.
 *
 * @param {Function} filter - Filter function that returns true for events to include
 * @param {React.DependencyList} [deps=[]] - Additional dependencies for the effect
 * @returns {ModuleEvent[]} Array of events that match the filter
 *
 * @example
 * // Display all resource shortage events from the last hour
 * const ResourceShortageMonitor = () => {
 *   const oneHourAgo = Date.now() - 3600000;
 *
 *   const recentShortages = useFilteredEvents(
 *     (event) => (
 *       event.type === 'RESOURCE_SHORTAGE' &&
 *       event.timestamp > oneHourAgo
 *     ),
 *     [oneHourAgo] // Update when oneHourAgo changes
 *   );
 *
 *   return (
 *     <div>
 *       <h3>Recent Resource Shortages: {recentShortages.length}</h3>
 *       <ul>
 *         {recentShortages.map(event => (
 *           <li key={event.timestamp}>
 *             {event.data?.resourceType}: {new Date(event.timestamp).toLocaleTimeString()}
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * };
 */
export const useFilteredEvents = (
  filter: (event: ModuleEvent) => boolean,
  deps: React.DependencyList = []
): ModuleEvent[] => {
  const { getFilteredEvents } = useEventDispatcher();
  const [filteredEvents, setFilteredEvents] = useState<ModuleEvent[]>([]);

  useEffect(() => {
    setFilteredEvents(getFilteredEvents(filter));
  }, [getFilteredEvents, filter, ...deps]);

  return filteredEvents;
};
