import { ResourceType } from "./../../types/resources/ResourceTypes";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useTooltip } from '../../hooks/ui/useTooltip';
import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';

// Define ModuleEvent interface
interface ModuleEvent {
  type: ModuleEventType;
  data?: Record<string, unknown>;
  moduleId?: string;
}

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

type ShipStatus = 'idle' | 'scanning' | 'investigating' | 'returning';

interface ReconShip {
  id: string;
  name: string;
  status: ShipStatus;
  targetSector?: string;
  experience: number;
  specialization: 'mapping' | 'anomaly' | 'resource';
  efficiency: number;
  lastUpdate?: number;
}

interface ResourceTransfer {
  id: string;
  sourceId: string;
  targetId: string;
  resourceType: ResourceType;
  amount: number;
  progress: number;
  startTime: number;
  estimatedEndTime: number;
}

interface RealTimeMapUpdatesProps {
  sectors: Sector[];
  ships: ReconShip[];
  transfers: ResourceTransfer[];
  onSectorsUpdate: (sectors: Sector[]) => void;
  onShipsUpdate: (ships: ReconShip[]) => void;
  onTransfersUpdate: (transfers: ResourceTransfer[]) => void;
  updateInterval?: number;
  autoRefresh?: boolean;
  quality?: 'low' | 'medium' | 'high';
  className?: string;
}

