---
inclusion: fileMatch
fileMatchPattern: ['src/managers/**/*.ts', 'src/**/*Manager.ts', 'src/components/**/*Manager.tsx', 'src/hooks/**/*Manager.ts', 'src/types/managers/**/*.ts']
---

# Manager Access Rule

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
typescript; // INCORRECT: Direct import of manager class
import { CombatManager } from '../managers/combat/CombatManager';

function someFunction() {
  // INCORRECT: Direct instantiation
  const combatManager = new CombatManager();

  // Use the manager
  const units = combatManager.getAllUnits();
}
```
```json
{
  "name": "String Literal Anti-Pattern Rule",
  "description": "Identifies and prevents the use of string literals where enum types exist",
  "filePattern": ["src/**/*.ts", "src/**/*.tsx"],
  "content": "Do not use string literals for values that have corresponding enum types. Always use the appropriate enum type to ensure type safety and consistency across the codebase."
}
```
Anti-patterns to avoid:

1. String literals for resource types:
```typescript
// INCORRECT: Using string literals for resource types
const resourceType = 'energy';
if (resourceType === 'minerals') { /* ... */ }
```

Correct implementation:

```typescript
typescript; // CORRECT: Using ResourceType enum
const resourceType = ResourceType.ENERGY;
if (resourceType === ResourceType.MINERALS) {
  /* ... */
}
```

1. String literals for event types:

```typescript
typescript; // INCORRECT: Using string literals for event types
moduleEventBus.subscribe('RESOURCE_PRODUCED', event => {
  /* ... */
});
```

Correct implementation:

```typescript
typescript; // CORRECT: Using EventType enum
moduleEventBus.subscribe(EventType.RESOURCE_PRODUCED, event => {
  /* ... */
});
```

1. String literals for faction IDs:

```typescript
typescript; // INCORRECT: Using string literals for faction IDs
const faction = 'space-rats';
```

Correct implementation:

```typescript
typescript; // CORRECT: Using FactionId type or enum
const faction: FactionId = 'space-rats';
```

1. String literals for flow node types:

```typescript
typescript; // INCORRECT: Using string literals for flow node types
const nodeType = 'producer';
```

Correct implementation:

```typescript
typescript; // CORRECT: Using FlowNodeType enum
const nodeType = FlowNodeType.PRODUCER;
```

Always use the appropriate enum type for predefined values to leverage TypeScript's type checking capabilities." }

```json
### Type Assertion Anti-Pattern Rule

```json
// .cursor/rules/type-assertion-antipattern.json
{
  "name": "Type Assertion Anti-Pattern Rule",
  "description": "Prevents unsafe type assertions without validation",
  "filePattern": ["src/**/*.ts", "src/**/*.tsx"],
  "content": "Avoid direct type assertions without validation. Always use type guards to validate types at runtime before performing operations that assume a specific type."
}
```
Anti-patterns to avoid:

1. Direct type assertion without validation:
```typescript
// INCORRECT: Unsafe type assertion
function processEvent(event: unknown): void {
  const typedEvent = event as BaseEvent;
  handleEvent(typedEvent);
}
```

Correct implementation using type guards:

```typescript
typescript; // CORRECT: Using type guards for validation
function processEvent(event: unknown): void {
  if (!isValidEvent(event)) {
    console.error('Invalid event received:', event);
    return;
  }

  // Now it's safe to use the event
  handleEvent(event);
}

// Type guard implementation
function isValidEvent(value: unknown): value is BaseEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'moduleId' in value &&
    'timestamp' in value
  );
}
```

1. Direct property access without validation:

```typescript
typescript// INCORRECT: Unsafe property access on potentially undefined objects
function displayResourceInfo(data: unknown): void {
  console.log(`Resource: ${data.type}, Amount: ${data.amount}`);
}
```

Correct implementation using safe extraction:

```typescript
typescript// CORRECT: Using safe extraction utilities
function displayResourceInfo(data: unknown): void {
  if (typeof data !== 'object' || data === null) {
    console.error('Invalid data received:', data);
    return;
  }

  const record = data as Record<string, unknown>;
  const resourceType = safelyExtractString(record, 'type', 'unknown');
  const amount = safelyExtractNumber(record, 'amount', 0);

  console.log(`Resource: ${resourceType}, Amount: ${amount}`);
}
```

