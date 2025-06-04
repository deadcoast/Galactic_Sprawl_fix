/**
 * LongSessionMemoryPage
 *
 * A page component that brings together the Long Session Memory Tracker,
 * Test Suite, and Visualizer to provide a complete solution for
 * tracking memory usage over extended sessions.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import LongSessionMemoryVisualizer from '../../components/performance/LongSessionMemoryVisualizer';
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../services/logging/ErrorLoggingService';
import {
  LongSessionMemoryResult,
  LongSessionMemoryTestSuite,
} from '../../tests/performance/LongSessionMemoryTestSuite';
import {
  LongSessionMemoryTracker,
  MemoryTrendAnalysis,
} from '../../utils/performance/longsession/LongSessionMemoryTracker';

/**
 * LongSessionMemoryPage component
 */
const LongSessionMemoryPage: React.FC = () => {
  // State for the memory tracker and test suite
  const [memoryTracker, setMemoryTracker] = useState<LongSessionMemoryTracker | null>(null);
  const [testSuite, setTestSuite] = useState<LongSessionMemoryTestSuite | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [testResults, setTestResults] = useState<LongSessionMemoryResult | null>(null);
  const [testBatteryResults, setTestBatteryResults] = useState<Record<
    string,
    LongSessionMemoryResult
  > | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [selectedTest, setSelectedTest] = useState<'manual' | 'leak' | 'battery'>('manual');
  const [leakRate, setLeakRate] = useState<number>(1);
  const [testDuration, setTestDuration] = useState<number>(60);
  const [snapshotInterval, setSnapshotInterval] = useState<number>(5);
  const [leakThreshold, setLeakThreshold] = useState<number>(0.5);
  const [activeTab, setActiveTab] = useState<'tracking' | 'testing' | 'results'>('tracking');
  const [report, setReport] = useState<string>('');
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // Initialize memory tracker and test suite
  useEffect(() => {
    const tracker = new LongSessionMemoryTracker({
      snapshotIntervalMs: snapshotInterval * 1000,
      leakThresholdMBPerMinute: leakThreshold,
      onLeakDetected: handleLeakDetected,
    });

    setMemoryTracker(tracker);

    const suite = new LongSessionMemoryTestSuite({
      snapshotIntervalMs: snapshotInterval * 1000,
      leakThresholdMBPerMinute: leakThreshold,
      durationMs: testDuration * 1000,
    });

    setTestSuite(suite);

    return () => {
      // Clean up
      if (isTracking) {
        tracker.stopTracking();
      }
    };
  }, []);

  /**
   * Handle starting memory tracking
   */
  const handleStartTracking = () => {
    if (!memoryTracker) {
      return;
    }

    // Update tracker settings before starting
    memoryTracker.clearData();
    memoryTracker.startTracking();
    setIsTracking(true);

    // Show notification
    showNotification('Memory tracking started');
  };

  /**
   * Handle stopping memory tracking
   */
  const handleStopTracking = () => {
    if (!memoryTracker) {
      return;
    }

    memoryTracker.stopTracking();
    setIsTracking(false);

    // Show notification
    showNotification('Memory tracking stopped');
  };

  /**
   * Handle running a memory test
   */
  const handleRunTest = async () => {
    if (!testSuite) {
      return;
    }

    setIsRunningTest(true);

    try {
      let result: LongSessionMemoryResult | Record<string, LongSessionMemoryResult>;

      if (selectedTest === 'leak') {
        // Run leak detection test
        result = await testSuite.runMemoryLeakDetectionTest(leakRate, testDuration * 1000);
        setTestResults(result as LongSessionMemoryResult);
        setTestBatteryResults(null);

        // Generate report
        const testReport = LongSessionMemoryTestSuite.generateReport(result);
        setReport(testReport);

        showNotification('Leak detection test completed');
      } else if (selectedTest === 'battery') {
        // Run test battery
        result = await testSuite.runTestBattery();
        setTestBatteryResults(result as Record<string, LongSessionMemoryResult>);
        setTestResults(null);

        // Generate report
        const testReport = LongSessionMemoryTestSuite.generateReport(result);
        setReport(testReport);

        showNotification('Test battery completed');
      } else {
        // Run manual test
        result = await testSuite.runTest();
        setTestResults(result as LongSessionMemoryResult);
        setTestBatteryResults(null);

        // Generate report
        const testReport = LongSessionMemoryTestSuite.generateReport(result);
        setReport(testReport);

        showNotification('Memory test completed');
      }

      // Switch to results tab
      setActiveTab('results');
    } catch (error) {
      errorLoggingService.logError(
        error instanceof Error ? error : new Error('Error running memory test'),
        ErrorType.RUNTIME,
        ErrorSeverity.HIGH,
        { componentName: 'LongSessionMemoryPage', action: 'handleRunTest', testType: selectedTest }
      );
      showNotification('Error running test');
    } finally {
      setIsRunningTest(false);
    }
  };

  /**
   * Handle leak detection from the memory tracker
   */
  const handleLeakDetected = (analysis: MemoryTrendAnalysis) => {
    const severity = analysis.leakSeverity ?? 0;
    const rate = analysis.growthRatePerMinute.toFixed(2);

    showNotification(`Memory leak detected! Growth rate: ${rate} MB/min, Severity: ${severity}/5`);
  };

  /**
   * Show a notification message
   */
  const showNotification = (message: string) => {
    setNotificationMessage(message);

    // Clear notification after 5 seconds
    setTimeout(() => {
      setNotificationMessage(null);
    }, 5000);
  };

  /**
   * Download the test report
   */
  const downloadReport = () => {
    if (!report) {
      return;
    }

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory_test_report_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('Report downloaded');
  };

  return (
    <div className="long-session-memory-page">
      {/* Navigation tabs */}
      <div className="memory-page-tabs">
        <button
          className={activeTab === 'tracking' ? 'active' : ''}
          onClick={() => setActiveTab('tracking')}
        >
          Memory Tracking
        </button>
        <button
          className={activeTab === 'testing' ? 'active' : ''}
          onClick={() => setActiveTab('testing')}
        >
          Test Suite
        </button>
        <button
          className={activeTab === 'results' ? 'active' : ''}
          onClick={() => setActiveTab('results')}
          disabled={!testResults && !testBatteryResults}
        >
          Test Results
        </button>
      </div>

      {/* Notification message */}
      {notificationMessage && <div className="notification">{notificationMessage}</div>}

      {/* Tab content */}
      <div className="tab-content">
        {/* Memory Tracking tab */}
        {activeTab === 'tracking' && (
          <div className="tracking-tab">
            <div className="tracking-controls">
              <h2>Long Session Memory Tracking</h2>
              <p>
                Track memory usage over extended application sessions to detect memory leaks and
                gradual performance degradation.
              </p>

              <div className="control-group">
                <label>
                  Snapshot Interval (seconds):
                  <input
                    type="number"
                    value={snapshotInterval}
                    onChange={e => setSnapshotInterval(Math.max(1, parseInt(e.target.value) || 5))}
                    min="1"
                    max="300"
                    disabled={isTracking}
                  />
                </label>

                <label>
                  Leak Threshold (MB/min):
                  <input
                    type="number"
                    value={leakThreshold}
                    onChange={e =>
                      setLeakThreshold(Math.max(0.1, parseFloat(e.target.value) ?? 0.5))
                    }
                    min="0.1"
                    step="0.1"
                    disabled={isTracking}
                  />
                </label>
              </div>

              <div className="control-buttons">
                {!isTracking ? (
                  <button className="start-button" onClick={handleStartTracking}>
                    Start Tracking
                  </button>
                ) : (
                  <button className="stop-button" onClick={handleStopTracking}>
                    Stop Tracking
                  </button>
                )}

                <button
                  className="clear-button"
                  onClick={() => {
                    if (memoryTracker) {
                      memoryTracker.clearData();
                      showNotification('Data cleared');
                    }
                  }}
                  disabled={isTracking}
                >
                  Clear Data
                </button>
              </div>
            </div>

            <div className="visualizer-container">
              {memoryTracker && (
                <LongSessionMemoryVisualizer
                  memoryTracker={memoryTracker}
                  autoUpdate={isTracking}
                  showDetailedMetrics={true}
                  showLeakDetection={true}
                  showSessionMarkers={true}
                  onLeakDetected={handleLeakDetected}
                />
              )}
            </div>
          </div>
        )}

        {/* Test Suite tab */}
        {activeTab === 'testing' && (
          <div className="testing-tab">
            <h2>Memory Leak Detection Tests</h2>
            <p>
              Run controlled tests to verify memory leak detection capabilities and measure
              application performance over time.
            </p>

            <div className="test-selection">
              <h3>Test Type</h3>
              <div className="test-types">
                <label>
                  <input
                    type="radio"
                    name="testType"
                    value="manual"
                    checked={selectedTest === 'manual'}
                    onChange={() => setSelectedTest('manual')}
                    disabled={isRunningTest}
                  />
                  Manual Test
                </label>

                <label>
                  <input
                    type="radio"
                    name="testType"
                    value="leak"
                    checked={selectedTest === 'leak'}
                    onChange={() => setSelectedTest('leak')}
                    disabled={isRunningTest}
                  />
                  Leak Detection Test
                </label>

                <label>
                  <input
                    type="radio"
                    name="testType"
                    value="battery"
                    checked={selectedTest === 'battery'}
                    onChange={() => setSelectedTest('battery')}
                    disabled={isRunningTest}
                  />
                  Test Battery
                </label>
              </div>
            </div>

            <div className="test-options">
              <h3>Test Options</h3>

              {selectedTest === 'leak' && (
                <div className="control-group">
                  <label>
                    Leak Rate (MB/min):
                    <input
                      type="number"
                      value={leakRate}
                      onChange={e => setLeakRate(Math.max(0.1, parseFloat(e.target.value) || 1))}
                      min="0.1"
                      step="0.1"
                      disabled={isRunningTest}
                    />
                  </label>
                </div>
              )}

              {selectedTest !== 'battery' && (
                <div className="control-group">
                  <label>
                    Test Duration (seconds):
                    <input
                      type="number"
                      value={testDuration}
                      onChange={e => setTestDuration(Math.max(10, parseInt(e.target.value) || 60))}
                      min="10"
                      max="3600"
                      disabled={isRunningTest}
                    />
                  </label>

                  <label>
                    Snapshot Interval (seconds):
                    <input
                      type="number"
                      value={snapshotInterval}
                      onChange={e =>
                        setSnapshotInterval(Math.max(1, parseInt(e.target.value) || 5))
                      }
                      min="1"
                      max="60"
                      disabled={isRunningTest}
                    />
                  </label>
                </div>
              )}

              {selectedTest === 'battery' && (
                <p className="battery-info">
                  Test battery runs a series of tests with different configurations to thoroughly
                  evaluate memory behavior. This may take several minutes to complete.
                </p>
              )}
            </div>

            <div className="test-controls">
              <button className="run-test-button" onClick={handleRunTest} disabled={isRunningTest}>
                {isRunningTest ? 'Running Test...' : 'Run Test'}
              </button>
            </div>
          </div>
        )}

        {/* Results tab */}
        {activeTab === 'results' && (
          <div className="results-tab">
            <div className="results-header">
              <h2>Test Results</h2>

              {(testResults || testBatteryResults) && (
                <button className="download-button" onClick={downloadReport}>
                  Download Report
                </button>
              )}
            </div>

            {testResults && (
              <div className="test-result-container">
                <LongSessionMemoryVisualizer
                  snapshots={testResults.snapshots}
                  analysis={testResults.analysis}
                  autoUpdate={false}
                  showDetailedMetrics={true}
                  showLeakDetection={true}
                  showSessionMarkers={true}
                />

                <div className="result-summary">
                  <h3>Test Summary</h3>
                  <div className="summary-stats">
                    <div className="stat">
                      <span className="stat-label">Duration:</span>
                      <span className="stat-value">
                        {(testResults.durationMs / 1000).toFixed(1)} seconds
                      </span>
                    </div>

                    <div className="stat">
                      <span className="stat-label">Initial Memory:</span>
                      <span className="stat-value">
                        {testResults.initialMemoryMB.toFixed(2)} MB
                      </span>
                    </div>

                    <div className="stat">
                      <span className="stat-label">Final Memory:</span>
                      <span className="stat-value">{testResults.finalMemoryMB.toFixed(2)} MB</span>
                    </div>

                    <div className="stat">
                      <span className="stat-label">Memory Change:</span>
                      <span className="stat-value">
                        {(testResults.finalMemoryMB - testResults.initialMemoryMB).toFixed(2)} MB
                      </span>
                    </div>

                    <div className="stat">
                      <span className="stat-label">Growth Rate:</span>
                      <span className="stat-value">
                        {testResults.memoryGrowthRateMBPerHour.toFixed(2)} MB/hour
                      </span>
                    </div>

                    <div className="stat">
                      <span className="stat-label">Leak Detected:</span>
                      <span
                        className={`stat-value ${testResults.leakDetected ? 'leak-detected' : ''}`}
                      >
                        {testResults.leakDetected ? 'Yes' : 'No'}
                      </span>
                    </div>

                    {testResults.leakDetected && testResults.leakSeverity && (
                      <div className="stat">
                        <span className="stat-label">Leak Severity:</span>
                        <span className="stat-value leak-detected">
                          {testResults.leakSeverity}/5
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {testBatteryResults && (
              <div className="test-battery-results">
                <h3>Test Battery Results</h3>

                <div className="battery-tabs">
                  {Object.keys(testBatteryResults).map(testName => (
                    <button
                      key={testName}
                      className="battery-tab"
                      onClick={() => {
                        setTestResults(testBatteryResults[testName]);
                      }}
                    >
                      {testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </button>
                  ))}
                </div>

                <div className="battery-summary">
                  <h4>Overview</h4>
                  <table className="battery-table">
                    <thead>
                      <tr>
                        <th>Test</th>
                        <th>Duration</th>
                        <th>Memory Change</th>
                        <th>Growth Rate</th>
                        <th>Leak Detected</th>
                        <th>Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(testBatteryResults).map(([testName, result]) => (
                        <tr key={testName}>
                          <td>
                            {testName
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, str => str.toUpperCase())}
                          </td>
                          <td>{(result?.durationMs / (60 * 1000)).toFixed(1)} min</td>
                          <td>{(result?.finalMemoryMB - result?.initialMemoryMB).toFixed(2)} MB</td>
                          <td>{result?.memoryGrowthRateMBPerHour.toFixed(2)} MB/h</td>
                          <td className={result?.leakDetected ? 'leak-detected' : ''}>
                            {result?.leakDetected ? 'Yes' : 'No'}
                          </td>
                          <td className={result?.leakDetected ? 'leak-detected' : ''}>
                            {result?.leakSeverity || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="battery-help">
                  Click on a test name to view detailed results for that test.
                </p>
              </div>
            )}

            {!testResults && !testBatteryResults && (
              <div className="no-results">
                <p>No test results available. Run a test to see results here.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>
        {`
        .long-session-memory-page {
          font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            Arial,
            sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .memory-page-tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid #e8eaed;
        }

        .memory-page-tabs button {
          background: none;
          border: none;
          padding: 12px 20px;
          font-size: 16px;
          cursor: pointer;
          color: #5f6368;
          position: relative;
        }

        .memory-page-tabs button.active {
          color: #1a73e8;
          font-weight: 500;
        }

        .memory-page-tabs button.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background: #1a73e8;
        }

        .memory-page-tabs button:disabled {
          color: #bdc1c6;
          cursor: not-allowed;
        }

        .notification {
          background: #e6f4ea;
          border-left: 4px solid #34a853;
          color: #0d652d;
          padding: 12px 16px;
          margin-bottom: 20px;
          border-radius: 4px;
          animation: fadeOut 5s forcombatds;
        }

        @keyframes fadeOut {
          0% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        .tab-content {
          margin-top: 20px;
        }

        h2 {
          color: #202124;
          margin-top: 0;
          margin-bottom: 16px;
        }

        h3 {
          color: #202124;
          margin-top: 20px;
          margin-bottom: 12px;
        }

        p {
          color: #5f6368;
          line-height: 1.5;
        }

        .tracking-controls {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .control-group {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 20px;
        }

        .control-group label {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 200px;
          color: #5f6368;
          font-size: 14px;
        }

        .control-group input {
          margin-top: 6px;
          padding: 8px 12px;
          border: 1px solid #dadce0;
          border-radius: 4px;
          font-size: 14px;
        }

        .control-buttons {
          display: flex;
          gap: 12px;
        }

        .start-button {
          background: #1a73e8;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }

        .stop-button {
          background: #ea4335;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }

        .clear-button {
          background: #f1f3f4;
          color: #5f6368;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }

        .clear-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .visualizer-container {
          margin-top: 20px;
        }

        .testing-tab {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .test-types {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .test-types label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #202124;
          cursor: pointer;
        }

        .test-options {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e8eaed;
        }

        .battery-info {
          background: #e8f0fe;
          border-left: 4px solid #1a73e8;
          padding: 12px 16px;
          margin-top: 16px;
          border-radius: 4px;
          color: #174ea6;
        }

        .test-controls {
          margin-top: 30px;
          display: flex;
          justify-content: center;
        }

        .run-test-button {
          background: #1a73e8;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
        }

        .run-test-button:disabled {
          background: #dadce0;
          cursor: not-allowed;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .download-button {
          background: #1a73e8;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .result-summary {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-top: 20px;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #5f6368;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 500;
          color: #202124;
        }

        .stat-value.leak-detected {
          color: #ea4335;
        }

        .test-battery-results {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .battery-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }

        .battery-tab {
          background: #f1f3f4;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          color: #202124;
          cursor: pointer;
        }

        .battery-tab:hover {
          background: #e8eaed;
        }

        .battery-summary {
          margin-top: 20px;
        }

        .battery-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }

        .battery-table th,
        .battery-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e8eaed;
        }

        .battery-table th {
          background: #f8f9fa;
          color: #5f6368;
          font-weight: 500;
        }

        .battery-table .leak-detected {
          color: #ea4335;
          font-weight: 500;
        }

        .battery-help {
          margin-top: 16px;
          font-style: italic;
          color: #5f6368;
        }

        .no-results {
          background: #f8f9fa;
          padding: 40px;
          border-radius: 8px;
          text-align: center;
        }
      `}
      </style>
    </div>
  );
};

export default LongSessionMemoryPage;
