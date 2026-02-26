import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { PerformanceBudgetTracker } from '../components/ui/performance/PerformanceBudgetTracker';
import UserBehaviorCorrelationView from '../components/ui/performance/UserBehaviorCorrelationView';
import VisualizationPerformanceComparison from '../components/ui/performance/VisualizationPerformanceComparison';
import {
    errorLoggingService,
    ErrorSeverity,
    ErrorType
} from '../services/logging/ErrorLoggingService';
import { SessionPerformanceData } from '../services/telemetry/SessionPerformanceTracker';
import { BenchmarkResult } from '../utils/performance/benchmarks/PerformanceBenchmarkTools';
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

  const benchmarkResults = useMemo<BenchmarkResult[]>(() => {
    if (performanceData.length === 0) {
      return [];
    }

    const average = (values: number[]) =>
      values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

    const avgRenderTime = average(performanceData.map(session => session.metrics.renderTime));
    const avgMemoryUsage = average(performanceData.map(session => session.metrics.memoryUsage));
    const avgEventProcessing = average(
      performanceData.map(session => session.metrics.eventProcessingTime)
    );
    const avgInteractionLatency = average(
      performanceData.map(session => session.metrics.interactionLatency)
    );
    const avgEventsPerSession = average(
      performanceData.map(session =>
        Object.values(session.metrics.eventCounts ?? {}).reduce(
          (sum, value) => sum + (typeof value === 'number' ? value : 0),
          0
        )
      )
    );

    const now = new Date();

    return [
      {
        name: 'ResourceManagementDashboard Render',
        description: 'Derived from average render time in captured telemetry sessions',
        executionTimeMs: Math.max(1, avgRenderTime),
        memoryUsageMB: avgMemoryUsage,
        operationsPerSecond: 1000 / Math.max(avgRenderTime, 1),
        timestamp: now,
      },
      {
        name: 'ResourceVisualizationEnhanced Update',
        description: 'Derived from average interaction latency and event processing',
        executionTimeMs: Math.max(1, (avgEventProcessing + avgInteractionLatency) / 2),
        memoryUsageMB: avgMemoryUsage,
        operationsPerSecond: 1000 / Math.max(avgEventProcessing, 1),
        timestamp: now,
      },
      {
        name: 'EventSystem Processing (1000 events)',
        description: 'Estimated from event processing cost and session event volume',
        executionTimeMs: Math.max(1, avgEventProcessing * 10),
        operationsPerSecond: Math.max(1, avgEventsPerSession * (1000 / Math.max(avgEventProcessing, 1))),
        timestamp: now,
      },
      {
        name: 'Application Bootstrap',
        description: 'Estimated startup budget proxy from render + event processing telemetry',
        executionTimeMs: Math.max(100, avgRenderTime * 15 + avgEventProcessing * 5),
        timestamp: now,
      },
      {
        name: 'Resource System Initialization',
        description: 'Estimated subsystem startup budget proxy from interaction/event latency',
        executionTimeMs: Math.max(50, avgEventProcessing * 8 + avgInteractionLatency * 2),
        timestamp: now,
      },
    ];
  }, [performanceData]);

  // Fetch performance data when component mounts
  useEffect(() => {
    const fetchPerformanceData = () => {
      try {
        // In a real application, this would be fetched from an API or service
        // For now, we'll use mock data from localStorage if available
        const storedData = localStorage.getItem('performance_telemetry_data');

        if (storedData) {
          setPerformanceData(JSON.parse(storedData) as SessionPerformanceData[]);
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
    <div className="performance-analysis-dashboard gs-route-shell">
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
                <div className="dashboard-section-panel">
                  <h2 className="dashboard-section-title">Performance Budget Compliance</h2>
                  <PerformanceBudgetTracker
                    results={benchmarkResults}
                    categoryFilter={['ui', 'eventSystem', 'initialization']}
                  />
                </div>
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="tab-content">
                <div className="dashboard-section-panel">
                  <h2 className="dashboard-section-title">Visualization Performance Trends</h2>
                  <VisualizationPerformanceComparison
                    initialNodeCount={80}
                    initialLinkCount={140}
                    width={900}
                    height={380}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>
        {`
        .performance-analysis-dashboard {
          max-width: 1280px;
          margin: 0 auto;
          background: transparent;
          color: var(--gs-text-1);
          min-height: 100%;
        }

        .dashboard-header {
          margin-bottom: 20px;
          padding: 18px 20px 16px;
          border: 1px solid var(--gs-border);
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(26, 46, 78, 0.95), rgba(17, 32, 55, 0.95));
          position: relative;
        }

        .dashboard-header h1 {
          color: var(--gs-text-1);
          margin: 0;
          margin-bottom: 8px;
          font-size: clamp(1.5rem, 1.05rem + 1.25vw, 2.1rem);
          letter-spacing: -0.02em;
        }

        .selected-insight {
          background-color: rgba(59, 130, 246, 0.16);
          border-left: 4px solid #3b82f6;
          padding: 12px 15px;
          margin-top: 15px;
          border-radius: 8px;
          position: relative;
        }

        .selected-insight h3 {
          margin: 0;
          margin-bottom: 8px;
          font-size: 16px;
          color: #bfdbfe;
        }

        .selected-insight p {
          margin: 0;
          color: var(--gs-text-1);
        }

        .selected-insight button {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 8px;
          background: rgba(20, 39, 67, 0.75);
          border: 1px solid var(--gs-border);
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          color: var(--gs-text-2);
        }

        .selected-insight button:hover {
          background-color: rgba(59, 130, 246, 0.12);
        }

        .dashboard-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          border: 1px solid var(--gs-border);
          border-radius: 10px;
          padding: 6px;
          background: rgba(19, 38, 66, 0.8);
        }

        .dashboard-tabs button {
          padding: 10px 16px;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: var(--gs-text-2);
          font-size: 15px;
          cursor: pointer;
          position: relative;
          transition:
            color 0.2s,
            border-color 0.2s,
            background-color 0.2s;
        }

        .dashboard-tabs button:hover {
          color: #bfdbfe;
          border-color: rgba(96, 165, 250, 0.4);
          background: rgba(59, 130, 246, 0.1);
        }

        .dashboard-tabs button.active {
          color: #dbeafe;
          font-weight: 500;
          border-color: rgba(96, 165, 250, 0.6);
          background: rgba(59, 130, 246, 0.2);
        }

        .dashboard-tabs button.active::after {
          display: none;
        }

        .dashboard-content {
          background-color: rgba(15, 30, 52, 0.92);
          border: 1px solid var(--gs-border);
          border-radius: 14px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.04),
            0 18px 32px rgba(2, 10, 24, 0.35);
          overflow: hidden;
        }

        .tab-content {
          padding: 0;
        }

        .dashboard-section-panel {
          padding: 20px;
        }

        .dashboard-section-title {
          margin: 0 0 14px;
          color: var(--gs-text-1);
          font-size: 1.15rem;
          font-weight: 650;
        }

        .loading-container {
          padding: 40px;
          text-align: center;
          color: var(--gs-text-2);
        }

        .placeholder-content {
          padding: 40px;
          text-align: center;
          color: var(--gs-text-2);
        }

        .placeholder-content h2 {
          color: var(--gs-text-1);
          margin-top: 0;
        }
        `}
      </style>
    </div>
  );
};

export default PerformanceAnalysisDashboard;
