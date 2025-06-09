# EVENT SYSTEM

## Overview

The Event System provides a centralized mechanism for event handling and distribution in Galactic Sprawl. It includes:

- Event type definitions and standardization
- Event bus implementation
- Subscription management
- Event batching and optimization
- Development tools and monitoring

## Core Components

### Event Types

```typescript
// src/lib/events/EventTypes.ts

export enum EventType {
  // Resource Events
  RESOURCE_ADDED = 'RESOURCE_ADDED',
  RESOURCE_REMOVED = 'RESOURCE_REMOVED',
  RESOURCE_UPDATED = 'RESOURCE_UPDATED',
  FLOW_CREATED = 'FLOW_CREATED',
  FLOW_UPDATED = 'FLOW_UPDATED',
  FLOWS_OPTIMIZED = 'FLOWS_OPTIMIZED',
  THRESHOLD_REACHED = 'THRESHOLD_REACHED',

  // Module Events
  MODULE_CREATED = 'MODULE_CREATED',
  MODULE_DESTROYED = 'MODULE_DESTROYED',
  MODULE_UPDATED = 'MODULE_UPDATED',
  MODULE_STATUS_CHANGED = 'MODULE_STATUS_CHANGED',

  // Game Events
  GAME_STARTED = 'GAME_STARTED',
  GAME_PAUSED = 'GAME_PAUSED',
  GAME_RESUMED = 'GAME_RESUMED',
  GAME_ENDED = 'GAME_ENDED',
}

export interface BaseEvent {
  type: EventType;
  timestamp: number;
  id: string;
  metadata?: Record<string, unknown>;
}

export interface ResourceEvent extends BaseEvent {
  type: (typeof ResourceEventTypes)[number];
  payload: {
    resource?: Resource;
    node?: ResourceNode;
    flow?: ResourceConnection;
    amount?: number;
  };
}

export interface ModuleEvent extends BaseEvent {
  type: (typeof ModuleEventTypes)[number];
  payload: {
    module: Module;
    status?: ModuleStatus;
    changes?: ModuleChanges;
  };
}
```

### Event Bus

```typescript
// src/lib/events/EventBus.ts

export class EventBus<T extends BaseEvent = BaseEvent> {
  private subscriptions: Map<EventType, Set<EventHandler<T>>>;
  private batcher: EventBatcher<T>;
  private metrics: EventMetrics;

  constructor() {
    this.subscriptions = new Map();
    this.batcher = new EventBatcher<T>();
    this.metrics = new EventMetrics();
  }

  public subscribe<E extends T>(eventType: EventType, handler: EventHandler<E>): Unsubscribe {
    const handlers = this.getOrCreateHandlerSet(eventType);
    handlers.add(handler as EventHandler<T>);

    return () => {
      handlers.delete(handler as EventHandler<T>);
      if (handlers.size === 0) {
        this.subscriptions.delete(eventType);
      }
    };
  }

  public publish(event: T): void {
    this.metrics.recordEvent(event);

    if (this.shouldBatchEvent(event)) {
      this.batcher.addEvent(event);
      return;
    }

    this.distributeEvent(event);
  }

  private distributeEvent(event: T): void {
    const handlers = this.subscriptions.get(event.type);
    if (!handlers) return;

    const startTime = performance.now();

    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error handling event ${event.type}:`, error);
        this.metrics.recordError(event.type, error);
      }
    });

    this.metrics.recordDistributionTime(event.type, performance.now() - startTime);
  }

  private shouldBatchEvent(event: T): boolean {
    return this.batcher.shouldBatchEventType(event.type);
  }
}
```

### Event Batcher

```typescript
// src/lib/events/EventBatcher.ts

export class EventBatcher<T extends BaseEvent> {
  private batchedEvents: Map<EventType, T[]>;
  private batchingConfig: BatchingConfig;
  private batchTimer: NodeJS.Timeout | null;

  constructor(config?: Partial<BatchingConfig>) {
    this.batchedEvents = new Map();
    this.batchingConfig = {
      ...defaultBatchingConfig,
      ...config,
    };
    this.batchTimer = null;
  }

  public addEvent(event: T): void {
    const events = this.getOrCreateEventBatch(event.type);
    events.push(event);

    if (events.length >= this.batchingConfig.maxBatchSize) {
      this.flushEventType(event.type);
    } else if (!this.batchTimer) {
      this.scheduleBatchProcessing();
    }
  }

  public shouldBatchEventType(eventType: EventType): boolean {
    return this.batchingConfig.batchedEventTypes.includes(eventType);
  }

