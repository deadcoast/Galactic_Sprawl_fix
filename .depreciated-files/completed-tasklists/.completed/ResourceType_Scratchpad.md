# Resource Type Migration Guide

## Consolidated Tasklist

### Deprecation Plan Timeline

- [ ] Phase 1: Warnings (Current - Q2 2023)
  - Console warnings when string-based resource types are used
- [ ] Phase 2: Development Errors (Q3 2023)
  - Console errors in development, warnings in production
- [ ] Phase 3: Development Exceptions (Q4 2023)
  - Throws errors in development, logs errors in production
- [ ] Phase 4: Full Removal (Q1 2024)
  - String-based types no longer supported

### Migration Steps

- [ ] Update imports to use StandardizedResourceTypes
  - Replace `import { ResourceType } from '../types/resources/ResourceTypes'`
  - With `import { ResourceType } from '../types/resources/StandardizedResourceTypes'`
- [ ] Replace string literals with enum values
  - Example: 'minerals' → ResourceType.MINERALS
- [ ] Update Record types with computed property names
  - Example: `{ [ResourceType.MINERALS]: 100 }`
- [ ] Update function parameters and return types
- [ ] Use conversion utilities for backward compatibility
  - `ensureEnumResourceType()` and `ensureStringResourceType()`
- [ ] Update comparisons and switch statements
- [ ] Update collections and maps
- [ ] Update tests to use enum values

### Implementation Tasks

- [ ] Core utilities and managers (Phase 1 - Completed)
- [ ] UI components and hooks (Phase 2 - In Progress)
- [ ] Tests and examples (Phase 3 - Upcoming)
- [ ] Remove string-based support (Phase 4 - Future)

# Resource Type Deprecation Plan

This document outlines the phased approach for deprecating string-based resource types in the Galactic Sprawl codebase.

## Overview

The codebase is transitioning from string-based resource types to enum-based resource types to improve type safety, IDE support, and reduce runtime errors. To ensure a smooth transition, we're implementing a phased deprecation plan that gradually increases the strictness of warnings and errors when string-based resource types are used.

## Deprecation Phases

The deprecation process is divided into four phases, each with increasing strictness:

### Phase 1: Warnings (Current)

- **Behavior**: Console warnings are emitted when string-based resource types are used
- **Impact**: Low - Developers are informed but code continues to work
- **Purpose**: Raise awareness and encourage voluntary migration

### Phase 2: Development Errors

- **Behavior**: Console errors in development mode, warnings in production
- **Impact**: Medium - More visible in development, but doesn't break production
- **Purpose**: Increase urgency for developers to update their code

### Phase 3: Development Exceptions

- **Behavior**: Throws errors in development mode, logs errors in production
- **Impact**: High - Breaks development builds, strongly visible in production logs
- **Purpose**: Force migration in development while maintaining production stability

### Phase 4: Full Removal

- **Behavior**: Always throws errors (string-based types no longer supported)
- **Impact**: Critical - Breaks any code still using string-based resource types
- **Purpose**: Complete the transition to enum-based resource types

## Configuration

The current deprecation phase is controlled by the `RESOURCE_TYPE_DEPRECATION_PHASE` environment variable:

```
RESOURCE_TYPE_DEPRECATION_PHASE=1  # Phase 1: Warnings (default)
RESOURCE_TYPE_DEPRECATION_PHASE=2  # Phase 2: Development Errors
RESOURCE_TYPE_DEPRECATION_PHASE=3  # Phase 3: Development Exceptions
RESOURCE_TYPE_DEPRECATION_PHASE=4  # Phase 4: Full Removal
```

If not specified, the system defaults to Phase 1 (Warnings).

## Implementation Details

The deprecation system is implemented in `src/utils/resources/ResourceTypeConverter.ts` through the following components:

1. **DeprecationPhase Enum**: Defines the available phases

   ```typescript
   export enum DeprecationPhase {
     WARNING = 1,
     ERROR_LOG = 2,
     ERROR_THROW = 3,
     REMOVED = 4,
   }
   ```

