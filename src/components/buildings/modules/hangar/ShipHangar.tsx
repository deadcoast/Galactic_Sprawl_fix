import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { getShipHangarManager } from '../../../../managers/ManagerRegistry';
import { ShipHangarBay } from '../../../../types/buildings/ShipHangarTypes';
import { CommonShip, ShipStatus } from '../../../../types/ships/CommonShipTypes';
import { PlayerShipClass } from '../../../../types/ships/PlayerShipTypes';

interface ShipHangarProps {
  hangarId: string;
  capacity?: number;
}

/**
 * Ship Hangar Component
 * Displays ships and allows interaction
 */
export const ShipHangar: React.FC<ShipHangarProps> = ({ hangarId, capacity }) => {
  const hangarManager = getShipHangarManager();

  const [ships, setShips] = useState<CommonShip[]>([]);
  const [selectedShip, setSelectedShip] = useState<CommonShip | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showCreateUI, setShowCreateUI] = useState(false);
  const [newShipName, setNewShipName] = useState('');
  const [selectedClassToBuild, setSelectedClassToBuild] = useState<PlayerShipClass>(
    PlayerShipClass.SCOUT
  );

  const fetchShips = useCallback(async () => {
    try {
      const currentShips = hangarManager.getDockedShips ? hangarManager.getDockedShips() : [];
      if (isMounted) {
        setShips(currentShips);
      }
    } catch (error) {
      console.error('Failed to fetch ships:', error);
    }
  }, [hangarManager, isMounted]);

  useEffect(() => {
    setIsMounted(true);

    const handleShipAdded = ({ ship, bay }: { ship: CommonShip; bay: ShipHangarBay }) => {
      if (isMounted) {
        setShips(prevShips => [...prevShips, ship]);
      }
    };

    const handleShipRemoved = ({ ship, bay }: { ship: CommonShip; bay: ShipHangarBay }) => {
      if (isMounted) {
        setShips(prevShips => prevShips.filter(s => s.id !== ship.id));
        if (selectedShip && selectedShip.id === ship.id) {
          setSelectedShip(null);
        }
      }
    };

    const handleShipRepairCompleted = ({ shipId }: { shipId: string }) => {
      console.log(`Ship ${shipId} repair completed, refetching list.`);
      fetchShips();
    };

    const handleShipUpgradeCompleted = ({ shipId }: { shipId: string }) => {
      console.log(`Ship ${shipId} upgrade completed, refetching list.`);
      fetchShips();
    };

    hangarManager.on('shipDocked', handleShipAdded);
    hangarManager.on('shipLaunched', handleShipRemoved);
    hangarManager.on('repairCompleted', handleShipRepairCompleted);
    hangarManager.on('upgradeCompleted', handleShipUpgradeCompleted);

    fetchShips();

    return () => {
      hangarManager.off('shipDocked', handleShipAdded);
      hangarManager.off('shipLaunched', handleShipRemoved);
      hangarManager.off('repairCompleted', handleShipRepairCompleted);
      hangarManager.off('upgradeCompleted', handleShipUpgradeCompleted);
      setIsMounted(false);
    };
  }, [hangarId, capacity, hangarManager, selectedShip, fetchShips]);

  const handleSelectShip = (ship: CommonShip) => {
    setSelectedShip(ship);
  };

  const handleDeployShip = () => {
    if (selectedShip) {
      const destination = prompt('Enter destination:');
      if (destination) {
        hangarManager.deployShip(selectedShip.id, destination);
      }
    }
  };

  const handleDockShip = () => {
    if (selectedShip) {
      hangarManager.dockShip(selectedShip.id);
    }
  };

  const handleRepairShip = () => {
    if (selectedShip) {
      hangarManager.repairShip(selectedShip.id, 10);
    }
  };

  const handleRefuelShip = () => {
    if (selectedShip) {
      hangarManager.refuelShip(selectedShip.id, 10);
    }
  };

  const handleUpgradeShip = () => {
    if (selectedShip) {
      hangarManager.upgradeShip(selectedShip.id);
    }
  };

  const handleRemoveShip = () => {
    if (selectedShip) {
      if (window.confirm(`Are you sure you want to remove ${selectedShip.name}?`)) {
        hangarManager.removeShip(selectedShip.id);
      }
    }
  };

  const handleConfirmBuildNewShip = () => {
    if (!newShipName || !selectedClassToBuild) {
      alert('Please enter a name and select a class.');
      return;
    }
    try {
      const newShip = hangarManager.createShip(newShipName, selectedClassToBuild);
      hangarManager.addShip(newShip);
      setNewShipName('');
      setShowCreateUI(false);
      fetchShips();
    } catch (error) {
      console.error('Failed to create ship:', error);
      alert(`Error creating ship: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const getStatusColor = (status: ShipStatus) => {
    switch (status) {
      case ShipStatus.READY:
        return 'bg-green-500';
      case ShipStatus.ENGAGING:
        return 'bg-red-600';
      case ShipStatus.PATROLLING:
        return 'bg-blue-500';
      case ShipStatus.RETREATING:
        return 'bg-orange-500';
      case ShipStatus.DISABLED:
        return 'bg-gray-600';
      case ShipStatus.DAMAGED:
        return 'bg-red-500';
      case ShipStatus.REPAIRING:
        return 'bg-yellow-500';
      case ShipStatus.UPGRADING:
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="ship-hangar rounded-lg bg-gray-800 p-4 text-white">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Ship Hangar: {hangarId}</h2>
        <div className="text-sm">
          Ships: {ships.length} / {hangarManager.getCapacity()}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-1 flex flex-col rounded bg-gray-700 p-3">
          <h3 className="mb-2 text-lg font-semibold">Ships</h3>
          <div className="mb-3 max-h-80 flex-grow space-y-2 overflow-y-auto">
            {ships.map(ship => (
              <div
                key={ship.id}
                className={`cursor-pointer rounded p-2 transition-colors ${selectedShip?.id === ship.id ? 'bg-indigo-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                onClick={() => handleSelectShip(ship)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{ship.name}</span>
                  <span
                    className={`ml-2 rounded px-2 py-0.5 text-xs ${getStatusColor(ship.status)}`}
                  >
                    {ship.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400">Category: {ship.category}</div>
              </div>
            ))}
          </div>

          {showCreateUI ? (
            <div className="mt-auto border-t border-gray-600 pt-3">
              <h4 className="text-md mb-2 font-semibold">Create New Ship</h4>
              <input
                type="text"
                placeholder="Ship Name"
                value={newShipName}
                onChange={e => setNewShipName(e.target.value)}
                className="mb-2 w-full rounded border border-gray-600 bg-gray-800 p-2 text-white"
              />
              <select
                value={selectedClassToBuild}
                onChange={e => setSelectedClassToBuild(e.target.value as PlayerShipClass)}
                className="mb-2 w-full rounded border border-gray-600 bg-gray-800 p-2 text-white"
              >
                {Object.keys(PlayerShipClass).map(key => (
                  <option key={key} value={PlayerShipClass[key as keyof typeof PlayerShipClass]}>
                    {key}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateUI(false)}
                  className="rounded bg-gray-600 px-3 py-1 text-sm font-semibold hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBuildNewShip}
                  className="rounded bg-indigo-600 px-3 py-1 text-sm font-semibold hover:bg-indigo-700"
                >
                  Confirm Build
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateUI(true)}
              className="mt-auto w-full rounded bg-green-600 py-2 text-sm font-semibold hover:bg-green-700"
            >
              Build New Ship
            </button>
          )}
        </div>

        <div className="col-span-2 rounded bg-gray-700 p-3">
          {selectedShip ? (
            <div>
              <h3 className="mb-2 text-lg font-semibold">{selectedShip.name} Details</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <p>ID:</p>
                <p className="text-gray-300">{selectedShip.id}</p>
                <p>Category:</p>
                <p className="text-gray-300">{selectedShip.category}</p>
                <p>Status:</p>
                <p className="text-gray-300">{selectedShip.status}</p>
                <p>Speed:</p>
                <p className="text-gray-300">{selectedShip.stats.speed}</p>
                <p>Turn Rate:</p>
                <p className="text-gray-300">{selectedShip.stats.turnRate}</p>
                <p>Cargo:</p>
                <p className="text-gray-300">{selectedShip.stats.cargo}</p>
                <p>Energy:</p>
                <p className="text-gray-300">
                  {selectedShip.stats.energy} / {selectedShip.stats.maxEnergy}
                </p>
                <p>Shield:</p>
                <p className="text-gray-300">{selectedShip.stats.defense.shield}</p>
                <p>Armor:</p>
                <p className="text-gray-300">{selectedShip.stats.defense.armor}</p>
                <p>Evasion:</p>
                <p className="text-gray-300">{selectedShip.stats.defense.evasion}</p>
                {selectedShip.stats.defense.regeneration !== undefined && (
                  <>
                    <p>Regen:</p>
                    <p className="text-gray-300">{selectedShip.stats.defense.regeneration}/s</p>
                  </>
                )}
              </div>

              <div className="mt-4 space-x-2">
                <button
                  onClick={handleDeployShip}
                  disabled={!selectedShip || selectedShip.status !== ShipStatus.READY}
                  className="rounded bg-green-500 px-3 py-1 text-sm hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Deploy
                </button>
                <button
                  onClick={handleDockShip}
                  disabled={
                    !selectedShip ||
                    selectedShip.status === ShipStatus.READY ||
                    selectedShip.status === ShipStatus.DISABLED
                  }
                  className="rounded bg-blue-500 px-3 py-1 text-sm hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Dock
                </button>
                <button
                  onClick={handleRepairShip}
                  disabled={!selectedShip || selectedShip.status !== ShipStatus.DAMAGED}
                  className="rounded bg-yellow-500 px-3 py-1 text-sm hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Repair
                </button>
                <button
                  onClick={handleRefuelShip}
                  disabled={!selectedShip || selectedShip.status === ShipStatus.DISABLED}
                  className="rounded bg-purple-500 px-3 py-1 text-sm hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Refuel
                </button>
                <button
                  onClick={handleUpgradeShip}
                  disabled={!selectedShip || selectedShip.status !== ShipStatus.READY}
                  className="rounded bg-indigo-500 px-3 py-1 text-sm hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Upgrade
                </button>
                <button
                  onClick={handleRemoveShip}
                  disabled={!selectedShip}
                  className="rounded bg-red-500 px-3 py-1 text-sm hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400">Select a ship to view details</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipHangar;
