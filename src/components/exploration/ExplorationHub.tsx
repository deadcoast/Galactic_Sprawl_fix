import React, { useState, useRef, useMemo, useCallback, useEffect, memo } from 'react';
import { Radar, Search, ZoomIn, ZoomOut, AlertTriangle, Rocket, Map, History, Filter, ChevronDown } from 'lucide-react';
import { ExplorationControls } from './ExplorationControls';
import { ExplorationTutorial } from './ExplorationTutorial';
import { MissionLog } from './MissionLog';
import { ReconShipStatus } from './ReconShipStatus';
import { ResourceTransfer } from '../mining/ResourceTransfer';
import { useTooltipContext } from '../ui/tooltip-context';

interface Sector {
  id: string;
  name: string;
  status: 'unmapped' | 'mapped' | 'scanning';
  coordinates: { x: number; y: number };
  resourcePotential: number;
  habitabilityScore: number;
  anomalies: Anomaly[];
  lastScanned?: number;
}

interface Anomaly {
  id: string;
  type: 'artifact' | 'signal' | 'phenomenon';
  severity: 'low' | 'medium' | 'high';
  description: string;
  investigated: boolean;
}

interface ReconShip {
  id: string;
  name: string;
  status: 'idle' | 'scanning' | 'investigating' | 'returning';
  targetSector?: string;
  experience: number;
  specialization: 'mapping' | 'anomaly' | 'resource';
  efficiency: number;
  lastUpdate?: number;
}

// Mock data for demonstration
const mockSectors: Sector[] = [
  {
    id: 'alpha-sector',
    name: 'Alpha Sector',
    status: 'mapped',
    coordinates: { x: 0, y: 0 },
    resourcePotential: 0.8,
    habitabilityScore: 0.6,
    anomalies: [
      {
        id: 'ancient-ruins',
        type: 'artifact',
        severity: 'high',
        description: 'Ancient ruins of unknown origin',
        investigated: false
      }
    ],
    lastScanned: Date.now() - 3600000
  },
  {
    id: 'beta-sector',
    name: 'Beta Sector',
    status: 'scanning',
    coordinates: { x: 200, y: -150 },
    resourcePotential: 0.5,
    habitabilityScore: 0.3,
    anomalies: [],
    lastScanned: Date.now()
  },
  {
    id: 'gamma-sector',
    name: 'Gamma Sector',
    status: 'unmapped',
    coordinates: { x: -180, y: 120 },
    resourcePotential: 0.4,
    habitabilityScore: 0.7,
    anomalies: []
  }
];

const mockShips: ReconShip[] = [
  {
    id: 'recon-1',
    name: 'Pathfinder Alpha',
    status: 'scanning',
    targetSector: 'beta-sector',
    experience: 1250,
    specialization: 'mapping',
    efficiency: 0.9
  },
  {
    id: 'recon-2',
    name: 'Signal Hunter Beta',
    status: 'investigating',
    targetSector: 'alpha-sector',
    experience: 800,
    specialization: 'anomaly',
    efficiency: 0.85
  }
];

// Mock transfer data for exploration discoveries
const mockExplorationTransfers = [
  {
    id: 'discovery-1',
    sourceId: 'alpha-sector',
    targetId: 'storage',
    resourceType: 'Dark Matter',
    amount: 100,
    progress: 0.5
  }
];

type FilterType = 'all' | 'unmapped' | 'anomalies';

interface AdvancedFilters {
  resourceThreshold: number;
  habitabilityThreshold: number;
  hasAnomalies: boolean;
  recentlyScanned: boolean;
}