  private flushEventType(eventType: EventType): void {
    const events = this.batchedEvents.get(eventType);
    if (!events || events.length === 0) return;

    const batchEvent: BatchedEvent<T> = {
      type: eventType,
      timestamp: Date.now(),
      id: generateId(),
      events: events,
    };

    this.batchedEvents.delete(eventType);
    this.distributeEvent(batchEvent);
  }

  private scheduleBatchProcessing(): void {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(() => {
      this.flushAllEvents();
      this.batchTimer = null;
    }, this.batchingConfig.batchInterval);
  }
}
```

### Event Subscription Hook

```typescript
// src/lib/events/useEventSubscription.ts

export function useEventSubscription<T extends BaseEvent>(
  eventBus: EventBus<T>,
  eventType: EventType,
  handler: EventHandler<T>,
  deps: DependencyList = []
): void {
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(eventType, handler);
    return () => unsubscribe();
  }, [eventBus, eventType, handler, ...deps]);
}

export function useEventSubscriptions<T extends BaseEvent>(
  eventBus: EventBus<T>,
  subscriptions: EventSubscription<T>[],
  deps: DependencyList = []
): void {
  useEffect(() => {
    const unsubscribes = subscriptions.map(({ eventType, handler }) =>
      eventBus.subscribe(eventType, handler)
    );

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [eventBus, ...deps]);
}
```

### Event Development Tools

```typescript
// src/lib/events/EventDevTools.ts

export class EventDevTools<T extends BaseEvent> {
  private eventBus: EventBus<T>;
  private eventLog: EventLogEntry<T>[];
  private filters: EventFilter[];
  private isRecording: boolean;

  constructor(eventBus: EventBus<T>) {
    this.eventBus = eventBus;
    this.eventLog = [];
    this.filters = [];
    this.isRecording = false;
    this.setupEventLogging();
  }

  public startRecording(): void {
    this.isRecording = true;
  }

  public stopRecording(): void {
    this.isRecording = false;
  }

  public getEventLog(): EventLogEntry<T>[] {
    return this.eventLog;
  }

  public clearEventLog(): void {
    this.eventLog = [];
  }

  public addFilter(filter: EventFilter): void {
    this.filters.push(filter);
  }

  public removeFilter(filterId: string): void {
    this.filters = this.filters.filter(f => f.id !== filterId);
  }

  public getMetrics(): EventMetrics {
    return this.eventBus.getMetrics();
  }

  private setupEventLogging(): void {
    this.eventBus.subscribe('*' as EventType, event => {
      if (!this.isRecording) return;
      if (this.shouldLogEvent(event)) {
        this.logEvent(event);
      }
    });
  }

  private shouldLogEvent(event: T): boolean {
    return this.filters.every(filter => filter.test(event));
  }

  private logEvent(event: T): void {
    this.eventLog.push({
      timestamp: Date.now(),
      event,
      stackTrace: new Error().stack,
    });
  }
}
```

## Integration Points

### Manager Integration

1. **Event Publishing**

   - Managers publish events through EventBus
   - Events are typed and validated
   - Events include necessary metadata

2. **Event Subscription**

   - Managers subscribe to relevant events
   - Subscriptions are cleaned up properly
   - Event handlers are properly typed

3. **Performance Monitoring**
   - Event distribution times are tracked
   - Event batching is configured
   - Metrics are collected and analyzed

### UI Integration

1. **Component Subscriptions**

   - Components use subscription hooks
   - Subscriptions are properly cleaned up
   - Event handlers are memoized

2. **Event Handling**

   - UI updates based on events
   - State changes are batched
   - Performance is monitored

3. **Development Tools**
   - Event logging is available
   - Filtering is configurable
   - Metrics are visualized

## Performance Optimization

1. **Event Batching**

   - Similar events are batched
   - Batch size is configurable
   - Batch timing is optimized

2. **Subscription Management**

   - Subscriptions are efficiently stored
   - Cleanup is automatic
   - Memory usage is optimized

3. **Event Distribution**
   - Distribution is prioritized
   - Processing is optimized
   - Error handling is robust

## Testing Strategy

1. **Unit Tests**

   - Test event distribution
   - Verify subscription management
   - Check batching behavior

2. **Integration Tests**

   - Test manager integration
   - Verify UI updates
   - Check performance metrics

3. **Performance Tests**
   - Measure distribution times
   - Check memory usage
   - Verify batching efficiency

## Related Documentation

- [Architecture](../01_ARCHITECTURE.md)
- [Resource System](01_RESOURCE_SYSTEM.md)
- [Context Providers](03_CONTEXT_PROVIDERS.md)
- [Manager Services](04_MANAGER_SERVICES.md)
- [Testing Architecture](../testing/01_TEST_ARCHITECTURE.md)
