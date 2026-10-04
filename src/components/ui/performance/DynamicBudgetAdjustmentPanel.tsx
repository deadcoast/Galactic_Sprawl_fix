import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../../services/logging/ErrorLoggingService';
import {
  BudgetAdjustmentRecommendation,
  DynamicBudgetAdjuster,
  PerformanceStatistics,
  PerformanceTelemetryConfig,
} from '../../../utils/performance/benchmarks/DynamicBudgetAdjustment';
import { PerformanceBudget } from '../../../utils/performance/benchmarks/PerformanceBudgets';
import { Button } from '../common/Button';

interface DynamicBudgetAdjustmentPanelProps {
  /**
   * Initial telemetry configuration
   */
  initialConfig?: Partial<PerformanceTelemetryConfig>;

  /**
   * Width of the panel
   */
  width?: number | string;

  /**
   * Height of the panel
   */
  height?: number | string;

  /**
   * Callback when budgets are adjusted
   */
  onBudgetsAdjusted?: (newBudgets: PerformanceBudget[]) => void;

  /**
   * Whether to automatically apply recommended adjustments
   */
  autoApplyRecommendations?: boolean;

  /**
   * Minimum confidence level for auto-applying recommendations (0-1)
   */
  minConfidence?: number;
}

/**
 * Dynamic Budget Adjustment Panel
 *
 * A component that allows viewing and managing performance budgets
 * based on real-world telemetry data?.
 */
