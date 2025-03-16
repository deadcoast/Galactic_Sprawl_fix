import {
  AlertTriangle,
  Filter,
  Flag,
  History,
  Map,
  Radar,
  Rocket,
  Search,
  Target,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import * as React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ContextMenuItem, useContextMenu } from '../../../../components/ui/ContextMenu';
import { Draggable, DragItem, DropTarget } from '../../../../components/ui/DragAndDrop';
import { useTooltipContext } from '../../../../components/ui/tooltip-context';
import { explorationRules } from '../../../../config/automation/explorationRules';
import { StarSystem } from '../../../../managers/exploration/ExplorationManagerImpl';
import {
  ReconShipManagerImpl,
  Ship as ReconShipType,
  ShipEvent,
} from '../../../../managers/exploration/ReconShipManagerImpl';
import { automationManager } from '../../../../managers/game/AutomationManager';
import { BaseEvent, EventType } from '../../../../types/events/EventTypes';
import { SectorType } from '../../../../types/exploration/ExplorationTypes';
import { ResourceTransfer } from '../MiningHub/ResourceTransfer';
import { ResourceType } from './../../../../types/resources/ResourceTypes';
import { ExplorationControls } from './ExplorationControls';
import { ExplorationTutorial } from './ExplorationTutorial';
import { MissionLog } from './MissionLog';
import { ReconShipStatus } from './ReconShipStatus';

interface Anomaly {
  id: string;
  type: 'artifact' | 'signal' | 'phenomenon';
  severity: 'low' | 'medium' | 'high';
  description: string;
  investigated: boolean;
}

// Update sector status type
type SectorStatus = 'unmapped' | 'mapped' | 'scanning';

// Update ship status type
type ShipStatus = 'idle' | 'scanning' | 'returning' | 'assigned';

interface Sector extends Omit<StarSystem, 'status'> {
  resourcePotential: number;
  habitabilityScore: number;
  anomalies: Anomaly[];
  position: { x: number; y: number };
  coordinates: { x: number; y: number };
  assignedShips: string[];
  status: SectorStatus;
}

// Update ship status type to match ReconShipStatus component
type ReconShipStatusType = 'idle' | 'scanning' | 'returning' | 'investigating';

interface ReconShip extends Omit<ReconShipType, 'status'> {
  id: string;
  name: string;
  type: string;
  experience: number;
  specialization: 'mapping' | 'anomaly' | 'resource';
  efficiency: number;
  lastUpdate?: number;
  status: ShipStatus;
  targetSector?: string;
}

// Interface for ReconShipStatus component - prefix with underscore since it's used for type documentation
interface _ReconShipStatusProps {
  id: string;
  name: string;
  status: ReconShipStatusType;
  targetSector?: string;
  experience: number;
  specialization: 'mapping' | 'anomaly' | 'resource';
  efficiency: number;
}

interface MapOffset {
  x: number;
  y: number;
}

interface AdvancedFilters {
  minResourcePotential: number;
  minHabitabilityScore: number;
  hasAnomalies: boolean;
  anomalySeverity: 'any' | 'low' | 'medium' | 'high';
  lastScannedWithin: number; // hours
  resourceTypes: string[];
}

// Add type for context menu items
interface ShipMenuItem extends ContextMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

// Mock data for demonstration
const mockSectors: Sector[] = [
  {
    id: 'alpha-sector',
    name: 'Alpha Sector',
    type: SectorType.PLANETARY_SYSTEM,
    status: 'mapped',
    position: { x: 0, y: 0 },
    coordinates: { x: 0, y: 0 },
    resourcePotential: 0.8,
    habitabilityScore: 0.6,
    anomalies: [
      {
        id: 'ancient-ruins',
        type: 'artifact',
        severity: 'high',
        description: 'Ancient ruins of unknown origin',
        investigated: false,
      },
    ],
    lastScanned: Date.now() - 3600000,
    assignedShips: [],
  },
  {
    id: 'beta-sector',
    name: 'Beta Sector',
    type: SectorType.ASTEROID_FIELD,
    status: 'scanning',
    position: { x: 200, y: -150 },
    coordinates: { x: 200, y: -150 },
    resourcePotential: 0.5,
    habitabilityScore: 0.3,
    anomalies: [],
    lastScanned: Date.now(),
    assignedShips: [],
  },
  {
    id: 'gamma-sector',
    name: 'Gamma Sector',
    type: SectorType.DEEP_SPACE,
    status: 'unmapped',
    position: { x: -180, y: 120 },
    coordinates: { x: -180, y: 120 },
    resourcePotential: 0.4,
    habitabilityScore: 0.7,
    anomalies: [],
    assignedShips: [],
  },
];

