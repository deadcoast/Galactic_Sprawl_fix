import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Radar,
  Shield,
  Search,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserPlus,
  UserMinus,
  Share2,
  Zap,
  Crosshair,
  Layers,
  Map as MapIcon,
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
  onShareTask: (sourceShipId: string, targetShipId: string, taskType: 'explore' | 'investigate' | 'evade') => void;
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
  const [formationType, setFormationType] = useState<'exploration' | 'survey' | 'defensive'>('exploration');
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
  
  return (
    <div className={`border rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="border-b p-4 bg-gray-50 dark:bg-gray-800">
        <h2 className="text-xl font-semibold flex items-center">
          <Users className="mr-2" />
          Recon Ship Coordination
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Fleet Formations</h3>
                <button
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
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
                <div className="mb-4 p-4 border rounded bg-gray-50 dark:bg-gray-800">
                  <h4 className="font-medium mb-2">Create New Formation</h4>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Formation Name</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={formationName}
                      onChange={(e) => setFormationName(e.target.value)}
                      placeholder="Enter formation name"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Formation Type</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={formationType}
                      onChange={(e) => setFormationType(e.target.value as 'exploration' | 'survey' | 'defensive')}
                    >
                      <option value="exploration">Exploration</option>
                      <option value="survey">Survey</option>
                      <option value="defensive">Defensive</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formationType === 'exploration'
                        ? 'Balanced formation for general exploration'
                        : formationType === 'survey'
                        ? 'Specialized formation for resource discovery'
                        : 'Defensive formation with enhanced threat detection'}
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Select Ships</label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2">
                      {availableShips.length > 0 ? (
                        availableShips.map((ship) => (
                          <div key={ship.id} className="flex items-center mb-1 last:mb-0">
                            <input
                              type="checkbox"
                              id={`ship-${ship.id}`}
                              checked={selectedShipIds.includes(ship.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedShipIds([...selectedShipIds, ship.id]);
                                } else {
                                  setSelectedShipIds(selectedShipIds.filter((id) => id !== ship.id));
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
                        <div className="text-gray-500 text-sm">No available ships</div>
                      )}
                    </div>
                  </div>
                  
                  {selectedShipIds.length > 0 && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Formation Leader</label>
                      <select
                        className="w-full p-2 border rounded"
                        value={selectedLeaderId}
                        onChange={(e) => setSelectedLeaderId(e.target.value)}
                      >
                        {selectedShipIds.map((shipId) => {
                          const ship = ships.find((s) => s.id === shipId);
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
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
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
                <div className="border rounded overflow-hidden">
                  {formations.map((formation) => (
                    <div
                      key={formation.id}
                      className={`border-b last:border-b-0 p-3 ${
                        selectedFormationId === formation.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div
                          className="flex items-center cursor-pointer"
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
                            className="p-1 text-gray-500 hover:text-gray-700 ml-1"
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
                        <div className="mt-3 pt-3 border-t">
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="text-xs text-gray-500">Scan Bonus</div>
                              <div className="font-medium">+{Math.round(formation.scanBonus * 100)}%</div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="text-xs text-gray-500">Detection</div>
                              <div className="font-medium">+{Math.round(formation.detectionBonus * 100)}%</div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="text-xs text-gray-500">Stealth</div>
                              <div className="font-medium">+{Math.round(formation.stealthBonus * 100)}%</div>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <h4 className="text-sm font-medium mb-1">Ships in Formation</h4>
                            <div className="max-h-40 overflow-y-auto border rounded p-2">
                              {formation.shipIds.map((shipId) => {
                                const ship = ships.find((s) => s.id === shipId);
                                if (!ship) return null;
                                
                                return (
                                  <div key={shipId} className="flex justify-between items-center mb-1 last:mb-0">
                                    <div className="flex items-center">
                                      {shipId === formation.leaderId && (
                                        <span className="mr-1 text-yellow-500 text-xs">★</span>
                                      )}
                                      <span className="font-medium">{ship.name}</span>
                                      <span className="ml-2 text-xs text-gray-500">
                                        ({ship.specialization} - {ship.formationRole || 'member'})
                                      </span>
                                    </div>
                                    <button
                                      className="p-1 text-gray-500 hover:text-red-500"
                                      onClick={() => onRemoveShipFromFormation(formation.id, shipId)}
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
                              <h4 className="text-sm font-medium mb-1">Add Ship to Formation</h4>
                              <div className="flex">
                                <select
                                  className="flex-1 p-2 border rounded-l"
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      onAddShipToFormation(formation.id, e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                >
                                  <option value="">Select a ship...</option>
                                  {availableShips.map((ship) => (
                                    <option key={ship.id} value={ship.id}>
                                      {ship.name} ({ship.specialization})
                                    </option>
                                  ))}
                                </select>
                                <button
                                  className="px-3 py-1 bg-blue-500 text-white rounded-r hover:bg-blue-600 flex items-center"
                                  onClick={() => {
                                    const select = document.querySelector('select') as HTMLSelectElement;
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
                <div className="text-center p-6 border rounded bg-gray-50 dark:bg-gray-800">
                  <Users size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No formations created yet</p>
                  <button
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center mx-auto"
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
              <h3 className="text-lg font-medium mb-2">Coordinated Scanning</h3>
              <p className="text-sm text-gray-500 mb-4">
                Coordinate multiple ships to scan sectors more efficiently
              </p>
              
              {/* Formation Selection */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Select Formation</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedFormationId || ''}
                  onChange={(e) => setSelectedFormationId(e.target.value || null)}
                >
                  <option value="">Select a formation...</option>
                  {formations.map((formation) => (
                    <option key={formation.id} value={formation.id}>
                      {formation.name} ({formation.type} - {formation.shipIds.length} ships)
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Sector Selection */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Select Sector to Scan</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedSectorId || ''}
                  onChange={(e) => setSelectedSectorId(e.target.value || null)}
                >
                  <option value="">Select a sector...</option>
                  {sectors
                    .filter((sector) => sector.status === 'unmapped')
                    .map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name} (Resource Potential: {sector.resourcePotential})
                      </option>
                    ))}
                </select>
              </div>
              
              {/* Formation Details */}
              {selectedFormationId && (
                <div className="mb-3 p-3 border rounded bg-gray-50 dark:bg-gray-800">
                  <h4 className="font-medium mb-2">Formation Details</h4>
                  {selectedFormation && (
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 bg-white dark:bg-gray-700 rounded">
                          <div className="text-xs text-gray-500">Scan Bonus</div>
                          <div className="font-medium">+{Math.round(selectedFormation.scanBonus * 100)}%</div>
                        </div>
                        <div className="text-center p-2 bg-white dark:bg-gray-700 rounded">
                          <div className="text-xs text-gray-500">Ships</div>
                          <div className="font-medium">{selectedFormation.shipIds.length}</div>
                        </div>
                        <div className="text-center p-2 bg-white dark:bg-gray-700 rounded">
                          <div className="text-xs text-gray-500">Type</div>
                          <div className="font-medium capitalize">{selectedFormation.type}</div>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <div className="mb-1">
                          <span className="font-medium">Leader:</span>{' '}
                          {ships.find((s) => s.id === selectedFormation.leaderId)?.name || 'Unknown'}
                        </div>
                        <div>
                          <span className="font-medium">Ships:</span>{' '}
                          {formationShips.map((s) => s.name).join(', ')}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {/* Start Scan Button */}
              <div className="flex justify-end">
                <button
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                  onClick={handleStartCoordinatedScan}
                  disabled={!selectedFormationId || !selectedSectorId}
                >
                  <Radar size={16} className="mr-1" />
                  Start Coordinated Scan
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Auto-Distribution Tab */}
        {activeTab === 'auto' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Auto-Distribution</h3>
              <p className="text-sm text-gray-500 mb-4">
                Automatically distribute exploration tasks among available ships
              </p>
              
              <div className="mb-4 p-4 border rounded bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="prioritize-formations"
                    checked={prioritizeFormations}
                    onChange={(e) => setPrioritizeFormations(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="prioritize-formations" className="text-sm font-medium">
                    Prioritize ships in formations
                  </label>
                </div>
                
                <p className="text-xs text-gray-500 mb-3">
                  When enabled, ships in formations will be assigned tasks first, and will perform
                  coordinated scans when possible.
                </p>
                
                <div className="mb-3">
                  <div className="text-sm font-medium mb-1">Available Ships</div>
                  <div className="text-sm">
                    {availableShips.length} idle ships available for task assignment
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-sm font-medium mb-1">Unmapped Sectors</div>
                  <div className="text-sm">
                    {sectors.filter((s) => s.status === 'unmapped').length} sectors available for
                    exploration
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                    onClick={handleAutoDistributeTasks}
                    disabled={
                      availableShips.length === 0 ||
                      sectors.filter((s) => s.status === 'unmapped').length === 0
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