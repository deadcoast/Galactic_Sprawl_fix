import * as d3 from 'd3';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useComponentLifecycle } from '../../../../hooks/ui/useComponentLifecycle';
import { useComponentRegistration } from '../../../../hooks/ui/useComponentRegistration';
import { moduleEventBus } from '../../../../lib/events/ModuleEventBus';
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../../../services/ErrorLoggingService';
import { BaseEvent, EventType } from '../../../../types/events/EventTypes';
import {
  FlowConnection,
  FlowNode,
  FlowNodeType as ResourceFlowNodeType,
  ResourceType,
  ResourceTypeInfo,
} from '../../../../types/resources/ResourceTypes';
import { NetworkData } from '../../../../types/visualization/CommonTypes';
import {
  createSvgZoomBehavior,
  TypedZoomEvent,
} from '../../../../types/visualizations/D3ZoomTypes';
import { ResourceTypeConverter } from '../../../../utils/resources/ResourceTypeConverter';
import DataTransitionParticleSystem, {
  DataPoint,
} from '../../../ui/visualization/DataTransitionParticleSystem';

interface ResourceFlowDiagramProps {
  width?: number;
  height?: number;
  interactive?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  focusedResourceType?: ResourceType;
  selectedNodeId?: string;
  onNodeClick?: (nodeId: string, type: ResourceFlowNodeType) => void;
  onConnectionClick?: (connectionId: string) => void;
}

/**
 * ResourceFlowDiagram component
 *
 * A visual representation of the resource flow network using D3 force directed graph.
 * It shows the producers, consumers, storage, and converters of resources,
 * and how resources flow between them.
 *
 * The component integrates with the component registration system to receive
 * real-time updates when the resource flow changes.
 */
