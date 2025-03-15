# UNIT TESTING

## Overview

This document provides guidelines and examples for unit testing in the Galactic Sprawl project. Unit tests ensure individual components work correctly in isolation.

## Testing Guidelines

### General Principles

1. **Test in Isolation**

   - Mock dependencies
   - Test single units of work
   - Avoid integration concerns

2. **Test Structure**

   - Arrange: Set up test conditions
   - Act: Execute the code under test
   - Assert: Verify the results

3. **Naming Conventions**
   - Descriptive test names
   - Clear failure messages
   - Consistent file naming

## Component Testing

### React Components

```typescript
// src/test/unit/components/ResourceDisplay.test.tsx

describe('ResourceDisplay', () => {
  const mockResource: Resource = {
    id: 'test-resource',
    type: ResourceType.IRON,
    amount: 100,
    location: { x: 0, y: 0 },
  };

  it('renders resource information correctly', () => {
    const { getByText } = render(
      <ResourceDisplay resource={mockResource} />
    );

    expect(getByText('IRON')).toBeInTheDocument();
    expect(getByText('100')).toBeInTheDocument();
  });

  it('updates when resource amount changes', () => {
    const { getByText, rerender } = render(
      <ResourceDisplay resource={mockResource} />
    );

    const updatedResource = {
      ...mockResource,
      amount: 150,
    };

    rerender(<ResourceDisplay resource={updatedResource} />);
    expect(getByText('150')).toBeInTheDocument();
  });

  it('shows threshold warning when amount is low', () => {
    const { getByTestId } = render(
      <ResourceDisplay
        resource={{ ...mockResource, amount: 10 }}
        threshold={50}
      />
    );

    expect(getByTestId('threshold-warning')).toBeInTheDocument();
  });
});
```

### Custom Hooks

```typescript
// src/test/unit/hooks/useResourceFlow.test.ts

describe('useResourceFlow', () => {
  const mockEventBus = new MockEventBus();
  const mockResource = createTestResource();

  beforeEach(() => {
    mockEventBus.reset();
  });

  it('initializes with empty flow data', () => {
    const { result } = renderHook(() => useResourceFlow(mockEventBus));

    expect(result.current.flows).toEqual([]);
    expect(result.current.totalFlow).toBe(0);
  });

  it('updates flow data when resource flow changes', () => {
    const { result } = renderHook(() => useResourceFlow(mockEventBus));

    act(() => {
      mockEventBus.publish({
        type: EventType.FLOW_UPDATED,
        timestamp: Date.now(),
        id: generateId(),
        payload: {
          flow: {
            id: 'test-flow',
            sourceId: 'source',
            targetId: 'target',
            rate: 10,
            resourceType: ResourceType.IRON,
          },
        },
      });
    });

    expect(result.current.flows).toHaveLength(1);
    expect(result.current.totalFlow).toBe(10);
  });

  it('cleans up subscriptions on unmount', () => {
    const unsubscribeSpy = jest.fn();
    mockEventBus.subscribe = jest.fn().mockReturnValue(unsubscribeSpy);

    const { unmount } = renderHook(() => useResourceFlow(mockEventBus));

    unmount();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
```

## Manager Testing

### Resource Manager

```typescript
// src/test/unit/managers/ResourceManager.test.ts

describe('ResourceManager', () => {
  let resourceManager: ResourceManager;
  let eventBus: EventBus<ResourceEvent>;

  beforeEach(() => {
    eventBus = new EventBus();
    resourceManager = new ResourceManager(eventBus);
  });

  describe('addResource', () => {
    it('emits RESOURCE_ADDED event when adding new resource', async () => {
      const eventSpy = jest.fn();
      eventBus.subscribe(ResourceEvents.RESOURCE_ADDED, eventSpy);

      await resourceManager.addResource({
        type: ResourceType.IRON,
        amount: 100,
        location: { x: 0, y: 0 },
      });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ResourceEvents.RESOURCE_ADDED,
          payload: expect.objectContaining({
            resourceType: ResourceType.IRON,
            amount: 100,
          }),
        })
      );
    });

    it('updates existing resource when adding to same location', async () => {
      const location = { x: 0, y: 0 };

      await resourceManager.addResource({
        type: ResourceType.IRON,
        amount: 100,
        location,
      });

      await resourceManager.addResource({
        type: ResourceType.IRON,
        amount: 50,
        location,
      });

      const resource = await resourceManager.getResourceAt(location);
      expect(resource).toEqual(
        expect.objectContaining({
          type: ResourceType.IRON,
          amount: 150,
        })
      );
    });
  });

  describe('createFlow', () => {
    it('creates valid resource flow between nodes', async () => {
      const source = await resourceManager.addResource({
        type: ResourceType.IRON,
        amount: 100,
        location: { x: 0, y: 0 },
      });

      const target = await resourceManager.addResource({
        type: ResourceType.IRON,
        amount: 0,
        location: { x: 1, y: 0 },
      });

      const flow = await resourceManager.createFlow(source.id, target.id, 10);

      expect(flow).toEqual(
        expect.objectContaining({
          sourceId: source.id,
          targetId: target.id,
          rate: 10,
          resourceType: ResourceType.IRON,
        })
      );
    });

    it('throws error when creating flow with invalid nodes', async () => {
      await expect(resourceManager.createFlow('invalid', 'also-invalid', 10)).rejects.toThrow(
        'Invalid flow nodes'
      );
    });
  });
});
```