2. **CURRENT_DEPRECATION_PHASE Constant**: Determines the active phase

   ```typescript
   export const CURRENT_DEPRECATION_PHASE: DeprecationPhase = (
     process.env.RESOURCE_TYPE_DEPRECATION_PHASE
       ? parseInt(process.env.RESOURCE_TYPE_DEPRECATION_PHASE, 10)
       : DeprecationPhase.WARNING
   ) as DeprecationPhase;
   ```

3. **warnOnStringResourceTypeUsage Function**: Handles deprecation warnings/errors based on the current phase
   ```typescript
   export function warnOnStringResourceTypeUsage(
     stringType: StringResourceType,
     context?: string,
   ): void {
     // Implementation varies based on CURRENT_DEPRECATION_PHASE
   }
   ```

## Timeline

The planned timeline for advancing through the deprecation phases is:

1. **Phase 1 (Warnings)**: Current - Q2 2023
2. **Phase 2 (Development Errors)**: Q3 2023
3. **Phase 3 (Development Exceptions)**: Q4 2023
4. **Phase 4 (Full Removal)**: Q1 2024

## Migration Guidance

To prepare for the increasing strictness of the deprecation phases:

1. Follow the [Resource Type Migration Guide](./ResourceTypeMigrationGuide.md) to update your code
2. Use the [Standardized Resource Type Guide](./StandardizedResourceTypeGuide.md) for best practices
3. Run your code with `RESOURCE_TYPE_DEPRECATION_PHASE=3` periodically to identify issues early
4. Update tests to use enum-based resource types

## Monitoring and Reporting

During the deprecation process, we'll be monitoring:

1. The frequency of deprecation warnings/errors in development and production
2. The number of files still using string-based resource types
3. Developer feedback on migration challenges

Progress reports will be shared monthly to track the transition.

## Exceptions

If you have a legitimate need to continue using string-based resource types beyond the deprecation timeline, please:

1. Document the use case and constraints
2. Implement a local override of the deprecation behavior
3. Create a migration plan with an extended timeline

## Support

If you encounter issues during migration:

1. Consult the [Resource Type Migration Guide](./ResourceTypeMigrationGuide.md)
2. Check the [Standardized Resource Type Guide](./StandardizedResourceTypeGuide.md)
3. Review the implementation in `ResourceTypeConverter.ts`
4. Reach out to the core development team for assistance

This guide provides instructions for migrating from string-based resource types to the standardized enum-based resource types in the Galactic Sprawl codebase.

## Why Migrate?

The transition from string-based to enum-based resource types offers several benefits:

1. **Enhanced Type Safety**: Enums provide compile-time checking, preventing typos and invalid resource types.
2. **Better IDE Support**: Enums enable autocompletion, inline documentation, and easier navigation.
3. **Reduced Runtime Errors**: Enum validation prevents invalid resource types from being used.
4. **Clearer Code Intent**: Enum values make the code more readable and self-documenting.
5. **Easier Refactoring**: Renaming or modifying resource types becomes simpler and safer.
6. **Improved Performance**: Enum comparison is faster than string comparison.
7. **Centralized Resource Management**: All resource types are defined in a single location with metadata.

## Migration Steps

### Step 1: Update Imports

Replace imports of string-based `ResourceType` with the enum-based version:

```typescript
// Before
import { ResourceType } from "../types/resources/ResourceTypes";

// After
import { ResourceType } from "../types/resources/StandardizedResourceTypes";
```

If you need both types during the transition, use aliases:

```typescript
import { ResourceType as StringResourceType } from "../types/resources/ResourceTypes";
import { ResourceType } from "../types/resources/StandardizedResourceTypes";
```

### Step 2: Replace String Literals with Enum Values

Replace string literals with their enum equivalents:

```typescript
// Before
const resourceType: ResourceType = "minerals";

// After
const resourceType: ResourceType = ResourceType.MINERALS;
```

