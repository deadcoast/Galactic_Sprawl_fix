import { ExplorationControls } from './ExplorationControls';
import { ExplorationTutorial } from './ExplorationTutorial';
import { MissionLog } from './MissionLog';
import { ReconShipStatus } from './ReconShipStatus';
import { ResourceTransfer } from '../MiningHub/ResourceTransfer';
import {
  AlertTriangle,
  Filter,
  History,
  Map,
  Radar,
  Rocket,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import React, { useRef, useState } from 'react';

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
        investigated: false,
      },
    ],
    lastScanned: Date.now() - 3600000,
  },
  {
    id: 'beta-sector',
    name: 'Beta Sector',
    status: 'scanning',
    coordinates: { x: 200, y: -150 },
    resourcePotential: 0.5,
    habitabilityScore: 0.3,
    anomalies: [],
    lastScanned: Date.now(),
  },
  {
    id: 'gamma-sector',
    name: 'Gamma Sector',
    status: 'unmapped',
    coordinates: { x: -180, y: 120 },
    resourcePotential: 0.4,
    habitabilityScore: 0.7,
    anomalies: [],
  },
];

const mockShips: ReconShip[] = [
  {
    id: 'recon-1',
    name: 'Pathfinder Alpha',
    status: 'scanning',
    targetSector: 'beta-sector',
    experience: 1250,
    specialization: 'mapping',
    efficiency: 0.9,
  },
  {
    id: 'recon-2',
    name: 'Signal Hunter Beta',
    status: 'investigating',
    targetSector: 'alpha-sector',
    experience: 800,
    specialization: 'anomaly',
    efficiency: 0.85,
  },
];

// Mock transfer data for exploration discoveries
const mockExplorationTransfers = [
  {
    id: 'discovery-1',
    sourceId: 'alpha-sector',
    targetId: 'storage',
    resourceType: 'Dark Matter',
    amount: 100,
    progress: 0.5,
  },
];

type FilterType = 'all' | 'unmapped' | 'anomalies';

export function ExplorationWindow() {
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showMissionLog, setShowMissionLog] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) {
      return;
    }

    const deltaX = e.clientX - lastPosition.current.x;
    const deltaY = e.clientY - lastPosition.current.y;

    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));

    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const filteredSectors = mockSectors.filter(sector => {
    if (searchQuery && !sector.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filter === 'unmapped' && sector.status !== 'unmapped') {
      return false;
    }
    if (filter === 'anomalies' && sector.anomalies.length === 0) {
      return false;
    }
    return true;
  });

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
                onChange={e => setSearchQuery(e.target.value)}
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

        {/* Filter Controls */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2 text-gray-400">
            <Filter className="w-4 h-4" />
            <span>Filters:</span>
          </div>
          <div className="flex space-x-2">
            {[
              { id: 'all', label: 'All Sectors', icon: Map },
              { id: 'unmapped', label: 'Unmapped', icon: Radar },
              { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setFilter(id as FilterType)}
                className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${
                  filter === id
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
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
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            }}
          >
            {/* Resource Transfer Animations */}
            <ResourceTransfer transfers={mockExplorationTransfers} />

            {/* Sectors */}
            {filteredSectors.map(sector => {
              const isSelected = selectedSector?.id === sector.id;
              const scanningShip = mockShips.find(ship => ship.targetSector === sector.id);

              return (
                <div
                  key={sector.id}
                  className="absolute"
                  style={{
                    left: `calc(50% + ${sector.coordinates.x}px)`,
                    top: `calc(50% + ${sector.coordinates.y}px)`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <button onClick={() => setSelectedSector(sector)} className="group relative">
                    {/* Sector Visualization */}
                    <div
                      className={`w-24 h-24 rounded-lg ${
                        sector.status === 'unmapped'
                          ? 'bg-gray-800/50'
                          : sector.status === 'scanning'
                            ? 'bg-teal-900/50 animate-pulse'
                            : 'bg-teal-800/30'
                      } relative ${
                        isSelected ? 'ring-2 ring-teal-400 ring-offset-2 ring-offset-gray-900' : ''
                      }`}
                    >
                      {/* Resource Potential Indicator */}
                      {sector.status !== 'unmapped' && (
                        <div
                          className="absolute inset-2 border-2 border-teal-500/30 rounded"
                          style={{
                            clipPath: `polygon(0 ${100 - sector.resourcePotential * 100}%, 100% ${100 - sector.resourcePotential * 100}%, 100% 100%, 0 100%)`,
                          }}
                        />
                      )}

                      {/* Habitability Score Ring */}
                      {sector.status !== 'unmapped' && (
                        <div
                          className="absolute inset-0 border-4 border-teal-400/20 rounded-lg"
                          style={{
                            clipPath: `polygon(0 0, ${sector.habitabilityScore * 100}% 0, ${sector.habitabilityScore * 100}% 100%, 0 100%)`,
                          }}
                        />
                      )}

                      {/* Anomaly Indicators */}
                      {sector.anomalies.map((anomaly, index) => (
                        <div
                          key={anomaly.id}
                          className={`absolute w-3 h-3 rounded-full ${
                            anomaly.severity === 'high'
                              ? 'bg-red-500'
                              : anomaly.severity === 'medium'
                                ? 'bg-yellow-500'
                                : 'bg-blue-500'
                          } animate-pulse`}
                          style={{
                            top: `${25 + index * 25}%`,
                            right: '10%',
                          }}
                        />
                      ))}

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
            })}
          </div>
        </div>

        {/* Recon Fleet Status */}
        <ReconShipStatus ships={mockShips} />
      </div>

      {/* Right Panel - Controls & Details */}
      <div className="w-1/3 p-6">
        {selectedSector ? (
          <ExplorationControls sector={selectedSector} onClose={() => setSelectedSector(null)} />
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
      {showMissionLog && <MissionLog onClose={() => setShowMissionLog(false)} />}

      {/* Tutorial Overlay */}
      {showTutorial && <ExplorationTutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}
