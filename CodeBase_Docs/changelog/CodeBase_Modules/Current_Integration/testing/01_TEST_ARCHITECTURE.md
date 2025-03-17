# TESTING ARCHITECTURE

## Overview

The Testing Architecture provides a comprehensive testing strategy for the Galactic Sprawl project. It includes:

- Unit testing framework
- Integration testing setup
- Performance testing tools
- Test utilities and helpers
- Continuous integration configuration

## Core Components

### Test Configuration

```typescript
// src/test/config/TestConfig.ts

export interface TestConfig {
  timeout: number;
  mockEventBus: boolean;
  mockContexts: boolean;
  performanceThresholds: {
    renderTime: number;
    updateTime: number;
    eventProcessingTime: number;
    memoryUsage: number;
  };
}

export const defaultTestConfig: TestConfig = {
  timeout: 5000,
  mockEventBus: false,
  mockContexts: false,
  performanceThresholds: {
    renderTime: 16, // ms (60fps)
    updateTime: 8, // ms
    eventProcessingTime: 4, // ms
    memoryUsage: 50 * 1024 * 1024, // 50MB
  },
};

export function createTestConfig(overrides: Partial<TestConfig> = {}): TestConfig {
  return {
    ...defaultTestConfig,
    ...overrides,
  };
}
```

### Test Utilities

```typescript
// src/test/utils/TestUtils.ts

export class TestUtils {
  private config: TestConfig;

  constructor(config: TestConfig = defaultTestConfig) {
    this.config = config;
  }

  public createTestEventBus(): EventBus {
    return this.config.mockEventBus ? new MockEventBus() : new EventBus();
  }

  public createTestContext<T>(type: ContextType, initialState: T): BaseContextProvider<T> {
    return this.config.mockContexts
      ? new MockContextProvider(type, initialState)
      : new BaseContextProvider({
          name: type,
          initialState,
        });
  }

  public async waitForEvent(
    eventBus: EventBus,
    eventType: EventType,
    timeout: number = this.config.timeout
  ): Promise<BaseEvent> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for event ${eventType}`));
      }, timeout);

      const unsubscribe = eventBus.subscribe(eventType, event => {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(event);
      });
    });
  }

  public async waitForState<T>(
    context: BaseContextProvider<T>,
    predicate: (state: T) => boolean,
    timeout: number = this.config.timeout
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for state condition'));
      }, timeout);

      const unsubscribe = context.subscribe((_, state) => {
        if (predicate(state)) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(state);
        }
      });
    });
  }

  public createTestModule(config: Partial<ModuleConfig> = {}): Module {
    return {
      id: generateId(),
      name: 'TestModule',
      type: ModuleType.TEST,
      status: ModuleStatus.INACTIVE,
      ...config,
    };
  }

  public createTestResource(config: Partial<ResourceConfig> = {}): Resource {
    return {
      id: generateId(),
      name: 'TestResource',
      type: ResourceType.TEST,
      amount: 0,
      ...config,
    };
  }
}
```

### Performance Testing

```typescript
// src/test/performance/PerformanceTest.ts

export class PerformanceTest {
  private config: TestConfig;
  private metrics: PerformanceMetrics;

  constructor(config: TestConfig = defaultTestConfig) {
    this.config = config;
    this.metrics = new PerformanceMetrics();
  }

  public async measureRenderTime(component: React.ComponentType, props: any): Promise<number> {
    const startTime = performance.now();

    const { rerender } = render(createElement(component, props));
    await act(() => rerender(createElement(component, props)));

    const renderTime = performance.now() - startTime;
    this.metrics.recordRenderTime(renderTime);

    return renderTime;
  }

  public async measureUpdateTime(
    manager: BaseManager,
    operation: () => Promise<void>
  ): Promise<number> {
    const startTime = performance.now();

    await operation();

    const updateTime = performance.now() - startTime;
    this.metrics.recordUpdateTime(updateTime);

    return updateTime;
  }

  public async measureEventProcessing(eventBus: EventBus, event: BaseEvent): Promise<number> {
    const startTime = performance.now();

    eventBus.publish(event);
    await this.waitForEventProcessing();

    const processingTime = performance.now() - startTime;
    this.metrics.recordEventProcessingTime(processingTime);

    return processingTime;
  }

  public measureMemoryUsage(): number {
    const usage = process.memoryUsage();
    const heapUsed = usage.heapUsed;

    this.metrics.recordMemoryUsage(heapUsed);

    return heapUsed;
  }

  public async runPerformanceTest(test: () => Promise<void>): Promise<PerformanceReport> {
    const startMemory = this.measureMemoryUsage();
    const startTime = performance.now();

    try {
      await test();
    } catch (error) {
      console.error('Performance test failed:', error);
      throw error;
    }

    const endTime = performance.now();
    const endMemory = this.measureMemoryUsage();

    return {
      duration: endTime - startTime,
      memoryDelta: endMemory - startMemory,
      metrics: this.metrics.getMetrics(),
      thresholds: this.config.performanceThresholds,
    };
  }

