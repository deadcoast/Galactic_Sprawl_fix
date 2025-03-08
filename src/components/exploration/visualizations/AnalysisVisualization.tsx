import {
  AnalysisConfig,
  AnalysisResult,
  AnalysisType,
  ComparisonAnalysisConfig,
  CorrelationAnalysisConfig,
  TrendAnalysisConfig,
} from '../../../types/exploration/DataAnalysisTypes';
import { BarChart } from './charts/BarChart';
import { HeatMap } from './charts/HeatMap';
import { LineChart } from './charts/LineChart';
import { ScatterPlot } from './charts/ScatterPlot';

interface AnalysisVisualizationProps {
  result: AnalysisResult;
  config: AnalysisConfig;
  width?: number | string;
  height?: number | string;
}

export function AnalysisVisualization({
  result,
  config,
  width = '100%',
  height = 400,
}: AnalysisVisualizationProps) {
  if (result.status !== 'completed') {
    return (
      <div className="analysis-visualization-loading">
        <p>Analysis status: {result.status}</p>
        {result.status === 'failed' && <p className="error">{result.error}</p>}
      </div>
    );
  }

  if (!result.data || Object.keys(result.data).length === 0) {
    return (
      <div className="analysis-visualization-empty">
        <p>No data available for visualization</p>
      </div>
    );
  }

  // Render appropriate visualization based on visualization type and analysis type
  const renderVisualization = () => {
    const visualizationType = config.visualizationType;
    const analysisType = config.type as AnalysisType;

    // Extract data from the result
    const data =
      (result.data.dataPoints as Record<string, unknown>[] | undefined) ||
      (result.data.values as Record<string, unknown>[] | undefined) ||
      (result.data.results as Record<string, unknown>[] | undefined) ||
      [];

    // Determine axes based on analysis type and configuration
    let xAxisKey = 'date';
    let yAxisKeys: string[] = ['value'];
    let valueKey = 'value';

    // If analysis result contains axis information, use it
    if (result.data.xAxis) {
      xAxisKey = result.data.xAxis as string;
    }
    if (result.data.yAxis) {
      yAxisKeys = [result.data.yAxis as string];
    }
    if (result.data.valueKey) {
      valueKey = result.data.valueKey as string;
    }

    // For trend analysis, extract x and y axes from parameters
    if (analysisType === 'trend' && config.type === 'trend') {
      const trendConfig = config as TrendAnalysisConfig;
      xAxisKey = trendConfig.parameters.xAxis || xAxisKey;
      yAxisKeys = [trendConfig.parameters.yAxis || yAxisKeys[0]];
    }

    // For distribution analysis, use distribution data format
    if (analysisType === 'distribution') {
      xAxisKey = 'bin';
      yAxisKeys = ['count'];
    }

    // For comparison analysis, determine series based on groups
    if (analysisType === 'comparison' && config.type === 'comparison') {
      const comparisonConfig = config as ComparisonAnalysisConfig;
      yAxisKeys = (comparisonConfig.parameters.groups || []).map(g => g.name || g.id);
    }

    // For correlation analysis, use scatter plot regardless of visualization type
    if (analysisType === 'correlation' && config.type === 'correlation') {
      const correlationConfig = config as CorrelationAnalysisConfig;
      return (
        <ScatterPlot
          data={data}
          xAxisKey={correlationConfig.parameters.variables[0] || 'x'}
          yAxisKey={correlationConfig.parameters.variables[1] || 'y'}
          width={width}
          height={height}
          title={config.name}
          xAxisLabel={correlationConfig.parameters.variables[0]}
          yAxisLabel={correlationConfig.parameters.variables[1]}
        />
      );
    }

    // For resource mapping analysis, use heat map regardless of visualization type
    if (analysisType === 'resourceMapping') {
      return (
        <HeatMap
          data={data}
          valueKey={valueKey}
          width={width}
          height={height}
          title={config.name}
        />
      );
    }

    // Render based on specified visualization type
    switch (visualizationType) {
      case 'lineChart':
        return (
          <LineChart
            data={data}
            xAxisKey={xAxisKey}
            yAxisKeys={yAxisKeys}
            width={width}
            height={height}
            title={config.name}
            dateFormat={xAxisKey === 'date'}
          />
        );
      case 'barChart':
        return (
          <BarChart
            data={data}
            xAxisKey={xAxisKey}
            yAxisKeys={yAxisKeys}
            width={width}
            height={height}
            title={config.name}
            stacked={analysisType === 'comparison'}
          />
        );
      case 'scatterPlot':
        return (
          <ScatterPlot
            data={data}
            xAxisKey={xAxisKey}
            yAxisKey={yAxisKeys[0]}
            width={width}
            height={height}
            title={config.name}
          />
        );
      case 'heatMap':
        return (
          <HeatMap
            data={data}
            valueKey={valueKey}
            width={width}
            height={height}
            title={config.name}
          />
        );
      // Fallback for unsupported visualization types
      default:
        return (
          <div className="visualization default">
            <h3>Default Visualization</h3>
            <div className="chart-container">
              <p>The visualization type "{visualizationType}" is not yet implemented</p>
              <p>Analysis type: {analysisType}</p>
              <pre>{JSON.stringify(result.data, null, 2)}</pre>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="analysis-visualization" data-testid="visualization">
      {renderVisualization()}

      {/* Display insights and summary if available */}
      {result.insights && result.insights.length > 0 && (
        <div className="analysis-insights">
          <h4>Key Insights</h4>
          <ul>
            {result.insights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {result.summary && (
        <div className="analysis-summary">
          <h4>Summary</h4>
          <p>{result.summary}</p>
        </div>
      )}
    </div>
  );
}