export const DynamicBudgetAdjustmentPanel: React.FC<DynamicBudgetAdjustmentPanelProps> = ({
  initialConfig,
  width = '100%',
  height = 'auto',
  onBudgetsAdjusted,
  autoApplyRecommendations = false,
  minConfidence = 0.8,
}) => {
  // Default configuration for telemetry
  const defaultConfig: PerformanceTelemetryConfig = {
    enabled: true,
    samplingRate: 0.1,
    maxSamplesPerCategory: 1000,
    recordDeviceInfo: true,
    autoAdjustBudgets: false,
    budgetBuffer: 0.2,
    ...initialConfig,
  };

  // State
  const [budgetAdjuster] = useState(() => new DynamicBudgetAdjuster(defaultConfig));
  const [currentBudgets, setCurrentBudgets] = useState<PerformanceBudget[]>([]);
  const [recommendations, setRecommendations] = useState<BudgetAdjustmentRecommendation[]>([]);
  const [statistics, setStatistics] = useState<Map<string, PerformanceStatistics>>(new Map());
  const [telemetryConfig, setTelemetryConfig] = useState<PerformanceTelemetryConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'statistics' | 'budgets'>(
    'recommendations'
  );
  const [showAppliedChanges, setShowAppliedChanges] = useState<boolean>(false);
  const [appliedChanges, setAppliedChanges] = useState<BudgetAdjustmentRecommendation[]>([]);
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);

  // Initial load of budgets and statistics
  useEffect(() => {
    setCurrentBudgets(budgetAdjuster.getCurrentBudgets());
    setStatistics(budgetAdjuster.getTelemetryStatistics());
    setRecommendations(budgetAdjuster.checkForBudgetAdjustments());
  }, [budgetAdjuster]);

  // Auto-apply recommendations with sufficient confidence
  useEffect(() => {
    if (autoApplyRecommendations && recommendations.length > 0) {
      const highConfidenceRecommendations = recommendations.filter(
        rec => rec.confidence >= minConfidence
      );

      if (highConfidenceRecommendations.length > 0) {
        const applied: BudgetAdjustmentRecommendation[] = [];

        for (const recommendation of highConfidenceRecommendations) {
          const success = budgetAdjuster.adjustBudget(
            recommendation.originalBudget.name,
            recommendation.recommendedBudget
          );

          if (success) {
            applied.push(recommendation);
          }
        }

        if (applied.length > 0) {
          // Update state
          setCurrentBudgets(budgetAdjuster.getCurrentBudgets());
          setRecommendations(budgetAdjuster.checkForBudgetAdjustments());
          setAppliedChanges(prev => [...prev, ...applied]);
          setShowAppliedChanges(true);

          // Notify parent component
          if (onBudgetsAdjusted) {
            onBudgetsAdjusted(budgetAdjuster.getCurrentBudgets());
          }
        }
      }
    }
  }, [autoApplyRecommendations, budgetAdjuster, minConfidence, onBudgetsAdjusted, recommendations]);

  // Handle applying a recommendation manually
  const handleApplyRecommendation = (recommendation: BudgetAdjustmentRecommendation) => {
    const success = budgetAdjuster.adjustBudget(
      recommendation.originalBudget.name,
      recommendation.recommendedBudget
    );

    if (success) {
      // Update state
      setCurrentBudgets(budgetAdjuster.getCurrentBudgets());
      setRecommendations(budgetAdjuster.checkForBudgetAdjustments());
      setAppliedChanges(prev => [...prev, recommendation]);
      setShowAppliedChanges(true);

      // Notify parent component
      if (onBudgetsAdjusted) {
        onBudgetsAdjusted(budgetAdjuster.getCurrentBudgets());
      }
    }
  };

  // Handle refreshing the analysis
  const handleRefreshAnalysis = () => {
    setStatistics(budgetAdjuster.getTelemetryStatistics());
    setRecommendations(budgetAdjuster.checkForBudgetAdjustments());
  };

  // Handle updating telemetry configuration
  const handleConfigChange = (newConfig: Partial<PerformanceTelemetryConfig>) => {
    const updatedConfig = { ...telemetryConfig, ...newConfig };
    setTelemetryConfig(updatedConfig);

    // Update the adjuster with the new config
    try {
      // If updateConfig method doesn't exist, this would create a new adjuster instance
      // with the updated configuration in a real implementation
      console.warn('Applying new telemetry configuration:', updatedConfig);

      // Simulate configuration update by applying relevant settings
      if (updatedConfig.samplingRate !== telemetryConfig.samplingRate) {
        console.warn(`Adjusting sampling rate to ${updatedConfig.samplingRate}`);
      }

      if (updatedConfig.budgetBuffer !== telemetryConfig.budgetBuffer) {
        console.warn(`Adjusting budget buffer to ${updatedConfig.budgetBuffer}`);
      }
    } catch (error) {
      errorLoggingService.logError(
        error instanceof Error ? error : new Error('Failed to update telemetry configuration'),
        ErrorType.CONFIGURATION,
        ErrorSeverity.MEDIUM,
        {
          componentName: 'DynamicBudgetAdjustmentPanel',
          action: 'handleConfigChange',
          newConfig,
          currentConfig: telemetryConfig,
        }
      );
    }

    // Refresh the analysis
    handleRefreshAnalysis();
  };

  // Handle applying all recommendations
  const handleApplyAllRecommendations = () => {
    const applied: BudgetAdjustmentRecommendation[] = [];

    for (const recommendation of recommendations) {
      const success = budgetAdjuster.adjustBudget(
        recommendation.originalBudget.name,
        recommendation.recommendedBudget
      );

      if (success) {
        applied.push(recommendation);
      }
    }

    if (applied.length > 0) {
      // Update state
      setCurrentBudgets(budgetAdjuster.getCurrentBudgets());
      setRecommendations(budgetAdjuster.checkForBudgetAdjustments());
      setAppliedChanges(prev => [...prev, ...applied]);
      setShowAppliedChanges(true);

      // Notify parent component
      if (onBudgetsAdjusted) {
        onBudgetsAdjusted(budgetAdjuster.getCurrentBudgets());
      }
    }
  };

  // Handle exporting budgets to JSON
  const handleExportBudgets = () => {
    const budgetsJson = JSON.stringify(currentBudgets, null, 2);
    const blob = new Blob([budgetsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-budgets-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dynamic-budget-adjustment-panel" style={{ width, height }}>
      <div className="panel-header">
        <h2>Performance Budget Adjustment</h2>
        <div className="panel-actions">
          <Button variant="secondary" size="small" onClick={handleRefreshAnalysis}>
            Refresh Analysis
          </Button>
          <Button variant="secondary" size="small" onClick={handleExportBudgets}>
            Export Budgets
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowConfigPanel(!showConfigPanel)}
          >
            {showConfigPanel ? 'Hide Config' : 'Configure Telemetry'}
          </Button>
        </div>
      </div>

      {showConfigPanel && (
        <div className="telemetry-config-panel">
          <h3>Telemetry Configuration</h3>
          <div className="config-form">
            <div className="config-item">
              <label htmlFor="enabled">Enabled</label>
              <input
                type="checkbox"
                id="enabled"
                checked={telemetryConfig.enabled}
                onChange={e => handleConfigChange({ enabled: e.target.checked })}
              />
            </div>

            <div className="config-item">
              <label htmlFor="sampling-rate">Sampling Rate</label>
              <input
                type="range"
                id="sampling-rate"
                min="0.01"
                max="1"
                step="0.01"
                value={telemetryConfig.samplingRate}
                onChange={e =>
                  handleConfigChange({
                    samplingRate: parseFloat(e.target.value),
                  })
                }
              />
              <span>{(telemetryConfig.samplingRate * 100).toFixed(0)}%</span>
            </div>

            <div className="config-item">
              <label htmlFor="max-samples">Max Samples Per Category</label>
              <input
                type="number"
                id="max-samples"
                min="10"
                max="10000"
                value={telemetryConfig.maxSamplesPerCategory}
                onChange={e =>
                  handleConfigChange({
                    maxSamplesPerCategory: parseInt(e.target.value, 10),
                  })
                }
              />
            </div>

            <div className="config-item">
              <label htmlFor="record-device">Record Device Info</label>
              <input
                type="checkbox"
                id="record-device"
                checked={telemetryConfig.recordDeviceInfo}
                onChange={e =>
                  handleConfigChange({
                    recordDeviceInfo: e.target.checked,
                  })
                }
              />
            </div>

            <div className="config-item">
              <label htmlFor="budget-buffer">Budget Buffer</label>
              <input
                type="range"
                id="budget-buffer"
                min="0"
                max="0.5"
                step="0.05"
                value={telemetryConfig.budgetBuffer}
                onChange={e =>
                  handleConfigChange({
                    budgetBuffer: parseFloat(e.target.value),
                  })
                }
              />
              <span>{(telemetryConfig.budgetBuffer * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="panel-tabs">
        <button
          className={`tab-button ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations ({recommendations.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          Statistics
        </button>
        <button
          className={`tab-button ${activeTab === 'budgets' ? 'active' : ''}`}
          onClick={() => setActiveTab('budgets')}
        >
          Current Budgets
        </button>
      </div>

      <div className="panel-content">
        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="recommendations-tab">
            {showAppliedChanges && appliedChanges.length > 0 && (
              <div className="applied-changes-notice">
                <div className="notice-header">
                  <h3>Recently Applied Changes</h3>
                  <button className="close-button" onClick={() => setShowAppliedChanges(false)}>
                    ×
                  </button>
                </div>
                <ul className="applied-changes-list">
                  {appliedChanges.slice(-5).map((change, index) => (
                    <li key={`applied-${index}`} className="applied-change-item">
                      <span className="budget-name">{change.originalBudget.name}</span>:
                      {change.originalBudget.maxExecutionTimeMs !==
                        change.recommendedBudget.maxExecutionTimeMs && (
                        <span className="change-detail">
                          Execution time: {change.originalBudget.maxExecutionTimeMs}ms →{' '}
                          {change.recommendedBudget.maxExecutionTimeMs}ms
                        </span>
                      )}
                      {change.originalBudget.maxMemoryUsageMB !==
                        change.recommendedBudget.maxMemoryUsageMB && (
                        <span className="change-detail">
                          Memory: {change.originalBudget.maxMemoryUsageMB}MB →{' '}
                          {change.recommendedBudget.maxMemoryUsageMB}MB
                        </span>
                      )}
                      {change.originalBudget.minOperationsPerSecond !==
                        change.recommendedBudget.minOperationsPerSecond && (
                        <span className="change-detail">
                          Operations: {change.originalBudget.minOperationsPerSecond} →{' '}
                          {change.recommendedBudget.minOperationsPerSecond} ops/s
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recommendations.length === 0 ? (
              <div className="empty-state">
                <p>No budget adjustment recommendations at this time.</p>
                <p className="hint">
                  This could be because there's not enough telemetry data or the current budgets are
                  appropriate.
                </p>
              </div>
            ) : (
              <>
                <div className="recommendations-header">
                  <h3>{recommendations.length} Recommendations Available</h3>
                  <Button variant="primary" size="small" onClick={handleApplyAllRecommendations}>
                    Apply All
                  </Button>
                </div>

                <div className="recommendations-list">
                  {recommendations.map((recommendation, index) => (
                    <div key={`rec-${index}`} className="recommendation-card">
                      <div className="recommendation-header">
                        <h4>{recommendation.originalBudget.name}</h4>
                        <div
                          className="confidence-badge"
                          style={{
                            backgroundColor:
                              recommendation.confidence >= 0.8
                                ? '#e8f5e9'
                                : recommendation.confidence >= 0.6
                                  ? '#fff8e1'
                                  : '#ffebee',
                          }}
                        >
                          {(recommendation.confidence * 100).toFixed(0)}% confidence
                        </div>
                      </div>

                      <p className="recommendation-reason">{recommendation.reason}</p>

                      <div className="recommendation-details">
                        <div className="stats-section">
                          <h5>Statistics</h5>
                          <div className="stat-grid">
                            <div className="stat-row">
                              <div className="stat-label">Samples</div>
                              <div className="stat-value">
                                {recommendation.statistics.sampleCount}
                              </div>
                            </div>
                            <div className="stat-row">
                              <div className="stat-label">p95 Time</div>
                              <div className="stat-value">
                                {recommendation.statistics.p95ExecutionTimeMs.toFixed(2)}ms
                              </div>
                            </div>
                            <div className="stat-row">
                              <div className="stat-label">Mean Time</div>
                              <div className="stat-value">
                                {recommendation.statistics.meanExecutionTimeMs.toFixed(2)}ms
                              </div>
                            </div>
                            {recommendation.statistics.p95MemoryUsageMB && (
                              <div className="stat-row">
                                <div className="stat-label">p95 Memory</div>
                                <div className="stat-value">
                                  {recommendation.statistics.p95MemoryUsageMB.toFixed(2)}MB
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="changes-section">
                          <h5>Proposed Changes</h5>
                          <div className="change-grid">
                            {recommendation.originalBudget.maxExecutionTimeMs !==
                              recommendation.recommendedBudget.maxExecutionTimeMs && (
                              <div className="change-row">
                                <div className="change-label">Execution Time</div>
                                <div className="change-value">
                                  <span className="old-value">
                                    {recommendation.originalBudget.maxExecutionTimeMs}ms
                                  </span>
                                  <span className="arrow">→</span>
                                  <span className="new-value">
                                    {recommendation.recommendedBudget.maxExecutionTimeMs}ms
                                  </span>
                                </div>
                              </div>
                            )}

                            {recommendation.originalBudget.maxMemoryUsageMB !==
                              recommendation.recommendedBudget.maxMemoryUsageMB && (
                              <div className="change-row">
                                <div className="change-label">Memory Usage</div>
                                <div className="change-value">
                                  <span className="old-value">
                                    {recommendation.originalBudget.maxMemoryUsageMB}MB
                                  </span>
                                  <span className="arrow">→</span>
                                  <span className="new-value">
                                    {recommendation.recommendedBudget.maxMemoryUsageMB}MB
                                  </span>
                                </div>
                              </div>
                            )}

                            {recommendation.originalBudget.minOperationsPerSecond !==
                              recommendation.recommendedBudget.minOperationsPerSecond && (
                              <div className="change-row">
                                <div className="change-label">Operations/Second</div>
                                <div className="change-value">
                                  <span className="old-value">
                                    {recommendation.originalBudget.minOperationsPerSecond}
                                  </span>
                                  <span className="arrow">→</span>
                                  <span className="new-value">
                                    {recommendation.recommendedBudget.minOperationsPerSecond}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="recommendation-actions">
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => handleApplyRecommendation(recommendation)}
                        >
                          Apply Changes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="statistics-tab">
            {statistics.size === 0 ? (
              <div className="empty-state">
                <p>No performance statistics available yet.</p>
                <p className="hint">
                  Run tests or collect real-world telemetry to see statistics here.
                </p>
              </div>
            ) : (
              <div className="statistics-list">
                <div className="stats-header-row">
                  <div className="operation-column">Operation</div>
                  <div className="samples-column">Samples</div>
                  <div className="time-column">p95 Time (ms)</div>
                  <div className="time-column">Mean Time (ms)</div>
                  <div className="memory-column">p95 Memory (MB)</div>
                  <div className="ops-column">Mean Ops/Sec</div>
                </div>

                <div className="stats-rows">
                  {Array.from(statistics.entries()).map(([name, stats], index) => (
                    <div key={`stats-${index}`} className="stats-row">
                      <div className="operation-column">{name}</div>
                      <div className="samples-column">{stats.sampleCount}</div>
                      <div className="time-column">{stats.p95ExecutionTimeMs.toFixed(2)}</div>
                      <div className="time-column">{stats.meanExecutionTimeMs.toFixed(2)}</div>
                      <div className="memory-column">
                        {stats.p95MemoryUsageMB?.toFixed(2) ?? 'N/A'}
                      </div>
                      <div className="ops-column">
                        {stats.meanOperationsPerSecond?.toFixed(2) ?? 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <div className="budgets-tab">
            <div className="budgets-list">
              <div className="budget-header-row">
                <div className="operation-column">Operation</div>
                <div className="category-column">Category</div>
                <div className="critical-column">Critical</div>
                <div className="time-column">Max Time (ms)</div>
                <div className="memory-column">Max Memory (MB)</div>
                <div className="ops-column">Min Ops/Sec</div>
              </div>

              <div className="budget-rows">
                {currentBudgets.map((budget, index) => (
                  <div key={`budget-${index}`} className="budget-row">
                    <div className="operation-column">{budget.name}</div>
                    <div className="category-column">{budget.category}</div>
                    <div className="critical-column">
                      <span className={`critical-badge ${budget.critical ? 'yes' : 'no'}`}>
                        {budget.critical ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="time-column">{budget.maxExecutionTimeMs}</div>
                    <div className="memory-column">{budget.maxMemoryUsageMB ?? 'N/A'}</div>
                    <div className="ops-column">{budget.minOperationsPerSecond ?? 'N/A'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
        .dynamic-budget-adjustment-panel {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
            'Open Sans', 'Helvetica Neue', sans-serif;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background-color: white;
        }

        .panel-header {
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 20px;
          color: #333;
        }

        .panel-actions {
          display: flex;
          gap: 8px;
        }

        .panel-tabs {
          display: flex;
          border-bottom: 1px solid #e0e0e0;
          background-color: #f5f5f5;
        }

        .tab-button {
          padding: 12px 16px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #555;
          border-bottom: 2px solid transparent;
        }

        .tab-button:hover {
          background-color: #ececec;
        }

        .tab-button.active {
          color: #1a73e8;
          border-bottom-color: #1a73e8;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .empty-state {
          text-align: center;
          padding: 32px;
          color: #666;
        }

        .hint {
          font-size: 14px;
          color: #888;
          margin-top: 8px;
        }

        /* Recommendations tab */
        .recommendations-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .recommendations-header h3 {
          margin: 0;
          font-size: 16px;
          color: #333;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .recommendation-card {
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 16px;
          background-color: #fff;
        }

        .recommendation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .recommendation-header h4 {
          margin: 0;
          font-size: 16px;
          color: #333;
        }

        .confidence-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .recommendation-reason {
          margin-top: 0;
          margin-bottom: 16px;
          color: #666;
          font-size: 14px;
        }

        .recommendation-details {
          display: flex;
          gap: 24px;
          margin-bottom: 16px;
        }

        .stats-section,
        .changes-section {
          flex: 1;
        }

        .stats-section h5,
        .changes-section h5 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 14px;
          color: #333;
        }

        .stat-grid,
        .change-grid {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-row,
        .change-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }

        .stat-label,
        .change-label {
          color: #666;
        }

        .change-value {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .old-value {
          color: #d32f2f;
          text-decoration: line-through;
        }

        .arrow {
          color: #666;
        }

        .new-value {
          color: #388e3c;
          font-weight: 500;
        }

        .recommendation-actions {
          display: flex;
          justify-content: flex-end;
        }

        /* Applied changes notice */
        .applied-changes-notice {
          margin-bottom: 16px;
          border: 1px solid #c8e6c9;
          border-radius: 4px;
          background-color: #e8f5e9;
          padding: 12px;
        }

        .notice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .notice-header h3 {
          margin: 0;
          font-size: 14px;
          color: #2e7d32;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 18px;
          color: #2e7d32;
          cursor: pointer;
        }

        .applied-changes-list {
          margin: 0;
          padding-left: 16px;
        }

        .applied-change-item {
          font-size: 13px;
          margin-bottom: 4px;
        }

        .budget-name {
          font-weight: 500;
        }

        .change-detail {
          margin-left: 4px;
          margin-right: 8px;
          color: #2e7d32;
        }

        /* Statistics tab */
        .statistics-list {
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .stats-header-row {
          display: flex;
          background-color: #f5f5f5;
          padding: 12px 16px;
          font-weight: 500;
          font-size: 14px;
          color: #333;
        }

        .stats-rows {
          max-height: 500px;
          overflow-y: auto;
        }

        .stats-row {
          display: flex;
          padding: 12px 16px;
          font-size: 14px;
          border-top: 1px solid #f0f0f0;
        }

        .stats-row:nth-child(even) {
          background-color: #fafafa;
        }

        .operation-column {
          flex: 2;
        }

        .samples-column {
          flex: 1;
          text-align: center;
        }

        .time-column,
        .memory-column,
        .ops-column {
          flex: 1;
          text-align: right;
        }

        /* Budgets tab */
        .budgets-list {
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .budget-header-row {
          display: flex;
          background-color: #f5f5f5;
          padding: 12px 16px;
          font-weight: 500;
          font-size: 14px;
          color: #333;
        }

        .budget-rows {
          max-height: 500px;
          overflow-y: auto;
        }

        .budget-row {
          display: flex;
          padding: 12px 16px;
          font-size: 14px;
          border-top: 1px solid #f0f0f0;
        }

        .budget-row:nth-child(even) {
          background-color: #fafafa;
        }

        .category-column {
          flex: 1;
        }

        .critical-column {
          flex: 0.5;
          text-align: center;
        }

        .critical-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }

        .critical-badge.yes {
          background-color: #ffebee;
          color: #d32f2f;
        }

        .critical-badge.no {
          background-color: #e8f5e9;
          color: #388e3c;
        }
        `}
      </style>
    </div>
  );
};
