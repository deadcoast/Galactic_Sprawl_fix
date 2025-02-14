import { useState, useEffect } from 'react';
import { PlayerShipClass, PlayerShipCategory } from '../../../../types/ships/PlayerShipTypes';
import { ShipHangarManager } from '../../../../managers/ShipHangarManager';
import { ResourceCost } from '../../../../types/resources/ResourceTypes';
import { Tier } from '../../../../types/core/GameTypes';
import { ShipBuildRequirements } from '../../../../types/buildings/ShipHangarTypes';
import { ShipBlueprint, getAvailableShips } from '../../../../config/ShipBlueprints';
import { techTreeManager } from '../../../../managers/TechTreeManager';
import { AlertTriangle, Rocket, Shield } from 'lucide-react';

interface ShipBuildingInterfaceProps {
  manager: ShipHangarManager;
  onStartBuild: (shipClass: PlayerShipClass) => void;
}

export function ShipBuildingInterface({ manager, onStartBuild }: ShipBuildingInterfaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<PlayerShipCategory | 'all'>('all');
  const [selectedShip, setSelectedShip] = useState<ShipBlueprint | null>(null);
  const [availableShips, setAvailableShips] = useState<ShipBlueprint[]>([]);
  const [buildableShips, setBuildableShips] = useState<Set<PlayerShipClass>>(new Set());
  const [errors, setErrors] = useState<Map<PlayerShipClass, string[]>>(new Map());

  // Load available ships based on tech level and other requirements
  useEffect(() => {
    const currentTier = manager.getCurrentTier();
    const ships = getAvailableShips(currentTier);
    setAvailableShips(ships);

    // Check which ships are buildable
    const buildable = new Set<PlayerShipClass>();
    const newErrors = new Map<PlayerShipClass, string[]>();

    ships.forEach(ship => {
      const errors: string[] = [];

      // Check tech requirements
      if (ship.requirements.prerequisites?.technology) {
        const missingTech = ship.requirements.prerequisites.technology.filter(
          tech => !techTreeManager.getNode(tech)?.unlocked
        );
        if (missingTech.length > 0) {
          errors.push(`Missing technologies: ${missingTech.join(', ')}`);
        }
      }

      // Check resource requirements
      ship.requirements.resourceCost.forEach(cost => {
        const requirements = manager.getBuildRequirements(ship.shipClass);
        const available = requirements.resourceCost.find(r => r.type === cost.type)?.amount || 0;
        if (available < cost.amount) {
          errors.push(`Insufficient ${cost.type}: ${available}/${cost.amount}`);
        }
      });

      // Check officer requirements
      if (ship.requirements.prerequisites?.officers) {
        const req = ship.requirements.prerequisites.officers;
        // TODO: Add officer requirement checking
        // errors.push(`Requires level ${req.minLevel} ${req.specialization} officer`);
      }

      if (errors.length === 0) {
        buildable.add(ship.shipClass);
      } else {
        newErrors.set(ship.shipClass, errors);
      }
    });

    setBuildableShips(buildable);
    setErrors(newErrors);
  }, [manager]);

  const handleStartBuild = () => {
    if (!selectedShip || !buildableShips.has(selectedShip.shipClass)) return;
    onStartBuild(selectedShip.shipClass);
    setSelectedShip(null);
  };

  const filteredShips = availableShips.filter(
    ship => selectedCategory === 'all' || ship.category === selectedCategory
  );

  return (
    <div className="h-full flex flex-col">
      {/* Category Selection */}
      <div className="flex space-x-2 mb-4">
        {['all', 'war', 'recon', 'mining'].map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category as PlayerShipCategory | 'all')}
            className={`px-4 py-2 rounded-lg ${
              selectedCategory === category
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Ship List */}
      <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto">
        {filteredShips.map(ship => (
          <div
            key={ship.shipClass}
            onClick={() => setSelectedShip(ship)}
            className={`p-4 rounded-lg cursor-pointer ${
              selectedShip?.shipClass === ship.shipClass
                ? 'bg-indigo-900/50 border border-indigo-500'
                : buildableShips.has(ship.shipClass)
                  ? 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                  : 'bg-gray-800/30 border border-gray-700/50 opacity-75'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-medium text-white">{ship.name}</h3>
                <div className="flex items-center text-sm text-gray-400">
                  <span>Tier {ship.tier}</span>
                  <span className="mx-2">•</span>
                  <span className="capitalize">{ship.category}</span>
                </div>
              </div>
              {!buildableShips.has(ship.shipClass) && (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
            </div>

            <p className="text-sm text-gray-400 mb-4">{ship.description}</p>

            {/* Ship Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-400">
                Hull: <span className="text-white">{ship.baseStats.hull}</span>
              </div>
              <div className="text-gray-400">
                Shield: <span className="text-white">{ship.baseStats.shield}</span>
              </div>
              <div className="text-gray-400">
                Energy: <span className="text-white">{ship.baseStats.energy}</span>
              </div>
              <div className="text-gray-400">
                Speed: <span className="text-white">{ship.baseStats.speed}</span>
              </div>
              {ship.baseStats.cargo && (
                <div className="text-gray-400">
                  Cargo: <span className="text-white">{ship.baseStats.cargo}</span>
                </div>
              )}
              {ship.baseStats.scanRange && (
                <div className="text-gray-400">
                  Scan Range: <span className="text-white">{ship.baseStats.scanRange}</span>
                </div>
              )}
              {ship.baseStats.miningRate && (
                <div className="text-gray-400">
                  Mining Rate: <span className="text-white">{ship.baseStats.miningRate}</span>
                </div>
              )}
            </div>

            {/* Resource Costs */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Requirements</h4>
              <div className="flex flex-wrap gap-2">
                {ship.requirements.resourceCost.map(cost => {
                  const requirements = manager.getBuildRequirements(ship.shipClass);
                  const available =
                    requirements.resourceCost.find(r => r.type === cost.type)?.amount || 0;
                  return (
                    <div
                      key={cost.type}
                      className={`px-2 py-1 rounded text-xs ${
                        available >= cost.amount
                          ? 'bg-gray-700/50 text-gray-300'
                          : 'bg-red-900/50 text-red-300'
                      }`}
                    >
                      {cost.type}: {cost.amount}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Build Errors */}
            {errors.get(ship.shipClass) && (
              <div className="mt-2 text-xs text-amber-500">
                {errors.get(ship.shipClass)?.map((error, i) => <div key={i}>{error}</div>)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Build Controls */}
      {selectedShip && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white">{selectedShip.name}</h3>
              <p className="text-sm text-gray-400">
                Build Time: {selectedShip.requirements.buildTime / 1000}s
              </p>
            </div>
            <button
              onClick={handleStartBuild}
              disabled={!buildableShips.has(selectedShip.shipClass)}
              className={`px-6 py-2 rounded-lg ${
                buildableShips.has(selectedShip.shipClass)
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Build Ship
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
