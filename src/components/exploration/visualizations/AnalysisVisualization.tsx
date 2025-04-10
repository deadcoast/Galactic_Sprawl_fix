import { useMemo, useState } from 'react';
import {
  ChartDataRecord,
  ClusterPoint,
  ForecastPoint,
  LinearRegressionModelDetails,
  ModelMetrics,
  NeuralNetworkModelDetails,
  PredictionPoint,
  ResourceGridCell,
  VisualizationValue,
} from '../../../types/exploration/AnalysisComponentTypes';
import {
  AnalysisConfig,
  AnalysisResult,
  AnalysisType,
  ComparisonAnalysisConfig,
  CorrelationAnalysisConfig,
  DataPoint,
  PredictionAnalysisConfig,
  ResourceMappingAnalysisConfig,
  TrendAnalysisConfig,
} from '../../../types/exploration/DataAnalysisTypes';
import { ResourceType } from './../../../types/resources/ResourceTypes';
import { BarChart } from './charts/BarChart';
import { ClusterVisualization } from './charts/ClusterVisualization';
import { HeatMap } from './charts/HeatMap';
import { LineChart } from './charts/LineChart';
import { PredictionVisualization } from './charts/PredictionVisualization';
import { ResourceMappingVisualization } from './charts/ResourceMappingVisualization';
import { ScatterPlot } from './charts/ScatterPlot';
import { VirtualizedDataTable } from './charts/VirtualizedDataTable';

// Define the maximum number of data points to display at once
const MAX_DATA_POINTS = 100;

interface AnalysisVisualizationProps {
  result: AnalysisResult;
  config: AnalysisConfig;
  width?: number | string;
  height?: number | string;
  pageSize?: number; // New prop for customizing page size
}

// Extract and memoize cluster data for better performance
const useClusterData = (result: AnalysisResult, allData: ChartDataRecord[]) => {
  return useMemo(() => {
    if (!result?.data?.clusters || !Array.isArray(result?.data?.clusters)) {
      return {
        clusters: [],
        features: [],
        clusterPoints: [],
      };
    }

    const clusters = result?.data?.clusters;
    const features = Array.isArray(result?.data?.features)
      ? (result?.data?.features as string[])
      : [];

    // Extract all points data from the clustering result
    const clusterPoints: ClusterPoint[] = [];

    clusters.forEach(cluster => {
      const clusterIndex = typeof cluster.cluster === 'number' ? cluster.cluster : 0;
      const pointIds = Array.isArray(cluster.pointIds) ? (cluster.pointIds as string[]) : [];

      // Create points from the data stored in cluster information
      pointIds.forEach(pointId => {
        // Find the original data point if possible
        const originalPoint = allData.find(p => p.id === pointId);
        if (!originalPoint) return;

        // Extract feature values or use null for missing values
        const featureValues = features.map(feature => {
          const value =
            originalPoint[feature] !== undefined
              ? originalPoint[feature]
              : originalPoint.properties && typeof originalPoint.properties === 'object'
                ? (originalPoint.properties as Record<string, unknown>)[feature]
                : null;

          return typeof value === 'number' ? value : null;
        });

        clusterPoints.push({
          id: pointId,
          name: typeof originalPoint.name === 'string' ? originalPoint.name : `Point-${pointId}`,
          type: typeof originalPoint.type === 'string' ? originalPoint.type : 'unknown',
          cluster: clusterIndex,
          features: featureValues,
          distanceToCentroid: 0, // This would ideally come from the analysis result
          originalPoint: originalPoint as unknown as DataPoint,
        });
      });
    });

    return {
      clusters,
      features,
      clusterPoints,
    };
  }, [result?.data?.clusters, result?.data?.features, allData]);
};

