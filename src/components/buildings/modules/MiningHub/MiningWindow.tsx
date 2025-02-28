import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Database,
  Grid2X2,
  HelpCircle,
  Map,
  Rocket,
  Settings,
  Ship,
} from 'lucide-react';
import { useState } from 'react';
import { ContextMenuItem, useContextMenu } from '../../../../components/ui/ContextMenu';
import { Draggable, DragItem, DropTarget } from '../../../../components/ui/DragAndDrop';
import { MiningMap } from './MiningMap';
import { MiningTutorial } from './MiningTutorial';
import { ResourceNode } from './ResourceNode';
import { ResourceStorage } from './ResourceStorage';
import { ResourceTransfer } from './ResourceTransfer';

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

type ViewMode = 'map' | 'grid';
type SortOption = 'priority' | 'name' | 'type' | 'abundance' | 'distance';
type FilterOption = 'all' | 'mineral' | 'gas' | 'exotic';

export function MiningWindow() {
  const [selectedNode, setSelectedNode] = useState<Resource | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [showTutorial, setShowTutorial] = useState(false);

  // Mock tech bonuses
  const techBonuses = {
    extractionRate: 1.2,
    efficiency: 1.1,
    range: 1.15,
    storageCapacity: 1.5,
  };

  // Filter and sort resources
  const filteredResources = mockResources
    .filter(resource => filter === 'all' || resource.type === filter)
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'priority':
          comparison = a.priority - b.priority;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'abundance':
          comparison = b.abundance - a.abundance;
          break;
        case 'distance':
          comparison = a.distance - b.distance;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Context menu for resources
  const getResourceMenuItems = (resource: Resource): ContextMenuItem[] => {
    const assignedShip = mockShips.find(ship => ship.targetNode === resource.id);
    return [
      {
        id: 'info',
        label: 'Resource Info',
        icon: <Database className="h-4 w-4" />,
        action: () => setSelectedNode(resource),
      },
      {
        id: 'assign-ship',
        label: assignedShip ? 'Reassign Ship' : 'Assign Ship',
        icon: <Ship className="h-4 w-4" />,
        action: () => {}, // No-op action for parent menu
        children: mockShips
          .filter(ship => ship.status === 'idle' || ship.targetNode === resource.id)
          .map(ship => ({
            id: ship.id,
            label: ship.name,
            icon: <Rocket className="h-4 w-4" />,
            action: () => {
              // Handle ship assignment
              console.log(`Assigning ${ship.name} to ${resource.name}`);
            },
          })),
      },
      {
        id: 'set-priority',
        label: 'Set Priority',
        icon: <ChevronRight className="h-4 w-4" />,
        action: () => {}, // No-op action for parent menu
        children: [1, 2, 3, 4, 5].map(priority => ({
          id: `priority-${priority}`,
          label: `Priority ${priority}`,
          action: () => {
            // Handle priority change
            console.log(`Setting ${resource.name} priority to ${priority}`);
          },
        })),
      },
    ];
  };

  // Handle resource drop on storage
  const handleResourceDrop = (item: DragItem, storage: (typeof mockStorageData)[0]) => {
    if (item.type === 'resource') {
      // Handle resource transfer
      console.log(`Transferring ${item.data.type} to ${storage.resourceType} storage`);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-white">Mineral Processing</h2>
          <button
            onClick={() => setShowTutorial(true)}
            className="p-2 text-gray-400 hover:text-gray-300"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode(prev => (prev === 'map' ? 'grid' : 'map'))}
            className="p-2 text-gray-400 hover:text-gray-300"
          >
            {viewMode === 'map' ? <Grid2X2 className="h-5 w-5" /> : <Map className="h-5 w-5" />}
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-300">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center space-x-4">
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-300"
        >
          <option value="priority">Sort by Priority</option>
          <option value="name">Sort by Name</option>
          <option value="type">Sort by Type</option>
          <option value="abundance">Sort by Abundance</option>
          <option value="distance">Sort by Distance</option>
        </select>
        <button
          onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
          className="rounded-lg bg-gray-800 p-1.5 text-gray-400 hover:text-gray-300"
        >
          {sortOrder === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
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
        <div className="grid flex-1 grid-cols-2 gap-4 overflow-y-auto">
          {filteredResources.map(resource => {
            const { handleContextMenu, ContextMenuComponent } = useContextMenu({
              items: getResourceMenuItems(resource),
            });

            return (
              <div key={resource.id}>
                <Draggable
                  item={{
                    id: resource.id,
                    type: 'resource',
                    data: resource,
                  }}
                >
                  <div onContextMenu={handleContextMenu}>
                    <ResourceNode
                      resource={resource}
                      isSelected={selectedNode?.id === resource.id}
                      techBonuses={techBonuses}
                      onClick={() => setSelectedNode(resource)}
                    />
                  </div>
                </Draggable>
                {ContextMenuComponent}
              </div>
            );
          })}
        </div>
      )}

      {/* Storage Section */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <DropTarget
          accept={['resource']}
          onDrop={item => handleResourceDrop(item, mockStorageData[0])}
          className="rounded-lg bg-gray-800 p-4 transition-colors hover:bg-gray-800/80"
        >
          <ResourceStorage storageData={mockStorageData} />
        </DropTarget>
      </div>

      {/* Mining Fleet Status */}
      <div className="mt-4">
        <h3 className="mb-3 text-lg font-medium text-white">Mining Fleet</h3>
        <div className="grid grid-cols-2 gap-4">
          {mockShips.map(ship => {
            const assignedResource = mockResources.find(r => r.id === ship.targetNode);

            return (
              <Draggable
                key={ship.id}
                item={{
                  id: ship.id,
                  type: 'ship',
                  data: ship,
                }}
              >
                <div className="rounded-lg bg-gray-800 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Ship className="h-4 w-4 text-cyan-400" />
                      <span className="font-medium text-gray-200">{ship.name}</span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        ship.status === 'mining'
                          ? 'bg-green-900/50 text-green-400'
                          : ship.status === 'returning'
                            ? 'bg-blue-900/50 text-blue-400'
                            : 'bg-gray-900/50 text-gray-400'
                      }`}
                    >
                      {ship.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {assignedResource ? <>Mining: {assignedResource.name}</> : <>No assignment</>}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Cargo: {ship.currentLoad}/{ship.capacity} • Efficiency:{' '}
                    {Math.round(ship.efficiency * 100)}%
                  </div>
                </div>
              </Draggable>
            );
          })}
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && <MiningTutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}
