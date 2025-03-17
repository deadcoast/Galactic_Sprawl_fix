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
