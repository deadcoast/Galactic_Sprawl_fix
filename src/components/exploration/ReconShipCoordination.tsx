import * as React from "react";
import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Radar,
  Search,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { Position } from '../../types/core/GameTypes';

// Define interfaces based on ReconShipManagerImpl
interface ReconShip {
  id: string;
  name: string;
  type: 'AC27G' | 'PathFinder' | 'VoidSeeker';
  status: 'idle' | 'scanning' | 'investigating' | 'returning';
  targetSector?: string;
  experience: number;
  specialization: 'mapping' | 'anomaly' | 'resource';
  efficiency: number;
  position: Position;
  formationId?: string;
  formationRole?: 'leader' | 'support' | 'scout';
  coordinationBonus?: number;
}

interface Sector {
  id: string;
  name: string;
  status: 'unmapped' | 'mapped' | 'scanning' | 'analyzed';
  coordinates: { x: number; y: number };
  resourcePotential: number;
  habitabilityScore: number;
}

interface FleetFormation {
  id: string;
  name: string;
  type: 'exploration' | 'survey' | 'defensive';
  shipIds: string[];
  leaderId: string;
  position: Position;
  scanBonus: number;
  detectionBonus: number;
  stealthBonus: number;
  createdAt: number;
}

interface ReconShipCoordinationProps {
  ships: ReconShip[];
  sectors: Sector[];
  formations?: FleetFormation[];
  onCreateFormation: (
    name: string,
    type: 'exploration' | 'survey' | 'defensive',
    shipIds: string[],
    leaderId: string
  ) => void;
  onDisbandFormation: (formationId: string) => void;
  onAddShipToFormation: (formationId: string, shipId: string) => void;
  onRemoveShipFromFormation: (formationId: string, shipId: string) => void;
  onStartCoordinatedScan: (sectorId: string, shipIds: string[]) => void;
  onShareTask?: (
    sourceShipId: string,
    targetShipId: string,
    taskType: 'explore' | 'investigate' | 'evade'
  ) => void;
  onAutoDistributeTasks: (sectorIds: string[], prioritizeFormations: boolean) => void;
  className?: string;
}

