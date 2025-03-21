# GALACTIC SPAWL (GS) - Event System

## Overview
The Event System provides a comprehensive framework for communication between game systems. It uses strongly-typed events with enum-based event types and a robust subscription model.

## Core Components

### EventBus
Central event dispatcher for the application:

```typescript
export class EventBus<T extends BaseEvent> {
  private handlers: Map<string, Array<(event: T) => void>> = new Map();

  // Subscribe to an event type
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

  // Emit an event
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
}
```

### TypedEventEmitter

Base class for components that emit typed events:

```typescript
export class TypedEventEmitter<T extends Record<string, unknown>> {
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  // Subscribe to an event
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

  // Emit an event
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
}
```

## Key Types

### EventType Enum

```typescript
export enum EventType {
  // Lifecycle events
  MODULE_CREATED = 'MODULE_CREATED',
  MODULE_ATTACHED = 'MODULE_ATTACHED',
  MODULE_DETACHED = 'MODULE_DETACHED',
  MODULE_UPGRADED = 'MODULE_UPGRADED',
  MODULE_ACTIVATED = 'MODULE_ACTIVATED',
  MODULE_DEACTIVATED = 'MODULE_DEACTIVATED',
  
  // Resource events
  RESOURCE_PRODUCED = 'RESOURCE_PRODUCED',
  RESOURCE_CONSUMED = 'RESOURCE_CONSUMED',
  RESOURCE_TRANSFERRED = 'RESOURCE_TRANSFERRED',
  RESOURCE_SHORTAGE = 'RESOURCE_SHORTAGE',
  
  // Additional event types...
}
```

### EventCategory Enum

```typescript
export enum EventCategory {
  LIFECYCLE = 'lifecycle',
  RESOURCE = 'resource',
  ATTACHMENT = 'attachment',
  AUTOMATION = 'automation',
  STATUS = 'status',
  MISSION = 'mission',
  COMBAT = 'combat',
  SYSTEM = 'system',
  // Additional categories...
}
```

### BaseEvent Interface

```typescript
export interface BaseEvent {
  type: EventType;
  timestamp: number;
  moduleId: string;
  moduleType: ModuleType;
  data?: Record<string, unknown>;
}
```

## Implementation Patterns

### Event Subscription Pattern

```typescript
// ALWAYS: Use event type enums
const unsubscribe = moduleEventBus.subscribe(
  EventType.RESOURCE_PRODUCED,
  (event) => {
    console.log(`Resource produced: ${event.data.resourceType}`);
  }
);

// Component cleanup
useEffect(() => {
  // Subscribe to event
  const unsubscribe = moduleEventBus.subscribe(
    EventType.RESOURCE_PRODUCED,
    handleResourceProduced
  );
  
  // Return cleanup function
  return unsubscribe;
}, []);

// NEVER: Use string literals for event types
// const unsubscribe = moduleEventBus.subscribe(
//   'RESOURCE_PRODUCED',
//   (event) => {
//     console.log(`Resource produced: ${event.data.resourceType}`);
//   }
// );
```

### Event Emission Pattern

```typescript
// ALWAYS: Use the full event structure with enum types
moduleEventBus.emit({
  type: EventType.RESOURCE_PRODUCED,
  moduleId: 'module-id',
  moduleType: ModuleType.RESOURCE_GENERATOR,
  timestamp: Date.now(),
  data: {
    resourceType: ResourceType.ENERGY,
    amount: 100
  }
});

// NEVER: Emit events with incomplete data or string literals
// moduleEventBus.emit({
//   type: 'RESOURCE_PRODUCED',
//   data: {
//     resourceType: 'energy',
//     amount: 100
//   }
// });
```

### Typed Event Emitter Pattern

```typescript
// Define event types
interface ModuleEvents {
  'status-changed': { oldStatus: string; newStatus: string };
  'resource-produced': { resourceType: ResourceType; amount: number };
}

// Create typed emitter
class ModuleManager extends TypedEventEmitter<ModuleEvents> {
  public changeStatus(newStatus: string): void {
    const oldStatus = this.status;
    this.status = newStatus;
    
    // Emit typed event
    this.emit('status-changed', { oldStatus, newStatus });
  }
}

// Using the typed emitter
const moduleManager = new ModuleManager();
const unsubscribe = moduleManager.on('status-changed', ({ oldStatus, newStatus }) => {
  console.log(`Status changed from ${oldStatus} to ${newStatus}`);
});
```

## Type Safety Utilities

```typescript
// Type guard for event validation
export function isResourceEvent(
  event: BaseEvent
): event is BaseEvent & { data: { resourceType: ResourceType; amount: number } } {
  return (
    event?.data !== undefined &&
    'resourceType' in event.data &&
    'amount' in event.data &&
    typeof event.data.amount === 'number'
  );
}

// Helper to check event category
export function isEventInCategory(eventType: EventType, category: EventCategory): boolean {
  return EVENT_CATEGORY_MAP[eventType] === category;
}
```

## React Component Integration

```typescript
// Event hook for React components
export function useEventSubscription<T extends BaseEvent>(
  eventType: EventType,
  handler: (event: T) => void
): void {
  useEffect(() => {
    const unsubscribe = moduleEventBus.subscribe(eventType, handler);
    return unsubscribe;
  }, [eventType, handler]);
}

// Using the hook in a component
function ResourceMonitor() {
  const [resources, setResources] = useState({});
  
  useEventSubscription(EventType.RESOURCE_PRODUCED, (event) => {
    if (isResourceEvent(event)) {
      setResources(prev => ({
        ...prev,
        [event.data.resourceType]: (prev[event.data.resourceType] || 0) + event.data.amount
      }));
    }
  });
  
  return (
    // Component UI
  );
}
```

## Event Filtering and Processing

The Event System supports filtering and processing of events:

```typescript
// Filter events by category
const resourceEvents = getEventTypesByCategory(EventCategory.RESOURCE);

// Subscribe to multiple event types
const unsubscribe = moduleEventBus.subscribeToMany(
  resourceEvents,
  (event) => {
    // Handle any resource-related event
  }
);

// Process events sequentially
async function processEvents(events: BaseEvent[]): Promise<void> {
  for (const event of events) {
    await processEvent(event);
  }
}
```

## Related Systems

- See @GS-Architecture-Core for system integration principles
- See @GS-Type-Definitions for complete type definitions
- See @GS-Resource-System for resource event examples
