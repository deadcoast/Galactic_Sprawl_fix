import * as d3 from 'd3';
import * as React from "react";
import { useEffect, useRef, useState } from 'react';
import { MetricPoint, PerformanceMetrics } from './performanceTypes';

/**
 * Interface for statistical anomaly detection configuration
 */
interface AnomalyDetectionConfig {
  // Z-score threshold for detecting anomalies (default: 3)
  zScoreThreshold: number;
  // Minimum number of data points required for analysis
  minDataPoints: number;
  // Whether to use rolling window for calculations
  useRollingWindow: boolean;
  // Size of rolling window for calculations
  rollingWindowSize: number;
  // Metrics to analyze for anomalies
  metricsToAnalyze: Array<keyof PerformanceMetrics>;
}

/**
 * Interface for detected anomaly
 */
export interface Anomaly {
  metric: keyof PerformanceMetrics;
  timestamp: number;
  value: number;
  zScore: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

/**
 * Interface for metric correlation result
 */
export interface MetricCorrelation {
  metricX: keyof PerformanceMetrics;
  metricY: keyof PerformanceMetrics;
  correlationCoefficient: number;
  significance: 'none' | 'weak' | 'moderate' | 'strong';
}

/**
 * Interface for metric pattern
 */
export interface MetricPattern {
  metric: keyof PerformanceMetrics;
  pattern: 'increasing' | 'decreasing' | 'stable' | 'fluctuating' | 'cyclic';
  confidence: number;
  description: string;
}

interface AdvancedMetricAnalysisProps {
  // Performance metrics to analyze
  metrics: PerformanceMetrics;
  // Width of the component
  width?: number;
  // Height of the component
  height?: number;
  // Configuration for anomaly detection
  anomalyConfig?: Partial<AnomalyDetectionConfig>;
  // Whether to show detailed analysis
  showDetailed?: boolean;
}

/**
 * A component that provides advanced metric analysis capabilities,
 * including statistical anomaly detection, pattern recognition,
 * and correlation analysis.
 */
const AdvancedMetricAnalysis: React.FC<AdvancedMetricAnalysisProps> = ({
  metrics,
  width = 1200,
  height = 800,
  anomalyConfig = {},
  showDetailed = true,
}) => {
  // Reference for the chart container
  const chartRef = useRef<HTMLDivElement>(null);

  // Anomaly detection configuration with defaults
  const config: AnomalyDetectionConfig = {
    zScoreThreshold: anomalyConfig.zScoreThreshold ?? 3,
    minDataPoints: anomalyConfig.minDataPoints ?? 10,
    useRollingWindow: anomalyConfig.useRollingWindow ?? true,
    rollingWindowSize: anomalyConfig.rollingWindowSize ?? 20,
    metricsToAnalyze: anomalyConfig.metricsToAnalyze ?? ['fps', 'renderTime', 'cpuTime'],
  };

  // State for detected anomalies
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  // State for metric correlations
  const [correlations, setCorrelations] = useState<MetricCorrelation[]>([]);

  // State for detected patterns
  const [patterns, setPatterns] = useState<MetricPattern[]>([]);

  // Initialize and update charts when metrics change
  useEffect(() => {
    if (metrics && Object.values(metrics).some(arr => arr.length > 0)) {
      setupCharts();
      detectAnomalies();
      analyzeCorrelations();
      detectPatterns();
    }
  }, [metrics]);

  // Set up the visualization charts
  const setupCharts = () => {
    if (!chartRef.current) return;

    // Clear previous charts
    d3.select(chartRef.current).selectAll('*').remove();

    // Set up the SVG container
    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(50, 20)');

    // Calculate chart dimensions
    const chartWidth = width - 100;
    const chartHeight = height - 100;

    // Create charts for each metric
    config.metricsToAnalyze.forEach((metric, index) => {
      const metricData = metrics[metric];
      if (!metricData || metricData.length === 0) return;

      // Calculate y position for this chart
      const yPos = index * (chartHeight / config.metricsToAnalyze.length);
      const chartHeight_i = chartHeight / config.metricsToAnalyze.length - 40;

      // Create a group for this chart
      const chartGroup = svg.append('g').attr('transform', `translate(0, ${yPos})`);

      // Add title
      chartGroup.append('text').attr('x', 0).attr('y', 0).attr('dy', '0.35em').text(metric);

      // Create scales
      const xScale = d3
        .scaleTime()
        .domain(d3.extent(metricData, d => new Date(d.timestamp)) as [Date, Date])
        .range([0, chartWidth]);

      const yScale = d3
        .scaleLinear()
        .domain([
          (d3.min(metricData, d => d.value) as number) * 0.9,
          (d3.max(metricData, d => d.value) as number) * 1.1,
        ])
        .range([chartHeight_i, 0]);

      // Create axes
      const xAxis = d3.axisBottom(xScale).ticks(5);
      // Let d3 handle the default time formatting

      const yAxis = d3.axisLeft(yScale).ticks(5);

      // Add axes
      chartGroup.append('g').attr('transform', `translate(0, ${chartHeight_i})`).call(xAxis);

      chartGroup.append('g').call(yAxis);

      // Create line generator
      const line = d3
        .line<MetricPoint>()
        .x(d => xScale(new Date(d.timestamp)))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

      // Add line
      chartGroup
        .append('path')
        .datum(metricData)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('d', line);

      // Add anomaly points
      const metricAnomalies = anomalies.filter(a => a.metric === metric);

      chartGroup
        .selectAll('.anomaly-point')
        .data(metricAnomalies)
        .enter()
        .append('circle')
        .attr('class', 'anomaly-point')
        .attr('cx', d => xScale(new Date(d.timestamp)))
        .attr('cy', d => yScale(d.value))
        .attr('r', 5)
        .attr('fill', d => {
          switch (d.severity) {
            case 'high':
              return 'red';
            case 'medium':
              return 'orange';
            case 'low':
              return 'yellow';
            default:
              return 'gray';
          }
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);
    });
  };

  // Detect anomalies in the metrics
  const detectAnomalies = () => {
    const newAnomalies: Anomaly[] = [];

    config.metricsToAnalyze.forEach(metric => {
      const metricData = metrics[metric];
      if (!metricData || metricData.length < config.minDataPoints) return;

      // Calculate mean and standard deviation
      const values = metricData.map(d => d.value);
      const mean = d3.mean(values) as number;
      const stdDev = d3.deviation(values) as number;

      if (stdDev === 0) return; // Skip if no deviation

      // Check each data point for anomalies
      metricData.forEach(point => {
        const zScore = Math.abs((point.value - mean) / stdDev);

        if (zScore > config.zScoreThreshold) {
          // Determine severity based on z-score
          let severity: 'low' | 'medium' | 'high';
          if (zScore > config.zScoreThreshold * 2) {
            severity = 'high';
          } else if (zScore > config.zScoreThreshold * 1.5) {
            severity = 'medium';
          } else {
            severity = 'low';
          }

          // Create message based on direction of anomaly
          const direction = point.value > mean ? 'high' : 'low';
          const message = `Unusually ${direction} ${metric} value detected (${point.value.toFixed(2)})`;

          newAnomalies.push({
            metric,
            timestamp: point.timestamp,
            value: point.value,
            zScore,
            severity,
            message,
          });
        }
      });
    });

    setAnomalies(newAnomalies);
  };

  // Analyze correlations between metrics
  const analyzeCorrelations = () => {
    const newCorrelations: MetricCorrelation[] = [];
    const metricsKeys = Object.keys(metrics) as Array<keyof PerformanceMetrics>;

    // For each pair of metrics
    for (let i = 0; i < metricsKeys.length; i++) {
      for (let j = i + 1; j < metricsKeys.length; j++) {
        const metricX = metricsKeys[i];
        const metricY = metricsKeys[j];

        const dataX = metrics[metricX];
        const dataY = metrics[metricY];

        if (
          !dataX ||
          !dataY ||
          dataX.length < config.minDataPoints ||
          dataY.length < config.minDataPoints
        )
          continue;

        // Ensure we have matching timestamps
        const pairedData: Array<[number, number]> = [];

        dataX.forEach(pointX => {
          const matchingY = dataY.find(pointY => pointY.timestamp === pointX.timestamp);
          if (matchingY) {
            pairedData.push([pointX.value, matchingY.value]);
          }
        });

        if (pairedData.length < config.minDataPoints) continue;

        // Calculate Pearson correlation coefficient
        const n = pairedData.length;
        const sumX = pairedData.reduce((sum, [x]) => sum + x, 0);
        const sumY = pairedData.reduce((sum, [, y]) => sum + y, 0);
        const sumXY = pairedData.reduce((sum, [x, y]) => sum + x * y, 0);
        const sumXX = pairedData.reduce((sum, [x]) => sum + x * x, 0);
        const sumYY = pairedData.reduce((sum, [, y]) => sum + y * y, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

        if (denominator === 0) continue;

        const correlation = numerator / denominator;

        // Determine significance
        let significance: 'none' | 'weak' | 'moderate' | 'strong';
        const absCorrelation = Math.abs(correlation);

        if (absCorrelation < 0.3) {
          significance = 'none';
        } else if (absCorrelation < 0.5) {
          significance = 'weak';
        } else if (absCorrelation < 0.7) {
          significance = 'moderate';
        } else {
          significance = 'strong';
        }

        newCorrelations.push({
          metricX,
          metricY,
          correlationCoefficient: correlation,
          significance,
        });
      }
    }

    setCorrelations(newCorrelations);
  };

  // Detect patterns in the metrics
  const detectPatterns = () => {
    const newPatterns: MetricPattern[] = [];

    config.metricsToAnalyze.forEach(metric => {
      const metricData = metrics[metric];
      if (!metricData || metricData.length < config.minDataPoints) return;

      // Sort by timestamp
      const sortedData = [...metricData].sort((a, b) => a.timestamp - b.timestamp);
      const values = sortedData.map(d => d.value);

      // Calculate trend using linear regression
      const n = values.length;
      const indices = Array.from({ length: n }, (_, i) => i);

      const sumX = indices.reduce((sum, x) => sum + x, 0);
      const sumY = values.reduce((sum, y) => sum + y, 0);
      const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
      const sumXX = indices.reduce((sum, x) => sum + x * x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

      // Calculate fluctuation
      const diffs = values.slice(1).map((v, i) => v - values[i]);
      const signChanges = diffs
        .slice(1)
        .filter((d, i) => Math.sign(d) !== Math.sign(diffs[i])).length;
      const fluctuationRate = signChanges / (n - 2);

      // Determine pattern
      let pattern: 'increasing' | 'decreasing' | 'stable' | 'fluctuating' | 'cyclic';
      let confidence = 0;
      let description = '';

      if (fluctuationRate > 0.5) {
        // Check for cyclic pattern using autocorrelation
        const autocorrelation = calculateAutocorrelation(values);
        const maxLag = Math.min(30, Math.floor(n / 3));
        const peaks = findPeaks(autocorrelation.slice(1, maxLag + 1));

        if (peaks.length > 0) {
          pattern = 'cyclic';
          confidence = 0.7 + (peaks.length > 1 ? 0.2 : 0);
          const period = peaks[0] + 1; // +1 because we sliced off lag 0
          description = `Cyclic pattern detected with period of ~${period} data points`;
        } else {
          pattern = 'fluctuating';
          confidence = 0.5 + fluctuationRate * 0.3;
          description = `Fluctuating pattern with ${(fluctuationRate * 100).toFixed(0)}% direction changes`;
        }
      } else if (Math.abs(slope) < 0.01) {
        pattern = 'stable';
        confidence = 0.8 - fluctuationRate;
        description = 'Stable pattern with minimal trend';
      } else if (slope > 0) {
        pattern = 'increasing';
        confidence = 0.7 + Math.min(0.3, Math.abs(slope) * 10);
        description = `Increasing trend with slope of ${slope.toFixed(4)}`;
      } else {
        pattern = 'decreasing';
        confidence = 0.7 + Math.min(0.3, Math.abs(slope) * 10);
        description = `Decreasing trend with slope of ${slope.toFixed(4)}`;
      }

      newPatterns.push({
        metric,
        pattern,
        confidence,
        description,
      });
    });

    setPatterns(newPatterns);
  };

  // Helper function to calculate autocorrelation
  const calculateAutocorrelation = (values: number[]) => {
    const n = values.length;
    const mean = d3.mean(values) as number;
    const variance = d3.variance(values) as number;

    if (variance === 0) return Array(n).fill(0);

    const normalizedValues = values.map(v => (v - mean) / Math.sqrt(variance));
    const result: number[] = [];

    for (let lag = 0; lag < n; lag++) {
      let sum = 0;

      for (let i = 0; i < n - lag; i++) {
        sum += normalizedValues[i] * normalizedValues[i + lag];
      }

      result.push(sum / (n - lag));
    }

    return result;
  };

  // Helper function to find peaks in autocorrelation
  const findPeaks = (values: number[]) => {
    const peaks: number[] = [];

    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] > values[i - 1] && values[i] > values[i + 1] && values[i] > 0.2) {
        peaks.push(i);
      }
    }

    return peaks;
  };

  return (
    <div className="advanced-metric-analysis">
      <h2>Advanced Metric Analysis</h2>

      <div className="analysis-tabs">
        <div className="tab-buttons">
          <button className="tab-button active">Anomaly Detection</button>
          <button className="tab-button">Correlation Analysis</button>
          <button className="tab-button">Pattern Recognition</button>
        </div>

        <div className="tab-content">
          <div className="anomaly-detection">
            <h3>Statistical Anomaly Detection</h3>

            <div className="chart-container" ref={chartRef}></div>

            {anomalies.length > 0 ? (
              <div className="anomalies-list">
                <h4>Detected Anomalies ({anomalies.length})</h4>
                <table className="anomalies-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Timestamp</th>
                      <th>Value</th>
                      <th>Z-Score</th>
                      <th>Severity</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalies.map((anomaly, index) => (
                      <tr key={index} className={`severity-${anomaly.severity}`}>
                        <td>{anomaly.metric}</td>
                        <td>{new Date(anomaly.timestamp).toLocaleTimeString()}</td>
                        <td>{anomaly.value.toFixed(2)}</td>
                        <td>{anomaly.zScore.toFixed(2)}</td>
                        <td>{anomaly.severity}</td>
                        <td>{anomaly.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-anomalies">
                <p>
                  No anomalies detected with current threshold (Z-Score &gt;{' '}
                  {config.zScoreThreshold})
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDetailed && (
        <div className="detailed-analysis">
          <div className="correlation-analysis">
            <h3>Correlation Analysis</h3>

            {correlations.length > 0 ? (
              <table className="correlation-table">
                <thead>
                  <tr>
                    <th>Metric X</th>
                    <th>Metric Y</th>
                    <th>Correlation</th>
                    <th>Significance</th>
                  </tr>
                </thead>
                <tbody>
                  {correlations.map((correlation, index) => (
                    <tr key={index} className={`significance-${correlation.significance}`}>
                      <td>{correlation.metricX}</td>
                      <td>{correlation.metricY}</td>
                      <td>{correlation.correlationCoefficient.toFixed(4)}</td>
                      <td>{correlation.significance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No significant correlations found</p>
            )}
          </div>

          <div className="pattern-recognition">
            <h3>Pattern Recognition</h3>

            {patterns.length > 0 ? (
              <table className="pattern-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Pattern</th>
                    <th>Confidence</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {patterns.map((pattern, index) => (
                    <tr key={index} className={`pattern-${pattern.pattern}`}>
                      <td>{pattern.metric}</td>
                      <td>{pattern.pattern}</td>
                      <td>{(pattern.confidence * 100).toFixed(1)}%</td>
                      <td>{pattern.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No patterns detected</p>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .advanced-metric-analysis {
          padding: 20px;
          font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            sans-serif;
        }

        h2 {
          color: #333;
          border-bottom: 2px solid #4285f4;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }

        h3 {
          color: #4285f4;
          margin-top: 0;
          margin-bottom: 15px;
        }

        .analysis-tabs {
          margin-bottom: 30px;
        }

        .tab-buttons {
          display: flex;
          border-bottom: 1px solid #ddd;
          margin-bottom: 20px;
        }

        .tab-button {
          padding: 10px 20px;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
          opacity: 0.7;
          position: relative;
        }

        .tab-button.active {
          opacity: 1;
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background: #4285f4;
        }

        .chart-container {
          height: 400px;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .anomalies-list,
        .correlation-analysis,
        .pattern-recognition {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .anomalies-list h4,
        .correlation-analysis h3,
        .pattern-recognition h3 {
          padding: 15px;
          margin: 0;
          background: #f5f5f5;
          border-bottom: 1px solid #ddd;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        th {
          background: #f9f9f9;
          font-weight: 500;
        }

        .severity-high {
          background-color: rgba(234, 67, 53, 0.1);
        }

        .severity-medium {
          background-color: rgba(251, 188, 5, 0.1);
        }

        .severity-low {
          background-color: rgba(66, 133, 244, 0.1);
        }

        .significance-strong {
          background-color: rgba(52, 168, 83, 0.1);
        }

        .significance-moderate {
          background-color: rgba(66, 133, 244, 0.1);
        }

        .significance-weak {
          background-color: rgba(251, 188, 5, 0.1);
        }

        .pattern-increasing {
          background-color: rgba(52, 168, 83, 0.1);
        }

        .pattern-decreasing {
          background-color: rgba(234, 67, 53, 0.1);
        }

        .pattern-stable {
          background-color: rgba(66, 133, 244, 0.1);
        }

        .pattern-fluctuating,
        .pattern-cyclic {
          background-color: rgba(251, 188, 5, 0.1);
        }

        .no-anomalies {
          padding: 20px;
          text-align: center;
          color: #666;
        }

        .detailed-analysis {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }

        .correlation-analysis,
        .pattern-recognition {
          flex: 1;
          min-width: 300px;
        }
      `}</style>
    </div>
  );
};

export default AdvancedMetricAnalysis;
