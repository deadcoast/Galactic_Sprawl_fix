---
inclusion: fileMatch
fileMatchPattern: ['src/managers/**/*.ts', 'src/hooks/integration/**/*.ts', 'src/services/**/*.ts', 'src/workers/**/*.ts', 'src/contexts/**/*.tsx', 'src/router/**/*.ts', 'src/api/**/*.ts', 'src/lib/events/**/*.ts', 'src/registry/**/*.ts', 'src/initialization/**/*.ts', 'src/systems/**/*.ts']
---


## Resource and Event System Integration

This example shows how the Resource System integrates with the Event System for resource updates.

```typescript
// src/managers/resource/ResourceManager.ts

export class ResourceManager {
  // Class implementation...

  /**
   * Add resources with event emission
   * @param resourceType The type of resource to add
   * @param amount The amount to add
   * @returns True if the resource was added successfully
   */
  public addResource(resourceType: ResourceType, amount: number): boolean {
    try {
      // Validate input
      if (!isResourceType(resourceType)) {
        console.warn(`[ResourceManager] Invalid resource type: ${resourceType}`);
        return false;
      }

      if (amount <= 0) {
        console.warn(`[ResourceManager] Cannot add non-positive amount: ${amount}`);
        return false;
      }

      // Get current resource state
      let resourceState = this.resources.get(resourceType);

      // Create resource state if it doesn't exist
      if (!resourceState) {
        resourceState = {
          current: 0,
          min: 0,
          max: 1000, // Default maximum
          production: 0,
          consumption: 0,
        };
        this.resources.set(resourceType, resourceState);
      }

      // Store old amount for the event
      const oldAmount = resourceState.current;

      // Add resource (ensuring it doesn't exceed maximum)
      resourceState.current = Math.min(resourceState.max, resourceState.current + amount);

      // Calculate actual amount added (in case of hitting maximum)
      const actualAmount = resourceState.current - oldAmount;

      // Emit resource produced event
      moduleEventBus.emit({
        type: EventType.RESOURCE_PRODUCED,
        moduleId: 'resource-manager',
        moduleType: ModuleType.MANAGER,
        timestamp: Date.now(),
        data: {
          resourceType,
          amount: actualAmount,
          oldAmount,
          newAmount: resourceState.current,
        },
      });

      // Emit resource updated event
      moduleEventBus.emit({
        type: EventType.RESOURCE_UPDATED,
        moduleId: 'resource-manager',
        moduleType: ModuleType.MANAGER,
        timestamp: Date.now(),
        data: {
          resourceType,
          oldAmount,
          newAmount: resourceState.current,
        },
      });

      return true;
    } catch (error) {
      console.error(`[ResourceManager] Error adding resource ${resourceType}:`, error);

      // Emit error event
      moduleEventBus.emit({
        type: EventType.ERROR_OCCURRED,
        moduleId: 'resource-manager',
        moduleType: ModuleType.MANAGER,
        timestamp: Date.now(),
        data: {
          error: error instanceof Error ? error.message : String(error),
          context: {
            action: 'addResource',
            resourceType,
            amount,
          },
        },
      });

      return false;
    }
  }
}
```

## Resource and Threshold System Integration

This example shows how the Resource Threshold System integrates with the Resource System.

