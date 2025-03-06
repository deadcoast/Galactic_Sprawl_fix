import { bench, describe } from 'vitest';
import { ModuleEvent, ModuleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { createPerformanceReporter, measureExecutionTime } from '../utils/testUtils';

/**
 * Event System Performance Benchmark
 *
 * This file contains performance benchmarks for the event system.
 * Run with `npx vitest bench src/tests/performance/EventSystem.benchmark.ts`
 */

interface BenchmarkScenario {
  name: string;
  eventCount: number;
  listenerCount: number;
  eventTypes: ModuleEventType[];
  run: () => Promise<{
    emitTimeMs: number;
    retrievalTimeMs: number;
    memoryChangeMB?: number;
    listenersTriggered: number;
  }>;
}

/**
 * Create an array of random events
 */
function createRandomEvents(count: number, eventTypes: ModuleEventType[]): ModuleEvent[] {
  const events: ModuleEvent[] = [];

  for (let i = 0; i < count; i++) {
    const typeIndex = Math.floor(Math.random() * eventTypes.length);
    events.push({
      type: eventTypes[typeIndex],
      moduleId: `module-${Math.floor(Math.random() * 100)}`,
      moduleType: 'production' as ModuleType,
      timestamp: Date.now() + i,
      data: {
        value: Math.random() * 100,
        metadata: `Event ${i} metadata`,
      },
    });
  }

  return events;
}

/**
 * Measure memory usage more accurately
 */
async function measureMemoryUsageAccurately(
  fn: () => Promise<void> | void
): Promise<number | undefined> {
  // Force garbage collection if available (Node.js only)
  if (global.gc) {
    global.gc();
  }

  // Check if we have access to memory usage API
  const hasMemoryAPI = typeof process !== 'undefined' && typeof process.memoryUsage === 'function';

  if (!hasMemoryAPI) {
    console.warn('Memory usage API not available, skipping memory measurement');
    return undefined;
  }

  // Measure before
  const memoryBefore = process.memoryUsage().heapUsed;

  // Run the function
  await fn();

  // Force garbage collection again if available
  if (global.gc) {
    global.gc();
  }

  // Measure after
  const memoryAfter = process.memoryUsage().heapUsed;

  // Calculate difference in MB
  return (memoryAfter - memoryBefore) / (1024 * 1024);
}

/**
 * Run a single benchmark scenario with improved metrics
 */
async function runBenchmarkWithImprovedMetrics(scenario: BenchmarkScenario): Promise<{
  emitTimeMs: number;
  retrievalTimeMs: number;
  memoryChangeMB?: number;
  listenersTriggered: number;
}> {
  console.warn(`Running benchmark: ${scenario.name}`);

  // Create a new event bus for this test
  const eventBus = new ModuleEventBus(scenario.eventCount * 2);
  let listenersTriggered = 0;

  // Add listeners
  const unsubscribers = [];
  for (let i = 0; i < scenario.listenerCount; i++) {
    // Each listener listens to all event types
    for (const type of scenario.eventTypes) {
      const unsubscribe = eventBus.subscribe(type, () => {
        listenersTriggered++;
      });
      unsubscribers.push(unsubscribe);
    }
  }

  // Create random events
  const events = createRandomEvents(scenario.eventCount, scenario.eventTypes);

  // Measure emission time with multiple runs for accuracy
  const emitTimesMs: number[] = [];
  for (let i = 0; i < 3; i++) {
    const emitResult = await measureExecutionTime(async () => {
      // Emit all events
      events.forEach(event => eventBus.emit(event));
    });
    emitTimesMs.push(emitResult.executionTimeMs);

    // Reset for next run
    eventBus.clearHistory();
    listenersTriggered = 0;

    // Re-emit events
    events.forEach(event => eventBus.emit(event));
  }

  // Calculate average emit time
  const emitTimeMs = emitTimesMs.reduce((a, b) => a + b, 0) / emitTimesMs.length;

  // Measure history retrieval time with multiple runs for accuracy
  const retrievalTimesMs: number[] = [];
  for (let i = 0; i < 3; i++) {
    const retrievalResult = await measureExecutionTime(() => {
      // Retrieve history in different ways
      eventBus.getHistory();
      eventBus.getModuleHistory('module-1');
      eventBus.getEventTypeHistory('MODULE_CREATED');
    });
    retrievalTimesMs.push(retrievalResult.executionTimeMs);
  }

  // Calculate average retrieval time
  const retrievalTimeMs = retrievalTimesMs.reduce((a, b) => a + b, 0) / retrievalTimesMs.length;

  // Measure memory usage more accurately
  const memoryChangeMB = await measureMemoryUsageAccurately(async () => {
    // Create a new event bus with the same configuration
    const memoryEventBus = new ModuleEventBus(scenario.eventCount * 2);

    // Add the same number of listeners
    const memoryUnsubscribers = [];
    for (let i = 0; i < scenario.listenerCount; i++) {
      for (const type of scenario.eventTypes) {
        const unsubscribe = memoryEventBus.subscribe(type, () => {
          // Do nothing in this test
        });
        memoryUnsubscribers.push(unsubscribe);
      }
    }

    // Emit all events
    events.forEach(event => memoryEventBus.emit(event));

    // Clean up
    memoryUnsubscribers.forEach(unsubscribe => unsubscribe());
  });

  // Clean up
  unsubscribers.forEach(unsubscribe => unsubscribe());

  return {
    emitTimeMs,
    retrievalTimeMs,
    memoryChangeMB,
    listenersTriggered,
  };
}

// Small event load - baseline
const smallEventScenario: BenchmarkScenario = {
  name: 'Small Event Load (100 events, 5 listeners, 5 event types)',
  eventCount: 100,
  listenerCount: 5,
  eventTypes: [
    'MODULE_CREATED',
    'MODULE_ATTACHED',
    'RESOURCE_PRODUCED',
    'AUTOMATION_STARTED',
    'STATUS_CHANGED',
  ],
  run: async () => {
    return runBenchmarkWithImprovedMetrics(smallEventScenario);
  },
};

// Medium event load
const mediumEventScenario: BenchmarkScenario = {
  name: 'Medium Event Load (1,000 events, 10 listeners, 10 event types)',
  eventCount: 1000,
  listenerCount: 10,
  eventTypes: [
    'MODULE_CREATED',
    'MODULE_ATTACHED',
    'MODULE_DETACHED',
    'RESOURCE_PRODUCED',
    'RESOURCE_CONSUMED',
    'AUTOMATION_STARTED',
    'MISSION_STARTED',
    'STATUS_CHANGED',
    'ERROR_OCCURRED',
    'SUB_MODULE_CREATED',
  ],
  run: async () => {
    return runBenchmarkWithImprovedMetrics(mediumEventScenario);
  },
};

// Large event load
const largeEventScenario: BenchmarkScenario = {
  name: 'Large Event Load (10,000 events, 20 listeners, 20 event types)',
  eventCount: 10000,
  listenerCount: 20,
  eventTypes: [
    'MODULE_CREATED',
    'MODULE_ATTACHED',
    'MODULE_DETACHED',
    'MODULE_UPGRADED',
    'MODULE_ACTIVATED',
    'ATTACHMENT_STARTED',
    'ATTACHMENT_COMPLETED',
    'RESOURCE_PRODUCED',
    'RESOURCE_CONSUMED',
    'RESOURCE_TRANSFERRED',
    'RESOURCE_SHORTAGE',
    'AUTOMATION_STARTED',
    'AUTOMATION_STOPPED',
    'STATUS_CHANGED',
    'ERROR_OCCURRED',
    'MISSION_STARTED',
    'MISSION_COMPLETED',
    'SUB_MODULE_CREATED',
    'SUB_MODULE_ACTIVATED',
    'TECH_UNLOCKED',
  ],
  run: async () => {
    return runBenchmarkWithImprovedMetrics(largeEventScenario);
  },
};

// Listener scaling test
const listenerScalingScenario: BenchmarkScenario = {
  name: 'Listener Scaling (1,000 events, 50 listeners, 5 event types)',
  eventCount: 1000,
  listenerCount: 50,
  eventTypes: [
    'MODULE_CREATED',
    'RESOURCE_PRODUCED',
    'AUTOMATION_STARTED',
    'STATUS_CHANGED',
    'ERROR_OCCURRED',
  ],
  run: async () => {
    return runBenchmarkWithImprovedMetrics(listenerScalingScenario);
  },
};

// History retrieval test
const historyRetrievalScenario: BenchmarkScenario = {
  name: 'History Retrieval (5,000 events in history, complex filtering)',
  eventCount: 5000,
  listenerCount: 1,
  eventTypes: [
    'MODULE_CREATED',
    'MODULE_ATTACHED',
    'MODULE_DETACHED',
    'RESOURCE_PRODUCED',
    'RESOURCE_CONSUMED',
    'AUTOMATION_STARTED',
    'MISSION_STARTED',
    'STATUS_CHANGED',
    'ERROR_OCCURRED',
    'SUB_MODULE_CREATED',
  ],
  run: async () => {
    return runBenchmarkWithImprovedMetrics(historyRetrievalScenario);
  },
};

// Define all benchmark scenarios
const scenarios: BenchmarkScenario[] = [
  smallEventScenario,
  mediumEventScenario,
  largeEventScenario,
  listenerScalingScenario,
  historyRetrievalScenario,
];

/**
 * Run all benchmark scenarios
 */
async function runAllBenchmarks() {
  const reporter = createPerformanceReporter();
  const results: Record<
    string,
    {
      emitTimeMs: number;
      retrievalTimeMs: number;
      memoryChangeMB?: number;
      listenersTriggered: number;
      eventsPerSecond: number;
    }
  > = {};

  for (const scenario of scenarios) {
    // Run the benchmark
    const result = await scenario.run();

    // Calculate events per second
    const eventsPerSecond =
      result.emitTimeMs > 0 ? Math.round((scenario.eventCount * 1000) / result.emitTimeMs) : 0;

    // Record results
    results[scenario.name] = {
      ...result,
      eventsPerSecond,
    };

    // Record in performance reporter
    reporter.record(`${scenario.name} - Emit`, result.emitTimeMs);
    reporter.record(`${scenario.name} - Retrieval`, result.retrievalTimeMs);
  }

  // Print the results table
  console.warn('\nEvent System Benchmark Results:');
  console.warn(
    '-----------------------------------------------------------------------------------'
  );
  console.warn(
    '| Scenario                            | Emit (ms) | Retrieval (ms) | Events/sec | Listeners |'
  );
  console.warn(
    '|-------------------------------------|-----------|----------------|------------|-----------|'
  );

  for (const [name, result] of Object.entries(results)) {
    console.warn(
      `| ${name.padEnd(35)} | ${result.emitTimeMs.toFixed(2).padStart(9)} | ${result.retrievalTimeMs.toFixed(2).padStart(14)} | ${result.eventsPerSecond.toString().padStart(10)} | ${result.listenersTriggered.toString().padStart(9)} |`
    );
  }

  console.warn(
    '-----------------------------------------------------------------------------------'
  );
  console.warn('\nMemory Usage:');
  console.warn('-----------------------------------------------------');
  console.warn('| Scenario                            | Memory (MB) |');
  console.warn('|-------------------------------------|-------------|');

  for (const [name, result] of Object.entries(results)) {
    console.warn(
      `| ${name.padEnd(35)} | ${result.memoryChangeMB ? result.memoryChangeMB.toFixed(2).padStart(11) : 'N/A'.padStart(11)} |`
    );
  }

  console.warn('-----------------------------------------------------');

  // Print the performance report
  reporter.printReport();

  return results;
}

// Create Vitest benchmark suite
describe('Event System Performance Benchmarks', () => {
  bench('Small Event Load', async () => {
    await smallEventScenario.run();
  });

  bench('Medium Event Load', async () => {
    await mediumEventScenario.run();
  });

  bench('Large Event Load', async () => {
    await largeEventScenario.run();
  });

  bench('Listener Scaling', async () => {
    await listenerScalingScenario.run();
  });

  bench('History Retrieval', async () => {
    await historyRetrievalScenario.run();
  });

  bench('All Benchmarks', async () => {
    await runAllBenchmarks();
  });
});

// Legacy export for compatibility with older test runners
export default {
  name: 'Event System Performance Benchmarks',
  async run() {
    await runAllBenchmarks();
  },
};
