import { useMemo, useState } from 'react';
import { ResourceType } from '../../types/resources/ResourceTypes';
import {
  AdvancedFilteringSystem,
  AdvancedFilters,
  defaultAdvancedFilters,
} from './AdvancedFilteringSystem';
import { GalaxyMapSystem } from './GalaxyMapSystem';

// Interfaces for the exploration system
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

interface ExplorationSystemIntegrationProps {
  sectors: Sector[];
  onSectorSelect: (sectorId: string) => void;
  onSectorScan: (sectorId: string) => void;
  selectedSectorId?: string;
  activeScanId?: string;
  className?: string;
}

export function ExplorationSystemIntegration({
  sectors,
  onSectorSelect,
  onSectorScan,
  selectedSectorId,
  activeScanId,
  className = '',
}: ExplorationSystemIntegrationProps) {
  // State for advanced filters
  const [filters, setFilters] = useState<AdvancedFilters>(defaultAdvancedFilters);
  const [searchQuery, setSearchQuery] = useState('');

  // Apply filters to sectors
  const filteredSectors = useMemo(() => {
    return sectors.filter(sector => {
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
  }, [sectors, filters, searchQuery]);

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

  // Stats for filtered sectors
  const filteredStats = useMemo(() => {
    const total = sectors.length;
    const filtered = filteredSectors.length;
    const unmapped = filteredSectors.filter(s => s.status === 'unmapped').length;
    const mapped = filteredSectors.filter(s => s.status === 'mapped').length;
    const scanning = filteredSectors.filter(s => s.status === 'scanning').length;
    const analyzed = filteredSectors.filter(s => s.status === 'analyzed').length;
    const withAnomalies = filteredSectors.filter(s => s.anomalies.length > 0).length;

    return {
      total,
      filtered,
      unmapped,
      mapped,
      scanning,
      analyzed,
      withAnomalies,
    };
  }, [sectors, filteredSectors]);

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Advanced Filtering System */}
      <div className="mb-4">
        <AdvancedFilteringSystem
          filters={{ ...filters, searchQuery }}
          onFiltersChange={handleFiltersChange}
          onSearchChange={handleSearchChange}
          onReset={handleReset}
        />
      </div>

      {/* Stats Bar */}
      <div className="mb-4 flex flex-wrap gap-3 rounded-md bg-gray-800 p-3 text-sm">
        <div className="flex items-center">
          <span className="mr-2 text-gray-400">Showing:</span>
          <span className="font-medium text-white">{filteredStats.filtered}</span>
          <span className="mx-1 text-gray-400">of</span>
          <span className="font-medium text-white">{filteredStats.total}</span>
          <span className="ml-1 text-gray-400">sectors</span>
        </div>

        <div className="flex items-center">
          <span className="mr-1 h-3 w-3 rounded-full bg-gray-500"></span>
          <span className="mr-1 text-gray-300">{filteredStats.unmapped}</span>
          <span className="text-gray-400">unmapped</span>
        </div>

        <div className="flex items-center">
          <span className="mr-1 h-3 w-3 rounded-full bg-blue-500"></span>
          <span className="mr-1 text-gray-300">{filteredStats.mapped}</span>
          <span className="text-gray-400">mapped</span>
        </div>

        <div className="flex items-center">
          <span className="mr-1 h-3 w-3 rounded-full bg-yellow-500"></span>
          <span className="mr-1 text-gray-300">{filteredStats.scanning}</span>
          <span className="text-gray-400">scanning</span>
        </div>

        <div className="flex items-center">
          <span className="mr-1 h-3 w-3 rounded-full bg-green-500"></span>
          <span className="mr-1 text-gray-300">{filteredStats.analyzed}</span>
          <span className="text-gray-400">analyzed</span>
        </div>

        <div className="flex items-center">
          <span className="mr-1 h-3 w-3 rounded-full bg-red-500"></span>
          <span className="mr-1 text-gray-300">{filteredStats.withAnomalies}</span>
          <span className="text-gray-400">with anomalies</span>
        </div>
      </div>

      {/* Galaxy Map with filtered sectors */}
      <div className="flex-grow">
        <GalaxyMapSystem
          sectors={filteredSectors}
          onSectorSelect={onSectorSelect}
          onSectorScan={onSectorScan}
          selectedSectorId={selectedSectorId}
          activeScanId={activeScanId}
        />
      </div>
    </div>
  );
}
