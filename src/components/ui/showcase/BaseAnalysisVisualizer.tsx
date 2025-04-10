import { ChartDataRecord } from '../../../../types/exploration/AnalysisComponentTypes';
import { HeatMap } from '../../exploration/visualizations/charts/HeatMap';
import {
    NetworkEdge,
    NetworkGraph,
    NetworkNode,
} from '../visualization/NetworkGraph';

// Default renderers
const defaultRenderers: Renderers = {
  // ... existing renderers (bar, line, scatter, pie, radar, heatmap) ...
  heatmap: ({ data: heatmapData, size, options }) => {
    // Basic check if data is an array
    if (!Array.isArray(heatmapData)) {
      return (
        <div style={size}>
          Invalid data format for Heatmap. Expected array of objects.
        </div>
      );
    }

    // Type assertion - assuming the data structure is compatible
    const data = heatmapData as ChartDataRecord[];

    // Extract keys from options or use defaults
    const valueKey = options?.valueKey || 'value';
    const xKey = options?.xKey || 'x';
    const yKey = options?.yKey || 'y';

    // Remove specific keys before spreading options
    const { valueKey: _vk, xKey: _xk, yKey: _yk, ...restOptions } = options || {};


    return (
      <HeatMap
        data={data} // Use the asserted data
        valueKey={valueKey}
        xKey={xKey}
        yKey={yKey}
        width={size.width}
        height={size.height}
        {...restOptions} // Spread remaining options
      />
    );
  },
  network: ({ data: networkData, size, options }) => {
    // Validate network data structure
    if (
      typeof networkData !== 'object' ||
      networkData === null ||
      !Array.isArray((networkData as any).nodes) ||
      !Array.isArray((networkData as any).edges)
    ) {
      return (
        <div style={size}>
          Invalid data format for NetworkGraph. Expected object with 'nodes' and
          'edges' arrays. Received: {JSON.stringify(networkData)}
        </div>
      );
    }

    // Type assertion after validation
    const { nodes, edges } = networkData as {
      nodes: NetworkNode[];
      edges: NetworkEdge[];
    };

    return (
      <NetworkGraph
        nodes={nodes}
        edges={edges}
        width={size.width}
        height={size.height}
        {...options} // Spread the rest of the options
      />
    );
  },
}; 