Always validate types at runtime before performing operations that assume a specific type structure." 

### Direct Manager Instantiation Anti-Pattern Rule

```json
// .cursor/rules/direct-manager-instantiation-antipattern.json
{
  "name": "Direct Manager Instantiation Anti-Pattern Rule",
  "description": "Prevents direct instantiation of manager classes",
  "filePattern": ["src/**/*.ts", "src/**/*.tsx"],
  "content": "Never directly instantiate manager classes in components, hooks, or services. Always use the manager registry pattern to access manager instances."
}
```
Anti-patterns to avoid:

1. Direct manager class instantiation:
```typescript
// INCORRECT: Direct instantiation of manager class
import { ResourceManager } from '../managers/resource/ResourceManager';

function useResourceData() {
  // INCORRECT: Creating a new instance
  const resourceManager = new ResourceManager();
  return resourceManager.getAllResources();
}
```

Correct implementation using manager registry:

```typescript
typescript; // CORRECT: Using manager registry
import { getResourceManager } from '../managers/ManagerRegistry';

function useResourceData() {
  // CORRECT: Getting the singleton instance
  const resourceManager = getResourceManager();
  return resourceManager.getAllResources();
}
```

1. Instance recreation in hooks or components:

```typescript
typescript; // INCORRECT: Creating manager in component render
function ResourceDisplay() {
  // This creates a new instance on every render
  const resourceManager = new ResourceManager();
  const resources = resourceManager.getAllResources();
  // ...
}
```

Correct implementation in components:

```typescript
typescript; // CORRECT: Using manager registry in effect hook
function ResourceDisplay() {
  const [resources, setResources] = useState([]);

  useEffect(() => {
    const resourceManager = getResourceManager();
    setResources(resourceManager.getAllResources());
  }, []);
  // ...
}
```

### Manager Registry Integration Rule

```json
// .cursor/rules/manager-registry-integration.json
{
  "name": "Manager Registry Integration Rule",
  "description": "Defines how to integrate with the Manager Registry System",
  "filePattern": ["src/managers/**/*.ts", "src/**/*Manager.ts"],
  "content": "When implementing a new manager class, ensure proper integration with the Manager Registry System. This includes implementing the singleton pattern and adding accessor functions to the ManagerRegistry."
}
```
Example manager implementation:
```typescript
// MiningManager.ts
export class MiningManager implements IBaseManager {
  private static _instance: MiningManager | null = null;

  private constructor() {
    // Private constructor prevents direct instantiation
  }

  public static getInstance(): MiningManager {
    if (!MiningManager._instance) {
      MiningManager._instance = new MiningManager();
    }
    return MiningManager._instance;
  }

  // Manager implementation...
}

// Export a default instance for convenience
export const miningManager = MiningManager.getInstance();
```

Example Manager Registry integration:

```typescript
typescript; // ManagerRegistry.ts
// Add to existing imports
import { MiningManager } from './mining/MiningManager';

// Add singleton instance variable
let miningManagerInstance: MiningManager | null = null;

// Add accessor function
export function getMiningManager(): MiningManager {
  if (!miningManagerInstance) {
    miningManagerInstance = MiningManager.getInstance();
  }
  return miningManagerInstance;
}

// Add to resetManagers function
export function resetManagers(): void {
  // Reset other managers...
  miningManagerInstance = null;
}

// Add to exports
export { MiningManager };
```

When using a manager in any other class or component, always access it through the registry:

```typescript
typescriptimport { getMiningManager } from '../managers/ManagerRegistry';

function useMiningData() {
  const [mines, setMines] = useState([]);

  useEffect(() => {
    const miningManager = getMiningManager();
    setMines(miningManager.getAllMines());
  }, []);

  return mines;
}
```"
}
```

## Manager Class Implementation

Manager classes implement the singleton pattern for consistent instance management.

```typescript
typescript; // src/managers/resource/ResourceManager.ts

