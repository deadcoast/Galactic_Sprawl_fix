import * as React from "react";
import { useEffect, useState } from 'react';
import ResourceVisualization from '../../../../components/ui/ResourceVisualization';
import {
  Ship,
  ShipHangarManager,
  ShipStatus,
  ShipType,
} from '../../../../managers/ships/ShipHangarManager';
import { Effect } from '../../../../types/core/GameTypes';
import { ResourceType } from "./../../../../types/resources/ResourceTypes";
import { WeaponCategory, WeaponStatus } from '../../../../types/weapons/WeaponTypes';

interface HangarWeaponSystem {
  id: string;
  name: string;
  damage: number;
  range: number;
  cooldown: number;
  type: WeaponCategory;
  status: WeaponStatus;
}

// Extended Ability interface with id
interface ShipAbility {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  duration: number;
  effect: Effect;
  active: boolean;
}

// Custom ship interface for UI purposes
interface CustomShip {
  id: string;
  name: string;
  type: string; // Using string to allow for custom ship types in the UI
  level: number;
  health: number;
  maxHealth: number;
  fuel: number;
  maxFuel: number;
  crew: number;
  maxCrew: number;
  status: string; // Using string to allow for custom statuses in the UI
  location?: string;
  destination?: string;
  cargo?: {
    capacity: number;
    resources: Map<ResourceType, number>;
  };
  weapons?: HangarWeaponSystem[];
  shields?: number;
  maxShields?: number;
  speed?: number;
  range?: number;
  description?: string;
  image?: string;
  effects?: Effect[];
  isSelected?: boolean;
  // Additional UI properties
  tier?: number;
  hull?: number;
  maxHull?: number;
  shield?: number;
  maxShield?: number;
  abilities?: ShipAbility[];
  alerts?: string[];
}

// Mock data for development and testing purposes
const _mockShips: CustomShip[] = [
  {
    id: '1',
    name: 'Spitfire Alpha',
    type: ShipType.FIGHTER,
    tier: 1,
    status: ShipStatus.DOCKED,
    hull: 100,
    maxHull: 100,
    shield: 50,
    maxShield: 50,
    weapons: [
      {
        id: '1',
        name: 'Laser Cannon',
        damage: 10,
        range: 5,
        cooldown: 2,
        type: 'beamWeapon',
        status: 'ready',
      },
    ],
    abilities: [
      {
        id: '1',
        name: 'Boost',
        description: 'Increases speed by 50% for 5 seconds',
        cooldown: 10,
        duration: 5,
        active: false,
        effect: {
          id: 'boost-effect',
          type: 'speed',
          duration: 5,
          magnitude: 1.5,
        },
      },
    ],
    alerts: ['Low fuel', 'Shield damaged'],
    level: 1,
    health: 100,
    maxHealth: 100,
    fuel: 50,
    maxFuel: 100,
    crew: 5,
    maxCrew: 5,
    cargo: {
      resources: new Map([
        [ResourceType.IRON, 10],
        [ResourceType.COPPER, 5],
      ]),
      capacity: 100,
    },
  },
  {
    id: '2',
    name: 'Star Voyager',
    type: ShipType.CRUISER,
    tier: 2,
    status: ShipStatus.DEPLOYED,
    hull: 80,
    maxHull: 150,
    shield: 30,
    maxShield: 100,
    weapons: [
      {
        id: '1',
        name: 'Plasma Cannon',
        damage: 20,
        range: 8,
        cooldown: 3,
        type: 'plasmaCannon',
        status: 'charging',
      },
      {
        id: '2',
        name: 'Missile Launcher',
        damage: 30,
        range: 10,
        cooldown: 5,
        type: 'rockets',
        status: 'ready',
      },
    ],
    abilities: [
      {
        id: '1',
        name: 'Shield Boost',
        description: 'Regenerates shields by 20%',
        cooldown: 15,
        duration: 0,
        active: false,
        effect: {
          id: 'shield-boost-effect',
          type: 'shield',
          duration: 0,
          magnitude: 0.2,
        },
      },
    ],
    level: 2,
    health: 80,
    maxHealth: 150,
    fuel: 70,
    maxFuel: 150,
    crew: 15,
    maxCrew: 20,
    cargo: {
      resources: new Map([
        [ResourceType.TITANIUM, 20],
        [ResourceType.URANIUM, 5],
      ]),
      capacity: 200,
    },
    destination: 'Alpha Centauri',
  },
];

