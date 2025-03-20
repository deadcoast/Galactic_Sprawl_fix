/**
 * MultitabPerformanceTestPage
 *
 * A page component that combines the MultitabPerformanceLauncher and MultitabPerformanceResults
 * components to provide a complete multi-tab performance testing solution.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MultitabLaunchConfig,
  MultitabPerformanceLauncher,
} from '../../components/performance/MultitabPerformanceLauncher';
import { MultitabPerformanceResults } from '../../components/performance/MultitabPerformanceResults';
import { MultitabPerformanceResult } from '../../tests/performance/MultitabPerformanceTestSuite';

type ResultSet = MultitabPerformanceResult[] | Record<string, MultitabPerformanceResult[]>;

/**
 * MultitabPerformanceTestPage component
 */
const MultitabPerformanceTestPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState<ResultSet | null>(null);
  const [isCoordinator, setIsCoordinator] = useState(true);
  const [_report, setReport] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  // Check URL parameters to determine if this is a worker tab
  useEffect(() => {
    const isWorker = searchParams.get('worker') === 'true';
    setIsCoordinator(!isWorker);
  }, [searchParams]);

  /**
   * Handle test results from the performance launcher
   */
  const handleTestResults = (newResults: ResultSet) => {
    setResults(newResults);

    // Store results in localStorage for persistence
    try {
      localStorage.setItem('multitab_performance_results', JSON.stringify(newResults));
    } catch (e) {
      console.warn('Failed to store test results in localStorage:', e);
    }
  };

  /**
   * Handle generated reports
   */
  const handleReportGenerated = (generatedReport: string) => {
    setReport(generatedReport);
  };

  /**
   * Handle the launch of the performance test
   */
  const handleLaunch = (config: MultitabLaunchConfig) => {
    setIsRunning(true);
    // Implementation would go here to actually launch the test
    console.warn('Launching test with config:', config);

    // Simulate a test running for a few seconds
    setTimeout(() => {
      setIsRunning(false);
    }, 5000);
  };

  // Try to load previous results from localStorage
  useEffect(() => {
    try {
      const savedResults = localStorage.getItem('multitab_performance_results');
      if (savedResults) {
        setResults(JSON.parse(savedResults));
      }
    } catch (e) {
      console.warn('Failed to load previous test results:', e);
    }
  }, []);

  return (
    <div className="multitab-performance-test-page">
      <header>
        <h1>Multi-Tab Performance Testing</h1>
        <p className="subtitle">
          {isCoordinator
            ? 'Test application performance with multiple tabs open'
            : 'Worker tab - leave this open and return to the coordinator tab'}
        </p>
      </header>

      <div className="page-content">
        <section className="launcher-section">
          <MultitabPerformanceLauncher
            isCoordinator={isCoordinator}
            onTestResults={handleTestResults}
            onLaunch={handleLaunch}
            isRunning={isRunning}
          />
        </section>

        {isCoordinator && results && (
          <section className="results-section">
            <MultitabPerformanceResults
              results={results}
              _onReportGenerated={handleReportGenerated}
            />
          </section>
        )}

        {isCoordinator && (
          <section className="info-section">
            <h2>About Multi-Tab Performance Testing</h2>
            <p>
              Multi-tab performance testing evaluates how your application behaves when users have
              multiple instances open simultaneously in different browser tabs. This is crucial for
              modern web applications where users often work with multiple tabs.
            </p>

            <h3>Why Test Multi-Tab Performance?</h3>
            <ul>
              <li>
                <strong>Resource Contention:</strong> Multiple tabs can compete for limited browser
                resources, causing performance degradation.
              </li>
              <li>
                <strong>Shared Storage:</strong> Tabs may access the same localStorage, IndexedDB,
                or other shared storage, leading to potential conflicts.
              </li>
              <li>
                <strong>Memory Usage:</strong> Total memory consumption can grow dramatically with
                multiple tabs, potentially causing browser slowdowns or crashes.
              </li>
              <li>
                <strong>Background Processing:</strong> Tabs in the background may continue
                consuming resources, affecting the performance of the active tab.
              </li>
            </ul>

            <h3>How to Use This Tool</h3>
            <ol>
              <li>
                Click "Add Tab" to open additional worker tabs (you need at least 2 tabs total)
              </li>
              <li>Select a test type and configure test parameters</li>
              <li>Click "Run Test" to execute the performance test across all tabs</li>
              <li>Review the results to identify potential performance issues</li>
              <li>Download the detailed report for sharing or documentation</li>
            </ol>

            <p className="note">
              <strong>Note:</strong> For accurate results, ensure that all tabs remain open and
              visible during testing. Browser throttling of background tabs can affect the accuracy
              of test results.
            </p>
          </section>
        )}
      </div>

      <style jsx>{`
        .multitab-performance-test-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            Oxygen,
            Ubuntu,
            Cantarell,
            'Open Sans',
            'Helvetica Neue',
            sans-serif;
        }

        header {
          text-align: center;
          margin-bottom: 30px;
        }

        h1 {
          font-size: 32px;
          margin-bottom: 10px;
          color: #333;
        }

        .subtitle {
          font-size: 18px;
          color: #666;
          margin: 0;
        }

        .page-content {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .launcher-section,
        .results-section,
        .info-section {
          width: 100%;
        }

        .info-section {
          background: white;
          border-radius: 8px;
          padding: 25px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .info-section h2 {
          margin-top: 0;
          color: #333;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }

        .info-section h3 {
          margin-top: 25px;
          margin-bottom: 15px;
          color: #444;
        }

        .info-section p {
          line-height: 1.6;
          color: #555;
          margin-bottom: 15px;
        }

        .info-section ul,
        .info-section ol {
          padding-left: 20px;
          margin-bottom: 20px;
        }

        .info-section li {
          margin-bottom: 10px;
          line-height: 1.5;
          color: #555;
        }

        .note {
          background: #fffde7;
          padding: 15px;
          border-left: 4px solid #ffd600;
          margin-top: 20px;
        }

        @media (max-width: 768px) {
          .multitab-performance-test-page {
            padding: 15px;
          }

          h1 {
            font-size: 26px;
          }

          .subtitle {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default MultitabPerformanceTestPage;