export function ReconShipCoordination({
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
  className = '',
}: ReconShipCoordinationProps) {
  // State for UI
  const [activeTab, setActiveTab] = useState<'formations' | 'coordination' | 'auto'>('formations');
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [showCreateFormation, setShowCreateFormation] = useState(false);
  const [formationName, setFormationName] = useState('');
  const [formationType, setFormationType] = useState<'exploration' | 'survey' | 'defensive'>(
    'exploration'
  );
  const [selectedShipIds, setSelectedShipIds] = useState<string[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('');
  const [prioritizeFormations, setPrioritizeFormations] = useState(true);

  // Derived state
  const availableShips = useMemo(() => {
    return ships.filter(ship => ship.status === 'idle' && !ship.formationId);
  }, [ships]);

  const formationShips = useMemo(() => {
    if (!selectedFormationId) return [];
    const formation = formations.find(f => f.id === selectedFormationId);
    if (!formation) return [];
    return ships.filter(ship => formation.shipIds.includes(ship.id));
  }, [ships, formations, selectedFormationId]);

  const selectedFormation = useMemo(() => {
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

  // Handle form submission for creating a new formation
  const handleCreateFormation = () => {
    if (formationName && formationType && selectedShipIds.length > 0 && selectedLeaderId) {
      onCreateFormation(formationName, formationType, selectedShipIds, selectedLeaderId);
      // Reset form
      setFormationName('');
      setSelectedShipIds([]);
      setSelectedLeaderId('');
      setShowCreateFormation(false);
    }
  };

  // Handle starting a coordinated scan
  const handleStartCoordinatedScan = () => {
    if (selectedFormationId && selectedSectorId) {
      const formation = formations.find(f => f.id === selectedFormationId);
      if (formation) {
        onStartCoordinatedScan(selectedSectorId, formation.shipIds);
      }
    }
  };

  // Handle auto-distribution of tasks
  const handleAutoDistributeTasks = () => {
    const unmappedSectors = sectors
      .filter(sector => sector.status === 'unmapped')
      .map(sector => sector.id);

    if (unmappedSectors.length > 0) {
      onAutoDistributeTasks(unmappedSectors, prioritizeFormations);
    }
  };

  // Add a function to handle task sharing
  const handleShareTask = (
    sourceShipId: string,
    targetShipId: string,
    taskType: 'explore' | 'investigate' | 'evade'
  ) => {
    if (onShareTask) {
      onShareTask(sourceShipId, targetShipId, taskType);
    }
  };

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
                        selectedShipIds.find(id => id !== shipId) || '',
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
                        selectedShipIds.find(id => id !== shipId) || '',
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
                        selectedShipIds.find(id => id !== shipId) || '',
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

  return (
    <div className={`rounded-lg border shadow-sm ${className}`}>
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
                      onChange={e =>
                        setFormationType(e.target.value as 'exploration' | 'survey' | 'defensive')
                      }
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
                      onClick={handleCreateFormation}
                      disabled={!formationName || selectedShipIds.length === 0 || !selectedLeaderId}
                    >
                      <Plus size={16} className="mr-1" />
                      Create Formation
                    </button>
                  </div>
                </div>
              )}

              {/* Formations List */}
              {formations.length > 0 ? (
                <div className="overflow-hidden rounded border">
                  {formations.map(formation => (
                    <div
                      key={formation.id}
                      className={`border-b p-3 last:border-b-0 ${
                        selectedFormationId === formation.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="flex cursor-pointer items-center"
                          onClick={() =>
                            setSelectedFormationId(
                              selectedFormationId === formation.id ? null : formation.id
                            )
                          }
                        >
                          <div className="mr-2">
                            {formation.type === 'exploration' ? (
                              <Radar size={20} className="text-blue-500" />
                            ) : formation.type === 'survey' ? (
                              <Search size={20} className="text-green-500" />
                            ) : (
                              <Shield size={20} className="text-red-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{formation.name}</div>
                            <div className="text-xs text-gray-500">
                              {formation.type} • {formation.shipIds.length} ships
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <button
                            className="p-1 text-gray-500 hover:text-red-500"
                            onClick={() => onDisbandFormation(formation.id)}
                            title="Disband formation"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            className="ml-1 p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              setSelectedFormationId(
                                selectedFormationId === formation.id ? null : formation.id
                              )
                            }
                            title="View details"
                          >
                            {selectedFormationId === formation.id ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Formation Details */}
                      {selectedFormationId === formation.id && (
                        <div className="mt-3 border-t pt-3">
                          <div className="mb-3 grid grid-cols-3 gap-2">
                            <div className="rounded bg-gray-50 p-2 text-center dark:bg-gray-800">
                              <div className="text-xs text-gray-500">Scan Bonus</div>
                              <div className="font-medium">
                                +{Math.round(formation.scanBonus * 100)}%
                              </div>
                            </div>
                            <div className="rounded bg-gray-50 p-2 text-center dark:bg-gray-800">
                              <div className="text-xs text-gray-500">Detection</div>
                              <div className="font-medium">
                                +{Math.round(formation.detectionBonus * 100)}%
                              </div>
                            </div>
                            <div className="rounded bg-gray-50 p-2 text-center dark:bg-gray-800">
                              <div className="text-xs text-gray-500">Stealth</div>
                              <div className="font-medium">
                                +{Math.round(formation.stealthBonus * 100)}%
                              </div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <h4 className="mb-1 text-sm font-medium">Ships in Formation</h4>
                            <div className="max-h-40 overflow-y-auto rounded border p-2">
                              {formation.shipIds.map(shipId => {
                                const ship = ships.find(s => s.id === shipId);
                                if (!ship) return null;

                                return (
                                  <div
                                    key={shipId}
                                    className="mb-1 flex items-center justify-between last:mb-0"
                                  >
                                    <div className="flex items-center">
                                      {shipId === formation.leaderId && (
                                        <span className="mr-1 text-xs text-yellow-500">★</span>
                                      )}
                                      <span className="font-medium">{ship.name}</span>
                                      <span className="ml-2 text-xs text-gray-500">
                                        ({ship.specialization} - {ship.formationRole || 'member'})
                                      </span>
                                    </div>
                                    <button
                                      className="p-1 text-gray-500 hover:text-red-500"
                                      onClick={() =>
                                        onRemoveShipFromFormation(formation.id, shipId)
                                      }
                                      title="Remove from formation"
                                    >
                                      <UserMinus size={14} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Add Ship to Formation */}
                          {availableShips.length > 0 && (
                            <div className="mb-3">
                              <h4 className="mb-1 text-sm font-medium">Add Ship to Formation</h4>
                              <div className="flex">
                                <select
                                  className="flex-1 rounded-l border p-2"
                                  value=""
                                  onChange={e => {
                                    if (e.target.value) {
                                      onAddShipToFormation(formation.id, e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                >
                                  <option value="">Select a ship...</option>
                                  {availableShips.map(ship => (
                                    <option key={ship.id} value={ship.id}>
                                      {ship.name} ({ship.specialization})
                                    </option>
                                  ))}
                                </select>
                                <button
                                  className="flex items-center rounded-r bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                                  onClick={() => {
                                    const select = document.querySelector(
                                      'select'
                                    ) as HTMLSelectElement;
                                    if (select && select.value) {
                                      onAddShipToFormation(formation.id, select.value);
                                      select.value = '';
                                    }
                                  }}
                                >
                                  <UserPlus size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded border bg-gray-50 p-6 text-center dark:bg-gray-800">
                  <Users size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">No formations created yet</p>
                  <button
                    className="mx-auto mt-2 flex items-center rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                    onClick={() => setShowCreateFormation(true)}
                  >
                    <Plus size={16} className="mr-1" />
                    Create Formation
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coordinated Scanning Tab */}
        {activeTab === 'coordination' && (
          <div>
            <div className="mb-4">
              <h3 className="mb-2 text-lg font-medium">Coordinated Scanning</h3>
              <p className="mb-4 text-sm text-gray-500">
                Coordinate multiple ships to scan sectors more efficiently
              </p>

              {/* Formation Selection */}
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">Select Formation</label>
                <select
                  className="w-full rounded border p-2"
                  value={selectedFormationId || ''}
                  onChange={e => setSelectedFormationId(e.target.value || null)}
                >
                  <option value="">Select a formation...</option>
                  {formations.map(formation => (
                    <option key={formation.id} value={formation.id}>
                      {formation.name} ({formation.type} - {formation.shipIds.length} ships)
                    </option>
                  ))}
                </select>
              </div>

              {/* Sector Selection */}
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">Select Sector to Scan</label>
                <select
                  className="w-full rounded border p-2"
                  value={selectedSectorId || ''}
                  onChange={e => setSelectedSectorId(e.target.value || null)}
                >
                  <option value="">Select a sector...</option>
                  {sectors
                    .filter(sector => sector.status === 'unmapped')
                    .map(sector => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name} (Resource Potential: {sector.resourcePotential})
                      </option>
                    ))}
                </select>
              </div>

              {/* Formation Details */}
              {selectedFormationId && (
                <div className="mb-3 rounded border bg-gray-50 p-3 dark:bg-gray-800">
                  <h4 className="mb-2 font-medium">Formation Details</h4>
                  {selectedFormation && (
                    <>
                      <div className="mb-3 grid grid-cols-3 gap-2">
                        <div className="rounded bg-white p-2 text-center dark:bg-gray-700">
                          <div className="text-xs text-gray-500">Scan Bonus</div>
                          <div className="font-medium">
                            +{Math.round(selectedFormation.scanBonus * 100)}%
                          </div>
                        </div>
                        <div className="rounded bg-white p-2 text-center dark:bg-gray-700">
                          <div className="text-xs text-gray-500">Ships</div>
                          <div className="font-medium">{selectedFormation.shipIds.length}</div>
                        </div>
                        <div className="rounded bg-white p-2 text-center dark:bg-gray-700">
                          <div className="text-xs text-gray-500">Type</div>
                          <div className="font-medium capitalize">{selectedFormation.type}</div>
                        </div>
                      </div>

                      <div className="text-sm">
                        <div className="mb-1">
                          <span className="font-medium">Leader:</span>{' '}
                          {ships.find(s => s.id === selectedFormation.leaderId)?.name || 'Unknown'}
                        </div>
                        <div>
                          <span className="font-medium">Ships:</span>{' '}
                          {formationShips.map(s => s.name).join(', ')}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Start Scan Button */}
              <div className="flex justify-end">
                <button
                  className="flex items-center rounded bg-blue-500 px-3 py-2 text-white hover:bg-blue-600"
                  onClick={handleStartCoordinatedScan}
                  disabled={!selectedFormationId || !selectedSectorId}
                >
                  <Radar size={16} className="mr-1" />
                  Start Coordinated Scan
                </button>
              </div>
            </div>

            {renderTaskSharingControls()}
          </div>
        )}

        {/* Auto-Distribution Tab */}
        {activeTab === 'auto' && (
          <div>
            <div className="mb-4">
              <h3 className="mb-2 text-lg font-medium">Auto-Distribution</h3>
              <p className="mb-4 text-sm text-gray-500">
                Automatically distribute exploration tasks among available ships
              </p>

              <div className="mb-4 rounded border bg-gray-50 p-4 dark:bg-gray-800">
                <div className="mb-3 flex items-center">
                  <input
                    type="checkbox"
                    id="prioritize-formations"
                    checked={prioritizeFormations}
                    onChange={e => setPrioritizeFormations(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="prioritize-formations" className="text-sm font-medium">
                    Prioritize ships in formations
                  </label>
                </div>

                <p className="mb-3 text-xs text-gray-500">
                  When enabled, ships in formations will be assigned tasks first, and will perform
                  coordinated scans when possible.
                </p>

                <div className="mb-3">
                  <div className="mb-1 text-sm font-medium">Available Ships</div>
                  <div className="text-sm">
                    {availableShips.length} idle ships available for task assignment
                  </div>
                </div>

                <div className="mb-3">
                  <div className="mb-1 text-sm font-medium">Unmapped Sectors</div>
                  <div className="text-sm">
                    {sectors.filter(s => s.status === 'unmapped').length} sectors available for
                    exploration
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    className="flex items-center rounded bg-blue-500 px-3 py-2 text-white hover:bg-blue-600"
                    onClick={handleAutoDistributeTasks}
                    disabled={
                      availableShips.length === 0 ||
                      sectors.filter(s => s.status === 'unmapped').length === 0
                    }
                  >
                    <Zap size={16} className="mr-1" />
                    Auto-Distribute Tasks
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