// Extract and memoize prediction data for better performance
const usePredictionData = (result: AnalysisResult, config: PredictionAnalysisConfig) => {
  return useMemo(() => {
    // Safely extract prediction data with type checking
    const predictions = Array.isArray(result?.data?.predictions)
      ? (result?.data?.predictions as PredictionPoint[])
      : [];

    const forecast = Array.isArray(result?.data?.forecast)
      ? (result?.data?.forecast as ForecastPoint[])
      : [];

    const features = Array.isArray(result?.data?.features)
      ? (result?.data?.features as string[])
      : [];

    const metrics = (result?.data?.metrics as ModelMetrics) || {
      mse: 0,
      rmse: 0,
      mae: 0,
    };

    const modelDetails = result?.data?.modelDetails ?? {};
    const model = typeof result?.data?.model === 'string' ? result?.data?.model : 'unknown';
    const targetVariable = config.parameters.target ?? '';

    // Type guard for model details to ensure proper structure
    let typedModelDetails: LinearRegressionModelDetails | NeuralNetworkModelDetails;

    // Check if it's a linear regression model
    if (model === 'linear' && typeof modelDetails === 'object') {
      const modelObj = modelDetails as Record<string, unknown>;
      typedModelDetails = {
        coefficients: Array.isArray(modelObj.coefficients)
          ? (modelObj.coefficients as number[])
          : [0],
        weights: Array.isArray(modelObj.weights) ? (modelObj.weights as number[]) : undefined,
        featureImportance: Array.isArray(modelObj.featureImportance)
          ? (modelObj.featureImportance as Array<{ feature: string; importance: number }>)
          : [],
      };
    }
    // Check if it's a neural network model
    else if (model === 'neuralNetwork' && typeof modelDetails === 'object') {
      const modelObj = modelDetails as Record<string, unknown>;

      const architecture =
        typeof modelObj.architecture === 'object'
          ? (modelObj.architecture as Record<string, unknown>)
          : { inputSize: 0, hiddenUnits: 0, activation: 'relu' };

      const training =
        typeof modelObj.training === 'object'
          ? (modelObj.training as Record<string, unknown>)
          : { epochs: 0, learningRate: 0, batchSize: 0 };

      const normalization =
        typeof modelObj.normalization === 'object'
          ? (modelObj.normalization as Record<string, unknown>)
          : undefined;

      typedModelDetails = {
        architecture: {
          inputSize: typeof architecture.inputSize === 'number' ? architecture.inputSize : 0,
          hiddenUnits: typeof architecture.hiddenUnits === 'number' ? architecture.hiddenUnits : 0,
          activation:
            typeof architecture.activation === 'string' ? architecture.activation : 'relu',
        },
        training: {
          epochs: typeof training.epochs === 'number' ? training.epochs : 0,
          learningRate: typeof training.learningRate === 'number' ? training.learningRate : 0,
          batchSize: typeof training.batchSize === 'number' ? training.batchSize : 0,
        },
        normalization: normalization
          ? {
              means: Array.isArray(normalization.means) ? (normalization.means as number[]) : [],
              stdDevs: Array.isArray(normalization.stdDevs)
                ? (normalization.stdDevs as number[])
                : [],
            }
          : undefined,
      };
    }
    // Default to linear regression with empty values if model type is unknown
    else {
      typedModelDetails = {
        coefficients: [0],
        featureImportance: [],
      };
    }

    return {
      model,
      targetVariable,
      features,
      predictions,
      forecast,
      metrics,
      modelDetails: typedModelDetails,
    };
  }, [
    result?.data?.predictions,
    result?.data?.forecast,
    result?.data?.features,
    result?.data?.metrics,
    result?.data?.modelDetails,
    result?.data?.model,
    config.parameters.target,
  ]);
};

