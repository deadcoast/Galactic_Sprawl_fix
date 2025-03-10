# Galactic Sprawl Testing Framework

This directory contains all tests for the Galactic Sprawl project, organized by test type.

## Test Structure

The tests are organized into the following directories:

1. **Unit Tests**:

   - `components/` - Tests for React components
   - `managers/` - Tests for manager classes
   - `hooks/` - Tests for custom React hooks
   - `utils/` - Tests for utility functions

2. **Integration Tests**:

   - `integration/` - Tests that verify interactions between multiple components or systems
   - Organized by feature area (e.g., `resource`, `combat`, `exploration`)

3. **End-to-End Tests**:

   - `e2e/` - Tests that simulate user interactions with the application
   - Use Playwright for browser automation
   - Follow the Page Object Model pattern with page objects in `e2e/models/`

4. **Performance Tests**:

   - `performance/` - Benchmark tests for performance-critical code paths
   - Include memory usage and execution time measurements

5. **Tool Tests**:
   - `tools/` - Tests for development tools and scripts
   - Require Node.js environment features

## Test Naming Conventions

- Unit and integration tests: `*.test.ts` or `*.test.tsx`
- End-to-end tests: `*.spec.ts`
- Performance tests: `*.benchmark.ts`

## Running Tests

Use the following npm scripts to run tests:

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run performance tests
npm run test:perf

# Run tool tests
npm run test:tools

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run coverage
```

## Test Utilities

The `utils/` directory contains utility functions for testing:

- `testUtils.tsx` - Utility functions for testing, including:
  - `renderWithProviders` - Renders components with all required providers
  - Mock factories for common objects
  - Common testing patterns
  - Performance testing utilities

## Best Practices

For detailed best practices, refer to the following documentation:

- [UI Testing Best Practices](../../CodeBase_Docs/UI_Testing_Best_Practices.md)
- [Integration Testing Best Practices](../../CodeBase_Docs/Integration_Testing_Best_Practices.md)
- [Performance Benchmark Practices](../../CodeBase_Docs/Performance_Benchmark_Practices.md)
- [Test Utilities Guide](../../CodeBase_Docs/Test_Utilities_Guide.md)

## Exploration System Integration Tests

### Overview

The exploration system integration tests verify the connections between the ExplorationManager, DataAnalysisContext, and ClassificationContext. These tests ensure that events triggered by the exploration system properly flow through the application and update the relevant UI components.

### Test Files

- `src/tests/integration/exploration/ExplorationSystem.integration.test.tsx`: Tests basic connections between the ExplorationManager and context providers
- `src/tests/integration/exploration/ExplorationDataFlow.integration.test.tsx`: Tests the end-to-end data flow from discovery to classification

### Test Fixtures

- `src/tests/fixtures/explorationIntegrationFixtures.ts`: Contains utility functions to create test data for sectors, anomalies, ships, and resources

### Key Areas Tested

1. **ExplorationManager to DataAnalysisContext Connection**: Verifies that exploration events trigger dataset creation and updates in the DataAnalysisContext
2. **ExplorationManager to ClassificationContext Connection**: Verifies that anomaly and resource detection events trigger discovery recording and classification in the ClassificationContext
3. **End-to-End Flow**: Tests the complete flow from sector discovery to anomaly detection and classification

### Running the Tests

```
npm test -- --testPathPattern=exploration
```
