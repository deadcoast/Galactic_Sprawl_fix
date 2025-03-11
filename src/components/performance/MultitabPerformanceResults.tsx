/**
 * MultitabPerformanceResults Component
 *
 * A React component that displays the results of multi-tab performance tests
 * in a user-friendly format, including charts and metrics.
 */

import React, { useEffect, useState } from 'react';
import { MultitabPerformanceResult } from '../../tests/performance/MultitabPerformanceTestSuite';

type ResultSet = MultitabPerformanceResult[] | Record<string, MultitabPerformanceResult[]>;

interface MultitabPerformanceResultsProps {
  /** Results from multi-tab performance tests */
  results: ResultSet;

  /** Optional callback for when test reports are generated */
  onReportGenerated?: (report: string) => void;
}

/**
 * Component for displaying multi-tab performance test results
 */
const MultitabPerformanceResults: React.FC<MultitabPerformanceResultsProps> = ({
  results,
  onReportGenerated,
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [report, setReport] = useState<string>('');

  // Process results to determine available tabs
  const processedResults = React.useMemo(() => {
    if (!results) return { isGrouped: false, resultGroups: {}, overview: [] };

    // Check if results are grouped by test type
    const isGrouped = !Array.isArray(results);

    if (isGrouped) {
      const resultGroups = results as Record<string, MultitabPerformanceResult[]>;
      const overview = Object.values(resultGroups).flat();
      return { isGrouped, resultGroups, overview };
    } else {
      const resultsList = results as MultitabPerformanceResult[];
      // Group by test type if not already grouped
      const groups: Record<string, MultitabPerformanceResult[]> = {};

      resultsList.forEach(result => {
        if (!groups[result.testType]) {
          groups[result.testType] = [];
        }
        groups[result.testType].push(result);
      });

      return { isGrouped: false, resultGroups: groups, overview: resultsList };
    }
  }, [results]);

  // Generate the report when results change
  useEffect(() => {
    if (!processedResults.overview.length) return;

    // Generate a report based on the results
    const generateReport = () => {
      let reportContent = '## Multi-Tab Performance Test Report\n\n';

      // Add test time and tab count
      const tabCount = processedResults.overview[0]?.tabCount || 0;
      reportContent += `**Test Time:** ${new Date().toLocaleString()}\n`;
      reportContent += `**Number of Tabs:** ${tabCount}\n\n`;

      // Process each test type
      Object.entries(processedResults.resultGroups).forEach(([testType, testResults]) => {
        reportContent += `### ${formatTestType(testType)} Test\n\n`;

        // Calculate averages across all tabs
        const avgFps = testResults.reduce((sum, r) => sum + r.metrics.fps, 0) / testResults.length;
        const avgMemory =
          testResults.reduce((sum, r) => sum + r.metrics.memoryPerTabMB, 0) / testResults.length;
        const avgEventTime =
          testResults.reduce((sum, r) => sum + r.metrics.eventProcessingTimeMs, 0) /
          testResults.length;
        const avgUiTime =
          testResults.reduce((sum, r) => sum + r.metrics.uiResponseTimeMs, 0) / testResults.length;
        const totalDroppedFrames = testResults.reduce((sum, r) => sum + r.metrics.droppedFrames, 0);

        reportContent += `**Average FPS:** ${avgFps.toFixed(2)}\n`;
        reportContent += `**Average Memory Per Tab:** ${avgMemory.toFixed(2)} MB\n`;
        reportContent += `**Average Event Processing Time:** ${avgEventTime.toFixed(2)} ms\n`;
        reportContent += `**Average UI Response Time:** ${avgUiTime.toFixed(2)} ms\n`;
        reportContent += `**Total Dropped Frames:** ${totalDroppedFrames}\n\n`;

        // Add performance assessment
        let assessment = '';
        if (avgFps < 30) {
          assessment += '- **Critical:** FPS below 30, indicating significant rendering issues\n';
        }
        if (avgEventTime > 50) {
          assessment +=
            '- **Warning:** Event processing time above 50ms, indicating potential responsiveness issues\n';
        }
        if (avgUiTime > 100) {
          assessment +=
            '- **Warning:** UI response time above 100ms, indicating noticeable UI lag\n';
        }
        if (totalDroppedFrames > 100) {
          assessment +=
            '- **Warning:** High number of dropped frames, indicating visual stuttering\n';
        }

        if (assessment) {
          reportContent += '**Performance Issues Detected:**\n' + assessment + '\n';
        } else {
          reportContent += '**No significant performance issues detected.**\n\n';
        }
      });

      return reportContent;
    };

    const generatedReport = generateReport();
    setReport(generatedReport);

    if (onReportGenerated) {
      onReportGenerated(generatedReport);
    }
  }, [processedResults, onReportGenerated]);

  /**
   * Format a test type string for display
   */
  const formatTestType = (testType: string): string => {
    return testType
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  /**
   * Render a metrics card with key performance indicators
   */
  const renderMetricsCard = (results: MultitabPerformanceResult[], title: string) => {
    if (!results.length) return null;

    // Calculate average metrics
    const avgFps = results.reduce((sum, r) => sum + r.metrics.fps, 0) / results.length;
    const avgMemory =
      results.reduce((sum, r) => sum + r.metrics.memoryPerTabMB, 0) / results.length;
    const avgEventTime =
      results.reduce((sum, r) => sum + r.metrics.eventProcessingTimeMs, 0) / results.length;
    const avgUiTime =
      results.reduce((sum, r) => sum + r.metrics.uiResponseTimeMs, 0) / results.length;
    const totalDroppedFrames = results.reduce((sum, r) => sum + r.metrics.droppedFrames, 0);

    // Determine status colors based on values
    const fpsColor = avgFps >= 50 ? 'green' : avgFps >= 30 ? 'orange' : 'red';
    const memoryColor = avgMemory <= 50 ? 'green' : avgMemory <= 100 ? 'orange' : 'red';
    const eventTimeColor = avgEventTime <= 20 ? 'green' : avgEventTime <= 50 ? 'orange' : 'red';
    const uiTimeColor = avgUiTime <= 50 ? 'green' : avgUiTime <= 100 ? 'orange' : 'red';
    const droppedFramesColor =
      totalDroppedFrames <= 10 ? 'green' : totalDroppedFrames <= 100 ? 'orange' : 'red';

    return (
      <div className="metrics-card">
        <h3>{title}</h3>

        <div className="metrics-grid">
          <div className="metric" style={{ borderLeftColor: fpsColor }}>
            <div className="metric-value">{avgFps.toFixed(1)}</div>
            <div className="metric-label">FPS</div>
          </div>

          <div className="metric" style={{ borderLeftColor: memoryColor }}>
            <div className="metric-value">{avgMemory.toFixed(1)}</div>
            <div className="metric-label">MB per Tab</div>
          </div>

          <div className="metric" style={{ borderLeftColor: eventTimeColor }}>
            <div className="metric-value">{avgEventTime.toFixed(1)}</div>
            <div className="metric-label">Event Time (ms)</div>
          </div>

          <div className="metric" style={{ borderLeftColor: uiTimeColor }}>
            <div className="metric-value">{avgUiTime.toFixed(1)}</div>
            <div className="metric-label">UI Response (ms)</div>
          </div>

          <div className="metric" style={{ borderLeftColor: droppedFramesColor }}>
            <div className="metric-value">{totalDroppedFrames}</div>
            <div className="metric-label">Dropped Frames</div>
          </div>
        </div>

        <div className="metrics-parameters">
          <h4>Test Parameters</h4>
          <table>
            <tbody>
              {Object.entries(results[0].parameters).map(([key, value]) => (
                <tr key={key}>
                  <td>{formatTestType(key)}</td>
                  <td>{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /**
   * Render the report tab content
   */
  const renderReportTab = () => {
    return (
      <div className="report-tab">
        <div className="report-actions">
          <button
            onClick={() => {
              // Create a download link for the report
              const blob = new Blob([report], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `multitab_performance_report_${new Date().toISOString().split('T')[0]}.md`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download Report
          </button>
        </div>
        <div className="report-content">
          {report.split('\n').map((line, i) => {
            // Format markdown-like report for display
            if (line.startsWith('## ')) {
              return <h2 key={i}>{line.substring(3)}</h2>;
            } else if (line.startsWith('### ')) {
              return <h3 key={i}>{line.substring(4)}</h3>;
            } else if (line.startsWith('**') && line.endsWith('**')) {
              return (
                <p key={i} className="bold">
                  {line.substring(2, line.length - 2)}
                </p>
              );
            } else if (line.startsWith('- **')) {
              const parts = line.split(':**');
              return (
                <p key={i} className="issue">
                  <span className="issue-type">{parts[0].substring(3)}:</span>
                  {parts[1]}
                </p>
              );
            } else {
              return <p key={i}>{line}</p>;
            }
          })}
        </div>
      </div>
    );
  };

  /**
   * Render tabs for navigating between different test results
   */
  const renderResultTabs = () => {
    const tabs = ['overview', 'report', ...Object.keys(processedResults.resultGroups)];

    return (
      <div className="result-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' ? 'Overview' : tab === 'report' ? 'Report' : formatTestType(tab)}
          </button>
        ))}
      </div>
    );
  };

  /**
   * Render the active tab content
   */
  const renderActiveTabContent = () => {
    if (activeTab === 'overview') {
      return (
        <div className="overview-tab">
          <h2>Performance Test Overview</h2>
          <p>
            Test conducted with {processedResults.overview[0]?.tabCount || 0} browser tabs. The
            results show the performance impact of running multiple instances of the application
            simultaneously.
          </p>

          <div className="overview-cards">
            {Object.entries(processedResults.resultGroups).map(([testType, results]) => (
              <div key={testType} className="overview-card" onClick={() => setActiveTab(testType)}>
                <h3>{formatTestType(testType)}</h3>
                <div className="overview-metrics">
                  <div className="overview-metric">
                    <span className="label">FPS</span>
                    <span className="value">
                      {(
                        results.reduce((sum, r) => sum + r.metrics.fps, 0) / results.length
                      ).toFixed(1)}
                    </span>
                  </div>
                  <div className="overview-metric">
                    <span className="label">Memory</span>
                    <span className="value">
                      {(
                        results.reduce((sum, r) => sum + r.metrics.memoryPerTabMB, 0) /
                        results.length
                      ).toFixed(1)}{' '}
                      MB
                    </span>
                  </div>
                </div>
                <div className="card-footer">Click for details</div>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (activeTab === 'report') {
      return renderReportTab();
    } else {
      const results = processedResults.resultGroups[activeTab] || [];
      return (
        <div className="test-detail-tab">
          <h2>{formatTestType(activeTab)} Test Results</h2>
          {renderMetricsCard(results, `Performance with ${results[0]?.tabCount || 0} tabs`)}

          <div className="test-description">
            <h3>About this Test</h3>
            <p>{getTestDescription(activeTab)}</p>
          </div>

          <div className="detailed-metrics">
            <h3>Detailed Metrics</h3>
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Tab ID</th>
                  <th>FPS</th>
                  <th>Memory (MB)</th>
                  <th>Event Time (ms)</th>
                  <th>UI Response (ms)</th>
                  <th>Dropped Frames</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index}>
                    <td>Tab {index + 1}</td>
                    <td>{result.metrics.fps.toFixed(1)}</td>
                    <td>{result.metrics.memoryPerTabMB.toFixed(1)}</td>
                    <td>{result.metrics.eventProcessingTimeMs.toFixed(1)}</td>
                    <td>{result.metrics.uiResponseTimeMs.toFixed(1)}</td>
                    <td>{result.metrics.droppedFrames}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };

  /**
   * Get a description for each test type
   */
  const getTestDescription = (testType: string): string => {
    switch (testType) {
      case 'resourceContention':
        return (
          'This test measures performance when multiple tabs are competing for shared resources like localStorage. ' +
          'It helps identify issues related to resource locking, race conditions, and performance degradation ' +
          'when multiple instances access the same data.'
        );

      case 'uiResponsiveness':
        return (
          'This test evaluates UI responsiveness when multiple tabs are active. ' +
          'It measures how well the application responds to user interactions ' +
          'when system resources are being shared across multiple instances.'
        );

      case 'domOperations':
        return (
          'This test measures performance when creating and updating DOM elements across multiple tabs. ' +
          'It helps identify how browser rendering performance is affected when multiple instances ' +
          'are performing intensive DOM operations simultaneously.'
        );

      case 'memoryUsage':
        return (
          'This test tracks memory growth over time with multiple tabs open. ' +
          'It helps identify memory leaks and excessive memory usage patterns ' +
          'that may only become apparent when multiple instances are running.'
        );

      default:
        return 'This test evaluates application performance with multiple tabs open simultaneously.';
    }
  };

  // If there are no results, show a placeholder
  if (!processedResults.overview.length) {
    return (
      <div className="multitab-performance-results empty">
        <h2>No Test Results</h2>
        <p>Run a multi-tab performance test to see results here.</p>
      </div>
    );
  }

  return (
    <div className="multitab-performance-results">
      <h2>Multi-Tab Performance Test Results</h2>

      {renderResultTabs()}

      <div className="tab-content">{renderActiveTabContent()}</div>

      <style jsx>{`
        .multitab-performance-results {
          background: #f5f5f5;
          border-radius: 8px;
          padding: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .multitab-performance-results.empty {
          text-align: center;
          padding: 40px 20px;
        }

        h2 {
          margin-top: 0;
          color: #333;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
        }

        .result-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
        }

        .tab-button {
          background: #f0f0f0;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .tab-button:hover {
          background: #e0e0e0;
        }

        .tab-button.active {
          background: #4285f4;
          color: white;
        }

        .overview-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .overview-card {
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition:
            transform 0.2s,
            box-shadow 0.2s;
        }

        .overview-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .overview-card h3 {
          margin-top: 0;
          color: #333;
        }

        .overview-metrics {
          display: flex;
          justify-content: space-between;
          margin: 15px 0;
        }

        .overview-metric {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .overview-metric .label {
          font-size: 12px;
          color: #666;
        }

        .overview-metric .value {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }

        .card-footer {
          text-align: center;
          font-size: 12px;
          color: #4285f4;
          margin-top: 10px;
        }

        .metrics-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .metrics-card h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #333;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .metric {
          background: #f9f9f9;
          border-radius: 4px;
          padding: 15px;
          border-left: 4px solid #ccc;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }

        .metric-label {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }

        .metrics-parameters h4 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #555;
        }

        .metrics-parameters table {
          width: 100%;
          border-collapse: collapse;
        }

        .metrics-parameters td {
          padding: 8px;
          border-bottom: 1px solid #eee;
        }

        .metrics-parameters td:first-child {
          font-weight: bold;
          width: 40%;
        }

        .test-description {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .test-description h3 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #333;
        }

        .test-description p {
          margin: 0;
          color: #555;
          line-height: 1.5;
        }

        .detailed-metrics {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow-x: auto;
        }

        .detailed-metrics h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #333;
        }

        .metrics-table {
          width: 100%;
          border-collapse: collapse;
        }

        .metrics-table th,
        .metrics-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .metrics-table th {
          background: #f5f5f5;
          font-weight: bold;
          color: #333;
        }

        .report-tab {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .report-actions {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 20px;
        }

        .report-actions button {
          background: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
        }

        .report-content {
          line-height: 1.6;
        }

        .report-content h2 {
          font-size: 22px;
          margin-top: 0;
          margin-bottom: 15px;
          color: #333;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }

        .report-content h3 {
          font-size: 18px;
          margin-top: 20px;
          margin-bottom: 10px;
          color: #333;
        }

        .report-content p {
          margin: 10px 0;
          color: #555;
        }

        .report-content .bold {
          font-weight: bold;
        }

        .report-content .issue {
          margin-left: 20px;
          color: #d93025;
        }

        .report-content .issue-type {
          font-weight: bold;
          margin-right: 5px;
        }
      `}</style>
    </div>
  );
};

export default MultitabPerformanceResults;
