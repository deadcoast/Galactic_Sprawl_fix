import { Grid2X2, List, Rocket, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useScalingSystem } from '../../../../hooks/game/useScalingSystem';
import { ShipHangarManager } from '../../../../managers/module/ShipHangarManager';
import { ShipBuildQueueItem } from '../../../../types/buildings/ShipHangarTypes';
import { Effect } from '../../../../types/core/GameTypes';
import { CommonShip } from '../../../../types/ships/CommonShipTypes';
import {
  WeaponSystem as BaseWeaponSystem,
  WeaponCategory,
  WeaponStatus,
} from '../../../../types/weapons/WeaponTypes';
import { createWeaponEffect, createWeaponLike } from '../../../../utils/weapons/weaponEffectUtils';
import { PlayerShipCustomization } from '../../../ships/player/customization/PlayerShipCustomization';
import { PlayerShipUpgradeSystem } from '../../../ships/player/customization/PlayerShipUpgradeSystem';
import { WarShip } from '../../../ships/player/variants/warships/WarShip';

interface HangarWeaponSystem extends BaseWeaponSystem {
  name: string;
}

interface Ship {
  id: string;
  name: string;
  type:
    | 'spitflare'
    | 'starSchooner'
    | 'orionFrigate'
    | 'harbringerGalleon'
    | 'midwayCarrier'
    | 'motherEarthRevenge';
  tier: 1 | 2 | 3;
  status: 'idle' | 'patrolling' | 'engaging' | 'returning' | 'damaged';
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  weapons: HangarWeaponSystem[];
  abilities: Array<{
    name: string;
    description: string;
    cooldown: number;
    duration: number;
    active: boolean;
    effect: Effect;
  }>;
  alerts?: string[];
}

// Mock data for demonstration
const _mockShips: Ship[] = [
  {
    id: 'spitflare-1',
    name: 'Spitflare Alpha',
    type: 'spitflare',
    tier: 1,
    status: 'idle',
    hull: 100,
    maxHull: 100,
    shield: 50,
    maxShield: 50,
    weapons: [
      {
        id: 'mg-1',
        name: 'Machine Gun',
        type: 'machineGun',
        damage: 10,
        range: 100,
        cooldown: 5,
        status: 'ready',
      },
    ],
    abilities: [
      {
        name: 'Machine Gun',
        description: 'Standard weapon system',
        cooldown: 5,
        duration: 10,
        active: false,
        effect: createWeaponEffect(
          createWeaponLike({
            id: 'mg-1',
            type: 'machineGun',
            damage: 10,
            cooldown: 5,
            displayName: 'Machine Gun',
          })
        ),
      },
    ],
  },
  {
    id: 'schooner-1',
    name: 'Star Schooner Beta',
    type: 'starSchooner',
    tier: 2,
    status: 'patrolling',
    hull: 150,
    maxHull: 150,
    shield: 100,
    maxShield: 100,
    weapons: [
      {
        id: 'rail-1',
        name: 'Rail Gun',
        type: 'railGun',
        damage: 25,
        range: 200,
        cooldown: 10,
        status: 'charging',
      },
    ],
    abilities: [
      {
        name: 'Rail Gun',
        description: 'Standard weapon system',
        cooldown: 10,
        duration: 10,
        active: false,
        effect: createWeaponEffect(
          createWeaponLike({
            id: 'rail-1',
            type: 'railGun',
            damage: 25,
            cooldown: 10,
            displayName: 'Rail Gun',
          })
        ),
      },
    ],
  },
];

interface ShipHangarProps {
  manager: ShipHangarManager;
}

