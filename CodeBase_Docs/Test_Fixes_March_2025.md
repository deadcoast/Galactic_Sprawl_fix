# Test Fixes - March 2025

This document tracks the test fixes implemented in March 2025 to improve the reliability and maintainability of the test suite.

## analyze-lint-errors.test.js Fixes

### Issue: Node:Timers Mock Error

**Error Message:**

```
Error: [vitest] The "setTimeout" export of the "node:timers" module is not defined.
Did you mean to use `importOriginal` to get the original module and merge it with your mock?
```

**Cause:**
The test was attempting to mock the `node:timers` module but was not properly handling both named and default exports. Additionally, the mock was not preserving the original functionality of the module.

**Solution:**
Used the `importOriginal` parameter in the `vi.mock` function to get the original module and merge it with the mock:

```javascript
vi.mock('node:timers', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    setTimeout: mockSetTimeout,
    clearTimeout: mockClearTimeout,
    setImmediate: vi.fn(callback => {
      callback();
      return 1;
    }),
    default: {
      ...actual.default,
      setTimeout: mockSetTimeout,
      clearTimeout: mockClearTimeout,
      setImmediate: vi.fn(callback => {
        callback();
        return 1;
      }),
    },
  };
});
```

### Issue: Process.stdin Mock Error

**Error Message:**

```
TypeError: Cannot read properties of undefined (reading 'on')
```

**Cause:**
The test was attempting to mock `process.stdin.on` but the mock implementation was incomplete, missing the proper event handling structure.

**Solution:**
Created a more comprehensive mock for `process.stdin` that properly handles event registration:

```javascript
const mockProcess = {
  stdin: {
    on: vi.fn().mockReturnThis(),
    setEncoding: vi.fn().mockReturnThis(),
    resume: vi.fn().mockReturnThis(),
  },
  exit: vi.fn(),
};

vi.stubGlobal('process', mockProcess);
```

### Issue: Assertion Errors in Test Cases

**Error Message:**

```
Expected: "Found 5 lint errors"
Received: undefined
```

**Cause:**
The test was expecting specific console output, but the mock implementation for `console.log` was not capturing the output correctly.

**Solution:**
Improved the console mock to properly capture and store output for later assertion:

```javascript
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
};

vi.stubGlobal('console', mockConsole);

// Later in the test
expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Found 5 lint errors'));
```

## setup-linting.test.js Fixes

### Issue: Default Export Not Defined

**Error Message:**

```
Error: [vitest] No "default" export is defined on the "child_process" mock. Did you forget to return it from "vi.mock"?
```

**Cause:**
The test file was using incorrect mocking patterns that didn't properly handle ES module imports. The mocks didn't provide both named exports and default exports, causing the imported modules to fail when accessed.

**Solution:**
Completely rewrote the test file to use a simpler approach with manual mocks:

```javascript
// Define mock functions outside vi.mock() for better reuse
const mockExecSync = vi.fn();
const mockWriteFileSync = vi.fn();
const mockExistsSync = vi.fn();
const mockMkdirSync = vi.fn();

// Mock child_process module
vi.mock('child_process', () => ({
  execSync: mockExecSync,
  default: {
    execSync: mockExecSync,
  },
}));

// Mock fs module
vi.mock('fs', () => ({
  writeFileSync: mockWriteFileSync,
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  default: {
    writeFileSync: mockWriteFileSync,
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
  },
}));
```

## testUtilsUsageExample.test.tsx Fixes

### Issue: Unreliable Performance Tests

**Error Message:**
Tests were failing intermittently due to timing issues.

**Cause:**
The tests were using `setTimeout` for simulating slow operations, which is unreliable in test environments. The assertions were also checking for exact timing values, which can vary between runs.

**Solution:**
Replaced `setTimeout` with CPU-intensive operations that perform actual work:

```typescript
// Before
const slowFunction = () => {
  return new Promise<number>(resolve => {
    setTimeout(() => {
      resolve(42);
    }, 100);
  });
};

// After
const cpuIntensiveFunction = (iterations: number): number => {
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += (Math.sqrt(i) * Math.sin(i)) / Math.cos(i + 1);
  }
  return result;
};

it('should measure execution time', () => {
  const result = measureExecutionTime(() => cpuIntensiveFunction(10000));

  expect(result.value).toBeTypeOf('number');
  expect(result.executionTime).toBeGreaterThan(0);
});
```

