import * as React from "react";
import { useState } from 'react';
import { ResourceType } from "./../../../types/resources/ResourceTypes";
import ResourceDistributionChart from './ResourceDistributionChart';

/**
 * Interface for resource distribution data
 */
interface ResourceDistributionData {
  resourceType: ResourceType;
  amount: number;
  location: string;
  efficiency: number;
}

/**
 * Demo component for ResourceDistributionChart
 */
const ResourceDistributionChartDemo: React.FC = () => {
  // Sample data for the visualization
  const [resourceData, setResourceData] = useState<ResourceDistributionData[]>([
    { resourceType: ResourceType.MINERALS, amount: 75, location: 'Alpha Sector', efficiency: 0.8 },
    { resourceType: ResourceType.ENERGY, amount: 60, location: 'Beta Sector', efficiency: 0.9 },
    {
      resourceType: ResourceType.POPULATION,
      amount: 40,
      location: 'Gamma Sector',
      efficiency: 0.7,
    },
    { resourceType: ResourceType.RESEARCH, amount: 25, location: 'Delta Sector', efficiency: 0.6 },
    { resourceType: ResourceType.PLASMA, amount: 55, location: 'Epsilon Sector', efficiency: 0.85 },
    { resourceType: ResourceType.GAS, amount: 30, location: 'Zeta Sector', efficiency: 0.75 },
    { resourceType: ResourceType.EXOTIC, amount: 15, location: 'Eta Sector', efficiency: 0.95 },
  ]);

  // Toggle for showing/hiding labels
  const [showLabels, setShowLabels] = useState(true);

  // Toggle for interactivity
  const [interactive, setInteractive] = useState(true);

  // Function to add a random resource
  const addRandomResource = () => {
    const resourceTypes = Object.values(ResourceType).filter(
      value => typeof value === 'string'
    ) as ResourceType[];

    const newResource: ResourceDistributionData = {
      resourceType: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
      amount: Math.floor(Math.random() * 90) + 10,
      location: `Sector-${Math.floor(Math.random() * 100)}`,
      efficiency: Math.random() * 0.7 + 0.3, // Between 0.3 and 1.0
    };

    setResourceData(prev => [...prev, newResource]);
  };

  // Function to reset data
  const resetData = () => {
    setResourceData([
      {
        resourceType: ResourceType.MINERALS,
        amount: 75,
        location: 'Alpha Sector',
        efficiency: 0.8,
      },
      { resourceType: ResourceType.ENERGY, amount: 60, location: 'Beta Sector', efficiency: 0.9 },
      {
        resourceType: ResourceType.POPULATION,
        amount: 40,
        location: 'Gamma Sector',
        efficiency: 0.7,
      },
    ]);
  };

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Resource Distribution Visualization</h2>

      <div className="mb-4 flex space-x-4">
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={addRandomResource}
        >
          Add Random Resource
        </button>

        <button
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          onClick={resetData}
        >
          Reset Data
        </button>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={() => setShowLabels(!showLabels)}
            className="mr-2"
          />
          Show Labels
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={interactive}
            onChange={() => setInteractive(!interactive)}
            className="mr-2"
          />
          Interactive
        </label>
      </div>

      <div className="rounded border border-gray-300 p-4">
        <ResourceDistributionChart
          data={resourceData}
          width={800}
          height={500}
          showLabels={showLabels}
          interactive={interactive}
        />
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-lg font-semibold">Current Resources</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Resource Type</th>
              <th className="border border-gray-300 p-2 text-left">Amount</th>
              <th className="border border-gray-300 p-2 text-left">Location</th>
              <th className="border border-gray-300 p-2 text-left">Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {resourceData.map((resource, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2">{resource.resourceType}</td>
                <td className="border border-gray-300 p-2">{resource.amount}</td>
                <td className="border border-gray-300 p-2">{resource.location}</td>
                <td className="border border-gray-300 p-2">
                  {(resource.efficiency * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResourceDistributionChartDemo;
