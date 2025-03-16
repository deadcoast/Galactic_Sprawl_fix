import { BarChart3, Database, Download, Droplet, Filter, Leaf, Sparkles, Zap } from 'lucide-react';
import * as React from 'react';
import { useRef, useState } from 'react';
import { ResourceType } from './../../types/resources/ResourceTypes';
interface ResourceData {
  type:
    | ResourceType.MINERALS
    | ResourceType.GAS
    | ResourceType.ENERGY
    | ResourceType.ORGANIC
    | ResourceType.EXOTIC;
  name: string;
  amount: number; // 0-100 scale
  quality: number; // 0-1 scale
  accessibility: number; // 0-1 scale (how easy it is to extract)
  distribution: 'concentrated' | 'scattered' | 'veins';
  estimatedValue: number; // Credit value
  extractionDifficulty: number; // 0-10 scale
}

interface SectorResourceData {
  sectorId: string;
  sectorName: string;
  resources: ResourceData[];
  scanAccuracy: number; // 0-1 scale
  lastScanned?: number;
  notes?: string;
}

interface ResourcePotentialVisualizationProps {
  sectorData: SectorResourceData[];
  onSectorSelect?: (sectorId: string) => void;
  selectedSectorId?: string;
  className?: string;
  quality?: 'low' | 'medium' | 'high';
}

