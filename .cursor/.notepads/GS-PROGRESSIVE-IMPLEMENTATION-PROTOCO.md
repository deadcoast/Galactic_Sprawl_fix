# GALACTIC SPRAWL (GS) - Progressive Implementation Protocol

## Overview
This document establishes a structured protocol for implementing features in well-defined stages. Following this protocol ensures that implementations are thoroughly planned, properly structured, and consistently integrated with existing systems.

## Implementation Phases

### Phase 1: Context Gathering

Collect and understand all relevant context before beginning implementation.

### Phase 2: Interface Definition

Define interfaces, types, and contracts before implementing functionality.

### Phase 3: Implementation

Implement the functionality following established patterns.

### Phase 4: Testing and Integration

Test the implementation and integrate it with existing systems.

## Phase Templates

````
### Phase 1: Context Gathering Template

# Feature: [Feature Name]

## Context Gathering

### System Context

- Primary Systems: [List primary systems this feature interacts with]
- Secondary Systems: [List secondary systems this feature interacts with]
- Related Components: [List related components or classes]

### Requirements

- [List specific requirements for the feature]

### Existing Patterns

- [Identify existing patterns to follow]

### Data Structures

- [List relevant data structures]

### Event Interactions

- Events Consumed: [List events this feature will consume]
- Events Produced: [List events this feature will produce]

### Open Questions

- [List any questions that need answers before implementation]

### References

- [List relevant documentation references]
````

````
### Phase 2: Interface Definition Template

# Feature: [Feature Name]

## Interface Definition

### Type Definitions

```typescript
// Define required types and interfaces
export interface [InterfaceName] {
  // Properties
}

export type [TypeName] = [TypeDefinition];

export enum [EnumName] {
  // Enum values
}
```

### Manager Interface (if applicable)

```typescript
export interface [ManagerInterface] {
  // Method signatures
}
```

### Component Props (if applicable)

```typescript
export interface [ComponentName]Props {
  // Prop definitions
}
```

### Event Definitions (if applicable)

```typescript
export interface [EventName]Event {
  // Event data structure
}
```

### Integration Points

- [Describe how this interfaces with other systems]

### Validation Approach

- [Describe type guards or validation methods]
````

````
### Phase 3: Implementation Template

# Feature: [Feature Name]

## Implementation

### Class/Component Structure
```
```typescript
// Implementation structure
export class [ClassName] implements [Interface] {
  // Properties and methods
}
```

### Manager Registry Integration (if applicable)

```typescript
// Add to ManagerRegistry.ts
export function get[ManagerName](): [ManagerType] {
  // Implementation
}
```

### Factory Methods (if applicable)

```typescript
// Factory methods
export function create[EntityName](params): [EntityType] {
  // Implementation
}
```

### Event Handling (if applicable)

```typescript
// Event subscription
private setupEventSubscriptions(): void {
  // Implementation
}
```

### Type Safety Implementation

- [Describe type guards and validation]

### Error Handling Strategy

- [Describe error handling approach]
````

````
### Phase 4: Testing and Integration Template

# Feature: [Feature Name]

## Testing and Integration

### Unit Tests

```typescript
// Unit test structure
describe('[Feature]', () => {
  // Test cases
});
```

### Integration Tests

```typescript
// Integration test structure
describe('[Feature] Integration', () => {
  // Test cases
});
```

### Performance Considerations

- [Describe potential performance impacts]

### Edge Cases

- [List identified edge cases and handling]

### Documentation Updates

- [Describe necessary documentation updates]

### Deployment Plan

- [Outline steps for deploying this feature]
````

## Example: Resource Threshold System Implementation

### Phase 1: Context Gathering

# Feature: Resource Threshold System

## Context Gathering

### System Context

- Primary Systems: Resource System, Event System
- Secondary Systems: UI Notification System, Automation System
- Related Components: ResourceManager, ResourceFlowManager

### Requirements

- Track resource thresholds (critical, low, normal, high, maximum)
- Trigger events when thresholds are crossed
- Support registering and unregistering thresholds
- Provide an API for checking threshold status

### Existing Patterns

- Manager singleton pattern
- Event-based communication
- Type-safe implementations with enums
- Safe resource access through the registry

### Data Structures

- ResourceThreshold interface
- ThresholdType enum
- ThresholdDirection enum
- ThresholdEvent interface

### Event Interactions

- Events Consumed: RESOURCE_UPDATED
- Events Produced: RESOURCE_THRESHOLD_TRIGGERED, RESOURCE_THRESHOLD_CHANGED

### Open Questions

- Should thresholds be persistent across game sessions?
- Should thresholds be configurable by the player?

### References

- @GS-Resource-System documentation
- @GS-Event-System documentation
- @GS-Type-Definitions for ResourceType


### Phase 2: Interface Definition

# Feature: Resource Threshold System

## Interface Definition

### Type Definitions

```typescript
/**
 * Types of resource thresholds
 */
