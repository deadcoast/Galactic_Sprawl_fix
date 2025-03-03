import { useMemo, useState } from 'react';
import { ResourceType } from '../../types/resources/ResourceTypes';
import {
  AdvancedFilteringSystem,
  AdvancedFilters,
  defaultAdvancedFilters,
} from './AdvancedFilteringSystem';

// Sample sector data for demonstration
interface Sector {
  id: string;
  name: string;
  status: 'unmapped' | 'mapped' | 'scanning' | 'analyzed';
  coordinates: { x: number; y: number };
  resourcePotential: number;
  habitabilityScore: number;
  anomalies: Anomaly[];
  lastScanned?: number;
  resources?: Array<{
    type: ResourceType;
    amount: number;
  }>;
}

interface Anomaly {
  id: string;
  type: 'artifact' | 'signal' | 'phenomenon';
  severity: 'low' | 'medium' | 'high';
  description: string;
  investigated: boolean;
}

// Sample data
const sampleSectors: Sector[] = [
  {
    id: 'sector-1',
    name: 'Alpha Centauri',
    status: 'analyzed',
    coordinates: { x: 100, y: 150 },
    resourcePotential: 0.8,
    habitabilityScore: 0.9,
    anomalies: [
      {
        id: 'anomaly-1',
        type: 'artifact',
        severity: 'high',
        description: 'Ancient alien technology',
        investigated: false,
      },
    ],
    lastScanned: Date.now() - 3600000, // 1 hour ago
    resources: [
      { type: 'minerals', amount: 5000 },
      { type: 'energy', amount: 3000 },
    ],
  },
  {
    id: 'sector-2',
    name: 'Proxima Centauri',
    status: 'mapped',
    coordinates: { x: 120, y: 180 },
    resourcePotential: 0.5,
    habitabilityScore: 0.3,
    anomalies: [],
    lastScanned: Date.now() - 86400000, // 1 day ago
    resources: [{ type: 'gas', amount: 2000 }],
  },
  {
    id: 'sector-3',
    name: 'Tau Ceti',
    status: 'scanning',
    coordinates: { x: 80, y: 200 },
    resourcePotential: 0.7,
    habitabilityScore: 0.6,
    anomalies: [
      {
        id: 'anomaly-2',
        type: 'signal',
        severity: 'medium',
        description: 'Unusual energy signature',
        investigated: false,
      },
    ],
    lastScanned: Date.now() - 43200000, // 12 hours ago
    resources: [
      { type: 'minerals', amount: 3000 },
      { type: 'exotic', amount: 500 },
    ],
  },
  {
    id: 'sector-4',
    name: 'Epsilon Eridani',
    status: 'unmapped',
    coordinates: { x: 60, y: 120 },
    resourcePotential: 0.4,
    habitabilityScore: 0.2,
    anomalies: [],
    resources: [],
  },
  {
    id: 'sector-5',
    name: 'Wolf 359',
    status: 'analyzed',
    coordinates: { x: 140, y: 90 },
    resourcePotential: 0.9,
    habitabilityScore: 0.1,
    anomalies: [
      {
        id: 'anomaly-3',
        type: 'phenomenon',
        severity: 'low',
        description: 'Unusual gravitational fluctuations',
        investigated: true,
      },
    ],
    lastScanned: Date.now() - 604800000, // 1 week ago
    resources: [
      { type: 'gas', amount: 4000 },
      { type: 'energy', amount: 2000 },
    ],
  },
];

