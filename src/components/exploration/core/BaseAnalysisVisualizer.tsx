/**
 * BaseAnalysisVisualizer Component
 *
 * A unified base component for visualization of analysis results.
 * This component provides:
 * - Standardized rendering of different analysis types
 * - Support for multiple visualization strategies
 * - Common layout and controls for analysis visualizations
 * - Memory optimization for large datasets
 */

import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { VisualizationErrorBoundary } from '../../../errorHandling/specialized/VisualizationErrorBoundary';
import { AnalysisResult, AnalysisType, Insight } from '../../../types/exploration';
import { ChartDataRecord } from '../../../types/exploration/AnalysisComponentTypes';
import { cn } from '../../../utils/cn';
import { Chart, ChartData } from '../../ui/visualization/Chart';
import { NetworkEdge, NetworkGraph, NetworkNode } from '../../ui/visualization/NetworkGraph';
import { BarChart as BarChartComponent } from '../visualizations/BarChart';
import { HeatMap } from '../visualizations/HeatMap';
import { LineChart as LineChartComponent } from '../visualizations/LineChart';
import { ScatterPlot } from '../visualizations/ScatterPlot';

// Visualization types
export type VisualizationType =
  | 'bar'
  | 'line'
  | 'scatter'
  | 'pie'
  | 'radar'
  | 'heatmap'
  | 'network'
  | 'table'
  | 'custom';

// Visualization renderer
export type VisualizationRenderer = (
  data: Record<string, unknown>,
  width: number,
  height: number,
  options?: VisualizationOptions
) => React.ReactNode;

// Visualization options
export interface VisualizationOptions {
  colors?: string[];
  animate?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  memoryOptimized?: boolean;
  xAxis?: string;
  yAxis?: string;
  xAxisKey?: string;
  yAxisKeys?: string[];
  title?: string;
  [key: string]: unknown;
}

// BaseAnalysisVisualizer Props
export interface BaseAnalysisVisualizerProps {
  /** Analysis result to visualize */
  analysis: AnalysisResult;

  /** Width of the visualization */
  width?: number;

  /** Height of the visualization */
  height?: number;

  /** Default visualization type */
  defaultVisualizationType?: VisualizationType;

  /** Available visualization types */
  availableVisualizationTypes?: VisualizationType[];

  /** Custom visualization renderers */
  visualizationRenderers?: Record<string, VisualizationRenderer>;

  /** Default visualization options */
  defaultOptions?: VisualizationOptions;

  /** Whether to show a panel with insights */
  showInsightsPanel?: boolean;

  /** Whether to show analysis summary */
  showSummary?: boolean;

  /** Whether to show controls for changing visualization */
  showControls?: boolean;

  /** Called when an insight is clicked */
  onInsightClick?: (insight: Insight) => void;

  /** Custom class name */
  className?: string;

  /** Additional content to display below the visualization */
  additionalContent?: React.ReactNode;
}

/**
 * BaseAnalysisVisualizer Component
 */
