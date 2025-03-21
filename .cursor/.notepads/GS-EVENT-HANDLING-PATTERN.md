# GALACTIC SPAWL (GS) - Event Handling Pattern Reference

## Overview
This document provides implementation examples of Event Handling patterns as used in the Galactic Sprawl codebase. These patterns ensure type-safe event communication between different systems.

## Event Bus Implementation

The central EventBus provides the core event handling infrastructure.

```typescript
// src/lib/events/EventBus.ts

export class EventBus<T extends BaseEvent> {
  private handlers: Map<string, Array<(event: T) => void>> = new Map();
  
  /**
   * Subscribe to an event type
   * @param type The event type to subscribe to
   * @param handler The callback function to handle the event
   * @returns A function to unsubscribe
   */
  public subscribe(type: EventType | string, handler: (event: T) => void): () => void {
    const typeString = type.toString();
    
    if (!this.handlers.has(typeString)) {
      this.handlers.set(typeString, []);
    }
    
    this.handlers.get(typeString)?.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(typeString);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }
  
  /**
   * Subscribe to multiple event types at once
   * @param types The event types to subscribe to
   * @param handler The callback function to handle the events
   * @returns A function to unsubscribe from all event types
   */
  public subscribeToMany(types: Array<EventType | string>, handler: (event: T) => void): () => void {
    const unsubscribers = types.map(type => this.subscribe(type, handler));
    
    // Return a function that unsubscribes from all event types
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }
  
  /**
   * Emit an event to subscribers
   * @param event The event to emit
   */
  public emit(event: T): void {
    const typeString = event.type.toString();
    const handlers = this.handlers.get(typeString) || [];
    
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${typeString}:`, error);
      }
    });
  }
  
  /**
   * Clear all event handlers
   */
  public clear(): void {
    this.handlers.clear();
  }
}

// Create and export the module event bus
export const moduleEventBus = new EventBus<ModuleEvent>();
```

## Typed Event Emitter Implementation

The TypedEventEmitter provides type-safe event emission and subscription.

```typescript
// src/lib/events/TypedEventEmitter.ts

export class TypedEventEmitter<T extends Record<string, unknown>> {
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  
  /**
   * Subscribe to an event type
   * @param event The event type to subscribe to
   * @param callback The callback function to handle the event
   * @returns A function to unsubscribe
   */
  public on<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
    const eventString = String(event);
    
    if (!this.listeners.has(eventString)) {
      this.listeners.set(eventString, new Set());
    }
    
