import { ModuleEvent, ModuleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import {
  createPerformanceReporter,
  measureExecutionTime,
  measureMemoryUsage,
} from '../utils/testUtils';

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
 * Run a single benchmark scenario
 */
async function runBenchmark(scenario: BenchmarkScenario): Promise<{
  emitTimeMs: number;
  retrievalTimeMs: number;
  memoryChangeMB?: number;
  listenersTriggered: number;
}> {
  console.warn(`Running benchmark: ${scenario.name}`);
  return scenario.run();
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
    // Create a new event bus for this test
    const eventBus = new ModuleEventBus(1000);
    let listenersTriggered = 0;

    // Add listeners
    const unsubscribers = [];
    for (let i = 0; i < smallEventScenario.listenerCount; i++) {
      // Each listener listens to all event types
      for (const type of smallEventScenario.eventTypes) {
        const unsubscribe = eventBus.subscribe(type, () => {
          listenersTriggered++;
        });
        unsubscribers.push(unsubscribe);
      }
    }

    // Create random events
    const events = createRandomEvents(smallEventScenario.eventCount, smallEventScenario.eventTypes);

    // Measure emission time
    const emitResult = await measureExecutionTime(async () => {
      // Emit all events
      events.forEach(event => eventBus.emit(event));
    });

    // Measure history retrieval time
    const retrievalResult = await measureExecutionTime(() => {
      // Retrieve history in different ways
      eventBus.getHistory();
      eventBus.getModuleHistory('module-1');
      eventBus.getEventTypeHistory('MODULE_CREATED');
    });

    // Measure memory usage
    const memoryResult = await measureMemoryUsage(async () => {
      // Do nothing - just to measure baseline memory
    });

    // Clean up
    unsubscribers.forEach(unsubscribe => unsubscribe());

    return {
      emitTimeMs: emitResult.executionTimeMs,
      retrievalTimeMs: retrievalResult.executionTimeMs,
      memoryChangeMB: memoryResult.memoryChangeMB,
      listenersTriggered,
    };
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
    // Create a new event bus for this test
    const eventBus = new ModuleEventBus(2000);
    let listenersTriggered = 0;

    // Add listeners
    const unsubscribers = [];
    for (let i = 0; i < mediumEventScenario.listenerCount; i++) {
      // Each listener listens to all event types
      for (const type of mediumEventScenario.eventTypes) {
        const unsubscribe = eventBus.subscribe(type, () => {
          listenersTriggered++;
        });
        unsubscribers.push(unsubscribe);
      }
    }

    // Create random events
    const events = createRandomEvents(
      mediumEventScenario.eventCount,
      mediumEventScenario.eventTypes
    );

    // Measure emission time
    const emitResult = await measureExecutionTime(async () => {
      // Emit all events
      events.forEach(event => eventBus.emit(event));
    });

    // Measure history retrieval time
    const retrievalResult = await measureExecutionTime(() => {
      // Retrieve history in different ways
      eventBus.getHistory();
      eventBus.getModuleHistory('module-1');
      eventBus.getEventTypeHistory('MODULE_CREATED');
    });

    // Measure memory usage
    const memoryResult = await measureMemoryUsage(async () => {
      // Do nothing - just to measure baseline memory
    });

    // Clean up
    unsubscribers.forEach(unsubscribe => unsubscribe());

    return {
      emitTimeMs: emitResult.executionTimeMs,
      retrievalTimeMs: retrievalResult.executionTimeMs,
      memoryChangeMB: memoryResult.memoryChangeMB,
      listenersTriggered,
    };
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
    // Create a new event bus for this test
    const eventBus = new ModuleEventBus(20000);
    let listenersTriggered = 0;

    // Add listeners
    const unsubscribers = [];
    for (let i = 0; i < largeEventScenario.listenerCount; i++) {
      // Each listener listens to all event types
      for (const type of largeEventScenario.eventTypes) {
        const unsubscribe = eventBus.subscribe(type, () => {
          listenersTriggered++;
        });
        unsubscribers.push(unsubscribe);
      }
    }

    // Create random events
    const events = createRandomEvents(largeEventScenario.eventCount, largeEventScenario.eventTypes);

    // Measure emission time
    const emitResult = await measureExecutionTime(async () => {
      // Emit all events
      events.forEach(event => eventBus.emit(event));
    });

    // Measure history retrieval time
    const retrievalResult = await measureExecutionTime(() => {
      // Retrieve history in different ways
      eventBus.getHistory();
      eventBus.getModuleHistory('module-1');
      eventBus.getEventTypeHistory('MODULE_CREATED');
    });

    // Measure memory usage
    const memoryResult = await measureMemoryUsage(async () => {
      // Do nothing - just to measure baseline memory
    });

    // Clean up
    unsubscribers.forEach(unsubscribe => unsubscribe());

    return {
      emitTimeMs: emitResult.executionTimeMs,
      retrievalTimeMs: retrievalResult.executionTimeMs,
      memoryChangeMB: memoryResult.memoryChangeMB,
      listenersTriggered,
    };
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
    // Create a new event bus for this test
    const eventBus = new ModuleEventBus(2000);
    let listenersTriggered = 0;

    // Add listeners
    const unsubscribers = [];
    for (let i = 0; i < listenerScalingScenario.listenerCount; i++) {
      // Each listener listens to all event types
      for (const type of listenerScalingScenario.eventTypes) {
        const unsubscribe = eventBus.subscribe(type, () => {
          listenersTriggered++;
        });
        unsubscribers.push(unsubscribe);
      }
    }

    // Create random events
    const events = createRandomEvents(
      listenerScalingScenario.eventCount,
      listenerScalingScenario.eventTypes
    );

    // Measure emission time
    const emitResult = await measureExecutionTime(async () => {
      // Emit all events
      events.forEach(event => eventBus.emit(event));
    });

    // Measure history retrieval time
    const retrievalResult = await measureExecutionTime(() => {
      // Retrieve history in different ways
      eventBus.getHistory();
      eventBus.getModuleHistory('module-1');
      eventBus.getEventTypeHistory('MODULE_CREATED');
    });

    // Measure memory usage
    const memoryResult = await measureMemoryUsage(async () => {
      // Do nothing - just to measure baseline memory
    });

    // Clean up
    unsubscribers.forEach(unsubscribe => unsubscribe());

    return {
      emitTimeMs: emitResult.executionTimeMs,
      retrievalTimeMs: retrievalResult.executionTimeMs,
      memoryChangeMB: memoryResult.memoryChangeMB,
      listenersTriggered,
    };
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
    // Create a new event bus for this test
    const eventBus = new ModuleEventBus(10000);
    let listenersTriggered = 0;

    // Add a single listener for each type just to track
    const unsubscribers = [];
    for (const type of historyRetrievalScenario.eventTypes) {
      const unsubscribe = eventBus.subscribe(type, () => {
        listenersTriggered++;
      });
      unsubscribers.push(unsubscribe);
    }

    // Create random events with specified module IDs for testing filtering
    const events: ModuleEvent[] = [];
    for (let i = 0; i < historyRetrievalScenario.eventCount; i++) {
      const typeIndex = Math.floor(Math.random() * historyRetrievalScenario.eventTypes.length);
      const moduleId = `module-${Math.floor(i / 100)}`; // Group events by module in batches of 100

      events.push({
        type: historyRetrievalScenario.eventTypes[typeIndex],
        moduleId,
        moduleType: 'production' as ModuleType,
        timestamp: Date.now() + i,
        data: {
          value: Math.random() * 100,
          metadata: `Event ${i} metadata`,
        },
      });
    }

    // Fill the history
    events.forEach(event => eventBus.emit(event));

    // Measure complex history retrieval operations
    const retrievalResult = await measureExecutionTime(() => {
      // Get all history
      const fullHistory = eventBus.getHistory();

      // Get history for all modules (0-49)
      for (let i = 0; i < 50; i++) {
        eventBus.getModuleHistory(`module-${i}`);
      }

      // Get history for all event types
      for (const type of historyRetrievalScenario.eventTypes) {
        eventBus.getEventTypeHistory(type);
      }

      // Perform a complex filtering operation (would be implemented in EventDispatcher)
      const filtered = fullHistory.filter(event => {
        const moduleIdNum = parseInt(event.moduleId.split('-')[1]);
        return (
          moduleIdNum % 2 === 0 &&
          ['MODULE_CREATED', 'RESOURCE_PRODUCED'].includes(event.type) &&
          event.timestamp > Date.now() - 1000
        );
      });
    });

    // Measure memory usage
    const memoryResult = await measureMemoryUsage(async () => {
      // Do nothing - just to measure baseline memory
    });

    // Clean up
    unsubscribers.forEach(unsubscribe => unsubscribe());

    return {
      // The emit time for this test is less relevant as we're focusing on retrieval
      emitTimeMs: 0,
      retrievalTimeMs: retrievalResult.executionTimeMs,
      memoryChangeMB: memoryResult.memoryChangeMB,
      listenersTriggered,
    };
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
    const result = await runBenchmark(scenario);

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
}

/**
 * Export as a benchmark that can be run with Vitest bench
 */
export default {
  name: 'Event System Performance Benchmarks',
  async run() {
    await runAllBenchmarks();
  },
};