  private async waitForEventProcessing(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

### Integration Testing

```typescript
// src/test/integration/IntegrationTest.ts

export class IntegrationTest {
  private utils: TestUtils;
  private performance: PerformanceTest;
  private eventBus: EventBus;

  constructor(config: TestConfig = defaultTestConfig) {
    this.utils = new TestUtils(config);
    this.performance = new PerformanceTest(config);
    this.eventBus = this.utils.createTestEventBus();
  }

  public async testResourceFlow(): Promise<void> {
    const resourceManager = new ResourceManager(this.eventBus);
    const moduleManager = new ModuleManager(this.eventBus);

    await resourceManager.initialize();
    await moduleManager.initialize();

    const sourceModule = this.utils.createTestModule({
      type: ModuleType.PRODUCER,
    });

    const targetModule = this.utils.createTestModule({
      type: ModuleType.CONSUMER,
    });

    const resource = this.utils.createTestResource();

    await moduleManager.createModule(sourceModule);
    await moduleManager.createModule(targetModule);
    await resourceManager.addResource(resource);

    await resourceManager.createFlow(sourceModule.id, targetModule.id, 10);

    await this.utils.waitForEvent(this.eventBus, EventType.FLOWS_OPTIMIZED);

    const performanceReport = await this.performance.runPerformanceTest(async () => {
      for (let i = 0; i < 100; i++) {
        await resourceManager.update();
      }
    });

    this.assertPerformance(performanceReport);
  }

  public async testModuleActivation(): Promise<void> {
    const moduleManager = new ModuleManager(this.eventBus);
    await moduleManager.initialize();

    const moduleA = this.utils.createTestModule({ name: 'A' });
    const moduleB = this.utils.createTestModule({
      name: 'B',
      dependencies: [moduleA.id],
    });

    await moduleManager.createModule(moduleA);
    await moduleManager.createModule(moduleB);

    await moduleManager.activateModule(moduleA.id);

    await this.utils.waitForEvent(this.eventBus, EventType.MODULE_STATUS_CHANGED);

    const state = moduleManager.getState();
    assert(state.moduleStatus[moduleA.id] === ModuleStatus.ACTIVE);
    assert(state.moduleStatus[moduleB.id] === ModuleStatus.INACTIVE);

    await moduleManager.activateModule(moduleB.id);

    await this.utils.waitForEvent(this.eventBus, EventType.MODULE_STATUS_CHANGED);

    assert(state.moduleStatus[moduleB.id] === ModuleStatus.ACTIVE);
  }

  private assertPerformance(report: PerformanceReport): void {
    const { metrics, thresholds } = report;

    assert(
      metrics.renderTime <= thresholds.renderTime,
      `Render time ${metrics.renderTime}ms exceeds threshold ${thresholds.renderTime}ms`
    );

    assert(
      metrics.updateTime <= thresholds.updateTime,
      `Update time ${metrics.updateTime}ms exceeds threshold ${thresholds.updateTime}ms`
    );

    assert(
      metrics.eventProcessingTime <= thresholds.eventProcessingTime,
      `Event processing time ${metrics.eventProcessingTime}ms exceeds threshold ${thresholds.eventProcessingTime}ms`
    );

    assert(
      metrics.memoryUsage <= thresholds.memoryUsage,
      `Memory usage ${metrics.memoryUsage} bytes exceeds threshold ${thresholds.memoryUsage} bytes`
    );
  }
}
```

## Test Categories

### Unit Tests

1. **Component Tests**

   - Test rendering
   - Verify props
   - Check state updates

2. **Manager Tests**

   - Test initialization
   - Verify state management
   - Check event handling

3. **Context Tests**
   - Test state updates
   - Verify subscriptions
   - Check cleanup

### Integration Tests

1. **System Tests**

   - Test manager interaction
   - Verify state flow
   - Check event propagation

2. **Flow Tests**

   - Test resource management
   - Verify module coordination
   - Check game loop

3. **UI Tests**
   - Test component interaction
   - Verify state updates
   - Check rendering

### Performance Tests

1. **Render Tests**

   - Measure render times
   - Check component updates
   - Verify optimization

2. **Update Tests**

   - Measure state updates
   - Check event processing
   - Verify batching

3. **Memory Tests**
   - Track memory usage
   - Check for leaks
   - Verify cleanup

## Test Implementation

### Test Organization

1. **Directory Structure**

   ```
   src/
   ├── test/
   │   ├── config/
   │   │   └── TestConfig.ts
   │   ├── utils/
   │   │   └── TestUtils.ts
   │   ├── performance/
   │   │   └── PerformanceTest.ts
   │   ├── integration/
   │   │   └── IntegrationTest.ts
   │   ├── unit/
   │   │   ├── components/
   │   │   ├── managers/
   │   │   └── contexts/
   │   └── mocks/
   │       ├── EventBus.ts
   │       └── Context.ts
   ```

2. **File Naming**

   - `*.test.ts` for unit tests
   - `*.spec.ts` for integration tests
   - `*.perf.ts` for performance tests

3. **Test Suites**
   - Group related tests
   - Share setup/teardown
   - Maintain independence

### Test Execution

1. **Local Development**

   - Run unit tests
   - Check integration
   - Monitor performance

2. **Continuous Integration**

   - Run all tests
   - Check coverage
   - Verify thresholds

3. **Performance Monitoring**
   - Track metrics
   - Compare baselines
   - Alert on regressions

## Related Documentation

- [Architecture](../01_ARCHITECTURE.md)
- [Event System](../components/02_EVENT_SYSTEM.md)
- [Context Providers](../components/03_CONTEXT_PROVIDERS.md)
- [Manager Services](../components/04_MANAGER_SERVICES.md)
- [Resource System](../components/01_RESOURCE_SYSTEM.md)
