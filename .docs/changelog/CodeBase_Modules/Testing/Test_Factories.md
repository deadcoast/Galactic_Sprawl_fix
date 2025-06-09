# Test Factories

This document provides an overview of the test factories implemented in the codebase to support testing without mocks.

## Overview

Test factories are a pattern used to create real implementations of components and services for testing purposes. Unlike mocks, these implementations behave like the actual production code but are isolated for testing purposes. This approach ensures that tests verify real behavior rather than mock interactions.

## Implemented Test Factories

### 1. ModuleEvents Test Factory

**File:** `src/tests/factories/createTestModuleEvents.ts`

**Purpose:** Provides a real implementation of the ModuleEventBus that behaves like the production code but is isolated for testing purposes.

**Features:**

- Creates a real ModuleEventBus with event tracking
- Provides helper methods for verifying events and listeners
- Supports all event types and module types
- Properly cleans up after tests to prevent cross-test contamination

**Usage Example:**

```typescript
const { moduleEvents, trackEvent } = createTestModuleEvents();

// Register a listener
moduleEvents.on('moduleAdded', 'mining', event => {
  // Handle event
});

// Emit an event
moduleEvents.emit({
  type: 'moduleAdded',
  moduleType: 'mining',
  moduleId: 'mining-1',
  timestamp: Date.now(),
});

// Verify the event was emitted
expect(trackEvent).toHaveBeenCalledWith({
  type: 'moduleAdded',
  moduleType: 'mining',
  moduleId: 'mining-1',
  timestamp: expect.any(Number),
});
```

### 2. ResourceManager Test Factory

**File:** `src/tests/factories/createTestResourceManager.ts`

**Purpose:** Creates a real ResourceManager for tests with in-memory implementation that follows the actual API.

**Features:**

- Implements all ResourceManager methods with real behavior
- Supports resource initialization, updates, and tracking
- Handles production, consumption, and transfer operations
- Provides utility methods for test verification
- Configurable initial state and behavior

**Usage Example:**

```typescript
const resourceManager = createTestResourceManager();

// Initialize resources
resourceManager.initializeResource('minerals', 100);
resourceManager.initializeResource('energy', 50);

// Add resources
resourceManager.addResource('minerals', 50);

// Get resource amount
const minerals = resourceManager.getResourceAmount('minerals');
expect(minerals).toBe(150);

// Track production
resourceManager.trackProduction('minerals', 10, 'mining-module-1');
expect(resourceManager.getResourceProduction('minerals')).toBe(10);
```

### 3. GameContext Test Factory

**File:** `src/tests/factories/createTestGameProvider.tsx`

**Purpose:** Creates a TestGameProvider component that provides a real GameContext for testing React components.

**Features:**

- Uses the actual GameContext and reducer pattern
- Supports configurable initial state
- Provides helper methods for updating resources, ships, and sectors
- Allows resetting state to initial values
- Simplifies testing of components that depend on GameContext

**Usage Example:**

```tsx
// Basic usage
render(
  <TestGameProvider>
    <YourComponent />
  </TestGameProvider>
);

// With custom initial state
render(
  <TestGameProvider
    initialState={{
      resources: { minerals: 500, energy: 1000 },
      gameTime: 100,
    }}
  >
    <YourComponent />
  </TestGameProvider>
);

// Using helper methods
function TestComponent() {
  const helpers = useTestGameHelpers();

  // Update resources
  helpers.updateResources({ minerals: 1000 });

  // Add a ship
  helpers.addShip({
    id: 'ship-1',
    status: 'idle',
    experience: 0,
    stealthActive: false,
  });

  // Reset state
  helpers.resetState();

  return <div>Test Component</div>;
}
```

### 4. ModuleManager Test Factory

**File:** `src/tests/factories/createTestModuleManager.ts`

**Purpose:** Provides a real implementation of the ModuleManager that behaves like the production code but is isolated for testing purposes.

**Features:**

- Creates a real ModuleManager instance without mocking
- Provides helper methods for module creation, building creation, and attachment
- Supports module activation, attachment, and querying
- Properly resets state between tests
- Uses real implementations of the ModuleStatusManager and ModuleUpgradeManager

**Usage Example:**

```typescript
// Create the test factory
const testModuleManager = createTestModuleManager();

// Create a module
const position = { x: 10, y: 20 };
const module = testModuleManager.createModule('radar', position);

// Activate the module
testModuleManager.setModuleActive(module.id, true);

// Create a building with an attachment point
const attachmentPoint = testModuleManager.createTestAttachmentPoint(position, ['radar']);
const building = testModuleManager.createTestBuilding('mothership', {
  attachmentPoints: [attachmentPoint],
});

// Attach the module to the building
const result = testModuleManager.attachModule(module.id, building.id, attachmentPoint.id);

// Verify the attachment was successful
expect(result).toBe(true);

// Reset state for the next test
testModuleManager.reset();
```

**Test File:** `src/tests/factories/createTestModuleManager.test.ts`

This test suite verifies all aspects of the test factory, including:

- Module configuration registration
- Module lifecycle (creation, activation, overrides)
- Building management (creation, attachment points)
- Module queries (by ID, type, active status)
- Reset functionality

## Best Practices for Using Test Factories

1. **Use actual implementations instead of mocks**

   - Test factories provide real implementations that behave like production code
   - This ensures tests verify actual behavior rather than mock interactions

2. **Keep tests isolated**

   - Each test should create its own test factory instances
   - This prevents cross-test contamination

3. **Focus on behavior, not implementation details**

   - Test what components/functions do, not how they do it
   - Test from the user's perspective

4. **Use helper methods for verification**

   - Test factories provide helper methods for verifying behavior
   - This makes tests more readable and maintainable

5. **Clean up after tests**
   - Some test factories may require cleanup to prevent memory leaks
   - Use beforeEach/afterEach hooks to set up and tear down test state

## Future Test Factories

The following test factories are planned for future implementation:

1. **AutomationManager Test Factory**

   - Will provide a real AutomationManager for tests
   - Will support rule registration and management

2. **Component Test Helpers**
   - Will provide helper functions to render components with appropriate context
   - Will include type-safe props for controlling component behavior
