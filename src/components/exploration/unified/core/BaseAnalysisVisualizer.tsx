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
import { AnalysisResult, AnalysisType, Insight } from '../../../../types/exploration/unified';
import { cn } from '../../../../utils/cn';

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
    bar: (_data, _width, _height, _options) => (
      <div className="flex h-full items-center justify-center">
        <p className="italic text-gray-500">Bar chart visualization (placeholder)</p>
      </div>
    ),

    line: (_data, _width, _height, _options) => (
      <div className="flex h-full items-center justify-center">
        <p className="italic text-gray-500">Line chart visualization (placeholder)</p>
      </div>
    ),

    scatter: (_data, _width, _height, _options) => (
      <div className="flex h-full items-center justify-center">
        <p className="italic text-gray-500">Scatter plot visualization (placeholder)</p>
      </div>
    ),

    pie: (_data, _width, _height, _options) => (
      <div className="flex h-full items-center justify-center">
        <p className="italic text-gray-500">Pie chart visualization (placeholder)</p>
      </div>
    ),

    radar: (_data, _width, _height, _options) => (
      <div className="flex h-full items-center justify-center">
        <p className="italic text-gray-500">Radar chart visualization (placeholder)</p>
      </div>
    ),

    heatmap: (_data, _width, _height, _options) => (
      <div className="flex h-full items-center justify-center">
        <p className="italic text-gray-500">Heatmap visualization (placeholder)</p>
      </div>
    ),

    network: (_data, _width, _height, _options) => (
      <div className="flex h-full items-center justify-center">
        <p className="italic text-gray-500">Network visualization (placeholder)</p>
      </div>
    ),

    table: (data, _width, _height, _options) => {
      // Extract keys and values for table
      const keys = Object.keys(data);

      return (
        <div className="max-h-full overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {keys.map(key => (
                <tr key={key}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{key}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatValue(data[key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },

    custom: (_data, _width, _height, _options) => (
      <div className="flex h-full items-center justify-center">
        <p className="italic text-gray-500">Custom visualization</p>
      </div>
    ),
  };

  // Combine default renderers with custom renderers
  const renderers = useMemo(() => {
    return {
      ...defaultRenderers,
      ...(visualizationRenderers || {}),
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
            checked={options.showLegend}
            onChange={e => handleOptionChange('showLegend', e.target.checked)}
            className="form-checkbox h-4 w-4 rounded text-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Grid:</label>
          <input
            type="checkbox"
            checked={options.showGrid}
            onChange={e => handleOptionChange('showGrid', e.target.checked)}
            className="form-checkbox h-4 w-4 rounded text-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Animation:</label>
          <input
            type="checkbox"
            checked={options.animate}
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
          <p className="italic text-gray-500">No insights available for this analysis.</p>
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
