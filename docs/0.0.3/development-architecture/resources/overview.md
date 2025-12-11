# Standardized Resource Types Guide

This guide provides comprehensive documentation on using standardized resource types in the Galactic Sprawl codebase. It includes practical examples, best practices, and common patterns to help developers work effectively with the enum-based resource type system.

# ResourceType Error Fixes Template

This template provides guidance for fixing ResourceType errors in the Galactic Sprawl codebase. ResourceType errors occur when string literals are used instead of the ResourceType enum.

## Common Error Patterns

### Pattern 1: String Literals in Function Parameters

```typescript
// ERROR: String literals used for resource types
function processResource(resourceType: string, amount: number) {
  if (resourceType === 'minerals') {
    // Process minerals
  }
}
```

**Fix**:

```typescript
import { ResourceType } from '../../types/resources/ResourceTypes';

// FIXED: Use ResourceType enum
function processResource(resourceType: ResourceType, amount: number) {
  if (resourceType === ResourceType.MINERALS) {
    // Process minerals
  }
}
```

### Pattern 2: String Literals in Object Properties

```typescript
// ERROR: String literals in object properties
const resources = [
  { type: 'minerals', amount: 100 },
  { type: 'energy', amount: 50 },
];
```

**Fix**:

```typescript
import { ResourceType } from '../../types/resources/ResourceTypes';

// FIXED: Use ResourceType enum in object properties
const resources = [
  { type: ResourceType.MINERALS, amount: 100 },
  { type: ResourceType.ENERGY, amount: 50 },
];
```

### Pattern 3: String Literals in Component Props

```typescript
// ERROR: String literals in component props
<ResourceDisplay resourceType="minerals" amount={100} />
```

**Fix**:

```typescript
import { ResourceType } from '../../types/resources/ResourceTypes';

// FIXED: Use ResourceType enum in component props
<ResourceDisplay resourceType={ResourceType.MINERALS} amount={100} />
```

### Pattern 4: String Literals in JSON Data

```typescript
// ERROR: String literals in JSON data
const resourceData = JSON.parse('{"type":"minerals","amount":100}');
```

**Fix**:

```typescript
import { ResourceType } from '../../types/resources/ResourceTypes';

// FIXED: Convert string to enum after parsing
const resourceData = JSON.parse('{"type":"minerals","amount":100}');
resourceData.type =
  resourceData.type === 'minerals'
    ? ResourceType.MINERALS
    : resourceData.type === 'energy'
      ? ResourceType.ENERGY
      : resourceData.type; // Handle other cases
```

## Fix Implementation Steps

1. **Identify ResourceType Imports**

   - Check if the file already imports ResourceType
   - If not, add import from the correct path
   - Example: `import { ResourceType } from '../../types/resources/ResourceTypes';`

2. **Update Function Signatures**

   - Change parameter types from `string` to `ResourceType`
   - Update return types if functions return resource types

3. **Replace String Literals with Enum Values**

   - Replace 'minerals' with `ResourceType.MINERALS`
   - Replace 'energy' with `ResourceType.ENERGY`
   - Replace other resource strings with their enum counterparts

4. **Update Comparisons**

   - Change `resourceType === 'minerals'` to `resourceType === ResourceType.MINERALS`
   - Change string-based switch statements to enum-based

5. **Handle External Data**
   - For data coming from APIs or JSON, add conversion from string to enum

## Common Issues and Solutions

### Issue 1: Import Path Errors

**Problem**:

```
TS2307: Cannot find module '../../types/resources/ResourceTypes'.
```

**Solution**:
Find the correct import path based on the file location:

```
// For files in src/components/
import { ResourceType } from '../types/resources/ResourceTypes';

// For files in src/utils/
import { ResourceType } from '../types/resources/ResourceTypes';

// For files in src/
import { ResourceType } from './types/resources/ResourceTypes';
```

### Issue 2: Type Incompatibility in API Calls

**Problem**:

```
TS2345: Argument of type 'ResourceType' is not assignable to parameter of type 'string'.
```

**Solution**:
Convert the enum to string when needed:

```typescript
// Before
api.getResource(ResourceType.MINERALS);

// After
api.getResource(ResourceType.MINERALS.toString());
// OR: Update the API function signature to accept ResourceType
```

### Issue 3: Third-Party Library Compatibility

**Problem**:

```
TS2345: Argument of type 'ResourceType' is not assignable to parameter of type '{ id: string; }'.
```

**Solution**:
Create a mapping function:

```typescript
function mapResourceTypeToExternalFormat(type: ResourceType): { id: string } {
  return { id: type.toString() };
}

// Usage
thirdPartyLib.processResource(mapResourceTypeToExternalFormat(ResourceType.MINERALS));
```

## Testing After Fixes

After applying the fixes, test thoroughly:

1. Verify that the code compiles without TypeScript errors
2. Run unit tests for affected components
3. Test UI interactions that involve resource types
4. Verify that data from external sources is properly converted

