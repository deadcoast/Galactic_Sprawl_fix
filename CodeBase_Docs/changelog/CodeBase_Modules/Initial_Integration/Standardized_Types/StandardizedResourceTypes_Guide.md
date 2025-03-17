# Developer Guide: Working with Standardized Resource Types

This guide explains how to work with the standardized resource type system in the Galactic Sprawl codebase. Following these patterns will ensure type safety, consistency, and better developer experience.

## Core Type System

The resource type system uses TypeScript enums instead of string literals for improved type safety and developer experience:

```typescript
// ✅ DO use the ResourceType enum
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// Good example - using enum
function processResource(type: ResourceType) {
  if (type === ResourceType.ENERGY) {
    // Process energy
  }
}

// ❌ DON'T use string literals directly
// Bad example - using string literals
function processResource(type: string) {
  if (type === 'energy') {
    // No type safety!
    // Process energy
  }
}
```

## ResourceType Enum Values

Always use the enum value for resource types:

| ResourceType Enum         | String Value (Internal) |
| ------------------------- | ----------------------- |
| `ResourceType.MINERALS`   | 'minerals'              |
| `ResourceType.ENERGY`     | 'energy'                |
| `ResourceType.POPULATION` | 'population'            |
| `ResourceType.RESEARCH`   | 'research'              |
| `ResourceType.PLASMA`     | 'plasma'                |
| `ResourceType.GAS`        | 'gas'                   |
| `ResourceType.EXOTIC`     | 'exotic'                |

## Helper Functions

### Converting Between Types

Use the `ResourceTypeHelpers` for any conversions between strings and enum values:

```typescript
import { ResourceType, ResourceTypeHelpers } from '../types/resources/StandardizedResourceTypes';

// Convert string to enum
const energyEnum = ResourceTypeHelpers.stringToEnum('energy'); // Returns ResourceType.ENERGY

// Convert enum to string
const energyString = ResourceTypeHelpers.enumToString(ResourceType.ENERGY); // Returns 'energy'
```

### Getting Resource Metadata

```typescript
// Get display name (capitalized name for UI)
const displayName = ResourceTypeHelpers.getDisplayName(ResourceType.ENERGY); // Returns 'Energy'

// Get full metadata
const metadata = ResourceTypeHelpers.getMetadata(ResourceType.ENERGY);
// Returns: {
//   id: ResourceType.ENERGY,
//   displayName: 'Energy',
//   description: 'Power for modules and systems',
//   icon: 'energy-icon',
//   category: ResourceCategory.BASIC,
//   defaultMax: 1000,
// }
```

## ResourceStateClass for State Management

The `ResourceStateClass` provides a consistent way to manage resource state with built-in validation:

```typescript
import { ResourceType, ResourceStateClass } from '../types/resources/StandardizedResourceTypes';

// Create a new resource state
const energyState = new ResourceStateClass({
  type: ResourceType.ENERGY,
  current: 50,
  max: 100,
  min: 0,
  production: 10,
  consumption: 5,
});

// Get computed properties
const netRate = energyState.rate; // 5 (production - consumption)

// Use with resource manager
resourceManager.updateResourceState(ResourceType.ENERGY, energyState.asObject());
```

## Resource Flow Components

Use the standardized types for resource flow components:

```typescript
import {
  ResourceType,
  FlowNodeType,
  FlowNode,
  FlowConnection,
} from '../types/resources/StandardizedResourceTypes';

// Create a producer node
const producerNode: FlowNode = {
  id: 'energy-producer',
  type: FlowNodeType.PRODUCER,
  resources: [ResourceType.ENERGY],
  priority: { type: ResourceType.ENERGY, priority: 1, consumers: [] },
  active: true,
};

// Create a connection
const connection: FlowConnection = {
  id: 'energy-connection',
  source: 'energy-producer',
  target: 'energy-consumer',
  resourceType: ResourceType.ENERGY,
  maxRate: 10,
  currentRate: 5,
  priority: { type: ResourceType.ENERGY, priority: 1, consumers: [] },
  active: true,
};
```

## Migrating from String Literals

If you're updating older code, follow these patterns:

### For Component Props

```typescript
// Before
interface ResourceDisplayProps {
  resourceType: string; // Uses string literal
}

// After
interface ResourceDisplayProps {
  resourceType: ResourceType; // Uses enum
}
```

### For Resource Operations

```typescript
// Before
resourceManager.addResource('energy', 10);

// After
resourceManager.addResource(ResourceType.ENERGY, 10);
```

### For Conditional Logic

```typescript
// Before
if (resource.type === 'energy') {
  // Handle energy
}

// After
if (resource.type === ResourceType.ENERGY) {
  // Handle energy
}
```

## Best Practices

1. **Always use enum values** - Never use string literals for resource types
2. **Use ResourceTypeHelpers for display names** - Don't manually capitalize or format resource names
3. **Use ResourceStateClass for state management** - It provides validation and computed properties
4. **Use JSDoc deprecation warnings** - Mark deprecated functions with `@deprecated` tags
5. **Add intellisense comments** - Document parameters and return types for better developer experience

## Type Safety Benefits

- **Compile-time checking** - TypeScript will catch invalid resource types
- **Intellisense support** - Editors will provide autocomplete for resource types
- **Refactoring support** - Renaming a resource type will update all references
- **Documentation** - Types provide self-documenting code

## Resource Type Category System

Resources are organized into categories that determine their properties and behavior:

```typescript
export enum ResourceCategory {
  BASIC = 'basic',
  ADVANCED = 'advanced',
  SPECIAL = 'special',
}
```

Use these categories when filtering or grouping resources in the UI or game logic.

## Working with Resource Thresholds

Use the `ResourceThreshold` interface for defining thresholds:

```typescript
import { ResourceType, ResourceThreshold } from '../types/resources/StandardizedResourceTypes';

const energyThreshold: ResourceThreshold = {
  resourceId: ResourceType.ENERGY,
  min: 0,
  max: 1000,
  critical: 50,
  low: 200,
  high: 800,
  maximum: 950,
};
```

## Conclusion

Following these standardized patterns will ensure consistency, improve type safety, and enhance the developer experience throughout the codebase. Always use enum values for resource types and leverage the helper methods provided in the StandardizedResourceTypes module.
