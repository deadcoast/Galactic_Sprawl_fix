import { ChevronUp, MinusCircle, Plus, PlusCircle, Radar, Users, Zap } from 'lucide-react';
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
  onAddShipToFormation: (shipId: string, formationId: string) => void;
  onRemoveShipFromFormation: (shipId: string, formationId: string) => void;
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
  onAddShipToFormation,
  onRemoveShipFromFormation,
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
  const [prioritizeFormations, setPrioritizeFormations] = useState(true);
  const [showAddShipModal, setShowAddShipModal] = useState(false);

  // Derived state
  const availableShips = useMemo(() => {
    return ships.filter(ship => ship.status === 'idle' && !ship.formationId);
  }, [ships]);

  const selectedFormation = useMemo(() => {
    return formations.find(f => f.id === selectedFormationId) || null;
  }, [formations, selectedFormationId]);

  const formationShips = useMemo(() => {
    if (!selectedFormation) return [];
    return ships.filter(ship => selectedFormation.shipIds.includes(ship.id));
  }, [ships, selectedFormation]);

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
      // unknown cleanup needed for event subscriptions
    };

    return cleanup;
  }, []);

  // Add a button or UI element to use the handleShareTask function
  const renderTaskSharingControls = () => {
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
          const effectiveness = getFormationEffectiveness(formation);
          const status = getFormationStatus(formation);
          const isSelected = selectedFormationId === formation.id;

          return (
            <div
              key={formation.id}
              className={`rounded border p-4 transition-all duration-200 ease-in-out ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md dark:bg-blue-900/30'
                  : 'cursor-pointer border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50'
              }`}
              onClick={() => !isSelected && handleFormationSelect(formation.id)}
            >
              <div className="flex items-start justify-between">
                <div
                  onClick={() => isSelected && handleFormationSelect('')}
                  className={isSelected ? 'cursor-pointer' : ''}
                >
                  <h4 className="font-medium">
                    {formation.name}{' '}
                    {isSelected && (
                      <span className="text-xs font-normal text-blue-600">(Selected)</span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Type: {formation.type}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status: {status}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Effectiveness: {effectiveness.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Leader: {getFormationLeader(formation)?.name ?? 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ships: {formation.shipIds.length}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <button
                    className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                    onClick={e => {
                      e.stopPropagation();
                      onDisbandFormation(formation.id);
                      if (isSelected) setSelectedFormationId('');
                    }}
                  >
                    Disband
                  </button>
                  {isSelected && (
                    <button
                      className="flex items-center rounded bg-green-500 px-2 py-1 text-xs text-white hover:bg-green-600"
                      onClick={e => {
                        e.stopPropagation();
                        setShowAddShipModal(true);
                      }}
                    >
                      <PlusCircle size={14} className="mr-1" /> Add Ship
                    </button>
                  )}
                </div>
              </div>

              {isSelected && (
                <div className="mt-4 border-t border-gray-300 pt-3 dark:border-gray-600">
                  <h5 className="mb-2 text-base font-semibold">Ships in Formation</h5>
                  <div className="max-h-60 space-y-1 overflow-y-auto pr-2">
                    {formationShips.length > 0 ? (
                      formationShips.map(ship => (
                        <div
                          key={ship.id}
                          className="flex items-center justify-between rounded bg-gray-100 p-2 dark:bg-gray-700"
                        >
                          <div>
                            <span className="font-medium">{ship.name}</span>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              ({ship.type})
                            </span>
                          </div>
                          {formation.shipIds.length > 1 && ship.id !== formation.leaderId && (
                            <button
                              className="ml-2 rounded bg-yellow-500 px-1.5 py-0.5 text-xs text-white hover:bg-yellow-600"
                              onClick={e => {
                                e.stopPropagation();
                                onRemoveShipFromFormation(ship.id, formation.id);
                              }}
                            >
                              <MinusCircle size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No ships assigned to this formation.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {showAddShipModal && selectedFormation && (
          <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold">
                Add Ships to "{selectedFormation.name}"
              </h3>
              <div className="max-h-60 space-y-2 overflow-y-auto border-y border-gray-300 py-3 dark:border-gray-600">
                {availableShips.length > 0 ? (
                  availableShips.map(ship => (
                    <button
                      key={ship.id}
                      className="flex w-full items-center justify-between rounded px-2 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        onAddShipToFormation(ship.id, selectedFormation.id);
                        setShowAddShipModal(false);
                      }}
                    >
                      <span>
                        {ship.name} <span className="text-xs text-gray-500">({ship.type})</span>
                      </span>
                      <PlusCircle size={16} className="text-green-500" />
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No available ships to add.
                  </p>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  className="rounded bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                  onClick={() => setShowAddShipModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleAutoDistributeClick = () => {
    const highPrioritySectorIds = _getHighPrioritySectors().map(sector => sector.id);
    if (highPrioritySectorIds.length === 0) {
      console.warn('No high priority sectors found for auto-distribution.');
      return;
    }
    handleAutoDistributeTasks(highPrioritySectorIds, prioritizeFormations);
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

        {/* Render Task Sharing Controls */}
        {renderTaskSharingControls()}
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

        {/* Add checkbox for prioritization */}
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="prioritizeFormationsCheckbox"
            checked={prioritizeFormations}
            onChange={e => setPrioritizeFormations(e.target.checked)}
            className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="prioritizeFormationsCheckbox"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Prioritize formations for tasks
          </label>
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

  const handleFormationSelect = (formationId: string) => {
    setSelectedFormationId(formationId === selectedFormationId ? '' : formationId);
    setShowAddShipModal(false);
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
