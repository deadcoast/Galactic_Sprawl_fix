# Test Utilities Guide

This guide demonstrates how to use the standardized test utilities in the Galactic Sprawl codebase.

## Rendering Components

```tsx
import { renderWithProviders, renderWithCore, renderWithExplorationProviders } from '../utils';

// Render with all providers (default approach)
test('component renders with all providers', () => {
  const { getByText, user } = renderWithProviders(<MyComponent />);
  expect(getByText('Hello World')).toBeInTheDocument();
});

// Render with minimal providers for performance
test('component renders with core providers', () => {
  const { getByText } = renderWithCore(<SimpleComponent />);
  expect(getByText('Simple')).toBeInTheDocument();
});

// Render with exploration-specific providers
test('exploration component renders', () => {
  const { getByTestId } = renderWithExplorationProviders(<DataAnalysisComponent />);
  expect(getByTestId('analysis-view')).toBeInTheDocument();
});

// Custom provider combination
test('component with custom providers', () => {
  const { getByText } = renderWithCustomProviders(
    <CustomComponent />,
    [ThemeProvider, CustomContextProvider]
  );
  expect(getByText('Custom')).toBeInTheDocument();
});
```

## Creating Mocks

```tsx
import { 
  createMockResource, 
  createMockResourceManager,
  createMockComponent,
  createMockEventBus,
  createVisualizationTestKit
} from '../utils';

test('using mock resources', () => {
  // Create mock with default values
  const resource = createMockResource();
  expect(resource.type).toBe(ResourceType.ENERGY);
  
  // Override specific properties
  const customResource = createMockResource({
    id: 'custom-1',
    type: ResourceType.MINERALS,
    amount: 500
  });
  expect(customResource.amount).toBe(500);
});

test('using mock managers', () => {
  const manager = createMockResourceManager({
    getResource: vi.fn().mockReturnValue({ id: 'test', amount: 100 })
  });
  
  const result = manager.getResource('test');
  expect(result.amount).toBe(100);
});

test('using visualization test kit', () => {
  const { canvas, context, data } = createVisualizationTestKit();
  
  myVisualization.render(canvas, context, data);
  
  expect(context.fillText).toHaveBeenCalled();
});
```

## Performance Testing

```tsx
import { 
  measureExecutionTime, 
  measureMemoryUsage,
  runBenchmark,
  createPerformanceReporter,
  parallelDescribe
} from '../utils';

test('measure function performance', () => {
  const { result, executionTime } = measureExecutionTime(sortArray, largeArray);
  
  expect(result.length).toBe(largeArray.length);
  expect(executionTime).toBeLessThan(100); // Ensure it completes in under 100ms
});

test('measure memory usage', () => {
  const { result, memoryDiffMB } = measureMemoryUsage(processLargeData, data);
  
  expect(result).toBeDefined();
  // Check that memory usage isn't excessive
  expect(memoryDiffMB.heapUsed).toBeLessThan(10);
});

test('benchmark function performance', () => {
  const results = runBenchmark(sortArray, 100, largeArray);
  
  // Check performance characteristics
  expect(results.average).toBeLessThan(50);
  expect(results.percentiles.p95).toBeLessThan(100);
});

test('use performance reporter', () => {
  const reporter = createPerformanceReporter();
  
  // Record multiple metrics
  reporter.record('parseTime', 50);
  reporter.record('parseTime', 55);
  reporter.record('parseTime', 45);
  
  // Use measure helper
  reporter.measure('sortTime', sortArray, [largeArray]);
  
  // Get stats
  const parseStats = reporter.getStats('parseTime');
  expect(parseStats?.average).toBe(50);
  
  // Generate report
  const report = reporter.generateReport();
  expect(report).toContain('parseTime');
  expect(report).toContain('sortTime');
});

// Run tests in parallel
parallelDescribe('parallel performance tests', {
  'test1': async () => {
    // Test implementation
  },
  'test2': async () => {
    // Test implementation
  }
}, { concurrency: 2 });
```

## Optimization Utilities

```tsx
import { 
  optimizeResourceIntensiveOperation,
  createLazyTestValue,
  parallelSetup,
  conditionalSetup
} from '../utils';

test('optimize expensive operations', async () => {
  // Cache expensive computation
  const result1 = await optimizeResourceIntensiveOperation(
    'compute-hash',
    () => computeExpensiveHash(largeData)
  );
  
  // Second call uses cached result
  const result2 = await optimizeResourceIntensiveOperation(
    'compute-hash',
    () => computeExpensiveHash(largeData)
  );
  
  expect(result1).toBe(result2);
});

test('use lazy initialization', () => {
  // Only initialized when used
  const database = createLazyTestValue(() => {
    console.log('Creating test database');
    return createExpensiveTestDatabase();
  });
  
  // Do something that may or may not need the database
  if (needsDatabase) {
    const db = database.get(); // Only now is the database created
    expect(db).toBeDefined();
  }
  
  // Reset when needed
  database.reset();
});

test('parallel setup', async () => {
  // Run setup operations in parallel
  const setup = await parallelSetup({
    database: async () => createTestDatabase(),
    resources: async () => loadTestResources(),
    users: async () => createTestUsers()
  });
  
  expect(setup.database).toBeDefined();
  expect(setup.resources).toBeDefined();
  expect(setup.users).toBeDefined();
});

test('conditional setup', () => {
  // Only run setup if needed
  const testData = conditionalSetup(
    () => createExpensiveTestData(),
    () => isFeatureEnabled
  );
  
  if (isFeatureEnabled) {
    expect(testData).toBeDefined();
  } else {
    expect(testData).toBeUndefined();
  }
});
```

## Best Practices

1. **Use the standardized utilities**: Prefer the utilities in `../utils` over direct test-library imports.
2. **Choose the right provider wrapper**: Use `renderWithCore` for simple components and `renderWithProviders` for components that need context.
3. **Mock consistently**: Use provided mock factories for consistent test data.
4. **Track performance**: Use performance utilities to ensure tests and components remain efficient.
5. **Optimize test setup**: Use parallel and lazy initialization to speed up tests.
6. **Avoid duplication**: Don't reimplement utilities that already exist.