const ResourceFlowDiagram: React.FC<ResourceFlowDiagramProps> = ({
  width = 800,
  height = 600,
  interactive = true,
  showLabels = true,
  showLegend = true,
  focusedResourceType,
  selectedNodeId,
  onNodeClick,
  onConnectionClick,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [networkData, setNetworkData] = useState<NetworkData<FlowNode, FlowConnection>>({
    nodes: [],
    links: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const simulationRef = useRef<d3.Simulation<FlowNode, FlowConnection> | null>(null);
  const [previousNetworkData, setPreviousNetworkData] = useState<NetworkData<
    FlowNode,
    FlowConnection
  > | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const _connectionsContainer = useRef<SVGGElement | null>(null);
  const _particleContainer = useRef<SVGGElement | null>(null);
  const _tooltipRef = useRef<HTMLDivElement | null>(null);
  const previousParticlesRef = useRef<Set<string> | null>(null);

  const componentId = 'ResourceFlowDiagram';

  // Register component
  useComponentRegistration(componentId, 'ResourceFlowDiagram');

  useComponentLifecycle({
    onMount: () => {
      console.warn('ResourceFlowDiagram mounted');
      fetchResourceFlowData();

      // Define the handler function
      const handleResourceFlowUpdate = (event: BaseEvent) => {
        console.warn(`Resource flow event received: ${event.type}`);
        fetchResourceFlowData();
      };

      // Subscribe to specific events individually
      const subscriptions = [
        moduleEventBus.subscribe(EventType.RESOURCE_FLOW_UPDATED, handleResourceFlowUpdate),
        moduleEventBus.subscribe(EventType.RESOURCE_NODE_ADDED, handleResourceFlowUpdate),
        moduleEventBus.subscribe(EventType.RESOURCE_NODE_REMOVED, handleResourceFlowUpdate),
        moduleEventBus.subscribe(EventType.RESOURCE_CONNECTION_ADDED, handleResourceFlowUpdate),
        moduleEventBus.subscribe(EventType.RESOURCE_CONNECTION_REMOVED, handleResourceFlowUpdate),
        moduleEventBus.subscribe(
          EventType.RESOURCE_FLOW_OPTIMIZATION_COMPLETED,
          handleResourceFlowUpdate
        ),
      ];

      // Return a cleanup function that unsubscribes from all
      return () => {
        subscriptions.forEach(unsubscribe => unsubscribe());
      };
    },
    onUnmount: () => {
      console.warn('ResourceFlowDiagram unmounted');
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    },
  });

  const fetchResourceFlowData = useCallback(() => {
    setLoading(true);
    setError(null);

    if (networkData.nodes.length > 0) {
      setPreviousNetworkData(networkData);
    }

    setTimeout(() => {
      try {
        // TODO: Replace mock data with actual API call using ResourceFlowManager
        // const mockData = generateMockFlowData(); // Removed usage
        // Set empty data as placeholder until real data fetching is implemented
        setNetworkData({ nodes: [], links: [] });
        setLoading(false);
      } catch (err) {
        setError('Failed to load resource flow data');
        setLoading(false);
        errorLoggingService.logError(
          err instanceof Error ? err : new Error('Error fetching resource flow data'),
          ErrorType.NETWORK,
          ErrorSeverity.MEDIUM,
          { componentName: 'ResourceFlowDiagram', action: 'fetchResourceFlowData' }
        );
      }
    }, 0);
  }, []);

  // Convert network data to particle data points
  const getParticleDataPoints = useCallback(
    (data: NetworkData<FlowNode, FlowConnection>): DataPoint[] => {
      return data?.nodes.map(node => {
        const resourceKeys = Object.keys(node.resources) as ResourceType[];
        const firstResource = resourceKeys.length > 0 ? resourceKeys[0] : undefined;
        return {
          id: node.id,
          position: { x: node.x ?? 0, y: node.y ?? 0 }, // Assuming FlowNode has x/y from D3
          value: resourceKeys.length, // Value based on number of resources managed
          resourceType: firstResource, // Use the first resource type, or handle undefined
          size: 15, // Adjust size based on node properties if needed
          opacity: node.active ? 0.8 : 0.4,
        };
      });
    },
    []
  );

  // Handle transition completion - Use original name matching prop
  const handleTransitionComplete = useCallback(() => {
    setPreviousNetworkData(null);
  }, []);

  // Render visualization using D3
  useEffect(() => {
    if (!svgRef.current || loading || networkData.nodes.length === 0) {
      return;
    }

    // Clear unknownnown existing visualization
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Add container group for zooming
    const container = svg.append('g').attr('class', 'container');

    // Add zoom behavior
    if (interactive) {
      zoomRef.current = createSvgZoomBehavior<SVGSVGElement>({
        scaleExtentMin: 0.1,
        scaleExtentMax: 4,
        onZoom: (event: TypedZoomEvent<SVGSVGElement, unknown>) => {
          container.attr('transform', event.transform.toString());
        },
      });
      if (zoomRef.current) {
        svg.call(zoomRef.current);
      }
    } else {
      svg.on('.zoom', null);
    }

    // Create D3 force simulation with specific types
    const simulation = d3
      .forceSimulation<FlowNode, FlowConnection>(networkData.nodes)
      .force(
        'link',
        d3
          .forceLink<FlowNode, FlowConnection>(networkData.links)
          .id(d => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Store simulation reference for cleanup
    simulationRef.current = simulation;

    // Setup arrow markers for links
    container
      .append('defs')
      .selectAll('marker')
      .data([
        'default', // Keep default marker?
        ...Object.values(ResourceType), // Use all resource types
      ])
      .enter()
      .append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20) // Adjust based on node radius
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', d => getResourceColor(d as ResourceType))
      .attr('d', 'M0,-5L10,0L0,5');

    // Create links using FlowConnection type
    const link = container
      .append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(networkData.links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('stroke', d => getResourceColor(d.resourceTypes[0]))
      .attr('stroke-width', d => {
        const maxRate = d.maxRate ?? 1;
        const currentRate = d.currentRate ?? 0;
        return Math.max(1, 3 * (maxRate > 0 ? currentRate / maxRate : 0));
      })
      .attr('stroke-opacity', d => (d.active ? 0.8 : 0.2))
      .attr('fill', 'none')
      .attr('marker-end', d => `url(#arrow-${d.resourceTypes[0]})`)
      .on('click', function (event, d) {
        if (onConnectionClick) {
          onConnectionClick(d.id);
        }
      });

    // Add animated flow effect to links
    link
      .append('animate')
      .attr('attributeName', 'stroke-dashoffset')
      .attr('values', '0;100') // Adjust animation based on rate?
      .attr('dur', d => {
        const maxRate = d.maxRate ?? 1;
        const currentRate = d.currentRate ?? 0;
        const rateRatio = maxRate > 0 ? currentRate / maxRate : 0;
        return rateRatio > 0 ? Math.max(1, 10 / rateRatio) + 's' : '10s'; // Prevent division by zero
      })
      .attr('repeatCount', 'indefinite');

    // Create nodes using FlowNode type
    const node = container
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(networkData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('data-id', d => d.id)
      .attr('data-type', d => d.type)
      .on('click', function (event, d) {
        if (onNodeClick) {
          onNodeClick(d.id, d.type as ResourceFlowNodeType);
        }
      });

    // Add node shape based on type
    node
      .append('circle')
      .attr('r', 15)
      .attr('fill', d => getNodeFill(d as FlowNode))
      .attr('stroke', d => (d.active ? '#fff' : '#666'))
      .attr('stroke-width', d => (d.id === selectedNodeId ? 3 : 1))
      .attr('stroke-opacity', 0.8)
      .attr('fill-opacity', d => (d.active ? 0.8 : 0.4));

    // Add node icon based on type
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#fff')
      .text(d => getNodeIcon(d.type as ResourceFlowNodeType));

    // Add node label if enabled
    if (showLabels) {
      node
        .append('text')
        .attr('dy', 30)
        .attr('text-anchor', 'middle')
        .attr('class', 'node-label')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .text(d => getNodeLabel(d as FlowNode));
    }

    // Add resource indicators around node
    node.each(function (d_node) {
      const resourceGroup = d3.select(this).append('g').attr('class', 'resource-indicators');
      const nodeData = d_node as FlowNode;
      const resourceKeys = Object.keys(nodeData.resources);

      // Filter and validate keys - check existence in converter map
      const validResourceTypeStrings = resourceKeys.filter(
        key => ResourceTypeConverter.stringToEnum(key) !== undefined
      );

      validResourceTypeStrings.forEach((resourceTypeString, i) => {
        // Convert string back to enum member using the converter
        const resourceTypeEnum = ResourceTypeConverter.stringToEnum(resourceTypeString);

        if (resourceTypeEnum) {
          // Should always be true if filter worked
          // Calculate position based on the index of valid resources
          const angle = i * ((2 * Math.PI) / validResourceTypeStrings.length);
          const x = Math.cos(angle) * 20;
          const y = Math.sin(angle) * 20;

          resourceGroup
            .append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 5)
            // Pass the enum member to getResourceColor
            .attr('fill', () => getResourceColor(resourceTypeEnum));
        }
      });
    });

    // Add drag behavior if interactive
    if (interactive) {
      node.call(
        d3
          .drag<SVGGElement, FlowNode>() // Use FlowNode here
          .on('start', (event, d) => {
            if (!event?.active) {
              simulation.alphaTarget(0.3).restart();
            }
            d.fx = d.x; // Use d.x from D3 simulation
            d.fy = d.y; // Use d.y from D3 simulation
          })
          .on('drag', (event, d) => {
            d.fx = event?.x;
            d.fy = event?.y;
          })
          .on('end', (event, d) => {
            if (!event?.active) {
              simulation.alphaTarget(0);
            }
            d.fx = null;
            d.fy = null;
          })
      );
    }

    // Add legend if enabled
    if (showLegend) {
      const legend = svg
        .append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(20, ${height - 120})`);

      // Node type legend
      const nodeTypes: ResourceFlowNodeType[] = Object.values(ResourceFlowNodeType);
      nodeTypes.forEach((type, i) => {
        const typeGroup = legend.append('g').attr('transform', `translate(0, ${i * 25})`);

        // Create a temporary FlowNode for getNodeFill
        const tempNode: Partial<FlowNode> = { type: type };

        typeGroup
          .append('circle')
          .attr('r', 8)
          .attr('fill', () => getNodeFill(tempNode as FlowNode));

        typeGroup.append('text').attr('x', 15).attr('y', 5).text(type);
      });

      // Resource type legend
      const resourceLegend = svg
        .append('g')
        .attr('class', 'resource-legend')
        .attr('transform', `translate(${width - 120}, ${height - 120})`);

      const resourceTypes: ResourceType[] = Object.values(ResourceType);
      resourceTypes.forEach((type, i) => {
        const resourceGroup = resourceLegend
          .append('g')
          .attr('transform', `translate(0, ${i * 25})`);

        resourceGroup
          .append('rect')
          .attr('width', 15)
          .attr('height', 5)
          .attr('fill', () => getResourceColor(type));

        resourceGroup
          .append('text')
          .attr('x', 20)
          .attr('y', 5)
          .text(ResourceTypeInfo[type]?.displayName ?? type);
      });
    }

    // Simulation tick handler
    simulation.on('tick', () => {
      link.attr('d', d => {
        // Use unknown cast before FlowNode cast
        const sourceNode = d.source as unknown as FlowNode;
        const targetNode = d.target as unknown as FlowNode;
        // Defensive checks for undefined positions remain useful
        if (
          typeof sourceNode.x === 'undefined' ||
          typeof sourceNode.y === 'undefined' ||
          typeof targetNode.x === 'undefined' ||
          typeof targetNode.y === 'undefined'
        ) {
          return null;
        }
        return `M${sourceNode.x},${sourceNode.y} L${targetNode.x},${targetNode.y}`;
      });

      node.attr('transform', d => {
        // Defensive checks for undefined positions remain useful
        if (typeof d.x === 'undefined' || typeof d.y === 'undefined') {
          return 'translate(0,0)';
        }
        return `translate(${d.x},${d.y})`;
      });
    });

    // Cleanup simulation on component unmount
    return () => {
      simulation.stop();
    };
  }, [
    networkData,
    width,
    height,
    interactive,
    showLabels,
    showLegend,
    focusedResourceType,
    selectedNodeId,
    onNodeClick,
    onConnectionClick,
    loading,
  ]); // Added loading

  const currentParticles = useMemo(() => {
    return networkData ? getParticleDataPoints(networkData) : [];
  }, [networkData, getParticleDataPoints]);

  const _drawParticles = useCallback((particles: DataPoint[]) => {
    // Store current particle IDs for the next render cycle
    const currentParticleIds = new Set(particles.map(p => p.id));
    previousParticlesRef.current = currentParticleIds;

    // Clean up particles that no longer exist
    const previousParticleIds = previousParticlesRef.current || new Set();
    const particlesToRemove = Array.from(previousParticleIds).filter(
      id => !currentParticleIds.has(id)
    );

    // Add back the particle removal logic
    if (particlesToRemove.length > 0) {
      d3.select(_particleContainer.current)
        .selectAll('.particle')
        .filter(p => particlesToRemove.includes((p as DataPoint).id))
        .remove();
    }
  }, []);

  if (loading) {
    return <div>Loading Resource Flow...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg ref={svgRef} width={width} height={height}></svg>
      {previousNetworkData && currentParticles.length > 0 && (
        <DataTransitionParticleSystem
          sourceData={previousNetworkData ? getParticleDataPoints(previousNetworkData) : []}
          targetData={currentParticles}
          onTransitionComplete={handleTransitionComplete}
          width={width}
          height={height}
          duration={1000}
        />
      )}
    </div>
  );
};

// --- Local Helper Functions ---

/**
 * Gets the fill color for a flow node based on its type and active status.
 */
function getNodeFill(node: FlowNode): string {
  const active = node.active ?? true;
  // Use colors similar to ResourceVisualization.tsx if desired
  const colorMap = {
    [ResourceFlowNodeType.PRODUCER]: active ? '#4CAF50' : '#81C784', // Green
    [ResourceFlowNodeType.CONSUMER]: active ? '#F44336' : '#E57373', // Red
    [ResourceFlowNodeType.STORAGE]: active ? '#2196F3' : '#64B5F6', // Blue
    [ResourceFlowNodeType.CONVERTER]: active ? '#FF9800' : '#FFB74D', // Orange
    [ResourceFlowNodeType.SOURCE]: active ? '#00ACC1' : '#4DD0E1', // Cyan
    [ResourceFlowNodeType.SINK]: active ? '#7E57C2' : '#B39DDB', // Deep Purple
  };
  return colorMap[node.type] || (active ? '#9E9E9E' : '#E0E0E0'); // Default Grey
}

/**
 * Gets an icon character for a flow node type.
 */
function getNodeIcon(type: ResourceFlowNodeType): string {
  // Using emojis as simple icons
  const iconMap = {
    [ResourceFlowNodeType.PRODUCER]: '🏭', // Factory
    [ResourceFlowNodeType.CONSUMER]: '🏠', // House
    [ResourceFlowNodeType.STORAGE]: '📦', // Package
    [ResourceFlowNodeType.CONVERTER]: '🔧', // Wrench
    [ResourceFlowNodeType.SOURCE]: '▶️', // Play
    [ResourceFlowNodeType.SINK]: '⏹️', // Stop
  };
  return iconMap[type] || '?';
}

/**
 * Gets the display label for a flow node.
 */
function getNodeLabel(node: FlowNode): string {
  return node.id; // Use id as label for now
}

/**
 * Gets a color for a resource type.
 */
function getResourceColor(resourceType: ResourceType | string): string {
  // Use colors similar to ResourceVisualization.tsx
  const colorMap: Record<ResourceType, string> = {
    [ResourceType.MINERALS]: '#8B4513', // SaddleBrown from ResourceTypeUtils example
    [ResourceType.ENERGY]: '#FFD700', // Gold
    [ResourceType.POPULATION]: '#32CD32', // LimeGreen
    [ResourceType.RESEARCH]: '#1E90FF', // DodgerBlue
    [ResourceType.PLASMA]: '#FF1493', // DeepPink
    [ResourceType.GAS]: '#00FFFF', // Cyan
    [ResourceType.EXOTIC]: '#9932CC', // DarkOrchid
    [ResourceType.ORGANIC]: '#228B22', // ForestGreen
    [ResourceType.FOOD]: '#FFA500', // Orange
    [ResourceType.IRON]: '#A52A2A', // Brown
    [ResourceType.COPPER]: '#B87333', // Copper
    [ResourceType.TITANIUM]: '#C0C0C0', // Silver
    [ResourceType.URANIUM]: '#7FFF00', // Chartreuse
    [ResourceType.WATER]: '#1E90FF', // DodgerBlue
    [ResourceType.HELIUM]: '#87CEFA', // LightSkyBlue
    [ResourceType.DEUTERIUM]: '#00BFFF', // DeepSkyBlue
    [ResourceType.ANTIMATTER]: '#FF00FF', // Magenta
    [ResourceType.DARK_MATTER]: '#4B0082', // Indigo
    [ResourceType.EXOTIC_MATTER]: '#800080', // Purple
  };
  return colorMap[resourceType as ResourceType] || '#808080'; // Default gray
}

// Temporary type guard - replace or remove
// function isResourceType(value: string): value is string {
//     return Object.keys(ResourceType).includes(value);
// }

// --- End Helper Functions ---

export default ResourceFlowDiagram;
