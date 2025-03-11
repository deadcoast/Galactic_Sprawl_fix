# INTEGRATION TESTING

## Overview

This document provides guidelines and examples for integration testing in the Galactic Sprawl project. Integration tests verify that different components work together correctly.

## Testing Guidelines

### General Principles

1. **Test Component Interactions**

   - Test system boundaries
   - Verify data flow
   - Check event propagation

2. **Test Environment**

   - Use real implementations
   - Minimize mocking
   - Simulate real conditions

3. **Test Scope**
   - Focus on component interactions
   - Test complete workflows
   - Verify system behavior

## System Integration Tests

### Resource Flow Integration

```typescript
// src/test/integration/ResourceFlowIntegration.test.ts

describe('Resource Flow Integration', () => {
  let system: TestSystem;

  beforeEach(async () => {
    system = await TestSystem.create({
      components: ['ResourceManager', 'ResourceFlowManager', 'ResourceVisualization'],
    });
  });

  afterEach(async () => {
    await system.cleanup();
  });

  it('should update visualization when resource flow changes', async () => {
    // Arrange
    const source = await system.resourceManager.addResource({
      type: ResourceType.IRON,
      amount: 1000,
      location: { x: 0, y: 0 },
    });

    const destination = await system.resourceManager.addResource({
      type: ResourceType.IRON,
      amount: 0,
      location: { x: 1, y: 0 },
    });

    await system.resourceFlowManager.createFlow({
      from: source.id,
      to: destination.id,
      rate: 10,
    });

    // Act
    await system.tick(1000); // Simulate 1 second

    // Assert
    const visualization = await system.getComponent('ResourceVisualization');
    const flowLine = visualization.getFlowLine(source.id, destination.id);

    expect(flowLine).toBeDefined();
    expect(flowLine.props.rate).toBe(10);
    expect(await system.resourceManager.getAmount(destination.id)).toBe(10);
  });

  it('should optimize resource flows across network', async () => {
    // Arrange
    const nodes = await Promise.all([
      system.resourceManager.addResource({
        type: ResourceType.IRON,
        amount: 1000,
        location: { x: 0, y: 0 },
      }),
      system.resourceManager.addResource({
        type: ResourceType.IRON,
        amount: 0,
        location: { x: 1, y: 0 },
      }),
      system.resourceManager.addResource({
        type: ResourceType.IRON,
        amount: 0,
        location: { x: 2, y: 0 },
      }),
    ]);

    // Act
    await system.resourceFlowManager.createFlow({
      from: nodes[0].id,
      to: nodes[1].id,
      rate: 10,
    });

    await system.resourceFlowManager.createFlow({
      from: nodes[1].id,
      to: nodes[2].id,
      rate: 5,
    });

    await system.resourceFlowManager.optimizeFlows();

    // Assert
    const flows = await system.resourceFlowManager.getFlows();
    expect(flows).toHaveLength(2);
    expect(flows[0].rate).toBe(5); // Optimized to match downstream capacity
  });
});
```

### Module System Integration

```typescript
// src/test/integration/ModuleSystemIntegration.test.ts

describe('Module System Integration', () => {
  let system: TestSystem;

  beforeEach(async () => {
    system = await TestSystem.create({
      components: ['ModuleManager', 'ResourceManager', 'ModuleVisualization'],
    });
  });

  afterEach(async () => {
    await system.cleanup();
  });

  it('should activate dependent modules when requirements are met', async () => {
    // Arrange
    const powerPlant = await system.moduleManager.createModule({
      name: 'Power Plant',
      type: ModuleType.PRODUCER,
      outputs: [{ type: ResourceType.ENERGY, rate: 100 }],
    });

    const factory = await system.moduleManager.createModule({
      name: 'Factory',
      type: ModuleType.CONSUMER,
      inputs: [{ type: ResourceType.ENERGY, rate: 50 }],
      dependencies: [powerPlant.id],
    });

    // Act
    await system.moduleManager.activateModule(powerPlant.id);
    await system.moduleManager.activateModule(factory.id);

    // Assert
    const moduleStates = await system.moduleManager.getModuleStates();
    expect(moduleStates[powerPlant.id]).toBe(ModuleStatus.ACTIVE);
    expect(moduleStates[factory.id]).toBe(ModuleStatus.ACTIVE);

    const resourceFlows = await system.resourceManager.getFlows();
    expect(resourceFlows).toHaveLength(1);
    expect(resourceFlows[0]).toEqual(
      expect.objectContaining({
        sourceId: powerPlant.id,
        targetId: factory.id,
        resourceType: ResourceType.ENERGY,
        rate: 50,
      })
    );
  });

  it('should update visualization when module status changes', async () => {
    // Arrange
    const module = await system.moduleManager.createModule({
      name: 'Test Module',
      type: ModuleType.PRODUCER,
    });

    // Act
    await system.moduleManager.activateModule(module.id);

    // Assert
    const visualization = await system.getComponent('ModuleVisualization');
    const moduleCard = visualization.getModuleCard(module.id);

    expect(moduleCard.props.status).toBe(ModuleStatus.ACTIVE);
    expect(moduleCard).toHaveClass('module-active');
  });
});
```

