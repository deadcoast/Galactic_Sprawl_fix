# PERFORMANCE TESTING

## Overview

This document provides guidelines and examples for performance testing in the Galactic Sprawl project. Performance tests ensure the system meets performance requirements under various conditions.

## Testing Guidelines

### General Principles

1. **Test Critical Paths**

   - Identify performance-critical code
   - Test under realistic conditions
   - Measure key metrics

2. **Test Environment**

   - Use consistent hardware
   - Minimize external factors
   - Monitor system resources

3. **Test Metrics**
   - Frame rate (60 FPS target)
   - Memory usage
   - CPU utilization
   - Event throughput

## Performance Test Suite

### Configuration

```typescript
// src/test/performance/PerformanceConfig.ts

export interface PerformanceConfig {
  thresholds: {
    renderTime: number; // 16ms for 60 FPS
    updateTime: number; // 8ms target
    eventProcessingTime: number; // 4ms target
    memoryUsage: number; // 50MB target
  };
  testDuration: number; // Default test duration
  sampleSize: number; // Number of samples to collect
  warmupIterations: number; // Iterations before measuring
}

export const defaultPerformanceConfig: PerformanceConfig = {
  thresholds: {
    renderTime: 16, // ms
    updateTime: 8, // ms
    eventProcessingTime: 4, // ms
    memoryUsage: 50 * 1024 * 1024, // 50MB
  },
  testDuration: 5000, // 5 seconds
  sampleSize: 100,
  warmupIterations: 10,
};
```

### Performance Test Base

```typescript
// src/test/performance/PerformanceTest.ts

export class PerformanceTest {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      ...defaultPerformanceConfig,
      ...config,
    };
    this.metrics = new PerformanceMetrics();
  }

  public async measureOperation<T>(
    operation: () => Promise<T>,
    iterations: number = this.config.sampleSize
  ): Promise<PerformanceReport> {
    // Warm up
    for (let i = 0; i < this.config.warmupIterations; i++) {
      await operation();
    }

    const samples: number[] = [];
    const memorySnapshots: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startMemory = process.memoryUsage().heapUsed;
      const startTime = performance.now();

      await operation();

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      samples.push(endTime - startTime);
      memorySnapshots.push(endMemory - startMemory);
    }

    return {
      samples,
      memorySnapshots,
      metrics: {
        mean: this.calculateMean(samples),
        p95: this.calculatePercentile(samples, 95),
        p99: this.calculatePercentile(samples, 99),
        maxMemory: Math.max(...memorySnapshots),
        averageMemory: this.calculateMean(memorySnapshots),
      },
    };
  }

  public async measureRenderPerformance(
    component: React.ComponentType,
    props: any
  ): Promise<PerformanceReport> {
    return this.measureOperation(async () => {
      const { rerender } = render(createElement(component, props));
      await act(() => rerender(createElement(component, props)));
    });
  }

  public async measureEventProcessing(
    eventBus: EventBus,
    eventGenerator: () => BaseEvent,
    count: number = 1000
  ): Promise<PerformanceReport> {
    return this.measureOperation(async () => {
      const events = Array.from({ length: count }, eventGenerator);
      const startTime = performance.now();

      for (const event of events) {
        eventBus.publish(event);
      }

      await this.waitForEventProcessing();

      return performance.now() - startTime;
    });
  }

  private calculateMean(samples: number[]): number {
    return samples.reduce((sum, value) => sum + value, 0) / samples.length;
  }

  private calculatePercentile(samples: number[], percentile: number): number {
    const sorted = [...samples].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  private async waitForEventProcessing(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

## Performance Test Examples

### Resource System Performance

```typescript
// src/test/performance/ResourceSystemPerformance.test.ts

describe('Resource System Performance', () => {
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
    const report = await performance.measureOperation(async () => {
      await system.resourceFlowManager.optimizeFlows();
      await system.tick(100);
    });

    // Assert
    expect(report.metrics.mean).toBeLessThan(16); // 60 FPS
    expect(report.metrics.p95).toBeLessThan(32); // No major spikes
    expect(report.metrics.maxMemory).toBeLessThan(50 * 1024 * 1024); // 50MB limit
  });

  it('should efficiently process resource flow updates', async () => {
    // Arrange
    const updateCount = 10000;
    const node = await system.resourceManager.addResource({
      type: ResourceType.IRON,
      amount: 1000,
      location: { x: 0, y: 0 },
    });

    // Act
    const report = await performance.measureOperation(async () => {
      for (let i = 0; i < updateCount; i++) {
        await system.resourceManager.updateResource(node.id, {
          amount: node.amount + 1,
        });
      }
    });

    // Assert
    const updatesPerSecond = updateCount / (report.metrics.mean / 1000);
    expect(updatesPerSecond).toBeGreaterThan(10000); // 10K updates/sec
  });
});
```

### UI Performance

```typescript
// src/test/performance/UIPerformance.test.ts