export enum ThresholdType {
  CRITICAL = 'critical',
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  MAXIMUM = 'maximum',
}

/**
 * Direction of threshold crossing
 */
export enum ThresholdDirection {
  INCREASING = 'increasing',
  DECREASING = 'decreasing',
}

/**
 * Resource threshold configuration
 */
export interface ResourceThreshold {
  resourceType: ResourceType;
  thresholdType: ThresholdType;
  value: number;
  callback?: (data: ThresholdTriggeredEventData) => void;
}

/**
 * Event data for threshold triggered events
 */
export interface ThresholdTriggeredEventData {
  resourceType: ResourceType;
  thresholdType: ThresholdType;
  currentValue: number;
  thresholdValue: number;
  direction: ThresholdDirection;
}
```

### Manager Interface

```typescript
/**
 * Interface for the resource threshold manager
 */
export interface IResourceThresholdManager {
  /**
   * Set a threshold for a resource type
   */
  setThreshold(threshold: ResourceThreshold): void;
  
  /**
   * Remove a threshold for a resource type
   */
  removeThreshold(resourceType: ResourceType, thresholdType: ThresholdType): boolean;
  
  /**
   * Check if a threshold is triggered for a resource
   */
  checkThreshold(
    resourceType: ResourceType,
    value: number,
    previousValue?: number
  ): ThresholdTriggeredEventData | null;
  
  /**
   * Get all thresholds for a resource type
   */
  getThresholds(resourceType: ResourceType): ResourceThreshold[];
}
```

### Component Props

```typescript
/**
 * Props for the ResourceThresholdDisplay component
 */
export interface ResourceThresholdDisplayProps {
  resourceType: ResourceType;
  showLabels?: boolean;
  compact?: boolean;
  onThresholdClick?: (threshold: ResourceThreshold) => void;
}
```

### Integration Points

- Integrates with ResourceManager to monitor resource changes
- Emits events through the EventSystem when thresholds are triggered
- Will be accessed through the ManagerRegistry

### Phase 3: Implementation

# Feature: Resource Threshold System

## Implementation

### Class Structure

```typescript
/**
 * @context: resource-system.threshold, event-system
 * 
 * Manages resource thresholds and triggers events when thresholds are crossed.
 */
export class ResourceThresholdManager implements IResourceThresholdManager {
  private static instance: ResourceThresholdManager | null = null;
  private thresholds: Map<ResourceType, Map<ThresholdType, ResourceThreshold>> = new Map();
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.setupEventSubscriptions();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ResourceThresholdManager {
    if (!ResourceThresholdManager.instance) {
      ResourceThresholdManager.instance = new ResourceThresholdManager();
    }
    return ResourceThresholdManager.instance;
  }
  
  /**
   * Set up event subscriptions
   * @context: event-system.subscription
   */
  private setupEventSubscriptions(): void {
    moduleEventBus.subscribe(EventType.RESOURCE_UPDATED, this.handleResourceUpdate.bind(this));
  }
  
