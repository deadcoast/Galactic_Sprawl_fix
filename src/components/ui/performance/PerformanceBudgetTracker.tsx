import * as React from 'react';
import { useMemo } from 'react';
import { BenchmarkResult } from '../../../utils/performance/benchmarks/PerformanceBenchmarkTools';
import {
  ALL_PERFORMANCE_BUDGETS,
  checkPerformanceBudget,
  PerformanceBudget,
} from '../../../utils/performance/benchmarks/PerformanceBudgets';

interface PerformanceBudgetTrackerProps {
  /**
   * The benchmark results to track against budgets
   */
  results: BenchmarkResult[];

  /**
   * Filter results by category
   */
  categoryFilter?: PerformanceBudget['category'][];

  /**
   * Show only violations
   */
  showOnlyViolations?: boolean;

  /**
   * Height of the component
   */
  height?: number;

  /**
   * Width of the component
   */
  width?: number | string;
}

/**
 * Performance Budget Tracker
 *
 * Tracks benchmark results against defined performance budgets and
 * visually displays compliance or violations.
 */
export const PerformanceBudgetTracker: React.FC<PerformanceBudgetTrackerProps> = ({
  results,
  categoryFilter,
  showOnlyViolations = false,
  height = 'auto',
  width = '100%',
}) => {
  // Filter budgets by category if needed
  const budgetsToShow = useMemo(() => {
    let budgets = ALL_PERFORMANCE_BUDGETS;

    if (categoryFilter && categoryFilter.length > 0) {
      budgets = budgets.filter(budget => categoryFilter.includes(budget.category));
    }

    return budgets;
  }, [categoryFilter]);

  // Process results against budgets
  const budgetResults = useMemo(() => {
    return budgetsToShow
      .map(budget => {
        // Find matching result by name
        const result = results.find(r => r.name === budget.name);

        if (!result) {
          return {
            budget,
            result: null,
            violation: false,
            checkResult: { violated: false, violations: {} },
          };
        }

        // Check if budget is violated
        const checkResult = checkPerformanceBudget(
          result?.name,
          result?.executionTimeMs,
          result?.memoryUsageMB,
          result?.operationsPerSecond
        );

        return {
          budget,
          result,
          violation: checkResult.violated,
          checkResult,
        };
      })
      .filter(item => !showOnlyViolations || item?.violation);
  }, [results, budgetsToShow, showOnlyViolations]);

  // Group by category
  const groupedBudgetResults = useMemo(() => {
    const grouped: Record<string, typeof budgetResults> = {};

    budgetResults.forEach(result => {
      const category = result?.budget.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(result);
    });

    return grouped;
  }, [budgetResults]);

  // Calculate overall status
  const overallStatus = useMemo(() => {
    const totalBudgets = budgetResults.length;
    const violations = budgetResults.filter(r => r.violation).length;
    const criticalViolations = budgetResults.filter(r => r.violation && r.budget.critical).length;

    return {
      totalBudgets,
      violations,
      criticalViolations,
      passRate: totalBudgets > 0 ? ((totalBudgets - violations) / totalBudgets) * 100 : 100,
    };
  }, [budgetResults]);

  // Format execution time
  const formatExecutionTime = (time: number) => {
    if (time < 1) {
      return `${(time * 1000).toFixed(2)}μs`;
    }
    if (time < 1000) {
      return `${time.toFixed(2)}ms`;
    }
    return `${(time / 1000).toFixed(2)}s`;
  };

  // Calculate health indicator color
  const getHealthColor = (
    actualValue: number,
    maxValue: number,
    type: 'executionTime' | 'memoryUsage' | 'operationsPerSecond'
  ) => {
    // For operations per second, higher is better
    if (type === 'operationsPerSecond') {
      const ratio = actualValue / maxValue;
      if (ratio >= 1.1) return '#388e3c'; // Green (10% above budget)
      if (ratio >= 1) return '#689f38'; // Light green (at budget)
      if (ratio >= 0.8) return '#ffa000'; // Amber (20% below budget)
      return '#d32f2f'; // Red (more than 20% below budget)
    }

    // For execution time and memory usage, lower is better
    const ratio = actualValue / maxValue;
    if (ratio <= 0.7) return '#388e3c'; // Green (30% below budget)
    if (ratio <= 0.9) return '#689f38'; // Light green (10% below budget)
    if (ratio <= 1) return '#ffa000'; // Amber (at budget)
    return '#d32f2f'; // Red (above budget)
  };

  return (
    <div className="performance-budget-tracker" style={{ width, height }}>
      <div className="summary-section">
        <div className="summary-stats">
          <div className="summary-item">
            <div className="summary-label">Total Budgets</div>
            <div className="summary-value">{overallStatus.totalBudgets}</div>
          </div>

          <div className="summary-item">
            <div className="summary-label">Pass Rate</div>
            <div
              className={`summary-value ${
                overallStatus.passRate < 90
                  ? 'warning'
                  : overallStatus.passRate === 100
                    ? 'success'
                    : ''
              }`}
            >
              {overallStatus.passRate.toFixed(0)}%
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-label">Violations</div>
            <div className={`summary-value ${overallStatus.violations > 0 ? 'warning' : ''}`}>
              {overallStatus.violations}
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-label">Critical Violations</div>
            <div className={`summary-value ${overallStatus.criticalViolations > 0 ? 'error' : ''}`}>
              {overallStatus.criticalViolations}
            </div>
          </div>
        </div>

        <div className="status-indicator">
          <div
            className={`status-badge ${
              overallStatus.criticalViolations > 0
                ? 'error'
                : overallStatus.violations > 0
                  ? 'warning'
                  : 'success'
            }`}
          >
            {overallStatus.criticalViolations > 0
              ? 'CRITICAL VIOLATIONS'
              : overallStatus.violations > 0
                ? 'VIOLATIONS DETECTED'
                : 'ALL BUDGETS PASSED'}
          </div>
        </div>
      </div>

      <div className="budgets-container">
        {Object.entries(groupedBudgetResults).map(([category, results]) => (
          <div key={category} className="budget-category">
            <h3 className="category-heading">
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </h3>

            <table className="budget-table">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Execution Time</th>
                  {results.some(r => r.budget.maxMemoryUsageMB !== undefined) && (
                    <th>Memory Usage</th>
                  )}
                  {results.some(r => r.budget.minOperationsPerSecond !== undefined) && (
                    <th>Operations/Sec</th>
                  )}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, index) => (
                  <tr
                    key={`${category}-${index}`}
                    className={
                      item?.violation
                        ? item?.budget.critical
                          ? 'critical-violation'
                          : 'violation'
                        : ''
                    }
                  >
                    <td className="budget-name">
                      <div>{item?.budget.name}</div>
                      {item?.budget.description && (
                        <div className="budget-description">{item?.budget.description}</div>
                      )}
                    </td>

                    <td className="budget-metric">
                      {item?.result ? (
                        <div className="metric-comparison">
                          <div
                            className="actual-value"
                            style={{
                              color: getHealthColor(
                                item?.result?.executionTimeMs,
                                item?.budget.maxExecutionTimeMs,
                                'executionTime'
                              ),
                            }}
                          >
                            {formatExecutionTime(item?.result?.executionTimeMs)}
                          </div>
                          <div className="budget-value">
                            / {formatExecutionTime(item?.budget.maxExecutionTimeMs)}
                          </div>

                          <div className="health-indicator">
                            <div
                              className="health-bar"
                              style={{
                                width: `${Math.min(100, (item?.result?.executionTimeMs / item?.budget.maxExecutionTimeMs) * 100)}%`,
                                backgroundColor: getHealthColor(
                                  item?.result?.executionTimeMs,
                                  item?.budget.maxExecutionTimeMs,
                                  'executionTime'
                                ),
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="no-data">No data</div>
                      )}
                    </td>

                    {results.some(r => r.budget.maxMemoryUsageMB !== undefined) && (
                      <td className="budget-metric">
                        {item?.result?.memoryUsageMB !== undefined &&
                        item?.budget.maxMemoryUsageMB !== undefined ? (
                          <div className="metric-comparison">
                            <div
                              className="actual-value"
                              style={{
                                color: getHealthColor(
                                  item?.result?.memoryUsageMB,
                                  item?.budget.maxMemoryUsageMB,
                                  'memoryUsage'
                                ),
                              }}
                            >
                              {item?.result?.memoryUsageMB.toFixed(1)} MB
                            </div>
                            <div className="budget-value">
                              / {item?.budget.maxMemoryUsageMB.toFixed(1)} MB
                            </div>

                            <div className="health-indicator">
                              <div
                                className="health-bar"
                                style={{
                                  width: `${Math.min(100, (item?.result?.memoryUsageMB / item?.budget.maxMemoryUsageMB) * 100)}%`,
                                  backgroundColor: getHealthColor(
                                    item?.result?.memoryUsageMB,
                                    item?.budget.maxMemoryUsageMB,
                                    'memoryUsage'
                                  ),
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="no-data">
                            {item?.budget.maxMemoryUsageMB
                              ? `Max: ${item?.budget.maxMemoryUsageMB} MB`
                              : 'N/A'}
                          </div>
                        )}
                      </td>
                    )}

                    {results.some(r => r.budget.minOperationsPerSecond !== undefined) && (
                      <td className="budget-metric">
                        {item?.result?.operationsPerSecond !== undefined &&
                        item?.budget.minOperationsPerSecond !== undefined ? (
                          <div className="metric-comparison">
                            <div
                              className="actual-value"
                              style={{
                                color: getHealthColor(
                                  item?.result?.operationsPerSecond,
                                  item?.budget.minOperationsPerSecond,
                                  'operationsPerSecond'
                                ),
                              }}
                            >
                              {item?.result?.operationsPerSecond.toFixed(0)}
                            </div>
                            <div className="budget-value">
                              / {item?.budget.minOperationsPerSecond.toFixed(0)}
                            </div>

                            <div className="health-indicator">
                              <div
                                className="health-bar"
                                style={{
                                  width: `${Math.min(100, (item?.result?.operationsPerSecond / item?.budget.minOperationsPerSecond) * 100)}%`,
                                  backgroundColor: getHealthColor(
                                    item?.result?.operationsPerSecond,
                                    item?.budget.minOperationsPerSecond,
                                    'operationsPerSecond'
                                  ),
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="no-data">
                            {item?.budget.minOperationsPerSecond
                              ? `Min: ${item?.budget.minOperationsPerSecond}`
                              : 'N/A'}
                          </div>
                        )}
                      </td>
                    )}

                    <td>
                      <div
                        className={`status-indicator ${item?.violation ? (item?.budget.critical ? 'critical' : 'failing') : 'passing'}`}
                      >
                        {item?.violation
                          ? item?.budget.critical
                            ? 'CRITICAL'
                            : 'FAILING'
                          : item?.result
                            ? 'PASSING'
                            : 'NO DATA'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <style>
        {`
        .performance-budget-tracker {
          border: 1px solid var(--gs-border);
          border-radius: 4px;
          overflow: hidden;
          background: var(--gs-surface-1);
          color: var(--gs-text-1);
        }

        .performance-budget-tracker .summary-section {
          padding: 16px;
          background-color: var(--gs-surface-2);
          border-bottom: 1px solid var(--gs-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .performance-budget-tracker .summary-stats {
          display: flex;
          gap: 24px;
        }

        .performance-budget-tracker .summary-item {
          text-align: center;
        }

        .performance-budget-tracker .summary-label {
          font-size: 12px;
          color: var(--gs-text-2);
          margin-bottom: 4px;
        }

        .performance-budget-tracker .summary-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--gs-text-1);
        }

        .performance-budget-tracker .summary-value.warning {
          color: #ffa000;
        }

        .performance-budget-tracker .summary-value.error {
          color: #d32f2f;
        }

        .performance-budget-tracker .summary-value.success {
          color: #388e3c;
        }

        .performance-budget-tracker .status-badge {
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 14px;
        }

        .performance-budget-tracker .status-badge.error {
          background-color: rgba(239, 68, 68, 0.16);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.45);
        }

        .performance-budget-tracker .status-badge.warning {
          background-color: rgba(245, 158, 11, 0.16);
          color: #fcd34d;
          border: 1px solid rgba(245, 158, 11, 0.45);
        }

        .performance-budget-tracker .status-badge.success {
          background-color: rgba(34, 197, 94, 0.16);
          color: #86efac;
          border: 1px solid rgba(34, 197, 94, 0.45);
        }

        .performance-budget-tracker .budgets-container {
          padding: 16px;
        }

        .performance-budget-tracker .budget-category {
          margin-bottom: 24px;
        }

        .performance-budget-tracker .category-heading {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 18px;
          color: var(--gs-text-1);
          padding-bottom: 8px;
          border-bottom: 1px solid var(--gs-border);
        }

        .performance-budget-tracker .budget-table {
          width: 100%;
          border-collapse: collapse;
        }

        .performance-budget-tracker .budget-table th,
        .performance-budget-tracker .budget-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid var(--gs-border);
        }

        .performance-budget-tracker .budget-table th {
          font-weight: 500;
          color: var(--gs-text-2);
          font-size: 14px;
        }

        .performance-budget-tracker .budget-table tr:last-child td {
          border-bottom: none;
        }

        .performance-budget-tracker .budget-name {
          font-weight: 500;
        }

        .performance-budget-tracker .budget-description {
          font-size: 12px;
          color: var(--gs-text-2);
          margin-top: 4px;
        }

        .performance-budget-tracker .budget-metric {
          min-width: 200px;
        }

        .performance-budget-tracker .metric-comparison {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }

        .performance-budget-tracker .actual-value {
          font-weight: 600;
          font-size: 16px;
        }

        .performance-budget-tracker .budget-value {
          color: var(--gs-text-2);
          margin-left: 4px;
          font-size: 14px;
        }

        .performance-budget-tracker .health-indicator {
          margin-top: 6px;
          height: 4px;
          background-color: rgba(88, 110, 145, 0.35);
          width: 100%;
          border-radius: 2px;
          overflow: hidden;
        }

        .performance-budget-tracker .health-bar {
          height: 100%;
          transition: width 0.3s ease;
        }

        .performance-budget-tracker .no-data {
          color: var(--gs-text-3);
          font-style: italic;
          font-size: 14px;
        }

        .performance-budget-tracker .status-indicator {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 3px;
          text-align: center;
          line-height: 1;
        }

        .performance-budget-tracker .status-indicator.passing {
          background-color: rgba(34, 197, 94, 0.14);
          color: #86efac;
        }

        .performance-budget-tracker .status-indicator.failing {
          background-color: rgba(245, 158, 11, 0.14);
          color: #fcd34d;
        }

        .performance-budget-tracker .status-indicator.critical {
          background-color: rgba(239, 68, 68, 0.14);
          color: #fca5a5;
        }

        .performance-budget-tracker tr.violation {
          background-color: rgba(245, 158, 11, 0.12);
        }

        .performance-budget-tracker tr.critical-violation {
          background-color: rgba(239, 68, 68, 0.14);
        }
        `}
      </style>
    </div>
  );
};