// Extract and memoize resource mapping data for better performance
const useResourceMappingData = (result: AnalysisResult) => {
  return useMemo(() => {
    // Safely extract resource mapping data with proper type checking
    const resourcePoints = Array.isArray(result?.data?.resourcePoints)
      ? (result?.data?.resourcePoints as DataPoint[])
      : [];

    const gridCells = Array.isArray(result?.data?.gridCells)
      ? (result?.data?.gridCells as ResourceGridCell[])
      : [];

    const resourceTypes = Array.isArray(result?.data?.resourceTypes)
      ? (result?.data?.resourceTypes as ResourceType[])
      : [];

    const valueMetric =
      typeof result?.data?.valueMetric === 'string'
        ? (result?.data?.valueMetric as 'amount' | 'quality' | 'accessibility' | 'estimatedValue')
        : 'amount';

    const regionSize = typeof result?.data?.regionSize === 'number' ? result?.data?.regionSize : 1;

    // Ensure xRange and yRange are properly formatted
    let xRange: [number, number] = [0, 0];
    let yRange: [number, number] = [0, 0];

    if (
      Array.isArray(result?.data?.xRange) &&
      result?.data?.xRange.length === 2 &&
      typeof result?.data?.xRange[0] === 'number' &&
      typeof result?.data?.xRange[1] === 'number'
    ) {
      xRange = result?.data?.xRange as [number, number];
    }

    if (
      Array.isArray(result?.data?.yRange) &&
      result?.data?.yRange.length === 2 &&
      typeof result?.data?.yRange[0] === 'number' &&
      typeof result?.data?.yRange[1] === 'number'
    ) {
      yRange = result?.data?.yRange as [number, number];
    }

    // Extract density data safely
    const density =
      typeof result?.data?.density === 'object' && result?.data?.density !== null
        ? (result?.data?.density as Record<string, number>)
        : {};

    // Extract insights and summary
    const insights = Array.isArray(result?.insights) ? result?.insights : [];
    const summary = typeof result?.summary === 'string' ? result?.summary : '';

    return {
      resourcePoints,
      gridCells,
      resourceTypes,
      valueMetric,
      regionSize,
      xRange,
      yRange,
      density,
      insights,
      summary,
    };
  }, [
    result?.data?.resourcePoints,
    result?.data?.gridCells,
    result?.data?.resourceTypes,
    result?.data?.valueMetric,
    result?.data?.regionSize,
    result?.data?.xRange,
    result?.data?.yRange,
    result?.data?.density,
    result?.insights,
    result?.summary,
  ]);
};