export function RealTimeMapUpdates({
  sectors,
  ships,
  transfers,
  onSectorsUpdate,
  onShipsUpdate,
  onTransfersUpdate,
  updateInterval = 1000,
  autoRefresh = true,
  quality = 'medium',
  className = '',
}: RealTimeMapUpdatesProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [updateStats, setUpdateStats] = useState({
    sectorsUpdated: 0,
    shipsUpdated: 0,
    transfersUpdated: 0,
  });

  const updateIntervals = useRef<{
    main: NodeJS.Timeout | null;
    reconnect: NodeJS.Timeout | null;
  }>({
    main: null,
    reconnect: null,
  });

  const { showTooltip, hideTooltip } = useTooltip();

  // Handle sector scan events
  useEffect(() => {
    const handleSectorScan = (event: ModuleEvent) => {
      if (!event.data || !event.data.sectorId) return;

      const sectorId = event.data.sectorId as string;
      const shipId = event.data.shipId as string;

      onSectorsUpdate(
        sectors.map(sector => {
          if (sector.id === sectorId) {
            return {
              ...sector,
              status: 'scanning',
              lastScanned: Date.now(),
            };
          }
          return sector;
        })
      );

      onShipsUpdate(
        ships.map(ship => {
          if (ship.id === shipId) {
            return {
              ...ship,
              status: 'scanning',
              targetSector: sectorId,
              lastUpdate: Date.now(),
            };
          }
          return ship;
        })
      );

      setUpdateStats(prev => ({
        ...prev,
        sectorsUpdated: prev.sectorsUpdated + 1,
        shipsUpdated: prev.shipsUpdated + 1,
      }));
    };

    const handleScanComplete = (event: ModuleEvent) => {
      if (!event.data || !event.data.sectorId) return;

      const sectorId = event.data.sectorId as string;

      onSectorsUpdate(
        sectors.map(sector => {
          if (sector.id === sectorId) {
            return {
              ...sector,
              status: 'mapped',
              lastScanned: Date.now(),
            };
          }
          return sector;
        })
      );

      // Update ships that were scanning this sector
      onShipsUpdate(
        ships.map(ship => {
          if (ship.targetSector === sectorId && ship.status === 'scanning') {
            return {
              ...ship,
              status: 'returning',
              lastUpdate: Date.now(),
            };
          }
          return ship;
        })
      );

      setUpdateStats(prev => ({
        ...prev,
        sectorsUpdated: prev.sectorsUpdated + 1,
        shipsUpdated: prev.shipsUpdated + 1,
      }));
    };

    const handleAnomalyDetected = (event: ModuleEvent) => {
      if (!event.data || !event.data.sectorId || !event.data.anomaly) return;

      const sectorId = event.data.sectorId as string;
      const anomaly = event.data.anomaly as Anomaly;

      onSectorsUpdate(
        sectors.map(sector => {
          if (sector.id === sectorId) {
            return {
              ...sector,
              anomalies: [...sector.anomalies, anomaly],
              lastScanned: Date.now(),
            };
          }
          return sector;
        })
      );

      setUpdateStats(prev => ({
        ...prev,
        sectorsUpdated: prev.sectorsUpdated + 1,
      }));
    };

    const handleResourceDiscovered = (event: ModuleEvent) => {
      if (!event.data || !event.data.sectorId || !event.data.resource) return;

      const sectorId = event.data.sectorId as string;
      const resource = event.data.resource as { type: string; amount: number };

      onSectorsUpdate(
        sectors.map(sector => {
          if (sector.id === sectorId) {
            const existingResources = sector.resources || [];
            const existingResourceIndex = existingResources.findIndex(
              r => r.type === resource.type
            );

            let updatedResources;
            if (existingResourceIndex >= 0) {
              // Update existing resource
              updatedResources = existingResources.map((r, i) =>
                i === existingResourceIndex ? { ...r, amount: r.amount + resource.amount } : r
              );
            } else {
              // Add new resource
              updatedResources = [...existingResources, resource];
            }

            return {
              ...sector,
              resources: updatedResources,
              lastScanned: Date.now(),
            };
          }
          return sector;
        })
      );

      setUpdateStats(prev => ({
        ...prev,
        sectorsUpdated: prev.sectorsUpdated + 1,
      }));
    };

    // Subscribe to events using string literals directly
    const unsubscribeSectorScan = moduleEventBus.subscribe(
      'SECTOR_SCAN_STARTED' as ModuleEventType,
      handleSectorScan
    );

    const unsubscribeScanComplete = moduleEventBus.subscribe(
      'SECTOR_SCAN_COMPLETED' as ModuleEventType,
      handleScanComplete
    );

    const unsubscribeAnomalyDetected = moduleEventBus.subscribe(
      'ANOMALY_DETECTED' as ModuleEventType,
      handleAnomalyDetected
    );

    const unsubscribeResourceDiscovered = moduleEventBus.subscribe(
      'RESOURCE_DISCOVERED' as ModuleEventType,
      handleResourceDiscovered
    );

    return () => {
      // Unsubscribe from events
      unsubscribeSectorScan();
      unsubscribeScanComplete();
      unsubscribeAnomalyDetected();
      unsubscribeResourceDiscovered();
    };
  }, [sectors, ships, onSectorsUpdate, onShipsUpdate]);

  // Set up real-time updates
  useEffect(() => {
    if (!autoRefresh) {
      // Clear any existing intervals
      if (updateIntervals.current.main) {
        clearInterval(updateIntervals.current.main);
        updateIntervals.current.main = null;
      }
      return;
    }

    // (...args: unknown[]) => unknown to update ship positions and status
    const updateShips = () => {
      let updatedCount = 0;

      onShipsUpdate(
        ships.map(ship => {
          if (ship.status === 'idle' || !ship.targetSector) return ship;

          const targetSector = sectors.find(s => s.id === ship.targetSector);
          if (!targetSector) return ship;

          // Calculate progress based on efficiency and time
          const lastUpdateTime = ship.lastUpdate || Date.now();
          const elapsedTime = Date.now() - lastUpdateTime;
          const progressFactor = ship.efficiency * (elapsedTime / 10000);

          // Determine if ship status should change
          let newStatus: ShipStatus = ship.status;
          if (progressFactor >= 1) {
            if (ship.status === 'scanning') {
              newStatus = 'investigating';
            } else if (ship.status === 'investigating') {
              newStatus = 'returning';
            } else if (ship.status === 'returning') {
              // Ship has returned, set to idle
              newStatus = 'idle';
            }

            updatedCount++;
          }

          return {
            ...ship,
            status: newStatus,
            lastUpdate: Date.now(),
          };
        })
      );

      return updatedCount;
    };

    // (...args: unknown[]) => unknown to update resource transfers
    const updateTransfers = () => {
      let updatedCount = 0;

      onTransfersUpdate(
        transfers.map(transfer => {
          if (transfer.progress >= 1) return transfer;

          // Calculate progress based on elapsed time
          const elapsedTime = Date.now() - transfer.startTime;
          const totalTime = transfer.estimatedEndTime - transfer.startTime;
          const newProgress = Math.min(1, elapsedTime / totalTime);

          if (newProgress > transfer.progress) {
            updatedCount++;
          }

          return {
            ...transfer,
            progress: newProgress,
          };
        })
      );

      return updatedCount;
    };

    // Main update function
    const performUpdate = () => {
      try {
        setIsUpdating(true);

        // Update ships
        const shipsUpdated = updateShips();

        // Update transfers
        const transfersUpdated = updateTransfers();

        // Update stats
        setUpdateStats(prev => ({
          ...prev,
          shipsUpdated: prev.shipsUpdated + shipsUpdated,
          transfersUpdated: prev.transfersUpdated + transfersUpdated,
        }));

        setUpdateCount(prev => prev + 1);
        setLastUpdateTime(Date.now());
        setIsConnected(true);
      } catch (error) {
        console.error('Error updating map data:', error);
        setErrorCount(prev => prev + 1);

        // If we have too many consecutive errors, mark as disconnected
        if (errorCount > 3) {
          setIsConnected(false);
        }
      } finally {
        setIsUpdating(false);
      }
    };

    // Set up the main update interval
    updateIntervals.current.main = setInterval(performUpdate, updateInterval);

    // Set up reconnection attempt if disconnected
    if (!isConnected && !updateIntervals.current.reconnect) {
      updateIntervals.current.reconnect = setInterval(() => {
        setIsConnected(true);
        setErrorCount(0);

        // Clear reconnect interval once connected
        if (updateIntervals.current.reconnect) {
          clearInterval(updateIntervals.current.reconnect);
          updateIntervals.current.reconnect = null;
        }
      }, 5000); // Try to reconnect every 5 seconds
    }

    // Cleanup function
    return () => {
      if (updateIntervals.current.main) {
        clearInterval(updateIntervals.current.main);
        updateIntervals.current.main = null;
      }

      if (updateIntervals.current.reconnect) {
        clearInterval(updateIntervals.current.reconnect);
        updateIntervals.current.reconnect = null;
      }
    };
  }, [
    autoRefresh,
    updateInterval,
    sectors,
    ships,
    transfers,
    isConnected,
    errorCount,
    onShipsUpdate,
    onSectorsUpdate,
    onTransfersUpdate,
  ]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    setIsUpdating(true);

    // Simulate a delay for the refresh
    setTimeout(() => {
      // Update last update time
      setLastUpdateTime(Date.now());
      setUpdateCount(prev => prev + 1);
      setIsUpdating(false);
    }, 500);
  }, []);

  // Render the component
  return (
    <div className={`real-time-map-updates ${className}`}>
      <div className="flex items-center space-x-2 rounded-md bg-gray-800 p-2 text-sm">
        <div className="flex items-center">
          {isConnected ? (
            <Wifi
              className="mr-1 h-4 w-4 text-green-400"
              onMouseEnter={() => {
                showTooltip('Connected to real-time updates');
              }}
              onMouseLeave={hideTooltip}
            />
          ) : (
            <WifiOff
              className="mr-1 h-4 w-4 text-red-400"
              onMouseEnter={() => {
                showTooltip('Disconnected from real-time updates');
              }}
              onMouseLeave={hideTooltip}
            />
          )}
          <span className="text-xs">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>

        <div className="flex items-center">
          {isUpdating ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin text-blue-400" />
          ) : (
            <button
              onClick={handleManualRefresh}
              className="flex items-center text-xs text-gray-300 hover:text-white"
              disabled={isUpdating}
              onMouseEnter={() => {
                showTooltip('Manually refresh map data');
              }}
              onMouseLeave={hideTooltip}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              Refresh
            </button>
          )}
        </div>

        {lastUpdateTime && (
          <div className="text-xs text-gray-400">
            Last updated: {new Date(lastUpdateTime).toLocaleTimeString()}
          </div>
        )}

        {quality === 'high' && (
          <div className="ml-auto text-xs text-gray-400">
            Updates: {updateCount} | Sectors: {updateStats.sectorsUpdated} | Ships:{' '}
            {updateStats.shipsUpdated} | Transfers: {updateStats.transfersUpdated}
          </div>
        )}
      </div>
    </div>
  );
}
