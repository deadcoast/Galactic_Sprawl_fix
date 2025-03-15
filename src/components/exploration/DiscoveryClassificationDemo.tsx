import { ResourceType } from "./../../types/resources/ResourceTypes";
import * as React from "react";
import { useState } from 'react';
import { AlertTriangle, Database, Download, Filter, List, Search, Settings } from 'lucide-react';
import { ClassificationProvider } from '../../contexts/ClassificationContext';
import { ClassifiableDiscovery, Classification } from '../../types/exploration/ClassificationTypes';
import { DiscoveryClassification } from './DiscoveryClassification';

// Sample discovery data
const sampleDiscoveries: ClassifiableDiscovery[] = [
  {
    id: 'anomaly-1',
    type: 'anomaly',
    name: 'Quantum Fluctuation Alpha-7',
    discoveryDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    sectorId: 'sector-12',
    sectorName: 'Proxima Nebula',
    coordinates: { x: 127, y: 89 },
    anomalyType: 'phenomenon',
    severity: 'medium',
    analysisResults: {
      energySignature: 'Tachyon-based',
      temporalDistortion: 0.72,
      stabilityIndex: 0.45,
      radiationLevel: 'minimal',
    },
  },
  {
    id: 'resource-1',
    type: 'resource',
    name: 'Iridium Deposit',
    discoveryDate: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    sectorId: 'sector-8',
    sectorName: 'Helios Cluster',
    coordinates: { x: 85, y: 42 },
    resourceType: ResourceType.MINERALS,
    amount: 78,
    quality: 0.85,
    distribution: 'veins',
  },
  {
    id: 'anomaly-2',
    type: 'anomaly',
    name: 'Artificial Structure Beta-3',
    discoveryDate: Date.now() - 12 * 24 * 60 * 60 * 1000, // 12 days ago
    sectorId: 'sector-15',
    sectorName: 'Cygnus Void',
    coordinates: { x: 210, y: 135 },
    anomalyType: 'artifact',
    severity: 'high',
    analysisResults: {
      composition: 'Unknown alloy',
      age: '~12,000 years',
      energyEmission: 'low',
      structuralIntegrity: 0.68,
    },
  },
  {
    id: 'resource-2',
    type: 'resource',
    name: 'Exotic Gas Cloud',
    discoveryDate: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    sectorId: 'sector-9',
    sectorName: 'Taurus Expanse',
    coordinates: { x: 112, y: 78 },
    resourceType: ResourceType.GAS,
    amount: 92,
    quality: 0.76,
    distribution: 'scattered',
  },
  {
    id: 'anomaly-3',
    type: 'anomaly',
    name: 'Subspace Rift Gamma-1',
    discoveryDate: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    sectorId: 'sector-20',
    sectorName: 'Orion Spur',
    coordinates: { x: 178, y: 203 },
    anomalyType: 'phenomenon',
    severity: 'high',
    analysisResults: {
      dimensionalStability: 0.31,
      expansionRate: 'increasing',
      gravitationalEffects: 'significant',
      radiationSignature: ResourceType.EXOTIC,
    },
  },
];

// Sample classifications
const sampleClassifications: Classification[] = [
  {
    id: 'class-1',
    discoveryId: 'anomaly-2',
    discoveryType: 'anomaly',
    categoryId: 'technological-anomaly',
    confidence: 0.92,
    confidenceLevel: 'confirmed',
    properties: {
      origin: 'non-human',
      age: 12000,
      purpose: 'unknown',
      dangerLevel: 'moderate',
    },
    notes: 'Structure appears to be a beacon or communication device of unknown origin.',
    classifiedBy: 'system',
    classifiedDate: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
  },
  {
    id: 'class-2',
    discoveryId: 'resource-2',
    discoveryType: 'resource',
    categoryId: 'gas-resource',
    confidence: 0.85,
    confidenceLevel: 'high',
    properties: {
      composition: 'helium-3 rich',
      stability: 'stable',
      extractionDifficulty: 'medium',
      quality: 0.76,
    },
    notes: 'Excellent fuel source for fusion reactors. Recommend priority extraction.',
    classifiedBy: 'user',
    classifiedDate: Date.now() - 4 * 24 * 60 * 60 * 1000, // 4 days ago
  },
];

