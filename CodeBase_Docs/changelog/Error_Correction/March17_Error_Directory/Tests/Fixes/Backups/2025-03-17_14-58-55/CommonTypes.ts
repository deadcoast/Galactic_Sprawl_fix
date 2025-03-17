/**
 * Common Visualization Types
 *
 * This module provides shared type definitions for visualization components
 * across the Galactic Sprawl codebase. It establishes a consistent type system
 * that can be extended by specialized visualization components.
 */
import * as React from 'react';
import { ResourceType } from "./../resources/ResourceTypes";

// =========================================
// Base Visualization Data Types
// =========================================

/**
 * Generic value type for visualization data
 */
export type VisualizationValue = string | number | boolean | null | undefined;

/**
 * Base data record for visualization data
 */
export interface BaseDataRecord {
  id: string;
  [key: string]: VisualizationValue | Record<string, VisualizationValue> | unknown;
}

/**
 * Extended data record for complex visualization data
 * Allows for both primitive values and nested objects/arrays
 */
export interface ChartDataRecord extends BaseDataRecord {
  [key: string]:
    | VisualizationValue
    | Record<string, VisualizationValue>
    | Array<VisualizationValue | Record<string, VisualizationValue>>
    | { [key: string]: VisualizationValue | Record<string, VisualizationValue> };
}

/**
 * Base data collection
 */
export type DataCollection<T extends BaseDataRecord = BaseDataRecord> = T[];

/**
 * Base point/node type for visualizations
 */
export interface BasePoint {
  id: string;
  x: number;
  y: number;
  [key: string]: unknown;
}

/**
 * Base connection/edge/link type for visualizations
 */
export interface BaseLink {
  id: string;
  source: string | BasePoint;
  target: string | BasePoint;
  value?: number;
  [key: string]: unknown;
}

/**
 * Base network/graph data structure
 */
export interface NetworkData<
  N extends BasePoint = BasePoint,
  L extends BaseLink = BaseLink
> {
  nodes: N[];
  links: L[];
}

// =========================================
// Base Visualization Component Props
// =========================================

/**
 * Base props for all visualization components
 */
export interface BaseChartComponentProps {
  /** Width of the visualization */
  width?: number | string;
  
  /** Height of the visualization */
  height?: number | string;
  
  /** Optional title for the visualization */
  title?: string;
  
  /** CSS class names */
  className?: string;
  
  /** Error message to display if visualization fails */
  errorMessage?: string;

  /** Optional ID for the visualization container */
  id?: string;
}

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
 * Base chart props for chart-based visualizations
 */
export interface BaseVisualizationProps extends BaseChartComponentProps {
  /** Data to visualize */
  data: ChartDataRecord[];
  
  /** Key for accessing the X-axis value */
  xKey: string;
  
  /** Key for accessing the Y-axis value */
  yKey: string;
  
  /** Whether to show a legend */
  showLegend?: boolean;
  
  /** Whether to animate transitions */
  animate?: boolean;
  
  /** Custom tooltip component or renderer */
  customTooltip?: React.FC<VisualizationTooltipProps> | TooltipRenderer<ChartDataRecord>;
  
  /** (...args: unknown[]) => unknown to determine color based on data point */
  colorAccessor?: ColorAccessorFn<ChartDataRecord>;
  
  /** Click handler for chart elements */
  onElementClick?: (data: ChartDataRecord) => void;
  
  /** Grid display options */
  grid?: GridOptions;

  /** Margin around the chart */
  margin?: Margin;
}

/**
 * Grid options for charts
 */
export interface GridOptions {
  show?: boolean;
  horizontal?: boolean;
  vertical?: boolean;
  color?: string;
  opacity?: number;
  dashArray?: string;
}

/**
 * Margin configuration
 */
export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
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

// =========================================
// Visualization Callback Types
// =========================================

/**
 * (...args: unknown[]) => unknown to determine element color based on data
 */
export type ColorAccessorFn<T> = (data: T, index?: number) => string;

/**
 * (...args: unknown[]) => unknown to determine element size based on data
 */
export type SizeAccessorFn<T> = (data: T, index?: number) => number;

/**
 * (...args: unknown[]) => unknown to access a specific numeric value from data
 */
export type ValueAccessorFn<T> = (data: T, index?: number) => number;

/**
 * (...args: unknown[]) => unknown to generate a label from data
 */
