# GALACTIC SPRAWL (GS) - Service Pattern Reference

## Overview

This document provides canonical implementation examples of the Service Pattern as used throughout the Galactic Sprawl codebase. Services provide core functionality across the application and must follow consistent implementation patterns to ensure proper integration, type safety, and lifecycle management.

## Core Components

### AbstractBaseService

The foundation of all services is the `AbstractBaseService` class which provides common service functionality:

```typescript
// src/lib/services/BaseService.ts

/**
 * Abstract base class that provides common service functionality
 * Extends the Singleton pattern to ensure only one instance exists
 */
export abstract class AbstractBaseService<T extends AbstractBaseService<T>>
  extends Singleton<T>
  implements BaseService
{
  protected metadata: ServiceMetadata;

  public constructor(name: string, version: string) {
    super();
    this.metadata = {
      name,
      version,
      status: 'initializing',
    };
  }

  async initialize(dependencies?: Record<string, unknown>): Promise<void> {
    try {
      await this.onInitialize(dependencies);
      this.metadata.status = 'ready';
    } catch (error) {
      this.metadata.status = 'error';
      this.handleError(error as Error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    try {
      await this.onDispose();
      this.metadata.status = 'disposed';
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  getMetadata(): ServiceMetadata {
    return { ...this.metadata };
  }

  isReady(): boolean {
    return this.metadata.status === 'ready';
  }

  handleError(error: Error, context?: Record<string, unknown>): void {
    this.metadata.lastError = {
      type: ErrorType.UNKNOWN,
      message: error.message,
      timestamp: Date.now(),
    };
    // Subclasses should override this to provide custom error handling
  }

  protected abstract onInitialize(dependencies?: Record<string, unknown>): Promise<void>;
  protected abstract onDispose(): Promise<void>;
}
```

### BaseService Interface

Services implement the `BaseService` interface that defines required functionality:

```typescript
/**
 * Base interface that all services should implement
 */
export interface BaseService {
  /**
   * Initialize the service with optional dependencies
   */
  initialize(dependencies?: Record<string, unknown>): Promise<void>;

  /**
   * Dispose of any resources used by the service
   */
  dispose(): Promise<void>;

  /**
   * Get metadata about the service's current state
   */
  getMetadata(): ServiceMetadata;

  /**
   * Check if the service is ready to handle requests
   */
  isReady(): boolean;

  /**
   * Handle errors that occur within the service
   */
  handleError(error: Error, context?: Record<string, unknown>): void;
}
```

### ServiceRegistry

Services are registered and accessed through the `ServiceRegistry`:

```typescript
// src/lib/services/ServiceRegistry.ts

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, ServiceRegistration> = new Map();
  private initializing: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  public register(
    name: string,
    factory: ServiceFactory,
    config: Partial<ServiceConfig> = {}
  ): void {
    // Implementation details...
  }

  public async getService<T extends BaseService>(name: string): Promise<T> {
    // Implementation details...
    return service as T;
  }

  // Additional methods...
}
```

## Service Implementation Pattern

### Complete Service Implementation Example

