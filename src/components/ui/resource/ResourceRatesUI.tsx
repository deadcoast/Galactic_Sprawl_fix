import * as React from 'react';
import { useState } from 'react';
import { ResourceType } from './../../../types/resources/ResourceTypes';
import ResourceRateFiltering, { RateFilterType } from './ResourceRateFiltering';
import ResourceRatesDisplay from './ResourceRatesDisplay';
import ResourceRatesTrends from './ResourceRatesTrends';

/**
 * Integrated UI component for Resource Rates
 * Combines display, trends, and filtering components
 */
export const ResourceRatesUI: React.FC = () => {
  const [selectedResources, setSelectedResources] = useState<ResourceType[]>([
    ResourceType.MINERALS,
    ResourceType.ENERGY,
    ResourceType.POPULATION,
    ResourceType.RESEARCH,
  ]);
  const [activeFilterType, setActiveFilterType] = useState<RateFilterType>(RateFilterType.ALL);
  const [activeTab, setActiveTab] = useState<string>('display');

  // Handle filter changes from ResourceRateFiltering component
  const handleFilterChange = (resources: ResourceType[], filterType: RateFilterType) => {
    setSelectedResources(resources);
    setActiveFilterType(filterType);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Filtering Component */}
      <ResourceRateFiltering
        onFilterChange={handleFilterChange}
        initialSelectedResources={selectedResources}
        initialFilterType={activeFilterType}
      />

      {/* Tabs for Display vs Trends */}
      <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
        <div className="flex border-b border-gray-800">
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'display'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('display')}
          >
            Resource Rates
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'trends'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('trends')}
          >
            Rate Trends
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'display' && <ResourceRatesDisplay />}

          {activeTab === 'trends' && (
            <ResourceRatesTrends selectedResources={selectedResources} height={350} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceRatesUI;