### Module Manager

```typescript
// src/test/unit/managers/ModuleManager.test.ts

describe('ModuleManager', () => {
  let moduleManager: ModuleManager;
  let eventBus: EventBus<ModuleEvent>;

  beforeEach(() => {
    eventBus = new EventBus();
    moduleManager = new ModuleManager(eventBus);
  });

  describe('createModule', () => {
    it('creates module with correct initial state', () => {
      const config: ModuleConfig = {
        name: 'Test Module',
        type: ModuleType.PRODUCER,
        requirements: [],
      };

      const module = moduleManager.createModule(config);

      expect(module).toEqual(
        expect.objectContaining({
          name: config.name,
          type: config.type,
          status: ModuleStatus.INACTIVE,
        })
      );
    });

    it('emits MODULE_CREATED event', () => {
      const eventSpy = jest.fn();
      eventBus.subscribe(ModuleEvents.MODULE_CREATED, eventSpy);

      const module = moduleManager.createModule({
        name: 'Test Module',
        type: ModuleType.PRODUCER,
      });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ModuleEvents.MODULE_CREATED,
          payload: { module },
        })
      );
    });
  });

  describe('activateModule', () => {
    it('activates module when dependencies are met', async () => {
      const moduleA = await moduleManager.createModule({
        name: 'Module A',
        type: ModuleType.PRODUCER,
      });

      const moduleB = await moduleManager.createModule({
        name: 'Module B',
        type: ModuleType.CONSUMER,
        dependencies: [moduleA.id],
      });

      await moduleManager.activateModule(moduleA.id);
      await moduleManager.activateModule(moduleB.id);

      const state = moduleManager.getState();
      expect(state.moduleStatus[moduleB.id]).toBe(ModuleStatus.ACTIVE);
    });

    it('does not activate module when dependencies are not met', async () => {
      const moduleA = await moduleManager.createModule({
        name: 'Module A',
        type: ModuleType.PRODUCER,
      });

      const moduleB = await moduleManager.createModule({
        name: 'Module B',
        type: ModuleType.CONSUMER,
        dependencies: [moduleA.id],
      });

      await moduleManager.activateModule(moduleB.id);

      const state = moduleManager.getState();
      expect(state.moduleStatus[moduleB.id]).toBe(ModuleStatus.INACTIVE);
    });
  });
});
```

## Context Testing

### Resource Context

```typescript
// src/test/unit/contexts/ResourceContext.test.ts

describe('ResourceContext', () => {
  let resourceContext: ResourceContext;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    resourceContext = new ResourceContext(eventBus);
  });

  it('initializes with empty state', () => {
    const state = resourceContext.getState();
    expect(state.resources).toEqual({});
    expect(state.flows).toEqual({});
    expect(state.production).toEqual({});
    expect(state.consumption).toEqual({});
  });

  it('updates state when adding resource', () => {
    const resource = createTestResource();
    resourceContext.addResource(resource);

    const state = resourceContext.getState();
    expect(state.resources[resource.id]).toEqual(resource);
  });

  it('calculates resource rates correctly', () => {
    const source = createTestResource();
    const target = createTestResource();

    resourceContext.addResource(source);
    resourceContext.addResource(target);

    resourceContext.updateFlow({
      id: 'test-flow',
      sourceId: source.id,
      targetId: target.id,
      rate: 10,
      type: 'transfer',
    });

    const state = resourceContext.getState();
    expect(state.consumption[target.id]).toBe(10);
    expect(state.production[source.id]).toBe(10);
  });

  it('notifies subscribers of state changes', () => {
    const subscriber = jest.fn();
    resourceContext.subscribe(subscriber);

    const resource = createTestResource();
    resourceContext.addResource(resource);

    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        resources: expect.any(Object),
      }),
      expect.any(Object)
    );
  });
});
```

## Best Practices

1. **Test Coverage**

   - Aim for 90% coverage
   - Focus on critical paths
   - Test edge cases

2. **Mocking**

   - Use mock implementations
   - Mock external dependencies
   - Keep mocks simple

3. **Performance**
   - Keep tests fast
   - Avoid unnecessary setup
   - Clean up after tests

## Related Documentation

- [Testing Architecture](01_TEST_ARCHITECTURE.md)
- [Integration Testing](03_INTEGRATION_TESTING.md)
- [Performance Testing](04_PERFORMANCE_TESTING.md)
