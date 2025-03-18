import * as d3 from 'd3';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useComponentLifecycle } from '../../../hooks/ui/useComponentLifecycle';
import { useComponentRegistration } from '../../../hooks/ui/useComponentRegistration';
import { moduleEventBus, ModuleEventType } from '../../../lib/modules/ModuleEvents';
import {
  FlowNodeType,
  ResourceTypeHelpers,
} from '../../../types/resources/StandardizedResourceTypes';
import { d3Accessors, SimulationNodeDatum } from '../../../types/visualizations/D3Types';
import DataTransitionParticleSystem, {
  DataPoint,
} from '../visualization/DataTransitionParticleSystem';
import { ResourceType } from './../../../types/resources/ResourceTypes';

interface ResourceFlowDiagramProps {
  width?: number;
  height?: number;
  interactive?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  focusedResourceType?: ResourceType;
  selectedNodeId?: string;
  onNodeClick?: (nodeId: string, type: FlowNodeType) => void;
  onConnectionClick?: (connectionId: string) => void;
}

interface FlowNetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

// Enhanced NetworkNode with proper D3 simulation node types
interface NetworkNode extends SimulationNodeDatum {
  id: string;
  type: FlowNodeType;
  resources: ResourceType[];
  active: boolean;
  efficiency?: number;
}

// Enhanced NetworkLink with proper D3 simulation link types
interface NetworkLink {
  id: string;
  source: string | NetworkNode;
  target: string | NetworkNode;
  resourceType: ResourceType;
  rate: number;
  maxRate: number;
  active: boolean;
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [networkData, setNetworkData] = useState<FlowNetworkData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkLink> | null>(null);
  const [previousNetworkData, setPreviousNetworkData] = useState<FlowNetworkData | null>(null);

  // Register with component registry
  useComponentRegistration({
    type: ResourceType.MINERALS,
    eventSubscriptions: [
      'RESOURCE_FLOW_UPDATED',
      'RESOURCE_NODE_ADDED',
      'RESOURCE_NODE_REMOVED',
      'RESOURCE_CONNECTION_ADDED',
      'RESOURCE_CONNECTION_REMOVED',
      'RESOURCE_FLOW_OPTIMIZATION_COMPLETED',
    ],
    updatePriority: 'medium',
  });