String to enum mapping:

- 'minerals' → ResourceType.MINERALS
- 'energy' → ResourceType.ENERGY
- 'population' → ResourceType.POPULATION
- 'research' → ResourceType.RESEARCH
- 'plasma' → ResourceType.PLASMA
- 'gas' → ResourceType.GAS
- 'exotic' → ResourceType.EXOTIC

### Step 3: Update Record Types

For objects using resource types as keys, use computed property names:

```typescript
// Before
const resourceAmounts: Record<ResourceType, number> = {
  minerals: 100,
  energy: 50,
  population: 25,
  // ...
};

// After
const resourceAmounts: Record<ResourceType, number> = {
  [ResourceType.MINERALS]: 100,
  [ResourceType.ENERGY]: 50,
  [ResourceType.POPULATION]: 25,
  // ...
};
```

### Step 4: Update Function Parameters and Return Types

Update function signatures to use the enum type:

```typescript
// Before
function getResourceAmount(type: ResourceType): number {
  // ...
}

// After
function getResourceAmount(type: ResourceType): number {
  // ...
}
```

### Step 5: Use Conversion Utilities for Backward Compatibility

For code that needs to support both formats during the transition, use the conversion utilities:

```typescript
import {
  ensureEnumResourceType,
  ensureStringResourceType,
} from "../utils/resources/ResourceTypeConverter";

// Convert any resource type to enum format
const enumType = ensureEnumResourceType(resourceType);

// Convert any resource type to string format
const stringType = ensureStringResourceType(resourceType);
```

### Step 6: Update Comparisons

Replace string comparisons with enum comparisons:

```typescript
// Before
if (resourceType === "minerals") {
  // ...
}

// After
if (resourceType === ResourceType.MINERALS) {
  // ...
}
```

### Step 7: Update Switch Statements

Update switch statements to use enum values:

```typescript
// Before
switch (resourceType) {
  case "minerals":
    return 100;
  case "energy":
    return 50;
  // ...
}

// After
switch (resourceType) {
  case ResourceType.MINERALS:
    return 100;
  case ResourceType.ENERGY:
    return 50;
  // ...
}
```

## Advanced Migration Patterns

### Handling Resource Type Arrays

```typescript
// Before
const resourceTypes: ResourceType[] = ["minerals", "energy", "gas"];

// After
const resourceTypes: ResourceType[] = [
  ResourceType.MINERALS,
  ResourceType.ENERGY,
  ResourceType.GAS,
];
```

### Converting Resource Type Maps

```typescript
import { toEnumResourceMap } from "../utils/resources/ResourceTypeConverter";

// Before
const resourceMap = new Map<ResourceType, number>();
resourceMap.set("minerals", 100);

// After
const resourceMap = new Map<ResourceType, number>();
resourceMap.set(ResourceType.MINERALS, 100);

// Or convert an existing map
const enumMap = toEnumResourceMap(stringMap);
```

### Handling Resource Type in Generic Components

```typescript
// Before
interface ResourceProps<T extends ResourceType> {
  type: T;
  amount: number;
}

// After
interface ResourceProps<T extends ResourceType> {
  type: T;
  amount: number;
}
```

## Using Resource Type Metadata

The standardized resource system includes metadata for each resource type:

```typescript
import {
  ResourceType,
  ResourceTypeInfo,
} from "../types/resources/StandardizedResourceTypes";

// Get display name
const displayName = ResourceTypeInfo[ResourceType.MINERALS].displayName;

// Get description
const description = ResourceTypeInfo[ResourceType.ENERGY].description;

// Get icon
const icon = ResourceTypeInfo[ResourceType.EXOTIC].icon;

// Get category
const category = ResourceTypeInfo[ResourceType.PLASMA].category;

// Get default max
const defaultMax = ResourceTypeInfo[ResourceType.GAS].defaultMax;
```

## Testing with Enum Resource Types

When writing tests, use the enum values:

```typescript
import { ResourceType } from "../types/resources/StandardizedResourceTypes";

test("should store resources correctly", () => {
  const result = resourceSystem.storeResource(ResourceType.MINERALS, 100);
  expect(result).toBe(100);
});
```

## Troubleshooting

### Type Errors

If you encounter type errors after migration, check:

1. **Import Paths**: Ensure you're importing from `StandardizedResourceTypes.ts`
2. **Type Assertions**: You may need to use type assertions during the transition
3. **Record Types**: Ensure you're using computed property names with square brackets

### Runtime Errors

If you encounter runtime errors:

1. **Null/Undefined Checks**: Ensure values are not null or undefined before using them
2. **Conversion Functions**: Use `ensureEnumResourceType` to safely convert values
3. **Default Values**: Provide default values for potentially undefined resource types

## Deprecation Warnings

The codebase now includes deprecation warnings when string-based resource types are used. These warnings will help identify code that needs to be updated:

```
[DEPRECATED] String-based resource type 'minerals' is deprecated.
Use ResourceType enum from StandardizedResourceTypes.ts instead.
Example: Replace 'minerals' with ResourceType.MINERALS
```

## Timeline

- **Phase 1**: Update core utilities and managers (completed)
- **Phase 2**: Update UI components and hooks (in progress)
- **Phase 3**: Update tests and examples (upcoming)
- **Phase 4**: Remove string-based resource type support (future)

# Resource Type Migration Guide

## Overview

This guide provides instructions for migrating from string-based `ResourceType` to enum-based `StandardizedResourceType`. This migration is part of our effort to improve type safety, reduce runtime errors, and enhance developer experience with better IDE support.

## Why Migrate?

String-based resource types have several disadvantages:

- No type safety (easy to make typos)
- No IntelliSense support (no auto-completion)
- No compile-time checking
- Difficult to refactor

Enum-based resource types provide:

- Full type safety
- IntelliSense support
- Compile-time checking
- Easy refactoring
- Better documentation

## Migration Steps

### 1. Update Imports

Replace string-based imports with enum-based imports:

```typescript
// Before
import { ResourceType } from "../types/resources/ResourceTypes";

// After
import { ResourceType } from "../types/resources/StandardizedResourceTypes";
```

### 2. Update String Literals to Enum Values

Replace string literals with enum values:

```typescript
// Before
const resourceType = "minerals";

// After
const resourceType = ResourceType.MINERALS;
```

### 3. Update Type Annotations

Update type annotations to use the enum type:

```typescript
// Before
function processResource(type: ResourceType): void {
  // ...
}

// After
function processResource(type: ResourceType): void {
  // ...
}
```

Note: The type name remains the same, but the import source changes.

### 4. Use Conversion Utilities for Interoperability

During the migration period, you may need to convert between string and enum types:

```typescript
import {
  toEnumResourceType,
  toStringResourceType,
  ensureEnumResourceType,
  ensureStringResourceType,
} from "../utils/resources/ResourceTypeConverter";

// Convert string to enum
const enumType = toEnumResourceType("minerals"); // Returns ResourceType.MINERALS

// Convert enum to string
const stringType = toStringResourceType(ResourceType.MINERALS); // Returns 'minerals'

// Ensure a value is an enum type (useful for function parameters)
function processResource(type: unknown): void {
  const resourceType = ensureEnumResourceType(type);
  // Now resourceType is guaranteed to be ResourceType enum
}
```

### 5. Use Type Guards for Runtime Checking

```typescript
import {
  isEnumResourceType,
  isStringResourceType,
} from "../utils/resources/ResourceTypeConverter";

function processResourceType(type: unknown): void {
  if (isEnumResourceType(type)) {
    // type is ResourceType enum
    console.log(`Processing enum resource: ${type}`);
  } else if (isStringResourceType(type)) {
    // type is string resource type
    const enumType = toEnumResourceType(type);
    console.log(`Converting string resource '${type}' to enum: ${enumType}`);
  } else {
    throw new Error(`Invalid resource type: ${type}`);
  }
}
```