export function ShipHangar({ manager }: ShipHangarProps) {
  const [filter, setFilter] = useState<'all' | 'idle' | 'active' | 'damaged'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showCustomization, setShowCustomization] = useState(false);
  const [ships, setShips] = useState<Ship[]>([]);
  const [buildQueue, setBuildQueue] = useState<ShipBuildQueueItem[]>([]);

  const scaling = useScalingSystem();
  const quality =
    scaling.performance.fps > 45 ? 'high' : scaling.performance.fps > 30 ? 'medium' : 'low';

  useEffect(() => {
    // Initial load
    const dockedShips = manager.getDockedShips();
    const convertedShips = dockedShips.map(convertCommonShipToShip);
    setShips(convertedShips);
    setBuildQueue(manager.getBuildQueue());

    // Subscribe to events
    const handleShipDocked = ({ ship }: { ship: CommonShip }) => {
      setShips(prev => [...prev, convertCommonShipToShip(ship)]);
    };

    const handleShipLaunched = ({ ship }: { ship: CommonShip }) => {
      setShips(prev => prev.filter(s => s.id !== ship.id));
      if (selectedShip?.id === ship.id) {
        setSelectedShip(null);
      }
    };

    const handleBuildStarted = ({ queueItem: _queueItem }: { queueItem: ShipBuildQueueItem }) => {
      setBuildQueue(manager.getBuildQueue());
    };

    const handleBuildCompleted = ({ ship }: { ship: CommonShip }) => {
      setBuildQueue(manager.getBuildQueue());
      setShips(prev => [...prev, convertCommonShipToShip(ship)]);
    };

    const handleBuildProgressed = () => {
      setBuildQueue(manager.getBuildQueue());
    };

    manager.on('shipDocked', handleShipDocked);
    manager.on('shipLaunched', handleShipLaunched);
    manager.on('buildStarted', handleBuildStarted);
    manager.on('buildCompleted', handleBuildCompleted);
    manager.on('buildProgressed', handleBuildProgressed);

    return () => {
      manager.off('shipDocked', handleShipDocked);
      manager.off('shipLaunched', handleShipLaunched);
      manager.off('buildStarted', handleBuildStarted);
      manager.off('buildCompleted', handleBuildCompleted);
      manager.off('buildProgressed', handleBuildProgressed);
    };
  }, [manager]);

  // Convert CommonShip to Ship interface
  const convertCommonShipToShip = (commonShip: CommonShip): Ship => {
    const weapons = commonShip.abilities.map(ability => ({
      id: crypto.randomUUID(),
      name: ability.name,
      type: 'machineGun' as WeaponCategory,
      damage: 10,
      range: 100,
      cooldown: ability.cooldown,
      status: 'ready' as WeaponStatus,
    }));

    return {
      id: commonShip.id,
      name: commonShip.name,
      type: commonShip.name.toLowerCase().split('-')[0] as Ship['type'],
      tier: 1,
      status: commonShip.status === 'ready' ? 'idle' : 'damaged',
      hull: commonShip.stats.defense.armor,
      maxHull: commonShip.stats.defense.armor,
      shield: commonShip.stats.defense.shield,
      maxShield: commonShip.stats.defense.shield,
      weapons,
      abilities: weapons.map(w => ({
        name: w.name,
        description: 'Standard weapon system',
        cooldown: w.cooldown,
        duration: 10,
        active: false,
        effect: createWeaponEffect(createWeaponLike(w)),
      })),
    };
  };

  const filteredShips = ships.filter(ship => {
    if (searchQuery && !ship.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filter === 'idle' && ship.status !== 'idle') {
      return false;
    }
    if (filter === 'active' && !['patrolling', 'engaging'].includes(ship.status)) {
      return false;
    }
    if (filter === 'damaged' && ship.status !== 'damaged') {
      return false;
    }
    return true;
  });

  const handleDeploy = (shipId: string) => {
    try {
      manager.launchShip(shipId);
    } catch (error) {
      console.error('Failed to launch ship:', error);
    }
  };

  const handleRecall = (shipId: string) => {
    const ship = ships.find(s => s.id === shipId);
    if (ship) {
      try {
        const commonShip: CommonShip = {
          id: ship.id,
          name: ship.name,
          category: ship.type.includes('void-dredger')
            ? 'mining'
            : ship.type.includes('schooner')
              ? 'recon'
              : 'war',
          status: ship.status === 'idle' ? 'ready' : 'damaged',
          stats: {
            health: ship.hull,
            maxHealth: ship.maxHull,
            shield: ship.shield,
            maxShield: ship.maxShield,
            energy: 100,
            maxEnergy: 100,
            speed: 10,
            turnRate: 5,
            cargo: 0,
            weapons: [],
            abilities: [],
            defense: {
              armor: ship.hull,
              shield: ship.shield,
              evasion: 0,
            },
            mobility: {
              speed: 10,
              turnRate: 5,
              acceleration: 5,
            },
          },
          abilities: ship.weapons.map(w => ({
            name: w.name,
            description: 'Standard weapon system',
            cooldown: w.cooldown,
            duration: 10,
            active: false,
            effect: createWeaponEffect(createWeaponLike(w)),
          })),
        };
        manager.dockShip(commonShip);
      } catch (error) {
        console.error('Failed to dock ship:', error);
      }
    }
  };

  return (
    <div className="fixed inset-4 flex overflow-hidden rounded-lg border border-gray-700 bg-gray-900/95 shadow-2xl backdrop-blur-md">
      {/* Ship List */}
      <div className="w-2/3 border-r border-gray-700 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Rocket className="h-6 w-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Ship Hangar</h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search ships..."
                className="w-64 rounded-lg border border-gray-700 bg-gray-800/90 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            {/* View Toggle */}
            <div className="flex rounded-lg bg-gray-800 p-1">
              <button
                onClick={() => setView('grid')}
                className={`rounded p-1.5 ${
                  view === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Grid2X2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`rounded p-1.5 ${
                  view === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mb-6 flex space-x-2">
          {[
            { id: 'all', label: 'All Ships' },
            { id: 'idle', label: 'Idle' },
            { id: 'active', label: 'Active' },
            { id: 'damaged', label: 'Damaged' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id as 'all' | 'idle' | 'active' | 'damaged')}
              className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${
                filter === id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Ship Grid */}
        <div
          className={`${
            view === 'grid' ? 'grid grid-cols-2 gap-6' : 'space-y-4'
          } max-h-[calc(100vh-16rem)] overflow-y-auto`}
        >
          {filteredShips.map(ship => (
            <WarShip
              key={ship.id}
              ship={ship}
              quality={quality}
              onDeploy={() => handleDeploy(ship.id)}
              onRecall={() => handleRecall(ship.id)}
            />
          ))}
        </div>
      </div>

      {/* Ship Details Panel */}
      <div className="w-1/3 p-6">
        {selectedShip ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">{selectedShip.name}</h3>
              <button
                onClick={() => setShowCustomization(prev => !prev)}
                className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
              >
                {showCustomization ? 'Show Upgrades' : 'Customize'}
              </button>
            </div>
            {showCustomization ? (
              <PlayerShipCustomization
                ship={{
                  id: selectedShip.id,
                  name: selectedShip.name,
                  type:
                    selectedShip.type === 'motherEarthRevenge'
                      ? 'midwayCarrier'
                      : selectedShip.type,
                  tier: selectedShip.tier,
                  customization: {
                    colors: [],
                    patterns: [],
                    decals: [],
                  },
                  loadout: {
                    weapons: [],
                    shields: [],
                    engines: [],
                  },
                }}
                onApplyCustomization={() => {}}
                onEquipLoadout={() => {}}
              />
            ) : (
              <PlayerShipUpgradeSystem
                ship={{
                  id: selectedShip.id,
                  name: selectedShip.name,
                  type:
                    selectedShip.type === 'motherEarthRevenge'
                      ? 'midwayCarrier'
                      : selectedShip.type,
                  tier: selectedShip.tier,
                  upgradeAvailable: true,
                  requirements: [],
                  stats: {
                    hull: {
                      current: selectedShip.hull,
                      upgraded: selectedShip.hull * 1.5,
                    },
                    shield: {
                      current: selectedShip.shield,
                      upgraded: selectedShip.shield * 1.5,
                    },
                    weapons: { current: 100, upgraded: 150 },
                    speed: { current: 100, upgraded: 120 },
                  },
                  resourceCost: [],
                  visualUpgrades: [],
                }}
                onUpgrade={() => {}}
                onPreviewUpgrade={() => {}}
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-gray-400">
            <div>
              <Rocket className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Select a ship to view details and manage loadout</p>
            </div>
          </div>
        )}
      </div>

      {/* Build Queue Panel */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-700 bg-gray-800/90 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-medium text-white">Build Queue</h4>
          <span className="text-xs text-gray-400">
            {buildQueue.length} / {manager.getState().maxQueueSize}
          </span>
        </div>
        <div className="flex space-x-4 overflow-x-auto">
          {buildQueue.map(item => (
            <div key={item.id} className="w-48 flex-shrink-0 rounded-lg bg-gray-700 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-white">{item.shipClass}</span>
                <button
                  onClick={() => manager.cancelBuild(item.id)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-600">
                <div
                  className="h-2 rounded-full bg-indigo-500"
                  style={{ width: `${item.progress * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Docking Bay Status */}
      <div className="absolute bottom-6 left-6 flex items-center space-x-2 rounded-lg border border-indigo-700/30 bg-indigo-900/50 px-4 py-2">
        <Rocket className="h-4 w-4 text-indigo-400" />
        <span className="text-sm text-indigo-200">
          {ships.length} Ships Docked •{' '}
          {ships.filter(s => ['engaging', 'patrolling'].includes(s.status)).length} Active
        </span>
      </div>

      {/* Warnings */}
      {ships.some(s => s.status === 'damaged') && (
        <div className="absolute bottom-6 right-6 flex items-center space-x-2 rounded-lg border border-red-700/30 bg-red-900/50 px-4 py-2">
          <Rocket className="h-4 w-4 text-red-400" />
          <span className="text-sm text-red-200">Ships requiring repairs detected</span>
        </div>
      )}
    </div>
  );
}
