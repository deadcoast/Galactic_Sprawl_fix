// src/tests/utils/index.ts

// Export from testUtils
export * from './testUtils';

// Export from fixtureUtils
export * from './fixtureUtils';

// Export from asyncTestUtils with renamed exports to avoid conflicts
import {
  createDeferredPromise,
  createMockEventEmitter,
  createMockRAF,
  createMockTimer,
  wait,
  waitForCondition as waitForConditionAsync,
} from './asyncTestUtils';

export {
  createDeferredPromise,
  createMockEventEmitter,
  createMockRAF,
  createMockTimer,
  wait,
  waitForConditionAsync,
};

// Export from performanceTestUtils with renamed exports to avoid conflicts
import {
  createPerformanceReporter as createPerfReporter,
  measureAsyncExecutionTime,
  measureAsyncMemoryUsage,
  measureExecutionTime as measureExecTime,
  measureMemoryUsage as measureMemory,
  runAsyncBenchmark,
  runBenchmark,
} from './performanceTestUtils';

export {
  createPerfReporter,
  measureAsyncExecutionTime,
  measureAsyncMemoryUsage,
  measureExecTime,
  measureMemory,
  runAsyncBenchmark,
  runBenchmark,
};

// Export from testPerformanceUtils
import {
  clearOperationCache,
  conditionalSetup,
  createLazyTestValue,
  executeTestsInParallel,
  measureMemoryUsage as measureTestMemoryUsage,
  mockExpensiveOperations,
  optimizeResourceIntensiveOperation,
  parallelDescribe,
  parallelSetup,
} from './testPerformanceUtils';

export {
  clearOperationCache,
  conditionalSetup,
  createLazyTestValue,
  executeTestsInParallel,
  measureTestMemoryUsage,
  mockExpensiveOperations,
  optimizeResourceIntensiveOperation,
  parallelDescribe,
  parallelSetup,
};

// Export from mockUtils
export {
  createAutomationManagerMock,
  createMockClass,
  createMockComponent,
  createMockContextProvider,
  createMockHook,
  createModuleEventBusMock,
  createModuleEventsMock,
  createModuleManagerMock,
  createResourceManagerMock,
  mockESModule,
  mockModuleWithExports,
  restoreAllMocks,
} from './mockUtils';

// Re-export fixtures for convenience
export * from '../fixtures';