## Adding New Resource Types

When adding new resource types:

1. Add the new type to the ResourceType enum
2. Update any switch statements or if-else chains that handle all resource types
3. Update any mappings or conversion functions

## Resource Type Standardization

### Overview

The Resource Type Standardization project has successfully transitioned the codebase from string-based to enum-based ResourceType. This standardization improves type safety, IDE support, and reduces runtime errors across the codebase.

### Key Components

#### 1. StandardizedResourceType Enum

```typescript
export enum ResourceType {
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
  POPULATION = 'POPULATION',
  RESEARCH = 'RESEARCH',
  PLASMA = 'PLASMA',
  GAS = 'GAS',
  EXOTIC = 'EXOTIC',
  MINERALS = 'MINERALS',
  ENERGY = 'ENERGY',
}
```

#### 2. ResourceTypeConverter Utility

The `ResourceTypeConverter` utility provides functions for converting between string-based and enum-based resource types, with caching for performance optimization:

```typescript
// Convert string to enum
const enumType = ensureEnumResourceType('minerals'); // ResourceType.MINERALS

// Convert enum to string
const stringType = ensureStringResourceType(ResourceType.MINERALS); // "minerals"

// Type guards
if (isEnumResourceType(value)) {
  // value is ResourceType
}

if (isStringResourceType(value)) {
  // value is string resource type
}
```

#### 3. ResourceRegistry

A centralized registry for resource types and metadata to ensure consistency across the codebase.

#### 4. ResourceTypeInfo Metadata

```typescript
export interface ResourceTypeMetadata {
  id: ResourceType;
  displayName: string;
  description: string;
  icon: string;
  category: ResourceCategory;
  defaultMax: number;
}

export const ResourceTypeInfo: Record<ResourceType, ResourceTypeMetadata> = {
  [ResourceType.IRON]: {
    id: ResourceType.IRON,
    displayName: 'Iron',
    description: 'Basic building material',
    icon: 'iron-icon',
    category: ResourceCategory.BASIC,
    defaultMax: 1000,
  },
  // Other resource types...
};
```

### Implementation Strategy

#### Migration Path

1. For files using string-based ResourceType:

   - Replace `import { ResourceType } from '../types/resources/ResourceTypes'` with `import { ResourceType } from '../types/resources/StandardizedResourceTypes'`
   - Update string literals (e.g., 'minerals') to enum values (e.g., ResourceType.MINERALS)
   - Use ResourceTypeConverter utilities for backward compatibility where needed
   - Add appropriate type annotations for function parameters and return types

2. For files supporting both formats during transition:

   - Import both types with aliases: `import { ResourceType as StringResourceType } from '../types/resources/ResourceTypes'` and `import { ResourceType } from '../types/resources/StandardizedResourceTypes'`
   - Use the ResourceTypeConverter utilities to convert between formats
   - Update function signatures to accept both types where needed

3. For handling deprecation warnings:
   - Use the `warnOnStringResourceTypeUsage` function when string-based resource types are detected
   - Add context information to help identify where the string-based types are being used
   - Follow the migration guide in `src/docs/ResourceTypeMigrationGuide.md`

#### Phased Deprecation Plan

The deprecation process is divided into four phases, each with increasing strictness:

1. **Phase 1: Warnings**

   - Console warnings are emitted when string-based resource types are used
   - Low impact - Developers are informed but code continues to work
   - Purpose: Raise awareness and encourage voluntary migration

2. **Phase 2: Development Errors**

   - Console errors in development mode, warnings in production
   - Medium impact - More visible in development, but doesn't break production
   - Purpose: Increase urgency for developers to update their code

3. **Phase 3: Development Exceptions**

   - Throws errors in development mode, logs errors in production
   - High impact - Breaks development builds, strongly visible in production logs
   - Purpose: Force migration in development while maintaining production stability

4. **Phase 4: Full Removal**
   - Always throws errors (string-based types no longer supported)
   - Critical impact - Breaks any code still using string-based resource types
   - Purpose: Complete the transition to enum-based resource types

The current deprecation phase is controlled by the `RESOURCE_TYPE_DEPRECATION_PHASE` environment variable.

### Benefits

- **Enhanced Type Safety**: Compile-time checking prevents typos and invalid resource types
- **Better IDE Support**: Autocompletion, inline documentation, and easier navigation
- **Reduced Runtime Errors**: Eliminated typos and invalid resource type strings
- **Clearer Code Intent**: Explicit enum values make code more readable
- **Easier Refactoring**: Renaming resource types is safer with enum-based approach
- **Improved Performance**: Enum comparison is faster than string comparison
- **Centralized Management**: Resource type metadata is managed in one place

### Documentation

Comprehensive documentation has been created to support developers:

