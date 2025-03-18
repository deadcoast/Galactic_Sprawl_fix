import { ChevronUp, Plus, Radar, Users, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { moduleEventBus } from '../../lib/events/ModuleEventBus';
import { Position } from '../../types/core/GameTypes';
import { EventType } from '../../types/events/EventTypes';
import { StandardizedEvent } from '../../types/events/StandardizedEvents';
import { ExplorationStatus, Sector } from '../../types/exploration/unified/ExplorationTypes';
import { cn } from '../../utils/cn';

// Define interfaces based on ReconShipManagerImpl
interface ReconShip {
  id: string;
  name: string;
  type: 'AC27G' | 'PathFinder' | 'VoidSeeker' | 'recon' | 'mining' | 'war';
  status: 'idle' | 'scanning' | 'investigating' | 'returning';
  targetSector?: string;
  experience: number;
  specialization: 'mapping' | 'anomaly' | 'resource';
  efficiency: number;
  position: Position;
  formationId?: string;
  formationRole?: 'leader' | 'support' | 'scout';
  coordinationBonus?: number;
  capabilities: {
    scanning: number;
    stealth: number;
    combat: number;
    stealthActive?: boolean;
    speed: number;
    range: number;
  };
  currentTask?: {
    type: string;
    target: string;
    progress: number;
  };
  stealthActive?: boolean;
}

interface Formation {
  id: string;
  name: string;
  type: string;
  shipIds: string[];
  leaderId: string;
  position: Position;
  status: 'idle' | 'scanning' | 'moving' | 'combat';
  effectiveness?: number;
}

interface ReconShipCoordinationProps {
  ships: ReconShip[];
  sectors: Sector[];
  formations?: Formation[];
  onCreateFormation: (name: string, type: string, shipIds: string[], leaderId: string) => void;
  onDisbandFormation: (formationId: string) => void;
  _onAddShipToFormation: (shipId: string, formationId: string) => void;
  _onRemoveShipFromFormation: (shipId: string, formationId: string) => void;
  onStartCoordinatedScan: (sectorId: string, shipIds: string[]) => void;
  onShareTask?: (
    sourceShipId: string,
    targetShipId: string,
    taskType: 'explore' | 'investigate' | 'evade'
  ) => void;
  onAutoDistributeTasks: (sectorIds: string[], prioritizeFormations: boolean) => void;
  className?: string;
}

export const ReconShipCoordination: React.FC<ReconShipCoordinationProps> = ({
  ships,
  sectors,
  formations = [],
  onCreateFormation,
  onDisbandFormation,
  _onAddShipToFormation,
  _onRemoveShipFromFormation,
  onStartCoordinatedScan,
  onShareTask,
  onAutoDistributeTasks,
  className,
}) => {
  // State for UI
  const [activeTab, setActiveTab] = useState<'formations' | 'coordination' | 'auto'>('formations');
  const [selectedFormationId, setSelectedFormationId] = useState<string>('');
  const [selectedSectorId, setSelectedSectorId] = useState<string>('');
  const [showCreateFormation, setShowCreateFormation] = useState(false);
  const [formationName, setFormationName] = useState('');
  const [formationType, setFormationType] = useState<string>('exploration');
  const [selectedShipIds, setSelectedShipIds] = useState<string[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('');
  const [_prioritizeFormations, _setPrioritizeFormations] = useState(true);

  // Derived state
  const availableShips = useMemo(() => {
    return ships.filter(ship => ship.status === 'idle' && !ship.formationId);
  }, [ships]);

  const _formationShips = useMemo(() => {
    if (!selectedFormationId) return [];
    const formation = formations.find(f => f.id === selectedFormationId);
    if (!formation) return [];
    return ships.filter(ship => formation.shipIds.includes(ship.id));
  }, [ships, formations, selectedFormationId]);

  const _selectedFormation = useMemo(() => {
    return formations.find(f => f.id === selectedFormationId) || null;
  }, [formations, selectedFormationId]);

  // Reset selected leader when selected ships change
  useEffect(() => {
    if (selectedShipIds.length > 0 && !selectedShipIds.includes(selectedLeaderId)) {
      setSelectedLeaderId(selectedShipIds[0]);
    } else if (selectedShipIds.length === 0) {
      setSelectedLeaderId('');
    }
  }, [selectedShipIds, selectedLeaderId]);

  // Handle form submission for creating a new formation with standardized events
  const handleCreateFormation = useCallback(
    (name: string, type: string, shipIds: string[], leaderId: string) => {
      const event: StandardizedEvent = {
        type: EventType.MODULE_UPDATED,
        moduleId: 'recon-coordination',
        moduleType: 'exploration',
        timestamp: Date.now(),
        data: { name, type, shipIds, leaderId, action: 'create_formation' },
      };
      moduleEventBus.emit(event);
      onCreateFormation(name, type, shipIds, leaderId);
    },
    [onCreateFormation]
  );

  // Handle starting a coordinated scan with standardized events
  const handleStartCoordinatedScan = useCallback(
    (sectorId: string, shipIds: string[]) => {
      const event: StandardizedEvent = {
        type: EventType.EXPLORATION_SCAN_STARTED,
        moduleId: 'recon-coordination',
        moduleType: 'exploration',
        timestamp: Date.now(),
        data: { sectorId, shipIds },
      };
      moduleEventBus.emit(event);
      onStartCoordinatedScan(sectorId, shipIds);
    },
    [onStartCoordinatedScan]
  );

  // Handle auto-distribution of tasks with standardized events
  const handleAutoDistributeTasks = useCallback(
    (sectorIds: string[], prioritizeFormations: boolean) => {
      const event: StandardizedEvent = {
        type: EventType.EXPLORATION_TASK_ASSIGNED,
        moduleId: 'recon-coordination',
        moduleType: 'exploration',
        timestamp: Date.now(),
        data: { sectorIds, prioritizeFormations },
      };
      moduleEventBus.emit(event);
      onAutoDistributeTasks(sectorIds, prioritizeFormations);
    },
    [onAutoDistributeTasks]
  );

  // Handle task sharing with standardized events
  const handleShareTask = useCallback(
    (sourceShipId: string, targetShipId: string, taskType: 'explore' | 'investigate' | 'evade') => {
      if (onShareTask) {
        const event: StandardizedEvent = {
          type: EventType.EXPLORATION_TASK_ASSIGNED,
          moduleId: 'recon-coordination',
          moduleType: 'exploration',
          timestamp: Date.now(),
          data: { sourceShipId, targetShipId, taskType },
        };
        moduleEventBus.emit(event);
        onShareTask(sourceShipId, targetShipId, taskType);
      }
    },
    [onShareTask]
  );

  // Cleanup subscriptions on unmount
  useEffect(() => {
    const cleanup = () => {
      // Any cleanup needed for event subscriptions
    };

    return cleanup;
  }, []);

  // Add a button or UI element to use the handleShareTask function
  const _renderTaskSharingControls = () => {
    if (activeTab !== 'coordination' || !selectedShipIds.length) return null;

    return (
      <div className="mt-4 rounded border border-gray-200 p-3">
        <h4 className="mb-2 text-sm font-semibold">Share Tasks</h4>
        <div className="space-y-2">
          {selectedShipIds.map(shipId => {
            const ship = ships.find(s => s.id === shipId);
            if (!ship) return null;

            return (
              <div key={`share-${shipId}`} className="flex items-center justify-between">
                <span className="text-sm">{ship.name}</span>
                <div className="flex space-x-1">
                  <button
                    className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200"
                    onClick={() =>
                      handleShareTask(
                        shipId,
                        selectedShipIds.find(id => id !== shipId) ?? '',
                        'explore'
                      )
                    }
                    disabled={selectedShipIds.length < 2}
                  >
                    Explore
                  </button>
                  <button
                    className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700 hover:bg-purple-200"
                    onClick={() =>
                      handleShareTask(
                        shipId,
                        selectedShipIds.find(id => id !== shipId) ?? '',
                        'investigate'
                      )
                    }
                    disabled={selectedShipIds.length < 2}
                  >
                    Investigate
                  </button>
                  <button
                    className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
                    onClick={() =>
                      handleShareTask(
                        shipId,
                        selectedShipIds.find(id => id !== shipId) ?? '',
                        'evade'
                      )
                    }
                    disabled={selectedShipIds.length < 2}
                  >
                    Evade
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getUnexploredSectors = useCallback(() => {
    return sectors.filter(sector => sector.explorationStatus === ExplorationStatus.UNDISCOVERED);
  }, [sectors]);

  const _getHighPrioritySectors = useCallback(() => {
    return sectors.filter(
      sector =>
        sector.explorationStatus !== ExplorationStatus.FULLY_EXPLORED && sector.resources.length > 0
    );
  }, [sectors]);

  const getAvailableReconShips = useCallback(() => {
    return ships.filter(
      ship =>
        ship.type === 'recon' &&
        ship.status === 'idle' &&
        !formations.some(f => f.shipIds.includes(ship.id))
    );
  }, [ships, formations]);

  const getFormationEffectiveness = useCallback(
    (formation: Formation) => {
      const formationShips = ships.filter(ship => formation.shipIds.includes(ship.id));
      return formationShips.reduce((total, ship) => {
        const baseEffectiveness = ship.capabilities.speed + ship.capabilities.range;
        const stealthBonus = ship.capabilities.stealth
          ? ship.capabilities.stealth * (ship.stealthActive ? 2 : 1)
          : 0;
        return total + baseEffectiveness + stealthBonus;
      }, 0);
    },
    [ships]
  );

  const getFormationShips = useCallback(
    (formation: Formation) => {
      return ships.filter(ship => formation.shipIds.includes(ship.id));
    },
    [ships]
  );

  const getFormationLeader = useCallback(
    (formation: Formation) => {
      return ships.find(ship => ship.id === formation.leaderId);
    },
    [ships]
  );

  const getFormationStatus = useCallback(
    (formation: Formation) => {
      const formationShips = getFormationShips(formation);
      if (formationShips.every(ship => ship.status === 'scanning')) {
        return 'scanning';
      }
      if (formationShips.some(ship => ship.status === 'investigating')) {
        return 'investigating';
      }
      return 'idle';
    },
    [getFormationShips]
  );

  const _getFormationsByType = useCallback(
    (type: string) => {
      return formations.filter(f => f.type === type);
    },
    [formations]
  );

  const _getShipsByType = useCallback(
    (type: 'recon' | 'mining' | 'war') => {
      return ships.filter(ship => ship.type === type);
    },
    [ships]
  );

  const _getShipsByStatus = useCallback(
    (status: 'idle' | 'scanning' | 'investigating' | 'returning') => {
      return ships.filter(ship => ship.status === status);
    },
    [ships]
  );

  const renderFormationList = () => {
    return (
      <div className="space-y-4">
        {formations.map(formation => {
          const leader = getFormationLeader(formation);
          const effectiveness = getFormationEffectiveness(formation);
          const status = getFormationStatus(formation);

          return (
            <div key={formation.id} className="rounded border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{formation.name}</h4>
                  <p className="text-sm text-gray-500">Type: {formation.type}</p>
                  <p className="text-sm text-gray-500">Status: {status}</p>
                  <p className="text-sm text-gray-500">Effectiveness: {effectiveness.toFixed(1)}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600"
                    onClick={() => onDisbandFormation(formation.id)}
                  >
                    Disband
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <h5 className="text-sm font-medium">Ships</h5>
                <div className="mt-1 space-y-1">
                  {getFormationShips(formation).map(ship => (
                    <div key={ship.id} className="flex items-center justify-between text-sm">
                      <span>{ship.name}</span>
                      <span className="text-gray-500">{ship.type}</span>
                      <span className="text-gray-500">
                        {ship.currentTask ? `Task: ${ship.currentTask}` : 'No task'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleAutoDistributeClick = () => {
    const unexploredSectorIds = getUnexploredSectors().map(sector => sector.id);
    handleAutoDistributeTasks(unexploredSectorIds, true);
  };

  const renderCoordinationTab = () => {
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium">Coordinated Scanning</h3>
          <p className="text-sm text-gray-500">
            Select a formation and sector to begin coordinated scanning
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-medium">Select Formation</h4>
            <select
              className="w-full rounded border p-2"
              value={selectedShipIds.join(',')}
              onChange={e => setSelectedShipIds(e.target.value ? e.target.value.split(',') : [])}
            >
              <option value="">Select a formation...</option>
              {formations.map(formation => (
                <option key={formation.id} value={formation.shipIds.join(',')}>
                  {formation.name} ({formation.shipIds.length} ships)
                </option>
              ))}
            </select>
          </div>

          <div>
            <h4 className="mb-2 font-medium">Select Sector</h4>
            <select
              className="w-full rounded border p-2"
              value={selectedSectorId}
              onChange={e => setSelectedSectorId(e.target.value)}
            >
              <option value="">Select a sector...</option>
              {sectors.map(sector => (
                <option key={sector.id} value={sector.id}>
                  {sector.name} - {sector.explorationStatus}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button
            className="flex items-center rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            onClick={() =>
              selectedSectorId &&
              selectedShipIds.length > 0 &&
              handleStartCoordinatedScan(selectedSectorId, selectedShipIds)
            }
            disabled={!selectedSectorId || selectedShipIds.length === 0}
          >
            Start Coordinated Scan
          </button>
        </div>
      </div>
    );
  };

  const renderAutoDistributionTab = () => {
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium">Auto-Distribution</h3>
          <p className="text-sm text-gray-500">Automatically distribute tasks to available ships</p>
        </div>

        <div className="mb-4">
          <button
            className="flex items-center rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            onClick={handleAutoDistributeClick}
            disabled={getUnexploredSectors().length === 0 || getAvailableReconShips().length === 0}
          >
            Auto-Distribute Tasks
          </button>
        </div>
      </div>
    );
  };

  const renderShipDetails = (ship: ReconShip) => {
    return (
      <div key={ship.id} className="mb-4 rounded-lg bg-gray-800 p-4">
        <h4 className="mb-2 text-lg font-semibold text-white">{ship.name}</h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
          <div>Type: {ship.type}</div>
          <div>Status: {ship.status}</div>
          <div>Scanning: {ship.capabilities?.scanning ?? 0}</div>
          <div>Stealth: {ship.capabilities?.stealth ?? 0}</div>
          <div>Combat: {ship.capabilities?.combat ?? 0}</div>
          <div>Stealth Active: {ship.capabilities?.stealthActive ? 'Yes' : 'No'}</div>
        </div>
      </div>
    );
  };

  const handleFormationSelect = (formationId: string) => {
    setSelectedFormationId(formationId === selectedFormationId ? '' : formationId);
  };

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      {/* Header */}
      <div className="border-b bg-gray-50 p-4 dark:bg-gray-800">
        <h2 className="flex items-center text-xl font-semibold">
          <Users className="mr-2" />
          Recon Ship Coordination
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage fleet formations and coordinate recon ship operations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'formations'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('formations')}
        >
          <div className="flex items-center">
            <Users size={16} className="mr-2" />
            Formations
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'coordination'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('coordination')}
        >
          <div className="flex items-center">
            <Radar size={16} className="mr-2" />
            Coordinated Scanning
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'auto'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('auto')}
        >
          <div className="flex items-center">
            <Zap size={16} className="mr-2" />
            Auto-Distribution
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Formations Tab */}
        {activeTab === 'formations' && (
          <div>
            {/* Formation List */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-medium">Fleet Formations</h3>
                <button
                  className="flex items-center rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                  onClick={() => setShowCreateFormation(!showCreateFormation)}
                >
                  {showCreateFormation ? (
                    <>
                      <ChevronUp size={16} className="mr-1" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="mr-1" />
                      New Formation
                    </>
                  )}
                </button>
              </div>

              {/* Create Formation Form */}
              {showCreateFormation && (
                <div className="mb-4 rounded border bg-gray-50 p-4 dark:bg-gray-800">
                  <h4 className="mb-2 font-medium">Create New Formation</h4>

                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium">Formation Name</label>
                    <input
                      type="text"
                      className="w-full rounded border p-2"
                      value={formationName}
                      onChange={e => setFormationName(e.target.value)}
                      placeholder="Enter formation name"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium">Formation Type</label>
                    <select
                      className="w-full rounded border p-2"
                      value={formationType}
                      onChange={e => setFormationType(e.target.value)}
                    >
                      <option value="exploration">Exploration</option>
                      <option value="survey">Survey</option>
                      <option value="defensive">Defensive</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {formationType === 'exploration'
                        ? 'Balanced formation for general exploration'
                        : formationType === 'survey'
                          ? 'Specialized formation for resource discovery'
                          : 'Defensive formation with enhanced threat detection'}
                    </p>
                  </div>

                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium">Select Ships</label>
                    <div className="max-h-40 overflow-y-auto rounded border p-2">
                      {availableShips.length > 0 ? (
                        availableShips.map(ship => (
                          <div key={ship.id} className="mb-1 flex items-center last:mb-0">
                            <input
                              type="checkbox"
                              id={`ship-${ship.id}`}
                              checked={selectedShipIds.includes(ship.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedShipIds([...selectedShipIds, ship.id]);
                                } else {
                                  setSelectedShipIds(selectedShipIds.filter(id => id !== ship.id));
                                }
                              }}
                              className="mr-2"
                            />
                            <label htmlFor={`ship-${ship.id}`} className="flex items-center">
                              <span className="font-medium">{ship.name}</span>
                              <span className="ml-2 text-xs text-gray-500">
                                ({ship.type} - {ship.specialization})
                              </span>
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No available ships</div>
                      )}
                    </div>
                  </div>

                  {selectedShipIds.length > 0 && (
                    <div className="mb-3">
                      <label className="mb-1 block text-sm font-medium">Formation Leader</label>
                      <select
                        className="w-full rounded border p-2"
                        value={selectedLeaderId}
                        onChange={e => setSelectedLeaderId(e.target.value)}
                      >
                        {selectedShipIds.map(shipId => {
                          const ship = ships.find(s => s.id === shipId);
                          return (
                            <option key={shipId} value={shipId}>
                              {ship?.name} ({ship?.specialization})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      className="flex items-center rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                      onClick={() =>
                        handleCreateFormation(
                          formationName,
                          formationType,
                          selectedShipIds,
                          selectedLeaderId
                        )
                      }
                      disabled={!formationName || selectedShipIds.length === 0 || !selectedLeaderId}
                    >
                      <Plus size={16} className="mr-1" />
                      Create Formation
                    </button>
                  </div>
                </div>
              )}

              {/* Formations List */}
              {renderFormationList()}
            </div>
          </div>
        )}

        {/* Coordinated Scanning Tab */}
        {activeTab === 'coordination' && renderCoordinationTab()}

        {/* Auto-Distribution Tab */}
        {activeTab === 'auto' && renderAutoDistributionTab()}
      </div>
    </div>
  );
};
