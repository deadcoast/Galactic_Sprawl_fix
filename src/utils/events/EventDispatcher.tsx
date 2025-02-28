import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ModuleEventType, ModuleEvent, moduleEventBus } from '../../lib/modules/ModuleEvents';

/**
 * Event dispatcher context interface
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
 * Event dispatcher provider props
 */
interface EventDispatcherProviderProps {
  children: ReactNode;
  maxHistorySize?: number;
}

// Create the context with a default value
const EventDispatcherContext = createContext<EventDispatcherContextType | null>(null);

/**
 * Event dispatcher provider component
 */
export const EventDispatcherProvider: React.FC<EventDispatcherProviderProps> = ({ 
  children, 
  maxHistorySize = 1000 
}) => {
  // Store the latest event of each type
  const [latestEvents, setLatestEvents] = useState<Map<ModuleEventType, ModuleEvent>>(
    new Map()
  );

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
      'SUB_MODULE_EFFECT_REMOVED'
    ];

    // Subscribe to all event types
    const unsubscribers = eventTypes.map(type => 
      moduleEventBus.subscribe(type, handleEvent)
    );

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
    emit: (event) => moduleEventBus.emit(event),
    
    // Event history - delegate to moduleEventBus
    getHistory: () => moduleEventBus.getHistory(),
    getModuleHistory: (moduleId) => moduleEventBus.getModuleHistory(moduleId),
    getEventTypeHistory: (type) => moduleEventBus.getEventTypeHistory(type),
    clearHistory: () => moduleEventBus.clearHistory(),
    
    // Event filtering
    getFilteredEvents: (filter) => moduleEventBus.getHistory().filter(filter),
    
    // Latest events by type
    latestEvents
  };

  return (
    <EventDispatcherContext.Provider value={value}>
      {children}
    </EventDispatcherContext.Provider>
  );
};

/**
 * Hook to use the event dispatcher
 */
export const useEventDispatcher = (): EventDispatcherContextType => {
  const context = useContext(EventDispatcherContext);
  
  if (!context) {
    throw new Error('useEventDispatcher must be used within an EventDispatcherProvider');
  }
  
  return context;
};

/**
 * Hook to subscribe to specific event types
 */
export const useEventSubscription = <T extends ModuleEventType>(
  eventType: T,
  callback: (event: ModuleEvent) => void,
  deps: React.DependencyList = []
): void => {
  const { subscribe } = useEventDispatcher();
  
  useEffect(() => {
    return subscribe(eventType, callback);
  }, [eventType, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
};

/**
 * Hook to get the latest event of a specific type
 */
export const useLatestEvent = <T extends ModuleEventType>(
  eventType: T
): ModuleEvent | undefined => {
  const { latestEvents } = useEventDispatcher();
  return latestEvents.get(eventType);
};

/**
 * Hook to get filtered events
 */
export const useFilteredEvents = (
  filter: (event: ModuleEvent) => boolean,
  deps: React.DependencyList = []
): ModuleEvent[] => {
  const { getFilteredEvents } = useEventDispatcher();
  const [filteredEvents, setFilteredEvents] = useState<ModuleEvent[]>([]);
  
  useEffect(() => {
    setFilteredEvents(getFilteredEvents(filter));
  }, [getFilteredEvents, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  
  return filteredEvents;
}; 