export function ResourcePotentialVisualization({
  sectorData,
  onSectorSelect,
  selectedSectorId,
  className = '',
  quality = 'medium',
}: ResourcePotentialVisualizationProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'grid'>('chart');
  const [resourceFilter, setResourceFilter] = useState<'all' | ResourceData['type']>('all');
  const [sortBy, setSortBy] = useState<'value' | 'amount' | 'quality'>('value');
  const [showDetails, setShowDetails] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Quality settings for visualization
  const qualitySettings = React.useMemo(() => {
    switch (quality) {
      case 'low':
        return {
          maxBars: 10,
          animationDuration: 300,
          decimalPrecision: 0,
          showTooltips: false,
          detailLevel: 'basic',
        };
      case 'high':
        return {
          maxBars: 30,
          animationDuration: 600,
          decimalPrecision: 2,
          showTooltips: true,
          detailLevel: 'comprehensive',
        };
      case 'medium':
      default:
        return {
          maxBars: 20,
          animationDuration: 450,
          decimalPrecision: 1,
          showTooltips: true,
          detailLevel: 'standard',
        };
    }
  }, [quality]);

  // Get the selected sector data
  const selectedSector = sectorData.find(sector => sector.sectorId === selectedSectorId);

  // Filter and sort sectors based on current filters
  const filteredSectors = React.useMemo(() => {
    // Limit the number of sectors based on quality settings
    const filtered = sectorData
      .filter(sector => {
        if (resourceFilter === 'all') return true;
        return sector.resources.some(resource => resource.type === resourceFilter);
      })
      .sort((a, b) => {
        const getValueForSector = (sector: SectorResourceData) => {
          const totalResources = sector.resources.filter(
            r => resourceFilter === 'all' || r.type === resourceFilter
          );

          if (sortBy === 'value') {
            return totalResources.reduce((sum, r) => sum + r.estimatedValue, 0);
          } else if (sortBy === 'amount') {
            return totalResources.reduce((sum, r) => sum + r.amount, 0);
          } else {
            // quality
            const avgQuality =
              totalResources.reduce((sum, r) => sum + r.quality, 0) / (totalResources.length || 1);
            return avgQuality;
          }
        };

        return getValueForSector(b) - getValueForSector(a);
      });

    // Limit the number of sectors shown based on quality settings
    return filtered.slice(0, qualitySettings.maxBars);
  }, [sectorData, resourceFilter, sortBy, qualitySettings.maxBars]);

  // Get resource icon
  const getResourceIcon = (type: ResourceData['type'], className = 'w-4 h-4') => {
    switch (type) {
      case ResourceType.MINERALS:
        return <Database className={className} />;
      case ResourceType.GAS:
        return <Droplet className={className} />;
      case ResourceType.ENERGY:
        return <Zap className={className} />;
      case ResourceType.ORGANIC:
        return <Leaf className={className} />;
      case ResourceType.EXOTIC:
        return <Sparkles className={className} />;
    }
  };

  // Get resource color
  const getResourceColor = (type: ResourceData['type']) => {
    switch (type) {
      case ResourceType.MINERALS:
        return 'text-blue-400';
      case ResourceType.GAS:
        return 'text-purple-400';
      case ResourceType.ENERGY:
        return 'text-yellow-400';
      case ResourceType.ORGANIC:
        return 'text-green-400';
      case ResourceType.EXOTIC:
        return 'text-pink-400';
    }
  };

  // Get resource background color
  const getResourceBgColor = (type: ResourceData['type']) => {
    switch (type) {
      case ResourceType.MINERALS:
        return 'bg-blue-900/30';
      case ResourceType.GAS:
        return 'bg-purple-900/30';
      case ResourceType.ENERGY:
        return 'bg-yellow-900/30';
      case ResourceType.ORGANIC:
        return 'bg-green-900/30';
      case ResourceType.EXOTIC:
        return 'bg-pink-900/30';
    }
  };

  // Format credits with precision based on quality settings
  const formatCredits = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(qualitySettings.decimalPrecision)}M cr`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(qualitySettings.decimalPrecision)}K cr`;
    }
    return `${value.toFixed(qualitySettings.decimalPrecision)} cr`;
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render chart view
  const renderChartView = () => {
    const maxBarHeight = 200;
    const barWidth = Math.max(30, Math.min(80, 800 / filteredSectors.length));
    const barSpacing = 10;

    return (
      <div className="relative mt-6 h-64">
        {/* Y-axis labels */}
        <div className="absolute bottom-0 left-0 top-0 flex w-10 flex-col justify-between text-xs text-gray-400">
          <span>High</span>
          <span>Med</span>
          <span>Low</span>
        </div>

        {/* Chart area */}
        <div ref={chartRef} className="absolute bottom-0 left-10 right-0 top-0 overflow-x-auto">
          <div
            className="flex h-full items-end"
            style={{ width: Math.max(100, filteredSectors.length * (barWidth + barSpacing)) }}
          >
            {filteredSectors.map((sector, index) => {
              // Calculate total value for this sector based on filter and sort
              const resources =
                resourceFilter === 'all'
                  ? sector.resources
                  : sector.resources.filter(r => r.type === resourceFilter);

              if (resources.length === 0) {
                return null;
              }

              // Use index for animation delay
              const animationDelay = index * 50;

              let value = 0;
              if (sortBy === 'value') {
                value = resources.reduce((sum, r) => sum + r.estimatedValue, 0);
                // Normalize to 0-100 scale
                const maxValue = 1000000; // 1M credits
                value = Math.min(100, (value / maxValue) * 100);
              } else if (sortBy === 'amount') {
                value = resources.reduce((sum, r) => sum + r.amount, 0) / resources.length;
              } else if (sortBy === 'quality') {
                value = (resources.reduce((sum, r) => sum + r.quality, 0) / resources.length) * 100;
              }

              const barHeight = (value / 100) * maxBarHeight;

              // Group resources by type for stacked bar
              const resourcesByType: Record<ResourceData['type'], number> = {
                [ResourceType.MINERALS]: 0,
                [ResourceType.GAS]: 0,
                [ResourceType.ENERGY]: 0,
                [ResourceType.ORGANIC]: 0,
                [ResourceType.EXOTIC]: 0,
              };

              resources.forEach(resource => {
                resourcesByType[resource.type] += resource.amount;
              });

              // Normalize to fit in bar height
              const totalAmount = Object.values(resourcesByType).reduce(
                (sum, amount) => sum + amount,
                0
              );
              const normalizedResources: Record<string, number> = {};

              Object.entries(resourcesByType).forEach(([type, amount]) => {
                normalizedResources[type] =
                  totalAmount > 0 ? (amount / totalAmount) * barHeight : 0;
              });

              return (
                <div
                  key={sector.sectorId}
                  className={`relative mx-[5px] w-[${barWidth}px] cursor-pointer transition-all duration-300`}
                  style={{
                    height: maxBarHeight,
                    opacity: selectedSectorId === sector.sectorId ? 1 : 0.8,
                    transform: selectedSectorId === sector.sectorId ? 'scale(1.05)' : 'scale(1)',
                    animationDelay: `${animationDelay}ms`,
                  }}
                  onClick={() => onSectorSelect && onSectorSelect(sector.sectorId)}
                >
                  {/* Stacked bar */}
                  <div
                    className={`w-${barWidth} relative ${
                      sector.sectorId === selectedSectorId ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ height: `${barHeight}px` }}
                  >
                    {/* Resource segments */}
                    {Object.entries(normalizedResources)
                      .filter(([_, height]) => height > 0)
                      .map(([type, height], i, arr) => {
                        // Calculate offset from bottom
                        const offset = arr.slice(i + 1).reduce((sum, [_, h]) => sum + h, 0);

                        return (
                          <div
                            key={type}
                            className={`absolute w-full ${getResourceBgColor(type as ResourceData['type'])}`}
                            style={{
                              height: `${height}px`,
                              bottom: `${offset}px`,
                            }}
                          />
                        );
                      })}
                  </div>

                  {/* Sector name */}
                  <div
                    className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-300"
                    style={{ maxWidth: barWidth }}
                  >
                    {sector.sectorName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render grid view
  const renderGridView = () => {
    return (
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {filteredSectors.map(sector => {
          // Filter resources based on current filter
          const resources =
            resourceFilter === 'all'
              ? sector.resources
              : sector.resources.filter(r => r.type === resourceFilter);

          if (resources.length === 0) return null;

          // Calculate total value
          const totalValue = resources.reduce((sum, r) => sum + r.estimatedValue, 0);

          return (
            <div
              key={sector.sectorId}
              className={`cursor-pointer rounded-lg bg-gray-800 p-3 transition-colors ${
                sector.sectorId === selectedSectorId ? 'ring-2 ring-blue-500' : 'hover:bg-gray-750'
              }`}
              onClick={() => onSectorSelect?.(sector.sectorId)}
            >
              <div className="mb-2 flex items-start justify-between">
                <h3 className="text-sm font-medium text-white">{sector.sectorName}</h3>
                <span className="text-xs text-gray-400">
                  {sector.lastScanned
                    ? `Scanned: ${formatDate(sector.lastScanned)}`
                    : 'Not scanned'}
                </span>
              </div>

              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {/* Show icons for available resources */}
                  {[
                    ResourceType.MINERALS,
                    ResourceType.GAS,
                    ResourceType.ENERGY,
                    ResourceType.ORGANIC,
                    ResourceType.EXOTIC,
                  ].map(type => {
                    const hasResource = resources.some(r => r.type === type);
                    if (!hasResource) return null;

                    return (
                      <div
                        key={type}
                        className={`${getResourceColor(type as ResourceData['type'])}`}
                      >
                        {getResourceIcon(type as ResourceData['type'])}
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs font-medium text-green-300">
                  {formatCredits(totalValue)} credits
                </div>
              </div>

              {/* Resource bars */}
              <div className="space-y-2">
                {resources.map((resource, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        <span className={getResourceColor(resource.type)}>
                          {getResourceIcon(resource.type, 'w-3 h-3')}
                        </span>
                        <span className="text-gray-300">{resource.name}</span>
                      </div>
                      <span className="text-gray-400">{resource.amount.toFixed(0)}</span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                      <div
                        className={`h-full ${getResourceBgColor(resource.type).replace('/30', '')}`}
                        style={{ width: `${resource.amount}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Scan accuracy indicator */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span>Scan accuracy</span>
                <span>{(sector.scanAccuracy * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${sector.scanAccuracy * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex h-full flex-col bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 p-3">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Resource Potential</h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode('chart')}
            className={`rounded p-1.5 ${
              viewMode === 'chart' ? 'bg-blue-900 text-blue-300' : 'text-gray-400 hover:bg-gray-700'
            }`}
            title="Chart View"
          >
            <BarChart3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded p-1.5 ${
              viewMode === 'grid' ? 'bg-blue-900 text-blue-300' : 'text-gray-400 hover:bg-gray-700'
            }`}
            title="Grid View"
          >
            <div className="grid grid-cols-2 gap-0.5">
              <div className="h-1.5 w-1.5 rounded-sm bg-current"></div>
              <div className="h-1.5 w-1.5 rounded-sm bg-current"></div>
              <div className="h-1.5 w-1.5 rounded-sm bg-current"></div>
              <div className="h-1.5 w-1.5 rounded-sm bg-current"></div>
            </div>
          </button>

          {/* Export button */}
          <button className="rounded p-1.5 text-gray-400 hover:bg-gray-700" title="Export Data">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-700 bg-gray-800 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <Filter size={12} />
            <span>Filter:</span>
          </div>

          <button
            onClick={() => setResourceFilter('all')}
            className={`rounded px-2 py-1 text-xs ${
              resourceFilter === 'all'
                ? 'bg-blue-900 text-blue-300'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All
          </button>

          <button
            onClick={() => setResourceFilter(ResourceType.MINERALS)}
            className={`flex items-center space-x-1 rounded px-2 py-1 text-xs ${
              resourceFilter === ResourceType.MINERALS
                ? 'bg-blue-900 text-blue-300'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Database size={12} />
            <span>Minerals</span>
          </button>

          <button
            onClick={() => setResourceFilter(ResourceType.GAS)}
            className={`flex items-center space-x-1 rounded px-2 py-1 text-xs ${
              resourceFilter === ResourceType.GAS
                ? 'bg-purple-900 text-purple-300'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Droplet size={12} />
            <span>Gas</span>
          </button>

          <button
            onClick={() => setResourceFilter(ResourceType.ENERGY)}
            className={`flex items-center space-x-1 rounded px-2 py-1 text-xs ${
              resourceFilter === ResourceType.ENERGY
                ? 'bg-yellow-900 text-yellow-300'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Zap size={12} />
            <span>Energy</span>
          </button>

          <button
            onClick={() => setResourceFilter(ResourceType.ORGANIC)}
            className={`flex items-center space-x-1 rounded px-2 py-1 text-xs ${
              resourceFilter === ResourceType.ORGANIC
                ? 'bg-green-900 text-green-300'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Leaf size={12} />
            <span>Organic</span>
          </button>

          <button
            onClick={() => setResourceFilter(ResourceType.EXOTIC)}
            className={`flex items-center space-x-1 rounded px-2 py-1 text-xs ${
              resourceFilter === ResourceType.EXOTIC
                ? 'bg-pink-900 text-pink-300'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Sparkles size={12} />
            <span>Exotic</span>
          </button>

          <div className="ml-auto flex items-center space-x-1 text-xs text-gray-400">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'value' | 'amount' | 'quality')}
              className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-xs text-gray-300"
            >
              <option value="value">Value</option>
              <option value="amount">Amount</option>
              <option value="quality">Quality</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-3">
        {filteredSectors.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-400">
            <Database className="mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg">No resources found</p>
            <p className="mt-2 text-sm">Try adjusting your filters or scan more sectors</p>
          </div>
        ) : (
          <>{viewMode === 'chart' ? renderChartView() : renderGridView()}</>
        )}
      </div>

      {/* Selected sector details */}
      {selectedSector && (
        <div className="border-t border-gray-700 bg-gray-800">
          <div
            className="flex cursor-pointer items-center justify-between p-2"
            onClick={() => setShowDetails(!showDetails)}
          >
            <h3 className="text-sm font-medium text-white">{selectedSector.sectorName} Details</h3>
            <button className="text-gray-400 hover:text-gray-300">
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          {showDetails && (
            <div className="p-3 pt-0">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-xs text-gray-400">Resource Breakdown</h4>
                  <div className="space-y-3">
                    {selectedSector.resources.map((resource, index) => (
                      <div key={index} className="bg-gray-750 rounded p-2">
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <span className={getResourceColor(resource.type)}>
                              {getResourceIcon(resource.type)}
                            </span>
                            <span className="text-sm text-white">{resource.name}</span>
                          </div>
                          <span className="text-xs font-medium text-green-300">
                            {formatCredits(resource.estimatedValue)} credits
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Amount:</span>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                              <div
                                className={`h-full ${getResourceBgColor(resource.type).replace('/30', '')}`}
                                style={{ width: `${resource.amount}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <span className="text-gray-400">Quality:</span>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                              <div
                                className="h-full bg-yellow-500"
                                style={{ width: `${resource.quality * 100}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <span className="text-gray-400">Accessibility:</span>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${resource.accessibility * 100}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <span className="text-gray-400">Extraction:</span>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                              <div
                                className={`h-full ${
                                  resource.extractionDifficulty > 7
                                    ? 'bg-red-500'
                                    : resource.extractionDifficulty > 4
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                }`}
                                style={{ width: `${resource.extractionDifficulty * 10}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-gray-400">
                          Distribution:{' '}
                          <span className="text-gray-300">{resource.distribution}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-xs text-gray-400">Scan Information</h4>
                  <div className="bg-gray-750 rounded p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-gray-300">Scan Accuracy</span>
                      <span className="text-sm text-white">
                        {(selectedSector.scanAccuracy * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-700">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${selectedSector.scanAccuracy * 100}%` }}
                      />
                    </div>

                    {selectedSector.lastScanned && (
                      <div className="mb-2 text-xs text-gray-400">
                        Last scanned:{' '}
                        <span className="text-gray-300">
                          {formatDate(selectedSector.lastScanned)}
                        </span>
                      </div>
                    )}

                    {selectedSector.notes && (
                      <div className="mt-3">
                        <h4 className="mb-1 text-xs text-gray-400">Notes</h4>
                        <p className="text-sm text-gray-300">{selectedSector.notes}</p>
                      </div>
                    )}

                    <div className="mt-3">
                      <h4 className="mb-1 text-xs text-gray-400">Recommendations</h4>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {selectedSector.scanAccuracy < 0.7 && (
                          <li className="flex items-start space-x-1">
                            <span className="text-yellow-400">•</span>
                            <span>Additional scanning recommended to improve accuracy</span>
                          </li>
                        )}

                        {selectedSector.resources.some(r => r.amount > 70) && (
                          <li className="flex items-start space-x-1">
                            <span className="text-green-400">•</span>
                            <span>
                              High resource concentration detected - mining operation viable
                            </span>
                          </li>
                        )}

                        {selectedSector.resources.some(r => r.type === ResourceType.EXOTIC) && (
                          <li className="flex items-start space-x-1">
                            <span className="text-pink-400">•</span>
                            <span>Exotic materials present - research station recommended</span>
                          </li>
                        )}

                        {selectedSector.resources.some(r => r.extractionDifficulty > 7) && (
                          <li className="flex items-start space-x-1">
                            <span className="text-red-400">•</span>
                            <span>High extraction difficulty - specialized equipment required</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
