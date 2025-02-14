import { AutomationMonitor } from './AutomationMonitor';
import { MiningControls } from './MiningControls';
import { MiningMap } from './MiningMap';
import { ResourceStorage } from './ResourceStorage';
import { ResourceTransferManager } from './ResourceTransferManager';
import { ThresholdManager } from './ThresholdManager';
import { ThresholdProvider, useThreshold } from '../../../../contexts/ThresholdContext';
import { useScalingSystem } from '../../../../hooks/game/useScalingSystem';
import { AlertTriangle, Database, Grid2X2, Map, Truck } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

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

interface MineralProcessingCentreProps {
  tier: 1 | 2 | 3;
}

function MineralProcessingCentreContent({ tier }: MineralProcessingCentreProps) {
  const [selectedNode, setSelectedNode] = useState<Resource | null>(null);
  const [filter, setFilter] = useState<'all' | 'mineral' | 'gas' | 'exotic'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'map' | 'grid'>('map');
  const [mineAll, setMineAll] = useState(false);
  const [techBonuses, setTechBonuses] = useState({
    extractionRate: 1,
    storageCapacity: 1,
    efficiency: 1,
  });

  const { state, dispatch } = useThreshold();

  const scaling = useScalingSystem();
  const quality =
    scaling.performance.fps > 45 ? 'high' : scaling.performance.fps > 30 ? 'medium' : 'low';

  // Mock data for demonstration
  const mockResources = useMemo<Resource[]>(
    () => [
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
    ],
    []
  ); // Empty dependency array since this data is static

  // Initialize resources in threshold state
  useEffect(() => {
    mockResources.forEach(resource => {
      if (!state.resources[resource.id]) {
        dispatch({
          type: 'ADD_RESOURCE',
          payload: {
            id: resource.id,
            name: resource.name,
            type: resource.type,
            currentAmount: 0,
            maxCapacity: resource.thresholds.max,
            thresholds: resource.thresholds,
            autoMine: false,
          },
        });
      }
    });
  }, [dispatch, mockResources, state.resources]);

  // Handle mine all toggle
  useEffect(() => {
    dispatch({
      type: 'SET_GLOBAL_AUTO_MINE',
      payload: mineAll,
    });
  }, [mineAll, dispatch]);

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

  const filteredResources = mockResources.filter(resource => {
    if (searchQuery && !resource.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filter !== 'all' && resource.type !== filter) {
      return false;
    }
    return true;
  });

  // Implement useEffect for tier-based tech bonuses
  useEffect(() => {
    const tierBonuses = {
      1: { extractionRate: 1, storageCapacity: 1, efficiency: 1 },
      2: { extractionRate: 1.5, storageCapacity: 1.5, efficiency: 1.25 },
      3: { extractionRate: 2, storageCapacity: 2, efficiency: 1.5 },
    };
    setTechBonuses(tierBonuses[tier]);
  }, [tier]);

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
            <div className="relative">
              <input
                type="text"
                placeholder="Search resources..."
                className="w-64 px-4 py-2 bg-gray-800/90 rounded-lg border border-gray-700 text-white placeholder-gray-400"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setView('map')}
                className={`p-1.5 rounded ${
                  view === 'map' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Map className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-1.5 rounded ${
                  view === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Grid2X2 className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setMineAll(!mineAll)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                mineAll ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Mine All</span>
            </button>
          </div>
        </div>

        {/* Resource Type Filters */}
        <div className="flex space-x-2 mb-6">
          {[
            { id: 'all', label: 'All Resources', icon: Database },
            { id: 'mineral', label: 'Minerals', icon: Database },
            { id: 'gas', label: 'Gas', icon: Database },
            { id: 'exotic', label: 'Exotic', icon: AlertTriangle },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilter(id as 'all' | 'mineral' | 'gas' | 'exotic')}
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

        {/* Resource View (Map or Grid) */}
        <div className="relative flex-1">
          {view === 'map' ? (
            <MiningMap
              resources={filteredResources}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              techBonuses={techBonuses}
              ships={[]}
              quality={quality}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1">
              {filteredResources.map(resource => (
                <ThresholdManager
                  key={resource.id}
                  resourceId={resource.id}
                  resourceName={resource.name}
                  resourceType={resource.type}
                  currentAmount={state.resources[resource.id]?.currentAmount || 0}
                  maxCapacity={resource.thresholds.max}
                />
              ))}
            </div>
          )}

          {/* Resource Transfer Manager */}
          <ResourceTransferManager storageNodes={mockStorageData} />
        </div>
      </div>

      {/* Right Panel - Controls & Details */}
      <div className="w-1/3 p-6 flex flex-col space-y-6">
        {selectedNode ? (
          <MiningControls
            resource={selectedNode}
            techBonuses={techBonuses}
            onExperienceGained={exp => {
              // Handle mining experience gained
              if (exp.unlockedTech.length > 0) {
                // TODO: Unlock tech tree nodes
              }
            }}
          />
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-center">
            <div>
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a resource node to view details and adjust mining parameters</p>
            </div>
          </div>
        )}

        <AutomationMonitor />
      </div>
    </div>
  );
}

export function MineralProcessingCentre(props: MineralProcessingCentreProps) {
  return (
    <ThresholdProvider>
      <MineralProcessingCentreContent {...props} />
    </ThresholdProvider>
  );
}
