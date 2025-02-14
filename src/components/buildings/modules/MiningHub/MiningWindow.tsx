import { MiningControls } from './MiningControls';
import { MiningMap } from './MiningMap';
import { MiningTutorial } from './MiningTutorial';
import { ResourceNode } from './ResourceNode';
import { ResourceStorage } from './ResourceStorage';
import { ResourceTransfer } from './ResourceTransfer';
import { TechBonus } from './TechBonus';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Database,
  Grid2X2,
  HelpCircle,
  Map,
  Pickaxe,
  Settings,
  Truck,
  X,
} from 'lucide-react';
import { useState } from 'react';

// Mock storage data
const mockStorageData = [
  {
    id: 'iron-storage',
    resourceType: 'Iron',
    currentAmount: 8500,
    maxCapacity: 10000,
    refiningAmount: 250,
    refiningProgress: 0.65,
    transferRate: 25,
  },
  {
    id: 'helium-storage',
    resourceType: 'Helium-3',
    currentAmount: 2800,
    maxCapacity: 5000,
    refiningAmount: 100,
    refiningProgress: 0.3,
    transferRate: 15,
  },
];

// Mock transfer animations
const mockTransfers = [
  {
    id: 'transfer-1',
    sourceId: 'iron-belt-1',
    targetId: 'iron-storage',
    resourceType: 'Iron',
    amount: 50,
    progress: 0.3,
  },
  {
    id: 'transfer-2',
    sourceId: 'helium-cloud-1',
    targetId: 'helium-storage',
    resourceType: 'Helium-3',
    amount: 25,
    progress: 0.7,
  },
];
interface Resource {
  id: string;
  name: string;
  type: 'mineral' | 'gas' | 'exotic';
  abundance: number;
  distance: number;
  extractionRate: number;
  depletion: number;
  priority: number;
  thresholds: {
    min: number;
    max: number;
  };
}

interface MiningShip {
  id: string;
  name: string;
  type: 'rockBreaker' | 'voidDredger';
  status: 'idle' | 'mining' | 'returning' | 'maintenance';
  capacity: number;
  currentLoad: number;
  targetNode?: string;
  efficiency: number;
}

type SortOption = 'name' | 'type' | 'abundance' | 'distance' | 'priority';

const mockResources: Resource[] = [
  {
    id: 'iron-belt-1',
    name: 'Iron Belt Alpha',
    type: 'mineral',
    abundance: 0.8,
    distance: 150,
    extractionRate: 25,
    depletion: 0.2,
    priority: 1,
    thresholds: { min: 3000, max: 10000 },
  },
  {
    id: 'helium-cloud-1',
    name: 'Helium Cloud Beta',
    type: 'gas',
    abundance: 0.6,
    distance: 300,
    extractionRate: 15,
    depletion: 0.1,
    priority: 2,
    thresholds: { min: 1000, max: 5000 },
  },
  {
    id: 'dark-matter-1',
    name: 'Dark Matter Cluster',
    type: 'exotic',
    abundance: 0.3,
    distance: 500,
    extractionRate: 5,
    depletion: 0.05,
    priority: 3,
    thresholds: { min: 100, max: 1000 },
  },
];

const mockShips: MiningShip[] = [
  {
    id: 'rb-1',
    name: 'Rock Breaker Alpha',
    type: 'rockBreaker',
    status: 'mining',
    capacity: 1000,
    currentLoad: 450,
    targetNode: 'iron-belt-1',
    efficiency: 0.9,
  },
  {
    id: 'vd-1',
    name: 'Void Dredger Beta',
    type: 'voidDredger',
    status: 'returning',
    capacity: 2000,
    currentLoad: 1800,
    targetNode: 'helium-cloud-1',
    efficiency: 0.85,
  },
];