1. **ResourceTypeMigrationGuide.md** - Guide for migrating from string to enum types
2. **StandardizedResourceTypeGuide.md** - Comprehensive guide with examples and best practices
3. **ApiResourceTypeGuide.md** - Guide for using standardized resource types with the API client
4. **ResourceTypeDeprecationPlan.md** - Documentation for the phased deprecation plan

### Code Quality Enforcement

A custom ESLint rule (`no-string-resource-types`) has been implemented to warn on string literal usage for resource types. The rule:

- Checks if a file imports the `ResourceType` enum from `StandardizedResourceTypes.ts`
- Scans for string literals that match known resource type names
- Reports a warning for each string literal that should be replaced with the enum value
- Provides an auto-fix to replace the string with the corresponding enum value

## Resource System Architecture

### Core Components

1. **ResourceSystem**

   - Singleton that manages all resource-related functionality
   - Uses StandardizedResourceType with compatibility layer
   - Coordinates between specialized subsystems

2. **ResourceFlowSubsystem**

   - Manages resource flow between entities
   - Accepts both string and enum resource types
   - Handles resource transfers and rate calculations

3. **ResourceTransferSubsystem**

   - Manages one-time resource transfers
   - Validates transfers against resource capacities
   - Emits events for successful and failed transfers

4. **ResourceStorageSubsystem**

   - Manages resource storage capacities
   - Handles resource capacity upgrades
   - Provides storage-related queries and validations

5. **ResourceThresholdSubsystem**
   - Manages resource thresholds (critical, low, high)
   - Emits events when thresholds are crossed
   - Provides threshold-related queries

### Integration Points

1. **ResourceRegistry**

   - Centralized registry for resource types and metadata
   - Provides lookup and validation functions
   - Serves as the single source of truth for resource information

2. **ResourceTypeConverter**

   - Converts between string and enum resource types
   - Provides caching for performance optimization
   - Includes type guards for validation

3. **ResourceManager**

   - High-level interface for game systems
   - Coordinates resource operations across subsystems
   - Provides simplified API for common resource operations

4. **UI Components**
   - ResourceDisplay - Shows resource amounts and rates
   - ResourceVisualization - Visualizes resource levels with thresholds
   - ResourceRatesDisplay - Shows production and consumption rates

### Event System

The resource system uses events for communication between components:

1. **Resource Change Events**

   - Emitted when resource amounts change
   - Include resource type, amount, and change reason

2. **Resource Threshold Events**

   - Emitted when resource thresholds are crossed
   - Include resource type, threshold type, and current value

3. **Resource Transfer Events**
   - Emitted when resources are transferred
   - Include source, target, resource type, and amount

## API Integration

The API client has been updated to work with standardized resource types using Zod schemas:

```typescript
// Define a schema for resource data
const resourceSchema = z.object({
  type: z.nativeEnum(ResourceType),
  amount: z.number(),
  capacity: z.number(),
  rate: z.number(),
});

// Use in an API endpoint
const getResourceEndpoint = createApiEndpoint({
  path: '/api/resources/:resourceType',
  method: 'GET',
  requestSchema: z.object({
    resourceType: z.nativeEnum(ResourceType),
  }),
  responseSchema: resourceSchema,
});
```

See `src/docs/ApiResourceTypeGuide.md` for comprehensive examples and best practices.

## Best Practices

1. **Always use enum values directly**: Prefer `ResourceType.MINERALS` over string literals.

2. **Use ResourceTypeInfo for display**: Get user-facing text from ResourceTypeInfo metadata.

3. **Use computed property names for objects**: Use `[ResourceType.MINERALS]` syntax for object keys.

4. **Leverage type guards**: Use `isEnumResourceType` and `isStringResourceType` for type safety.

5. **Centralize conversion logic**: Use the converter utilities instead of manual conversion.

6. **Provide meaningful error messages**: When handling invalid resource types, include context.

7. **Use null coalescence for safety**: When accessing resources, handle potential undefined values.

8. **Use type annotations**: Explicitly type variables and parameters for better IDE support.

## Future Enhancements

1. **Resource Relationships**

   - Implement resource conversion recipes
   - Add resource dependencies
   - Create resource chains and production trees

2. **Advanced Resource Visualization**

   - Implement Sankey diagrams for resource flows
   - Create heat maps for resource distribution
   - Add time-series visualization for resource trends

3. **Resource Optimization**
   - Implement algorithms for optimal resource allocation
   - Add predictive models for resource depletion
   - Create resource efficiency metrics and dashboards

## Documentation References

For developers who need more detailed information about the resource system, the following documentation files are available:

1. **ResourceTypeMigrationGuide.md** (`src/docs/ResourceTypeMigrationGuide.md`)

   - Comprehensive guide for migrating from string-based to enum-based resource types
   - Step-by-step instructions with code examples
   - Common migration patterns and solutions to typical challenges

2. **StandardizedResourceTypeGuide.md** (`src/docs/StandardizedResourceTypeGuide.md`)

   - Detailed guide on using standardized resource types
   - Examples of common patterns and best practices
   - Troubleshooting tips for common issues