interface DiscoveryClassificationDemoProps {
  className?: string;
}

export function DiscoveryClassificationDemo({ className = '' }: DiscoveryClassificationDemoProps) {
  const [selectedDiscoveryId, setSelectedDiscoveryId] = useState<string>(sampleDiscoveries[0].id);
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full');
  const [filter, setFilter] = useState<'all' | 'anomaly' | 'resource'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Get the selected discovery
  const selectedDiscovery =
    sampleDiscoveries.find(d => d.id === selectedDiscoveryId) || sampleDiscoveries[0];

  // Filter discoveries based on type and search query
  const filteredDiscoveries = sampleDiscoveries.filter(discovery => {
    // Filter by type
    if (filter !== 'all' && discovery.type !== filter) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        discovery.name.toLowerCase().includes(query) ||
        discovery.sectorName.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Handle classification
  const handleClassify = (classification: Classification) => {
    console.log('Discovery classified:', classification);
    // In a real application, this would update the state or call an API
  };

  return (
    <ClassificationProvider
      initialClassifications={sampleClassifications}
      discoveryData={sampleDiscoveries}
    >
      <div className={`rounded-lg border shadow-sm ${className}`}>
        {/* Header */}
        <div className="border-b bg-gray-50 p-4 dark:bg-gray-800">
          <h2 className="text-xl font-semibold">Discovery Classification System</h2>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Classify and organize discoveries for better data management and analysis
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="w-full border-r md:w-1/3">
            {/* Controls */}
            <div className="border-b p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center">
                  <Filter size={16} className="mr-2 text-gray-500" />
                  <select
                    className="rounded border p-1 text-sm"
                    value={filter}
                    onChange={e => setFilter(e.target.value as 'all' | 'anomaly' | 'resource')}
                  >
                    <option value="all">All Types</option>
                    <option value="anomaly">Anomalies</option>
                    <option value="resource">Resources</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <List size={16} className="mr-2 text-gray-500" />
                  <select
                    className="rounded border p-1 text-sm"
                    value={viewMode}
                    onChange={e => setViewMode(e.target.value as 'full' | 'compact')}
                  >
                    <option value="full">Full View</option>
                    <option value="compact">Compact View</option>
                  </select>
                </div>
              </div>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search discoveries..."
                  className="w-full rounded border py-2 pl-10 pr-4"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Discovery List */}
            <div className="max-h-[600px] overflow-y-auto">
              {filteredDiscoveries.map(discovery => (
                <div
                  key={discovery.id}
                  className={`cursor-pointer border-b p-3 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedDiscoveryId === discovery.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                  }`}
                  onClick={() => setSelectedDiscoveryId(discovery.id)}
                >
                  <div className="flex items-center">
                    <div className="mr-3">
                      {discovery.type === 'anomaly' ? (
                        <AlertTriangle
                          className={`${
                            discovery.severity === 'high'
                              ? 'text-red-500'
                              : discovery.severity === 'medium'
                                ? 'text-yellow-500'
                                : 'text-blue-500'
                          }`}
                          size={20}
                        />
                      ) : (
                        <Database className="text-green-500" size={20} />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{discovery.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {discovery.sectorName} •{' '}
                        {new Date(discovery.discoveryDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full p-4 md:w-2/3">
            <DiscoveryClassification
              discovery={selectedDiscovery}
              onClassify={handleClassify}
              compact={viewMode === 'compact'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          <div>Total Discoveries: {sampleDiscoveries.length}</div>
          <div className="flex items-center">
            <button className="mr-4 flex items-center hover:text-gray-700 dark:hover:text-gray-300">
              <Download size={16} className="mr-1" />
              Export Data
            </button>
            <button className="flex items-center hover:text-gray-700 dark:hover:text-gray-300">
              <Settings size={16} className="mr-1" />
              Settings
            </button>
          </div>
        </div>
      </div>
    </ClassificationProvider>
  );
}
