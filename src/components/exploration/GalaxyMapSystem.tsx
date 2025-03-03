import { Filter, Map, Search, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
    type: string;
    amount: number;
  }>;
  factionControl?: FactionControl;
}

interface FactionControl {
  factionId: string;
  factionName: string;
  controlLevel: 'minimal' | 'partial' | 'full';
  hostility: 'friendly' | 'neutral' | 'hostile';
}

interface Anomaly {
  id: string;
  type: 'artifact' | 'signal' | 'phenomenon';
  severity: 'low' | 'medium' | 'high';
  description: string;
  investigated: boolean;
}

interface TradeRoute {
  id: string;
  sourceSectorId: string;
  targetSectorId: string;
  resourceType: string;
  volume: number; // 0-1 scale for line thickness
  active: boolean;
}

interface CosmicEvent {
  id: string;
  type: 'storm' | 'solarFlare' | 'anomaly';
  position: { x: number; y: number };
  radius: number;
  duration: number; // in seconds
  startTime: number; // timestamp
  affectedSectors: string[]; // sector IDs
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface GalaxyMapSystemProps {
  sectors: Sector[];
  onSectorSelect: (sectorId: string) => void;
  onSectorScan: (sectorId: string) => void;
  selectedSectorId?: string;
  activeScanId?: string;
  className?: string;
  quality?: 'low' | 'medium' | 'high';
  // Additional props for enhanced features
  cosmicEvents?: CosmicEvent[];
  affectedSectorIds?: string[];
  tradeRoutes?: TradeRoute[];
  activeOverlays?: ('factions' | 'tradeRoutes' | 'resources' | 'anomalies')[];
}

export function GalaxyMapSystem({
  sectors,
  onSectorSelect,
  onSectorScan,
  selectedSectorId,
  activeScanId,
  className = '',
  quality = 'medium',
  cosmicEvents,
  affectedSectorIds,
  tradeRoutes,
  activeOverlays,
}: GalaxyMapSystemProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState<'all' | 'unmapped' | 'anomalies'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    minResourcePotential: 0,
    minHabitabilityScore: 0,
    hasAnomalies: false,
    anomalySeverity: 'any' as 'any' | 'low' | 'medium' | 'high',
    lastScannedWithin: 0, // hours
    resourceTypes: [] as string[],
  });

  // Handle map dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) {
      return;
    } // Only left mouse button
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) {
        return;
      }
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  // Filter sectors based on current filter and search term
  const filteredSectors = useMemo(() => {
    let filtered = sectors;

    // Apply basic filter
    if (filter === 'unmapped') {
      filtered = filtered.filter(sector => sector.status === 'unmapped');
    } else if (filter === 'anomalies') {
      filtered = filtered.filter(sector => sector.anomalies.length > 0);
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        sector =>
          sector.name.toLowerCase().includes(term) ||
          sector.id.toLowerCase().includes(term) ||
          sector.anomalies.some(anomaly => anomaly.description.toLowerCase().includes(term))
      );
    }

    // Apply advanced filters
    if (showFilters) {
      filtered = filtered.filter(sector => {
        if (sector.resourcePotential < advancedFilters.minResourcePotential) {
          return false;
        }
        if (sector.habitabilityScore < advancedFilters.minHabitabilityScore) {
          return false;
        }

        if (advancedFilters.hasAnomalies && sector.anomalies.length === 0) {
          return false;
        }

        if (
          advancedFilters.anomalySeverity !== 'any' &&
          !sector.anomalies.some(a => a.severity === advancedFilters.anomalySeverity)
        ) {
          return false;
        }

        if (advancedFilters.lastScannedWithin > 0 && sector.lastScanned) {
          const hoursSinceLastScan = (Date.now() - sector.lastScanned) / (1000 * 60 * 60);
          if (hoursSinceLastScan > advancedFilters.lastScannedWithin) {
            return false;
          }
        }

        if (advancedFilters.resourceTypes.length > 0 && sector.resources) {
          const hasMatchingResource = sector.resources.some(r =>
            advancedFilters.resourceTypes.includes(r.type)
          );
          if (!hasMatchingResource) {
            return false;
          }
        }

        return true;
      });
    }

    return filtered;
  }, [sectors, filter, searchTerm, showFilters, advancedFilters]);

  // Real-time map updates
  useEffect(() => {
    const interval = setInterval(() => {
      // This would typically fetch updated sector data from a server
      // For now, we'll just rely on the parent component to pass updated sectors
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Get sector color based on status and selection
  const getSectorColor = useCallback(
    (sector: Sector) => {
      // Check if sector is affected by cosmic events
      if (affectedSectorIds?.includes(sector.id)) {
        return 'rgba(255, 100, 100, 0.7)';
      }

      if (sector.id === selectedSectorId) {
        return 'rgba(255, 255, 255, 0.9)';
      }
      if (sector.id === activeScanId) {
        return 'rgba(0, 255, 255, 0.9)';
      }

      // If faction overlay is active and sector has faction control
      if (activeOverlays?.includes('factions') && sector.factionControl) {
        if (sector.factionControl.hostility === 'hostile') {
          return 'rgba(220, 38, 38, 0.7)'; // Red for hostile
        } else if (sector.factionControl.hostility === 'friendly') {
          return 'rgba(16, 185, 129, 0.7)'; // Green for friendly
        } else {
          return 'rgba(245, 158, 11, 0.7)'; // Amber for neutral
        }
      }

      switch (sector.status) {
        case 'unmapped':
          return 'rgba(150, 150, 150, 0.6)';
        case 'mapped':
          return 'rgba(0, 150, 255, 0.7)';
        case 'scanning':
          return 'rgba(255, 215, 0, 0.8)';
        case 'analyzed':
          return 'rgba(0, 255, 100, 0.7)';
        default:
          return 'rgba(150, 150, 150, 0.6)';
      }
    },
    [selectedSectorId, activeScanId, activeOverlays, affectedSectorIds]
  );

  // Get sector size based on resource potential and anomalies
  const getSectorSize = useCallback(
    (sector: Sector) => {
      let baseSize = 8;

      // Increase size based on resource potential
      baseSize += sector.resourcePotential * 10;

      // Increase size if sector has anomalies
      if (sector.anomalies.length > 0) {
        baseSize += 5;
      }

      // Increase size if selected
      if (sector.id === selectedSectorId) {
        baseSize += 5;
      }

      return baseSize;
    },
    [selectedSectorId]
  );

  // Render sector markers
  const renderSectors = useCallback(() => {
    return filteredSectors.map((sector: Sector) => {
      const { x, y } = sector.coordinates;
      const color = getSectorColor(sector);
      const size = getSectorSize(sector);

      // Calculate position with zoom and offset
      const posX = x * zoom + offset.x;
      const posY = y * zoom + offset.y;

      return (
        <g key={sector.id} onClick={() => onSectorSelect(sector.id)}>
          {/* Sector circle */}
          <circle
            cx={posX}
            cy={posY}
            r={size}
            fill={color}
            stroke={sector.id === selectedSectorId ? 'white' : 'rgba(255, 255, 255, 0.3)'}
            strokeWidth={sector.id === selectedSectorId ? 2 : 1}
            className="cursor-pointer transition-all duration-200"
          />

          {/* Faction control indicator */}
          {activeOverlays?.includes('factions') && sector.factionControl && (
            <g>
              {/* Control level indicator */}
              <circle
                cx={posX}
                cy={posY}
                r={size + 5}
                fill="none"
                stroke={
                  sector.factionControl.hostility === 'hostile'
                    ? 'rgba(220, 38, 38, 0.5)'
                    : sector.factionControl.hostility === 'friendly'
                      ? 'rgba(16, 185, 129, 0.5)'
                      : 'rgba(245, 158, 11, 0.5)'
                }
                strokeWidth={
                  sector.factionControl.controlLevel === 'full'
                    ? 3
                    : sector.factionControl.controlLevel === 'partial'
                      ? 2
                      : 1
                }
                strokeDasharray={sector.factionControl.controlLevel === 'minimal' ? '3,3' : 'none'}
              />
            </g>
          )}

          {/* Resource indicators */}
          {activeOverlays?.includes('resources') &&
            sector.resources &&
            sector.resources.length > 0 && (
              <g>
                {(sector.resources || []).map((resource, index) => {
                  const angle = (index * 2 * Math.PI) / sector.resources!.length;
                  const resourceX = posX + Math.cos(angle) * (size + 8);
                  const resourceY = posY + Math.sin(angle) * (size + 8);

                  // Determine color based on resource type
                  const resourceColor =
                    resource.type === 'minerals'
                      ? 'rgb(59, 130, 246)'
                      : resource.type === 'gas'
                        ? 'rgb(16, 185, 129)'
                        : resource.type === 'energy'
                          ? 'rgb(245, 158, 11)'
                          : resource.type === 'organic'
                            ? 'rgb(139, 92, 246)'
                            : 'rgb(236, 72, 153)'; // exotic

                  // Size based on amount
                  const resourceSize = 2 + (resource.amount / 100) * 4;

                  return (
                    <g key={`${sector.id}-${resource.type}`}>
                      <circle
                        cx={resourceX}
                        cy={resourceY}
                        r={resourceSize}
                        fill={resourceColor}
                        className={resource.amount > 50 ? 'animate-pulse' : ''}
                      />
                      <line
                        x1={posX}
                        y1={posY}
                        x2={resourceX}
                        y2={resourceY}
                        stroke={resourceColor}
                        strokeWidth={0.5}
                        strokeOpacity={0.5}
                      />
                    </g>
                  );
                })}
              </g>
            )}

          {/* Anomaly indicator */}
          {sector.anomalies.length > 0 && (
            <circle
              cx={posX}
              cy={posY - size - 5}
              r={3}
              fill={
                sector.anomalies.some((a: Anomaly) => a.severity === 'high')
                  ? 'rgba(255, 50, 50, 0.8)'
                  : sector.anomalies.some((a: Anomaly) => a.severity === 'medium')
                    ? 'rgba(255, 150, 50, 0.8)'
                    : 'rgba(255, 255, 50, 0.8)'
              }
              className="animate-pulse"
            />
          )}

          {/* Sector name (only show for mapped sectors or if selected) */}
          {(sector.status !== 'unmapped' || sector.id === selectedSectorId) && (
            <text
              x={posX}
              y={posY + size + 10}
              textAnchor="middle"
              fill="rgba(255, 255, 255, 0.8)"
              fontSize={10}
              className="pointer-events-none"
            >
              {sector.name}
            </text>
          )}

          {/* Active scan animation */}
          {sector.id === activeScanId && (
            <>
              <circle
                cx={posX}
                cy={posY}
                r={size + 5}
                fill="none"
                stroke="rgba(0, 255, 255, 0.5)"
                strokeWidth={2}
                className="animate-ping"
              />
              <circle
                cx={posX}
                cy={posY}
                r={size + 10}
                fill="none"
                stroke="rgba(0, 255, 255, 0.3)"
                strokeWidth={1}
                className="animation-delay-500 animate-ping"
              />
            </>
          )}
        </g>
      );
    });
  }, [
    filteredSectors,
    zoom,
    offset,
    selectedSectorId,
    activeScanId,
    getSectorColor,
    getSectorSize,
    onSectorSelect,
    activeOverlays,
  ]);

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 p-2">
        <div className="flex items-center space-x-2">
          <Map className="h-5 w-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Galaxy Map</h3>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <button
            onClick={handleZoomIn}
            className="rounded p-1 transition-colors hover:bg-gray-700"
            title="Zoom In"
          >
            <ZoomIn size={16} className="text-gray-300" />
          </button>
          <button
            onClick={handleZoomOut}
            className="rounded p-1 transition-colors hover:bg-gray-700"
            title="Zoom Out"
          >
            <ZoomOut size={16} className="text-gray-300" />
          </button>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded p-1 transition-colors hover:bg-gray-700 ${
              showFilters ? 'bg-blue-900' : ''
            }`}
            title="Advanced Filters"
          >
            <Filter size={16} className={showFilters ? 'text-blue-300' : 'text-gray-300'} />
          </button>

          {/* Filter dropdown */}
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as 'all' | 'unmapped' | 'anomalies')}
            className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-xs text-gray-300"
          >
            <option value="all">All Sectors</option>
            <option value="unmapped">Unmapped</option>
            <option value="anomalies">Anomalies</option>
          </select>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-32 rounded border border-gray-600 bg-gray-700 py-1 pl-7 pr-2 text-xs text-gray-300"
            />
            <Search
              size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="grid grid-cols-2 gap-3 border-b border-gray-700 bg-gray-800 p-3">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Min Resource Potential</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={advancedFilters.minResourcePotential}
              onChange={e =>
                setAdvancedFilters(prev => ({
                  ...prev,
                  minResourcePotential: parseFloat(e.target.value),
                }))
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>{advancedFilters.minResourcePotential.toFixed(1)}</span>
              <span>1.0</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-400">Min Habitability Score</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={advancedFilters.minHabitabilityScore}
              onChange={e =>
                setAdvancedFilters(prev => ({
                  ...prev,
                  minHabitabilityScore: parseFloat(e.target.value),
                }))
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>{advancedFilters.minHabitabilityScore.toFixed(1)}</span>
              <span>1.0</span>
            </div>
          </div>

          <div>
            <label className="flex items-center text-xs text-gray-400">
              <input
                type="checkbox"
                checked={advancedFilters.hasAnomalies}
                onChange={e =>
                  setAdvancedFilters(prev => ({ ...prev, hasAnomalies: e.target.checked }))
                }
                className="mr-2"
              />
              Has Anomalies
            </label>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-400">Anomaly Severity</label>
            <select
              value={advancedFilters.anomalySeverity}
              onChange={e =>
                setAdvancedFilters(prev => ({
                  ...prev,
                  anomalySeverity: e.target.value as 'any' | 'low' | 'medium' | 'high',
                }))
              }
              className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-xs text-gray-300"
              disabled={!advancedFilters.hasAnomalies}
            >
              <option value="any">Any</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-400">Last Scanned Within (hours)</label>
            <input
              type="number"
              min="0"
              value={advancedFilters.lastScannedWithin}
              onChange={e =>
                setAdvancedFilters(prev => ({
                  ...prev,
                  lastScannedWithin: parseInt(e.target.value) || 0,
                }))
              }
              className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-xs text-gray-300"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-400">Resource Types</label>
            <select
              multiple
              value={advancedFilters.resourceTypes}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setAdvancedFilters(prev => ({ ...prev, resourceTypes: selected }));
              }}
              className="h-20 w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-xs text-gray-300"
            >
              <option value="minerals">Minerals</option>
              <option value="gas">Gas</option>
              <option value="energy">Energy</option>
              <option value="organic">Organic</option>
              <option value="exotic">Exotic</option>
            </select>
          </div>

          <div className="col-span-2 flex justify-end">
            <button
              onClick={() =>
                setAdvancedFilters({
                  minResourcePotential: 0,
                  minHabitabilityScore: 0,
                  hasAnomalies: false,
                  anomalySeverity: 'any',
                  lastScannedWithin: 0,
                  resourceTypes: [],
                })
              }
              className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-600"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Map */}
      <div
        ref={mapRef}
        className="relative flex-grow cursor-grab overflow-hidden bg-gray-900"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg width="100%" height="100%">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width={100 * zoom} height={100 * zoom} patternUnits="userSpaceOnUse">
              <path
                d={`M ${100 * zoom} 0 L 0 0 0 ${100 * zoom}`}
                fill="none"
                stroke="rgba(100, 100, 100, 0.2)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Origin marker */}
          <circle
            cx={offset.x}
            cy={offset.y}
            r={5}
            fill="rgba(255, 255, 255, 0.3)"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="1"
          />

          {/* Trade Routes */}
          {tradeRoutes && activeOverlays?.includes('tradeRoutes') && (
            <>
              {tradeRoutes
                .filter(route => route.active)
                .map(route => {
                  const sourceSector = sectors.find(s => s.id === route.sourceSectorId);
                  const targetSector = sectors.find(s => s.id === route.targetSectorId);

                  if (!sourceSector || !targetSector) return null;

                  const sourceX = sourceSector.coordinates.x * zoom + offset.x;
                  const sourceY = sourceSector.coordinates.y * zoom + offset.y;
                  const targetX = targetSector.coordinates.x * zoom + offset.x;
                  const targetY = targetSector.coordinates.y * zoom + offset.y;

                  // Calculate control points for curved lines
                  const dx = targetX - sourceX;
                  const dy = targetY - sourceY;
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  const midX = (sourceX + targetX) / 2;
                  const midY = (sourceY + targetY) / 2;
                  const curveFactor = 0.2;
                  const perpX = -dy * curveFactor;
                  const perpY = dx * curveFactor;
                  const controlX = midX + perpX;
                  const controlY = midY + perpY;

                  return (
                    <g key={route.id}>
                      {/* Trade route path */}
                      <path
                        d={`M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`}
                        fill="none"
                        stroke={
                          route.resourceType === 'minerals'
                            ? 'rgba(59, 130, 246, 0.6)'
                            : route.resourceType === 'gas'
                              ? 'rgba(16, 185, 129, 0.6)'
                              : route.resourceType === 'energy'
                                ? 'rgba(245, 158, 11, 0.6)'
                                : route.resourceType === 'organic'
                                  ? 'rgba(139, 92, 246, 0.6)'
                                  : 'rgba(236, 72, 153, 0.6)'
                        }
                        strokeWidth={1 + route.volume * 3}
                        strokeDasharray={route.volume < 0.5 ? '5,5' : 'none'}
                        className="opacity-70"
                      />

                      {/* Animated flow along the path */}
                      <circle r={2 + route.volume * 2}>
                        <animateMotion
                          dur={`${10 - route.volume * 5}s`}
                          repeatCount="indefinite"
                          path={`M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`}
                        />
                      </circle>
                    </g>
                  );
                })}
            </>
          )}

          {/* Sectors */}
          {renderSectors()}
        </svg>

        {/* Map stats */}
        <div className="absolute bottom-2 left-2 rounded bg-gray-800/70 px-2 py-1 text-xs text-gray-300">
          <div>
            Sectors: {filteredSectors.length} / {sectors.length}
          </div>
          <div>Zoom: {zoom.toFixed(1)}x</div>
        </div>

        {/* Legend */}
        <div className="absolute right-2 top-2 rounded bg-gray-800/70 px-2 py-1 text-xs text-gray-300">
          <div className="mb-1 flex items-center">
            <div className="mr-2 h-3 w-3 rounded-full bg-gray-400"></div>
            <span>Unmapped</span>
          </div>
          <div className="mb-1 flex items-center">
            <div className="mr-2 h-3 w-3 rounded-full bg-blue-500"></div>
            <span>Mapped</span>
          </div>
          <div className="mb-1 flex items-center">
            <div className="mr-2 h-3 w-3 rounded-full bg-yellow-500"></div>
            <span>Scanning</span>
          </div>
          <div className="mb-1 flex items-center">
            <div className="mr-2 h-3 w-3 rounded-full bg-green-500"></div>
            <span>Analyzed</span>
          </div>
          <div className="flex items-center">
            <div className="mr-2 h-3 w-3 animate-pulse rounded-full bg-red-500"></div>
            <span>Anomaly</span>
          </div>
        </div>
      </div>
    </div>
  );
}