  useComponentLifecycle({
    onMount: () => {
      console.warn('ResourceFlowDiagram mounted');
      fetchResourceFlowData();

      // Subscribe to resource flow events
      return moduleEventBus.subscribe('*' as ModuleEventType, event => {
        if (
          event?.type === ('RESOURCE_FLOW_UPDATED' as ModuleEventType) ||
          event?.type === ('RESOURCE_NODE_ADDED' as ModuleEventType) ||
          event?.type === ('RESOURCE_NODE_REMOVED' as ModuleEventType) ||
          event?.type === ('RESOURCE_CONNECTION_ADDED' as ModuleEventType) ||
          event?.type === ('RESOURCE_CONNECTION_REMOVED' as ModuleEventType) ||
          event?.type === ('RESOURCE_FLOW_OPTIMIZATION_COMPLETED' as ModuleEventType)
        ) {
          console.warn(`Resource flow event received: ${event?.type}`);
          fetchResourceFlowData();
        }
      });
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

    // Store current data as previous before updating
    if (networkData.nodes.length > 0) {
      setPreviousNetworkData(networkData);
    }

    // In a real implementation, this would call the resourceManager API
    setTimeout(() => {
      try {
        const mockData = generateMockFlowData();
        setNetworkData(mockData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load resource flow data');
        setLoading(false);
        console.error('Error fetching resource flow data:', err);
      }
    }, 500);
  }, [networkData]);

  // Convert network data to particle data points
  const getParticleDataPoints = useCallback((data: FlowNetworkData): DataPoint[] => {
    return data?.nodes.map(node => ({
      id: node.id,
      position: { x: node.x ?? 0, y: node.y ?? 0 },
      value: node.resources.length,
      resourceType: node.resources[0],
      size: 15,
      opacity: node.active ? 0.8 : 0.4,
    }));
  }, []);

  // Handle transition completion
  const handleTransitionComplete = useCallback(() => {
    setPreviousNetworkData(null);
  }, []);

  // Render visualization using D3
  useEffect(() => {
    if (!svgRef.current || loading || networkData.nodes.length === 0) {
      return;
    }

    // Clear any existing visualization
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Add container group for zooming
    const container = svg.append('g').attr('class', 'container');

    // Add zoom behavior
    if (interactive) {
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', event => {
          container.attr('transform', event?.transform);
        });

      svg.call(zoom);
    }

    // Create D3 force simulation
    const simulation = d3
      .forceSimulation<NetworkNode, NetworkLink>(networkData.nodes)
      .force(
        'link',
        d3
          .forceLink<NetworkNode, NetworkLink>(networkData.links)
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
        'default',
        ResourceType.MINERALS,
        ResourceType.ENERGY,
        ResourceType.PLASMA,
        ResourceType.GAS,
        ResourceType.RESEARCH,
      ])
      .enter()
      .append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', d => getResourceColor(d as ResourceType))
      .attr('d', 'M0,-5L10,0L0,5');

    // Create links
    const link = container
      .append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(networkData.links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('stroke', d => getResourceColor(d.resourceType))
      .attr('stroke-width', d => Math.max(1, 3 * (d.rate / d.maxRate)))
      .attr('stroke-opacity', d => (d.active ? 0.8 : 0.2))
      .attr('fill', 'none')
      .attr('marker-end', d => `url(#arrow-${d.resourceType})`)
      .on('click', function (event, d) {
        if (onConnectionClick) {
          onConnectionClick(d.id);
        }
      });

    // Add animated flow effect to links
    link
      .append('animate')
      .attr('attributeName', 'stroke-dashoffset')
      .attr('values', '0;100')
      .attr('dur', d => 10 / (d.rate / d.maxRate) + 's')
      .attr('repeatCount', 'indefinite');

    // Create nodes
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
          onNodeClick(d.id, d.type);
        }
      });

    // Add node shape based on type
    node
      .append('circle')
      .attr('r', 15)
      .attr('fill', d => getNodeFill(d))
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
      .text(d => getNodeIcon(d.type));

    // Add node label if enabled
    if (showLabels) {
      node
        .append('text')
        .attr('dy', 30)
        .attr('text-anchor', 'middle')
        .attr('class', 'node-label')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .text(d => getNodeLabel(d));
    }

    // Add resource indicators around node
    node.each(function (d) {
      const resourceGroup = d3.select(this).append('g').attr('class', 'resource-indicators');

      d.resources.forEach((resource, i) => {
        const angle = i * ((2 * Math.PI) / d.resources.length);
        const x = Math.cos(angle) * 20;
        const y = Math.sin(angle) * 20;

        resourceGroup
          .append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 5)
          .attr('fill', getResourceColor(resource));
      });
    });

    // Add drag behavior if interactive
    if (interactive) {
      node.call(
        d3
          .drag<SVGGElement, NetworkNode>()
          .on('start', (event, d) => {
            if (!event?.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event?.x;
            d.fy = event?.y;
          })
          .on('end', (event, d) => {
            if (!event?.active) simulation.alphaTarget(0);
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
      const nodeTypes: FlowNodeType[] = [
        FlowNodeType.PRODUCER,
        FlowNodeType.CONSUMER,
        FlowNodeType.STORAGE,
        FlowNodeType.CONVERTER,
      ];
      nodeTypes.forEach((type, i) => {
        const typeGroup = legend.append('g').attr('transform', `translate(0, ${i * 25})`);

        typeGroup
          .append('circle')
          .attr('r', 8)
          .attr('fill', getNodeFill({ type } as NetworkNode));

        typeGroup
          .append('text')
          .attr('x', 15)
          .attr('y', 5)
          .text(type.charAt(0).toUpperCase() + type.slice(1));
      });

      // Resource type legend
      const resourceLegend = svg
        .append('g')
        .attr('class', 'resource-legend')
        .attr('transform', `translate(${width - 120}, ${height - 120})`);

      const resourceTypes: ResourceType[] = [
        ResourceType.MINERALS,
        ResourceType.ENERGY,
        ResourceType.PLASMA,
        ResourceType.GAS,
        ResourceType.RESEARCH,
      ];
      resourceTypes.forEach((type, i) => {
        const resourceGroup = resourceLegend
          .append('g')
          .attr('transform', `translate(0, ${i * 25})`);

        resourceGroup
          .append('rect')
          .attr('width', 15)
          .attr('height', 5)
          .attr('fill', getResourceColor(type));

        resourceGroup
          .append('text')
          .attr('x', 20)
          .attr('y', 5)
          .text(ResourceTypeHelpers.getDisplayName(type));
      });
    }

    // Update function for force simulation (with type-safe access)
    simulation.on('tick', () => {
      link.attr('d', d => {
        // Type-safe access to source and target coordinates
        const sourceNode = findNode(d.source);
        const targetNode = findNode(d.target);

        if (!sourceNode || !targetNode) return '';

        // Create curved paths between nodes using safe accessors
        const sourceX = d3Accessors.getX(sourceNode);
        const sourceY = d3Accessors.getY(sourceNode);
        const targetX = d3Accessors.getX(targetNode);
        const targetY = d3Accessors.getY(targetNode);

        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const dr = Math.sqrt(dx * dx + dy * dy) * 2;

        return `M${sourceX},${sourceY}A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
      });

      // Type-safe node position updates
      node.attr('transform', d => {
        const x = d3Accessors.getX(d);
        const y = d3Accessors.getY(d);
        return `translate(${x},${y})`;
      });
    });

    // Helper function to safely find a node from source/target reference
    function findNode(nodeRef: string | NetworkNode): NetworkNode | null {
      if (typeof nodeRef === 'string') {
        return networkData.nodes.find(node => node.id === nodeRef) || null;
      }
      return nodeRef;
    }

    // Run simulation
    simulation.alpha(1).restart();

    // Cleanup function
    return () => {
      simulation.stop();
    };
  }, [
    networkData,
    loading,
    width,
    height,
    interactive,
    showLabels,
    showLegend,
    selectedNodeId,
    onNodeClick,
    onConnectionClick,
  ]);

  // Generate mock data for demonstration purposes
  const generateMockFlowData = (): FlowNetworkData => {
    const mockNodes: NetworkNode[] = [
      {
        id: 'producer1',
        type: FlowNodeType.PRODUCER,
        resources: [ResourceType.MINERALS],
        active: true,
      },
      {
        id: 'producer2',
        type: FlowNodeType.PRODUCER,
        resources: [ResourceType.ENERGY],
        active: true,
      },
      {
        id: 'storage1',
        type: FlowNodeType.STORAGE,
        resources: [ResourceType.MINERALS, ResourceType.ENERGY],
        active: true,
      },
      {
        id: 'converter1',
        type: FlowNodeType.CONVERTER,
        resources: [ResourceType.MINERALS, ResourceType.ENERGY, ResourceType.PLASMA],
        active: true,
        efficiency: 0.85,
      },
      {
        id: 'consumer1',
        type: FlowNodeType.CONSUMER,
        resources: [ResourceType.PLASMA],
        active: true,
      },
      {
        id: 'consumer2',
        type: FlowNodeType.CONSUMER,
        resources: [ResourceType.MINERALS, ResourceType.ENERGY],
        active: true,
      },
    ];

    const mockLinks: NetworkLink[] = [
      {
        id: 'conn1',
        source: 'producer1',
        target: 'storage1',
        resourceType: ResourceType.MINERALS,
        rate: 12,
        maxRate: 20,
        active: true,
      },
      {
        id: 'conn2',
        source: 'producer2',
        target: 'storage1',
        resourceType: ResourceType.ENERGY,
        rate: 18,
        maxRate: 25,
        active: true,
      },
      {
        id: 'conn3',
        source: 'storage1',
        target: 'converter1',
        resourceType: ResourceType.MINERALS,
        rate: 8,
        maxRate: 15,
        active: true,
      },
      {
        id: 'conn4',
        source: 'storage1',
        target: 'converter1',
        resourceType: ResourceType.ENERGY,
        rate: 10,
        maxRate: 15,
        active: true,
      },
      {
        id: 'conn5',
        source: 'converter1',
        target: 'consumer1',
        resourceType: ResourceType.PLASMA,
        rate: 5,
        maxRate: 10,
        active: true,
      },
      {
        id: 'conn6',
        source: 'storage1',
        target: 'consumer2',
        resourceType: ResourceType.MINERALS,
        rate: 3,
        maxRate: 10,
        active: true,
      },
      {
        id: 'conn7',
        source: 'storage1',
        target: 'consumer2',
        resourceType: ResourceType.ENERGY,
        rate: 5,
        maxRate: 10,
        active: true,
      },
    ];

    return { nodes: mockNodes, links: mockLinks };
  };

  // Memoize resource color mapping function
  const getResourceColor = useCallback((resourceType: ResourceType): string => {
    switch (resourceType) {
      case ResourceType.MINERALS:
        return '#4CAF50';
      case ResourceType.ENERGY:
        return '#FFC107';
      case ResourceType.PLASMA:
        return '#9C27B0';
      case ResourceType.GAS:
        return '#03A9F4';
      case ResourceType.RESEARCH:
        return '#3F51B5';
      default:
        return '#9E9E9E';
    }
  }, []);

  // Memoize node fill function
  const getNodeFill = useCallback((node: NetworkNode): string => {
    if (!node.active) {
      return '#555';
    }

    switch (node.type) {
      case FlowNodeType.PRODUCER:
        return '#388E3C';
      case FlowNodeType.CONSUMER:
        return '#D32F2F';
      case FlowNodeType.STORAGE:
        return '#1976D2';
      case FlowNodeType.CONVERTER:
        return '#7B1FA2';
      default:
        return '#616161';
    }
  }, []);

  // Memoize node icon function
  const getNodeIcon = useCallback((type: FlowNodeType): string => {
    switch (type) {
      case FlowNodeType.PRODUCER:
        return '⚡';
      case FlowNodeType.CONSUMER:
        return '🔄';
      case FlowNodeType.STORAGE:
        return '💾';
      case FlowNodeType.CONVERTER:
        return '⚙️';
      default:
        return '?';
    }
  }, []);

  // Memoize node label function
  const getNodeLabel = useCallback((node: NetworkNode): string => {
    const typeLabel = node.type.charAt(0).toUpperCase() + node.type.slice(1);
    const resourceStr =
      node.resources.length > 0
        ? ` (${node.resources.map(r => ResourceTypeHelpers.getDisplayName(r)).join(', ')})`
        : '';
    return `${typeLabel}${resourceStr}`;
  }, []);

  // Filter network data based on focused resource type
  const filteredNetworkData = useMemo(() => {
    if (!focusedResourceType) {
      return networkData;
    }

    const filteredNodes = networkData.nodes.filter(node =>
      node.resources.includes(focusedResourceType)
    );

    const nodeIds = new Set(filteredNodes.map(node => node.id));

    const filteredLinks = networkData.links.filter(
      link =>
        (typeof link.source === 'string'
          ? nodeIds.has(link.source)
          : nodeIds.has(link.source.id)) &&
        (typeof link.target === 'string'
          ? nodeIds.has(link.target)
          : nodeIds.has(link.target.id)) &&
        link.resourceType === focusedResourceType
    );

    return {
      nodes: filteredNodes,
      links: filteredLinks,
    };
  }, [networkData, focusedResourceType]);

  // Render component
  return (
    <div className="resource-flow-diagram">
      <div className="diagram-header">
        <h3>Resource Flow Network</h3>
        {loading && <div className="loading-indicator">Loading...</div>}
        {error && <div className="error-message">{error}</div>}
      </div>

      <div style={{ position: 'relative' }}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="flow-diagram-svg"
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            background: '#21252b',
          }}
        />

        {/* Add particle system for transitions */}
        {previousNetworkData && (
          <DataTransitionParticleSystem
            width={width}
            height={height}
            quality="high"
            className="pointer-events-none absolute left-0 top-0"
            sourceData={getParticleDataPoints(previousNetworkData)}
            targetData={getParticleDataPoints(networkData)}
            onTransitionComplete={handleTransitionComplete}
          />
        )}
      </div>

      <div className="diagram-footer">
        <div className="diagram-stats">
          <span>{filteredNetworkData.nodes.length} nodes</span>
          <span>{filteredNetworkData.links.length} connections</span>
        </div>
        {interactive && (
          <div className="diagram-instructions">
            Drag nodes to reposition. Zoom and pan to navigate.
          </div>
        )}
      </div>
    </div>
  );
};

// Export a memoized version of the component
export default React.memo(ResourceFlowDiagram);