3. **ApiResourceTypeGuide.md** (`src/docs/ApiResourceTypeGuide.md`)

   - Guide for using standardized resource types with the API client
   - Examples of defining API endpoints with resource types
   - Best practices for validation and error handling

4. **ResourceTypeDeprecationPlan.md** (`src/docs/ResourceTypeDeprecationPlan.md`)
   - Documentation of the phased deprecation plan for string-based resource types
   - Timeline and impact assessment for each phase
   - Configuration options for controlling deprecation behavior

These documentation files provide comprehensive information for developers working with the resource system and should be consulted when implementing new features or modifying existing code that interacts with resources.

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

# Resource System Type Analysis

## Overview

This document analyzes the type inconsistencies in the resource system, focusing on issues identified through TypeScript type checking. The goal is to create standardized type definitions that ensure consistency across the codebase.

## Identified Type Inconsistencies

### 1. ResourceType Definition

The `ResourceType` is defined as a string literal union type in `src/types/resources/ResourceTypes.ts`:

```typescript
export type ResourceType =
  | 'minerals'
  | 'energy'
  | 'population'
  | 'research'
  | 'plasma'
  | 'gas'
  | 'exotic';
```

**Issues:**

- String literals are less type-safe than enums
- No centralized management of resource type values
- No associated metadata (display names, icons, etc.)

### 2. ResourceState Property Access

The `ResourceState` interface is defined as:

```typescript
export interface ResourceState {
  current: number;
  max: number;
  min: number;
  production: number;
  consumption: number;
}
```

**Issues:**

- UI components access properties inconsistently:
  - Some use `value` instead of `current`
  - Some expect a `max` property on `Resource` interface rather than `ResourceState`
  - Example in `ResourceOptimizationSuggestions.tsx`:
    ```
    Property 'value' does not exist on type 'Resource'.
    Property 'max' does not exist on type 'Resource'.
    ```

### 3. Context Type Access

Resource-related contexts have inconsistent property access patterns:

**Issues:**

- In `ResourceOptimizationSuggestions.tsx`:
  ```
  Property 'minerals' does not exist on type 'ResourceRatesContextType'.
  Property 'energy' does not exist on type 'ResourceRatesContextType'.
  ```
- In `ResourceForecastingVisualization.tsx`:
  ```
  Property 'thresholdState' does not exist on type 'ThresholdContextType'.
  ```

### 4. Iterator Type Issues

The ResourceFlowManager uses Map iterators without proper TypeScript configuration:

```
Type 'MapIterator<[string, ResourceConversionProcess]>' can only be iterated through when using the '--downlevelIteration' flag or with a '--target' of 'es2015' or higher.
```

### 5. Component Props Type Mismatches

UI components have prop type mismatches:

```
Type '{ type: ResourceType; value: number; rate: number; capacity: number; thresholds: { low: number; critical: number; }; }' is not assignable to type 'IntrinsicAttributes'.
```

This indicates that component prop interfaces are not properly defined or used.

## Root Causes

1. **Inconsistent Naming**: Property names differ across files (`value` vs `current`, etc.)
2. **Type vs Interface Confusion**: Some code assumes properties exist on base types that only exist on extended interfaces
3. **Missing Type Guards**: Lack of type guards when accessing potentially undefined properties
4. **Context Type Definition Issues**: Context providers don't properly expose their state types
5. **Configuration Issues**: TypeScript configuration doesn't match the ES features used in the code

## Standardization Recommendations

### 1. ResourceType Standardization

Convert from string literal union to an enum with associated metadata:

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

export interface ResourceTypeMetadata {
  id: ResourceType;
  displayName: string;
  description: string;
  icon: string;
  category: ResourceCategory;
}

export const ResourceTypeInfo: Record<ResourceType, ResourceTypeMetadata> = {
  [ResourceType.MINERALS]: {
    id: ResourceType.MINERALS,
    displayName: 'Minerals',
    description: 'Basic building materials',
    icon: 'mineral-icon',
    category: ResourceCategory.BASIC,
  },
  // ... other resource types
};
```

### 2. Resource Interface Standardization

Create a consistent pattern for resource state properties:

```typescript
export interface ResourceState {
  // Current amount of the resource
  current: number;
  // Also expose as 'value' for backward compatibility
  get value(): number;
  // Maximum capacity
  max: number;
  // Minimum level (typically 0)
  min: number;
  // Production rate per minute
  production: number;
  // Consumption rate per minute
  consumption: number;
  // Net change rate (production - consumption)
  get rate(): number;
}
```

### 3. Context Type Standardization

Standardize context types to ensure consistent property access:

```typescript
export interface ResourceRatesContextType {
  // Resource rates by resource type
  rates: Record<ResourceType, number>;
  // Individual getters for common resources (for convenience)
  minerals: number;
  energy: number;
  population: number;
  research: number;
  // Generic getter
  getRate(type: ResourceType): number;
}

