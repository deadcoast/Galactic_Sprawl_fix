# Standardized Resource Types Guide

This guide provides comprehensive documentation on using standardized resource types in the Galactic Sprawl codebase. It includes practical examples, best practices, and common patterns to help developers work effectively with the enum-based resource type system.

## Table of Contents

1. [Introduction](#introduction)
2. [Basic Usage](#basic-usage)
3. [Working with Resource Type Metadata](#working-with-resource-type-metadata)
4. [Type Conversion Utilities](#type-conversion-utilities)
5. [Common Patterns](#common-patterns)
6. [Testing with Resource Types](#testing-with-resource-types)
7. [Performance Considerations](#performance-considerations)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Introduction

The Galactic Sprawl codebase has transitioned from string-based resource types to enum-based resource types to improve type safety, IDE support, and reduce runtime errors. This guide will help you understand how to use the new system effectively.

### Key Benefits

- **Type Safety**: Compile-time checking prevents typos and invalid resource types
- **IDE Support**: Autocompletion, inline documentation, and easier navigation
- **Performance**: Enum comparison is faster than string comparison
- **Metadata**: Centralized resource type information with display names, descriptions, and icons

## Basic Usage

### Importing Resource Types

```typescript
// Import the ResourceType enum
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// If you need resource categories or rarity levels
import { ResourceCategory, ResourceRarity } from '../types/resources/StandardizedResourceTypes';
```

### Using Resource Type Enum Values

```typescript
// Declare a variable with a specific resource type
const resourceType = ResourceType.MINERALS;

// Use in function parameters
function processResource(type: ResourceType, amount: number) {
  // ...
}

// Call with enum value
processResource(ResourceType.ENERGY, 100);
```

### Using Resource Types in Objects

```typescript
// Using resource types as object keys with computed property names
const resourceAmounts = {
  [ResourceType.MINERALS]: 100,
  [ResourceType.ENERGY]: 50,
  [ResourceType.POPULATION]: 25,
};

// Accessing values
const mineralAmount = resourceAmounts[ResourceType.MINERALS]; // 100
```

### Using Resource Types in Maps

```typescript
// Create a Map with resource types as keys
const resourceMap = new Map<ResourceType, number>();
resourceMap.set(ResourceType.MINERALS, 100);
resourceMap.set(ResourceType.ENERGY, 50);

// Get values
const mineralAmount = resourceMap.get(ResourceType.MINERALS); // 100
```

### Type Guards

```typescript
import { isEnumResourceType } from '../utils/resources/ResourceTypeConverter';

// Check if a value is a valid resource type
function processResourceValue(value: unknown) {
  if (isEnumResourceType(value)) {
    // value is now typed as ResourceType
    return `Processing ${value}`;
  }
  return 'Invalid resource type';
}
```

## Working with Resource Type Metadata

The `ResourceTypeInfo` object provides metadata for each resource type:

```typescript
import { ResourceType, ResourceTypeInfo } from '../types/resources/StandardizedResourceTypes';

// Get display name for UI
const displayName = ResourceTypeInfo[ResourceType.MINERALS].displayName; // "Minerals"

// Get description for tooltips
const description = ResourceTypeInfo[ResourceType.ENERGY].description; // "Essential resource for various systems"

// Get icon for rendering
const icon = ResourceTypeInfo[ResourceType.EXOTIC].icon; // "exotic-icon"

// Get category for filtering
const category = ResourceTypeInfo[ResourceType.PLASMA].category; // ResourceCategory.ADVANCED

// Get default max for initialization
const defaultMax = ResourceTypeInfo[ResourceType.GAS].defaultMax; // 800
```

### Example: Creating a Resource Display Component

```typescript
import React from 'react';
import { ResourceType, ResourceTypeInfo } from '../types/resources/StandardizedResourceTypes';

interface ResourceDisplayProps {
  type: ResourceType;
  amount: number;
}

export function ResourceDisplay({ type, amount }: ResourceDisplayProps) {
  const { displayName, icon, description } = ResourceTypeInfo[type];

  return (
    <div className="resource-display" title={description}>
      <img src={`/icons/${icon}.svg`} alt={displayName} />
      <span className="resource-name">{displayName}</span>
      <span className="resource-amount">{amount.toLocaleString()}</span>
    </div>
  );
}
```

## Type Conversion Utilities

During the transition period, you may need to convert between string and enum resource types:

```typescript
import {
  ensureEnumResourceType,
  ensureStringResourceType,
  isStringResourceType,
  isEnumResourceType,
} from '../utils/resources/ResourceTypeConverter';

// Convert any resource type to enum format
const enumType = ensureEnumResourceType('minerals'); // ResourceType.MINERALS
// or
const enumType2 = ensureEnumResourceType(ResourceType.MINERALS); // ResourceType.MINERALS (unchanged)

// Convert any resource type to string format
const stringType = ensureStringResourceType(ResourceType.MINERALS); // "minerals"
// or
const stringType2 = ensureStringResourceType('minerals'); // "minerals" (unchanged)

// Type guards
if (isEnumResourceType(value)) {
  // value is ResourceType
}

if (isStringResourceType(value)) {
  // value is string resource type
}
```

### Converting Collections

```typescript
import {
  toEnumResourceMap,
  toStringResourceMap,
  toEnumResourceRecord,
  toStringResourceRecord,
} from '../utils/resources/ResourceTypeConverter';

// Convert Maps
const stringMap = new Map([
  ['minerals', 100],
  ['energy', 50],
]);
const enumMap = toEnumResourceMap(stringMap);
// Map { ResourceType.MINERALS => 100, ResourceType.ENERGY => 50 }

// Convert Records
const stringRecord = { minerals: 100, energy: 50 };
const enumRecord = toEnumResourceRecord(stringRecord);
// { [ResourceType.MINERALS]: 100, [ResourceType.ENERGY]: 50 }
```

## Common Patterns

### Resource Type Arrays

```typescript
// Define an array of resource types
const basicResources: ResourceType[] = [
  ResourceType.MINERALS,
  ResourceType.ENERGY,
  ResourceType.POPULATION,
];

// Filter resources by category
import { ResourceCategory, ResourceTypeInfo } from '../types/resources/StandardizedResourceTypes';

const advancedResources = Object.values(ResourceType).filter(
  type => ResourceTypeInfo[type].category === ResourceCategory.ADVANCED
);
```

### Resource Type Switches

```typescript
function getResourceColor(type: ResourceType): string {
  switch (type) {
    case ResourceType.MINERALS:
      return '#8B4513'; // Brown
    case ResourceType.ENERGY:
      return '#FFD700'; // Gold
    case ResourceType.POPULATION:
      return '#1E90FF'; // Blue
    case ResourceType.RESEARCH:
      return '#9370DB'; // Purple
    default:
      return '#CCCCCC'; // Gray
  }
}
```

### Resource Type Maps for Configuration

```typescript
// Create a configuration map for resource production rates
const productionRates = new Map<ResourceType, number>([
  [ResourceType.MINERALS, 10],
  [ResourceType.ENERGY, 20],
  [ResourceType.POPULATION, 1],
  [ResourceType.RESEARCH, 5],
]);

// Use in a function
function calculateProduction(type: ResourceType, multiplier: number): number {
  const baseRate = productionRates.get(type) || 0;
  return baseRate * multiplier;
}
```

### Resource Type in React Components

```typescript
import React, { useState } from 'react';
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

export function ResourceSelector({ onSelect }: { onSelect: (type: ResourceType) => void }) {
  const [selectedType, setSelectedType] = useState<ResourceType>(ResourceType.MINERALS);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as ResourceType;
    setSelectedType(newType);
    onSelect(newType);
  };

  return (
    <select value={selectedType} onChange={handleChange}>
      {Object.values(ResourceType).map(type => (
        <option key={type} value={type}>
          {type}
        </option>
      ))}
    </select>
  );
}
```

## Testing with Resource Types

### Unit Testing Resource Functions

```typescript
import { ResourceType } from '../types/resources/StandardizedResourceTypes';
import { ResourceManager } from '../managers/ResourceManager';

describe('ResourceManager', () => {
  let manager: ResourceManager;

  beforeEach(() => {
    manager = new ResourceManager();
  });

  it('should add resources correctly', () => {
    manager.addResource(ResourceType.MINERALS, 100);
    expect(manager.getResourceAmount(ResourceType.MINERALS)).toBe(100);
  });

  it('should not exceed maximum capacity', () => {
    manager.setResourceCapacity(ResourceType.ENERGY, 50);
    manager.addResource(ResourceType.ENERGY, 100);
    expect(manager.getResourceAmount(ResourceType.ENERGY)).toBe(50);
  });
});
```

### Testing UI Components

```typescript
import { render, screen } from '@testing-library/react';
import { ResourceDisplay } from '../components/ResourceDisplay';
import { ResourceType } from '../types/resources/StandardizedResourceTypes';
import { ensureStringResourceType } from '../utils/resources/ResourceTypeConverter';

describe('ResourceDisplay', () => {
  it('renders the correct resource name and amount', () => {
    render(<ResourceDisplay type={ResourceType.MINERALS} amount={1000} />);

    // Use ensureStringResourceType to get the string representation for text matching
    expect(screen.getByText(ensureStringResourceType(ResourceType.MINERALS))).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });
});
```

## Performance Considerations

### Caching Conversion Results

The `ResourceTypeConverter` utilities include caching to optimize performance:

```typescript
// First call performs the conversion and caches the result
const stringType = ensureStringResourceType(ResourceType.MINERALS);

// Subsequent calls with the same input use the cached result
const stringTypeAgain = ensureStringResourceType(ResourceType.MINERALS);
```

### Enum vs String Comparison

Enum comparison is faster than string comparison:

```typescript
// Faster (enum comparison)
if (resourceType === ResourceType.MINERALS) {
  // ...
}

// Slower (string comparison)
if (resourceTypeString === 'minerals') {
  // ...
}
```

## Best Practices

1. **Always use enum values directly**: Prefer `ResourceType.MINERALS` over string literals.

2. **Use ResourceTypeInfo for display**: Get user-facing text from ResourceTypeInfo metadata.

3. **Use computed property names for objects**: Use `[ResourceType.MINERALS]` syntax for object keys.

4. **Leverage type guards**: Use `isEnumResourceType` and `isStringResourceType` for type safety.

5. **Centralize conversion logic**: Use the converter utilities instead of manual conversion.

6. **Provide meaningful error messages**: When handling invalid resource types, include context.

7. **Use null coalescence for safety**: When accessing resources, handle potential undefined values.

   ```typescript
   const amount = resources.get(ResourceType.MINERALS) ?? 0;
   ```

8. **Use type annotations**: Explicitly type variables and parameters for better IDE support.

   ```typescript
   const selectedResource: ResourceType = ResourceType.MINERALS;
   ```

## Troubleshooting

### Common Issues and Solutions

1. **Type Errors with Record Types**

   Problem:

   ```typescript
   // Error: Type '{ [x: string]: number; }' is missing properties from type 'Record<ResourceType, number>'
   const resources: Record<ResourceType, number> = {
     [ResourceType.MINERALS]: 100,
     // Missing other resource types
   };
   ```

   Solution:

   ```typescript
   // Option 1: Provide all required properties
   const resources: Record<ResourceType, number> = {
     [ResourceType.MINERALS]: 100,
     [ResourceType.ENERGY]: 0,
     [ResourceType.POPULATION]: 0,
     // Add all other resource types
   };

   // Option 2: Use Partial type
   const resources: Partial<Record<ResourceType, number>> = {
     [ResourceType.MINERALS]: 100,
   };
   ```

2. **Runtime Errors with Dynamic Resource Types**

   Problem:

   ```typescript
   // Error: resourceType is not a valid ResourceType
   const resourceType = getResourceTypeFromSomewhere();
   processResource(resourceType);
   ```

   Solution:

   ```typescript
   import { isEnumResourceType } from '../utils/resources/ResourceTypeConverter';

   const resourceType = getResourceTypeFromSomewhere();
   if (isEnumResourceType(resourceType)) {
     processResource(resourceType);
   } else {
     console.error(`Invalid resource type: ${resourceType}`);
   }
   ```

3. **Issues with String Literals in Tests**

   Problem:

   ```typescript
   // Error: Type '"minerals"' is not assignable to parameter of type 'ResourceType'
   expect(screen.getByText('minerals')).toBeInTheDocument();
   ```

   Solution:

   ```typescript
   import { ensureStringResourceType } from '../utils/resources/ResourceTypeConverter';

   expect(screen.getByText(ensureStringResourceType(ResourceType.MINERALS))).toBeInTheDocument();
   ```

### Getting Help

If you encounter issues not covered in this guide, please:

1. Check the [ResourceTypeMigrationGuide.md](./ResourceTypeMigrationGuide.md) for migration-specific guidance
2. Review the TypeScript definitions in `StandardizedResourceTypes.ts`
3. Consult the implementation of `ResourceTypeConverter.ts` for conversion utilities
4. Look at example tests in the `tests` directory for testing patterns

---

This guide is a living document and will be updated as the codebase evolves. If you have suggestions for improvements or additional examples, please contribute to this documentation.
