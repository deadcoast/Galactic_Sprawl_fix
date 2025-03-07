import React, { useState } from 'react';
import { useComponentRegistration } from '../../../hooks/ui/useComponentRegistration';
import { FlowNodeType } from '../../../managers/resource/ResourceFlowManager';
import { componentRegistry } from '../../../services/ComponentRegistryService';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import ResourceFlowDiagram from './ResourceFlowDiagram';

/**
 * ResourceFlowDiagramDemo component
 *
 * A demonstration component for the ResourceFlowDiagram that
 * provides controls for filtering and interacting with the diagram.
 */
const ResourceFlowDiagramDemo: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType | undefined>(
    undefined
  );
  const [showLabels, setShowLabels] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [registryInfo, setRegistryInfo] = useState({
    componentCount: 0,
    flowDiagramComponents: 0,
  });

  // Register with component registry
  useComponentRegistration({
    type: 'ResourceFlowDiagramDemo',
    eventSubscriptions: ['REGISTRY_UPDATED'],
    updatePriority: 'low',
  });

  // Handle node click
  const handleNodeClick = (nodeId: string, nodeType: FlowNodeType) => {
    console.log(`Node clicked: ${nodeId} (${nodeType})`);
    setSelectedNodeId(selectedNodeId === nodeId ? undefined : nodeId);
  };

  // Handle connection click
  const handleConnectionClick = (connectionId: string) => {
    console.log(`Connection clicked: ${connectionId}`);
  };

  // Update registry information
  const updateRegistryInfo = () => {
    const allComponents = componentRegistry.getAllComponents();
    const flowDiagramComponents = componentRegistry.getComponentsByType('ResourceFlowDiagram');

    setRegistryInfo({
      componentCount: allComponents.length,
      flowDiagramComponents: flowDiagramComponents.length,
    });
  };

  return (
    <div className="resource-flow-diagram-demo">
      <div className="demo-header">
        <h2>Resource Flow Network Visualization</h2>
        <p>
          This visualization shows the flow of resources between different nodes in the system.
          Producers generate resources, consumers use them, storage nodes store them, and converters
          transform resources from one type to another.
        </p>
      </div>

      <div className="demo-controls">
        <div className="control-section">
          <h3>Display Options</h3>
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={() => setShowLabels(!showLabels)}
              />
              Show Labels
            </label>

            <label>
              <input
                type="checkbox"
                checked={showLegend}
                onChange={() => setShowLegend(!showLegend)}
              />
              Show Legend
            </label>
          </div>
        </div>

        <div className="control-section">
          <h3>Resource Filter</h3>
          <div className="control-group">
            <select
              value={selectedResourceType || ''}
              onChange={e => {
                const value = e.target.value;
                setSelectedResourceType(value ? (value as ResourceType) : undefined);
              }}
            >
              <option value="">All Resources</option>
              <option value="minerals">Minerals</option>
              <option value="energy">Energy</option>
              <option value="plasma">Plasma</option>
              <option value="gas">Gas</option>
              <option value="research">Research</option>
            </select>
          </div>
        </div>

        <div className="control-section">
          <h3>Component Registry</h3>
          <div className="registry-stats">
            <div>Total Components: {registryInfo.componentCount}</div>
            <div>Flow Diagram Components: {registryInfo.flowDiagramComponents}</div>
            <button onClick={updateRegistryInfo}>Update Registry Info</button>
          </div>
        </div>

        <div className="control-section">
          <h3>Selected Node</h3>
          <div className="selected-node-info">
            {selectedNodeId ? (
              <div>
                <p>ID: {selectedNodeId}</p>
                <button onClick={() => setSelectedNodeId(undefined)}>Clear Selection</button>
              </div>
            ) : (
              <p>No node selected. Click on a node to select it.</p>
            )}
          </div>
        </div>
      </div>

      <div className="diagram-container">
        <ResourceFlowDiagram
          width={900}
          height={600}
          interactive={true}
          showLabels={showLabels}
          showLegend={showLegend}
          focusedResourceType={selectedResourceType}
          selectedNodeId={selectedNodeId}
          onNodeClick={handleNodeClick}
          onConnectionClick={handleConnectionClick}
        />
      </div>

      <div className="demo-instructions">
        <h3>How to Use</h3>
        <ul>
          <li>Drag nodes to reposition them in the network</li>
          <li>Click on nodes to select them and view detailed information</li>
          <li>Use the mouse wheel to zoom in and out</li>
          <li>Click and drag empty space to pan the view</li>
          <li>Use the resource filter to highlight specific resource flows</li>
        </ul>
      </div>

      <div className="education-section">
        <h3>About Resource Flow Networks</h3>
        <p>
          Resource flow networks form the backbone of the galactic economy. In this visualization:
        </p>
        <ul>
          <li>
            <span className="node-type producer">⚙️ Producers</span> generate resources like mining
            facilities and power plants
          </li>
          <li>
            <span className="node-type storage">📦 Storage</span> nodes store resources for future
            use
          </li>
          <li>
            <span className="node-type converter">⚗️ Converters</span> transform resources from one
            type to another
          </li>
          <li>
            <span className="node-type consumer">🔄 Consumers</span> utilize resources for various
            operations
          </li>
        </ul>
        <p>
          The arrows indicate the direction of resource flow, and their thickness represents the
          current flow rate. The small colored circles around each node show the types of resources
          that node can handle.
        </p>
      </div>
    </div>
  );
};

export default ResourceFlowDiagramDemo;
