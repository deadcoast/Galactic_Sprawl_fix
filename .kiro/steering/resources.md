---
inclusion: fileMatch
fileMatchPattern: ['src/types/resources/**/*.ts', 'src/managers/resource/**/*.ts', 'src/components/**/*Resource*.tsx', 'src/hooks/**/*Resource*.ts', 'src/resource/**/*.ts', 'src/services/resource*.ts']
---

## Resource Types Rule

Example of correct implementation:

```typescript
// Add resource
resourceManager.addResource(ResourceType.ENERGY, 100);

// Check resource type
if (resourceType === ResourceType.MINERALS) {
  // Process minerals
}

// Use in switch statements
switch (resourceType) {
  case ResourceType.ENERGY:
    return processEnergy(amount);
  case ResourceType.MINERALS:
    return processMinerals(amount);
  case ResourceType.EXOTIC:
    return processExotic(amount);
  default:
    return processGenericResource(resourceType, amount);
}

// Use ResourceTypeInfo for metadata
const energyMetadata = ResourceTypeInfo[ResourceType.ENERGY];
console.log(`${energyMetadata.displayName}: ${energyMetadata.description}`);
```

Example of incorrect implementation:

```typescript
// INCORRECT: Using string literals
resourceManager.addResource('energy', 100);

// INCORRECT: String comparison
if (resourceType === 'minerals') {
  // Process minerals
}

// INCORRECT: String literals in switch
switch (resourceType) {
  case 'energy':
    return processEnergy(amount);
  case 'minerals':
    return processMinerals(amount);
  default:
    return processGenericResource(resourceType, amount);
}
```

Resource type definitions in the codebase:

```typescript
export enum ResourceType {
  MINERALS = 'MINERALS',
  ENERGY = 'ENERGY',
  POPULATION = 'POPULATION',
  RESEARCH = 'RESEARCH',
  PLASMA = 'PLASMA',
  GAS = 'GAS',
  EXOTIC = 'EXOTIC',
  ORGANIC = 'ORGANIC',
  FOOD = 'FOOD',
  // Additional resource types
  IRON = 'IRON',
  COPPER = 'COPPER',
  TITANIUM = 'TITANIUM',
  URANIUM = 'URANIUM',
  WATER = 'WATER',
  HELIUM = 'HELIUM',
  DEUTERIUM = 'DEUTERIUM',
  ANTIMATTER = 'ANTIMATTER',
  DARK_MATTER = 'DARK_MATTER',
  EXOTIC_MATTER = 'EXOTIC_MATTER',
}
```

### Event Types Rule

// .cursor/rules/event-types-rule.json

```json
{
  "name": "Event Types Rule",
  "description": "Enforces the use of EventType enum instead of string literals for event types",
  "filePattern": [
    "src/types/events/**/*.ts",
    "src/managers/events/**/*.ts",
    "src/components/**/use*Events.ts"
  ],
  "content": "When implementing code related to events, you must always use the EventType enum instead of string literals. Event types should be accessed through the enum to ensure type safety and consistency across the codebase."
}
```

Example of correct implementation:

```typescript
// Subscribe to events
const unsubscribe = moduleEventBus.subscribe(EventType.RESOURCE_PRODUCED, event => {
  // Handle event
  if (isResourceProductionEventData(event.data)) {
    const { resourceType, amount } = event.data;
    // Update UI or state...
  }
});

// Emit events
moduleEventBus.emit({
  type: EventType.RESOURCE_PRODUCED,
  moduleId: 'module-id',
  moduleType: ModuleType.RESOURCE_GENERATOR,
  timestamp: Date.now(),
  data: {
    resourceType: ResourceType.ENERGY,
    amount: 100,
  },
});

// Use event type in createEvent helper
const resourceEvent = createEvent(
  EventType.RESOURCE_PRODUCED,
  'resource-module-1',
  ModuleType.RESOURCE_GENERATOR,
  {
    resourceType: ResourceType.ENERGY,
    amount: 100,
  }
);
```

Example of incorrect implementation:

```typescript
// INCORRECT: String literal for event type
const unsubscribe = moduleEventBus.subscribe('RESOURCE_PRODUCED', event => {
  // Handle event
});

// INCORRECT: String literal for event type and incomplete data
moduleEventBus.emit({
  type: 'RESOURCE_PRODUCED',
  data: {
    resourceType: 'energy',
    amount: 100,
  },
});
```

Event type definitions include:

```typescript
export enum EventType {
  // Lifecycle events
  MODULE_CREATED = 'MODULE_CREATED',
  MODULE_ATTACHED = 'MODULE_ATTACHED',
  MODULE_DETACHED = 'MODULE_DETACHED',
  MODULE_UPGRADED = 'MODULE_UPGRADED',
  MODULE_ACTIVATED = 'MODULE_ACTIVATED',
  MODULE_DEACTIVATED = 'MODULE_DEACTIVATED',
  MODULE_UPDATED = 'MODULE_UPDATED',
  MODULE_STATUS_CHANGED = 'MODULE_STATUS_CHANGED',
  MODULE_ALERT_ADDED = 'MODULE_ALERT_ADDED',
  MODULE_REMOVED = 'MODULE_REMOVED',

  // Resource events
  RESOURCE_PRODUCED = 'RESOURCE_PRODUCED',
  RESOURCE_CONSUMED = 'RESOURCE_CONSUMED',
  RESOURCE_TRANSFERRED = 'RESOURCE_TRANSFERRED',
  RESOURCE_PRODUCTION_REGISTERED = 'RESOURCE_PRODUCTION_REGISTERED',
  RESOURCE_PRODUCTION_UNREGISTERED = 'RESOURCE_PRODUCTION_UNREGISTERED',
  RESOURCE_CONSUMPTION_REGISTERED = 'RESOURCE_CONSUMPTION_REGISTERED',
  RESOURCE_CONSUMPTION_UNREGISTERED = 'RESOURCE_CONSUMPTION_UNREGISTERED',
  RESOURCE_FLOW_REGISTERED = 'RESOURCE_FLOW_REGISTERED',
  RESOURCE_FLOW_UNREGISTERED = 'RESOURCE_FLOW_UNREGISTERED',
  RESOURCE_SHORTAGE = 'RESOURCE_SHORTAGE',
  RESOURCE_UPDATED = 'RESOURCE_UPDATED',
  RESOURCE_DISCOVERED = 'RESOURCE_DISCOVERED',

  // Many more event types...
}
```

### Manager Access Rule

// .cursor/rules/manager-access-rule.json

```json
{
  "name": "Manager Access Rule",
  "description": "Enforces accessing managers through the registry pattern",
  "filePattern": ["src/components/**/*.tsx", "src/hooks/**/*.ts", "src/services/**/*.ts"],
  "content": "When accessing manager instances in components, hooks, or services, you must always use the manager registry pattern instead of importing and instantiating managers directly. This prevents circular dependencies and ensures consistent access to singleton manager instances."
}
```

Example of correct implementation:

```typescript
// Import from manager registry
import { getCombatManager } from '../managers/ManagerRegistry';

function someFunction() {
  // Get manager instance from registry
  const combatManager = getCombatManager();

  // Use the manager
  const units = combatManager.getAllUnits();
}
```

Example of incorrect implementation:

```typescript
// INCORRECT: Direct import of manager class
import { CombatManager } from '../managers/combat/CombatManager';

function someFunction() {
  // INCORRECT: Direct instantiation
  const combatManager = new CombatManager();

  // Use the manager
  const units = combatManager.getAllUnits();
  // Manager access should always follow this pattern to avoid circular dependencies and ensure proper singleton management.
}
```

# GALACTIC SPRAWL (GS) - Service Implementation Patterns

### Service Implementation Pattern Rule

// .cursor/rules/service-implementation-pattern.json

```json
{
  "name": "Service Implementation Pattern Rule",
  "description": "Defines how to properly implement services that extend AbstractBaseService",
  "filePattern": ["src/services/**/*.ts"],
  "content": "When implementing services, follow standard patterns for generic type parameters, constructor visibility, and proper error handling."
}
```

Example service implementation:

```typescript
// RealTimeDataService.ts

class RealTimeDataServiceImpl extends AbstractBaseService<RealTimeDataServiceImpl> {
  // Private instance data
  private dataBuffers: Map<string, DataBuffer<unknown>> = new Map();
  private streamConfigs: Map<string, StreamConfig> = new Map();
  private streamIds: Map<string, string> = new Map();
  private listeners: Map<string, Set<(data: unknown[]) => void>> = new Map();
  private generators: Map<string, DataGenerator<unknown>> = new Map();

  // Public constructor for direct instantiation
  public constructor() {
    super('RealTimeDataService', '1.0.0');
  }

  // Implementation of required abstract methods
  protected async onInitialize(dependencies?: Record<string, unknown>): Promise<void> {
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

  protected async onDispose(): Promise<void> {
    const streamIds = Array.from(this.streamIds.values());
    await Promise.all(streamIds.map(id => this.stopStream(id)));

    this.dataBuffers.clear();
    this.streamConfigs.clear();
    this.streamIds.clear();
    this.listeners.clear();
    this.generators.clear();
  }

  // Service-specific methods
  // ...

  // Override handleError for custom error handling
  public override handleError(error: Error): void {
    errorLoggingService.logError(error, ErrorType.RUNTIME, undefined, {
      service: 'RealTimeDataService',
    });
  }
}

// Export singleton instance using direct instantiation
export const realTimeDataService = new RealTimeDataServiceImpl();

// Export default for easier imports
export default realTimeDataService;
```

### Key Implementation Points

1. **Generic Type Parameter**: Always extend `AbstractBaseService<YourServiceImpl>` with your own class as the type parameter.

2. **Constructor**: Use a public constructor to allow direct instantiation:

   ```typescript
   public constructor() {
     super('ServiceName', 'VersionNumber');
   }
   ```

