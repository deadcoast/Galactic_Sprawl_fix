# Integration Testing Best Practices

This document outlines best practices for creating integration tests in the Galactic Sprawl project, focusing on testing interactions between different managers and components.

## Purpose of Integration Tests

Integration tests verify that different parts of the application work together correctly. Unlike unit tests, which test individual components in isolation, integration tests focus on the interactions between components.

Key purposes:

- Verify that independently developed components work together as expected
- Test data flow between components
- Ensure integration points handle edge cases correctly
- Validate that interfaces between components are working as designed

## Integration Test Structure

### 1. Test File Organization

- Place integration tests in a dedicated `integration` directory within the tests folder
- Group by system or domain (e.g., `resource`, `mining`, `combat`)
- Name files descriptively with the components being tested (e.g., `MiningResourceIntegration.test.ts`)

### 2. Test Setup

- Create real instances of the components being tested
- Mock external dependencies that aren't part of the integration being tested
- Use beforeEach/afterEach to set up and clean up the test environment
- Initialize components in the same way they would be initialized in the actual application

```typescript
// Example setup
beforeEach(() => {
  // Create real instances of the managers we're testing
  miningManager = new MiningShipManagerImpl();
  thresholdManager = new ResourceThresholdManager();
  flowManager = new ResourceFlowManager(100, 500, 10);

  // Create the integration using real managers
  integration = new MiningResourceIntegration(miningManager, thresholdManager, flowManager);

  // Initialize the integration
  integration.initialize();
});
```

### 3. Test Teardown

- Clean up all components properly to prevent test pollution
- Restore mocks to prevent interference with other tests
- Reset global state that might have been modified

```typescript
afterEach(() => {
  // Clean up to prevent test pollution
  integration.cleanup();
  flowManager.cleanup();
  vi.restoreAllMocks();
});
```

## Testing Integration Points

### 1. Component Registration

Test that components register with each other correctly:

```typescript
it('should register mining nodes in ResourceFlowManager as producer nodes', () => {
  // Arrange
  const registerNodeSpy = vi.spyOn(flowManager, 'registerNode');
  const position: Position = { x: 100, y: 200 };

  // Act
  integration.registerMiningNode('test-node-1', 'minerals', position, 0.8);

  // Assert
  expect(registerNodeSpy).toHaveBeenCalledTimes(1);
  expect(registerNodeSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'test-node-1',
      type: 'producer',
      resources: ['minerals'],
      active: true,
      efficiency: 0.8,
    })
  );
});
```

### 2. Event Handling

Test that components respond to events from other components:

```typescript
it('should create resource flows when ships are assigned to nodes', () => {
  // Arrange
  const createFlowSpy = vi.spyOn(flowManager, 'createFlow');

  // Simulate ship assignment event
  const shipAssignedEvent = {
    /* event details */
  };

  // Get event handler
  const shipAssignedHandlers = vi
    .mocked(moduleEventBus.subscribe)
    .mock.calls.find(call => call[0] === 'SHIP_ASSIGNED');

  // Act
  if (shipAssignedHandlers && shipAssignedHandlers[1]) {
    const handler = shipAssignedHandlers[1];
    handler(shipAssignedEvent as unknown as ModuleEvent);
  }

  // Assert
  expect(createFlowSpy).toHaveBeenCalled();
});
```

### 3. Data Flow

Test that data flows correctly between components:

```typescript
it('should update thresholds when resource state changes', () => {
  // Arrange
  const updateThresholdSpy = vi.spyOn(thresholdManager, 'updateThreshold');

  // Act
  integration.registerMiningNode('test-node-1', 'minerals', position, 0.8);
  // Trigger a resource update

  // Assert
  expect(updateThresholdSpy).toHaveBeenCalled();
});
```

## Type Safety in Integration Tests

### 1. Type Assertions

When working with events or objects that cross component boundaries, use type assertions safely:

```typescript
// Avoid direct 'any' assertions
// BAD: handler(event as any);

// Use unknown as an intermediate step for safer type assertions
// GOOD: handler(event as unknown as ModuleEvent);
```

### 2. Custom Event Types

Define custom event types for testing that extend the base types:

```typescript
interface ShipAssignedEvent extends Omit<ModuleEvent, 'type' | 'moduleType'> {
  type: 'SHIP_ASSIGNED';
  moduleType: ExtendedModuleType;
  shipId: string;
  nodeId: string;
  data: {
    ship: {
      id: string;
      efficiency: number;
      status: string;
    };
  };
}
```

### 3. Type Extensions

Extend existing types when needed for testing:

```typescript
// Extend ModuleType with our test types
type ExtendedModuleType = ModuleType | 'miningHub';
```

## Best Practices for Mocking

### 1. Mock External Dependencies

Mock dependencies that aren't part of the integration being tested:

```typescript
vi.mock('../../../lib/modules/ModuleEvents', () => ({
  moduleEventBus: {
    emit: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    unsubscribe: vi.fn(),
  },
  ModuleEventType: {
    RESOURCE_PRODUCED: 'RESOURCE_PRODUCED',
    RESOURCE_CONSUMED: 'RESOURCE_CONSUMED',
    RESOURCE_UPDATED: 'RESOURCE_UPDATED',
  },
}));
```

### 2. Spy on Component Methods

Use spies on real component methods to verify they're called correctly:

```typescript
const registerNodeSpy = vi.spyOn(flowManager, 'registerNode');
// ... test code ...
expect(registerNodeSpy).toHaveBeenCalledWith(
  expect.objectContaining({
    id: 'test-node-1',
    // ... expected parameters ...
  })
);
```

### 3. Verify Component State

Check component state directly to verify integration worked correctly:

```typescript
const nodes = flowManager.getNodes();
const updatedNode = nodes.find(node => node.id === 'test-node-1');
expect(updatedNode).toBeDefined();
expect(updatedNode?.efficiency).toBe(1.2);
```

## Common Integration Test Scenarios

1. **Component Registration** - Test that components register correctly with each other
2. **Event Propagation** - Test that events are properly propagated between components
3. **Data Flow** - Test that data flows correctly between components
4. **Error Handling** - Test that errors in one component are properly handled by other components
5. **Configuration** - Test that components are properly configured when used together
6. **System Behavior** - Test behavior of the entire system under various conditions

## Debugging Integration Tests

1. **Use Console Output** - Use `console.warn` for debugging (remember console.log is not allowed)
2. **Check Individual Components** - Verify that individual components work as expected
3. **Step Through Events** - Check that events are properly created and handled
4. **Review Flow** - Look at the overall data flow in the test
5. **Inspect State** - Check component state at various points in the test

## Integration Test Coverage Goals

Aim to cover the following integration points:

1. All manager-to-manager interactions
2. Key data flows between systems
3. Event handling across components
4. Resource management across the application
5. Critical user interactions and workflows

## Next Steps for Integration Testing

1. Create integration tests for UI components with resource systems
2. Add integration tests for automation system with resource management
3. Create integration tests for combat system with resource consumption
4. Test module system integration with resources and upgrades