export interface ThresholdContextType {
  // Full threshold state
  state: ThresholdState;
  // Dispatch function for updates
  dispatch: React.Dispatch<ThresholdAction>;
  // Helper methods
  setThreshold(resourceId: ResourceType, min: number, max: number): void;
  toggleAutoMine(resourceId: ResourceType): void;
}
```

### 4. TypeScript Configuration Update

Update the `tsconfig.json` to support Map iteration:

```json
{
  "compilerOptions": {
    "downlevelIteration": true,
    "target": "es2015"
    // ... other options
  }
}
```

### 5. Component Props Standardization

Create strict prop interfaces for UI components:

```typescript
export interface ResourceDisplayProps {
  type: ResourceType;
  value: number;
  rate: number;
  capacity?: number;
  thresholds?: {
    low: number;
    critical: number;
  };
}
```

# API Documentation with Standardized Resource Types

This guide provides examples and best practices for using standardized resource types with the API client in the Galactic Sprawl codebase.

## Table of Contents

1. [Introduction](#introduction)
2. [API Client Overview](#api-client-overview)
3. [Using Resource Types in API Requests](#using-resource-types-in-api-requests)
4. [Validating Resource Types in API Responses](#validating-resource-types-in-api-responses)
5. [Common API Patterns](#common-api-patterns)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

## Introduction

The Galactic Sprawl API client has been updated to work with standardized resource types. This guide shows how to use the `TypeSafeApiClient` with the `ResourceType` enum to ensure type safety and consistency in API requests and responses.

## API Client Overview

The `TypeSafeApiClient` provides type-safe API requests with validation using Zod schemas:

```typescript
import { z } from 'zod';
import { TypeSafeApiClient, createApiClient } from '../api/TypeSafeApiClient';
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// Create an API client instance
const apiClient = createApiClient({
  baseUrl: 'https://api.galacticsprawl.com',
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
});
```

## Using Resource Types in API Requests

### Defining Request Schemas with Resource Types

Use the `ResourceType` enum in your Zod schemas to ensure type safety:

```typescript
import { z } from 'zod';
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// Define a schema for resource update requests
const resourceUpdateSchema = z.object({
  resourceType: z.nativeEnum(ResourceType),
  amount: z.number().positive(),
  operation: z.enum(['add', 'subtract', 'set']),
});

// Type derived from the schema
type ResourceUpdateRequest = z.infer<typeof resourceUpdateSchema>;

// Example request data
const updateRequest: ResourceUpdateRequest = {
  resourceType: ResourceType.MINERALS,
  amount: 100,
  operation: 'add',
};
```

### Creating API Endpoints with Resource Types

Define API endpoints that use resource types:

```typescript
import { z } from 'zod';
import { createApiEndpoint } from '../api/TypeSafeApiClient';
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// Define a response schema for resource data
const resourceResponseSchema = z.object({
  resources: z.array(
    z.object({
      type: z.nativeEnum(ResourceType),
      amount: z.number(),
      capacity: z.number(),
      rate: z.number(),
    })
  ),
  timestamp: z.number(),
});

// Create an API endpoint for fetching resources
const getResourcesEndpoint = createApiEndpoint({
  path: '/api/resources',
  method: 'GET',
  requestSchema: z.object({}),
  responseSchema: resourceResponseSchema,
});

// Create an API endpoint for updating resources
const updateResourceEndpoint = createApiEndpoint({
  path: '/api/resources/update',
  method: 'POST',
  requestSchema: resourceUpdateSchema,
  responseSchema: z.object({
    success: z.boolean(),
    updatedResource: z.object({
      type: z.nativeEnum(ResourceType),
      amount: z.number(),
      capacity: z.number(),
      rate: z.number(),
    }),
  }),
});
```

### Making API Requests

Use the API client to make requests with resource types:

```typescript
// Fetch resources
async function fetchResources() {
  try {
    const response = await apiClient.request(getResourcesEndpoint);
    return response.data.resources;
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    return [];
  }
}

// Update a resource
async function updateResource(type: ResourceType, amount: number) {
  try {
    const response = await apiClient.request(updateResourceEndpoint, {
      resourceType: type,
      amount: amount,
      operation: 'add',
    });
    return response.data.updatedResource;
  } catch (error) {
    console.error(`Failed to update ${type}:`, error);
    return null;
  }
}

// Example usage
updateResource(ResourceType.ENERGY, 50).then(result => {
  if (result) {
    console.log(`Updated ${result.type} to ${result.amount}`);
  }
});
```

## Validating Resource Types in API Responses

### Using Zod to Validate Resource Types

The API client automatically validates responses using Zod schemas:

```typescript
import { z } from 'zod';
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// Define a schema for resource data
const resourceSchema = z.object({
  type: z.nativeEnum(ResourceType),
  amount: z.number(),
  capacity: z.number(),
  rate: z.number(),
});

