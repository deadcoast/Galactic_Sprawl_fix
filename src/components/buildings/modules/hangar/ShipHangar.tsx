import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getResourceManager } from '../../../../managers/ManagerRegistry';
import { OfficerManager } from '../../../../managers/module/OfficerManager';
import { StandardShipHangarManager } from '../../../../managers/ships/ShipManager';
import { PlayerShipClass } from '../../../../types/ships/PlayerShipTypes';
import { UnifiedShip, UnifiedShipStatus } from '../../../../types/ships/UnifiedShipTypes';

interface ShipHangarProps {
  hangarId: string;
  capacity?: number;
}

/**
 * Ship Hangar Component
 * Displays ships and allows interaction using UnifiedShip types and StandardShipHangarManager
 */
export const ShipHangar: React.FC<ShipHangarProps> = ({ hangarId, capacity = 10 }) => {
  const resourceManager = useMemo(() => getResourceManager(), []);
  const officerManager = useMemo(() => new OfficerManager(), []);

  const hangarManager = useMemo(() => {
    console.log(`Creating StandardShipHangarManager for hangar: ${hangarId}`);
    return new StandardShipHangarManager(hangarId, capacity, resourceManager, officerManager);
  }, [hangarId, capacity, resourceManager, officerManager]);

  const [ships, setShips] = useState<UnifiedShip[]>([]);
  const [selectedShip, setSelectedShip] = useState<UnifiedShip | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showCreateUI, setShowCreateUI] = useState(false);
  const [newShipName, setNewShipName] = useState('');
  const [selectedClassToBuild, setSelectedClassToBuild] = useState<PlayerShipClass>(
    PlayerShipClass.STAR_SCHOONER
  );

  const fetchShips = useCallback(async () => {
    try {
      const currentShips = hangarManager.getAllShips();
      if (isMounted) {
        setShips(currentShips);
      }
    } catch (error) {
      console.error('Failed to fetch ships:', error);
    }
  }, [hangarManager, isMounted]);

  useEffect(() => {
    setIsMounted(true);
    fetchShips();

    return () => {
      setIsMounted(false);
    };
  }, [hangarManager, fetchShips]);

  const handleSelectShip = (ship: UnifiedShip) => {
    setSelectedShip(ship);
  };

  const handleDeployShip = () => {
    if (selectedShip) {
      const destination = prompt('Enter destination:');
      if (destination) {
        hangarManager.deployShip(selectedShip.id, destination);
        fetchShips();
      }
    }
  };

  const handleSetReady = () => {
    if (selectedShip) {
      hangarManager.changeShipStatus(selectedShip.id, UnifiedShipStatus.READY);
      fetchShips();
    }
  };

  const handleRepairShip = () => {
    if (selectedShip) {
      hangarManager.repairShip(selectedShip.id, 50);
      fetchShips();
    }
  };

  const handleRemoveShip = () => {
    if (selectedShip) {
      if (window.confirm(`Are you sure you want to remove ${selectedShip.name}?`)) {
        hangarManager.removeShip(selectedShip.id);
        setSelectedShip(null);
        fetchShips();
      }
    }
  };

  const handleConfirmBuildNewShip = () => {
    if (!newShipName || !selectedClassToBuild) {
      alert('Please enter a name and select a class.');
      return;
    }
    try {
      const buildOptions = {
        name: newShipName,
        position: { x: 0, y: 0 },
      };
      const newShip = hangarManager.buildShip(selectedClassToBuild, buildOptions);

      if (newShip) {
        setNewShipName('');
        setShowCreateUI(false);
        fetchShips();
      } else {
        alert('Failed to build ship. Check console for details.');
      }
    } catch (error) {
      console.error('Failed to create ship:', error);
      alert(`Error creating ship: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const getStatusColor = (status: UnifiedShipStatus) => {
    switch (status) {
      case UnifiedShipStatus.READY:
        return 'bg-green-500';
      case UnifiedShipStatus.ENGAGING:
      case UnifiedShipStatus.ATTACKING:
        return 'bg-red-600';
      case UnifiedShipStatus.RETURNING:
      case UnifiedShipStatus.WITHDRAWING:
        return 'bg-orange-500';
      case UnifiedShipStatus.DISABLED:
        return 'bg-gray-600';
      case UnifiedShipStatus.DAMAGED:
        return 'bg-red-500';
      case UnifiedShipStatus.REPAIRING:
        return 'bg-yellow-500';
      case UnifiedShipStatus.UPGRADING:
        return 'bg-indigo-500';
      case UnifiedShipStatus.IDLE:
        return 'bg-blue-500';
      case UnifiedShipStatus.MAINTENANCE:
        return 'bg-teal-500';
      default:
        console.warn(`[ShipHangar] Encountered unexpected ship status: ${status}`);
        return 'bg-gray-500';
    }
  };

  return (
    <div className="ship-hangar rounded-lg bg-gray-800 p-4 text-white">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Ship Hangar: {hangarId}</h2>
        <div className="text-sm">
          Ships: {ships.length} / {capacity}
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
                {Object.values(PlayerShipClass).map(value => (
                  <option key={value} value={value}>
                    {value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
              disabled={ships.length >= capacity}
              className="mt-auto w-full rounded bg-green-600 py-2 text-sm font-semibold hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-500 disabled:opacity-50"
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
                <p className="truncate text-gray-300" title={selectedShip.id}>
                  {selectedShip.id}
                </p>
                <p>Category:</p>
                <p className="text-gray-300">{selectedShip.category}</p>
                <p>Status:</p>
                <p className="text-gray-300">{selectedShip.status}</p>
                <p>Level:</p>
                <p className="text-gray-300">{selectedShip.level ?? 'N/A'}</p>
                <p>Health:</p>
                <p className="text-gray-300">
                  {selectedShip.stats?.health?.toFixed(0) ?? 'N/A'} /{' '}
                  {selectedShip.stats?.maxHealth?.toFixed(0) ?? 'N/A'}
                </p>
                <p>Shield:</p>
                <p className="text-gray-300">
                  {selectedShip.stats?.shield?.toFixed(0) ?? 'N/A'} /{' '}
                  {selectedShip.stats?.maxShield?.toFixed(0) ?? 'N/A'}
                </p>
                <p>Energy/Fuel:</p>
                <p className="text-gray-300">
                  {selectedShip.stats?.energy?.toFixed(0) ?? 'N/A'} /{' '}
                  {selectedShip.stats?.maxEnergy?.toFixed(0) ?? 'N/A'}
                </p>
                <p>Crew:</p>
                <p className="text-gray-300">
                  {selectedShip.crew ?? 'N/A'} / {selectedShip.maxCrew ?? 'N/A'}
                </p>
                {selectedShip.location && (
                  <>
                    <p>Location:</p>
                    <p className="text-gray-300">{selectedShip.location}</p>
                  </>
                )}
                {selectedShip.destination && (
                  <>
                    <p>Destination:</p>
                    <p className="text-gray-300">{selectedShip.destination}</p>
                  </>
                )}
                {selectedShip.cargo && (
                  <>
                    <p>Cargo:</p>
                    <p className="text-gray-300">
                      {selectedShip.cargo.resources instanceof Map
                        ? Array.from(selectedShip.cargo.resources.values()).reduce(
                            (a, b) => a + b,
                            0
                          )
                        : 'N/A'}{' '}
                      / {selectedShip.cargo.capacity ?? 'N/A'}
                    </p>
                  </>
                )}
              </div>

              <div className="mt-4 space-x-2">
                <button
                  onClick={handleDeployShip}
                  disabled={!selectedShip || selectedShip.status !== UnifiedShipStatus.READY}
                  className="rounded bg-green-500 px-3 py-1 text-sm hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Deploy
                </button>
                <button
                  onClick={handleSetReady}
                  disabled={
                    !selectedShip ||
                    selectedShip.status === UnifiedShipStatus.READY ||
                    selectedShip.status === UnifiedShipStatus.ENGAGING ||
                    selectedShip.status === UnifiedShipStatus.DISABLED ||
                    selectedShip.status === UnifiedShipStatus.ATTACKING ||
                    selectedShip.status === UnifiedShipStatus.RETURNING ||
                    selectedShip.status === UnifiedShipStatus.WITHDRAWING
                  }
                  className="rounded bg-blue-500 px-3 py-1 text-sm hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Set Ready
                </button>
                <button
                  onClick={handleRepairShip}
                  disabled={!selectedShip || selectedShip.status !== UnifiedShipStatus.DAMAGED}
                  className="rounded bg-yellow-500 px-3 py-1 text-sm hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Repair
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
