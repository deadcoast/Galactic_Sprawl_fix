# D3 Type Safety Guide

This guide explains the type-safe patterns implemented for D3 visualizations in the Galactic Sprawl project. These patterns help eliminate type assertions, improve IntelliSense support, and catch potential runtime errors at compile time.

## Problem Statement

D3 (Data-Driven Documents) is a powerful JavaScript library for data visualization, but it presents several type safety challenges:

1. **Dynamic Node References**: D3 force simulations dynamically convert string IDs to object references, leading to type inconsistencies
2. **Nested Property Access**: Accessing properties like `d.source.x` is unsafe when types are uncertain
3. **Data Transformation**: Converting application data models to D3-compatible formats often requires type assertions
4. **Runtime Type Changes**: D3 modifies data objects at runtime, adding and changing properties like `x`, `y`, `fx`, and `fy`

Previous code often relied on unsafe type assertions like:

```typescript
// ❌ Unsafe: Type assertions
const source = d.source as unknown as { x: number; y: number };
return source.x;
```

## Type-Safe Solution

Our solution consists of several components that work together to provide comprehensive type safety:

### 1. Generic Type Definitions (`D3Types.ts`)

We've created a set of generic interfaces for D3 data structures:

```typescript
// ✅ Safe: Generic node type
export interface SimulationNodeDatum<T = unknown> extends d3.SimulationNodeDatum {
  id: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  data?: T; // Store original data
}

// ✅ Safe: Generic link type with proper constraints
export interface SimulationLinkDatum<N extends d3.SimulationNodeDatum>
  extends d3.SimulationLinkDatum<N> {
  source: string | N;
  target: string | N;
  value?: number;
}

// Runtime helper type for nodes with coordinates
export interface RuntimeSimulationNode {
  x: number;
  y: number;
  [key: string]: unknown;
}
```

### 2. Safe Accessor Functions

We've implemented accessor functions that safely handle property access:

```typescript
// ✅ Safe: Accessor functions with runtime validation
export const d3Accessors = {
  getX: (node: unknown): number => {
    if (
      node &&
      typeof node === 'object' &&
      'x' in node &&
      typeof (node as RuntimeSimulationNode).x === 'number'
    ) {
      return (node as RuntimeSimulationNode).x;
    }
    return 0; // Safe default
  },

  getY: (node: unknown): number => {
    if (
      node &&
      typeof node === 'object' &&
      'y' in node &&
      typeof (node as RuntimeSimulationNode).y === 'number'
    ) {
      return (node as RuntimeSimulationNode).y;
    }
    return 0; // Safe default
  },
};
```

### 3. Type-Safe Data Converters

We've created utility functions to convert application data models to D3-compatible formats:

```typescript
// ✅ Safe: Data conversion with proper typing
export const d3Converters = {
  dataPointsToD3Format: <T extends Record<string, unknown>>(dataPoints: DataPoint[]): T[] => {
    return dataPoints.map(point => {
      // Flatten the structure for D3
      const result = {
        id: point.id,
        type: point.type,
        // Add other properties...
      } as unknown as T;

      return result;
    });
  },
};
```

## Usage Examples

### 1. Type-Safe Node and Link Access

```typescript
// In D3 simulation tick function:

// ❌ Before: Unsafe type assertions
link.attr('x1', function (d) {
  const source = d.source as unknown as { x: number; y: number };
  return source.x;
});

// ✅ After: Safe accessors
link.attr('x1', function (d) {
  return d3Accessors.getX(d.source);
});
```

### 2. Type-Safe Data Conversion

```typescript
// ❌ Before: Type assertion
const typedResourceData = resourceData as unknown as DataPoint[];

// ✅ After: Type-safe conversion
const typedResourceData = useMemo(() => {
  const dataPoints = resourceData as DataPoint[];
  return d3Converters.dataPointsToD3Format<Record<string, unknown>>(dataPoints);
}, [resourceData]);
```

### 3. Proper Component Props Typing

```typescript
// ✅ Safe: Clear component props
interface ScatterPlotProps {
  data: DataPoint[] | Record<string, unknown>[];
  xAxisKey: string;
  yAxisKey: string;
  // other props...
}
```

## Best Practices

1. **Use Accessors for Coordinates**: Always use `d3Accessors.getX()` and `d3Accessors.getY()` to access coordinates in D3 simulations
2. **Convert Data with Utilities**: Use `d3Converters.dataPointsToD3Format<T>()` to convert application data to D3 format
3. **Extend Base D3 Types**: Extend the base D3 interfaces like `SimulationNodeDatum` instead of creating completely new ones
4. **Add Type Constraints**: Use generic constraints (e.g., `<T extends Record<string, unknown>>`) to ensure type compatibility
5. **Test Edge Cases**: Ensure accessor functions handle undefined, null, and malformed inputs gracefully

## Testing Utilities

The test file `D3Types.test.ts` verifies that our type-safe accessors and converters work correctly in all scenarios, including edge cases like null inputs or missing properties. Use these tests as examples for implementing similar patterns in your own components.

By following these patterns, we've eliminated type assertions in visualization components while maintaining full compatibility with D3's powerful features.