export type LabelAccessorFn<T> = (data: T, index?: number) => string;

/**
 * (...args: unknown[]) => unknown to render tooltip content
 */
export type TooltipRenderer<T> = (data: T, index?: number) => React.ReactNode;

// =========================================
// Animation and Transition Types
// =========================================

/**
 * Type definition for easing functions
 */
export type EasingFn = (normalizedTime: number) => number;

/**
 * Base animation configuration
 */
export interface AnimationConfig {
  /** Duration in milliseconds */
  duration: number;
  
  /** Delay before starting in milliseconds */
  delay?: number;
  
  /** Easing function name or implementation */
  easing?: string | EasingFn;
  
  /** Whether the animation should loop */
  loop?: boolean;
  
  /** Delay between each iteration when looping */
  loopDelay?: number;
  
  /** Number of times to loop (undefined for infinite) */
  loopCount?: number;
}

/**
 * Transition state for animated visualizations
 */
export interface TransitionState<T = unknown> {
  /** Start value for the transition */
  startValue: T;
  /** End value for the transition */
  endValue: T;
  /** Current value during the transition */
  currentValue: T;
  /** Progress of the transition (0 to 1) */
  progress: number;
  /** Whether the transition is complete */
  isComplete: boolean;
  /** The timestamp when the transition started */
  startTime: number;
  /** The timestamp when the transition completed or is expected to complete */
  endTime: number;
}

/**
 * Interpolator function for transitioning between values
 */
export interface TypedInterpolator<T> {
  (t: number): T;
}

// =========================================
// Memory Management Types
// =========================================

/**
 * Memory optimization options for large visualizations
 */
export interface MemoryOptimizationOptions {
  /** Whether to use memory optimization */
  enabled?: boolean;
  
  /** Maximum number of elements to render at once */
  maxItemsToRender?: number;
  
  /** Whether to use virtualization */
  useVirtualization?: boolean;
  
  /** Whether to dispose off-screen elements */
  disposeOffscreen?: boolean;
  
  /** Threshold (in pixels) for considering elements off-screen */
  offscreenThreshold?: number;
}

/**
 * Viewport configuration for optimized rendering
 */
export interface ViewportConfig {
  /** Visible width */
  width: number;
  
  /** Visible height */
  height: number;
  
  /** X offset of the viewport */
  x: number;
  
  /** Y offset of the viewport */
  y: number;
  
  /** Scale/zoom level */
  scale: number;
}

// =========================================
// Specialized Visualization Types
// =========================================

/**
 * Flow node type for flow visualizations
 */
export interface FlowDataNode extends BasePoint {
  id: string;
  name: string;
  type: 'source' | 'process' | 'destination';
  value: number;
  description?: string;
  data?: unknown;
}

/**
 * Flow link type for flow visualizations
 */
export interface FlowDataLink extends BaseLink {
  source: string | FlowDataNode;
  target: string | FlowDataNode;
  value: number;
  type?: string;
  data?: unknown;
  active: boolean;
}

/**
 * Flow data structure for flow visualizations
 */
export interface FlowData {
  nodes: FlowDataNode[];
  links: FlowDataLink[];
}

/**
 * Cluster point for cluster visualizations
 */
export interface ClusterPoint {
  id: string;
  name: string;
  type: string;
  cluster: number;
  features: (number | null)[];
  distanceToCentroid: number;
  originalPoint: unknown;
}

/**
 * Prediction point for prediction visualizations
 */
export interface PredictionPoint {
  features: number[];
  actual: number;
  predicted: number;
  error?: number;
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

// =========================================
// D3 Integration Types
// =========================================

/**
 * Generic Node type for D3 force simulations
 */
export interface SimulationNodeDatum<T = unknown> extends BasePoint {
  id: string;
  fx?: number | null;
  fy?: number | null;
  // Additional fields for type safety
  data?: T; // The original data attached to this node
}

/**
 * Generic Link type for D3 force simulations
 */
export interface SimulationLinkDatum<N extends SimulationNodeDatum = SimulationNodeDatum> extends BaseLink {
  source: string | N;
  target: string | N;
  value?: number;
}

/**
 * For visualization click events
 */
export interface VisualizationClickEvent {
  dataKey: string;
  value: VisualizationValue;
  name: string;
  payload: Record<string, VisualizationValue>;
}