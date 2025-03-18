import { ResourceType } from "./../../types/resources/ResourceTypes";
import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Cpu, Database, Radar, Settings, Zap } from 'lucide-react';
import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import {
  automationManager,
  AutomationRule,
  EmitEventValue,
} from '../../managers/game/AutomationManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';

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

interface AutomatedSectorScannerProps {
  sectors: Sector[];
  ships: ReconShip[];
  onSectorScan: (sectorId: string, shipId: string) => void;
  onScanComplete: (sectorId: string) => void;
  onAnomalyDetected: (sectorId: string, anomaly: Anomaly) => void;
  className?: string;
  automationEnabled?: boolean;
  scanInterval?: number;
  priorityThreshold?: number;
  energyPerScan?: number;
  currentEnergy?: number;
}

interface ScanPriority {
  sectorId: string;
  priority: number;
  reason: string;
}

export function AutomatedSectorScanner({
  sectors,
  ships,
  onSectorScan,
  onScanComplete,
  onAnomalyDetected,
  className = '',
  automationEnabled = true,
  scanInterval = 30000, // 30 seconds default
  priorityThreshold = 0.5, // Priority threshold (0-1)
  energyPerScan = 50,
  currentEnergy = 1000,
}: AutomatedSectorScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanQueue, setScanQueue] = useState<ScanPriority[]>([]);
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [automationSettings, setAutomationSettings] = useState({
    enabled: automationEnabled,
    prioritizeUnmapped: true,
    prioritizeResourceRich: true,
    prioritizeAnomalies: true,
    scanInterval,
    energyThreshold: energyPerScan * 2, // Minimum energy to maintain
  });
  const [showSettings, setShowSettings] = useState(false);
  const [scanStats, setScanStats] = useState({
    totalScans: 0,
    sectorsAnalyzed: 0,
    anomaliesFound: 0,
    resourcesDiscovered: 0,
  });

  // Calculate available ships for scanning
  const availableShips = useMemo(() => {
    return ships.filter(ship => ship.status === 'idle');
  }, [ships]);

  // Calculate sectors that need scanning
  const sectorsNeedingScans = useMemo(() => {
    return sectors.filter(sector => {
      // Never scanned or unmapped
      if (sector.status === 'unmapped') {
        return true;
      }

      // If already scanning, skip
      if (sector.status === 'scanning') {
        return false;
      }

      // If no last scan time, it needs a scan
      if (!sector.lastScanned) {
        return true;
      }

      // Check if it's been more than 24 hours since last scan
      const hoursSinceLastScan = (Date.now() - sector.lastScanned) / (1000 * 60 * 60);
      return hoursSinceLastScan > 24;
    });
  }, [sectors]);

  // Calculate scan priorities
  const calculateScanPriorities = useCallback(() => {
    const priorities: ScanPriority[] = [];

    sectorsNeedingScans.forEach(sector => {
      let priority = 0;
      let reason = '';

      // Base priority for unmapped sectors
      if (sector.status === 'unmapped') {
        priority += automationSettings.prioritizeUnmapped ? 0.5 : 0.2;
        reason = 'Unmapped sector';
      }

      // Priority based on resource potential
      if (automationSettings.prioritizeResourceRich && sector.resourcePotential > 0.6) {
        priority += 0.3;
        reason = reason ? `${reason}, high resource potential` : 'High resource potential';
      }

      // Priority based on habitability
      if (sector.habitabilityScore > 0.7) {
        priority += 0.2;
        reason = reason ? `${reason}, high habitability` : 'High habitability';
      }

      // Priority based on anomalies
      if (automationSettings.prioritizeAnomalies && sector.anomalies.length > 0) {
        priority += 0.4;
        reason = reason ? `${reason}, anomalies detected` : 'Anomalies detected';
      }

      // Age factor - older scans get higher priority
      if (sector.lastScanned) {
        const daysSinceLastScan = (Date.now() - sector.lastScanned) / (1000 * 60 * 60 * 24);
        const agePriority = Math.min(0.5, daysSinceLastScan / 7); // Max 0.5 after a week
        priority += agePriority;
        reason = reason ? `${reason}, scan data aging` : 'Scan data aging';
      }

      priorities.push({
        sectorId: sector.id,
        priority,
        reason,
      });
    });

    // Sort by priority (highest first)
    return priorities.sort((a, b) => b.priority - a.priority);
  }, [sectorsNeedingScans, automationSettings]);

  // Update scan queue
  useEffect(() => {
    if (automationSettings.enabled) {
      const priorities = calculateScanPriorities();
      setScanQueue(priorities);
    }
  }, [sectors, automationSettings, calculateScanPriorities]);

  // Automated scanning logic
  useEffect(() => {
    if (!automationSettings.enabled || scanQueue.length === 0 || availableShips.length === 0) {
      return;
    }

    // Check if we have enough energy
    if (currentEnergy < automationSettings.energyThreshold) {
      return;
    }

    // Check if it's time for a new scan
    const now = Date.now();
    if (lastScanTime && now - lastScanTime < automationSettings.scanInterval) {
      const progress = (now - lastScanTime) / automationSettings.scanInterval;
      setScanProgress(progress);
      return;
    }

    // Get highest priority sector that meets threshold
    const nextScan = scanQueue.find(scan => scan.priority >= priorityThreshold);
    if (!nextScan) {
      return;
    }

    // Find best ship for the job
    const bestShip = availableShips.reduce((best, current) => {
      return current.efficiency > best.efficiency ? current : best;
    }, availableShips[0]);

    // Start scan
    setIsScanning(true);
    setLastScanTime(now);
    setScanProgress(0);

    // Emit scan started event
    moduleEventBus.emit({
      type: 'AUTOMATION_STARTED' as ModuleEventType,
      moduleId: 'exploration-hub',
      moduleType: 'exploration' as ModuleType,
      timestamp: now,
      data: {
        sectorId: nextScan.sectorId,
        shipId: bestShip.id,
        priority: nextScan.priority,
        reason: nextScan.reason,
        operation: 'sector-scan',
      },
    });

    // Call the scan function
    onSectorScan(nextScan.sectorId, bestShip.id);

    // Update stats
    setScanStats(prev => ({
      ...prev,
      totalScans: prev.totalScans + 1,
    }));

    // Simulate scan completion after interval
    const scanTimer = setTimeout(() => {
      setIsScanning(false);

      // Get the sector that was scanned
      const scannedSector = sectors.find(s => s.id === nextScan.sectorId);

      if (scannedSector) {
        // Update stats based on what was found
        setScanStats(prev => ({
          ...prev,
          sectorsAnalyzed: prev.sectorsAnalyzed + 1,
          anomaliesFound: prev.anomaliesFound + (scannedSector.anomalies?.length ?? 0),
          resourcesDiscovered: prev.resourcesDiscovered + (scannedSector.resources?.length ?? 0),
        }));

        // Notify of any anomalies
        scannedSector.anomalies?.forEach(anomaly => {
          onAnomalyDetected(scannedSector.id, anomaly);
        });
      }

      // Complete the scan
      onScanComplete(nextScan.sectorId);

      // Emit scan completed event
      moduleEventBus.emit({
        type: 'MISSION_COMPLETED' as ModuleEventType,
        moduleId: 'exploration-hub',
        moduleType: 'exploration' as ModuleType,
        timestamp: Date.now(),
        data: {
          sectorId: nextScan.sectorId,
          shipId: bestShip.id,
          findings: {
            anomalies: scannedSector?.anomalies?.length ?? 0,
            resources: scannedSector?.resources?.length ?? 0,
            habitabilityScore: scannedSector?.habitabilityScore ?? 0,
          },
          operation: 'sector-scan',
        },
      });
    }, automationSettings.scanInterval);

    return () => {
      clearTimeout(scanTimer);
    };
  }, [
    automationSettings,
    scanQueue,
    availableShips,
    lastScanTime,
    currentEnergy,
    priorityThreshold,
    onSectorScan,
    onScanComplete,
    onAnomalyDetected,
    sectors,
  ]);

  // Register with automation manager
  useEffect(() => {
    // Register automation rule for sector scanning
    const scanRule: AutomationRule = {
      id: 'automated-sector-scanning',
      moduleId: 'exploration-hub',
      name: 'Automated Sector Scanning',
      enabled: automationSettings.enabled,
      conditions: [
        {
          type: 'MODULE_ACTIVE' as const,
          target: 'exploration-hub',
        },
        {
          type: 'RESOURCE_ABOVE' as const,
          target: ResourceType.ENERGY,
          value: {
            amount: energyPerScan,
          },
        },
      ],
      actions: [
        {
          type: 'EMIT_EVENT' as const,
          target: 'SCAN_SECTOR',
          value: {
            moduleId: 'exploration-hub',
            moduleType: 'exploration' as ModuleType,
            eventType: 'MISSION_STARTED' as ModuleEventType,
            data: {
              type: 'scanning',
              priority: 2,
            },
          } as EmitEventValue,
        },
      ],
      interval: automationSettings.scanInterval,
    };

    automationManager.registerRule(scanRule);

    return () => {
      automationManager.removeRule(scanRule.id);
    };
  }, [automationSettings.enabled, automationSettings.scanInterval, energyPerScan]);

  // Toggle automation settings
  const toggleAutomation = useCallback(() => {
    setAutomationSettings(prev => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  }, []);

  // Update automation settings
  const updateSettings = useCallback((key: string, value: unknown) => {
    setAutomationSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  return (
    <div className={`rounded-lg bg-gray-900/80 p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Radar
            className={`mr-2 h-5 w-5 ${isScanning ? 'animate-pulse text-teal-400' : 'text-gray-400'}`}
          />
          <h3 className="text-lg font-medium text-white">Automated Sector Scanner</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleAutomation}
            className={`rounded px-3 py-1 text-xs font-medium ${
              automationSettings.enabled ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            {automationSettings.enabled ? 'Enabled' : 'Disabled'}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="rounded p-1 text-gray-300 hover:bg-gray-700"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Status indicators */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        <div className="flex flex-col items-center rounded bg-gray-800/60 p-2">
          <Cpu className="mb-1 h-4 w-4 text-blue-400" />
          <div className="text-xs text-gray-300">Scans</div>
          <div className="text-lg font-medium text-white">{scanStats.totalScans}</div>
        </div>
        <div className="flex flex-col items-center rounded bg-gray-800/60 p-2">
          <Database className="mb-1 h-4 w-4 text-green-400" />
          <div className="text-xs text-gray-300">Analyzed</div>
          <div className="text-lg font-medium text-white">{scanStats.sectorsAnalyzed}</div>
        </div>
        <div className="flex flex-col items-center rounded bg-gray-800/60 p-2">
          <AlertTriangle className="mb-1 h-4 w-4 text-yellow-400" />
          <div className="text-xs text-gray-300">Anomalies</div>
          <div className="text-lg font-medium text-white">{scanStats.anomaliesFound}</div>
        </div>
        <div className="flex flex-col items-center rounded bg-gray-800/60 p-2">
          <Zap className="mb-1 h-4 w-4 text-purple-400" />
          <div className="text-xs text-gray-300">Resources</div>
          <div className="text-lg font-medium text-white">{scanStats.resourcesDiscovered}</div>
        </div>
      </div>

      {/* Scan progress */}
      {isScanning && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-gray-400">
            <span>Scanning in progress...</span>
            <span>{Math.round(scanProgress * 100)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-800">
            <div
              className="h-2 rounded-full bg-teal-500 transition-all duration-200"
              style={{ width: `${scanProgress * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Scan queue */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300">Scan Queue</h4>
          <span className="text-xs text-gray-400">{scanQueue.length} sectors</span>
        </div>
        <div className="max-h-32 space-y-2 overflow-y-auto">
          {scanQueue.slice(0, 5).map(item => {
            const sector = sectors.find(s => s.id === item?.sectorId);
            return (
              <div key={item?.sectorId} className="rounded bg-gray-800/40 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{sector?.name || item?.sectorId}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 ${
                      item?.priority > 0.7
                        ? 'bg-red-900/60 text-red-300'
                        : item?.priority > 0.4
                          ? 'bg-yellow-900/60 text-yellow-300'
                          : 'bg-blue-900/60 text-blue-300'
                    }`}
                  >
                    {Math.round(item?.priority * 100)}%
                  </span>
                </div>
                <div className="mt-1 text-gray-400">{item?.reason}</div>
              </div>
            );
          })}
          {scanQueue.length === 0 && (
            <div className="py-2 text-center text-xs text-gray-500">No sectors in queue</div>
          )}
        </div>
      </div>

      {/* Available ships */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300">Available Ships</h4>
          <span className="text-xs text-gray-400">
            {availableShips.length} / {ships.length}
          </span>
        </div>
        <div className="max-h-24 space-y-1 overflow-y-auto">
          {availableShips.map(ship => (
            <div
              key={ship.id}
              className="flex items-center justify-between rounded bg-gray-800/40 p-1.5 text-xs"
            >
              <span className="text-white">{ship.name}</span>
              <span className="text-gray-400">
                Efficiency: {Math.round(ship.efficiency * 100)}%
              </span>
            </div>
          ))}
          {availableShips.length === 0 && (
            <div className="py-2 text-center text-xs text-gray-500">No ships available</div>
          )}
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mb-4 rounded bg-gray-800/60 p-3">
          <h4 className="mb-3 text-sm font-medium text-white">Scanner Settings</h4>

          <div className="space-y-3">
            <div>
              <label className="mb-1 flex items-center justify-between text-xs text-gray-300">
                <span>Scan Interval (seconds)</span>
                <span>{automationSettings.scanInterval / 1000}</span>
              </label>
              <input
                type="range"
                min="10000"
                max="120000"
                step="10000"
                value={automationSettings.scanInterval}
                onChange={e => updateSettings('scanInterval', parseInt(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center justify-between text-xs text-gray-300">
                <span>Energy Threshold</span>
                <span>{automationSettings.energyThreshold}</span>
              </label>
              <input
                type="range"
                min="50"
                max="500"
                step="50"
                value={automationSettings.energyThreshold}
                onChange={e => updateSettings('energyThreshold', parseInt(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="flex items-center text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={automationSettings.prioritizeUnmapped}
                  onChange={() =>
                    updateSettings('prioritizeUnmapped', !automationSettings.prioritizeUnmapped)
                  }
                  className="mr-2 h-3 w-3"
                />
                Prioritize unmapped sectors
              </label>

              <label className="flex items-center text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={automationSettings.prioritizeResourceRich}
                  onChange={() =>
                    updateSettings(
                      'prioritizeResourceRich',
                      !automationSettings.prioritizeResourceRich
                    )
                  }
                  className="mr-2 h-3 w-3"
                />
                Prioritize resource-rich sectors
              </label>

              <label className="flex items-center text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={automationSettings.prioritizeAnomalies}
                  onChange={() =>
                    updateSettings('prioritizeAnomalies', !automationSettings.prioritizeAnomalies)
                  }
                  className="mr-2 h-3 w-3"
                />
                Prioritize sectors with anomalies
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Energy status */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Energy per scan: {energyPerScan}</span>
        <span>Current energy: {currentEnergy}</span>
      </div>
    </div>
  );
}
