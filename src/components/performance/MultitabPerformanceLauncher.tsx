/**
 * MultitabPerformanceLauncher Component
 *
 * A React component that provides a UI for launching and configuring multi-tab
 * performance tests. This includes controls for:
 * - Launching individual test types
 * - Running a comprehensive test battery
 * - Configuring test parameters
 * - Viewing test results
 */

import * as React from "react";
import { useEffect, useState } from 'react';
import {
  DOMOperationTestOptions,
  MemoryUsageTestOptions,
  MultitabPerformanceResult,
  MultitabPerformanceTest,
  ResourceContentionTestOptions,
  UIResponsivenessTestOptions,
} from '../../tests/performance/MultitabPerformanceTestSuite';

/**
 * Props for the MultitabPerformanceLauncher component
 */
interface MultitabPerformanceLauncherProps {
  /** Whether this instance is the coordinator tab */
  isCoordinator?: boolean;

  /** Called when test results are available */
  onTestResults?: (
    results: MultitabPerformanceResult[] | Record<string, MultitabPerformanceResult[]>
  ) => void;
}

/**
 * Component for launching multi-tab performance tests
 */
const MultitabPerformanceLauncher: React.FC<MultitabPerformanceLauncherProps> = ({
  isCoordinator = false,
  onTestResults,
}) => {
  // Performance test controller
  const [perfTest, setPerfTest] = useState<MultitabPerformanceTest | null>(null);

  // Test state
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [activeTabCount, setActiveTabCount] = useState(1);
  const [testType, setTestType] = useState<
    'resourceContention' | 'uiResponsiveness' | 'domOperations' | 'memoryUsage' | 'battery'
  >('resourceContention');

  // Test options
  const [resourceOptions, setResourceOptions] = useState<ResourceContentionTestOptions>({
    resourceCount: 20,
    operationsPerSecond: 50,
    durationMs: 10000,
  });

  const [uiOptions, setUiOptions] = useState<UIResponsivenessTestOptions>({
    interactionCount: 100,
    interactionTypes: ['click', 'scroll'],
    interactionDelayMs: 100,
    durationMs: 10000,
  });

  const [domOptions, setDomOptions] = useState<DOMOperationTestOptions>({
    elementCount: 500,
    updateFrequency: 10,
    durationMs: 10000,
  });

  const [memoryOptions, setMemoryOptions] = useState<MemoryUsageTestOptions>({
    durationMs: 20000,
    samplingIntervalMs: 1000,
    attemptGC: false,
  });

  // Load/unload the performance tester
  useEffect(() => {
    // Create and activate performance test
    const test = new MultitabPerformanceTest(isCoordinator);
    test.activate();
    setPerfTest(test);

    // Update active tab count periodically
    const interval = setInterval(() => {
      if (test) {
        setActiveTabCount(test.getTabCount());
      }
    }, 1000);

    // Clean up on unmount
    return () => {
      clearInterval(interval);
      if (test) {
        test.deactivate();
      }
    };
  }, [isCoordinator]);

  /**
   * Launch a test based on the selected options
   */
  const launchTest = async () => {
    if (!perfTest || !perfTest.isCoordinator() || isRunningTest) {
      return;
    }

    setIsRunningTest(true);

    try {
      let results;

      switch (testType) {
        case 'resourceContention':
          results = await perfTest.runResourceContentionTest(resourceOptions);
          break;

        case 'uiResponsiveness':
          results = await perfTest.runUIResponsivenessTest(uiOptions);
          break;

        case 'domOperations':
          results = await perfTest.runDOMOperationsTest(domOptions);
          break;

        case 'memoryUsage':
          results = await perfTest.runMemoryUsageTest(memoryOptions);
          break;

        case 'battery':
          results = await perfTest.runTestBattery();
          break;
      }

      if (results && onTestResults) {
        onTestResults(results);
      }
    } catch (error) {
      console.error('Error running test:', error);
    } finally {
      setIsRunningTest(false);
    }
  };

  /**
   * Open a new tab for testing
   */
  const openNewTab = () => {
    // Get current URL but add a parameter to make the new tab a worker
    const url = new URL(window.location.href);
    url.searchParams.set('worker', 'true');
    window.open(url.toString(), '_blank');
  };

  /**
   * Render test options based on the selected test type
   */
  const renderTestOptions = () => {
    switch (testType) {
      case 'resourceContention':
        return (
          <div className="test-options">
            <h3>Resource Contention Test Options</h3>

            <div className="option-group">
              <label>Resource Count:</label>
              <input
                type="number"
                value={resourceOptions.resourceCount}
                onChange={e =>
                  setResourceOptions({
                    ...resourceOptions,
                    resourceCount: Number(e.target.value),
                  })
                }
                min="5"
                max="100"
              />
            </div>

            <div className="option-group">
              <label>Operations Per Second:</label>
              <input
                type="number"
                value={resourceOptions.operationsPerSecond}
                onChange={e =>
                  setResourceOptions({
                    ...resourceOptions,
                    operationsPerSecond: Number(e.target.value),
                  })
                }
                min="10"
                max="200"
              />
            </div>

            <div className="option-group">
              <label>Duration (ms):</label>
              <input
                type="number"
                value={resourceOptions.durationMs}
                onChange={e =>
                  setResourceOptions({
                    ...resourceOptions,
                    durationMs: Number(e.target.value),
                  })
                }
                min="5000"
                max="60000"
                step="1000"
              />
            </div>
          </div>
        );

      case 'uiResponsiveness':
        return (
          <div className="test-options">
            <h3>UI Responsiveness Test Options</h3>

            <div className="option-group">
              <label>Interaction Count:</label>
              <input
                type="number"
                value={uiOptions.interactionCount}
                onChange={e =>
                  setUiOptions({
                    ...uiOptions,
                    interactionCount: Number(e.target.value),
                  })
                }
                min="20"
                max="500"
              />
            </div>

            <div className="option-group">
              <label>Interaction Types:</label>
              <div className="checkbox-group">
                {(['click', 'scroll', 'drag', 'type'] as const).map(type => (
                  <label key={type}>
                    <input
                      type="checkbox"
                      checked={uiOptions.interactionTypes?.includes(type) || false}
                      onChange={e => {
                        if (e.target.checked) {
                          setUiOptions({
                            ...uiOptions,
                            interactionTypes: [...(uiOptions.interactionTypes || []), type],
                          });
                        } else {
                          setUiOptions({
                            ...uiOptions,
                            interactionTypes: uiOptions.interactionTypes?.filter(t => t !== type),
                          });
                        }
                      }}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div className="option-group">
              <label>Interaction Delay (ms):</label>
              <input
                type="number"
                value={uiOptions.interactionDelayMs}
                onChange={e =>
                  setUiOptions({
                    ...uiOptions,
                    interactionDelayMs: Number(e.target.value),
                  })
                }
                min="0"
                max="1000"
              />
            </div>

            <div className="option-group">
              <label>Duration (ms):</label>
              <input
                type="number"
                value={uiOptions.durationMs}
                onChange={e =>
                  setUiOptions({
                    ...uiOptions,
                    durationMs: Number(e.target.value),
                  })
                }
                min="5000"
                max="60000"
                step="1000"
              />
            </div>
          </div>
        );

      case 'domOperations':
        return (
          <div className="test-options">
            <h3>DOM Operations Test Options</h3>

            <div className="option-group">
              <label>Element Count:</label>
              <input
                type="number"
                value={domOptions.elementCount}
                onChange={e =>
                  setDomOptions({
                    ...domOptions,
                    elementCount: Number(e.target.value),
                  })
                }
                min="100"
                max="2000"
              />
            </div>

            <div className="option-group">
              <label>Update Frequency (per sec):</label>
              <input
                type="number"
                value={domOptions.updateFrequency}
                onChange={e =>
                  setDomOptions({
                    ...domOptions,
                    updateFrequency: Number(e.target.value),
                  })
                }
                min="1"
                max="60"
              />
            </div>

            <div className="option-group">
              <label>Duration (ms):</label>
              <input
                type="number"
                value={domOptions.durationMs}
                onChange={e =>
                  setDomOptions({
                    ...domOptions,
                    durationMs: Number(e.target.value),
                  })
                }
                min="5000"
                max="60000"
                step="1000"
              />
            </div>
          </div>
        );

      case 'memoryUsage':
        return (
          <div className="test-options">
            <h3>Memory Usage Test Options</h3>

            <div className="option-group">
              <label>Sampling Interval (ms):</label>
              <input
                type="number"
                value={memoryOptions.samplingIntervalMs}
                onChange={e =>
                  setMemoryOptions({
                    ...memoryOptions,
                    samplingIntervalMs: Number(e.target.value),
                  })
                }
                min="100"
                max="5000"
              />
            </div>

            <div className="option-group">
              <label>Attempt Garbage Collection:</label>
              <input
                type="checkbox"
                checked={memoryOptions.attemptGC}
                onChange={e =>
                  setMemoryOptions({
                    ...memoryOptions,
                    attemptGC: e.target.checked,
                  })
                }
              />
            </div>

            <div className="option-group">
              <label>Duration (ms):</label>
              <input
                type="number"
                value={memoryOptions.durationMs}
                onChange={e =>
                  setMemoryOptions({
                    ...memoryOptions,
                    durationMs: Number(e.target.value),
                  })
                }
                min="5000"
                max="120000"
                step="1000"
              />
            </div>
          </div>
        );

      case 'battery':
        return (
          <div className="test-options">
            <h3>Test Battery Options</h3>
            <p>
              The test battery will run all tests in sequence with predefined durations. This may
              take several minutes to complete.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  // Show simplified UI for worker tabs
  if (perfTest && !perfTest.isCoordinator()) {
    return (
      <div className="multitab-performance-worker">
        <h2>Multi-Tab Performance Test Worker</h2>
        <p>
          This tab is participating in multi-tab performance testing. Please leave this tab open and
          return to the coordinator tab to configure and run tests.
        </p>
        <div className="status">
          <div className="status-item">
            <span className="status-label">Status:</span>
            <span className="status-value">{isRunningTest ? 'Testing' : 'Idle'}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Connected Tabs:</span>
            <span className="status-value">{activeTabCount}</span>
          </div>
        </div>
      </div>
    );
  }

  // Main UI for coordinator tab
  return (
    <div className="multitab-performance-launcher">
      <h2>Multi-Tab Performance Testing</h2>

      <div className="tab-controls">
        <div className="tabs-status">
          <span className="status-label">Connected Tabs:</span>
          <span className="status-value">{activeTabCount}</span>
          <button className="add-tab-button" onClick={openNewTab} disabled={isRunningTest}>
            Add Tab
          </button>
        </div>

        <div className="instruction">
          <p>
            You need at least 2 tabs to run multi-tab performance tests. Click "Add Tab" to open new
            worker tabs, then select a test to run.
          </p>
        </div>
      </div>

      <div className="test-selection">
        <h3>Select Test Type</h3>
        <div className="test-types">
          <label>
            <input
              type="radio"
              name="testType"
              value="resourceContention"
              checked={testType === 'resourceContention'}
              onChange={() => setTestType('resourceContention')}
              disabled={isRunningTest}
            />
            Resource Contention
          </label>

          <label>
            <input
              type="radio"
              name="testType"
              value="uiResponsiveness"
              checked={testType === 'uiResponsiveness'}
              onChange={() => setTestType('uiResponsiveness')}
              disabled={isRunningTest}
            />
            UI Responsiveness
          </label>

          <label>
            <input
              type="radio"
              name="testType"
              value="domOperations"
              checked={testType === 'domOperations'}
              onChange={() => setTestType('domOperations')}
              disabled={isRunningTest}
            />
            DOM Operations
          </label>

          <label>
            <input
              type="radio"
              name="testType"
              value="memoryUsage"
              checked={testType === 'memoryUsage'}
              onChange={() => setTestType('memoryUsage')}
              disabled={isRunningTest}
            />
            Memory Usage
          </label>

          <label>
            <input
              type="radio"
              name="testType"
              value="battery"
              checked={testType === 'battery'}
              onChange={() => setTestType('battery')}
              disabled={isRunningTest}
            />
            Test Battery
          </label>
        </div>
      </div>

      {renderTestOptions()}

      <div className="test-controls">
        <button
          className="run-test-button"
          onClick={launchTest}
          disabled={isRunningTest || activeTabCount < 2}
        >
          {isRunningTest ? 'Running Test...' : 'Run Test'}
        </button>
      </div>

      <style jsx>{`
        .multitab-performance-launcher {
          background: #f5f5f5;
          border-radius: 8px;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        h2 {
          margin-top: 0;
          color: #333;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
        }

        .tab-controls {
          display: flex;
          flex-direction: column;
          margin-bottom: 20px;
        }

        .tabs-status {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }

        .status-label {
          font-weight: bold;
          margin-right: 10px;
        }

        .status-value {
          font-size: 1.2em;
          margin-right: 20px;
        }

        .add-tab-button {
          background: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
        }

        .add-tab-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .instruction {
          background: #fff;
          border-left: 4px solid #4285f4;
          padding: 10px 15px;
          margin-bottom: 15px;
        }

        .test-selection {
          margin-bottom: 20px;
        }

        .test-types {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 10px;
        }

        .test-types label {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .test-types input[type='radio'] {
          margin-right: 8px;
        }

        .test-options {
          background: #fff;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .option-group {
          margin-bottom: 15px;
        }

        .option-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        .option-group input[type='number'] {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          font-weight: normal;
        }

        .checkbox-group input[type='checkbox'] {
          margin-right: 5px;
        }

        .test-controls {
          display: flex;
          justify-content: center;
        }

        .run-test-button {
          background: #34a853;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
        }

        .run-test-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .multitab-performance-worker {
          background: #f5f5f5;
          border-radius: 8px;
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }

        .multitab-performance-worker .status {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 20px;
        }

        .multitab-performance-worker .status-item {
          background: #fff;
          padding: 10px 15px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default MultitabPerformanceLauncher;