```typescript
// src/managers/resource/ResourceThresholdManager.ts

export class ResourceThresholdManager {
  // Class implementation...

  /**
   * Check if a threshold is triggered for a resource
   * @param resourceType The resource type to check
   * @param value The current resource value
   * @param previousValue The previous resource value
   * @returns Threshold data if a threshold was triggered, null otherwise
   */
  public checkThreshold(
    resourceType: ResourceType,
    value: number,
    previousValue?: number
  ): ThresholdTriggeredEventData | null {
    try {
      // Get thresholds for this resource type
      const thresholds = this.getThresholds(resourceType);

      // If no thresholds or no previous value, just check current value
      if (thresholds.length === 0) {
        return null;
      }

      // Determine direction if we have a previous value
      let direction: ThresholdDirection | undefined;
      if (previousValue !== undefined) {
        direction =
          value > previousValue ? ThresholdDirection.INCREASING : ThresholdDirection.DECREASING;
      }

      // Check each threshold
      for (const threshold of thresholds) {
        const { thresholdType, value: thresholdValue } = threshold;

        // Skip if direction doesn't match (e.g., only care about decreasing for LOW threshold)
        if (
          direction !== undefined &&
          ((thresholdType === ThresholdType.LOW && direction !== ThresholdDirection.DECREASING) ||
            (thresholdType === ThresholdType.HIGH && direction !== ThresholdDirection.INCREASING))
        ) {
          continue;
        }

        // Check if threshold is crossed
        const isTriggered = this.isThresholdTriggered(
          thresholdType,
          value,
          thresholdValue,
          previousValue
        );

        if (isTriggered) {
          return {
            resourceType,
            thresholdType,
            currentValue: value,
            thresholdValue,
            direction: direction || ThresholdDirection.INCREASING, // Default if unknown
          };
        }
      }

      return null;
    } catch (error) {
      console.error(
        `[ResourceThresholdManager] Error checking threshold for ${resourceType}:`,
        error
      );

      // Emit error event
      moduleEventBus.emit({
        type: EventType.ERROR_OCCURRED,
        moduleId: 'resource-threshold-manager',
        moduleType: ModuleType.MANAGER,
        timestamp: Date.now(),
        data: {
          error: error instanceof Error ? error.message : String(error),
          context: {
            action: 'checkThreshold',
            resourceType,
            value,
            previousValue,
          },
        },
      });

      return null;
    }
  }

  /**
   * Determine if a threshold is triggered based on type and values
   */
  private isThresholdTriggered(
    thresholdType: ThresholdType,
    currentValue: number,
    thresholdValue: number,
    previousValue?: number
  ): boolean {
    switch (thresholdType) {
      case ThresholdType.CRITICAL:
        return currentValue <= thresholdValue;

      case ThresholdType.LOW:
        // If we have a previous value, check if we crossed the threshold
        if (previousValue !== undefined) {
          return previousValue > thresholdValue && currentValue <= thresholdValue;
        }
        // Otherwise just check if we're below the threshold
        return currentValue <= thresholdValue;

      case ThresholdType.NORMAL:
        return true; // Always in normal range

      case ThresholdType.HIGH:
        // If we have a previous value, check if we crossed the threshold
        if (previousValue !== undefined) {
          return previousValue < thresholdValue && currentValue >= thresholdValue;
        }
        // Otherwise just check if we're above the threshold
        return currentValue >= thresholdValue;

      case ThresholdType.MAXIMUM:
        return currentValue >= thresholdValue;

      default:
        return false;
    }
  }
}
```

## Factory and Manager Integration

This example shows how a Factory integrates with Managers to create entities.

```typescript
// src/factories/modules/ModuleFactory.ts

export class ModuleFactory {
  private static instance: ModuleFactory;

  // Singleton pattern implementation...

  /**
   * Create a module with manager integration
   * @param type The module type
   * @param level The module level
   * @param options Additional options
   * @returns The created module
   */
  public createModule(
    type: ModuleType,
    level: number = 1,
    options: Partial<ModuleOptions> = {}
  ): Module {
    try {
      // Validate module type
      if (!Object.values(ModuleType).includes(type)) {
        throw new Error(`Invalid module type: ${type}`);
      }

      // Get module template
      const template = MODULE_TEMPLATES[type];
      if (!template) {
        throw new Error(`No template found for module type: ${type}`);
      }

      // Validate level
      if (level < 1 || level > template.maxLevel) {
        throw new Error(`Invalid level for module type ${type}: ${level}`);
      }

      // Create the module
      const id = options.id || `module-${type}-${Date.now()}`;
      const scaling = this.calculateLevelScaling(level);

      const module: Module = {
        id,
        type,
        name: options.name || template.name,
        status: options.status || ModuleStatus.INACTIVE,
        level,
        health: Math.round(template.baseHealth * scaling),
        maxHealth: Math.round(template.baseHealth * scaling),
        energyConsumption: Math.round(template.baseEnergyConsumption * scaling),
        efficiency: options.efficiency ?? 100,
        upgradeProgress: 0,
        alerts: [],
        attachedTo: options.attachedTo,
        // Additional properties...
      };

      // Register module with manager if not explicitly disabled
      if (options.registerWithManager !== false) {
        const moduleManager = getModuleManager();
        moduleManager.registerModule(module);
      }

      // Register resource consumption if needed
      if (template.resourceConsumption && module.status === ModuleStatus.ACTIVE) {
        const resourceManager = getResourceManager();

        Object.entries(template.resourceConsumption).forEach(([resourceType, amount]) => {
          const typedResourceType = resourceType as ResourceType;
          resourceManager.registerConsumption(module.id, {
            type: typedResourceType,
            amount: Math.round(amount * scaling),
            interval: 60000, // 1 minute
            required: template.requiredResources?.includes(typedResourceType) ?? false,
          });
        });
      }

      // Emit module created event
      moduleEventBus.emit({
        type: EventType.MODULE_CREATED,
        moduleId: module.id,
        moduleType: module.type,
        timestamp: Date.now(),
        data: { module },
      });

      return module;
    } catch (error) {
      console.error(`[ModuleFactory] Error creating module of type ${type}:`, error);

      // Emit error event
      moduleEventBus.emit({
        type: EventType.ERROR_OCCURRED,
        moduleId: 'module-factory',
        moduleType: ModuleType.FACTORY,
        timestamp: Date.now(),
        data: {
          error: error instanceof Error ? error.message : String(error),
          context: {
            action: 'createModule',
            moduleType: type,
            level,
          },
        },
      });

      // Throw a more specific error for the caller
      throw new Error(
        `Failed to create module of type ${type}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