### 6. Update Collections and Maps

For collections and maps of resource types:

```typescript
// Before
const resourceAmounts: Record<ResourceType, number> = {
  minerals: 100,
  energy: 200,
  // ...
};

// After
const resourceAmounts: Record<ResourceType, number> = {
  [ResourceType.MINERALS]: 100,
  [ResourceType.ENERGY]: 200,
  // ...
};
```

Use conversion utilities for existing collections:

```typescript
import { convertRecordResourceTypes } from "../utils/resources/ResourceTypeConverter";

// Convert a record with string keys to enum keys
const stringRecord: Record<string, number> = {
  minerals: 100,
  energy: 200,
};

const enumRecord = convertRecordResourceTypes(stringRecord);
// Result: { [ResourceType.MINERALS]: 100, [ResourceType.ENERGY]: 200 }
```

## Migration Utilities

We've created several utilities to help with the migration:

### ResourceTypeConverter

The `ResourceTypeConverter` utility provides functions for converting between string and enum resource types:

- `toEnumResourceType`: Converts a string resource type to an enum resource type
- `toStringResourceType`: Converts an enum resource type to a string resource type
- `isEnumResourceType`: Type guard for enum resource types
- `isStringResourceType`: Type guard for string resource types
- `ensureEnumResourceType`: Ensures a value is an enum resource type
- `ensureStringResourceType`: Ensures a value is a string resource type
- `convertArrayResourceTypes`: Converts an array of resource types
- `convertRecordResourceTypes`: Converts a record of resource types
- `convertMapResourceTypes`: Converts a map of resource types
- `convertObjectResourceTypes`: Converts resource type properties in an object

### ResourceTypeMigration

The `ResourceTypeMigration` utility provides tools for analyzing and migrating code:

- `analyzeMigrationNeeds`: Analyzes a file to identify resource type references
- `applyMigration`: Applies migration changes to a file
- `needsMigration`: Checks if a file needs migration
- `createResourceTypeCompatibilityWrapper`: Creates a compatibility wrapper for both string and enum types
- `createResourceTypeCompatibilityLayer`: Creates a compatibility layer for functions that use resource types

## Testing

After migration, ensure all tests pass. You may need to update test fixtures and mocks to use the new enum values.

## Compatibility Layer

During the migration period, we've provided a compatibility layer to handle both string and enum resource types:

```typescript
import { createResourceTypeCompatibilityLayer } from "../utils/resources/ResourceTypeMigration";

// Original function that expects string resource types
function processStringResource(type: string): void {
  console.log(`Processing string resource: ${type}`);
}

// Create a compatibility layer that converts enum to string
const processResource = createResourceTypeCompatibilityLayer(
  processStringResource,
  0, // parameter index
  false, // convert to string instead of enum
);

// Now you can call with either string or enum
processResource("minerals"); // Works
processResource(ResourceType.MINERALS); // Also works, converts to string
```

## Common Pitfalls

1. **Event Handlers**: Make sure to update event data types to use enum resource types.
2. **API Interfaces**: Update API interfaces to use enum resource types.
3. **JSON Serialization**: When serializing/deserializing, remember that enums are stored as strings.
4. **Third-party Libraries**: Libraries may still expect string types, use conversion utilities.
5. **Legacy Code**: Use the compatibility layer for legacy code that can't be updated immediately.

## Migration Checklist

- [ ] Update imports
- [ ] Replace string literals with enum values
- [ ] Update type annotations
- [ ] Add conversion utilities where needed
- [ ] Update collections and maps
- [ ] Update tests
- [ ] Verify functionality

## Need Help?

If you encounter issues during migration, please refer to the following resources:

- `ResourceTypeConverter.ts`: Utility functions for type conversion
- `ResourceTypeMigration.ts`: Utilities for code migration
- `StandardizedResourceTypes.ts`: Enum definitions and metadata

Or contact the resource system team for assistance.