3. **Metadata Handling**: Always check if metrics exists before using:

   ```typescript
   if (!this.metadata.metrics) {
     this.metadata.metrics = {};
   }
   this.metadata.metrics = {
     // Your metrics
   };
   ```

4. **Service Export**: Export an instance using direct instantiation:

   ```typescript
   export const serviceName = new ServiceImpl();
   ```

5. **Error Handling**: Override the handleError method for service-specific error handling:
   ```typescript
   public override handleError(error: Error): void {
     errorLoggingService.logError(error, ErrorType.RUNTIME, undefined, {
       service: 'ServiceName',
     });
   }
   ```

### Service Integration with ServiceRegistry

Services should be registered with the ServiceRegistry in the ServiceProvider component:

```typescript
registry.register('serviceName', () => serviceName, {
  dependencies: ['errorLogging', 'otherDependencies'],
  priority: 20,
});
```

## Resource Registry Implementation

Registry for centralized resource metadata access.

```typescript
typescript// src/registry/ResourceRegistry.ts

export class ResourceRegistry {
  private static _instance: ResourceRegistry | null = null;

  // Storage maps for resource metadata
  private resourceMetadata: Map<ResourceType, ExtendedResourceMetadata> = new Map();
  private resourcesByCategory: Map<ResourceCategory, Set<ResourceType>> = new Map();
  private resourcesByTag: Map<string, Set<ResourceType>> = new Map();

  // Private constructor
  private constructor() {
    this.initializeRegistry();
  }

  // Singleton access
  public static getInstance(): ResourceRegistry {
    if (!ResourceRegistry._instance) {
      ResourceRegistry._instance = new ResourceRegistry();
    }
    return ResourceRegistry._instance;
  }

  // Initialization method
  private initializeRegistry(): void {
    // Register built-in resource types
    Object.values(ResourceType).forEach(type => {
      this.registerResource({
        metadata: RESOURCE_METADATA[type] || {
          id: type,
          displayName: type.toString(),
          description: `Resource of type ${type}`,
          category: ResourceCategory.BASIC,
          defaultMax: 1000,
          icon: 'default-resource-icon',
          tags: [],
        }
      });
    });
  }

  // Registry methods
  public getResourceMetadata(resourceType: ResourceType): ExtendedResourceMetadata | undefined {
    return this.resourceMetadata.get(resourceType);
  }

  public registerResource(options: ResourceRegistrationOptions): boolean {
    // Implementation details...
    return true;
  }

  // Additional methods...
}

// Export the singleton instance
export const resourceRegistry = ResourceRegistry.getInstance();
```

## Registry Usage Patterns

Examples of how to use the registry pattern in different contexts.

### In Manager Classes

```typescript
typescript; // src/managers/resource/ResourceThresholdManager.ts
import { getResourceManager } from '../ManagerRegistry';

export class ResourceThresholdManager {
  // Class implementation...

  private handleResourceUpdate(event: BaseEvent): void {
    if (!isResourceUpdateEvent(event)) return;

    // Access other managers through the registry
    const resourceManager = getResourceManager();
    const resourceState = resourceManager.getResource(event.data.resourceType);

    // Use the manager's methods
    if (resourceState) {
      // Implementation details...
    }
  }
}
```

### In React Components

```typescript
typescript; // src/components/resources/ResourceDisplay.tsx
import { getResourceManager } from '../../managers/ManagerRegistry';

export function ResourceDisplay({ resourceType }: { resourceType: ResourceType }) {
  const [resourceState, setResourceState] = useState<ResourceState | null>(null);

  useEffect(() => {
    // Access manager through registry
    const resourceManager = getResourceManager();
    const state = resourceManager.getResource(resourceType);
    setResourceState(state || null);

    // Subscribe to updates using the manager
    const unsubscribe = moduleEventBus.subscribe(EventType.RESOURCE_UPDATED, event => {
      if (isResourceUpdateEvent(event) && event.data.resourceType === resourceType) {
        setResourceState(resourceManager.getResource(resourceType) || null);
      }
    });

    return unsubscribe;
  }, [resourceType]);

  // Component rendering...
}
```

### In Custom Hooks

```typescript
typescript; // src/hooks/useResourceData.ts
import { getResourceManager } from '../managers/ManagerRegistry';

export function useResourceData(resourceType: ResourceType) {
  const [data, setData] = useState<ResourceState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      // Access manager through registry
      const resourceManager = getResourceManager();
      const resourceState = resourceManager.getResource(resourceType);
      setData(resourceState || null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setData(null);
    } finally {
      setLoading(false);
    }

    // Set up subscription for updates
    const unsubscribe = moduleEventBus.subscribe(EventType.RESOURCE_UPDATED, event => {
      if (isResourceUpdateEvent(event) && event.data.resourceType === resourceType) {
        try {
          const resourceManager = getResourceManager();
          setData(resourceManager.getResource(resourceType) || null);
          setError(null);
        } catch (e) {
          setError(e instanceof Error ? e : new Error(String(e)));
        }
      }
    });

    return unsubscribe;
  }, [resourceType]);

  return { data, loading, error };
}
```
