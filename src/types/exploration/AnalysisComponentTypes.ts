/**
 * Shared type definitions for data analysis components
 * Used to ensure type consistency across visualization components and services
 */

import React from 'react';
import { ResourceType } from '../resources/ResourceTypes';
import { AnalysisResult, DataPoint } from './DataAnalysisTypes';

/**
 * Generic value type for visualization data
 */
export type VisualizationValue = string | number | boolean | null | undefined;

/**
 * Visualization component tooltip props type
 */
export interface VisualizationTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: VisualizationValue;
    name?: string;
    dataKey?: string;
    payload?: Record<string, VisualizationValue>;
  }>;
  label?: string;
}

/**
 * Shared base props for all chart components
 */
export interface BaseChartComponentProps {
  width?: number | string;
  height?: number | string;
  title?: string;
  className?: string;
}

/**
 * Base interface for all visualization components
 * Provides consistent props across different chart types
 */
export interface BaseVisualizationProps extends BaseChartComponentProps {
  /** Data to visualize */
  data: ChartDataRecord[];

  /** Key for accessing the X-axis value */
  xKey: string;

  /** Key for accessing the Y-axis value */
  yKey: string;

  /** Custom tooltip component or renderer */
  customTooltip?: React.FC<VisualizationTooltipProps> | TooltipRenderer<ChartDataRecord>;

  /** Function to determine color based on data point */
  colorAccessor?: ColorAccessorFn<ChartDataRecord>;

  /** Whether to animate transitions */
  animate?: boolean;

  /** Whether to show a legend */
  showLegend?: boolean;

  /** Grid display settings */
  grid?: {
    show?: boolean;
    horizontal?: boolean;
    vertical?: boolean;
    color?: string;
  };

  /** Custom click handler for chart elements */
  onElementClick?: (data: ChartDataRecord) => void;

  /** Error message to display if chart fails to render */
  errorMessage?: string;
}

/**
 * Extended data record for complex visualization data
 * Allows for both primitive values and nested objects/arrays
 */
export interface ChartDataRecord {
  [key: string]:
    | VisualizationValue
    | Record<string, VisualizationValue>
    | Array<VisualizationValue | Record<string, VisualizationValue>>
    | { [key: string]: VisualizationValue | Record<string, VisualizationValue> };
}

/**
 * Props for data point visualization components
 */
export interface DataPointVisualizationProps extends BaseChartComponentProps {
  data: DataPoint[];
  colorAccessor?: (point: DataPoint) => string;
  sizeAccessor?: (point: DataPoint) => number;
  labelAccessor?: (point: DataPoint) => string;
  tooltipContent?: (point: DataPoint) => React.ReactNode;
}

/**
 * Cluster visualization data point
 */
export interface ClusterPoint {
  id: string;
  name: string;
  type: string;
  cluster: number;
  features: (number | null)[];
  distanceToCentroid: number;
  originalPoint: DataPoint;
}

/**
 * Prediction point structure for visualization
 */
export interface PredictionPoint {
  features: number[];
  actual: number;
  predicted: number;
  error?: number;
}

/**
 * Forecast point structure for visualization
 */
export interface ForecastPoint {
  features: number[];
  predicted: number;
  confidence?: [number, number]; // Lower and upper bounds
}

/**
 * Model metrics structure
 */
export interface ModelMetrics {
  mse: number;
  rmse: number;
  mae: number;
  r2?: number;
}

/**
 * Linear regression model details
 */
export interface LinearRegressionModelDetails {
  coefficients: number[];
  weights?: number[];
  featureImportance: Array<{
    feature: string;
    importance: number;
  }>;
}

/**
 * Neural network model details
 */
export interface NeuralNetworkModelDetails {
  architecture: {
    inputSize: number;
    hiddenUnits: number;
    activation: string;
  };
  training: {
    epochs: number;
    learningRate: number;
    batchSize: number;
  };
  normalization?: {
    means: number[];
    stdDevs: number[];
  };
}

/**
 * Props for prediction visualization component
 */
export interface PredictionVisualizationProps extends BaseChartComponentProps {
  data: {
    model: string;
    targetVariable: string;
    features: string[];
    predictions: PredictionPoint[];
    forecast: ForecastPoint[];
    metrics: ModelMetrics;
    modelDetails: LinearRegressionModelDetails | NeuralNetworkModelDetails;
  };
}

/**
 * Resource grid cell for resource mapping
 */
export interface ResourceGridCell {
  x: number;
  y: number;
  resources: Array<{
    type: ResourceType;
    amount: number;
    quality?: number;
    accessibility?: number;
    estimatedValue?: number;
  }>;
  totalValue: number;
  dominantResource?: ResourceType;
  dominantPercentage?: number;
  totalResourceCount: number;
}

/**
 * Props for resource mapping visualization
 */
export interface ResourceMappingVisualizationProps extends BaseChartComponentProps {
  data: {
    resourcePoints: DataPoint[];
    gridCells?: ResourceGridCell[];
    resourceTypes: ResourceType[];
    valueMetric: 'amount' | 'quality' | 'accessibility' | 'estimatedValue';
    regionSize: number;
    xRange: [number, number];
    yRange: [number, number];
    density?: Record<string, number>;
    insights?: string[];
    summary?: string;
  };
}

/**
 * Props for chart rendering components with common options
 */
export interface ChartRenderProps extends BaseVisualizationProps {
  showTooltip?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  xAxisDataKey?: string;
  yAxisDataKey?: string;
}

/**
 * Custom cell renderer for heat map
 */
export interface HeatMapCellProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  index: number;
  color: string;
  opacity: number;
}

/**
 * Support types for custom visualization events
 */
export interface VisualizationClickEvent {
  dataKey: string;
  value: VisualizationValue;
  name: string;
  payload: Record<string, VisualizationValue>;
}

/**
 * Function types for various callbacks
 */
export type ColorAccessorFn<T> = (item: T) => string;
export type ValueAccessorFn<T> = (item: T) => number;
export type LabelAccessorFn<T> = (item: T) => string;
export type TooltipRenderer<T> = (item: T) => React.ReactNode;

/**
 * Analysis result preparation function type
 * Used to transform raw analysis results into visualization-friendly format
 */
export type ResultPreparationFn = (result: AnalysisResult) => Record<string, VisualizationValue>;