// Use in an API endpoint
const getResourceEndpoint = createApiEndpoint({
  path: '/api/resources/:resourceType',
  method: 'GET',
  requestSchema: z.object({
    resourceType: z.nativeEnum(ResourceType),
  }),
  responseSchema: resourceSchema,
});

// Make a request with automatic validation
async function getResource(type: ResourceType) {
  try {
    // The response is automatically validated against the schema
    const response = await apiClient.request(getResourceEndpoint, {
      resourceType: type,
    });

    // response.data is typed as the inferred type from resourceSchema
    return response.data;
  } catch (error) {
    console.error(`Failed to get ${type}:`, error);
    return null;
  }
}
```

### Handling Invalid Resource Types

The API client will throw validation errors for invalid resource types:

```typescript
import { ApiErrorType } from '../api/TypeSafeApiClient';

async function safeGetResource(type: unknown) {
  try {
    // This will throw if type is not a valid ResourceType
    if (!isEnumResourceType(type)) {
      throw new Error(`Invalid resource type: ${type}`);
    }

    const response = await getResource(type);
    return response;
  } catch (error) {
    if (error instanceof ApiError && error.type === ApiErrorType.REQUEST_VALIDATION_ERROR) {
      console.error('Invalid resource type in request:', error.validationErrors);
    } else if (error instanceof ApiError && error.type === ApiErrorType.RESPONSE_VALIDATION_ERROR) {
      console.error('Invalid resource type in response:', error.validationErrors);
    } else {
      console.error('Other error:', error);
    }
    return null;
  }
}
```

## Common API Patterns

### Fetching Multiple Resource Types

```typescript
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// Define an endpoint for fetching multiple resources
const getMultipleResourcesEndpoint = createApiEndpoint({
  path: '/api/resources/batch',
  method: 'POST',
  requestSchema: z.object({
    resourceTypes: z.array(z.nativeEnum(ResourceType)),
  }),
  responseSchema: z.object({
    resources: z.record(z.nativeEnum(ResourceType), resourceSchema),
  }),
});

// Fetch multiple resources
async function fetchMultipleResources(types: ResourceType[]) {
  try {
    const response = await apiClient.request(getMultipleResourcesEndpoint, {
      resourceTypes: types,
    });

    return response.data.resources;
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    return {};
  }
}

// Example usage
fetchMultipleResources([ResourceType.MINERALS, ResourceType.ENERGY, ResourceType.POPULATION]).then(
  resources => {
    // resources is a record with ResourceType keys
    const minerals = resources[ResourceType.MINERALS];
    const energy = resources[ResourceType.ENERGY];

    console.log(`Minerals: ${minerals.amount}, Energy: ${energy.amount}`);
  }
);
```

### Resource Transfer API

```typescript
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// Define a schema for resource transfers
const resourceTransferSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  resourceType: z.nativeEnum(ResourceType),
  amount: z.number().positive(),
});

// Create an API endpoint for resource transfers
const transferResourceEndpoint = createApiEndpoint({
  path: '/api/resources/transfer',
  method: 'POST',
  requestSchema: resourceTransferSchema,
  responseSchema: z.object({
    success: z.boolean(),
    source: resourceSchema,
    target: resourceSchema,
  }),
});