### Game State Integration

```typescript
// src/test/integration/GameStateIntegration.test.ts

describe('Game State Integration', () => {
  let system: TestSystem;

  beforeEach(async () => {
    system = await TestSystem.create({
      components: ['GameManager', 'ResourceManager', 'ModuleManager', 'GameHUD'],
    });
  });

  afterEach(async () => {
    await system.cleanup();
  });

  it('should coordinate system updates during game loop', async () => {
    // Arrange
    const updateSpies = {
      resource: jest.spyOn(system.resourceManager, 'update'),
      module: jest.spyOn(system.moduleManager, 'update'),
    };

    // Act
    await system.gameManager.startGame();
    await system.tick(1000); // Run for 1 second

    // Assert
    expect(updateSpies.resource).toHaveBeenCalled();
    expect(updateSpies.module).toHaveBeenCalled();
    expect(updateSpies.resource.mock.calls.length).toBeGreaterThan(50); // Expect ~60 calls per second
  });

  it('should pause all systems when game is paused', async () => {
    // Arrange
    await system.gameManager.startGame();
    const initialState = await system.getSystemState();

    // Act
    await system.gameManager.pauseGame();
    await system.tick(1000);

    // Assert
    const currentState = await system.getSystemState();
    expect(currentState).toEqual(initialState); // No updates while paused
  });

  it('should update HUD with current game state', async () => {
    // Arrange
    const resource = await system.resourceManager.addResource({
      type: ResourceType.ENERGY,
      amount: 100,
      location: { x: 0, y: 0 },
    });

    // Act
    await system.gameManager.startGame();
    await system.tick(100);

    // Assert
    const hud = await system.getComponent('GameHUD');
    const resourceDisplay = hud.getResourceDisplay(ResourceType.ENERGY);

    expect(resourceDisplay.props.amount).toBe(100);
    expect(resourceDisplay.props.production).toBeGreaterThan(0);
  });
});
```

## Performance Integration

### Resource Flow Performance

```typescript
// src/test/integration/ResourceFlowPerformance.test.ts

describe('Resource Flow Performance', () => {
  let system: TestSystem;
  let performance: PerformanceTest;

  beforeEach(async () => {
    system = await TestSystem.create({
      components: ['ResourceManager', 'ResourceFlowManager'],
    });
    performance = new PerformanceTest();
  });

  it('should handle large resource networks efficiently', async () => {
    // Arrange
    const nodeCount = 1000;
    const nodes = await createResourceNetwork(system, nodeCount);

    // Act
    const report = await performance.runPerformanceTest(async () => {
      await system.resourceFlowManager.optimizeFlows();
      await system.tick(100);
    });

    // Assert
    expect(report.metrics.updateTime).toBeLessThan(16); // 60 FPS
    expect(report.metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB
  });

  it('should batch flow updates for better performance', async () => {
    // Arrange
    const updateCount = 1000;
    const node = await system.resourceManager.addResource({
      type: ResourceType.IRON,
      amount: 1000,
      location: { x: 0, y: 0 },
    });

    // Act
    const report = await performance.runPerformanceTest(async () => {
      for (let i = 0; i < updateCount; i++) {
        await system.resourceManager.updateResource(node.id, {
          amount: node.amount + 1,
        });
      }
    });

    // Assert
    expect(report.metrics.eventCount).toBeLessThan(updateCount); // Events should be batched
    expect(report.metrics.updateTime / updateCount).toBeLessThan(0.1); // Less than 0.1ms per update
  });
});
```

## Best Practices

1. **Test Setup**

   - Use helper functions
   - Create realistic test data
   - Clean up after tests

2. **Async Testing**

   - Handle promises correctly
   - Use proper async/await
   - Set appropriate timeouts

3. **Performance Testing**
   - Measure critical metrics
   - Test with realistic load
   - Monitor resource usage

## Related Documentation

- [Testing Architecture](01_TEST_ARCHITECTURE.md)
- [Unit Testing](02_UNIT_TESTING.md)
- [Performance Testing](04_PERFORMANCE_TESTING.md)