export class ResourceManager {
  private static instance: ResourceManager | null = null;
  private resources: Map<ResourceType, ResourceState> = new Map();

  // Private constructor to prevent direct instantiation
  private constructor() {
    this.initialize();
  }

  // Static getInstance method for singleton pattern
  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  // Initialization method
  private initialize(): void {
    // Implementation details...
  }

  // Manager methods
  public getResource(type: ResourceType): ResourceState | undefined {
    return this.resources.get(type);
  }

  public addResource(type: ResourceType, amount: number): boolean {
    // Implementation details...
    return true;
  }

  // Additional methods...
}

// Do NOT export a default instance here
// Use the ManagerRegistry to access the instance
```

## Adding a New Manager to the Registry

Steps for implementing a new manager and adding it to the registry.

1. Create the manager class with singleton pattern

```typescript
typescript; // src/managers/exploration/ExplorationManager.ts
export class ExplorationManager {
  private static instance: ExplorationManager | null = null;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): ExplorationManager {
    if (!ExplorationManager.instance) {
      ExplorationManager.instance = new ExplorationManager();
    }
    return ExplorationManager.instance;
  }

  private initialize(): void {
    // Initialization logic
  }

  // Manager methods...
}
```

1. Add to the ManagerRegistry

```typescript
typescript; // src/managers/ManagerRegistry.ts

// 1. Import the manager class
import { ExplorationManager } from './exploration/ExplorationManager';

// 2. Add singleton instance variable
let explorationManagerInstance: ExplorationManager | null = null;

// 3. Add accessor function
export function getExplorationManager(): ExplorationManager {
  if (!explorationManagerInstance) {
    explorationManagerInstance = ExplorationManager.getInstance();
  }
  return explorationManagerInstance;
}

// 4. Update resetManagers function
export function resetManagers(): void {
  // Existing resets...
  explorationManagerInstance = null;
}

// 5. Add to exports
export { ExplorationManager };
```

### Error Handling in Managers

```typescript
typescript// src/managers/resource/ResourceManager.ts

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
            available: resourceState.current
          }
        });

        return false;
      }

      // Remove resource (ensuring it doesn't go below minimum)
      resourceState.current = Math.max(
        resourceState.min,
        resourceState.current - amount
      );

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
          newAmount: resourceState.current
        }
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
          newAmount: resourceState.current
        }
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
            amount
          }
        }
      });

      return false;
    }
  }
}
```

### Error Boundary in Components

```typescript
typescript// src/components/common/ErrorBoundary.tsx

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


## Component and Manager Integration

This example shows how a React component integrates with managers.

```typescript
typescript// src/components/resources/ResourceManager.tsx

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
            consumption: 0
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
    const unsubscribe = moduleEventBus.subscribe(
      EventType.RESOURCE_UPDATED,
      (event: BaseEvent) => {
        if (!isResourceUpdateEvent(event)) return;

        const { resourceType, newAmount } = event.data;

        // Update resource state
        setResources(prev => {
          const updatedResource = { ...prev[resourceType] };
          updatedResource.current = newAmount;

          return {
            ...prev,
            [resourceType]: updatedResource
          };
        });
      }
    );

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

## Direct Manager Instantiation to Registry Access

Migrating from direct manager instantiation to using the Manager Registry.

### Deprecated Approach: Direct Instantiation

```typescript
typescript; // Deprecated: Direct import and instantiation of manager classes
import { ResourceManager } from '../managers/resource/ResourceManager';
import { CombatManager } from '../managers/combat/CombatManager';

function processGame() {
  // Direct instantiation creates multiple instances
  const resourceManager = new ResourceManager();
  const combatManager = new CombatManager();

  // Use managers
  resourceManager.addResource('energy', 100);
  combatManager.initiateCombat('player', 'enemy');
}

// Deprecated: Class with direct manager dependencies
class GameProcessor {
  private resourceManager: ResourceManager;
  private combatManager: CombatManager;

  constructor() {
    // Direct instantiation in constructor
    this.resourceManager = new ResourceManager();
    this.combatManager = new CombatManager();
  }

  // Methods that use the managers...
}
```