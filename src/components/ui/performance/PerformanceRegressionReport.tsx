import * as d3 from 'd3';
import * as React from "react";
import { useEffect, useRef, useState } from 'react';
import {
  BenchmarkResult,
  detectPerformanceRegressions,
  loadBenchmarkResults,
} from '../../../utils/performance/benchmarks/PerformanceBenchmarkTools';
import { Button } from '../common/Button';

interface PerformanceRegressionReportProps {
  /**
   * The current benchmark results
   */
  currentResults: BenchmarkResult[];

  /**
   * Optional baseline results. If not provided, will load from storage
   */
  baselineResults?: BenchmarkResult[];

  /**
   * Regression detection threshold (percent)
   */
  threshold?: number;

  /**
   * Height of the component
   */
  height?: number;

  /**
   * Width of the component
   */
  width?: number | string;

  /**
   * Callback when baseline is updated
   */
  onBaselineUpdate?: (results: BenchmarkResult[]) => void;
}

/**
 * Performance Regression Report component
 *
 * Displays a visual report comparing current performance results against a baseline,
 * highlighting regressions and improvements.
 */
export const PerformanceRegressionReport: React.FC<PerformanceRegressionReportProps> = ({
  currentResults,
  baselineResults: propBaselineResults,
  threshold = 5,
  height = 600,
  width = '100%',
  onBaselineUpdate,
}) => {
  // References
  const chartRef = useRef<HTMLDivElement>(null);

  // State
  const [baselineResults, setBaselineResults] = useState<BenchmarkResult[]>(
    propBaselineResults ?? []
  );
  const [analysis, setAnalysis] = useState<ReturnType<typeof detectPerformanceRegressions> | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<
    'overview' | 'regressions' | 'improvements' | 'timeline'
  >('overview');

  // Load baseline results if not provided as props
  useEffect(() => {
    if (!propBaselineResults) {
      const loadedResults = loadBenchmarkResults('performance-baseline');
      if (loadedResults.length > 0) {
        setBaselineResults(loadedResults);
      }
    }
  }, [propBaselineResults]);

  // Update analysis when results change
  useEffect(() => {
    if (currentResults.length > 0 && baselineResults.length > 0) {
      const newAnalysis = detectPerformanceRegressions(currentResults, baselineResults, threshold);
      setAnalysis(newAnalysis);
    }
  }, [currentResults, baselineResults, threshold]);

  // Render timeline visualization
  useEffect(() => {
    if (chartRef.current && analysis && activeTab === 'timeline') {
      renderTimelineChart();
    }
  }, [analysis, activeTab]);

  // Set current results as baseline
  const setCurrentAsBaseline = () => {
    const confirmed = window.confirm(
      'Are you sure you want to set the current results as the new performance baseline? ' +
        'This will overwrite the previous baseline.'
    );

    if (confirmed) {
      setBaselineResults(currentResults);
      localStorage.setItem('performance-baseline', JSON.stringify(currentResults));
      if (onBaselineUpdate) {
        onBaselineUpdate(currentResults);
      }
    }
  };

  // Render timeline visualization
  const renderTimelineChart = () => {
    if (!chartRef.current || !analysis) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    // Combine benchmark names from both current and baseline
    const benchmarkNames = Array.from(
      new Set([...currentResults.map(r => r.name), ...baselineResults.map(r => r.name)])
    );

    // Prepare data for visualization
    const chartData = benchmarkNames
      .map(name => {
        const current = currentResults.find(r => r.name === name);
        const baseline = baselineResults.find(r => r.name === name);

        let status = 'unchanged';
        let percentChange = 0;

        if (current && baseline) {
          percentChange =
            ((current.executionTimeMs - baseline.executionTimeMs) / baseline.executionTimeMs) * 100;
          if (percentChange > threshold) {
            status = 'regression';
          } else if (percentChange < -threshold) {
            status = 'improvement';
          }
        }

        return {
          name,
          baseline: baseline?.executionTimeMs ?? 0,
          current: current?.executionTimeMs ?? 0,
          percentChange,
          status,
        };
      })
      .filter(d => d.baseline > 0 && d.current > 0); // Only include benchmarks present in both sets

    // Sort by percent change (worst regressions first)
    chartData.sort((a, b) => b.percentChange - a.percentChange);

    // Chart dimensions
    const margin = { top: 30, right: 80, bottom: 60, left: 200 };
    const chartWidth = 800 - margin.left - margin.right;
    const chartHeight = 500 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', chartWidth + margin.left + margin.right)
      .attr('height', chartHeight + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const y = d3
      .scaleBand()
      .domain(chartData.map(d => d.name))
      .range([0, chartHeight])
      .padding(0.1);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, d => Math.max(d.baseline, d.current)) ?? 0])
      .range([0, chartWidth]);

    // Axes
    svg
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('x', chartWidth / 2)
      .attr('y', 40)
      .attr('fill', 'currentColor')
      .attr('text-anchor', 'middle')
      .text('Execution Time (ms)');

    svg
      .append('g')
      .attr('class', 'y axis')
      .call(d3.axisLeft(y))
      .selectAll('.tick text')
      .call(wrap, 180); // Wrap long test names

    // Bars
    const barGroups = svg
      .selectAll('.bar-group')
      .data(chartData)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .attr('transform', d => `translate(0,${y(d.name) ?? 0})`);

    // Baseline bars
    barGroups
      .append('rect')
      .attr('class', 'bar baseline-bar')
      .attr('y', 0)
      .attr('x', 0)
      .attr('height', y.bandwidth() / 2 - 2)
      .attr('width', d => x(d.baseline))
      .attr('fill', '#b3b3b3');

    // Current bars
    barGroups
      .append('rect')
      .attr('class', 'bar current-bar')
      .attr('y', y.bandwidth() / 2 + 2)
      .attr('x', 0)
      .attr('height', y.bandwidth() / 2 - 2)
      .attr('width', d => x(d.current))
      .attr('fill', d => {
        if (d.status === 'regression') return '#e15759'; // Red for regression
        if (d.status === 'improvement') return '#4e79a7'; // Blue for improvement
        return '#59a14f'; // Green for unchanged
      });

    // Add percent change labels
    barGroups
      .append('text')
      .attr('class', 'percent-change')
      .attr('x', d => x(Math.max(d.baseline, d.current)) + 5)
      .attr('y', y.bandwidth() / 2 + 4)
      .attr('alignment-baseline', 'middle')
      .attr('fill', d => {
        if (d.status === 'regression') return '#e15759';
        if (d.status === 'improvement') return '#4e79a7';
        return '#59a14f';
      })
      .text(d => {
        const sign = d.percentChange > 0 ? '+' : '';
        return `${sign}${d.percentChange.toFixed(1)}%`;
      });

    // Legend
    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${chartWidth - 100}, -20)`);

    const legendItems = [
      { label: 'Baseline', color: '#b3b3b3', y: 0 },
      { label: 'Current', color: '#777777', y: 15 },
      { label: 'Regression', color: '#e15759', y: 30 },
      { label: 'Improvement', color: '#4e79a7', y: 45 },
    ];

    legend
      .selectAll('.legend-item')
      .data(legendItems)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', d => `translate(0, ${d.y})`)
      .each(function (d) {
        d3.select(this).append('rect').attr('width', 12).attr('height', 12).attr('fill', d.color);

        d3.select(this)
          .append('text')
          .attr('x', 16)
          .attr('y', 9)
          .attr('font-size', '10px')
          .text(d.label);
      });
  };

  // Helper function to wrap long text labels
  const wrap = (text: d3.Selection<d3.BaseType, unknown, d3.BaseType, unknown>, width: number) => {
    text.each(function () {
      const text = d3.select(this);
      const words = text.text().split(/\s+/).reverse();
      let word;
      let line: string[] = [];
      let lineNumber = 0;
      const lineHeight = 1.1; // ems
      const y = text.attr('y');
      const dy = parseFloat(text.attr('dy') || '0');
      let tspan = text
        .text(null)
        .append('tspan')
        .attr('x', -9)
        .attr('y', y)
        .attr('dy', dy + 'em');

      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(' '));
        const tspanNode = tspan.node();
        if (tspanNode && tspanNode.getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text
            .append('tspan')
            .attr('x', -9)
            .attr('y', y)
            .attr('dy', ++lineNumber * lineHeight + dy + 'em')
            .text(word);
        }
      }
    });
  };

  if (!analysis) {
    return (
      <div className="performance-regression-report">
        <div className="loading-message">
          {baselineResults.length === 0
            ? 'No baseline results available. Run benchmarks to establish a baseline.'
            : 'Loading regression analysis...'}
        </div>

        {baselineResults.length === 0 && currentResults.length > 0 && (
          <Button onClick={setCurrentAsBaseline}>Set Current Results as Baseline</Button>
        )}
      </div>
    );
  }

  return (
    <div className="performance-regression-report" style={{ width, height }}>
      <div className="report-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'regressions' ? 'active' : ''}`}
          onClick={() => setActiveTab('regressions')}
          disabled={analysis.regressions.length === 0}
        >
          Regressions ({analysis.regressions.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'improvements' ? 'active' : ''}`}
          onClick={() => setActiveTab('improvements')}
          disabled={analysis.improvements.length === 0}
        >
          Improvements ({analysis.improvements.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
      </div>

      <div className="report-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="summary-cards">
              <div className="summary-card">
                <div className="card-title">Total Tests</div>
                <div className="card-value">{analysis.summary.totalTests}</div>
              </div>
              <div className="summary-card regression">
                <div className="card-title">Regressions</div>
                <div className="card-value">{analysis.summary.regressionCount}</div>
              </div>
              <div className="summary-card improvement">
                <div className="card-title">Improvements</div>
                <div className="card-value">{analysis.summary.improvementCount}</div>
              </div>
              <div className="summary-card">
                <div className="card-title">Unchanged</div>
                <div className="card-value">{analysis.summary.unchangedCount}</div>
              </div>
            </div>

            <div className="actions">
              <Button onClick={setCurrentAsBaseline}>Set as New Baseline</Button>
            </div>

            {analysis.regressions.length > 0 && (
              <div className="section">
                <h3>Top Regressions</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Baseline (ms)</th>
                      <th>Current (ms)</th>
                      <th>Change (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.regressions
                      .sort((a, b) => b.percentChange - a.percentChange)
                      .slice(0, 5)
                      .map((regression, index) => (
                        <tr key={`regression-${index}`}>
                          <td>{regression.name}</td>
                          <td>{regression.baselineTime.toFixed(2)}</td>
                          <td>{regression.newTime.toFixed(2)}</td>
                          <td className="regression">+{regression.percentChange.toFixed(2)}%</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {analysis.improvements.length > 0 && (
              <div className="section">
                <h3>Top Improvements</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Baseline (ms)</th>
                      <th>Current (ms)</th>
                      <th>Change (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.improvements
                      .sort((a, b) => a.percentChange - b.percentChange)
                      .slice(0, 5)
                      .map((improvement, index) => (
                        <tr key={`improvement-${index}`}>
                          <td>{improvement.name}</td>
                          <td>{improvement.baselineTime.toFixed(2)}</td>
                          <td>{improvement.newTime.toFixed(2)}</td>
                          <td className="improvement">{improvement.percentChange.toFixed(2)}%</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'regressions' && (
          <div className="regressions-tab">
            {analysis.regressions.length === 0 ? (
              <div className="empty-message">No regressions detected! 🎉</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Baseline (ms)</th>
                    <th>Current (ms)</th>
                    <th>Change (%)</th>
                    <th>Absolute Diff (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.regressions
                    .sort((a, b) => b.percentChange - a.percentChange)
                    .map((regression, index) => (
                      <tr key={`regression-full-${index}`}>
                        <td>{regression.name}</td>
                        <td>{regression.baselineTime.toFixed(2)}</td>
                        <td>{regression.newTime.toFixed(2)}</td>
                        <td className="regression">+{regression.percentChange.toFixed(2)}%</td>
                        <td>{(regression.newTime - regression.baselineTime).toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'improvements' && (
          <div className="improvements-tab">
            {analysis.improvements.length === 0 ? (
              <div className="empty-message">No improvements detected.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Baseline (ms)</th>
                    <th>Current (ms)</th>
                    <th>Change (%)</th>
                    <th>Absolute Diff (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.improvements
                    .sort((a, b) => a.percentChange - b.percentChange)
                    .map((improvement, index) => (
                      <tr key={`improvement-full-${index}`}>
                        <td>{improvement.name}</td>
                        <td>{improvement.baselineTime.toFixed(2)}</td>
                        <td>{improvement.newTime.toFixed(2)}</td>
                        <td className="improvement">{improvement.percentChange.toFixed(2)}%</td>
                        <td>{(improvement.newTime - improvement.baselineTime).toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="timeline-tab">
            <div ref={chartRef} className="timeline-chart"></div>
          </div>
        )}
      </div>

      <style jsx>{`
        .performance-regression-report {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
            'Open Sans', 'Helvetica Neue', sans-serif;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .report-tabs {
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

        .tab-button:disabled {
          color: #999;
          cursor: not-allowed;
        }

        .report-content {
          padding: 16px;
          overflow-y: auto;
          flex: 1;
        }

        .summary-cards {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-card {
          background-color: #f9f9f9;
          border-radius: 4px;
          padding: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .summary-card.regression {
          background-color: #ffebee;
        }

        .summary-card.improvement {
          background-color: #e8f5e9;
        }

        .card-title {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .card-value {
          font-size: 28px;
          font-weight: 600;
        }

        .actions {
          margin: 24px 0;
        }

        .section {
          margin-top: 24px;
        }

        .section h3 {
          margin-bottom: 12px;
          font-size: 16px;
          color: #333;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .data-table th {
          background-color: #f5f5f5;
          font-weight: 500;
        }

        .data-table tr:last-child td {
          border-bottom: none;
        }

        .regression {
          color: #d32f2f;
        }

        .improvement {
          color: #388e3c;
        }

        .empty-message {
          padding: 32px;
          text-align: center;
          color: #666;
        }

        .timeline-chart {
          width: 100%;
          height: 500px;
          overflow: auto;
        }

        .loading-message {
          padding: 32px;
          text-align: center;
          color: #666;
        }
      `}</style>
    </div>
  );
};
