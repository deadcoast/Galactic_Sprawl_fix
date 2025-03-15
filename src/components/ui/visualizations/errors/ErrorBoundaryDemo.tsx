import * as React from "react";
import { useState } from 'react';
import { ResourceType } from "./../../../../types/resources/ResourceTypes";
import {
  SafeFlowDiagram,
  SafeResourceDistributionChart,
  withVisualizationErrorBoundary,
} from './VisualizationErrorBoundaries';

// Define the FlowData interfaces here since we only need them for typing
interface FlowDataNode {
  id: string;
  name: string;
  type: 'source' | 'process' | 'destination';
  value: number;
  capacity?: number;
  efficiency?: number;
  description?: string;
}

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

interface FlowData {
  nodes: FlowDataNode[];
  links: FlowDataLink[];
}

/**
 * A broken component that will throw an error
 */
const BrokenD3Component: React.FC = () => {
  // This will throw an error when the component renders
  throw new Error('This is a deliberate error to demonstrate error boundaries');

  // This code won't be reached
  return <div>This won't render</div>;
};

/**
 * Wrap the broken component with an error boundary
 */
const SafeBrokenComponent = withVisualizationErrorBoundary(BrokenD3Component, 'BrokenD3Component');

/**
 * Type for invalid flow data that will cause errors
 */
const invalidFlowData: FlowData = {
  nodes: [
    { id: 'node1', name: 'Node 1', type: 'source' as const, value: 50 },
    // Missing required fields in this node (will cause an error):
    { name: 'Bad Node' } as FlowDataNode,
    { id: 'node3', name: 'Node 3', type: 'destination' as const, value: 30 },
  ],
  links: [
    { id: 'link1', source: 'node1', target: 'node3', value: 20, active: true },
    // Link with invalid source/target (will cause an error):
    { id: 'link2', source: 'node1', target: 'nonexistent', value: 10, active: true },
  ],
};

/**
 * Valid flow data for comparison
 */
const validFlowData: FlowData = {
  nodes: [
    { id: 'node1', name: 'Source', type: 'source' as const, value: 50 },
    { id: 'node2', name: 'Process', type: 'process' as const, value: 40 },
    { id: 'node3', name: 'Destination', type: 'destination' as const, value: 30 },
  ],
  links: [
    { id: 'link1', source: 'node1', target: 'node2', value: 20, active: true },
    { id: 'link2', source: 'node2', target: 'node3', value: 10, active: true },
  ],
};

/**
 * Valid resource data for ResourceDistributionChart
 */
const validResourceData = [
  { resourceType: ResourceType.MINERALS, amount: 75, location: 'Alpha Sector', efficiency: 0.8 },
  { resourceType: ResourceType.ENERGY, amount: 60, location: 'Beta Sector', efficiency: 0.9 },
  { resourceType: ResourceType.POPULATION, amount: 40, location: 'Gamma Sector', efficiency: 0.7 },
];

/**
 * Error Boundary Demo Component
 */
const ErrorBoundaryDemo: React.FC = () => {
  const [useValidData, setUseValidData] = useState(true);
  const [showBrokenComponent, setShowBrokenComponent] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Toggle data validity to trigger an error
  const toggleDataValidity = () => {
    setUseValidData(!useValidData);
  };

  // Force a reset of error boundaries
  const resetErrorBoundaries = () => {
    setResetKey(prev => prev + 1);
  };

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">D3 Visualization Error Boundaries Demo</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          className={`rounded px-4 py-2 ${
            useValidData ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
          onClick={toggleDataValidity}
        >
          {useValidData ? 'Use Valid Data' : 'Use Invalid Data'}
        </button>

        <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={resetErrorBoundaries}>
          Reset Error Boundaries
        </button>

        <button
          className="rounded bg-purple-600 px-4 py-2 text-white"
          onClick={() => setShowBrokenComponent(!showBrokenComponent)}
        >
          {showBrokenComponent ? 'Hide' : 'Show'} Broken Component
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Flow Diagram with error boundary */}
        <div className="rounded border border-gray-300 p-4">
          <h2 className="mb-3 text-xl font-semibold">Flow Diagram</h2>
          <div className="h-64 w-full">
            <SafeFlowDiagram
              data={useValidData ? validFlowData : invalidFlowData}
              width={400}
              height={250}
              resetKeys={[resetKey, useValidData]}
              errorContext={{
                dataValidity: useValidData ? 'valid' : 'invalid',
                nodeCount: useValidData ? validFlowData.nodes.length : invalidFlowData.nodes.length,
              }}
            />
          </div>
        </div>

        {/* Resource Distribution Chart with error boundary */}
        <div className="rounded border border-gray-300 p-4">
          <h2 className="mb-3 text-xl font-semibold">Resource Distribution</h2>
          <div className="h-64 w-full">
            <SafeResourceDistributionChart
              data={validResourceData}
              width={400}
              height={250}
              resetKeys={[resetKey]}
            />
          </div>
        </div>

        {/* Broken component with error boundary */}
        {showBrokenComponent && (
          <div className="rounded border border-gray-300 p-4 md:col-span-2">
            <h2 className="mb-3 text-xl font-semibold">Broken Component</h2>
            <div className="h-64 w-full">
              <SafeBrokenComponent
                resetKeys={[resetKey]}
                errorContext={{ deliberateError: true }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded bg-gray-100 p-4">
        <h3 className="mb-2 text-lg font-semibold">How This Works</h3>
        <p className="mb-2">
          This demo showcases React Error Boundaries for D3 visualizations. Error boundaries catch
          JavaScript errors during rendering, in lifecycle methods, and in component constructors,
          preventing the entire application from crashing.
        </p>
        <ul className="list-disc pl-6">
          <li className="mb-1">
            Toggle between valid and invalid data to see how the error boundary catches and displays
            errors.
          </li>
          <li className="mb-1">
            Use the "Reset Error Boundaries" button to clear errors and try rendering again.
          </li>
          <li className="mb-1">
            Show the broken component to see how errors in component initialization are handled.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ErrorBoundaryDemo;
