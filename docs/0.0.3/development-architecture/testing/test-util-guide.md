# Test Utilities Guide

This document provides detailed information about the test utilities available in the Galactic Sprawl project. These utilities are designed to simplify test creation, improve test reliability, and provide consistent testing patterns across the codebase.

## Table of Contents

1. [Testing Utilities Overview](#testing-utilities-overview)
2. [Rendering Components](#rendering-components)
3. [Mock Factories](#mock-factories)
4. [Common Testing Patterns](#common-testing-patterns)
5. [Performance Testing](#performance-testing)
6. [Example Usage](#example-usage)

## Testing Utilities Overview

The test utilities are located in `src/tests/utils/testUtils.tsx` and provide a range of helpers for different testing scenarios. These include:

- **Component Rendering**: Utilities for rendering components with providers
- **Mock Factories**: Functions to create mock data for tests
- **DOM Element Mocking**: Utilities for mocking DOM elements and refs
- **Async Testing**: Helpers for testing asynchronous behavior
- **Common Testing Patterns**: Standardized approaches for common test scenarios
- **Performance Measurement**: Tools for measuring and reporting performance metrics

## Rendering Components

### `renderWithProviders`

This utility wraps the standard React Testing Library's `render` function with the application's context providers.

```tsx
import { renderWithProviders } from "src/tests/utils/testUtils";

// Basic usage
const { getByText, getByRole } = renderWithProviders(<YourComponent />);

// With user events
const { user, getByText } = renderWithProviders(<YourComponent />);
await user.click(getByText("Button"));
```

### `AllProviders`

The wrapper component that includes all application providers. Extend this if you need to add custom providers for testing.

```tsx
// In testUtils.tsx
export const AllProviders: React.FC<WrapperProps> = ({ children }) => {
  return (
    <>
      <ThemeProvider theme={lightTheme}>
        <ResourceProvider>
          {/* Add more providers here */}
          {children}
        </ResourceProvider>
      </ThemeProvider>
    </>
  );
};
```

## Mock Factories

### Resource Mocks

#### `createMockResource`

Creates a mock resource object with sensible defaults.

```tsx
const resource = createMockResource();
// { id: 'resource-abc123', name: 'Test Resource', amount: 100, ... }

// Override specific properties
const customResource = createMockResource({
  name: "Custom Resource",
  amount: 500,
  category: "special",
});
```

#### `createMockResources`

Creates an array of mock resources.

```tsx
// Create 5 default resources
const resources = createMockResources(5);

// Create 3 resources with custom properties
const customResources = createMockResources(3, {
  category: "energy",
  visible: false,
});
```

#### `createMockResourceNode`

Creates a mock resource node (producer or consumer).

```tsx
const node = createMockResourceNode({
  type: "consumer",
  resources: ["minerals"],
});
```

#### `createMockResourceConnection`

Creates a mock connection between resource nodes.

```tsx
const connection = createMockResourceConnection({
  source: "producer-1",
  target: "consumer-1",
  resourceType: "energy",
});
```

### Other Mocks

#### `createMockEvent`

Creates a mock game event.

```tsx
const event = createMockEvent({
  type: "building.constructed",
  data: { buildingId: "mine-1" },
});
```

## DOM Element Mocking

### `createMockElement`

Creates a mock DOM element for testing components that interact with DOM elements.

```tsx
const mockDiv = createMockElement();
// Mock div with size, style, and all necessary methods
```

### `createMockRef`

Creates a mock React ref object with a mock element as its current value.

```tsx
const ref = createMockRef();
// { current: mockElement }

// Or with a custom element
const customElement = { focus: vi.fn() };
const ref = createMockRef(customElement);
```

## Common Testing Patterns

### `testLoadingState`

Tests a component's loading state.

```tsx
await testLoadingState(
  <ResourceList resources={[]} />, // Component to test
  "isLoading", // Prop name for loading state
  () => {
    /* callback to finish loading */
  },
);
```

### `testErrorState`

Tests a component's error state.

```tsx
testErrorState(
  <ResourceList resources={[]} />, // Component to test
  "error", // Prop name for error state
  "Failed to load resources", // Error message
);
```

### `testFormSubmission`

Tests a form component's submission behavior.

```tsx
const formElement = screen.getByRole("form");
const onSubmit = vi.fn();

await testFormSubmission(
  formElement,
  { name: "#name-input", email: "#email-input" }, // Selectors
  { name: "Test User", email: "test@example.com" }, // Values
  onSubmit,
);

// Verifies the form was submitted with the correct values
```

## Performance Testing

### `measureExecutionTime`

Measures how long a function takes to execute.

```tsx
const { result, executionTimeMs } = await measureExecutionTime(
  someExpensiveFunction,
  arg1,
  arg2,
);

console.warn(`Function took ${executionTimeMs}ms to execute`);
```

### `measureMemoryUsage`

Measures memory usage of a function (when available in the environment).

```tsx
const { result, memoryChangeMB } = await measureMemoryUsage(
  someMemoryIntensiveFunction,
  arg1,
  arg2,
);

if (memoryChangeMB) {
  console.warn(`Function used ${memoryChangeMB}MB of memory`);
}
```

### `createPerformanceReporter`

Creates a utility for collecting and reporting performance metrics across multiple operations.

```tsx
const reporter = createPerformanceReporter();

// Record metrics for different operations
reporter.record("Operation A", 150); // 150ms execution time
reporter.record("Operation B", 300, 5); // 300ms execution time, 5MB memory usage

// Get metrics for a specific operation
const metricsA = reporter.getMetrics("Operation A");
console.warn(`Avg execution time: ${metricsA.executionTime.avg}ms`);

// Print a formatted report to the console
reporter.printReport();

// Get all metrics for custom processing
const allMetrics = reporter.getAllMetrics();
```

## Example Usage

A complete example is available in the `src/tests/utils/testUtilsUsageExample.test.tsx` file, which demonstrates how to use these utilities in real-world test scenarios.

### Mock Factories Example

```tsx
describe("Resource Components", () => {
  it("should display resource information", () => {
    // Create mock data
    const resources = createMockResources(3, {
      type: "mineral",
      category: "basic",
    });

    // Render with providers
    renderWithProviders(<ResourceDisplay resources={resources} />);

    // Test component behavior
    resources.forEach((resource) => {
      expect(screen.getByTestId(`resource-${resource.id}`)).toBeInTheDocument();
    });
  });
});
```

### Performance Testing Example

```tsx
describe("ResourceFlowManager Performance", () => {
  it("should optimize large networks efficiently", async () => {
    const manager = new ResourceFlowManager();
    const nodeCount = 100;

    // Set up test data
    for (let i = 0; i < nodeCount; i++) {
      manager.registerNode(
        createMockResourceNode({
          id: `node-${i}`,
          type: i < nodeCount / 2 ? "producer" : "consumer",
        }),
      );
    }

    // Measure performance
    const { executionTimeMs } = await measureExecutionTime(() => {
      manager.optimizeFlows();
    });

    // Assert performance is within acceptable limits
    expect(executionTimeMs).toBeLessThan(500);
  });
});
```

## Best Practices

1. **Use mock factories** instead of creating ad-hoc test data
2. **Measure performance** for critical operations and check against performance budgets
3. **Follow common patterns** for loading states, error handling, and form testing
4. **Mock only what's necessary** - prefer integration testing when possible
5. **Use descriptive test names** that explain the behavior being tested
6. **Assert on user-visible outcomes** rather than implementation details
7. **Run performance tests in CI** to detect regressions early