export function MiningWindow() {
  const [selectedNode, setSelectedNode] = useState<Resource | null>(null);
  const [filter, setFilter] = useState<'all' | 'mineral' | 'gas' | 'exotic'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');

  // Tech bonuses (in a real app, these would come from the tech tree state)
  const techBonuses = {
    extractionRate: 1.2, // 20% bonus from tech
    storageCapacity: 1.5, // 50% bonus from tech
    efficiency: 1.1, // 10% bonus from tech
  };

  const filteredResources = mockResources
    .filter(resource => filter === 'all' || resource.type === filter)
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * order;
        case 'type':
          return a.type.localeCompare(b.type) * order;
        case 'abundance':
          return (a.abundance - b.abundance) * order;
        case 'distance':
          return (a.distance - b.distance) * order;
        case 'priority':
          return (a.priority - b.priority) * order;
        default:
          return 0;
      }
    });

  return (
    <div className="fixed inset-4 bg-gray-900/95 backdrop-blur-md rounded-lg border border-gray-700 shadow-2xl flex overflow-hidden">
      {/* Left Panel - Resource Map */}
      <div className="w-2/3 border-r border-gray-700 p-6 flex flex-col">
        {/* Resource Storage Overview */}
        <ResourceStorage storageData={mockStorageData} />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Mineral Processing Centre</h2>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded ${
                  viewMode === 'map'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Map className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Grid2X2 className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setShowTutorial(true)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <HelpCircle className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Resource Type Filters */}
        <div className="flex space-x-2 mb-6">
          {[
            { id: 'all' as const, label: 'All Resources', icon: Database },
            { id: 'mineral' as const, label: 'Minerals', icon: Pickaxe },
            { id: 'gas' as const, label: 'Gas', icon: Database },
            { id: 'exotic' as const, label: 'Exotic', icon: AlertTriangle },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${
                filter === id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-4 mb-4">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="bg-gray-800 text-gray-300 rounded-lg px-3 py-1.5 text-sm border border-gray-700"
          >
            <option value="priority">Sort by Priority</option>
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
            <option value="abundance">Sort by Abundance</option>
            <option value="distance">Sort by Distance</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            className="p-1.5 bg-gray-800 rounded-lg text-gray-400 hover:text-gray-300"
          >
            {sortOrder === 'asc' ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Resource View (Map or Grid) */}
        {viewMode === 'map' ? (
          <MiningMap
            resources={filteredResources}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            techBonuses={techBonuses}
            ships={mockShips}
            quality="high"
          >
            <ResourceTransfer transfers={mockTransfers} />
          </MiningMap>
        ) : (
          <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1">
            {filteredResources.map(resource => (
              <ResourceNode
                key={resource.id}
                resource={resource}
                isSelected={selectedNode?.id === resource.id}
                techBonuses={techBonuses}
                onClick={() => setSelectedNode(resource)}
              />
            ))}
          </div>
        )}

        {/* Mining Fleet Status */}
        <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Active Mining Ships</h3>
          <div className="space-y-2">
            {mockShips.map(ship => (
              <div
                key={ship.id}
                className="flex items-center justify-between bg-gray-800 rounded-lg p-3"
              >
                <div className="flex items-center space-x-3">
                  <Truck
                    className={`w-5 h-5 ${
                      ship.status === 'mining'
                        ? 'text-green-400'
                        : ship.status === 'returning'
                          ? 'text-yellow-400'
                          : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-200">{ship.name}</div>
                    <div className="text-xs text-gray-400">
                      {ship.status.charAt(0).toUpperCase() + ship.status.slice(1)} •{' '}
                      {Math.round((ship.currentLoad / ship.capacity) * 100)}% Full
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Controls & Details */}
      <div className="w-1/3 p-6">
        {selectedNode ? (
          <MiningControls
            resource={selectedNode}
            techBonuses={techBonuses}
            onExperienceGained={amount => {
              // Here we would update the tech tree progress
              console.log(`Mining experience gained: ${amount}`);
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-center">
            <div>
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a resource node to view details and adjust mining parameters</p>
            </div>
          </div>
        )}
      </div>

      {/* Tech Bonuses Display */}
      <TechBonus bonuses={techBonuses} />

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Mining Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Add settings controls here */}
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      {showTutorial && <MiningTutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}