export const BaseAnalysisVisualizer: React.FC<BaseAnalysisVisualizerProps> = ({
  analysis,
  width = 800,
  height = 400,
  defaultVisualizationType = 'bar',
  availableVisualizationTypes,
  visualizationRenderers,
  defaultOptions = {},
  showInsightsPanel = true,
  showSummary = true,
  showControls = true,
  onInsightClick,
  className,
  additionalContent,
}) => {
  // State
  const [visualizationType, setVisualizationType] =
    useState<VisualizationType>(defaultVisualizationType);

  const [options, setOptions] = useState<VisualizationOptions>({
    colors: ['#4C86E0', '#E6772E', '#76D275', '#FBC02D', '#9C64A6', '#455A64'],
    animate: true,
    showLegend: true,
    showTooltip: true,
    showGrid: true,
    memoryOptimized: true,
    ...defaultOptions,
  });

  // Get available visualization types based on analysis type
  const availableTypes = useMemo(() => {
    if (availableVisualizationTypes) {
      return availableVisualizationTypes;
    }

    // Default visualization types based on analysis type
    switch (analysis.type) {
      case AnalysisType.COMPOSITION:
        return ['pie', 'bar', 'table'] as VisualizationType[];

      case AnalysisType.ENERGY:
      case AnalysisType.RESOURCE:
        return ['bar', 'line', 'radar', 'table'] as VisualizationType[];

      case AnalysisType.SPATIAL:
        return ['scatter', 'heatmap'] as VisualizationType[];

      case AnalysisType.TEMPORAL:
        return ['line', 'bar', 'table'] as VisualizationType[];

      case AnalysisType.STRATEGIC:
        return ['radar', 'heatmap', 'network'] as VisualizationType[];

      case AnalysisType.PREDICTIVE:
        return ['line', 'scatter', 'table'] as VisualizationType[];

      default:
        return ['bar', 'line', 'scatter', 'table'] as VisualizationType[];
    }
  }, [analysis.type, availableVisualizationTypes]);

  // Default renderers for visualization types
  const defaultRenderers: Record<VisualizationType, VisualizationRenderer> = {
    bar: (
      data: Record<string, unknown>,
      chartWidth: number,
      chartHeight: number,
      options?: VisualizationOptions
    ) => {
      if (!Array.isArray(data)) {
        return (
          <VisualizationErrorBoundary fallback={<p>Invalid data format for Bar Chart.</p>}>
            <div />
          </VisualizationErrorBoundary>
        );
      }
      return (
        <BarChartComponent
          data={data as Record<string, unknown>[]}
          width={chartWidth}
          height={chartHeight}
          xAxisKey={options?.xAxisKey ?? 'label'}
          yAxisKeys={options?.yAxisKeys ?? ['value']}
        />
      );
    },

    line: (
      data: Record<string, unknown>,
      chartWidth: number,
      chartHeight: number,
      options?: VisualizationOptions
    ) => {
      if (!Array.isArray(data)) {
        return (
          <VisualizationErrorBoundary fallback={<p>Invalid data format for Line Chart.</p>}>
            <div />
          </VisualizationErrorBoundary>
        );
      }
      return (
        <LineChartComponent
          data={data as Record<string, unknown>[]}
          width={chartWidth}
          height={chartHeight}
          xAxisKey={options?.xAxisKey ?? 'label'}
          yAxisKeys={options?.yAxisKeys ?? ['value']}
        />
      );
    },

    scatter: (
      data: Record<string, unknown>,
      chartWidth: number,
      chartHeight: number,
      options?: VisualizationOptions
    ) => {
      if (!Array.isArray(data)) {
        return (
          <VisualizationErrorBoundary fallback={<p>Invalid data format for Scatter Plot.</p>}>
            <div />
          </VisualizationErrorBoundary>
        );
      }
      return (
        <ScatterPlot
          data={data as Record<string, unknown>[]}
          width={chartWidth}
          height={chartHeight}
          xAxisKey={options?.xAxisKey ?? 'x'}
          yAxisKey={(options?.yAxisKey ?? 'y') as string}
        />
      );
    },

    pie: (
      data: Record<string, unknown>,
      chartWidth: number,
      chartHeight: number,
      options?: VisualizationOptions
    ) => {
      if (!Array.isArray(data)) {
        return (
          <VisualizationErrorBoundary fallback={<p>Invalid data format for Pie Chart.</p>}>
            <div />
          </VisualizationErrorBoundary>
        );
      }
      // Transform data into the ChartData format
      const chartData: ChartData = {
        datasets: [
          {
            label: options?.title ?? 'Pie Chart Data',
            // Assuming input data is like [{ label: string, value: number, color?: string }]
            data: data.map(itemInput => {
              const item = itemInput as { label?: unknown; value?: unknown; color?: unknown };
              return {
                label: typeof item.label === 'string' ? item.label : 'Unknown',
                value: typeof item.value === 'number' ? item.value : 0,
                color: typeof item.color === 'string' ? item.color : undefined,
              };
            }),
          },
        ],
      };

      return (
        <Chart
          data={chartData}
          width={chartWidth}
          height={chartHeight}
          type="pie"
          colors={options?.colors}
          showLegend={options?.showLegend}
          showTooltips={options?.showTooltip}
          backgroundColor={options?.backgroundColor as string | undefined}
        />
      );
    },

    radar: (
      data: Record<string, unknown>,
      width: number,
      height: number,
      options?: VisualizationOptions
    ) => (
      // Reverted to placeholder as the generic Chart component does not support 'radar'
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-gray-500 italic">Radar chart placeholder</p>
        <p className="text-xs text-gray-400 italic">
          (Data: {typeof data}, Size: {width}x{height}, Colors: {options?.colors?.length ?? 0})
        </p>
      </div>
    ),

    heatmap: (
      data: Record<string, unknown>,
      chartWidth: number,
      chartHeight: number,
      options?: VisualizationOptions
    ) => {
      // Heatmap expects data structured differently, often a grid or list of {x, y, value}
      // We'll assume data is already in a suitable format or pre-processed.
      if (!Array.isArray(data) && typeof data !== 'object') {
        return (
          <VisualizationErrorBoundary fallback={<p>Invalid data format for Heatmap.</p>}>
            <div />
          </VisualizationErrorBoundary>
        );
      }
      // Heatmap component might expect an array, handle object data if necessary
      const heatmapData = Array.isArray(data) ? data : Object.values(data || {});

      return (
        <HeatMap
          data={heatmapData as ChartDataRecord[]}
          width={chartWidth}
          height={chartHeight}
          valueKey={(options?.valueKey ?? 'value') as string}
          xKey={(options?.xKey ?? 'x') as string}
          yKey={(options?.yKey ?? 'y') as string}
        />
      );
    },

    network: (
      data: Record<string, unknown>,
      width: number,
      height: number,
      _options?: VisualizationOptions
    ): React.ReactNode => {
      // Validate data structure for network graph
      const networkData = data as { nodes?: NetworkNode[]; edges?: NetworkEdge[] }; // Type assertion
      if (
        !networkData ||
        typeof networkData !== 'object' ||
        !Array.isArray(networkData.nodes) ||
        !Array.isArray(networkData.edges)
      ) {
        return (
          <VisualizationErrorBoundary fallback={<p>Invalid data format for Network Graph.</p>}>
            <div className="flex h-full items-center justify-center text-red-500">
              Invalid data format for Network Graph. Expected object with 'nodes' and 'edges'
              arrays.
            </div>
          </VisualizationErrorBoundary>
        );
      }

      return (
        <NetworkGraph
          nodes={networkData.nodes}
          edges={networkData.edges}
          width={width}
          height={height}
        />
      );
    },

    table: (data: Record<string, unknown>, width: number, height: number) => {
      // Extract keys and values for table
      const keys = Object.keys(data);

      return (
        <div className="max-h-full overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {keys.map(key => (
                <tr key={key}>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{key}</td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    {formatValue(data[key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },

    custom: (
      data: Record<string, unknown>,
      width: number,
      height: number,
      options?: VisualizationOptions
    ) => (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-gray-500 italic">Custom visualization placeholder</p>
        <p className="text-xs text-gray-400 italic">
          (Data: {typeof data}, Size: {width}x{height}, CustomOption:{' '}
          {String(options?.customProp ?? 'N/A')})
        </p>
      </div>
    ),
  };

  // Combine default renderers with custom renderers
  const renderers = useMemo(() => {
    return {
      ...defaultRenderers,
      ...(visualizationRenderers ?? {}),
    };
  }, [visualizationRenderers]);

  // Handle visualization type change
  const handleVisualizationTypeChange = useCallback((type: VisualizationType) => {
    setVisualizationType(type);
  }, []);

  // Handle option change
  const handleOptionChange = useCallback((key: string, value: unknown) => {
    setOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Render visualization
  const renderVisualization = () => {
    const renderer = renderers[visualizationType] || renderers.bar;
    return renderer(analysis.data, width, height, options);
  };

  // Render controls
  const renderControls = () => {
    if (!showControls) return null;

    return (
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Visualization:</label>
          <select
            value={visualizationType}
            onChange={e => handleVisualizationTypeChange(e.target.value as VisualizationType)}
            className="form-select rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {availableTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Legend:</label>
          <input
            type="checkbox"
            checked={options?.showLegend}
            onChange={e => handleOptionChange('showLegend', e.target.checked)}
            className="form-checkbox h-4 w-4 rounded text-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Grid:</label>
          <input
            type="checkbox"
            checked={options?.showGrid}
            onChange={e => handleOptionChange('showGrid', e.target.checked)}
            className="form-checkbox h-4 w-4 rounded text-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Animation:</label>
          <input
            type="checkbox"
            checked={options?.animate}
            onChange={e => handleOptionChange('animate', e.target.checked)}
            className="form-checkbox h-4 w-4 rounded text-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    );
  };

  // Render insights panel
  const renderInsightsPanel = () => {
    if (!showInsightsPanel) return null;

    const { insights } = analysis;

    if (!insights || insights.length === 0) {
      return (
        <div className="rounded-md bg-gray-50 p-4">
          <p className="text-gray-500 italic">No insights available for this analysis.</p>
        </div>
      );
    }

    return (
      <div className="rounded-md bg-gray-50 p-4">
        <h3 className="mb-3 text-lg font-medium text-gray-900">Insights</h3>
        <div className="space-y-3">
          {insights.map(insight => (
            <div
              key={insight.id}
              className={cn(
                'rounded-md border border-gray-200 bg-white p-3 shadow-sm',
                onInsightClick && 'cursor-pointer hover:border-blue-300 hover:bg-blue-50'
              )}
              onClick={() => onInsightClick && onInsightClick(insight)}
            >
              <h4 className="text-md mb-1 font-medium text-gray-900">{insight.title}</h4>
              <p className="mb-2 text-sm text-gray-600">{insight.description}</p>
              <div className="flex items-center space-x-2">
                <span
                  className={cn(
                    'inline-block h-2 w-2 rounded-full',
                    insight.significance > 75
                      ? 'bg-red-500'
                      : insight.significance > 50
                        ? 'bg-yellow-500'
                        : insight.significance > 25
                          ? 'bg-blue-500'
                          : 'bg-gray-500'
                  )}
                />
                <span className="text-xs text-gray-500">Significance: {insight.significance}%</span>
                {insight.actionable && (
                  <span className="ml-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                    Actionable
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('rounded-lg bg-white shadow', className)}>
      <div className="p-4">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{analysis.name}</h2>
            {showSummary && <p className="mt-1 text-sm text-gray-600">{analysis.summary}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Confidence: {analysis.confidence}%</span>
            <span
              className={cn(
                'inline-block h-3 w-3 rounded-full',
                analysis.confidence > 80
                  ? 'bg-green-500'
                  : analysis.confidence > 60
                    ? 'bg-blue-500'
                    : analysis.confidence > 40
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
              )}
            />
            <span className="text-xs text-gray-500">
              {new Date(analysis.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Visualization Controls */}
        {renderControls()}

        <div className="flex flex-col gap-4 md:flex-row">
          {/* Main Visualization */}
          <div className="flex-grow" style={{ minHeight: `${height}px` }}>
            {renderVisualization()}
          </div>

          {/* Insights Panel */}
          {showInsightsPanel && <div className="md:w-80">{renderInsightsPanel()}</div>}
        </div>

        {/* Additional Content */}
        {additionalContent && <div className="mt-4">{additionalContent}</div>}
      </div>
    </div>
  );
};

// Helper function to format values for display
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    // Format number with thousands separators and up to 2 decimal places
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }

  if (value instanceof Date) {
    return value.toLocaleString();
  }

  if (Array.isArray(value)) {
    return value.map(v => formatValue(v)).join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export default BaseAnalysisVisualizer;