    this.listeners.get(eventString)?.add(callback as (data: unknown) => void);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventString);
      if (callbacks) {
        callbacks.delete(callback as (data: unknown) => void);
      }
    };
  }
  
  /**
   * Emit an event to subscribers
   * @param event The event type to emit
   * @param data The event data
   */
  protected emit<K extends keyof T>(event: K, data: T[K]): void {
    const eventString = String(event);
    const callbacks = this.listeners.get(eventString);
    
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${eventString}:`, error);
        }
      });
    }
  }
  
  /**
   * Check if an event has subscribers
   * @param event The event type to check
   * @returns True if the event has subscribers
   */
  protected hasListeners<K extends keyof T>(event: K): boolean {
    const eventString = String(event);
    const callbacks = this.listeners.get(eventString);
    return !!callbacks && callbacks.size > 0;
  }
  
  /**
   * Clear all event listeners
   */
  public clear(): void {
    this.listeners.clear();
  }
}
```

## Event Type Definitions

Type-safe event definitions ensure consistent event handling.

```typescript
// src/types/events/EventTypes.ts

/**
 * Base event interface that all events must implement
 */
export interface BaseEvent {
  type: EventType; // Must use enum, not string
  timestamp: number;
  moduleId: string;
  moduleType: ModuleType; // Must use enum, not string
  data?: Record<string, unknown>;
  [key: string]: unknown; // Add index signature for compatibility
}

/**
 * Module event interface for module-specific events
 */
export interface ModuleEvent extends BaseEvent {
  moduleId: string;
  moduleType: ModuleType;
}

/**
 * Resource event data interface
 */
export interface ResourceEventData {
  resourceType: ResourceType;
  amount: number;
  source?: string;
  target?: string;
  oldAmount?: number;
  newAmount?: number;
}

/**
 * Type guard for resource events
 */
export function isResourceEvent(
  event: BaseEvent
): event is BaseEvent & { data: ResourceEventData } {
  return (
    event?.data !== undefined &&
    typeof event?.data === 'object' &&
    event?.data !== null &&
    'resourceType' in event?.data &&
    'amount' in event?.data &&
    typeof event?.data?.amount === 'number'
  );
}
```

## Event Handling Patterns

Examples of event handling patterns in different contexts.

### Manager Event Handling

```typescript
// src/managers/resource/ResourceThresholdManager.ts

export class ResourceThresholdManager {
  // Class implementation...
  
  /**
   * Set up event subscriptions
   */
  private setupEventSubscriptions(): void {
    // Subscribe to resource update events
    this.unsubscribeHandlers.push(
      moduleEventBus.subscribe(
        EventType.RESOURCE_UPDATED,
        this.handleResourceUpdate.bind(this)
      )
    );
    
    // Subscribe to multiple event types
    this.unsubscribeHandlers.push(
      moduleEventBus.subscribeToMany(
        [
          EventType.RESOURCE_PRODUCED,
          EventType.RESOURCE_CONSUMED,
          EventType.RESOURCE_TRANSFERRED
        ],
        this.handleResourceChangeEvent.bind(this)
      )
    );
  }
  
  /**
   * Handle resource update events
   */
  private handleResourceUpdate(event: ModuleEvent): void {
    if (!isResourceUpdateEvent(event)) return;
    
    // Handle the event
    const { resourceType, oldAmount, newAmount } = event.data;
    // Implementation details...
  }
  
  /**
   * Handle resource change events
   */
  private handleResourceChangeEvent(event: ModuleEvent): void {
    if (!isResourceEvent(event)) return;
    
    // Handle the event
    const { resourceType, amount } = event.data;
    // Implementation details...
  }
  
  /**
   * Dispose of event handlers
   */
  public dispose(): void {
    // Unsubscribe from all events
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers = [];
  }
}
```

### Component Event Handling

```typescript
// src/components/resources/ResourceMonitor.tsx

function ResourceMonitor({ resourceTypes }: { resourceTypes: ResourceType[] }) {
  const [resources, setResources] = useState<Record<ResourceType, number>>({});
  
  useEffect(() => {
    // Initialize resources state
    const initialResources: Record<ResourceType, number> = {};
    resourceTypes.forEach(type => {
      const resourceManager = getResourceManager();
      const state = resourceManager.getResource(type);
      initialResources[type] = state?.current || 0;
    });
    setResources(initialResources);
    
    // Subscribe to resource events
    const unsubscribe = moduleEventBus.subscribeToMany(
      [EventType.RESOURCE_PRODUCED, EventType.RESOURCE_CONSUMED],
      (event) => {
        if (isResourceEvent(event)) {
          const { resourceType, newAmount, oldAmount } = event.data;
          
          // Only update if we're tracking this resource type
          if (resourceTypes.includes(resourceType)) {
            setResources(prev => ({
              ...prev,
              [resourceType]: newAmount ?? event.data.amount + (prev[resourceType] || 0)
            }));
          }
        }
      }
    );
    
    // Return cleanup function
    return unsubscribe;
  }, [resourceTypes]);
  
  // Component rendering...
}
```

### Custom Hook Event Handling

```typescript
// src/hooks/events/useResourceEvents.ts

/**
 * Custom hook for subscribing to resource-related events
 * @param callback The callback function to handle resource events
 * @param resourceTypes Optional filter for specific resource types
 * @returns An object with the current resource states
 */
export function useResourceEvents(
  callback: (data: ResourceEventData) => void,
  resourceTypes?: ResourceType[]
) {
  const [resources, setResources] = useState<Record<ResourceType, number>>({});
  
  useEffect(() => {
    // Initialize resource states
    const resourceManager = getResourceManager();
    const initialResources: Record<ResourceType, number> = {};
    
    // If specific resource types are provided, only track those
    const typesToTrack = resourceTypes || Object.values(ResourceType);
    
    typesToTrack.forEach(type => {
      const state = resourceManager.getResource(type);
      initialResources[type] = state?.current || 0;
    });
    
    setResources(initialResources);
    
    // Subscribe to all resource-related events
    const resourceEventTypes = [
      EventType.RESOURCE_PRODUCED,
      EventType.RESOURCE_CONSUMED,
      EventType.RESOURCE_TRANSFERRED,
      EventType.RESOURCE_UPDATED
    ];
    
    const unsubscribe = moduleEventBus.subscribeToMany(
      resourceEventTypes,
      (event: BaseEvent) => {
        if (!isResourceEvent(event)) return;
        
        const { resourceType, amount, oldAmount, newAmount } = event.data;
        
        // Only process if we're tracking this resource type
        if (!resourceTypes || resourceTypes.includes(resourceType)) {
          // Call the provided callback
          callback(event.data);
          
          // Update internal state
          setResources(prev => ({
            ...prev,
            [resourceType]: newAmount ?? (prev[resourceType] || 0) + amount
          }));
        }
      }
    );
    
    // Return cleanup function
    return unsubscribe;
  }, [callback, resourceTypes ? resourceTypes.join(',') : '']);
  
  return { resources };
}

/**
 * Custom hook for subscribing to specific resource types
 * @param resourceType The resource type to track
 * @returns The current resource state and update functions
 */
export function useResourceType(resourceType: ResourceType) {
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    setLoading(true);
    
    // Get initial value
    const resourceManager = getResourceManager();
    const state = resourceManager.getResource(resourceType);
    setAmount(state?.current || 0);
    setLoading(false);
    
    // Subscribe to updates for this specific resource
    const unsubscribe = moduleEventBus.subscribeToMany(
      [
        EventType.RESOURCE_PRODUCED,
        EventType.RESOURCE_CONSUMED,
        EventType.RESOURCE_TRANSFERRED,
        EventType.RESOURCE_UPDATED
      ],
      (event: BaseEvent) => {
        if (
          isResourceEvent(event) && 
          event.data.resourceType === resourceType
        ) {
          setAmount(event.data.newAmount ?? event.data.amount);
        }
      }
    );
    
    return unsubscribe;
  }, [resourceType]);
  
  // Helper functions for modifying the resource
  const addResource = useCallback((amount: number) => {
    const resourceManager = getResourceManager();
    return resourceManager.addResource(resourceType, amount);
  }, [resourceType]);
  
  const removeResource = useCallback((amount: number) => {
    const resourceManager = getResourceManager();
    return resourceManager.removeResource(resourceType, amount);
  }, [resourceType]);
  
  return {
    amount,
    loading,
    addResource,
    removeResource
  };
}
```