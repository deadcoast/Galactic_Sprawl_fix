import * as d3 from 'd3';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../../services/logging/ErrorLoggingService';
import { SessionPerformanceData } from '../../../services/telemetry/SessionPerformanceTracker';
import {
  BehaviorPerformanceCorrelation,
  UserBehaviorCorrelationAnalysis,
  UserBehaviorPattern,
} from '../../../services/telemetry/UserBehaviorCorrelationAnalysis';

interface UserBehaviorCorrelationViewProps {
  sessions: SessionPerformanceData[];
  width?: number;
  height?: number;
  onInsightSelected?: (insight: string) => void;
}

/**
 * A component that visualizes correlations between user behavior and performance
 */
const UserBehaviorCorrelationView: React.FC<UserBehaviorCorrelationViewProps> = ({
  sessions,
  width = 800,
  height = 600,
  onInsightSelected,
}) => {
  // References for chart containers
  const correlationChartRef = useRef<HTMLDivElement>(null);
  const patternChartRef = useRef<HTMLDivElement>(null);

  // Analysis service
  const [analyzer] = useState(() => new UserBehaviorCorrelationAnalysis());

  // Analysis results
  const [correlations, setCorrelations] = useState<BehaviorPerformanceCorrelation[]>([]);
  const [patterns, setPatterns] = useState<UserBehaviorPattern[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected items for details
  const [selectedCorrelation, setSelectedCorrelation] =
    useState<BehaviorPerformanceCorrelation | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<UserBehaviorPattern | null>(null);

  // Filter state
  const [significanceFilter, setSignificanceFilter] = useState<string>('all');
  const [patternTypeFilter, setPatternTypeFilter] = useState<string>('all');

  // Perform analysis when sessions change
  useEffect(() => {
    if (!sessions || sessions.length === 0) {
      setCorrelations([]);
      setPatterns([]);
      setInsights([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Use setTimeout to prevent UI blocking
    setTimeout(() => {
      try {
        // Analyze correlations
        const newCorrelations = analyzer.analyzeCorrelations(sessions);
        setCorrelations(newCorrelations);

        // Identify patterns
        const newPatterns = analyzer.identifyBehaviorPatterns(sessions);
        setPatterns(newPatterns);

        // Generate insights
        const newInsights = generateInsights(newCorrelations, newPatterns);
        setInsights(newInsights);

        setIsLoading(false);
      } catch (error) {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error('Error analyzing user behavior correlations'),
          ErrorType.RUNTIME,
          ErrorSeverity.MEDIUM,
          { componentName: 'UserBehaviorCorrelationView', action: 'analyzeDataEffect' }
        );
        setIsLoading(false);
      }
    }, 0);
  }, [sessions, analyzer]);

  // Set up charts when data or container changes
  useEffect(() => {
    if (correlations.length > 0 && correlationChartRef.current) {
      setupCorrelationChart();
    }

    if (patterns.length > 0 && patternChartRef.current) {
      setupPatternChart();
    }
  }, [correlations, patterns, significanceFilter, patternTypeFilter, width, height]);

  /**
   * Generate insights from correlations and patterns
   */
  const generateInsights = (
    correlations: BehaviorPerformanceCorrelation[],
    patterns: UserBehaviorPattern[]
  ): string[] => {
    const insights: string[] = [];

    // Add correlation insights
    const strongCorrelations = correlations.filter(c => c.significance === 'strong');
    const moderateCorrelations = correlations.filter(c => c.significance === 'moderate');

    if (strongCorrelations.length > 0) {
      strongCorrelations.forEach(correlation => {
        insights.push(`Strong correlation detected: ${correlation.description}`);
      });
    }

    if (moderateCorrelations.length > 0) {
      // Limit to top 3 moderate correlations by absolute correlation coefficient
      const topModerate = moderateCorrelations
        .sort((a, b) => Math.abs(b.correlationCoefficient) - Math.abs(a.correlationCoefficient))
        .slice(0, 3);

      topModerate.forEach(correlation => {
        insights.push(`Moderate correlation detected: ${correlation.description}`);
      });
    }

    // Add pattern insights
    const highImpactPatterns = patterns
      .filter(p => p.impactScore >= 0.7)
      .sort((a, b) => b.impactScore - a.impactScore);

    if (highImpactPatterns.length > 0) {
      // Limit to top 3 high impact patterns
      highImpactPatterns.slice(0, 3).forEach(pattern => {
        insights.push(`High-impact user behavior pattern: ${pattern.description}`);
      });
    }

    // Add combined insights if possible
    const combinedInsights = generateCombinedInsights(correlations, patterns);
    insights.push(...combinedInsights);

    return insights;
  };

  /**
   * Generate insights that combine correlations and patterns
   */
  const generateCombinedInsights = (
    correlations: BehaviorPerformanceCorrelation[],
    patterns: UserBehaviorPattern[]
  ): string[] => {
    const insights: string[] = [];

    // Look for patterns that relate to metrics with strong correlations
    const significantCorrelations = correlations.filter(
      c => c.significance === 'strong' || c.significance === 'moderate'
    );

    for (const pattern of patterns) {
      const relatedCorrelations = significantCorrelations.filter(
        correlation =>
          pattern.relatedMetrics.includes(correlation.behaviorMetric) ||
          pattern.relatedMetrics.includes(correlation.performanceMetric)
      );

      if (relatedCorrelations.length > 0) {
        const correlation = relatedCorrelations[0]; // Take the first related correlation

        insights.push(
          `${pattern.description} shows a ${correlation.significance} correlation with ${correlation.performanceMetric}`
        );
      }
    }

    return insights;
  };

  /**
   * Set up the correlation visualization chart
   */
  const setupCorrelationChart = () => {
    if (!correlationChartRef.current) {
      return;
    }

    // Clear previous chart
    d3.select(correlationChartRef.current).select('svg').remove();

    // Filter correlations
    const filteredCorrelations = correlations.filter(
      correlation => significanceFilter === 'all' || correlation.significance === significanceFilter
    );

    if (filteredCorrelations.length === 0) {
      return;
    }

    // Set up dimensions
    const chartWidth = Math.min(width - 40, 700);
    const chartHeight = Math.min(height / 2 - 40, 300);
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const innerWidth = chartWidth - margin.left - margin.right;
    const innerHeight = chartHeight - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(correlationChartRef.current)
      .append('svg')
      .attr('width', chartWidth)
      .attr('height', chartHeight);

    // Create chart group
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Set up scales
    const xScale = d3
      .scaleBand()
      .domain(filteredCorrelations.map(c => c.behaviorMetric))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3
      .scaleBand()
      .domain(filteredCorrelations.map(c => c.performanceMetric))
      .range([0, innerHeight])
      .padding(0.2);

    const colorScale = d3
      .scaleLinear<string>()
      .domain([-1, 0, 1])
      .range(['#d73027', '#f7f7f7', '#1a9850']);

    // Create heatmap cells
    chart
      .selectAll('rect')
      .data(filteredCorrelations)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.behaviorMetric) ?? 0)
      .attr('y', d => yScale(d.performanceMetric) ?? 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.correlationCoefficient))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedCorrelation(d);
      })
      .append('title')
      .text(d => d.description);

    // Add correlation coefficient text
    chart
      .selectAll('text.coefficient')
      .data(filteredCorrelations)
      .enter()
      .append('text')
      .attr('class', 'coefficient')
      .attr('x', d => (xScale(d.behaviorMetric) ?? 0) + xScale.bandwidth() / 2)
      .attr('y', d => (yScale(d.performanceMetric) ?? 0) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', d => (Math.abs(d.correlationCoefficient) > 0.6 ? '#fff' : '#000'))
      .attr('font-size', '10px')
      .text(d => d.correlationCoefficient.toFixed(2));

    // Add x-axis
    chart
      .append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end')
      .attr('x', -8)
      .attr('y', 8);

    // Add y-axis
    chart.append('g').call(d3.axisLeft(yScale));

    // Add axis labels
    svg
      .append('text')
      .attr('x', margin.left + innerWidth / 2)
      .attr('y', chartHeight - 5)
      .attr('text-anchor', 'middle')
      .text('User Behavior Metrics');

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(margin.top + innerHeight / 2))
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .text('Performance Metrics');
  };

  /**
   * Set up the pattern visualization chart
   */
  const setupPatternChart = () => {
    if (!patternChartRef.current) {
      return;
    }

    // Clear previous chart
    d3.select(patternChartRef.current).select('svg').remove();

    // Filter patterns
    const filteredPatterns = patterns.filter(
      pattern => patternTypeFilter === 'all' || pattern.patternType === patternTypeFilter
    );

    if (filteredPatterns.length === 0) {
      return;
    }

    // Sort patterns by impact score
    const sortedPatterns = [...filteredPatterns].sort((a, b) => b.impactScore - a.impactScore);

    // Set up dimensions
    const chartWidth = Math.min(width - 40, 700);
    const chartHeight = Math.min(height / 2 - 40, 300);
    const margin = { top: 20, right: 30, bottom: 60, left: 160 };
    const innerWidth = chartWidth - margin.left - margin.right;
    const innerHeight = chartHeight - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(patternChartRef.current)
      .append('svg')
      .attr('width', chartWidth)
      .attr('height', chartHeight);

    // Create chart group
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Set up scales
    const xScale = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);

    const yScale = d3
      .scaleBand()
      .domain(sortedPatterns.map((_, i) => i.toString()))
      .range([0, innerHeight])
      .padding(0.2);

    const colorScale = d3
      .scaleOrdinal<string>()
      .domain([
        'frequent_interaction',
        'rapid_sequence',
        'complex_operation',
        'sustained_activity',
        'custom',
      ])
      .range(['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00']);

    // Create pattern bars
    chart
      .selectAll('rect')
      .data(sortedPatterns)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d, i) => yScale(i.toString()) ?? 0)
      .attr('width', d => xScale(d.impactScore))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.patternType))
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedPattern(d);
      })
      .append('title')
      .text(d => d.description);

    // Add confidence markers
    chart
      .selectAll('line.confidence')
      .data(sortedPatterns)
      .enter()
      .append('line')
      .attr('class', 'confidence')
      .attr('x1', d => xScale(d.confidence))
      .attr('y1', (d, i) => (yScale(i.toString()) ?? 0) - 3)
      .attr('x2', d => xScale(d.confidence))
      .attr('y2', (d, i) => (yScale(i.toString()) ?? 0) + yScale.bandwidth() + 3)
      .attr('stroke', '#000')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,3');

    // Add pattern description text
    chart
      .selectAll('text.description')
      .data(sortedPatterns)
      .enter()
      .append('text')
      .attr('class', 'description')
      .attr('x', -5)
      .attr('y', (d, i) => (yScale(i.toString()) ?? 0) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '11px')
      .text(d => {
        // Truncate description if too long
        const maxLength = 20;
        return d.description.length > maxLength
          ? d.description.substring(0, maxLength) + '...'
          : d.description;
      });

    // Add x-axis
    chart
      .append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(5)
          .tickFormat(d => `${(+d * 100).toFixed(0)}%`)
      );

    // Add axis labels
    svg
      .append('text')
      .attr('x', margin.left + innerWidth / 2)
      .attr('y', chartHeight - 5)
      .attr('text-anchor', 'middle')
      .text('Impact Score');

    // Add legend
    const legendData = [
      'frequent_interaction',
      'rapid_sequence',
      'complex_operation',
      'sustained_activity',
    ];
    const legendLabels = {
      frequent_interaction: 'Frequent Interaction',
      rapid_sequence: 'Rapid Sequence',
      complex_operation: 'Complex Operation',
      sustained_activity: 'Sustained Activity',
      custom: 'Custom Pattern',
    };

    const legend = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${chartHeight - 30})`);

    legendData.forEach((type, i) => {
      const x = i * 150;

      legend
        .append('rect')
        .attr('x', x)
        .attr('y', 0)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', colorScale(type));

      legend
        .append('text')
        .attr('x', x + 16)
        .attr('y', 10)
        .attr('font-size', '10px')
        .text(legendLabels[type as keyof typeof legendLabels]);
    });
  };

  // Handle filter changes
  const handleSignificanceFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSignificanceFilter(e.target.value);
  };

  const handlePatternTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPatternTypeFilter(e.target.value);
  };

  // Handle insight selection
  const handleInsightClick = (insight: string) => {
    if (onInsightSelected) {
      onInsightSelected(insight);
    }
  };

  return (
    <div className="user-behavior-correlation-view">
      <h2>User Behavior &amp; Performance Correlation Analysis</h2>

      {isLoading ? (
        <div className="loading">Analyzing correlations...</div>
      ) : (
        <>
          {correlations.length === 0 && patterns.length === 0 ? (
            <div className="no-data">
              <p>No correlation data available. Need more user sessions to analyze.</p>
            </div>
          ) : (
            <>
              <div className="insights-section">
                <h3>Key Insights</h3>

                {insights.length > 0 ? (
                  <ul className="insights-list">
                    {insights.map((insight, index) => (
                      <li
                        key={index}
                        onClick={() => handleInsightClick(insight)}
                        className="insight-item"
                      >
                        {insight}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No significant insights found.</p>
                )}
              </div>

              <div className="correlation-section">
                <div className="section-header">
                  <h3>Behavior-Performance Correlations</h3>

                  <div className="filter-controls">
                    <label htmlFor="significance-filter">
                      Significance:
                      <select
                        id="significance-filter"
                        value={significanceFilter}
                        onChange={handleSignificanceFilterChange}
                      >
                        <option value="all">All</option>
                        <option value="strong">Strong</option>
                        <option value="moderate">Moderate</option>
                        <option value="weak">Weak</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="chart-container" ref={correlationChartRef}></div>

                {selectedCorrelation && (
                  <div className="detail-panel">
                    <h4>Correlation Details</h4>
                    <p className="description">{selectedCorrelation.description}</p>
                    <div className="detail-stats">
                      <div className="stat-item">
                        <span className="label">Coefficient:</span>
                        <span className="value">
                          {selectedCorrelation.correlationCoefficient.toFixed(4)}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="label">Significance:</span>
                        <span className="value">{selectedCorrelation.significance}</span>
                      </div>
                      <div className="stat-item">
                        <span className="label">Sample Size:</span>
                        <span className="value">{selectedCorrelation.sampleSize}</span>
                      </div>
                    </div>
                    <button className="close-btn" onClick={() => setSelectedCorrelation(null)}>
                      Close
                    </button>
                  </div>
                )}
              </div>

              <div className="patterns-section">
                <div className="section-header">
                  <h3>User Behavior Patterns</h3>

                  <div className="filter-controls">
                    <label htmlFor="pattern-type-filter">
                      Pattern Type:
                      <select
                        id="pattern-type-filter"
                        value={patternTypeFilter}
                        onChange={handlePatternTypeFilterChange}
                      >
                        <option value="all">All</option>
                        <option value="frequent_interaction">Frequent Interaction</option>
                        <option value="rapid_sequence">Rapid Sequence</option>
                        <option value="complex_operation">Complex Operation</option>
                        <option value="sustained_activity">Sustained Activity</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="chart-container" ref={patternChartRef}></div>

                {selectedPattern && (
                  <div className="detail-panel">
                    <h4>Pattern Details</h4>
                    <p className="description">{selectedPattern.description}</p>
                    <div className="detail-stats">
                      <div className="stat-item">
                        <span className="label">Type:</span>
                        <span className="value">
                          {selectedPattern.patternType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="label">Impact Score:</span>
                        <span className="value">
                          {(selectedPattern.impactScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="label">Confidence:</span>
                        <span className="value">
                          {(selectedPattern.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="label">Related Metrics:</span>
                        <span className="value">{selectedPattern.relatedMetrics.join(', ')}</span>
                      </div>
                    </div>
                    <button className="close-btn" onClick={() => setSelectedPattern(null)}>
                      Close
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      <style>
        {`
        .user-behavior-correlation-view {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
            'Open Sans', 'Helvetica Neue', sans-serif;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        h2 {
          margin-top: 0;
          color: #2c3e50;
        }

        h3 {
          color: #34495e;
          margin-bottom: 15px;
        }

        .loading,
        .no-data {
          padding: 40px;
          text-align: center;
          color: #7f8c8d;
          font-style: italic;
        }

        .insights-section {
          margin-bottom: 30px;
          padding: 15px;
          background-color: white;
          border-radius: 6px;
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
        }

        .insights-list {
          list-style-type: none;
          padding: 0;
        }

        .insight-item {
          padding: 10px 15px;
          margin-bottom: 8px;
          background-color: #f1f8ff;
          border-left: 4px solid #4299e1;
          border-radius: 3px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .insight-item:hover {
          background-color: #e1efff;
        }

        .correlation-section,
        .patterns-section {
          margin-bottom: 30px;
          padding: 15px;
          background-color: white;
          border-radius: 6px;
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .filter-controls {
          display: flex;
          gap: 15px;
        }

        .filter-controls label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .filter-controls select {
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid #ccc;
        }

        .chart-container {
          margin: 20px 0;
          overflow-x: auto;
        }

        .detail-panel {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          position: relative;
        }

        .detail-panel h4 {
          margin-top: 0;
          color: #2d3748;
        }

        .detail-panel .description {
          margin-bottom: 15px;
          color: #4a5568;
        }

        .detail-stats {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-item .label {
          font-size: 12px;
          color: #718096;
          margin-bottom: 4px;
        }

        .stat-item .value {
          font-size: 16px;
          font-weight: 500;
        }

        .close-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 8px;
          background: none;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .close-btn:hover {
          background-color: #f7fafc;
        }
        `}
      </style>
    </div>
  );
};

export default UserBehaviorCorrelationView;