// Update mock ships to use correct status values
const mockShips: ReconShip[] = [
  {
    id: 'recon-1',
    name: 'Pathfinder Alpha',
    type: 'recon',
    status: 'scanning' as ShipStatus,
    assignedSectorId: 'beta-sector',
    experience: 1250,
    specialization: 'mapping',
    efficiency: 0.9,
    sensorRange: 100,
    speed: 1.0,
    capabilities: {
      canScan: true,
      canSalvage: false,
      canMine: false,
      canJump: true,
    },
  },
  {
    id: 'recon-2',
    name: 'Signal Hunter Beta',
    type: 'recon',
    status: 'assigned' as ShipStatus,
    assignedSectorId: 'alpha-sector',
    experience: 800,
    specialization: 'anomaly',
    efficiency: 0.85,
    sensorRange: 120,
    speed: 0.8,
    capabilities: {
      canScan: true,
      canSalvage: true,
      canMine: false,
      canJump: false,
    },
  },
];

// Mock transfer data for exploration discoveries
const mockExplorationTransfers = [
  {
    id: 'discovery-1',
    sourceId: 'alpha-sector',
    targetId: 'storage',
    resourceType: ResourceType.DARK_MATTER,
    amount: 100,
    progress: 0.5,
  },
];

type FilterType = 'all' | 'unmapped' | 'anomalies';