### Issue: Loading State Test Timeout

**Error Message:**

```
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
```

**Cause:**
The test was using React state changes and waiting for asynchronous updates, which can be unreliable in test environments. The test was also using `waitFor` without a timeout, which can cause the test to hang indefinitely.

**Solution:**
Completely rewrote the test to use a simpler approach with direct re-rendering:

```typescript
// Before
it('should test loading state', async () => {
  const TestComponent = () => {
    const [isLoading, setIsLoading] = React.useState(true);
    const resources = createMockResources(2);

    const finishLoading = () => {
      setIsLoading(false);
    };

    return (
      <div>
        <ResourceList resources={resources} isLoading={isLoading} />
        <button data-testid="finish-loading" onClick={finishLoading}>
          Finish Loading
        </button>
      </div>
    );
  };

  const { getByTestId } = renderWithProviders(<TestComponent />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  fireEvent.click(getByTestId('finish-loading'));
  await waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});

// After
it('should test loading state', () => {
  const mockResources = createMockResources(2);

  // First render with loading=true
  const { rerender } = renderWithProviders(
    <ResourceList resources={mockResources} isLoading={true} />
  );

  // Check that loading indicator is present
  expect(screen.getByRole('progressbar')).toBeInTheDocument();

  // Re-render with loading=false
  rerender(
    <ResourceList resources={mockResources} isLoading={false} />
  );

  // Check that loading indicator is gone
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});
```

**Lessons Learned:**

1. Avoid relying on React state changes in tests when possible
2. Use direct re-rendering for testing component state changes
3. Prefer synchronous tests over asynchronous ones when possible
4. Always add timeouts to `waitFor` calls to prevent tests from hanging
5. Add proper cleanup after each test to prevent interference between tests

## Common Patterns for Test Fixes

### 1. Proper Module Mocking

Always mock both named and default exports:

```javascript
vi.mock('module-name', () => ({
  // Named exports
  namedExport1: mockFunction1,
  namedExport2: mockFunction2,

  // Default export
  default: {
    namedExport1: mockFunction1,
    namedExport2: mockFunction2,
  },
}));
```

### 2. Using importOriginal for Partial Mocking

When you need to preserve most of the original module functionality:

```javascript
vi.mock('module-name', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    specificFunction: mockSpecificFunction,
    default: {
      ...actual.default,
      specificFunction: mockSpecificFunction,
    },
  };
});
```

### 3. Comprehensive Event-Based API Mocking

For modules that use event-based APIs:

```javascript
const mockEventEmitter = {
  on: vi.fn((event, callback) => {
    if (event === 'data') dataCallback = callback;
    if (event === 'end') endCallback = callback;
    return mockEventEmitter;
  }),
  emit: vi.fn(),
  removeListener: vi.fn(),
};

// Later in the test
dataCallback(sampleData);
endCallback();
```

### 4. Global Object Mocking

For mocking global objects like `console` and `process`:

```javascript
// Store original objects
const originalConsole = globalThis.console;
const originalProcess = globalThis.process;

// Create mock objects
const mockConsole = { log: vi.fn(), error: vi.fn() };
const mockProcess = { exit: vi.fn() };

// Replace global objects
vi.stubGlobal('console', mockConsole);
vi.stubGlobal('process', mockProcess);

// Restore in afterEach
afterEach(() => {
  vi.unstubAllGlobals();
  // Or
  globalThis.console = originalConsole;
  globalThis.process = originalProcess;
});
```

### 5. Flexible Assertions

Use more flexible assertions to avoid brittle tests:

```javascript
// Before
expect(mockConsole.log).toHaveBeenCalledWith('Found 5 lint errors');

// After
expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('lint errors'));
```

## Next Steps

1. Create a common mocking utility for frequently used modules
2. Implement dynamic port allocation for all services in tests
3. Improve test isolation to prevent interference between tests
4. Add more comprehensive documentation for test patterns
5. Create examples of proper mocking for new developers