export function AnalysisVisualization({
  result,
  config,
  width = '100%',
  height = 400,
  pageSize = MAX_DATA_POINTS, // Default to MAX_DATA_POINTS
}: AnalysisVisualizationProps) {
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(0);
  // State to toggle between chart view and raw data view
  const [showRawData, setShowRawData] = useState(false);

  if (result?.status !== 'completed') {
    return (
      <div className="analysis-visualization-loading">
        <p>Analysis status: {result?.status}</p>
        {result?.status === 'failed' && <p className="error">{result?.error}</p>}
      </div>
    );
  }

  if (!result?.data || Object.keys(result?.data).length === 0) {
    return (
      <div className="analysis-visualization-empty">
        <p>No data available for visualization</p>
      </div>
    );
  }

  // Extract data from the result with safer type casting
  const allData = useMemo(() => {
    let extractedData: Record<string, unknown>[] = [];
    if (Array.isArray(result?.data?.dataPoints)) {
      extractedData = result?.data?.dataPoints as Record<string, unknown>[];
    } else if (Array.isArray(result?.data?.values)) {
      extractedData = result?.data?.values as Record<string, unknown>[];
    } else if (Array.isArray(result?.data?.results)) {
      extractedData = result?.data?.results as Record<string, unknown>[];
    }

    // Convert to ChartDataRecord[] to ensure compatibility with visualization components
    return extractedData.map(item => {
      const result: ChartDataRecord = {};
      Object.entries(item).forEach(([key, value]) => {
        // Handle primitive values directly
        if (
          value === null ||
          value === undefined ||
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          result[key] = value;
        }
        // Handle arrays with proper type checking
        else if (Array.isArray(value)) {
          // Transform array elements to ensure type safety
          const safeArray = value.map(element => {
            if (
              element === null ||
              element === undefined ||
              typeof element === 'string' ||
              typeof element === 'number' ||
              typeof element === 'boolean'
            ) {
              return element as VisualizationValue;
            } else if (typeof element === 'object') {
              // Convert object elements to Record<string, VisualizationValue>
              const safeObj: Record<string, VisualizationValue> = {};
              Object.entries(element).forEach(([k, v]) => {
                if (
                  v === null ||
                  v === undefined ||
                  typeof v === 'string' ||
                  typeof v === 'number' ||
                  typeof v === 'boolean'
                ) {
                  safeObj[k] = v;
                }
              });
              return safeObj;
            }
            // Fallback for complex values that can't be safely converted
            return null;
          });
          result[key] = safeArray;
        }
        // Handle objects with proper type checking
        else if (typeof value === 'object') {
          const safeObj: Record<string, VisualizationValue> = {};
          Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
            if (
              v === null ||
              v === undefined ||
              typeof v === 'string' ||
              typeof v === 'number' ||
              typeof v === 'boolean'
            ) {
              safeObj[k] = v;
            }
          });
          result[key] = safeObj;
        }
      });
      return result;
    });
  }, [result?.data]);

  // Calculate pagination values
  const totalPages = Math.ceil(allData.length / pageSize);

  // Get paginated data slice for current page
  const paginatedData = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return allData.slice(startIndex, startIndex + pageSize);
  }, [allData, currentPage, pageSize]);

  // Determine if pagination should be shown (only for datasets larger than pageSize)
  const showPagination = allData.length > pageSize;

  // Generate table columns from the data
  const tableColumns = useMemo(() => {
    if (allData.length === 0) return [];

    // Get the first item to determine columns
    const firstItem = allData[0];

    // Create columns based on the keys of the first item
    return Object.keys(firstItem)
      .filter(key => key !== 'id' && key !== '__typename') // Filter out common non-data fields
      .map(key => ({
        id: key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        minWidth: 100,
        align: typeof firstItem[key] === 'number' ? ('right' as const) : ('left' as const),
      }));
  }, [allData]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Render appropriate visualization based on visualization type and analysis type
  const renderVisualization = () => {
    // If showing raw data, render the data table instead of a chart
    if (showRawData) {
      return (
        <div className="mt-2">
          <VirtualizedDataTable
            data={allData}
            columns={tableColumns}
            height={height}
            title="Raw Data"
            enableSorting
            zebraStripes
          />
        </div>
      );
    }

    const visualizationType = config.visualizationType;
    const analysisType = config.type as AnalysisType;

    // Use paginated data instead of all data
    const data = paginatedData;

    // Handle clustering analysis specially
    if (analysisType === 'clustering' && result?.data?.clusters) {
      // Prepare data for cluster visualization
      const { clusters, features, clusterPoints } = useClusterData(result, allData);

      return (
        <ClusterVisualization
          data={{
            clusters,
            features,
            points: clusterPoints,
          }}
          width={width}
          height={height}
        />
      );
    }

    // Handle prediction analysis specially
    if (analysisType === 'prediction' && config.type === 'prediction') {
      const predictionConfig = config as PredictionAnalysisConfig;

      // Safely extract prediction data with type checking
      const { model, targetVariable, features, predictions, forecast, metrics, modelDetails } =
        usePredictionData(result, predictionConfig);

      return (
        <PredictionVisualization
          data={{
            model,
            targetVariable,
            features,
            predictions,
            forecast,
            metrics,
            modelDetails,
          }}
          width={width}
          height={height}
          title={config.name}
        />
      );
    }

    // Handle resource mapping analysis specially
    if (analysisType === 'resourceMapping' && config.type === 'resourceMapping') {
      const resourceMappingConfig = config as ResourceMappingAnalysisConfig;

      // Use the config for unknown specific settings from the config
      const configTitle = resourceMappingConfig.name || 'Resource Mapping Analysis';

      // Safely extract resource mapping data with proper type checking
      const {
        resourcePoints,
        gridCells,
        resourceTypes,
        valueMetric,
        regionSize,
        xRange,
        yRange,
        density,
        insights,
        summary,
      } = useResourceMappingData(result);

      return (
        <ResourceMappingVisualization
          data={{
            resourcePoints,
            gridCells,
            resourceTypes,
            valueMetric,
            regionSize,
            xRange,
            yRange,
            density,
            insights,
            summary,
          }}
          width={width}
          height={typeof height === 'string' ? parseInt(height, 10) : height}
          title={configTitle}
        />
      );
    }

    // Determine axes based on analysis type and configuration
    let xAxisKey = 'date';
    let yAxisKeys: string[] = ['value'];
    let valueKey = 'value';

    // If analysis result contains axis information, use it
    if (result?.data?.xAxis && typeof result?.data?.xAxis === 'string') {
      xAxisKey = result?.data?.xAxis;
    }
    if (result?.data?.yAxis && typeof result?.data?.yAxis === 'string') {
      yAxisKeys = [result?.data?.yAxis];
    }
    if (result?.data?.valueKey && typeof result?.data?.valueKey === 'string') {
      valueKey = result?.data?.valueKey;
    }

    // For trend analysis, extract x and y axes from parameters
    if (analysisType === 'trend' && config.type === 'trend') {
      const trendConfig = config as TrendAnalysisConfig;
      if (trendConfig.parameters.xAxis) {
        xAxisKey = trendConfig.parameters.xAxis;
      }
      if (trendConfig.parameters.yAxis) {
        yAxisKeys = [trendConfig.parameters.yAxis];
      }
    }

    // For distribution analysis, use distribution data format
    if (analysisType === 'distribution') {
      xAxisKey = 'bin';
      yAxisKeys = ['count'];
    }

    // For comparison analysis, determine series based on groups
    if (analysisType === 'comparison' && config.type === 'comparison') {
      const comparisonConfig = config as ComparisonAnalysisConfig;
      // Extract the comparison variables to use as y-axis keys
      const compVars = comparisonConfig.parameters.comparisonVariables ?? [];
      if (compVars.length > 0) {
        yAxisKeys = compVars;
      }
    }

    // For correlation analysis, use scatter plot regardless of visualization type
    if (analysisType === 'correlation' && config.type === 'correlation') {
      const correlationConfig = config as CorrelationAnalysisConfig;
      const xVar =
        correlationConfig.parameters.variables && correlationConfig.parameters.variables.length > 0
          ? correlationConfig.parameters.variables[0]
          : 'x';
      const yVar =
        correlationConfig.parameters.variables && correlationConfig.parameters.variables.length > 1
          ? correlationConfig.parameters.variables[1]
          : 'y';

      return (
        <ScatterPlot
          data={data}
          xAxisKey={xVar}
          yAxisKey={yVar}
          width={width}
          height={height}
          title={config.name}
          xAxisLabel={xVar}
          yAxisLabel={yVar}
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
            xKey="x" // Default to using "x" for x-axis
            yKey="y" // Default to using "y" for y-axis
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
              <pre>{JSON.stringify(result?.data, null, 2)}</pre>
            </div>
          </div>
        );
    }
  };

  // Toggle between chart view and data table view
  const toggleRawDataView = () => {
    setShowRawData(!showRawData);
  };

  // Render pagination controls
  const renderPagination = () => {
    if (!showPagination || showRawData) return null;

    return (
      <div className="analysis-pagination">
        <div className="mt-4 flex items-center justify-between">
          <div className="pagination-info">
            Showing {currentPage * pageSize + 1} to{' '}
            {Math.min((currentPage + 1) * pageSize, allData.length)} of {allData.length} data points
          </div>
          <div className="pagination-controls flex space-x-2">
            <button
              onClick={() => handlePageChange(0)}
              disabled={currentPage === 0}
              className="pagination-button rounded bg-gray-200 px-3 py-1 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ⟪ First
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="pagination-button rounded bg-gray-200 px-3 py-1 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Previous
            </button>
            <span className="pagination-pages px-3 py-1">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="pagination-button rounded bg-gray-200 px-3 py-1 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next →
            </button>
            <button
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={currentPage === totalPages - 1}
              className="pagination-button rounded bg-gray-200 px-3 py-1 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Last ⟫
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="analysis-visualization" data-testid="visualization">
      {/* View toggle button */}
      <div className="mb-4 flex justify-end">
        <button
          className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
          onClick={toggleRawDataView}
        >
          {showRawData ? 'Show Chart View' : 'Show Raw Data'}
        </button>
      </div>

      {renderVisualization()}
      {renderPagination()}

      {/* Display insights and summary if available */}
      {!showRawData && result?.insights && result?.insights.length > 0 && (
        <div className="analysis-insights">
          <h4>Key Insights</h4>
          <ul>{result?.insights.map((insight, index) => <li key={index}>{insight}</li>)}</ul>
        </div>
      )}

      {!showRawData && result?.summary && (
        <div className="analysis-summary">
          <h4>Summary</h4>
          <p>{result?.summary}</p>
        </div>
      )}

      {/* Display pagination info for dataset context */}
      {showPagination && !showRawData && (
        <div className="analysis-dataset-info mt-2 text-sm text-gray-500">
          <p>
            Note: This visualization is paginated due to the large dataset size ({allData.length}{' '}
            total data points).
          </p>
        </div>
      )}
    </div>
  );
}