interface ShipHangarProps {
  hangarId: string;
  capacity?: number;
}

/**
 * ShipHangar Component
 *
 * This component demonstrates how to use the ShipHangarManager with the standardized event system.
 */
const ShipHangar: React.FC<ShipHangarProps> = ({ hangarId, capacity = 10 }) => {
  // Create a state to store the ships
  const [ships, setShips] = useState<CustomShip[]>([]);
  // Create a state to store the selected ship
  const [selectedShip, setSelectedShip] = useState<CustomShip | null>(null);
  // Create a state to store the hangar manager
  const [hangarManager] = useState(() => new ShipHangarManager(hangarId, capacity));
  // Create a state to track if the component is mounted
  const [isMounted, setIsMounted] = useState(false);

  // Initialize the component
  useEffect(() => {
    setIsMounted(true);

    // Subscribe to events
    const shipAddedUnsubscribe = hangarManager.on('ship:added', ({ ship }) => {
      if (isMounted) {
        setShips(prevShips => [...prevShips, toCustomShip(ship)]);
      }
    });

    const shipRemovedUnsubscribe = hangarManager.on('ship:removed', ({ shipId }) => {
      if (isMounted) {
        setShips(prevShips => prevShips.filter(ship => ship.id !== shipId));
        if (selectedShip && selectedShip.id === shipId) {
          setSelectedShip(null);
        }
      }
    });

    const shipUpdatedUnsubscribe = hangarManager.on('ship:updated', ({ ship }) => {
      if (isMounted) {
        setShips(prevShips => prevShips.map(s => (s.id === ship.id ? toCustomShip(ship) : s)));
        if (selectedShip && selectedShip.id === ship.id) {
          setSelectedShip(ship);
        }
      }
    });

    // Add some sample ships
    const scout = hangarManager.createShip('Scout Alpha', ShipType.SCOUT);
    const fighter = hangarManager.createShip('Fighter Beta', ShipType.FIGHTER);
    const cruiser = hangarManager.createShip('Cruiser Gamma', ShipType.CRUISER);

    hangarManager.addShip(scout);
    hangarManager.addShip(fighter);
    hangarManager.addShip(cruiser);

    // Load some cargo onto the cruiser
    if (cruiser.cargo) {
      hangarManager.loadCargo(cruiser.id, ResourceType.MINERALS, 50);
      hangarManager.loadCargo(cruiser.id, ResourceType.ENERGY, 25);
    }

    // Cleanup function
    return () => {
      shipAddedUnsubscribe();
      shipRemovedUnsubscribe();
      shipUpdatedUnsubscribe();
      setIsMounted(false);
    };
  }, [hangarId, capacity, hangarManager, isMounted]);

  // Handle ship selection
  const handleSelectShip = (ship: CustomShip) => {
    setSelectedShip(ship);
  };

  // Handle ship deployment
  const handleDeployShip = () => {
    if (selectedShip) {
      const destination = prompt('Enter destination:');
      if (destination) {
        hangarManager.deployShip(selectedShip.id, destination);
      }
    }
  };

  // Handle ship docking
  const handleDockShip = () => {
    if (selectedShip) {
      hangarManager.dockShip(selectedShip.id);
    }
  };

  // Handle ship repair
  const handleRepairShip = () => {
    if (selectedShip) {
      hangarManager.repairShip(selectedShip.id, 10);
    }
  };

  // Handle ship refueling
  const handleRefuelShip = () => {
    if (selectedShip) {
      hangarManager.refuelShip(selectedShip.id, 10);
    }
  };

  // Handle ship upgrade
  const handleUpgradeShip = () => {
    if (selectedShip) {
      hangarManager.upgradeShip(selectedShip.id);
    }
  };

  // Handle ship removal
  const handleRemoveShip = () => {
    if (selectedShip) {
      if (window.confirm(`Are you sure you want to remove ${selectedShip.name}?`)) {
        hangarManager.removeShip(selectedShip.id);
      }
    }
  };

  // Handle creating a new ship
  const handleCreateShip = () => {
    const name = prompt('Enter ship name:');
    if (!name) return;

    const typeOptions = Object.values(ShipType);
    const typeIndex = parseInt(
      prompt(
        `Enter ship type (0-${typeOptions.length - 1}):\n${typeOptions.map((type, index) => `${index}: ${type}`).join('\n')}`
      ) || '0'
    );
    const type = typeOptions[typeIndex] || ShipType.SCOUT;

    const newShip = hangarManager.createShip(name, type as ShipType);
    hangarManager.addShip(newShip);
  };

  // Convert between Ship and CustomShip
  const toCustomShip = (ship: Ship): CustomShip => {
    return {
      ...ship,
      // Add any additional UI-specific properties
      weapons: [],
      shields: 100,
      maxShields: 100,
      speed: 10,
      range: 5,
      description: 'A standard ship',
      image: '',
      effects: [],
      isSelected: false,
    };
  };

  const toShip = (customShip: CustomShip): Ship => {
    return {
      id: customShip.id,
      name: customShip.name,
      type: customShip.type as unknown as ShipType, // Convert string to ShipType
      level: customShip.level,
      health: customShip.health,
      maxHealth: customShip.maxHealth,
      fuel: customShip.fuel,
      maxFuel: customShip.maxFuel,
      crew: customShip.crew,
      maxCrew: customShip.maxCrew,
      status: customShip.status as unknown as ShipStatus, // Convert string to ShipStatus
      location: customShip.location,
      destination: customShip.destination,
      cargo: customShip.cargo,
    };
  };

  // Update the status comparisons
  const getStatusColor = (status: string) => {
    if (status === ShipStatus.DOCKED) return 'bg-green-500';
    if (status === ShipStatus.DEPLOYED) return 'bg-blue-500';
    if (status === ShipStatus.DAMAGED) return 'bg-red-500';
    if (status === ShipStatus.REPAIRING) return 'bg-yellow-500';
    if (status === ShipStatus.REFUELING) return 'bg-purple-500';
    if (status === ShipStatus.UPGRADING) return 'bg-indigo-500';
    return 'bg-gray-500';
  };

  // Render the component
  return (
    <div className="ship-hangar rounded-lg bg-gray-800 p-4 text-white">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Ship Hangar: {hangarId}</h2>
        <div className="text-sm">
          Ships: {ships.length} / {hangarManager.getCapacity()}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Ship List */}
        <div className="col-span-1 rounded bg-gray-700 p-3">
          <h3 className="mb-2 text-lg font-semibold">Ships</h3>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {ships.map(ship => (
              <div
                key={ship.id}
                className={`cursor-pointer rounded p-2 ${selectedShip?.id === ship.id ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                onClick={() => handleSelectShip(ship)}
              >
                <div className="font-medium">{ship.name}</div>
                <div className="flex justify-between text-xs">
                  <span>{ship.type}</span>
                  <span>Level {ship.level}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className={getStatusColor(ship.status)}>{ship.status}</span>
                  {ship.destination && <span>→ {ship.destination}</span>}
                </div>
              </div>
            ))}
          </div>
          <button
            className="mt-2 w-full rounded bg-green-600 py-1 hover:bg-green-500"
            onClick={handleCreateShip}
          >
            Create New Ship
          </button>
        </div>

        {/* Ship Details */}
        <div className="col-span-2 rounded bg-gray-700 p-3">
          {selectedShip ? (
            <div>
              <h3 className="mb-2 text-lg font-semibold">{selectedShip.name}</h3>

              <div className="mb-4 grid grid-cols-2 gap-2">
                <div className="rounded bg-gray-600 p-2">
                  <div className="text-xs text-gray-400">Type</div>
                  <div>{selectedShip.type}</div>
                </div>
                <div className="rounded bg-gray-600 p-2">
                  <div className="text-xs text-gray-400">Level</div>
                  <div>{selectedShip.level}</div>
                </div>
                <div className="rounded bg-gray-600 p-2">
                  <div className="text-xs text-gray-400">Health</div>
                  <div className="flex items-center">
                    <div className="mr-2 h-2.5 w-full rounded-full bg-gray-300">
                      <div
                        className={`h-2.5 rounded-full ${selectedShip.health === 0 ? 'bg-red-600' : 'bg-green-600'}`}
                        style={{
                          width: `${(selectedShip.health / selectedShip.maxHealth) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span>
                      {selectedShip.health} / {selectedShip.maxHealth}
                    </span>
                  </div>
                </div>
                <div className="rounded bg-gray-600 p-2">
                  <div className="text-xs text-gray-400">Fuel</div>
                  <div className="flex items-center">
                    <div className="mr-2 h-2.5 w-full rounded-full bg-gray-300">
                      <div
                        className="h-2.5 rounded-full bg-yellow-400"
                        style={{ width: `${(selectedShip.fuel / selectedShip.maxFuel) * 100}%` }}
                      ></div>
                    </div>
                    <span>
                      {selectedShip.fuel} / {selectedShip.maxFuel}
                    </span>
                  </div>
                </div>
                <div className="rounded bg-gray-600 p-2">
                  <div className="text-xs text-gray-400">Crew</div>
                  <div>
                    {selectedShip.crew} / {selectedShip.maxCrew}
                  </div>
                </div>
                <div className="rounded bg-gray-600 p-2">
                  <div className="text-xs text-gray-400">Status</div>
                  <div>{selectedShip.status}</div>
                </div>
              </div>

              {/* Cargo Section */}
              {selectedShip.cargo && (
                <div className="mb-4">
                  <h4 className="mb-1 font-medium">Cargo</h4>
                  <div className="rounded bg-gray-600 p-2">
                    <div className="mb-1 text-xs text-gray-400">
                      Capacity:{' '}
                      {Array.from(selectedShip.cargo.resources.values()).reduce(
                        (sum, amount) => sum + amount,
                        0
                      )}{' '}
                      / {selectedShip.cargo.capacity}
                    </div>
                    <div className="space-y-1">
                      {Array.from(selectedShip.cargo.resources.entries()).map(
                        ([resourceType, amount]) => (
                          <div key={resourceType.toString()} className="flex items-center">
                            <ResourceVisualization resourceType={resourceType} amount={amount} />
                          </div>
                        )
                      )}
                      {selectedShip.cargo.resources.size === 0 && (
                        <div className="text-sm text-gray-400">No cargo</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {selectedShip.status === ShipStatus.DOCKED && (
                  <button
                    className="rounded bg-blue-600 py-1 hover:bg-blue-500"
                    onClick={handleDeployShip}
                  >
                    Deploy
                  </button>
                )}
                {selectedShip.status === ShipStatus.DEPLOYED && (
                  <button
                    className="rounded bg-blue-600 py-1 hover:bg-blue-500"
                    onClick={handleDockShip}
                  >
                    Dock
                  </button>
                )}
                <button
                  className="rounded bg-green-600 py-1 hover:bg-green-500"
                  onClick={handleRepairShip}
                  disabled={selectedShip.health === selectedShip.maxHealth}
                >
                  Repair
                </button>
                <button
                  className="rounded bg-yellow-600 py-1 hover:bg-yellow-500"
                  onClick={handleRefuelShip}
                  disabled={selectedShip.fuel === selectedShip.maxFuel}
                >
                  Refuel
                </button>
                <button
                  className="rounded bg-purple-600 py-1 hover:bg-purple-500"
                  onClick={handleUpgradeShip}
                >
                  Upgrade
                </button>
                <button
                  className="rounded bg-red-600 py-1 hover:bg-red-500"
                  onClick={handleRemoveShip}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">Select a ship to view details</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipHangar;