```

## Component and Manager Integration

This example shows how a React component integrates with managers.

```typescript
// src/components/resources/ResourceManager.tsx

export function ResourceManagerPanel() {
  const [resources, setResources] = useState<Record<ResourceType, ResourceState>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Add resource form state
  const [selectedResource, setSelectedResource] = useState<ResourceType>(ResourceType.ENERGY);
  const [amount, setAmount] = useState<number>(100);

  // Get resource data
  useEffect(() => {
    try {
      setLoading(true);

      // Access manager through registry
      const resourceManager = getResourceManager();

      // Get all resource states
      const resourceStates: Record<ResourceType, ResourceState> = {};

      // Get all resource types
      const resourceRegistry = resourceRegistry.getInstance();
      const resourceTypes = resourceRegistry.getAllResourceTypes();

      // Get state for each resource type
      resourceTypes.forEach(type => {
        const state = resourceManager.getResource(type);
        if (state) {
          resourceStates[type] = state;
        } else {
          // Create default state if not found
          resourceStates[type] = {
            current: 0,
            min: 0,
            max: 1000,
            production: 0,
            consumption: 0,
          };
        }
      });

      setResources(resourceStates);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to resource updates
  useEffect(() => {
    // Subscribe to resource update events
    const unsubscribe = moduleEventBus.subscribe(EventType.RESOURCE_UPDATED, (event: BaseEvent) => {
      if (!isResourceUpdateEvent(event)) return;

      const { resourceType, newAmount } = event.data;

      // Update resource state
      setResources(prev => {
        const updatedResource = { ...prev[resourceType] };
        updatedResource.current = newAmount;

        return {
          ...prev,
          [resourceType]: updatedResource,
        };
      });
    });

    return unsubscribe;
  }, []);

  // Handle adding resources
  const handleAddResource = useCallback(() => {
    try {
      // Access manager through registry
      const resourceManager = getResourceManager();

      // Add resource
      const success = resourceManager.addResource(selectedResource, amount);

      if (!success) {
        setError(new Error(`Failed to add ${amount} of ${selectedResource}`));
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, [selectedResource, amount]);

  // Component rendering...
}
```

## Error Handling and Edge Cases

Examples of error handling and edge case management across systems.

### Error Handling in Managers

```typescript
// src/managers/resource/ResourceManager.ts

export class ResourceManager {
  // Class implementation...

  /**
   * Remove resources with error handling and edge case management
   * @param resourceType The type of resource to remove
   * @param amount The amount to remove
   * @returns True if the resource was removed successfully
   */
  public removeResource(resourceType: ResourceType, amount: number): boolean {
    try {
      // Validate input
      if (!isResourceType(resourceType)) {
        console.warn(`[ResourceManager] Invalid resource type: ${resourceType}`);
        return false;
      }

      if (amount <= 0) {
        console.warn(`[ResourceManager] Cannot remove non-positive amount: ${amount}`);
        return false;
      }

      // Get current resource state
      const resourceState = this.resources.get(resourceType);

      // Handle non-existent resource
      if (!resourceState) {
        console.warn(`[ResourceManager] Cannot remove non-existent resource: ${resourceType}`);
        return false;
      }

      // Store old amount for the event
      const oldAmount = resourceState.current;

      // Check if we have enough resources
      if (resourceState.current < amount) {
        // Edge case: Not enough resources

        // Emit resource shortage event
        moduleEventBus.emit({
          type: EventType.RESOURCE_SHORTAGE,
          moduleId: 'resource-manager',
          moduleType: ModuleType.MANAGER,
          timestamp: Date.now(),
          data: {
            resourceType,
            requested: amount,
            available: resourceState.current,
          },
        });

        return false;
      }

      // Remove resource (ensuring it doesn't go below minimum)
      resourceState.current = Math.max(resourceState.min, resourceState.current - amount);

      // Calculate actual amount removed (in case of hitting minimum)
      const actualAmount = oldAmount - resourceState.current;

      // Emit resource consumed event
      moduleEventBus.emit({
        type: EventType.RESOURCE_CONSUMED,
        moduleId: 'resource-manager',
        moduleType: ModuleType.MANAGER,
        timestamp: Date.now(),
        data: {
          resourceType,
          amount: actualAmount,
          oldAmount,
          newAmount: resourceState.current,
        },
      });

      // Emit resource updated event
      moduleEventBus.emit({
        type: EventType.RESOURCE_UPDATED,
        moduleId: 'resource-manager',
        moduleType: ModuleType.MANAGER,
        timestamp: Date.now(),
        data: {
          resourceType,
          oldAmount,
          newAmount: resourceState.current,
        },
      });

      return true;
    } catch (error) {
      console.error(`[ResourceManager] Error removing resource ${resourceType}:`, error);

      // Emit error event
      moduleEventBus.emit({
        type: EventType.ERROR_OCCURRED,
        moduleId: 'resource-manager',
        moduleType: ModuleType.MANAGER,
        timestamp: Date.now(),
        data: {
          error: error instanceof Error ? error.message : String(error),
          context: {
            action: 'removeResource',
            resourceType,
            amount,
          },
        },
      });

      return false;
    }
  }
}
```

### Error Boundary in Components

```typescript
// src/components/common/ErrorBoundary.tsx

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: Error, resetError: () => void) => React.ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state to show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to the console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log the error to the error logging service
    errorLoggingService.logError({
      type: ErrorType.RUNTIME,
      severity: ErrorSeverity.HIGH,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Show the fallback UI if provided, otherwise show a default error message
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error!, this.resetError);
        }
        return this.props.fallback;
      }

      // Default error message
      return (
        <div className="error-boundary-fallback">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button onClick={this.resetError}>Try again</button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Edge Case: Circular Dependency Handling

```typescript
// src/managers/circular-dependency-example.ts

// PROBLEM: ModuleManager needs ResourceManager, ResourceManager needs ModuleManager

// INCORRECT APPROACH - Direct imports create circular dependencies
// import { ResourceManager } from './ResourceManager';
// import { ModuleManager } from './ModuleManager';

// CORRECT APPROACH - Use the ManagerRegistry

// In ModuleManager.ts
import { getResourceManager } from '../ManagerRegistry';

export class ModuleManager {
  // Class implementation...

  public activateModule(moduleId: string): boolean {
    // Get dependency through registry when needed
    const resourceManager = getResourceManager();

    // Use resourceManager methods
    // ...

    return true;
  }
}

// In ResourceManager.ts
import { getModuleManager } from '../ManagerRegistry';

export class ResourceManager {
  // Class implementation...

  public registerConsumption(moduleId: string, config: ConsumptionConfig): boolean {
    // Validate module exists
    const moduleManager = getModuleManager();
    const module = moduleManager.getModule(moduleId);

    if (!module) {
      console.warn(`[ResourceManager] Cannot register consumption for unknown module: ${moduleId}`);
      return false;
    }

    // Register consumption
    // ...

    return true;
  }
}
```
