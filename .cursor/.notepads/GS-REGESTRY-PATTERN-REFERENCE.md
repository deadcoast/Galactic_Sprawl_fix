# GALACTIC SPAWL (GS) - Registry Pattern Reference

## Overview
This document provides implementation examples of the Registry Pattern as used in the Galactic Sprawl codebase. The Registry Pattern centralizes access to manager instances and helps avoid circular dependencies.

## Manager Registry Implementation

The central Manager Registry provides type-safe access to manager singletons.

```typescript
// src/managers/ManagerRegistry.ts

// Import manager classes
import { ResourceManager } from './resource/ResourceManager';
import { ResourceThresholdManager } from './resource/ResourceThresholdManager';
import { ResourceFlowManager } from './resource/ResourceFlowManager';
import { CombatManager } from './combat/CombatManager';
import { FactionManager } from './factions/FactionManager';
// Additional imports...

// Singleton instance variables
let resourceManagerInstance: ResourceManager | null = null;
let resourceThresholdManagerInstance: ResourceThresholdManager | null = null;
let resourceFlowManagerInstance: ResourceFlowManager | null = null;
let combatManagerInstance: CombatManager | null = null;
let factionManagerInstance: FactionManager | null = null;
// Additional instance variables...

/**
 * Get the singleton instance of ResourceManager
 */
export function getResourceManager(): ResourceManager {
  if (!resourceManagerInstance) {
    resourceManagerInstance = ResourceManager.getInstance();
  }
  return resourceManagerInstance;
}

/**
 * Get the singleton instance of ResourceThresholdManager
 */
export function getResourceThresholdManager(): ResourceThresholdManager {
  if (!resourceThresholdManagerInstance) {
    resourceThresholdManagerInstance = ResourceThresholdManager.getInstance();
  }
  return resourceThresholdManagerInstance;
}

/**
 * Get the singleton instance of ResourceFlowManager
 */
export function getResourceFlowManager(): ResourceFlowManager {
  if (!resourceFlowManagerInstance) {
    resourceFlowManagerInstance = ResourceFlowManager.getInstance();
  }
  return resourceFlowManagerInstance;
}

/**
 * Get the singleton instance of CombatManager
 */
export function getCombatManager(): CombatManager {
  if (!combatManagerInstance) {
    combatManagerInstance = CombatManager.getInstance();
  }
  return combatManagerInstance;
}

/**
 * Get the singleton instance of FactionManager
 */
export function getFactionManager(): FactionManager {
  if (!factionManagerInstance) {
    factionManagerInstance = FactionManager.getInstance();
  }
  return factionManagerInstance;
}

// Additional manager accessor functions...

/**
 * Reset all manager instances - primarily used for testing
 */
export function resetManagers(): void {
  resourceManagerInstance = null;
  resourceThresholdManagerInstance = null;
  resourceFlowManagerInstance = null;
  combatManagerInstance = null;
  factionManagerInstance = null;
  // Reset additional instances...
}

// Export manager classes for type usage
export {
  ResourceManager,
  ResourceThresholdManager,
  ResourceFlowManager,
  CombatManager,
  FactionManager,
  // Additional exports...
};
```

## Manager Class Implementation

Manager classes implement the singleton pattern for consistent instance management.

```typescript
// src/managers/resource/ResourceManager.ts

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

## Resource Registry Implementation

Registry for centralized resource metadata access.

```typescript
// src/registry/ResourceRegistry.ts

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
// src/managers/resource/ResourceThresholdManager.ts
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
// src/components/resources/ResourceDisplay.tsx
import { getResourceManager } from '../../managers/ManagerRegistry';

export function ResourceDisplay({ resourceType }: { resourceType: ResourceType }) {
  const [resourceState, setResourceState] = useState<ResourceState | null>(null);
  
  useEffect(() => {
    // Access manager through registry
    const resourceManager = getResourceManager();
    const state = resourceManager.getResource(resourceType);
    setResourceState(state || null);
    
    // Subscribe to updates using the manager
    const unsubscribe = moduleEventBus.subscribe(
      EventType.RESOURCE_UPDATED,
      (event) => {
        if (
          isResourceUpdateEvent(event) &&
          event.data.resourceType === resourceType
        ) {
          setResourceState(resourceManager.getResource(resourceType) || null);
        }
      }
    );
    
    return unsubscribe;
  }, [resourceType]);
  
  // Component rendering...
}
```

### In Custom Hooks

```typescript
// src/hooks/useResourceData.ts
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
    const unsubscribe = moduleEventBus.subscribe(
      EventType.RESOURCE_UPDATED,
      (event) => {
        if (
          isResourceUpdateEvent(event) &&
          event.data.resourceType === resourceType
        ) {
          try {
            const resourceManager = getResourceManager();
            setData(resourceManager.getResource(resourceType) || null);
            setError(null);
          } catch (e) {
            setError(e instanceof Error ? e : new Error(String(e)));
          }
        }
      }
    );
    
    return unsubscribe;
  }, [resourceType]);
  
  return { data, loading, error };
}
```

## Adding a New Manager to the Registry

Steps for implementing a new manager and adding it to the registry.

1. Create the manager class with singleton pattern

```typescript
// src/managers/exploration/ExplorationManager.ts
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

2. Add to the ManagerRegistry

```typescript
// src/managers/ManagerRegistry.ts

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

## Best Practices

1. Always access managers through the ManagerRegistry
2. Never create manager instances directly
3. Implement managers with singleton pattern and private constructors
4. Use type-safe accessors in the ManagerRegistry
5. Reset managers in tests to ensure clean test environment
6. Document manager dependencies in comments
7. Include error handling for manager method calls
8. Use the registry to avoid circular dependencies