// Memoized Sector Component
const SectorComponent = memo(({ 
  sector,
  isSelected,
  showHeatMap,
  onSelect,
  onHover,
  getSectorHeat,
  ships
}: {
  sector: Sector;
  isSelected: boolean;
  showHeatMap: boolean;
  onSelect: (sector: Sector) => void;
  onHover: (show: boolean, sector: Sector) => void;
  getSectorHeat: (sector: Sector) => number;
  ships: ReconShip[];
}) => {
  const scanningShip = ships.find(ship => ship.targetSector === sector.id);
  const heatValue = getSectorHeat(sector);

  return (
    <div
      className="absolute"
      style={{
        left: `calc(50% + ${sector.coordinates.x}px)`,
        top: `calc(50% + ${sector.coordinates.y}px)`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <button
        onClick={() => onSelect(sector)}
        onMouseEnter={() => onHover(true, sector)}
        onMouseLeave={() => onHover(false, sector)}
        className="group relative"
      >
        {/* Sector Visualization */}
        <div 
          className={`w-24 h-24 rounded-lg transition-all duration-300 ${
            sector.status === 'unmapped'
              ? 'bg-gray-800/50'
              : sector.status === 'scanning'
              ? 'bg-teal-900/50 animate-pulse'
              : 'bg-teal-800/30'
          } relative ${
            isSelected ? 'ring-2 ring-teal-400 ring-offset-2 ring-offset-gray-900' : ''
          }`}
        >
          {/* Heat Map Overlay */}
          {showHeatMap && sector.status !== 'unmapped' && (
            <div 
              className="absolute inset-0 rounded-lg mix-blend-overlay"
              style={{
                background: `rgba(${Math.round(heatValue * 255)}, ${Math.round(heatValue * 100)}, 0, ${heatValue * 0.8})`
              }}
            />
          )}

          {/* Resource Potential Indicator */}
          {sector.status !== 'unmapped' && (
            <div 
              className="absolute inset-2 border-2 border-teal-500/30 rounded transition-all"
              style={{
                clipPath: `polygon(0 ${100 - sector.resourcePotential * 100}%, 100% ${100 - sector.resourcePotential * 100}%, 0%, 0 100%)`
              }}
            />
          )}

          {/* Habitability Score Ring */}
          {sector.status !== 'unmapped' && (
            <div 
              className="absolute inset-0 border-4 border-teal-400/20 rounded-lg transition-all"
              style={{
                clipPath: `polygon(0 0, ${sector.habitabilityScore * 100}% 0, ${sector.habitabilityScore * 100}% 100%, 0 100%)`
              }}
            />
          )}

          {/* Anomaly Indicators */}
          {sector.anomalies.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-300 mb-2">Detected Anomalies</div>
              <div className="space-y-1">
                {sector.anomalies.map(anomaly => (
                  <div
                    key={anomaly.id}
                    className={`text-xs px-2 py-1 rounded ${
                      anomaly.severity === 'high' ? 'bg-red-900/50 text-red-400' :
                      anomaly.severity === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-blue-900/50 text-blue-400'
                    }`}
                  >
                    {anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scanning Ship Indicator */}
          {scanningShip && (
            <div className="absolute -top-2 -right-2">
              <Rocket className="w-5 h-5 text-teal-400 animate-pulse" />
            </div>
          )}
        </div>

        {/* Sector Label */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-center">
          <div className="text-teal-200 font-medium">{sector.name}</div>
          {sector.status !== 'unmapped' && (
            <div className="text-teal-300/70 text-sm">
              {sector.status === 'scanning' ? 'Scanning in Progress' : 'Mapped'}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.sector === nextProps.sector &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.showHeatMap === nextProps.showHeatMap &&
    prevProps.ships.length === nextProps.ships.length
  );
});

// Memoized Ship Marker Component
const ShipMarker = memo(({ 
  ship,
  targetSector
}: {
  ship: ReconShip;
  targetSector: Sector;
}) => {
  return (
    <div
      className="absolute transition-all duration-1000 ease-in-out"
      style={{
        left: `calc(50% + ${targetSector.coordinates.x}px)`,
        top: `calc(50% + ${targetSector.coordinates.y}px)`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="relative group">
        <div 
          className={`p-2 rounded-full ${
            ship.status === 'scanning' ? 'bg-teal-500/20' :
            ship.status === 'investigating' ? 'bg-yellow-500/20' :
            'bg-blue-500/20'
          } animate-pulse`}
        >
          <Rocket 
            className={`w-4 h-4 ${
              ship.status === 'scanning' ? 'text-teal-400' :
              ship.status === 'investigating' ? 'text-yellow-400' :
              'text-blue-400'
            }`}
          />
        </div>

        {/* Ship Info Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-2 bg-gray-800/95 rounded border border-gray-700 whitespace-nowrap">
            <div className="text-sm font-medium text-white">{ship.name}</div>
            <div className="text-xs text-gray-400">
              {ship.status.charAt(0).toUpperCase() + ship.status.slice(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.ship === nextProps.ship &&
    prevProps.targetSector === nextProps.targetSector
  );
});

export function ExplorationHub() {
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showMissionLog, setShowMissionLog] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    resourceThreshold: 0.5,
    habitabilityThreshold: 0.3,
    hasAnomalies: false,
    recentlyScanned: false
  });

  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const { showTooltip, hideTooltip } = useTooltipContext();

  // Add new state for real-time updates
  const [sectors, setSectors] = useState(mockSectors);
  const [ships, setShips] = useState(mockShips);
  const [transfers, setTransfers] = useState(mockExplorationTransfers);

  // Optimize update intervals with useRef
  const updateIntervals = useRef({
    ships: null as number | null,
    sectors: null as number | null,
    transfers: null as number | null
  });

  // Memoize complex calculations
  const activeShips = useMemo(() => {
    return ships.filter(ship => ship.status !== 'idle');
  }, [ships]);

  // Optimize real-time updates with separate intervals
  useEffect(() => {
    // Ship position updates (more frequent)
    updateIntervals.current.ships = setInterval(() => {
      setShips(prevShips => prevShips.map(ship => {
        if (ship.status === 'idle' || !ship.targetSector) return ship;

        const targetSector = sectors.find(s => s.id === ship.targetSector);
        if (!targetSector) return ship;

        // Calculate progress based on efficiency and time
        const progress = Math.min(1, (Date.now() - (ship.lastUpdate || Date.now())) / (10000 / ship.efficiency));

        // Update ship status based on progress
        if (progress >= 1) {
          return {
            ...ship,
            status: ship.status === 'scanning' ? 'investigating' : 'returning',
            lastUpdate: Date.now()
          };
        }

        return {
          ...ship,
          lastUpdate: Date.now()
        };
      }));
    }, 1000);

    // Sector updates (less frequent)
    updateIntervals.current.sectors = setInterval(() => {
      setSectors(prevSectors => prevSectors.map(sector => {
        const scanningShip = ships.find(ship => ship.targetSector === sector.id && ship.status === 'scanning');
        
        if (scanningShip) {
          // Update sector data based on ship's scan
          return {
            ...sector,
            status: 'scanning',
            lastScanned: Date.now()
          };
        }

        if (sector.status === 'scanning' && !scanningShip) {
          // Complete the scan
          return {
            ...sector,
            status: 'mapped',
            lastScanned: Date.now()
          };
        }

        return sector;
      }));
    }, 2000);

    // Transfer updates (least frequent)
    updateIntervals.current.transfers = setInterval(() => {
      setTransfers(prevTransfers => prevTransfers.map(transfer => {
        if (transfer.progress >= 1) return transfer;

        return {
          ...transfer,
          progress: Math.min(1, transfer.progress + 0.1)
        };
      }));
    }, 3000);

    // Store current intervals for cleanup
    const currentIntervals = { ...updateIntervals.current };

    return () => {
      Object.values(currentIntervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [sectors, ships]);

  // Memoize filtered sectors with optimized filtering
  const filteredSectors = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    const filterFns = {
      unmapped: (s: Sector) => s.status === 'unmapped',
      anomalies: (s: Sector) => s.anomalies.length > 0,
      all: () => true
    };

    return sectors.filter(sector => {
      // Quick exit conditions
      if (searchLower && !sector.name.toLowerCase().includes(searchLower)) {
        return false;
      }

      if (!filterFns[filter](sector)) {
        return false;
      }

      // Only apply advanced filters to mapped sectors
      if (sector.status !== 'unmapped') {
        const { resourceThreshold, habitabilityThreshold, hasAnomalies, recentlyScanned } = advancedFilters;
        
        if (sector.resourcePotential < resourceThreshold ||
            sector.habitabilityScore < habitabilityThreshold ||
            (hasAnomalies && sector.anomalies.length === 0) ||
            (recentlyScanned && (!sector.lastScanned || Date.now() - sector.lastScanned > 3600000))) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, filter, sectors, advancedFilters]);

  // Memoize handlers
  const handleSectorSelect = useCallback((sector: Sector) => {
    setSelectedSector(sector);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) {
      return;
    }

    const deltaX = e.clientX - lastPosition.current.x;
    const deltaY = e.clientY - lastPosition.current.y;

    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    lastPosition.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  }, []);

  // Calculate sector heat values
  const getSectorHeat = useCallback((sector: Sector) => {
    if (sector.status === 'unmapped') {
      return 0;
    }
    
    const baseHeat = sector.resourcePotential * 0.5 + sector.habitabilityScore * 0.3;
    const anomalyBonus = sector.anomalies.length * 0.1;
    
    return Math.min(1, baseHeat + anomalyBonus);
  }, []);

  // Enhanced sector hover tooltip
  const handleSectorHover = useCallback((show: boolean, sector: Sector) => {
    if (show) {
      showTooltip(
        <div className="p-4 bg-gray-800/95 rounded-lg border border-gray-700 shadow-xl max-w-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium text-white">{sector.name}</div>
            <div className={`px-2 py-0.5 rounded text-xs ${
              sector.status === 'unmapped' ? 'bg-gray-700 text-gray-400' :
              sector.status === 'scanning' ? 'bg-teal-900/50 text-teal-400' :
              'bg-teal-800/30 text-teal-300'
            }`}>
              {sector.status.charAt(0).toUpperCase() + sector.status.slice(1)}
            </div>
          </div>

          {sector.status !== 'unmapped' && (
            <>
              {/* Resource and Habitability Bars */}
              <div className="space-y-2 mb-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Resources</span>
                    <span className="text-teal-400">{Math.round(sector.resourcePotential * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${sector.resourcePotential * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Habitability</span>
                    <span className="text-teal-400">{Math.round(sector.habitabilityScore * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${sector.habitabilityScore * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Anomalies */}
              {sector.anomalies.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-300 mb-2">Detected Anomalies</div>
                  <div className="space-y-1">
                    {sector.anomalies.map(anomaly => (
                      <div
                        key={anomaly.id}
                        className={`text-xs px-2 py-1 rounded ${
                          anomaly.severity === 'high' ? 'bg-red-900/50 text-red-400' :
                          anomaly.severity === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                          'bg-blue-900/50 text-blue-400'
                        }`}
                      >
                        {anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Scanned */}
              {sector.lastScanned && (
                <div className="text-xs text-gray-500">
                  Last Scanned: {new Date(sector.lastScanned).toLocaleString()}
                </div>
              )}
            </>
          )}
        </div>
      );
    } else {
      hideTooltip();
    }
  }, [showTooltip, hideTooltip]);

  return (
    <div className="fixed inset-4 bg-gray-900/95 backdrop-blur-md rounded-lg border border-gray-700 shadow-2xl flex overflow-hidden">
      {/* Left Panel - Exploration Map */}
      <div className="w-2/3 border-r border-gray-700 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Radar className="w-6 h-6 text-teal-400" />
            <h2 className="text-xl font-bold text-white">Exploration Hub</h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search sectors..."
                className="w-64 px-4 py-2 bg-gray-800/90 rounded-lg border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleZoom(0.1)}
                className="p-2 bg-gray-800/90 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm transition-colors"
              >
                <ZoomIn className="w-5 h-5 text-teal-400" />
              </button>
              <button
                onClick={() => handleZoom(-0.1)}
                className="p-2 bg-gray-800/90 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm transition-colors"
              >
                <ZoomOut className="w-5 h-5 text-teal-400" />
              </button>
            </div>

            <button
              onClick={() => setShowMissionLog(true)}
              className="p-2 bg-gray-800/90 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm transition-colors"
            >
              <History className="w-5 h-5 text-teal-400" />
            </button>
          </div>
        </div>

        {/* Enhanced Filter Controls */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${
                  filter === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Map className="w-4 h-4" />
                <span>All Sectors</span>
              </button>
              <button
                onClick={() => setFilter('unmapped')}
                className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${
                  filter === 'unmapped'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Radar className="w-4 h-4" />
                <span>Unmapped</span>
              </button>
              <button
                onClick={() => setFilter('anomalies')}
                className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${
                  filter === 'anomalies'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Anomalies</span>
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${
                showFilters ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Advanced Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                {/* Resource Threshold */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Minimum Resource Potential
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={advancedFilters.resourceThreshold}
                    onChange={(e) => setAdvancedFilters(prev => ({
                      ...prev,
                      resourceThreshold: parseFloat(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(advancedFilters.resourceThreshold * 100)}%
                  </div>
                </div>

                {/* Habitability Threshold */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Minimum Habitability Score
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={advancedFilters.habitabilityThreshold}
                    onChange={(e) => setAdvancedFilters(prev => ({
                      ...prev,
                      habitabilityThreshold: parseFloat(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(advancedFilters.habitabilityThreshold * 100)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={advancedFilters.hasAnomalies}
                    onChange={(e) => setAdvancedFilters(prev => ({
                      ...prev,
                      hasAnomalies: e.target.checked
                    }))}
                    className="rounded border-gray-600 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-400">Has Anomalies</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={advancedFilters.recentlyScanned}
                    onChange={(e) => setAdvancedFilters(prev => ({
                      ...prev,
                      recentlyScanned: e.target.checked
                    }))}
                    className="rounded border-gray-600 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-400">Recently Scanned</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Heat Map Toggle */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setShowHeatMap(!showHeatMap)}
            className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${
              showHeatMap
                ? 'bg-amber-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Heat Map</span>
          </button>
        </div>

        {/* Exploration Map */}
        <div 
          className="relative flex-1 bg-gray-900 rounded-lg overflow-hidden cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Starfield Background */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=3000')] bg-cover opacity-10" />

          {/* Map Content */}
          <div 
            className="absolute inset-0 transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`
            }}
          >
            {/* Resource Transfer Animations */}
            <ResourceTransfer transfers={transfers} />

            {/* Sectors */}
            {filteredSectors.map(sector => (
              <SectorComponent
                key={sector.id}
                sector={sector}
                isSelected={selectedSector?.id === sector.id}
                showHeatMap={showHeatMap}
                onSelect={handleSectorSelect}
                onHover={handleSectorHover}
                getSectorHeat={getSectorHeat}
                ships={ships}
              />
            ))}
          </div>
        </div>

        {/* Recon Fleet Status */}
        <ReconShipStatus ships={ships} />
      </div>

      {/* Right Panel - Controls & Details */}
      <div className="w-1/3 p-6">
        {selectedSector ? (
          <ExplorationControls
            sector={selectedSector}
            onClose={() => setSelectedSector(null)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-center">
            <div>
              <Radar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a sector to view details and manage exploration</p>
            </div>
          </div>
        )}
      </div>

      {/* Mission Log Modal */}
      {showMissionLog && (
        <MissionLog onClose={() => setShowMissionLog(false)} />
      )}

      {/* Tutorial Overlay */}
      {showTutorial && (
        <ExplorationTutorial onClose={() => setShowTutorial(false)} />
      )}

      {/* Optimized ship markers */}
      {activeShips.map(ship => {
        const targetSector = sectors.find(s => s.id === ship.targetSector);
        if (!targetSector) {
          return null;
        }

        return (
          <ShipMarker
            key={ship.id}
            ship={ship}
            targetSector={targetSector}
          />
        );
      })}
    </div>
  );
}