// Transfer resources between entities
async function transferResource(
  sourceId: string,
  targetId: string,
  type: ResourceType,
  amount: number
) {
  try {
    const response = await apiClient.request(transferResourceEndpoint, {
      sourceId,
      targetId,
      resourceType: type,
      amount,
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to transfer ${type}:`, error);
    return null;
  }
}
```

## Error Handling

### Resource-Specific Error Handling

```typescript
import { ApiError, ApiErrorType } from '../api/TypeSafeApiClient';
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// Handle resource-specific errors
async function handleResourceOperation(type: ResourceType, operation: () => Promise<any>) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ApiError) {
      switch (error.type) {
        case ApiErrorType.REQUEST_VALIDATION_ERROR:
          console.error(`Invalid request for ${type} operation:`, error.validationErrors);
          break;
        case ApiErrorType.RESPONSE_VALIDATION_ERROR:
          console.error(`Invalid response for ${type} operation:`, error.validationErrors);
          break;
        case ApiErrorType.NOT_FOUND_ERROR:
          console.error(`Resource ${type} not found`);
          break;
        case ApiErrorType.BAD_REQUEST_ERROR:
          console.error(`Bad request for ${type} operation:`, error.message);
          break;
        default:
          console.error(`Error during ${type} operation:`, error.message);
      }
    } else {
      console.error(`Unknown error during ${type} operation:`, error);
    }
    return null;
  }
}

// Example usage
handleResourceOperation(ResourceType.ENERGY, () => updateResource(ResourceType.ENERGY, 100));
```

## Best Practices

1. **Always use the ResourceType enum** in API requests and schemas

   ```typescript
   // Good
   const schema = z.object({ type: z.nativeEnum(ResourceType) });

   // Bad
   const schema = z.object({ type: z.string() });
   ```

2. **Use Zod's nativeEnum validator** for ResourceType validation

   ```typescript
   // Good
   z.nativeEnum(ResourceType);

   // Bad
   z.enum(['minerals', 'energy', 'population']);
   ```

3. **Create reusable schemas** for common resource structures

   ```typescript
   const resourceSchema = z.object({
     type: z.nativeEnum(ResourceType),
     amount: z.number(),
     // ...
   });

   // Reuse in multiple endpoints
   const endpoint1 = createApiEndpoint({
     // ...
     responseSchema: resourceSchema,
   });

   const endpoint2 = createApiEndpoint({
     // ...
     responseSchema: z.object({
       resources: z.array(resourceSchema),
     }),
   });
   ```

4. **Handle validation errors gracefully**

   ```typescript
   try {
     const result = await apiClient.request(endpoint);
     // Use result
   } catch (error) {
     if (error instanceof ApiError && error.type === ApiErrorType.VALIDATION_ERROR) {
       // Handle validation error
       console.error('Validation error:', error.validationErrors);
     } else {
       // Handle other errors
     }
   }
   ```

5. **Use type inference from schemas** for request and response types

   ```typescript
   // Define schema
   const resourceSchema = z.object({
     type: z.nativeEnum(ResourceType),
     amount: z.number(),
   });

   // Infer type
   type ResourceData = z.infer<typeof resourceSchema>;

   // Use inferred type
   function processResource(resource: ResourceData) {
     // Type-safe access to resource.type and resource.amount
   }
   ```

6. **Document API endpoints** with JSDoc comments

   ```typescript
   /**
    * Endpoint for fetching resource data
    *
    * @param {ResourceType} resourceType - The type of resource to fetch
    * @returns {Promise<ResourceData>} The resource data
    */
   const getResourceEndpoint = createApiEndpoint({
     // ...
   });
   ```

7. **Create helper functions** for common API operations

   ```typescript
   /**
    * Fetches the current amount of a resource
    *
    * @param {ResourceType} type - The resource type to fetch
    * @returns {Promise<number>} The current amount of the resource
    */
   async function getResourceAmount(type: ResourceType): Promise<number> {
     const resource = await getResource(type);
     return resource?.amount ?? 0;
   }
   ```

8. **Use computed property names** for resource type keys in objects

   ```typescript
   // Good
   const resourceAmounts = {
     [ResourceType.MINERALS]: 100,
     [ResourceType.ENERGY]: 50,
   };

   // Bad
   const resourceAmounts = {
     minerals: 100,
     energy: 50,
   };
   ```

By following these guidelines, you'll ensure type safety and consistency when working with resource types in API requests and responses.

# Migration Guide: String Literals to ResourceType Enum

This guide provides step-by-step instructions for migrating components from string-based resource types to the new `ResourceType` enum system.

## Why Migrate?

The string-based resource type system has several limitations:

- No type safety (TypeScript can't catch typos)
- No intellisense support (no autocomplete in IDEs)
- Inconsistent type usage across components
- Difficult to refactor (string literals are hard to find and replace)

The new enum-based system addresses these issues and provides additional benefits like metadata lookup and display formatting.

## Migration Checklist

Follow these steps to migrate your component or module:

### Step 1: Update Imports

Add the `ResourceType` enum import to your file:

```typescript
// Before
import { ResourceState } from '../types/resources/ResourceTypes';

// After
import { ResourceType, ResourceState } from '../types/resources/StandardizedResourceTypes';
```

### Step 2: Update Props and Interfaces

Replace string literals with the enum in prop types and interfaces:

```typescript
// Before
interface MyComponentProps {
  resourceType: string;
}

// After
interface MyComponentProps {
  resourceType: ResourceType;
}
```

### Step 3: Update Variable Declarations

Replace string literals with enum values:

```typescript
// Before
const resourceType = 'energy';

// After
const resourceType = ResourceType.ENERGY;
```

### Step 4: Update Conditional Statements

Replace string comparisons with enum comparisons:

```typescript
// Before
if (resource.type === 'energy') {
  // Handle energy resource
}

// After
if (resource.type === ResourceType.ENERGY) {
  // Handle energy resource
}
```

### Step 5: Update Switch Statements

Replace string cases with enum cases:

```typescript
// Before
switch (resource.type) {
  case 'energy':
    return 'energy-icon';
  case 'minerals':
    return 'minerals-icon';
  default:
    return 'default-icon';
}

// After
switch (resource.type) {
  case ResourceType.ENERGY:
    return 'energy-icon';
  case ResourceType.MINERALS:
    return 'minerals-icon';
  default:
    return 'default-icon';
}
```

### Step 6: Update Array Declarations

Replace string arrays with enum arrays:

```typescript
// Before
const resourceTypes = ['energy', 'minerals', 'gas'];

// After
const resourceTypes = [ResourceType.ENERGY, ResourceType.MINERALS, ResourceType.GAS];
```

### Step 7: Update API Calls and Method Parameters

Replace string parameters with enum parameters:

```typescript
// Before
resourceManager.addResource('energy', 10);
resourceManager.getResourceState('energy');

// After
resourceManager.addResource(ResourceType.ENERGY, 10);
resourceManager.getResourceState(ResourceType.ENERGY);
```

### Step 8: Update UI Display

Use the ResourceTypeHelpers for proper display formatting:

```typescript
// Before
<div>{resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}</div>

// After
import { ResourceTypeHelpers } from '../types/resources/StandardizedResourceTypes';

<div>{ResourceTypeHelpers.getDisplayName(resource.type)}</div>
```

### Step 9: Handle Legacy API Compatibility

For functions that still require string inputs, use the conversion helpers:

```typescript
// If you need to interface with a legacy API that uses strings
const stringType = ResourceTypeHelpers.enumToString(ResourceType.ENERGY);
legacyApi.process(stringType);

// If you receive string types from a legacy API
const enumType = ResourceTypeHelpers.stringToEnum(legacyStringType);
```

### Step 10: Update Tests

Don't forget to update your tests to use the enum values:

```typescript
// Before
expect(component.props.resourceType).toBe('energy');

// After
expect(component.props.resourceType).toBe(ResourceType.ENERGY);
```

## Common Scenarios

### Migrating JSX Components

```tsx
// Before
<ResourceDisplay resourceType="energy" />

// After
<ResourceDisplay resourceType={ResourceType.ENERGY} />
```

### Migrating Array Filters

```typescript
// Before
const energyResources = resources.filter(r => r.type === 'energy');

// After
const energyResources = resources.filter(r => r.type === ResourceType.ENERGY);
```

### Migrating Maps and Objects

```typescript
// Before
const resourceLimits = {
  energy: 1000,
  minerals: 500,
};

// After
const resourceLimits = {
  [ResourceType.ENERGY]: 1000,
  [ResourceType.MINERALS]: 500,
};
```

## Handling Type Errors During Migration

If you encounter type errors during migration, use these strategies:

### TypeScript Assertion for Quick Fixes

```typescript
// If you need a quick fix during incremental migration
(resource.type as unknown as ResourceType) === ResourceType.ENERGY;
```

### Gradual Property Migration

```typescript
// For interfaces being migrated incrementally
interface Resource {
  // Allow both types during migration
  type: ResourceType | string;
}
```

## Testing Your Migration

1. Run TypeScript compiler to check for type errors
2. Run unit tests to verify functionality
3. Check browser console for deprecation warnings
4. Verify UI displays correct resource names

## Timeline

- Phase 1: Add ResourceType enum imports and update local variables
- Phase 2: Update component props and interfaces
- Phase 3: Update conditional logic and display formatting
- Phase 4: Remove usage of deprecated string literals

## Getting Help

If you encounter issues during migration, refer to:

- `StandardizedResourceTypes_Guide.md` for usage examples
- The working implementation in `ResourceFlowManager.ts`
- The test examples in `ResourceFlowManager.enum.test.ts`

## Conclusion

By migrating to the ResourceType enum system, you'll help improve type safety, developer experience, and maintainability of the codebase. The migration process is straightforward but requires attention to detail to ensure all string literals are properly replaced with their enum equivalents.

## Next Steps

1. Create a standardized type definitions file for resources
2. Update ResourceType to use enum approach for better type safety
3. Create helpers for backward compatibility during transition
4. Update UI components to use standardized property access
5. Fix TypeScript configuration for proper Map iteration support
6. Update context providers to expose properly typed state and methods

## Conclusion

Following these standardized patterns will ensure consistency, improve type safety, and enhance the developer experience throughout the codebase. Always use enum values for resource types and leverage the helper methods provided in the StandardizedResourceTypes module.

## Known Issues and Limitations

1. Backward compatibility with string-based types may cause some confusion during the transition period.
2. Some external libraries or APIs might still expect string types, requiring conversion.
3. The ResourceTypeInfo lookup requires manual updates when adding new resource types.

## Next Steps

1. Update the ResourceFlowManager to use the standardized types
2. Migrate UI components to use the new type system
3. Create utility functions for bulk operations on resource collections
4. Add serialization/deserialization support for save/load functionality

### Getting Help

If you encounter issues not covered in this guide, please:

1. Check the [ResourceTypeMigrationGuide.md](./ResourceTypeMigrationGuide.md) for migration-specific guidance
2. Review the TypeScript definitions in `StandardizedResourceTypes.ts`
3. Consult the implementation of `ResourceTypeConverter.ts` for conversion utilities
4. Look at example tests in the `tests` directory for testing patterns

---

This guide is a living document and will be updated as the codebase evolves. If you have suggestions for improvements or additional examples, please contribute to this documentation.