  /**
   * Handle resource update events
   */
  private handleResourceUpdate(event: BaseEvent): void {
    if (!isResourceUpdateEvent(event)) return;
    
    const { resourceType, oldAmount, newAmount } = event.data;
    
    if (resourceType && typeof oldAmount === 'number' && typeof newAmount === 'number') {
      const result = this.checkThreshold(resourceType, newAmount, oldAmount);
      
      if (result) {
        // Emit threshold triggered event
        moduleEventBus.emit({
          type: EventType.RESOURCE_THRESHOLD_TRIGGERED,
          moduleId: 'resource-threshold-manager',
          moduleType: ModuleType.MANAGER,
          timestamp: Date.now(),
          data: result
        });
        
        // Call threshold callback if defined
        const threshold = this.getThreshold(resourceType, result.thresholdType);
        threshold?.callback?.(result);
      }
    }
  }
  
  /**
   * Set a threshold for a resource type
   */
  public setThreshold(threshold: ResourceThreshold): void {
    if (!this.thresholds.has(threshold.resourceType)) {
      this.thresholds.set(threshold.resourceType, new Map());
    }
    
    this.thresholds.get(threshold.resourceType)?.set(threshold.thresholdType, threshold);
    
    // Emit threshold changed event
    moduleEventBus.emit({
      type: EventType.RESOURCE_THRESHOLD_CHANGED,
      moduleId: 'resource-threshold-manager',
      moduleType: ModuleType.MANAGER,
      timestamp: Date.now(),
      data: {
        resourceType: threshold.resourceType,
        thresholdType: threshold.thresholdType,
        value: threshold.value
      }
    });
  }
  
  // Remaining implementation...
}

// Export singleton instance
export const resourceThresholdManager = ResourceThresholdManager.getInstance();
```

### Manager Registry Integration

```typescript
// Add to ManagerRegistry.ts
import { ResourceThresholdManager } from './resource/ResourceThresholdManager';

// Singleton instance
let resourceThresholdManagerInstance: ResourceThresholdManager | null = null;

/**
 * Get the singleton instance of ResourceThresholdManager
 * @returns The ResourceThresholdManager instance
 */
export function getResourceThresholdManager(): ResourceThresholdManager {
  if (!resourceThresholdManagerInstance) {
    resourceThresholdManagerInstance = ResourceThresholdManager.getInstance();
  }
  return resourceThresholdManagerInstance;
}

// Add to resetManagers function
export function resetManagers(): void {
  // Reset other managers...
  resourceThresholdManagerInstance = null;
}

// Add to exports
export { ResourceThresholdManager };
```

### Type Safety Implementation

```typescript
/**
 * Type guard for threshold triggered event data
 */
export function isThresholdTriggeredEventData(
  data: unknown
): data is ThresholdTriggeredEventData {
  if (!data || typeof data !== 'object') return false;
  
  const d = data as ThresholdTriggeredEventData;
  return (
    'resourceType' in d &&
    'thresholdType' in d &&
    'currentValue' in d &&
    'thresholdValue' in d &&
    'direction' in d &&
    typeof d.currentValue === 'number' &&
    typeof d.thresholdValue === 'number' &&
    (d.direction === ThresholdDirection.INCREASING || 
     d.direction === ThresholdDirection.DECREASING)
  );
}
```

### Error Handling Strategy

```typescript
/**
 * Set a threshold for a resource type with error handling
 */
