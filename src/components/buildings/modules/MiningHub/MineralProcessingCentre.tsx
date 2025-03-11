/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { AlertTriangle, Database, Grid2X2, Map, Truck } from 'lucide-react';
import * as React from 'react';
import { miningRules } from '../../../../config/automation/miningRules';
import { ThresholdProvider, useThreshold } from '../../../../contexts/ThresholdContext';
import { useScalingSystem } from '../../../../hooks/game/useScalingSystem';
import { automationManager } from '../../../../managers/game/AutomationManager';
import { ResourceTransferManager } from '../../../../managers/resource/ResourceTransferManager';
import { MiningResource } from '../../../../types/mining/MiningTypes';
import { ResourceType } from '../../../../types/resources/StandardizedResourceTypes';
import { AutomationMonitor } from './AutomationMonitor';
import { MiningControls } from './MiningControls';
import { MiningMap } from './MiningMap';
import { ResourceStorage } from './ResourceStorage';
import { ThresholdManager } from './ThresholdManager';

interface MineralProcessingCentreProps {
  tier: 1 | 2 | 3;
}

type ResourceFilter = 'all' | 'mineral' | 'gas' | 'exotic';

function MineralProcessingCentreContent({ tier }: MineralProcessingCentreProps) {
  const [selectedNode, setSelectedNode] = React.useState<MiningResource | null>(null);
  const [filter, setFilter] = React.useState<ResourceFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [view, setView] = React.useState<'map' | 'grid'>('map');
  const [mineAll, setMineAll] = React.useState(false);
  const [techBonuses, setTechBonuses] = React.useState({
    extractionRate: 1,
    storageCapacity: 1,
    efficiency: 1,
  });

  const { state, dispatch } = useThreshold();

  const scaling = useScalingSystem();
  const quality =
    scaling.performance.fps > 45 ? 'high' : scaling.performance.fps > 30 ? 'medium' : 'low';

  // Mock data for demonstration
  const mockResources: MiningResource[] = [
    {
      id: 'iron-belt-1',
      name: 'Iron Belt Alpha',
      type: ResourceType.IRON,
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
      type: ResourceType.HELIUM,
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
      type: ResourceType.DARK_MATTER,
      abundance: 0.3,
      distance: 500,
      extractionRate: 5,
      depletion: 0.05,
      priority: 3,
      thresholds: { min: 100, max: 1000 },
    },
  ];

  // Initialize resources in threshold state
  React.useEffect(() => {
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
  React.useEffect(() => {
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
    if (filter !== 'all') {
      if (
        filter === 'mineral' &&
        ![ResourceType.IRON, ResourceType.COPPER, ResourceType.TITANIUM].includes(resource.type)
      ) {
        return false;
      }
      if (
        filter === 'gas' &&
        ![ResourceType.HELIUM, ResourceType.DEUTERIUM].includes(resource.type)
      ) {
        return false;
      }
      if (
        filter === 'exotic' &&
        ![ResourceType.DARK_MATTER, ResourceType.EXOTIC_MATTER].includes(resource.type)
      ) {
        return false;
      }
    }
    return true;
  });

  // Implement useEffect for tier-based tech bonuses
  React.useEffect(() => {
    const tierBonuses = {
      1: { extractionRate: 1, storageCapacity: 1, efficiency: 1 },
      2: { extractionRate: 1.5, storageCapacity: 1.5, efficiency: 1.25 },
      3: { extractionRate: 2, storageCapacity: 2, efficiency: 1.5 },
    };
    setTechBonuses(tierBonuses[tier]);
  }, [tier]);

  // Register automation rules on mount
  React.useEffect(() => {
    // Register each mining rule
    miningRules.forEach(rule => {
      automationManager.registerRule(rule);
    });

    // Cleanup on unmount
    return () => {
      miningRules.forEach(rule => {
        automationManager.removeRule(rule.id);
      });
    };
  }, []);

  // Update the resource type comparison
  const resourcesByType = mockResources.reduce(
    (acc, resource) => {
      if ([ResourceType.IRON, ResourceType.COPPER, ResourceType.TITANIUM].includes(resource.type)) {
        acc.minerals.push(resource);
      } else if ([ResourceType.HELIUM, ResourceType.DEUTERIUM].includes(resource.type)) {
        acc.gas.push(resource);
      } else if ([ResourceType.DARK_MATTER, ResourceType.EXOTIC_MATTER].includes(resource.type)) {
        acc.exotic.push(resource);
      }
      return acc;
    },
    { minerals: [], gas: [], exotic: [] } as Record<string, MiningResource[]>
  );

  return (
    <div className="fixed inset-4 flex overflow-hidden rounded-lg border border-gray-700 bg-gray-900/95 shadow-2xl backdrop-blur-md">
      {/* Left Panel - Resource Map */}
      <div className="flex w-2/3 flex-col border-r border-gray-700 p-6">
        {/* Resource Storage Overview */}
        <ResourceStorage storageData={mockStorageData} />

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Mineral Processing Centre</h2>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search resources..."
                className="w-64 rounded-lg border border-gray-700 bg-gray-800/90 px-4 py-2 text-white placeholder-gray-400"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex rounded-lg bg-gray-800 p-1">
              <button
                onClick={() => setView('map')}
                className={`rounded p-1.5 ${
                  view === 'map' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Map className="h-5 w-5" />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`rounded p-1.5 ${
                  view === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Grid2X2 className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => setMineAll(!mineAll)}
              className={`flex items-center space-x-2 rounded-lg px-4 py-2 ${
                mineAll ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Truck className="h-4 w-4" />
              <span>Mine All</span>
            </button>
          </div>
        </div>

        {/* Resource Type Filters */}
        <div className="mb-6 flex space-x-2">
          {[
            { id: 'all', label: 'All Resources', icon: Database },
            { id: 'mineral', label: 'Minerals', icon: Database },
            { id: 'gas', label: 'Gas', icon: Database },
            { id: 'exotic', label: 'Exotic', icon: AlertTriangle },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilter(id as ResourceFilter)}
              className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${
                filter === id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
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
            <div className="grid flex-1 grid-cols-2 gap-4 overflow-y-auto">
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
      <div className="flex w-1/3 flex-col space-y-6 p-6">
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
          <div className="flex h-48 items-center justify-center text-center text-gray-400">
            <div>
              <Database className="mx-auto mb-4 h-12 w-12 opacity-50" />
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
