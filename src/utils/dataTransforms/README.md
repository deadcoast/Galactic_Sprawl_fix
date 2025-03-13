# Data Transformation Utilities

This module provides consolidated utilities for transforming data for visualizations, filtering, and analysis. The utilities are organized into three main categories:

1. **Chart Transformations** - For preparing and transforming data for visualization components
2. **Scientific Transformations** - For specialized scientific and statistical analysis
3. **Filter Transformations** - For filtering and searching data

## Basic Usage

```typescript
import { 
  transformToScatterFormat, 
  calculateDomain, 
  createColorScale 
} from '../../utils/dataTransforms';

// Transform data for a scatter plot
const scatterData = transformToScatterFormat(dataPoints, 'amount');

// Calculate domains for x and y axes
const xDomain = calculateDomain(scatterData, 'x');
const yDomain = calculateDomain(scatterData, 'y');

// Create a color scale function
const colorScale = createColorScale([0, 100], ['#ff0000', '#00ff00', '#0000ff']);
```

## Chart Transformations

### Data Extraction

```typescript
// Safely extract values with proper type checking
const numberValue = safelyExtractNumber(data, 'count', 0);
const stringValue = safelyExtractString(data, 'name', 'Unknown');
const arrayValue = safelyExtractArray(data, 'items', []);
const objectValue = safelyExtractObject(data, 'metadata', {});

// Extract from nested paths
const nestedValue = safelyExtractPath(data, 'properties.coordinates.x', 0);
```

### Domain Calculations

```typescript
// Calculate domain for a single field
const domain = calculateDomain(data, 'value', 0.1); // 10% padding

// Calculate multiple domains at once
const domains = calculateDomains(data, {
  x: 'xValue',
  y: 'yValue',
  size: 'count'
});
```

### Color Utilities

```typescript
// Create a color scale function
const colorScale = createColorScale([0, 100], ['#ff0000', '#00ff00', '#0000ff']);
const color = colorScale(75); // Returns a color between green and blue

// Get resource type color
const color = getResourceTypeColor('energy'); // Returns '#F1C232'

// Convert hex to RGB
const { r, g, b } = hexToRgb('#3D85C6');
```

### Data Transformations

```typescript
// Transform cluster data from analysis results
const { clusters, features, clusterPoints } = transformClusterData(result, allData);

// Transform prediction data
const prediction = transformPredictionData(result);

// Transform resource mapping data
const resourceData = transformResourceMappingData(result);

// Transform to specific chart formats
const scatterData = transformToScatterFormat(dataPoints, 'amount');
const heatMapData = transformToHeatMapFormat(gridCells, 'quality', 'minerals');
```

### Pagination

```typescript
// Paginate data
const { items, totalPages, currentPage, hasNextPage } = paginateData(data, 25, 0);
```

## Scientific Transformations

### Time Series Analysis

```typescript
// Transform time series data
const timeSeriesData = transformTimeSeriesData(
  ['2023-01', '2023-02', '2023-03', '2023-04'], // time points
  [10, 15, 12, 18],                            // actual values
  [11, 14, 13, 17],                            // predicted values
  [19, 21, 20]                                 // forecast values
);

// Calculate residuals (actual - predicted)
const residuals = calculateResiduals([10, 15, 12], [11, 14, 13]);
```

### Statistical Analysis

```typescript
// Calculate correlation matrix
const correlationMatrix = calculateCorrelationMatrix(data, ['x', 'y', 'z']);

// Calculate descriptive statistics
const stats = calculateStatistics(data, 'value');
console.log(stats.mean, stats.median, stats.standardDeviation);
```

### Model Analysis

```typescript
// Extract feature importance
const featureImportance = extractFeatureImportance(modelDetails, features);

// Type guards for model types
if (isLinearRegressionModel(modelDetails)) {
  // Handle linear model
}

if (isNeuralNetworkModel(modelDetails)) {
  // Handle neural network model
}
```

### Clustering Analysis

```typescript
// Calculate cluster centroids
const centroids = calculateClusterCentroids(clusterPoints, features);

// Calculate distances to centroids
const distances = calculateDistancesToCentroids(clusterPoints, centroids);
```

## Filter Transformations

### Filter Creation and Validation

```typescript
// Create a filter with validation
const filter = createFilter('age', 'greaterThan', 25);

// Validate a filter
if (validateFilter(userFilter)) {
  // Use the filter
}

// Convert filter value from string input
const value = convertFilterValue('25,50', 'between'); // Returns [25, 50]
```

### Filter Formatting

```typescript
// Format filter value for display
const displayValue = formatFilterValue([10, 20]); // Returns "10 to 20"

// Format entire filter for display
const displayFilter = formatFilter({
  field: 'age',
  operator: 'between',
  value: [25, 40]
}); // Returns "age between 25 to 40"

// Get appropriate input type for operator
const inputType = getInputTypeForOperator('between'); // Returns 'range'
```

### Filtering Logic

```typescript
// Apply a single filter
const passes = applyFilter(item, {
  field: 'type',
  operator: 'equals',
  value: 'energy'
});

// Apply multiple filters (AND logic)
const filteredData = applyFilters(data, [
  { field: 'type', operator: 'equals', value: 'energy' },
  { field: 'amount', operator: 'greaterThan', value: 50 }
]);

// Apply complex filters with AND/OR logic
const complexFilteredData = applyComplexFilter(data, {
  type: 'or',
  filters: [
    { field: 'type', operator: 'equals', value: 'energy' },
    { 
      type: 'and',
      filters: [
        { field: 'type', operator: 'equals', value: 'minerals' },
        { field: 'quality', operator: 'greaterThan', value: 75 }
      ]
    }
  ]
});
```

### Field Analysis

```typescript
// Detect field types
const fieldTypes = detectFieldTypes(data);
// Returns: { name: 'string', age: 'number', active: 'boolean', ... }

// Get unique values for a field
const uniqueTypes = getUniqueValues(data, 'type');

// Get range for a numeric field
const [min, max] = getFieldRange(data, 'amount') || [0, 100];
```

## Type Guards

```typescript
// Type guards for safe operations
if (isNumber(value)) {
  // It's safe to perform math operations
}

if (isString(value)) {
  // It's safe to use string methods
}

if (isArray(value)) {
  // It's safe to use array methods
}

if (isObject(value)) {
  // It's safe to access properties
}
```

## Best Practices

1. **Use Safe Extraction**: Always use the safe extraction utilities rather than direct property access to ensure type safety.

2. **Prefer Transformation Functions**: Use the pre-built transformation functions instead of manually transforming data in components.

3. **Consolidate Domain Calculations**: Calculate domains using the utilities rather than implementing custom min/max calculations.

4. **Centralize Filtering Logic**: Use the filter utilities to maintain consistent filtering behavior across components.

5. **Validate Inputs**: Always validate user inputs using the provided validation utilities.

6. **Memoize Transformations**: Wrap transformation calls in useMemo to prevent unnecessary recalculations.