describe('UI Performance', () => {
  let performance: PerformanceTest;

  beforeEach(() => {
    performance = new PerformanceTest();
  });

  it('should render resource grid efficiently', async () => {
    // Arrange
    const resources = Array.from({ length: 1000 }, (_, i) => ({
      id: `resource-${i}`,
      type: ResourceType.IRON,
      amount: i,
      location: { x: i % 32, y: Math.floor(i / 32) },
    }));

    // Act
    const report = await performance.measureRenderPerformance(
      ResourceGrid,
      { resources }
    );

    // Assert
    expect(report.metrics.mean).toBeLessThan(16); // 60 FPS
    expect(report.metrics.p95).toBeLessThan(32); // No major spikes
  });

  it('should handle rapid UI updates', async () => {
    // Arrange
    const updateCount = 100;
    const resource = createTestResource();
    const { rerender } = render(
      <ResourceDisplay resource={resource} />
    );

    // Act
    const report = await performance.measureOperation(
      async () => {
        for (let i = 0; i < updateCount; i++) {
          await act(() => {
            rerender(
              <ResourceDisplay
                resource={{
                  ...resource,
                  amount: resource.amount + i,
                }}
              />
            );
          });
        }
      }
    );

    // Assert
    const updatesPerFrame = (16 / report.metrics.mean) * updateCount;
    expect(updatesPerFrame).toBeGreaterThan(1); // At least 1 update per frame
  });
});
```

### Event System Performance

```typescript
// src/test/performance/EventSystemPerformance.test.ts

describe('Event System Performance', () => {
  let eventBus: EventBus;
  let performance: PerformanceTest;

  beforeEach(() => {
    eventBus = new EventBus();
    performance = new PerformanceTest();
  });

  it('should handle high event throughput', async () => {
    // Arrange
    const eventCount = 10000;
    const subscribers = Array.from({ length: 10 }, () => jest.fn());

    subscribers.forEach(subscriber => eventBus.subscribe(EventType.RESOURCE_UPDATED, subscriber));

    // Act
    const report = await performance.measureEventProcessing(
      eventBus,
      () => ({
        type: EventType.RESOURCE_UPDATED,
        timestamp: Date.now(),
        id: generateId(),
        payload: { amount: Math.random() * 100 },
      }),
      eventCount
    );

    // Assert
    const eventsPerSecond = eventCount / (report.metrics.mean / 1000);
    expect(eventsPerSecond).toBeGreaterThan(100000); // 100K events/sec
    expect(report.metrics.maxMemory).toBeLessThan(10 * 1024 * 1024); // 10MB limit
  });

  it('should efficiently batch similar events', async () => {
    // Arrange
    const eventCount = 1000;
    const batchSize = 100;
    const eventBatcher = new EventBatcher({
      maxBatchSize: batchSize,
      batchInterval: 16, // One frame
    });

    // Act
    const report = await performance.measureOperation(async () => {
      for (let i = 0; i < eventCount; i++) {
        eventBatcher.addEvent({
          type: EventType.RESOURCE_UPDATED,
          timestamp: Date.now(),
          id: generateId(),
          payload: { amount: i },
        });
      }
      await new Promise(resolve => setTimeout(resolve, 20)); // Wait for batching
    });

    // Assert
    const expectedBatches = Math.ceil(eventCount / batchSize);
    expect(report.metrics.mean / expectedBatches).toBeLessThan(1); // Less than 1ms per batch
  });
});
```

## Performance Monitoring

### Metrics Collection

```typescript
// src/test/performance/PerformanceMetrics.ts

export class PerformanceMetrics {
  private samples: Map<string, number[]>;
  private memorySnapshots: Map<string, number[]>;

  constructor() {
    this.samples = new Map();
    this.memorySnapshots = new Map();
  }

  public recordSample(metric: string, value: number, memory: number): void {
    if (!this.samples.has(metric)) {
      this.samples.set(metric, []);
      this.memorySnapshots.set(metric, []);
    }

    this.samples.get(metric)!.push(value);
    this.memorySnapshots.get(metric)!.push(memory);
  }

  public getMetrics(metric: string): MetricSummary {
    const samples = this.samples.get(metric) || [];
    const memorySnapshots = this.memorySnapshots.get(metric) || [];

    return {
      count: samples.length,
      mean: this.calculateMean(samples),
      p95: this.calculatePercentile(samples, 95),
      p99: this.calculatePercentile(samples, 99),
      maxMemory: Math.max(...memorySnapshots),
      averageMemory: this.calculateMean(memorySnapshots),
    };
  }

  public clear(): void {
    this.samples.clear();
    this.memorySnapshots.clear();
  }
}
```

## Best Practices

1. **Test Environment**

   - Use consistent hardware
   - Minimize background processes
   - Monitor system resources

2. **Test Data**

   - Use realistic data sizes
   - Test edge cases
   - Include stress tests

3. **Metrics**
   - Track key performance indicators
   - Monitor trends over time
   - Set clear thresholds

## Related Documentation

- [Testing Architecture](01_TEST_ARCHITECTURE.md)
- [Unit Testing](02_UNIT_TESTING.md)
- [Integration Testing](03_INTEGRATION_TESTING.md)
