# Resource System Documentation

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
