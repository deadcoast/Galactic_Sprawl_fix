import React from 'react';
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../../services/ErrorLoggingService';
// Corrected import paths and added Prop imports
import { HeatMap, HeatMapProps } from '../../exploration/visualizations/HeatMap';
import {
  NetworkEdge,
  NetworkGraph,
  NetworkGraphProps,
  NetworkNode,
} from '../visualization/NetworkGraph';

// Define Size interface
interface Size {
  width: number;
  height: number;
}

// --- Define Specific Options and Data Types ---
interface HeatmapOptions {
  valueKey?: string;
  xKey?: string;
  yKey?: string;
}
type HeatmapDataPoint = Record<string, string | number>;
type HeatmapData = HeatmapDataPoint[];

type NetworkGraphOptions = Record<string, unknown>;
interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

// --- Define Renderer Component Structure ---
interface RendererProps<TData = unknown, TOptions = unknown> {
  data: TData;
  size: Size;
  options?: TOptions;
}

// --- Define Analysis Types and Map to Props ---
export type AnalysisType = 'Heatmap' | 'NetworkGraph';

interface RendererPropsMap {
  Heatmap: RendererProps<HeatmapData, HeatmapOptions>;
  NetworkGraph: RendererProps<NetworkGraphData, NetworkGraphOptions>;
}

// --- Define Renderers Dictionary Type ---
type Renderers = {
  // Use AnalysisType as the key again
  [K in AnalysisType]?: React.ComponentType<RendererPropsMap[K]>;
};

// --- Define Default Renderers Implementation ---
// Ensure defaultRenderers provides implementations for all AnalysisType keys
const defaultRenderers: Required<Renderers> = {
  Heatmap: ({ data: heatmapData, size, options }: RendererPropsMap['Heatmap']) => {
    const valueKey = options?.valueKey ?? 'value';
    const xKey = options?.xKey ?? 'x';
    const yKey = options?.yKey ?? 'y';

    if (!Array.isArray(heatmapData)) {
      errorLoggingService.logError(
        new Error('Invalid data for Heatmap'),
        ErrorType.VALIDATION,
        ErrorSeverity.HIGH
      );
      return <div>Invalid Data for Heatmap</div>;
    }

    const heatMapProps: HeatMapProps = {
      data: heatmapData,
      valueKey: valueKey,
      xKey: xKey,
      yKey: yKey,
      width: size.width,
      height: size.height,
    };

    return <HeatMap {...heatMapProps} />;
  },
  NetworkGraph: ({ data: networkData, size }: RendererPropsMap['NetworkGraph']) => {
    if (
      typeof networkData !== 'object' ||
      networkData === null ||
      !Array.isArray(networkData.nodes) ||
      !Array.isArray(networkData.edges)
    ) {
      errorLoggingService.logError(
        new Error('Invalid data for NetworkGraph'),
        ErrorType.VALIDATION,
        ErrorSeverity.HIGH
      );
      return <div>Invalid Data for NetworkGraph</div>;
    }

    const networkGraphProps: NetworkGraphProps = {
      nodes: networkData.nodes,
      edges: networkData.edges,
      width: size.width,
      height: size.height,
      // Pass any other valid props from options if needed, requires NetworkGraphOptions to be defined
      // ...(options as Partial<NetworkGraphProps>), // Example, needs careful typing
    };

    return <NetworkGraph {...networkGraphProps} />;
  },
};

// --- Define Main Component Props using simplified types ---
interface BaseAnalysisVisualizerProps {
  analysisType: string; // Accept any string
  data: unknown; // Data type is unknown initially
  options?: Record<string, unknown>; // Options are generic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderers?: Record<string, React.ComponentType<any>>; // Allow any custom renderer signature
  width?: number;
  height?: number;
}

// --- Main Component Implementation ---
export const BaseAnalysisVisualizer: React.FC<BaseAnalysisVisualizerProps> = ({
  analysisType,
  data,
  options,
  renderers = {},
  width = 500,
  height = 300,
}) => {
  // Combine renderers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const combinedRenderers: Record<string, React.ComponentType<any>> = {
    ...defaultRenderers,
    ...renderers,
  };
  const size: Size = { width, height };

  if (data === undefined || data === null) {
    errorLoggingService.logError(
      new Error(`No data provided for analysis type: ${analysisType}`),
      ErrorType.VALIDATION,
      ErrorSeverity.HIGH
    );
    return <div style={{ color: 'orange' }}>No data available for {analysisType}</div>;
  }

  const renderVisualization = () => {
    // Check if analysisType corresponds to a known default renderer
    if (analysisType === 'Heatmap') {
      const Renderer = combinedRenderers.Heatmap;
      if (!Renderer) {
        errorLoggingService.logError(
          new Error('Heatmap renderer logic error.'),
          ErrorType.RUNTIME,
          ErrorSeverity.HIGH
        );
        return <div>Error: Heatmap Renderer Missing</div>;
      }
      // Type check and cast for Heatmap
      if (!Array.isArray(data)) {
        errorLoggingService.logError(
          new Error('Invalid data type for Heatmap'),
          ErrorType.VALIDATION,
          ErrorSeverity.HIGH
        );
        return <div>Invalid data for Heatmap</div>;
      }
      const heatmapOptions = options as HeatmapOptions | undefined;
      const TypedRenderer = Renderer as React.ComponentType<RendererPropsMap['Heatmap']>;
      return <TypedRenderer data={data} size={size} options={heatmapOptions} />;
    } else if (analysisType === 'NetworkGraph') {
      const Renderer = combinedRenderers.NetworkGraph;
      if (!Renderer) {
        errorLoggingService.logError(
          new Error('NetworkGraph renderer logic error.'),
          ErrorType.RUNTIME,
          ErrorSeverity.HIGH
        );
        return <div>Error: NetworkGraph Renderer Missing</div>;
      }
      // Type check and cast for NetworkGraph
      const networkData = data as NetworkGraphData;
      if (
        typeof networkData !== 'object' ||
        networkData === null ||
        !Array.isArray(networkData.nodes) ||
        !Array.isArray(networkData.edges)
      ) {
        errorLoggingService.logError(
          new Error('Invalid data type for NetworkGraph'),
          ErrorType.VALIDATION,
          ErrorSeverity.HIGH
        );
        return <div>Invalid data for NetworkGraph</div>;
      }
      const networkGraphOptions = options as NetworkGraphOptions | undefined;
      const TypedRenderer = Renderer as React.ComponentType<RendererPropsMap['NetworkGraph']>;
      return <TypedRenderer data={networkData} size={size} options={networkGraphOptions} />;
    } else {
      // Handle custom renderers passed via props
      const CustomRenderer = combinedRenderers[analysisType];
      if (CustomRenderer) {
        errorLoggingService.logwarn(
          `Rendering analysis type "${analysisType}" with provided custom renderer.`
        );
        // Cast Renderer to ComponentType<any> for JSX compatibility

        const AnyRenderer = CustomRenderer;
        // Create props object
        const rendererProps = { data, size, options };
        // Pass the props object cast to any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <AnyRenderer {...(rendererProps as any)} />;
      }
      // Fallback if no renderer found
      errorLoggingService.logError(
        new Error(`No default or custom renderer found for analysis type: ${analysisType}`),
        ErrorType.CONFIGURATION,
        ErrorSeverity.HIGH
      );
      return <div style={{ color: 'red' }}>Error: Renderer not found for {analysisType}</div>;
    }
  };

  return <div style={{ width: `${width}px`, height: `${height}px` }}>{renderVisualization()}</div>;
};
