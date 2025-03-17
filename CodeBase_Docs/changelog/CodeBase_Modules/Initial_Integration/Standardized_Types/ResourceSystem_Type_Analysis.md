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

## Next Steps

1. Create a standardized type definitions file for resources
2. Update ResourceType to use enum approach for better type safety
3. Create helpers for backward compatibility during transition
4. Update UI components to use standardized property access
5. Fix TypeScript configuration for proper Map iteration support
6. Update context providers to expose properly typed state and methods