```typescript
// src/services/RealTimeDataService.ts

/**
 * @context: service-system, event-system
 * Service for managing real-time data streams for visualization components
 */
class RealTimeDataServiceImpl extends AbstractBaseService<RealTimeDataServiceImpl> {
  // Private properties for the service
  private dataBuffers: Map<string, DataBuffer<unknown>> = new Map();
  private streamConfigs: Map<string, StreamConfig> = new Map();
  private streamIds: Map<string, string> = new Map();
  private listeners: Map<string, Set<(data: unknown[]) => void>> = new Map();
  private generators: Map<string, DataGenerator<unknown>> = new Map();

  // Public constructor is required for direct instantiation
  public constructor() {
    super('RealTimeDataService', '1.0.0');
  }

  // Implementation of abstract method from AbstractBaseService
  protected async onInitialize(dependencies?: Record<string, unknown>): Promise<void> {
    // Initialize metrics with proper null check
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics = {
      active_streams: 0,
      total_data_points: 0,
      buffer_utilization: 0,
      update_rate: 0,
      generators_active: 0,
    };
  }

  // Implementation of abstract method from AbstractBaseService
  protected async onDispose(): Promise<void> {
    // Clean up resources
    const streamIds = Array.from(this.streamIds.values());
    await Promise.all(streamIds.map(id => this.stopStream(id)));

    this.dataBuffers.clear();
    this.streamConfigs.clear();
    this.streamIds.clear();
    this.listeners.clear();
    this.generators.clear();
  }

  // Service-specific public methods
  public createBuffer<T>(id: string, capacity: number): DataBuffer<T> {
    const buffer: DataBuffer<T> = {
      data: new Array(capacity),
      capacity,
      head: 0,
      tail: 0,
      isFull: false,
    };
    this.dataBuffers.set(id, buffer);
    return buffer;
  }

  public appendData<T>(bufferId: string, newData: T[]): void {
    const buffer = this.dataBuffers.get(bufferId) as DataBuffer<T>;
    if (!buffer) {
      throw new Error(`Buffer '${bufferId}' not found`);
    }

    for (const item of newData) {
      buffer.data[buffer.tail] = item;
      buffer.tail = (buffer.tail + 1) % buffer.capacity;

      if (buffer.tail === buffer.head) {
        buffer.head = (buffer.head + 1) % buffer.capacity;
        buffer.isFull = true;
      }
    }

    // Update metrics with proper null check
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const metrics = this.metadata.metrics;
    metrics.total_data_points += newData.length;
    metrics.buffer_utilization = this.calculateBufferUtilization(buffer);
    this.metadata.metrics = metrics;

    this.notifyListeners(bufferId);
  }

  // Custom error handling implementation
  public override handleError(error: Error): void {
    errorLoggingService.logError(error, ErrorType.RUNTIME, undefined, {
      service: 'RealTimeDataService',
    });
  }

  // Private helper methods
  private calculateBufferUtilization<T>(buffer: DataBuffer<T>): number {
    if (buffer.isFull) return 1;
    if (buffer.head <= buffer.tail) {
      return (buffer.tail - buffer.head) / buffer.capacity;
    } else {
      return (buffer.capacity - buffer.head + buffer.tail) / buffer.capacity;
    }
  }

  private notifyListeners(bufferId: string): void {
    const listeners = this.listeners.get(bufferId);
    if (!listeners) return;

    const data = this.getBufferData(bufferId);
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        this.handleError(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}

// Export singleton instance using direct instantiation
export const realTimeDataService = new RealTimeDataServiceImpl();

// Export default for easier imports
export default realTimeDataService;
```

## Key Implementation Points

### 1. Generic Type Parameter

Always extend `AbstractBaseService` with the class itself as the generic type parameter:

```typescript
class ExampleServiceImpl extends AbstractBaseService<ExampleServiceImpl> {
  // Implementation...
}
```

This ensures proper typing with the Singleton pattern.

### 2. Constructor Visibility

Always use a public constructor to allow direct instantiation:

```typescript
public constructor() {
  super('ServiceName', 'VersionNumber');
}
```

A public constructor is required for the service to be properly created and registered.

### 3. Metadata Handling

Always check if metadata properties exist before using them:

```typescript
// Incorrect: Using optional chaining with metadata
this.metadata?.metrics = {
  counter: 0,
};

// Correct: Using proper null checks
if (!this.metadata.metrics) {
  this.metadata.metrics = {};
}
this.metadata.metrics = {
  counter: 0,
};
```

### 4. Service Export

Export the service instance using direct instantiation:

```typescript
// Export singleton instance
export const exampleService = new ExampleServiceImpl();

// Export default for easier imports
export default exampleService;
```

### 5. Error Handling

Implement proper error handling by overriding the `handleError` method:

```typescript
public override handleError(error: Error): void {
  errorLoggingService.logError(error, ErrorType.RUNTIME, undefined, {
    service: 'ExampleService',
  });
}
```

## Service Registration with ServiceRegistry

Services should be registered with the `ServiceRegistry` in a provider component:

```typescript
// src/components/providers/ServiceProvider.tsx

export function ServiceProvider({ children }: ServiceProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        const registry = ServiceRegistry.getInstance();

        // Register services
        registry.register('errorLogging', () => errorLoggingService, {
          priority: 100, // High priority as other services depend on it
        });

        registry.register('api', () => apiService, {
          dependencies: ['errorLogging'],
          priority: 40,
        });

        registry.register('realTimeData', () => realTimeDataService, {
          dependencies: ['errorLogging', 'api'],
          priority: 20,
        });

        // Initialize all services
        await registry.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError(err as Error);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      const registry = ServiceRegistry.getInstance();
      registry.dispose().catch(console.error);
    };
  }, []);

  // Component rendering...
}
```

## Anti-Patterns to Avoid

### 1. Missing Generic Type Parameter

```typescript
// INCORRECT: Missing generic type parameter
class ExampleServiceImpl extends AbstractBaseService {
  // Implementation...
}

// CORRECT: Using proper generic type parameter
class ExampleServiceImpl extends AbstractBaseService<ExampleServiceImpl> {
  // Implementation...
}
```

### 2. Unsafe Optional Chaining with Metadata

```typescript
// INCORRECT: Using optional chaining with metadata
protected async onInitialize(): Promise<void> {
  this.metadata?.metrics = {
    counter: 0
  };
}

// CORRECT: Using proper null checks
protected async onInitialize(dependencies?: Record<string, unknown>): Promise<void> {
  if (!this.metadata.metrics) {
    this.metadata.metrics = {};
  }
  this.metadata.metrics = {
    counter: 0
  };
}
```

### 3. Private Constructor

```typescript
// INCORRECT: Private constructor blocking instantiation
private constructor() {
  super('ServiceName', '1.0.0');
}

// CORRECT: Public constructor allowing instantiation
public constructor() {
  super('ServiceName', '1.0.0');
}
```

### 4. Custom getInstance Implementation

```typescript
// INCORRECT: Custom getInstance implementation
public static getInstance(): ExampleServiceImpl {
  if (!ExampleServiceImpl.instance) {
    ExampleServiceImpl.instance = new ExampleServiceImpl();
  }
  return ExampleServiceImpl.instance;
}

// CORRECT: Use direct instantiation
// No custom getInstance method needed
```

### 5. Incorrect Service Export

```typescript
// INCORRECT: Using getInstance method
export const exampleService = ExampleServiceImpl.getInstance();

// CORRECT: Direct instantiation
export const exampleService = new ExampleServiceImpl();
```

## Service Types and Special Cases

### Data Services

Services that primarily manage and provide access to data:

```typescript
class DataServiceImpl extends AbstractBaseService<DataServiceImpl> {
  private data: Map<string, unknown> = new Map();

  public constructor() {
    super('DataService', '1.0.0');
  }

  protected async onInitialize(): Promise<void> {
    // Initialize data
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics = {
      items: 0,
      retrievals: 0,
      cache_hits: 0,
    };
  }

  public getData<T>(key: string): T | undefined {
    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics.retrievals++;

    return this.data.get(key) as T | undefined;
  }

  // Additional methods...
}
```

### API Services

Services that interact with external APIs:

```typescript
class APIServiceImpl extends AbstractBaseService<APIServiceImpl> {
  private activeRequests: Map<string, AbortController> = new Map();

  public constructor() {
    super('APIService', '1.0.0');
  }

  protected async onInitialize(): Promise<void> {
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics = {
      total_requests: 0,
      active_requests: 0,
      failed_requests: 0,
      average_response_time: 0,
    };
  }

  public async fetchData<T>(endpoint: string): Promise<T> {
    const startTime = performance.now();
    try {
      // Make request
      // ...

      // Update metrics
      if (!this.metadata.metrics) {
        this.metadata.metrics = {};
      }
      const metrics = this.metadata.metrics;
      metrics.total_requests++;
      metrics.average_response_time = this.calculateAverageTime(
        metrics.average_response_time,
        performance.now() - startTime
      );
      this.metadata.metrics = metrics;

      return result;
    } catch (error) {
      // Update error metrics
      if (!this.metadata.metrics) {
        this.metadata.metrics = {};
      }
      this.metadata.metrics.failed_requests++;

      this.handleError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // Helper methods...
}
```

### Processing Services

Services that process data or perform calculations:

```typescript
class ProcessingServiceImpl extends AbstractBaseService<ProcessingServiceImpl> {
  private processors: Map<string, (data: unknown) => unknown> = new Map();

  public constructor() {
    super('ProcessingService', '1.0.0');
  }

  protected async onInitialize(): Promise<void> {
    this.registerDefaultProcessors();

    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics = {
      registered_processors: this.processors.size,
      items_processed: 0,
      processing_errors: 0,
    };
  }

  public process<T, R>(processorId: string, data: T): R {
    try {
      const processor = this.processors.get(processorId);
      if (!processor) {
        throw new Error(`Processor '${processorId}' not found`);
      }

      const result = processor(data) as R;

      // Update metrics
      if (!this.metadata.metrics) {
        this.metadata.metrics = {};
      }
      this.metadata.metrics.items_processed++;

      return result;
    } catch (error) {
      // Update error metrics
      if (!this.metadata.metrics) {
        this.metadata.metrics = {};
      }
      this.metadata.metrics.processing_errors++;

      this.handleError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // Helper methods...
}
```

## Integration with Other Systems

### Event System Integration

Services can emit and subscribe to events:

```typescript
class EventIntegratedServiceImpl extends AbstractBaseService<EventIntegratedServiceImpl> {
  private unsubscribers: Array<() => void> = [];

  public constructor() {
    super('EventIntegratedService', '1.0.0');
  }

  protected async onInitialize(): Promise<void> {
    // Subscribe to events
    this.unsubscribers.push(
      moduleEventBus.subscribe(EventType.RESOURCE_UPDATED, this.handleResourceUpdate.bind(this))
    );

    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics = {
      events_received: 0,
      events_emitted: 0,
    };
  }

  protected async onDispose(): Promise<void> {
    // Unsubscribe from all events
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }

  private handleResourceUpdate(event: BaseEvent): void {
    if (!isResourceUpdateEvent(event)) return;

    // Handle the event
    // ...

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics.events_received++;
  }

  public triggerResourceUpdate(resourceType: ResourceType, amount: number): void {
    // Emit an event
    moduleEventBus.emit({
      type: EventType.RESOURCE_UPDATED,
      moduleId: 'event-integrated-service',
      moduleType: ModuleType.MANAGER,
      timestamp: Date.now(),
      data: {
        resourceType,
        oldAmount: 0,
        newAmount: amount,
      },
    });

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics.events_emitted++;
  }
}
```

### Manager Registry Integration

Services can access managers through the registry:

```typescript
class ManagerIntegratedServiceImpl extends AbstractBaseService<ManagerIntegratedServiceImpl> {
  public constructor() {
    super('ManagerIntegratedService', '1.0.0');
  }

  protected async onInitialize(): Promise<void> {
    // Initialize metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics = {
      operations: 0,
    };
  }

  public async performResourceOperation(
    resourceType: ResourceType,
    amount: number
  ): Promise<boolean> {
    try {
      // Access manager through registry
      const resourceManager = getResourceManager();

      // Use the manager
      const result = resourceManager.addResource(resourceType, amount);

      // Update metrics
      if (!this.metadata.metrics) {
        this.metadata.metrics = {};
      }
      this.metadata.metrics.operations++;

      return result;
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
}
```

## Best Practices

1. Generic Type Parameter: Always extend `AbstractBaseService<YourServiceImpl>` with your own class as the type parameter.
2. Public Constructor: Always use a public constructor to allow for proper instantiation and registration.
3. Metadata Handling: Always check if `this.metadata.metrics` exists before using it.
4. Error Handling: Override `handleError` to provide service-specific error handling.
5. Service Export: Export an instance of your service for external use.
6. Cleanup: Properly clean up resources in the `onDispose` method.
7. Event Subscriptions: Maintain a list of event unsubscribers and clean them up on disposal.
8. Manager Access: Access managers through the registry, not direct imports.
9. Service Registration: Register your service with the ServiceRegistry in a provider component.
10. Documentation: Add JSDoc comments and include the `@context` tag to indicate system relationships.

## Related Systems

- See @GS-CORE-ARCHITECTURE for overall system architecture
- See @GS-EVENT-HANDLING-PATTERN for event system integration
- See @GS-REGISTRY-PATTERN-REFERENCE for manager registry integration
- See @GS-TYPE-DEFINITIONS for type system standards

