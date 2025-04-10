import * as React from 'react';
import { useEffect, useState } from 'react';
import UserBehaviorCorrelationView from '../components/ui/performance/UserBehaviorCorrelationView';
import { ErrorSeverity, ErrorType, errorLoggingService } from '../services/ErrorLoggingService';
import { SessionPerformanceData } from '../services/telemetry/SessionPerformanceTracker';
import { ResourceType } from './../types/resources/ResourceTypes';

/**
 * Performance Analysis Dashboard that showcases various performance
 * analytics tools including user behavior correlation analysis
 */
const PerformanceAnalysisDashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<SessionPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('userBehavior');

  // Fetch performance data when component mounts
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        // In a real application, this would be fetched from an API or service
        // For now, we'll use mock data from localStorage if available
        const storedData = localStorage.getItem('performance_telemetry_data');

        if (storedData) {
          setPerformanceData(JSON.parse(storedData));
        } else {
          // Generate mock data if none exists
          const mockData = generateMockPerformanceData();
          setPerformanceData(mockData);

          // Store for future use
          localStorage.setItem('performance_telemetry_data', JSON.stringify(mockData));
        }

        setIsLoading(false);
      } catch (error) {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error('Error fetching performance data'),
          ErrorType.NETWORK,
          ErrorSeverity.MEDIUM,
          {
            componentName: 'PerformanceAnalysisDashboard',
            action: 'fetchPerformanceData',
          }
        );
        setIsLoading(false);
      }
    };

    fetchPerformanceData();
  }, []);

  /**
   * Generate mock performance data for testing
   */
  const generateMockPerformanceData = (): SessionPerformanceData[] => {
    const sessions: SessionPerformanceData[] = [];
    const sessionCount = 20;

    for (let i = 0; i < sessionCount; i++) {
      const timestamp = Date.now() - i * 1000 * 60 * 60; // Each session 1 hour apart
      const interactionCount = 10 + Math.floor(Math.random() * 40); // 10-50 interactions

      const userInteractions = [];
      for (let j = 0; j < interactionCount; j++) {
        const interactionTypes = ['click', 'hover', 'scroll', 'keypress', 'custom'] as const;
        const type = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];
        const responseTime = 20 + Math.random() * 80; // 20-100ms response time

        userInteractions.push({
          interactionType: type,
          targetComponent: `component-${Math.floor(Math.random() * 10)}`,
          timestamp: timestamp + j * 1000 * Math.random() * 30, // Random time within session
          responseTime,
          successful: Math.random() > 0.05, // 5% chance of failure
        });
      }

      // More interactions lead to lower performance, with some randomness
      const fpsImpact = Math.max(0, 60 - interactionCount * 0.2) + (Math.random() * 10 - 5);
      const memoryUsage = 100 + interactionCount * 2 + Math.random() * 50;
      const cpuUsage = 10 + interactionCount * 0.5 + Math.random() * 10;
      const renderTime = 5 + interactionCount * 0.3 + Math.random() * 5;

      sessions.push({
        sessionId: `session-${i}`,
        timestamp,
        metrics: {
          fps: Math.min(60, Math.max(15, fpsImpact)),
          memoryUsage,
          cpuUsage,
          resourceUtilization: new Map([
            [ResourceType.MINERALS as ResourceType, 20 + Math.random() * 30],
            [ResourceType.ENERGY as ResourceType, 40 + Math.random() * 30],
            [ResourceType.GAS as ResourceType, 10 + Math.random() * 20],
            [ResourceType.RESEARCH as ResourceType, 5 + Math.random() * 10],
          ]),
          renderTime,
          eventProcessingTime: 2 + interactionCount * 0.1 + Math.random() * 2,
          interactionLatency:
            userInteractions.reduce((sum, i) => sum + i.responseTime, 0) / interactionCount,
          loadTimes: {
            'resource-panel': 200 + Math.random() * 100,
            'galaxy-map': 500 + Math.random() * 300,
            'ship-control': 150 + Math.random() * 100,
          },
          eventCounts: {
            'resource-transfer': Math.floor(Math.random() * 30),
            'combat-action': Math.floor(Math.random() * 10),
            navigation: Math.floor(Math.random() * 20),
          },
        },
        userInteractions,
        errors:
          Math.random() > 0.7
            ? [
                {
                  errorType: 'rendering-error',
                  message: 'Failed to render component',
                  timestamp: timestamp + Math.random() * 1000 * 60 * 5,
                  componentId: `component-${Math.floor(Math.random() * 5)}`,
                },
              ]
            : [],
      });
    }

    return sessions;
  };

  /**
   * Handle insight selection from correlation view
   */
  const handleInsightSelected = (insight: string) => {
    setSelectedInsight(insight);
  };

  return (
    <div className="performance-analysis-dashboard">
      <header className="dashboard-header">
        <h1>Performance Analysis Dashboard</h1>

        {selectedInsight && (
          <div className="selected-insight">
            <h3>Selected Insight</h3>
            <p>{selectedInsight}</p>
            <button onClick={() => setSelectedInsight(null)}>Clear</button>
          </div>
        )}
      </header>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'userBehavior' ? 'active' : ''}
          onClick={() => setActiveTab('userBehavior')}
        >
          User Behavior Correlation
        </button>
        <button
          className={activeTab === 'metrics' ? 'active' : ''}
          onClick={() => setActiveTab('metrics')}
        >
          Performance Metrics
        </button>
        <button
          className={activeTab === 'trends' ? 'active' : ''}
          onClick={() => setActiveTab('trends')}
        >
          Performance Trends
        </button>
      </div>

      <div className="dashboard-content">
        {isLoading ? (
          <div className="loading-container">
            <p>Loading performance data?...</p>
          </div>
        ) : (
          <>
            {activeTab === 'userBehavior' && (
              <div className="tab-content">
                <UserBehaviorCorrelationView
                  sessions={performanceData}
                  onInsightSelected={handleInsightSelected}
                />
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="tab-content">
                <div className="placeholder-content">
                  <h2>Performance Metrics</h2>
                  <p>This section will contain detailed performance metrics visualization.</p>
                </div>
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="tab-content">
                <div className="placeholder-content">
                  <h2>Performance Trends</h2>
                  <p>This section will contain performance trend analysis over time.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>
        {`
        .performance-analysis-dashboard {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
            'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f8fa;
          min-height: 100vh;
        }

        .dashboard-header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eaeaea;
          position: relative;
        }

        .dashboard-header h1 {
          color: #2d3748;
          margin: 0;
          margin-bottom: 10px;
        }

        .selected-insight {
          background-color: #ebf8ff;
          border-left: 4px solid #3182ce;
          padding: 12px 15px;
          margin-top: 15px;
          border-radius: 4px;
          position: relative;
        }

        .selected-insight h3 {
          margin: 0;
          margin-bottom: 8px;
          font-size: 16px;
          color: #2c5282;
        }

        .selected-insight p {
          margin: 0;
          color: #4a5568;
        }

        .selected-insight button {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 8px;
          background: none;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          color: #4a5568;
        }

        .selected-insight button:hover {
          background-color: #f7fafc;
        }

        .dashboard-tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .dashboard-tabs button {
          padding: 12px 20px;
          border: none;
          background: none;
          color: #4a5568;
          font-size: 16px;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }

        .dashboard-tabs button:hover {
          color: #3182ce;
        }

        .dashboard-tabs button.active {
          color: #3182ce;
          font-weight: 500;
        }

        .dashboard-tabs button.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background-color: #3182ce;
          border-top-left-radius: 3px;
          border-top-right-radius: 3px;
        }

        .dashboard-content {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .tab-content {
          padding: 0;
        }

        .loading-container {
          padding: 40px;
          text-align: center;
          color: #718096;
        }

        .placeholder-content {
          padding: 40px;
          text-align: center;
          color: #718096;
        }

        .placeholder-content h2 {
          color: #4a5568;
          margin-top: 0;
        }
        `}
      </style>
    </div>
  );
};

export default PerformanceAnalysisDashboard;