public setThreshold(threshold: ResourceThreshold): void {
  try {
    // Validate threshold
    if (!isResourceType(threshold.resourceType)) {
      console.warn(
        `[ResourceThresholdManager] Invalid resource type: ${threshold.resourceType}`
      );
      return;
    }
    
    if (!Object.values(ThresholdType).includes(threshold.thresholdType)) {
      console.warn(
        `[ResourceThresholdManager] Invalid threshold type: ${threshold.thresholdType}`
      );
      return;
    }
    
    if (typeof threshold.value !== 'number' || isNaN(threshold.value)) {
      console.warn(
        `[ResourceThresholdManager] Invalid threshold value: ${threshold.value}`
      );
      return;
    }
    
    // Implementation...
  } catch (error) {
    console.error('[ResourceThresholdManager] Error setting threshold:', error);
    
    // Emit error event
    moduleEventBus.emit({
      type: EventType.ERROR_OCCURRED,
      moduleId: 'resource-threshold-manager',
      moduleType: ModuleType.MANAGER,
      timestamp: Date.now(),
      data: {
        error: error instanceof Error ? error.message : String(error),
        context: { 
          action: 'setThreshold', 
          resourceType: threshold.resourceType, 
          thresholdType: threshold.thresholdType 
        }
      }
    });
  }
}
```

### Phase 4: Testing and Integration

```
# Feature: Resource Threshold System

## Testing and Integration

### Unit Tests
```
```typescript
describe('ResourceThresholdManager', () => {
  let manager: ResourceThresholdManager;
  
  beforeEach(() => {
    // Reset managers for clean testing
    resetManagers();
    manager = getResourceThresholdManager();
  });
  
  test('should set threshold correctly', () => {
    const threshold: ResourceThreshold = {
      resourceType: ResourceType.ENERGY,
      thresholdType: ThresholdType.LOW,
      value: 50
    };
    
    manager.setThreshold(threshold);
    
    const thresholds = manager.getThresholds(ResourceType.ENERGY);
    expect(thresholds).toHaveLength(1);
    expect(thresholds[0]).toEqual(threshold);
  });
  
  // Additional test cases...
});
```

### Integration Tests

```typescript
describe('ResourceThresholdManager Integration', () => {
  let thresholdManager: ResourceThresholdManager;
  let resourceManager: ResourceManager;
  
  beforeEach(() => {
    // Reset managers for clean testing
    resetManagers();
    thresholdManager = getResourceThresholdManager();
    resourceManager = getResourceManager();
    
    // Set up initial resource state
    resourceManager.setResource(ResourceType.ENERGY, {
      current: 100,
      max: 200,
      min: 0,
      production: 10,
      consumption: 5
    });
  });
  
  test('should trigger event when threshold crossed', () => {
    // Set up threshold
    thresholdManager.setThreshold({
      resourceType: ResourceType.ENERGY,
      thresholdType: ThresholdType.LOW,
      value: 50
    });
    
    // Set up event listener
    const listener = jest.fn();
    const unsubscribe = moduleEventBus.subscribe(
      EventType.RESOURCE_THRESHOLD_TRIGGERED,
      listener
    );
    
    // Update resource to cross threshold
    resourceManager.updateResource(ResourceType.ENERGY, 40);
    
    // Verify event was triggered
    expect(listener).toHaveBeenCalledTimes(1);
    
    // Cleanup
    unsubscribe();
  });
  
  // Additional test cases...
});
```

### Performance Considerations

- Threshold checking occurs on every resource update, so performance is critical
- The implementation uses Maps for O(1) lookup of thresholds by resource type
- Event subscription is selective to minimize unnecessary processing
- Type guards are optimized to fail fast for invalid data

### Edge Cases

- Resource doesn't exist: Handled by safe access through ResourceManager
- No thresholds for resource: Handled by checking Map existence before lookup
- NaN or invalid values: Validated before threshold operations
- Multiple thresholds triggered at once: All are processed and events emitted

### Documentation Updates

- Update ResourceManager documentation to reference threshold management
- Add ThresholdManager documentation to system documentation
- Add examples of threshold usage to resource system usage guide

### Deployment Plan

1. Implement ResourceThresholdManager
2. Add to ManagerRegistry
3. Update ResourceManager to use thresholds
4. Add UI components for threshold visualization
5. Implement automated tests
6. Deploy with resource system updates