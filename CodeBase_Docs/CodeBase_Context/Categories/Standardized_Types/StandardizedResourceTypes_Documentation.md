# Standardized Resource Types Documentation

## Overview

This document provides comprehensive information about the standardized resource type system implemented in `src/types/resources/StandardizedResourceTypes.ts`. The implementation addresses the type inconsistencies identified during the resource system analysis and provides a robust type foundation for resource management in the game.

## Key Components

### ResourceType Enum

The `ResourceType` enum replaces string literals for resource types, providing better type safety, autocompletion, and refactoring support.

```typescript
export enum ResourceType {
  MINERALS = 'minerals',
  ENERGY = 'energy',
  POPULATION = 'population',
  RESEARCH = 'research',
  PLASMA = 'plasma',
  GAS = 'gas',
  EXOTIC = 'exotic',
}
```

### ResourceTypeString (Backward Compatibility)

For backward compatibility with existing code that uses string literals:

```typescript
export type ResourceTypeString =
  | 'minerals'
  | 'energy'
  | 'population'
  | 'research'
  | 'plasma'
  | 'gas'
  | 'exotic';
```

### Resource Metadata

Resource metadata provides detailed information about each resource type:

```typescript
export interface ResourceTypeMetadata {
  id: ResourceType;
  displayName: string;
  description: string;
  icon: string;
  category: ResourceCategory;
  defaultMax: number;
}
```

With a lookup object for easy access:

```typescript
export const ResourceTypeInfo: Record<ResourceType, ResourceTypeMetadata> = {
  [ResourceType.MINERALS]: {
    id: ResourceType.MINERALS,
    displayName: 'Minerals',
    description: 'Basic building materials',
    icon: 'mineral-icon',
    category: ResourceCategory.BASIC,
    defaultMax: 1000,
  },
  // Other resource types...
};
```

### ResourceStateClass

The `ResourceStateClass` provides encapsulated state management with validation:

```typescript
export class ResourceStateClass {
  // Core properties with private access
  private _current: number;
  private _max: number;
  private _min: number;
  private _production: number;
  private _consumption: number;
  private _type: ResourceType;

  // Constructor with automatic validation
  constructor(data: {
    type: ResourceType | ResourceTypeString;
    current?: number;
    max?: number;
    min?: number;
    production?: number;
    consumption?: number;
  }) {
    // Implementation details...
  }

  // Getters and setters with validation
  get current(): number {
    return this._current;
  }
  set current(value: number) {
    this._current = Math.max(this._min, Math.min(this._max, value));
  }

  // Computed properties
  get rate(): number {
    return this._production - this._consumption;
  }

  // Backward compatibility
  get value(): number {
    return this._current;
  }

  // Utility methods
  public asObject(): ResourceState {
    /* ... */
  }

  // Static creation methods
  public static fromResourceState(state: ResourceState, type: ResourceType): ResourceStateClass {
    /* ... */
  }
}
```

### Helper Functions

The `ResourceTypeHelpers` object provides utility functions for working with resource types:

```typescript
export const ResourceTypeHelpers = {
  // Convert string to enum
  stringToEnum(type: ResourceTypeString): ResourceType {
    /* ... */
  },

  // Convert enum to string
  enumToString(type: ResourceType): ResourceTypeString {
    /* ... */
  },

  // Get metadata for a resource type
  getMetadata(type: ResourceType | ResourceTypeString): ResourceTypeMetadata {
    /* ... */
  },

  // Get display name for a resource type
  getDisplayName(type: ResourceType | ResourceTypeString): string {
    /* ... */
  },
};
```

## Resource Flow Types

The file includes standardized interfaces for the resource flow system:

- `FlowNodeType` enum for node types (producer, consumer, storage, converter)
- `FlowNode` interface with consistent typing
- `FlowConnection` interface for resource connections
- `ResourceConversionRecipe` interface for conversion recipes
- `ConversionChain` interface for multi-step conversions
- `ChainExecutionStatus` interface for tracking conversion progress

## Migration Guide

### Using in New Code

