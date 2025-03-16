import * as React from 'react';
import { useState } from 'react';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import FlowDiagram from './FlowDiagram';

/**
 * Interface for flow diagram node data
 */
interface FlowDataNode {
  id: string;
  name: string;
  type: 'source' | 'process' | 'destination';
  value: number;
  capacity?: number;
  efficiency?: number;
  description?: string;
}

/**
 * Interface for flow diagram link data
 */
interface FlowDataLink {
  id: string;
  source: string;
  target: string;
  value: number;
  maxCapacity?: number;
  utilization?: number;
  flowType?: string;
  active: boolean;
}

/**
 * Interface for the entire flow data structure
 */
interface FlowData {
  nodes: FlowDataNode[];
  links: FlowDataLink[];
}

/**
 * Demo component for FlowDiagram
 */
const FlowDiagramDemo: React.FC = () => {
  // Generate initial flow data with proper typing
  const generateInitialData = (): FlowData => {
    // Create source nodes
    const source1: FlowDataNode = {
      id: 'source1',
      name: 'Energy Grid',
      type: 'source',
      value: 85,
      capacity: 100,
      efficiency: 0.9,
      description: 'Main energy source for production facilities',
    };

    const source2: FlowDataNode = {
      id: 'source2',
      name: 'Resource Mine',
      type: 'source',
      value: 60,
      capacity: 75,
      efficiency: 0.8,
      description: 'Raw material extraction site',
    };

    // Create process nodes
    const process1: FlowDataNode = {
      id: 'process1',
      name: 'Processor A',
      type: 'process',
      value: 55,
      capacity: 80,
      efficiency: 0.7,
      description: 'Primary material processor',
    };

    const process2: FlowDataNode = {
      id: 'process2',
      name: 'Processor B',
      type: 'process',
      value: 40,
      capacity: 60,
      efficiency: 0.75,
      description: 'Secondary material processor',
    };

    const process3: FlowDataNode = {
      id: 'process3',
      name: 'Distributor',
      type: 'process',
      value: 70,
      capacity: 90,
      efficiency: 0.85,
      description: 'Distribution hub for products',
    };

    // Create destination nodes
    const dest1: FlowDataNode = {
      id: 'dest1',
      name: 'Market A',
      type: 'destination',
      value: 45,
      capacity: 50,
      efficiency: 0.95,
      description: 'Primary market for goods',
    };

    const dest2: FlowDataNode = {
      id: 'dest2',
      name: 'Market B',
      type: 'destination',
      value: 30,
      capacity: 40,
      efficiency: 0.9,
      description: 'Secondary market for goods',
    };

    // Create links between nodes
    const links: FlowDataLink[] = [
      {
        id: 'link1',
        source: 'source1',
        target: 'process1',
        value: 60,
        maxCapacity: 80,
        utilization: 0.75,
        flowType: ResourceType.ENERGY,
        active: true,
      },
      {
        id: 'link2',
        source: 'source1',
        target: 'process2',
        value: 25,
        maxCapacity: 30,
        utilization: 0.83,
        flowType: ResourceType.ENERGY,
        active: true,
      },
      {
        id: 'link3',
        source: 'source2',
        target: 'process1',
        value: 40,
        maxCapacity: 60,
        utilization: 0.67,
        flowType: 'materials',
        active: true,
      },
      {
        id: 'link4',
        source: 'source2',
        target: 'process2',
        value: 20,
        maxCapacity: 40,
        utilization: 0.5,
        flowType: 'materials',
        active: true,
      },
      {
        id: 'link5',
        source: 'process1',
        target: 'process3',
        value: 50,
        maxCapacity: 70,
        utilization: 0.71,
        flowType: 'products',
        active: true,
      },
      {
        id: 'link6',
        source: 'process2',
        target: 'process3',
        value: 35,
        maxCapacity: 50,
        utilization: 0.7,
        flowType: 'products',
        active: true,
      },
      {
        id: 'link7',
        source: 'process3',
        target: 'dest1',
        value: 45,
        maxCapacity: 50,
        utilization: 0.9,
        flowType: 'distribution',
        active: true,
      },
      {
        id: 'link8',
        source: 'process3',
        target: 'dest2',
        value: 30,
        maxCapacity: 40,
        utilization: 0.75,
        flowType: 'distribution',
        active: true,
      },
      {
        id: 'link9',
        source: 'source1',
        target: 'dest1',
        value: 10,
        maxCapacity: 20,
        utilization: 0.5,
        flowType: 'direct',
        active: false,
      },
    ];

    return {
      nodes: [source1, source2, process1, process2, process3, dest1, dest2],
      links,
    };
  };

  // State with proper typing
  const [flowData, setFlowData] = useState<FlowData>(generateInitialData());
  const [selectedNode, setSelectedNode] = useState<FlowDataNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<FlowDataLink | null>(null);
  const [animated, setAnimated] = useState<boolean>(true);

  // Toggle link activation with type-safe updates
  const toggleLinkStatus = (linkId: string) => {
    setFlowData(prevData => {
      // Create a new copy of the data with properly typed links
      const updatedLinks = prevData.links.map(link => {
        if (link.id === linkId) {
          // Toggle active status
          return { ...link, active: !link.active };
        }
        return link;
      });

      return {
        ...prevData,
        links: updatedLinks,
      };
    });
  };

  // Increase node value with proper typing
  const increaseNodeValue = (nodeId: string) => {
    setFlowData(prevData => {
      // Create a new copy of the data with properly typed nodes
      const updatedNodes = prevData.nodes.map(node => {
        if (node.id === nodeId && node.value < (node.capacity || 100)) {
          // Increase value
          return {
            ...node,
            value: Math.min(node.value + 5, node.capacity || 100),
          };
        }
        return node;
      });

      return {
        ...prevData,
        nodes: updatedNodes,
      };
    });
  };

  // Handle node click with proper typing
  const handleNodeClick = (nodeId: string, nodeData: FlowDataNode) => {
    setSelectedNode(nodeData);
    increaseNodeValue(nodeId);
  };

  // Handle link click with proper typing
  const handleLinkClick = (linkId: string, linkData: FlowDataLink) => {
    setSelectedLink(linkData);
    toggleLinkStatus(linkId);
  };

  // Reset flow data with proper typing
  const resetFlowData = () => {
    setFlowData(generateInitialData());
    setSelectedNode(null);
    setSelectedLink(null);
  };

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Flow Diagram Visualization</h2>

      <div className="mb-4 flex flex-wrap gap-4">
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={resetFlowData}
        >
          Reset Flow Data
        </button>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={animated}
            onChange={() => setAnimated(!animated)}
            className="mr-2"
          />
          Animate Flows
        </label>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="rounded border border-gray-300 p-4 lg:w-3/4">
          <FlowDiagram
            data={flowData}
            width={800}
            height={500}
            animated={animated}
            onNodeClick={handleNodeClick}
            onLinkClick={handleLinkClick}
          />
        </div>

        <div className="rounded border border-gray-300 p-4 lg:w-1/4">
          <h3 className="mb-2 text-lg font-semibold">Selection Details</h3>

          {selectedNode && (
            <div className="mb-4">
              <h4 className="font-medium text-blue-600">Selected Node</h4>
              <p>
                <span className="font-medium">Name:</span> {selectedNode.name}
              </p>
              <p>
                <span className="font-medium">Type:</span> {selectedNode.type}
              </p>
              <p>
                <span className="font-medium">Value:</span> {selectedNode.value}
                {selectedNode.capacity && `/${selectedNode.capacity}`}
              </p>
              {selectedNode.efficiency && (
                <p>
                  <span className="font-medium">Efficiency:</span>{' '}
                  {(selectedNode.efficiency * 100).toFixed(0)}%
                </p>
              )}
              {selectedNode.description && (
                <p>
                  <span className="font-medium">Description:</span> {selectedNode.description}
                </p>
              )}
            </div>
          )}

          {selectedLink && (
            <div>
              <h4 className="font-medium text-green-600">Selected Link</h4>
              <p>
                <span className="font-medium">From:</span>{' '}
                {flowData.nodes.find(n => n.id === selectedLink.source)?.name ||
                  selectedLink.source}
              </p>
              <p>
                <span className="font-medium">To:</span>{' '}
                {flowData.nodes.find(n => n.id === selectedLink.target)?.name ||
                  selectedLink.target}
              </p>
              <p>
                <span className="font-medium">Value:</span> {selectedLink.value}
                {selectedLink.maxCapacity && `/${selectedLink.maxCapacity}`}
              </p>
              {selectedLink.utilization && (
                <p>
                  <span className="font-medium">Utilization:</span>{' '}
                  {(selectedLink.utilization * 100).toFixed(0)}%
                </p>
              )}
              <p>
                <span className="font-medium">Status:</span>{' '}
                {selectedLink.active ? 'Active' : 'Inactive'}
              </p>
              {selectedLink.flowType && (
                <p>
                  <span className="font-medium">Flow Type:</span> {selectedLink.flowType}
                </p>
              )}
            </div>
          )}

          {!selectedNode && !selectedLink && (
            <p className="text-gray-500">
              Click on a node or link to see its details. Nodes will increase in value when clicked.
              Links will toggle their active state when clicked.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-lg font-semibold">Type Safety Features</h3>
        <ul className="list-disc pl-6 text-gray-700">
          <li>Strong typing for flow data model (nodes and links)</li>
          <li>Type-safe D3 force simulation with SimulationNodeDatum extension</li>
          <li>Proper type constraints for D3 events and selections</li>
          <li>Type-safe data transformations with conversion functions</li>
          <li>Animation state typing and proper event handling</li>
          <li>Type-safe callbacks for node and link interactions</li>
        </ul>
      </div>
    </div>
  );
};

export default FlowDiagramDemo;