export function AdvancedFilteringDemo() {
  const [filters, setFilters] = useState<AdvancedFilters>(defaultAdvancedFilters);
  const [searchQuery, setSearchQuery] = useState('');

  // Apply filters to the sample data
  const filteredSectors = useMemo(() => {
    return sampleSectors.filter(sector => {
      // Search query filter
      if (searchQuery && !sector.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.statusFilter !== 'all' && sector.status !== filters.statusFilter) {
        return false;
      }

      // Resource potential filter
      if (sector.resourcePotential < filters.minResourcePotential) {
        return false;
      }

      // Habitability score filter
      if (sector.habitabilityScore < filters.minHabitabilityScore) {
        return false;
      }

      // Anomaly filters
      if (filters.hasAnomalies && sector.anomalies.length === 0) {
        return false;
      }

      // Anomaly type filter
      if (filters.anomalyTypes.length > 0) {
        const hasMatchingType = sector.anomalies.some(anomaly =>
          filters.anomalyTypes.includes(anomaly.type as 'artifact' | 'signal' | 'phenomenon')
        );
        if (!hasMatchingType) {
          return false;
        }
      }

      // Anomaly severity filter
      if (filters.anomalySeverity !== 'any') {
        const hasMatchingSeverity = sector.anomalies.some(
          anomaly => anomaly.severity === filters.anomalySeverity
        );
        if (!hasMatchingSeverity) {
          return false;
        }
      }

      // Last scanned filter
      if (filters.lastScannedWithin > 0 && sector.lastScanned) {
        const hoursSinceLastScan = (Date.now() - sector.lastScanned) / (1000 * 60 * 60);
        if (hoursSinceLastScan > filters.lastScannedWithin) {
          return false;
        }
      }

      // Resource types filter
      if (filters.resourceTypes.length > 0 && sector.resources) {
        const hasMatchingResource = sector.resources.some(resource =>
          filters.resourceTypes.includes(resource.type)
        );
        if (!hasMatchingResource) {
          return false;
        }
      }

      return true;
    });
  }, [sampleSectors, filters, searchQuery]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: AdvancedFilters) => {
    setFilters(newFilters);
  };

  // Handle search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Reset filters
  const handleReset = () => {
    setFilters(defaultAdvancedFilters);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <h1 className="mb-6 text-2xl font-bold text-white">Advanced Filtering System Demo</h1>

      {/* Advanced Filtering System */}
      <div className="mb-6">
        <AdvancedFilteringSystem
          filters={{ ...filters, searchQuery }}
          onFiltersChange={handleFiltersChange}
          onSearchChange={handleSearchChange}
          onReset={handleReset}
        />
      </div>

      {/* Results */}
      <div className="rounded-md bg-gray-800 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Results</h2>
          <span className="text-sm text-gray-400">
            Showing {filteredSectors.length} of {sampleSectors.length} sectors
          </span>
        </div>

        {filteredSectors.length === 0 ? (
          <div className="py-8 text-center text-gray-400">No sectors match the current filters</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSectors.map(sector => (
              <div key={sector.id} className="rounded-md bg-gray-700 p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-lg font-medium text-white">{sector.name}</h3>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      sector.status === 'analyzed'
                        ? 'bg-green-600'
                        : sector.status === 'mapped'
                          ? 'bg-blue-600'
                          : sector.status === 'scanning'
                            ? 'bg-yellow-600'
                            : 'bg-gray-600'
                    }`}
                  >
                    {sector.status.charAt(0).toUpperCase() + sector.status.slice(1)}
                  </span>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div className="text-sm">
                    <span className="text-gray-400">Resources:</span>
                    <div className="font-medium text-blue-300">
                      {Math.round(sector.resourcePotential * 100)}%
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Habitability:</span>
                    <div className="font-medium text-green-300">
                      {Math.round(sector.habitabilityScore * 100)}%
                    </div>
                  </div>
                </div>

                {sector.anomalies.length > 0 && (
                  <div className="mb-3">
                    <span className="text-sm text-gray-400">Anomalies:</span>
                    <div className="mt-1 space-y-1">
                      {sector.anomalies.map(anomaly => (
                        <div
                          key={anomaly.id}
                          className={`flex justify-between rounded px-2 py-1 text-xs ${
                            anomaly.severity === 'high'
                              ? 'bg-red-900/50 text-red-300'
                              : anomaly.severity === 'medium'
                                ? 'bg-yellow-900/50 text-yellow-300'
                                : 'bg-blue-900/50 text-blue-300'
                          }`}
                        >
                          <span>
                            {anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)}
                          </span>
                          <span>
                            {anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sector.resources && sector.resources.length > 0 && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-400">Resources:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {sector.resources.map((resource, index) => (
                        <span key={index} className="rounded bg-gray-600 px-2 py-1 text-xs">
                          {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}:{' '}
                          {resource.amount}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {sector.lastScanned && (
                  <div className="mt-2 text-xs text-gray-400">
                    Last scanned: {new Date(sector.lastScanned).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