```typescript
import {
  ResourceType,
  ResourceTypeHelpers,
  ResourceStateClass,
} from 'src/types/resources/StandardizedResourceTypes';

// Using the enum
function processResource(type: ResourceType) {
  console.log(`Processing ${ResourceTypeHelpers.getDisplayName(type)}`);
}

// Using ResourceStateClass
const energyState = new ResourceStateClass({
  type: ResourceType.ENERGY,
  current: 500,
  max: 1000,
  production: 10,
  consumption: 5,
});

// Access computed properties
console.log(`Energy rate: ${energyState.rate}`);
```

### Migrating Existing Code

1. Replace string literals with enum values:

```typescript
// Before
const resourceType = 'minerals';

// After
import { ResourceType } from 'src/types/resources/StandardizedResourceTypes';
const resourceType = ResourceType.MINERALS;
```

2. Convert string types to enum when needed:

```typescript
// For functions that might receive string types from legacy code
import { ResourceType, ResourceTypeHelpers } from 'src/types/resources/StandardizedResourceTypes';

function processResource(type: string | ResourceType) {
  // Convert string to enum if needed
  const resourceType = typeof type === 'string' ? ResourceTypeHelpers.stringToEnum(type) : type;

  // Now use resourceType which is guaranteed to be a ResourceType enum
}
```

3. Replace direct object property access with ResourceStateClass:

```typescript
// Before
function updateResourceUI(resourceState: any) {
  const current = resourceState.value || 0;
  const max = resourceState.max || 100;
  const ratio = current / max;
}

// After
import { ResourceStateClass, ResourceType } from 'src/types/resources/StandardizedResourceTypes';

function updateResourceUI(resourceState: any, resourceType: ResourceType) {
  // Convert to ResourceStateClass for proper handling
  const state = ResourceStateClass.fromResourceState(resourceState, resourceType);
  const ratio = state.current / state.max;
}
```

## Best Practices

1. **Always use the enum**: Use `ResourceType` enum instead of string literals.
2. **Leverage ResourceStateClass**: Use the class for managing resource states to benefit from validation and computed properties.
3. **Use helper methods**: Utilize `ResourceTypeHelpers` for type conversions and metadata access.
4. **Type all resource-related functions**: Ensure functions accept and return properly typed resource data.
5. **Follow naming conventions**: Use consistent property names as defined in the standardized interfaces.

## Common Patterns

### Resource Display Component

```typescript
import React from 'react';
import { ResourceType, ResourceStateClass } from 'src/types/resources/StandardizedResourceTypes';

interface ResourceDisplayProps {
  resourceType: ResourceType;
  resourceState: ResourceStateClass;
}

export const ResourceDisplay: React.FC<ResourceDisplayProps> = ({ resourceType, resourceState }) => {
  return (
    <div className="resource-display">
      <h3>{ResourceTypeHelpers.getDisplayName(resourceType)}</h3>
      <div className="resource-amount">
        {resourceState.current} / {resourceState.max}
      </div>
      <div className="resource-rate">
        Rate: {resourceState.rate > 0 ? '+' : ''}{resourceState.rate}
      </div>
    </div>
  );
};
```

### Resource Manager Integration

```typescript
import { ResourceType, ResourceStateClass } from 'src/types/resources/StandardizedResourceTypes';

class ResourceManager {
  private resourceStates: Map<ResourceType, ResourceStateClass> = new Map();

  constructor() {
    // Initialize with default states
    Object.values(ResourceType).forEach(type => {
      this.resourceStates.set(type, new ResourceStateClass({ type }));
    });
  }

  public getResourceState(type: ResourceType): ResourceStateClass {
    return this.resourceStates.get(type) || new ResourceStateClass({ type });
  }

  public updateResource(type: ResourceType, amount: number): void {
    const state = this.getResourceState(type);
    state.current += amount;
  }
}
```

## Known Issues and Limitations

1. Backward compatibility with string-based types may cause some confusion during the transition period.
2. Some external libraries or APIs might still expect string types, requiring conversion.
3. The ResourceTypeInfo lookup requires manual updates when adding new resource types.

## Next Steps

1. Update the ResourceFlowManager to use the standardized types
2. Migrate UI components to use the new type system
3. Create utility functions for bulk operations on resource collections
4. Add serialization/deserialization support for save/load functionality