// Memoized Sector Component
const SectorComponent = memo(
  ({
    sector,
    isSelected,
    showHeatMap,
    onSelect,
    onHover,
    getSectorHeat,
    ships,
    onShipAssign,
  }: {
    sector: Sector;
    isSelected: boolean;
    showHeatMap: boolean;
    onSelect: (sector: Sector) => void;
    onHover: (show: boolean, sector: Sector) => void;
    getSectorHeat: (sector: Sector) => number;
    ships: ReconShip[];
    onShipAssign: (shipId: string, sectorId: string) => void;
  }) => {
    const scanningShip = ships.find(ship => ship.targetSector === sector.id);
    const heatValue = getSectorHeat(sector);

    // Update getSectorMenuItems to use proper types
    const getSectorMenuItems = (): ShipMenuItem[] => {
      const assignedShip = ships.find(ship => ship.targetSector === sector.id);
      return [
        {
          id: 'info',
          label: 'View Details',
          icon: <Map className="h-4 w-4" />,
          action: () => onSelect(sector),
        },
        {
          id: 'assign-ship',
          label: assignedShip ? 'Reassign Ship' : 'Assign Ship',
          icon: <Rocket className="h-4 w-4" />,
          action: () => {}, // No-op action for parent menu
          children: ships
            .filter(ship => ship.status === 'idle' || ship.targetSector === sector.id)
            .map(ship => ({
              id: ship.id,
              label: ship.name,
              icon: <Target className="h-4 w-4" />,
              action: () => onShipAssign(ship.id, sector.id),
            })),
        },
        {
          id: 'mark-priority',
          label: 'Mark as Priority',
          icon: <Flag className="h-4 w-4" />,
          action: () => {
            // Handle priority marking
            console.warn(`Marking ${sector.name} as priority`);
          },
        },
      ];
    };

    const { handleContextMenu, ContextMenuComponent } = useContextMenu({
      items: getSectorMenuItems(),
    });

    return (
      <div
        className="absolute"
        style={{
          left: `calc(50% + ${sector.position.x}px)`,
          top: `calc(50% + ${sector.position.y}px)`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <DropTarget
          accept={['ship']}
          onDrop={(item: DragItem) => {
            if (item.type === 'ship' && typeof item.data.id === 'string') {
              const shipId = item.data.id;
              onShipAssign(shipId, sector.id);
            }
          }}
          className="group relative"
        >
          <div
            onContextMenu={handleContextMenu}
            onClick={() => onSelect(sector)}
            onMouseEnter={() => onHover(true, sector)}
            onMouseLeave={() => onHover(false, sector)}
          >
            {/* Sector Visualization */}
            <div
              className={`h-24 w-24 rounded-lg transition-all duration-300 ${
                sector.status === 'unmapped'
                  ? 'bg-gray-800/50'
                  : sector.status === 'scanning'
                    ? 'animate-pulse bg-teal-900/50'
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
                    background: `rgba(${Math.round(heatValue * 255)}, ${Math.round(heatValue * 100)}, 0, ${heatValue * 0.8})`,
                  }}
                />
              )}

              {/* Resource Potential Indicator */}
              {sector.status !== 'unmapped' && (
                <div
                  className="absolute inset-2 rounded border-2 border-teal-500/30 transition-all"
                  style={{
                    clipPath: `polygon(0 ${100 - sector.resourcePotential * 100}%, 100% ${100 - sector.resourcePotential * 100}%, 0%, 0 100%)`,
                  }}
                />
              )}

              {/* Habitability Score Ring */}
              {sector.status !== 'unmapped' && (
                <div
                  className="absolute inset-0 rounded-lg border-4 border-teal-400/20 transition-all"
                  style={{
                    clipPath: `polygon(0 0, ${sector.habitabilityScore * 100}% 0, ${sector.habitabilityScore * 100}% 100%, 0 100%)`,
                  }}
                />
              )}

              {/* Anomaly Indicators */}
              {sector.anomalies?.length > 0 && (
                <div className="mb-3">
                  <div className="mb-2 text-xs font-medium text-gray-300">Detected Anomalies</div>
                  <div className="space-y-1">
                    {sector.anomalies.map(anomaly => (
                      <div
                        key={anomaly.id}
                        className={`rounded px-2 py-1 text-xs ${
                          anomaly.severity === 'high'
                            ? 'bg-red-900/50 text-red-400'
                            : anomaly.severity === 'medium'
                              ? 'bg-yellow-900/50 text-yellow-400'
                              : 'bg-blue-900/50 text-blue-400'
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
                <div className="absolute -right-2 -top-2">
                  <Rocket className="h-5 w-5 animate-pulse text-teal-400" />
                </div>
              )}
            </div>

            {/* Sector Label */}
            <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 text-center">
              <div className="font-medium text-teal-200">{sector.name}</div>
              {sector.status !== 'unmapped' && (
                <div className="text-sm text-teal-300/70">
                  {sector.status === 'scanning' ? 'Scanning in Progress' : 'Mapped'}
                </div>
              )}
            </div>
          </div>
        </DropTarget>
        {ContextMenuComponent}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memo
    return (
      prevProps.sector === nextProps.sector &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.showHeatMap === nextProps.showHeatMap &&
      prevProps.ships.length === nextProps.ships.length
    );
  }
);

// Ship Marker Component with drag-and-drop
const ShipMarker = memo(({ ship, targetSector }: { ship: ReconShip; targetSector: Sector }) => {
  return (
    <div
      className="absolute transition-all duration-300"
      style={{
        left: `calc(50% + ${targetSector.position.x}px)`,
        top: `calc(50% + ${targetSector.position.y}px)`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <Draggable
        item={{
          id: ship.id,
          type: 'ship',
          data: ship,
        }}
      >
        <div className="rounded-lg border border-teal-500/30 bg-teal-900/80 p-2 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <Rocket className="h-4 w-4 text-teal-400" />
            <span className="text-xs font-medium text-teal-200">{ship.name}</span>
          </div>
          <div className="mt-1 text-xs text-teal-400/70">
            {ship.status.charAt(0).toUpperCase() + ship.status.slice(1)}
          </div>
        </div>
      </Draggable>
    </div>
  );
});

export function ExplorationHub() {
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showMissionLog, setShowMissionLog] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    minResourcePotential: 0,
    minHabitabilityScore: 0,
    hasAnomalies: false,
    anomalySeverity: 'any',
    lastScannedWithin: 24,
    resourceTypes: [],
  });
  const [mapOffset, setMapOffset] = useState<MapOffset>({ x: 0, y: 0 });

  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const { showTooltip, hideTooltip } = useTooltipContext();

  // Add new state for real-time updates
  const [sectors, setSectors] = useState(mockSectors);
  const [ships, setShips] = useState(mockShips);
  const [transfers, setTransfers] = useState(mockExplorationTransfers);

  // Optimize update intervals with useRef
  const updateIntervals = useRef({
    ships: null as NodeJS.Timeout | null,
    sectors: null as NodeJS.Timeout | null,
    transfers: null as NodeJS.Timeout | null,
  });

  // Memoize complex calculations
  const activeShips = useMemo(() => {
    return ships.filter(ship => ship.status !== 'idle');
  }, [ships]);

  // Initialize ReconShipManager
  const reconManager = useMemo(() => new ReconShipManagerImpl(), []);

  // Register automation rules on mount
  useEffect(() => {
    // Register each exploration rule
    explorationRules.forEach(rule => {
      automationManager.registerRule(rule);
    });

    // Cleanup on unmount
    return () => {
      explorationRules.forEach(rule => {
        automationManager.removeRule(rule.id);
      });
    };
  }, []);

  // Update sector status handling
  useEffect(() => {
    // Sector updates (less frequent)
    updateIntervals.current.sectors = setInterval(() => {
      setSectors((prevSectors: Sector[]) => {
        return prevSectors.map(sector => {
          const scanningShip = ships.find(
            ship => ship.targetSector === sector.id && ship.status === 'scanning'
          );

          // Create new sector with proper status type
          return {
            ...sector,
            status: scanningShip
              ? 'scanning'
              : sector.status === 'scanning'
                ? 'mapped'
                : (sector.status as SectorStatus),
            lastScanned: Date.now(),
          };
        });
      });
    }, 2000);

    // Ship position updates (more frequent)
    updateIntervals.current.ships = setInterval(() => {
      setShips(prevShips =>
        prevShips.map(ship => {
          if (ship.status === 'idle' || !ship.targetSector) return ship;

          const targetSector = sectors.find(s => s.id === ship.targetSector);
          if (!targetSector) return ship;

          // Calculate progress based on efficiency and time
          const progress = Math.min(
            1,
            (Date.now() - (ship.lastUpdate || Date.now())) / (10000 / ship.efficiency)
          );

          // Update ship status based on progress
          if (progress >= 1) {
            return {
              ...ship,
              status: ship.status === 'scanning' ? 'returning' : 'idle',
              lastUpdate: Date.now(),
            } as ReconShip;
          }

          return {
            ...ship,
            lastUpdate: Date.now(),
          } as ReconShip;
        })
      );
    }, 1000);

    // Transfer updates (least frequent)
    updateIntervals.current.transfers = setInterval(() => {
      setTransfers(prevTransfers =>
        prevTransfers.map(transfer => {
          if (transfer.progress >= 1) return transfer;

          return {
            ...transfer,
            progress: Math.min(1, transfer.progress + 0.1),
          };
        })
      );
    }, 3000);

    // Store current intervals for cleanup
    const currentIntervals = { ...updateIntervals.current };

    return () => {
      Object.values(currentIntervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [ships]);

  // Update ship status management
  useEffect(() => {
    const interval = setInterval(() => {
      setShips((prevShips: ReconShip[]) =>
        prevShips.map(ship => {
          if (!ship) return ship;

          const baseShip = {
            ...ship,
            lastUpdate: Date.now(),
            status: ship.status || 'idle',
            experience: ship.experience || 0,
            specialization: ship.specialization || 'mapping',
            efficiency: ship.efficiency || 1.0,
          } as ReconShip;

          if (baseShip.status === 'idle' || !baseShip.assignedSectorId) {
            return baseShip;
          }

          // Calculate progress based on efficiency and time
          const progress = Math.min(
            1,
            (Date.now() - (baseShip.lastUpdate || Date.now())) /
              (10000 / (baseShip.efficiency || 1))
          );

          // Update ship status based on progress
          if (progress >= 1) {
            baseShip.status = baseShip.status === 'scanning' ? 'assigned' : 'returning';
          }

          return baseShip;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update task completion handler
  useEffect(() => {
    const handleTaskCompleted = (event: BaseEvent) => {
      const { shipId, ship } = event.data as ShipEvent['data'];
      if (!shipId || !ship?.assignedSectorId) return;

      setShips((prevShips: ReconShip[]) =>
        prevShips.map(s =>
          s.id === shipId
            ? {
                ...s,
                status: 'returning' as ReconShip['status'],
                experience: (s.experience || 0) + 100,
                lastUpdate: Date.now(),
              }
            : s
        )
      );

      setSectors((prevSectors: Sector[]) =>
        prevSectors.map(sector =>
          sector.id === ship.assignedSectorId
            ? {
                ...sector,
                status: 'mapped' as SectorStatus,
                lastScanned: Date.now(),
              }
            : sector
        )
      );
    };

    const unsubscribe = reconManager.subscribeToEvent(
      EventType.EXPLORATION_TASK_COMPLETED,
      handleTaskCompleted
    );
    return () => {
      unsubscribe();
    };
  }, [reconManager]);

  // Update sector filtering with proper type checks
  const filterSectors = (
    sectors: Sector[],
    filter: FilterType,
    advancedFilters: AdvancedFilters
  ) => {
    return sectors.filter(sector => {
      // Basic filters
      if (filter === 'unmapped' && sector.status !== 'unmapped') {
        return false;
      }

      // Handle optional anomalies array safely
      const anomalies = sector.anomalies ?? [];
      if (filter === 'anomalies' && anomalies.length === 0) {
        return false;
      }

      // Advanced filters with safe property access
      if (advancedFilters) {
        const resourcePotential = sector.resourcePotential ?? 0;
        const habitabilityScore = sector.habitabilityScore ?? 0;

        if (resourcePotential < advancedFilters.minResourcePotential) {
          return false;
        }
        if (habitabilityScore < advancedFilters.minHabitabilityScore) {
          return false;
        }
        if (advancedFilters.hasAnomalies && anomalies.length === 0) {
          return false;
        }
        if (advancedFilters.anomalySeverity !== 'any') {
          const hasMatchingSeverity = anomalies.some(
            a => a.severity === advancedFilters.anomalySeverity
          );
          if (!hasMatchingSeverity) {
            return false;
          }
        }
      }

      return true;
    });
  };

  // Enhanced sector filtering
  const filteredSectors = useMemo(() => {
    return filterSectors(sectors, filter, advancedFilters);
  }, [sectors, filter, advancedFilters]);

  // Enhanced heat map calculation
  const getSectorHeat = useCallback((sector: Sector) => {
    let heatValue = 0;

    // Base heat from resource potential
    heatValue += sector.resourcePotential * 0.4;

    // Heat from habitability
    heatValue += sector.habitabilityScore * 0.3;

    // Heat from anomalies
    const anomalyHeat = sector.anomalies.reduce((sum, anomaly) => {
      const severityValue =
        anomaly.severity === 'high' ? 0.3 : anomaly.severity === 'medium' ? 0.2 : 0.1;
      return sum + severityValue;
    }, 0);
    heatValue += anomalyHeat;

    // Reduce heat for older scans
    if (sector.lastScanned) {
      const hoursSinceLastScan = (Date.now() - sector.lastScanned) / (1000 * 60 * 60);
      const ageFactor = Math.max(0, 1 - hoursSinceLastScan / 168); // 168 hours = 1 week
      heatValue *= ageFactor;
    }

    return Math.min(1, heatValue);
  }, []);

  // Memoize handlers
  const handleSectorSelect = useCallback((sector: Sector) => {
    setSelectedSector(sector);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
    const startX = e.clientX;
    const startY = e.clientY;
    setPosition({ x: startX, y: startY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Implementation for map panning
      if (position && isDragging.current) {
        const dx = e.clientX - position.x;
        const dy = e.clientY - position.y;
        setPosition({ x: e.clientX, y: e.clientY });
        // Update map position based on dx and dy
        setMapOffset((prev: MapOffset) => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));
      }
    },
    [position]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    setPosition(null);
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  }, []);

  // Enhanced sector hover tooltip
  const handleSectorHover = useCallback(
    (show: boolean, sector: Sector) => {
      if (show) {
        showTooltip(
          <div className="max-w-xs rounded-lg border border-gray-700 bg-gray-800/95 p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-medium text-white">{sector.name}</div>
              <div
                className={`rounded px-2 py-0.5 text-xs ${
                  sector.status === 'unmapped'
                    ? 'bg-gray-700 text-gray-400'
                    : sector.status === 'scanning'
                      ? 'bg-teal-900/50 text-teal-400'
                      : 'bg-teal-800/30 text-teal-300'
                }`}
              >
                {sector.status.charAt(0).toUpperCase() + sector.status.slice(1)}
              </div>
            </div>

            {sector.status !== 'unmapped' && (
              <>
                {/* Resource and Habitability Bars */}
                <div className="mb-3 space-y-2">
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-gray-400">Resources</span>
                      <span className="text-teal-400">
                        {Math.round(sector.resourcePotential * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
                      <div
                        className="h-full rounded-full bg-teal-500"
                        style={{ width: `${sector.resourcePotential * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-gray-400">Habitability</span>
                      <span className="text-teal-400">
                        {Math.round(sector.habitabilityScore * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
                      <div
                        className="h-full rounded-full bg-teal-500"
                        style={{ width: `${sector.habitabilityScore * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Anomalies */}
                {sector.anomalies.length > 0 && (
                  <div className="mb-3">
                    <div className="mb-2 text-xs font-medium text-gray-300">Detected Anomalies</div>
                    <div className="space-y-1">
                      {sector.anomalies.map(anomaly => (
                        <div
                          key={anomaly.id}
                          className={`rounded px-2 py-1 text-xs ${
                            anomaly.severity === 'high'
                              ? 'bg-red-900/50 text-red-400'
                              : anomaly.severity === 'medium'
                                ? 'bg-yellow-900/50 text-yellow-400'
                                : 'bg-blue-900/50 text-blue-400'
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
    },
    [showTooltip, hideTooltip]
  );

  // Handle ship assignment
  const handleShipAssign = useCallback(
    (shipId: string, sectorId: string) => {
      const sector = sectors.find(s => s.id === sectorId);
      if (!sector) return;

      reconManager.assignExplorationTask(shipId, sectorId, sector.position, 'mapping');

      setShips(prevShips =>
        prevShips.map(ship =>
          ship.id === shipId
            ? {
                ...ship,
                status: 'assigned',
                assignedSectorId: sectorId,
                lastUpdate: Date.now(),
              }
            : ship
        )
      );
    },
    [sectors, reconManager]
  );

  // Register ships with ReconShipManager
  useEffect(() => {
    ships.forEach(ship => {
      reconManager.registerShip(ship);
    });
  }, [ships, reconManager]);

  return (
    <div className="fixed inset-4 flex overflow-hidden rounded-lg border border-gray-700 bg-gray-900/95 shadow-2xl backdrop-blur-md">
      {/* Left Panel - Exploration Map */}
      <div className="flex w-2/3 flex-col border-r border-gray-700 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Radar className="h-6 w-6 text-teal-400" />
            <h2 className="text-xl font-bold text-white">Exploration Hub</h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search sectors..."
                className="w-64 rounded-lg border border-gray-700 bg-gray-800/90 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleZoom(0.1)}
                className="rounded-lg bg-gray-800/90 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/90"
              >
                <ZoomIn className="h-5 w-5 text-teal-400" />
              </button>
              <button
                onClick={() => handleZoom(-0.1)}
                className="rounded-lg bg-gray-800/90 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/90"
              >
                <ZoomOut className="h-5 w-5 text-teal-400" />
              </button>
            </div>

            <button
              onClick={() => setShowMissionLog(true)}
              className="rounded-lg bg-gray-800/90 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/90"
            >
              <History className="h-5 w-5 text-teal-400" />
            </button>
          </div>
        </div>

        {/* Enhanced Filter Controls */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${
                  filter === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Map className="h-4 w-4" />
                <span>All Sectors</span>
              </button>
              <button
                onClick={() => setFilter('unmapped')}
                className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${
                  filter === 'unmapped'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Radar className="h-4 w-4" />
                <span>Unmapped</span>
              </button>
              <button
                onClick={() => setFilter('anomalies')}
                className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${
                  filter === 'anomalies'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Anomalies</span>
              </button>
              <button
                onClick={() => setShowHeatMap(!showHeatMap)}
                className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${
                  showHeatMap
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Map className="h-4 w-4" />
                <span>Heat Map</span>
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${
                Object.values(advancedFilters).some(v =>
                  Array.isArray(v) ? v.length > 0 : v !== 0 && v !== false && v !== 'any'
                )
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Advanced Filters</span>
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 rounded-lg bg-gray-800/50 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Min Resource Potential</label>
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
                  <div className="mt-1 text-sm text-teal-400">
                    {Math.round(advancedFilters.minResourcePotential * 100)}%
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Min Habitability Score</label>
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
                  <div className="mt-1 text-sm text-teal-400">
                    {Math.round(advancedFilters.minHabitabilityScore * 100)}%
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Anomaly Settings</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={advancedFilters.hasAnomalies}
                        onChange={e =>
                          setAdvancedFilters(prev => ({
                            ...prev,
                            hasAnomalies: e.target.checked,
                          }))
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-300">Has Anomalies</span>
                    </label>
                    <select
                      value={advancedFilters.anomalySeverity}
                      onChange={e =>
                        setAdvancedFilters(prev => ({
                          ...prev,
                          anomalySeverity: e.target.value as 'any' | 'low' | 'medium' | 'high',
                        }))
                      }
                      className="w-full rounded bg-gray-700 px-2 py-1 text-sm text-white"
                    >
                      <option value="any">Any Severity</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Last Scanned Within</label>
                  <select
                    value={advancedFilters.lastScannedWithin}
                    onChange={e =>
                      setAdvancedFilters(prev => ({
                        ...prev,
                        lastScannedWithin: parseInt(e.target.value),
                      }))
                    }
                    className="w-full rounded bg-gray-700 px-2 py-1 text-sm text-white"
                  >
                    <option value={0}>Any Time</option>
                    <option value={24}>24 Hours</option>
                    <option value={72}>3 Days</option>
                    <option value={168}>1 Week</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm text-gray-400">Resource Types</label>
                <div className="flex flex-wrap gap-2">
                  {['Dark Matter', 'Helium-3', 'Rare Metals', 'Common Ores'].map(type => (
                    <button
                      key={type}
                      onClick={() =>
                        setAdvancedFilters(prev => ({
                          ...prev,
                          resourceTypes: prev.resourceTypes.includes(type)
                            ? prev.resourceTypes.filter(t => t !== type)
                            : [...prev.resourceTypes, type],
                        }))
                      }
                      className={`rounded px-2 py-1 text-sm ${
                        advancedFilters.resourceTypes.includes(type)
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Content */}
        <div
          className="relative flex-1 overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${zoom})`,
              transformOrigin: 'center',
              transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
            }}
          >
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
                onShipAssign={handleShipAssign}
              />
            ))}

            {/* Ship Markers */}
            {activeShips.map(ship => {
              const targetSector = sectors.find(s => s.id === ship.targetSector);
              if (!targetSector) {
                return null;
              }
              return <ShipMarker key={ship.id} ship={ship} targetSector={targetSector} />;
            })}

            {/* Resource Transfers */}
            <ResourceTransfer transfers={transfers} />
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-1/3 flex-col p-6">
        {selectedSector ? (
          <>
            <ExplorationControls
              sector={{
                ...selectedSector,
                status: (selectedSector.status === 'unmapped'
                  ? 'unmapped'
                  : selectedSector.status === 'scanning'
                    ? 'scanning'
                    : 'mapped') as SectorStatus,
              }}
              onClose={() => setSelectedSector(null)}
            />
            <div className="mt-6">
              <ReconShipStatus
                ships={activeShips.map(ship => {
                  let displayStatus: ReconShipStatusType;
                  if (ship.status === 'assigned' || ship.status === 'scanning') {
                    displayStatus = 'scanning';
                  } else if (ship.status === 'returning') {
                    displayStatus = 'returning';
                  } else {
                    displayStatus = 'idle';
                  }

                  return {
                    id: ship.id,
                    name: ship.name,
                    status: displayStatus,
                    targetSector: ship.targetSector,
                    experience: ship.experience,
                    specialization: ship.specialization,
                    efficiency: ship.efficiency,
                  };
                })}
              />
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            Select a sector to view details
          </div>
        )}
      </div>

      {/* Modals */}
      {showMissionLog && <MissionLog onClose={() => setShowMissionLog(false)} />}
      {showTutorial && <ExplorationTutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}
