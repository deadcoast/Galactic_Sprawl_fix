/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { AlertTriangle } from 'lucide-react';
import * as React from 'react';
import { ShipBlueprint, getAvailableShips } from '../../../../config/ShipBlueprints';
import { TechTreeManager } from '../../../../managers/game/techTreeManager';
import { ShipHangarManager } from '../../../../managers/module/ShipHangarManager';
import { ResourceCost } from '../../../../types/resources/ResourceTypes';
import { PlayerShipCategory, PlayerShipClass } from '../../../../types/ships/PlayerShipTypes';

interface ShipBuildingInterfaceProps {
  manager: ShipHangarManager;
  onStartBuild: (shipClass: PlayerShipClass) => void;
}

export function ShipBuildingInterface({ manager, onStartBuild }: ShipBuildingInterfaceProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<PlayerShipCategory | 'all'>('all');
  const [selectedShip, setSelectedShip] = React.useState<ShipBlueprint | null>(null);
  const [availableShips, setAvailableShips] = React.useState<ShipBlueprint[]>([]);
  const [buildableShips, setBuildableShips] = React.useState<Set<PlayerShipClass>>(new Set());
  const [errors, setErrors] = React.useState<Map<PlayerShipClass, string[]>>(new Map());
  const [resourceRequirements, setResourceRequirements] = React.useState<ResourceCost[]>([]);

  // Load available ships based on tech level and other requirements
  React.useEffect(() => {
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
          tech => !TechTreeManager.getNode(tech)?.unlocked
        );
        if (missingTech.length > 0) {
          errors.push(`Missing technologies: ${missingTech.join(', ')}`);
        }
      }

      // Check resource requirements
      ship.requirements.resourceCost.forEach(cost => {
        const requirements = manager.getBuildRequirements(ship.shipClass);
        const available =
          requirements.resourceCost.find((r: { type: string }) => r.type === cost.type)?.amount ||
          0;
        if (available < cost.amount) {
          errors.push(`Insufficient ${cost.type}: ${available}/${cost.amount}`);
        }
      });

      // Check officer requirements
      if (ship.requirements.prerequisites?.officers) {
        const req = ship.requirements.prerequisites.officers;
        const hasQualifiedOfficer = manager.hasOfficerMeetingRequirements(
          req.minLevel,
          req.specialization
        );
        if (!hasQualifiedOfficer) {
          errors.push(`Requires level ${req.minLevel} ${req.specialization} officer`);
        }
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

  // Update resource requirements when ship is selected
  React.useEffect(() => {
    if (selectedShip) {
      const requirements = manager.getBuildRequirements(selectedShip.shipClass);
      setResourceRequirements(requirements.resourceCost);
    } else {
      setResourceRequirements([]);
    }
  }, [selectedShip, manager]);

  const handleStartBuild = () => {
    if (!selectedShip || !buildableShips.has(selectedShip.shipClass)) {
      return;
    }
    onStartBuild(selectedShip.shipClass);
    setSelectedShip(null);
  };

  const filteredShips = availableShips.filter(
    ship => selectedCategory === 'all' || ship.category === selectedCategory
  );

  return React.createElement(
    'div',
    { className: 'flex h-full flex-col' },
    // Category Selection
    React.createElement(
      'div',
      { className: 'mb-4 flex space-x-2' },
      ['all', 'war', 'recon', 'mining'].map(category =>
        React.createElement(
          'button',
          {
            key: category,
            onClick: () => setSelectedCategory(category as PlayerShipCategory | 'all'),
            className: `rounded-lg px-4 py-2 ${
              selectedCategory === category
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`,
          },
          category.charAt(0).toUpperCase() + category.slice(1)
        )
      )
    ),
    // Ship List
    React.createElement(
      'div',
      { className: 'grid flex-1 grid-cols-2 gap-4 overflow-y-auto' },
      filteredShips.map(ship =>
        React.createElement(
          'div',
          {
            key: ship.shipClass,
            onClick: () => setSelectedShip(ship),
            className: `cursor-pointer rounded-lg p-4 ${
              selectedShip?.shipClass === ship.shipClass
                ? 'border border-indigo-500 bg-indigo-900/50'
                : buildableShips.has(ship.shipClass)
                  ? 'border border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  : 'border border-gray-700/50 bg-gray-800/30 opacity-75'
            }`,
          },
          React.createElement(
            'div',
            { className: 'mb-2 flex items-start justify-between' },
            React.createElement(
              'div',
              null,
              React.createElement('h3', { className: 'text-lg font-medium text-white' }, ship.name),
              React.createElement(
                'div',
                { className: 'flex items-center text-sm text-gray-400' },
                React.createElement('span', null, 'Tier ', ship.tier),
                React.createElement('span', { className: 'mx-2' }, '•'),
                React.createElement('span', { className: 'capitalize' }, ship.category)
              )
            ),
            !buildableShips.has(ship.shipClass) &&
              React.createElement(AlertTriangle, { className: 'h-5 w-5 text-amber-500' })
          ),
          React.createElement('p', { className: 'mb-4 text-sm text-gray-400' }, ship.description),
          // Ship Stats
          React.createElement(
            'div',
            { className: 'grid grid-cols-2 gap-2 text-sm' },
            React.createElement(
              'div',
              { className: 'text-gray-400' },
              'Hull: ',
              React.createElement('span', { className: 'text-white' }, ship.baseStats.hull)
            ),
            React.createElement(
              'div',
              { className: 'text-gray-400' },
              'Shield: ',
              React.createElement('span', { className: 'text-white' }, ship.baseStats.shield)
            ),
            React.createElement(
              'div',
              { className: 'text-gray-400' },
              'Energy: ',
              React.createElement('span', { className: 'text-white' }, ship.baseStats.energy)
            ),
            React.createElement(
              'div',
              { className: 'text-gray-400' },
              'Speed: ',
              React.createElement('span', { className: 'text-white' }, ship.baseStats.speed)
            ),
            ship.baseStats.cargo &&
              React.createElement(
                'div',
                { className: 'text-gray-400' },
                'Cargo: ',
                React.createElement('span', { className: 'text-white' }, ship.baseStats.cargo)
              ),
            ship.baseStats.scanRange &&
              React.createElement(
                'div',
                { className: 'text-gray-400' },
                'Scan Range: ',
                React.createElement('span', { className: 'text-white' }, ship.baseStats.scanRange)
              ),
            ship.baseStats.miningRate &&
              React.createElement(
                'div',
                { className: 'text-gray-400' },
                'Mining Rate: ',
                React.createElement('span', { className: 'text-white' }, ship.baseStats.miningRate)
              )
          ),
          // Resource Costs
          React.createElement(
            'div',
            { className: 'mt-4 border-t border-gray-700 pt-4' },
            React.createElement(
              'h4',
              { className: 'mb-2 text-sm font-medium text-gray-300' },
              'Requirements'
            ),
            React.createElement(
              'div',
              { className: 'flex flex-wrap gap-2' },
              ship.requirements.resourceCost.map(cost => {
                const requirements = manager.getBuildRequirements(ship.shipClass);
                const available =
                  requirements.resourceCost.find((r: { type: string }) => r.type === cost.type)
                    ?.amount ?? 0;
                return React.createElement(
                  'div',
                  {
                    key: cost.type,
                    className: `rounded px-2 py-1 text-xs ${
                      available >= cost.amount
                        ? 'bg-gray-700/50 text-gray-300'
                        : 'bg-red-900/50 text-red-300'
                    }`,
                  },
                  `${cost.type}: ${cost.amount}`
                );
              })
            )
          ),
          // Build Errors
          errors.get(ship.shipClass) &&
            React.createElement(
              'div',
              { className: 'mt-2 text-xs text-amber-500' },
              errors
                .get(ship.shipClass)
                ?.map((error, i) => React.createElement('div', { key: i }, error))
            )
        )
      )
    ),
    // Build Controls
    selectedShip &&
      React.createElement(
        'div',
        { className: 'mt-4 rounded-lg bg-gray-800 p-4' },
        React.createElement(
          'div',
          { className: 'flex items-center justify-between' },
          React.createElement(
            'div',
            null,
            React.createElement(
              'h3',
              { className: 'text-lg font-medium text-white' },
              selectedShip.name
            ),
            React.createElement(
              'div',
              { className: 'text-sm text-gray-400' },
              React.createElement(
                'p',
                null,
                `Build Time: ${selectedShip.requirements.buildTime / 1000}s`
              ),
              React.createElement(
                'div',
                { className: 'mt-1 flex gap-2' },
                resourceRequirements.map(cost =>
                  React.createElement(
                    'span',
                    { key: cost.type, className: 'text-gray-300' },
                    `${cost.type}: ${cost.amount}`
                  )
                )
              )
            )
          ),
          React.createElement(
            'button',
            {
              onClick: handleStartBuild,
              disabled: !buildableShips.has(selectedShip.shipClass),
              className: `rounded-lg px-6 py-2 ${
                buildableShips.has(selectedShip.shipClass)
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'cursor-not-allowed bg-gray-700 text-gray-500'
              }`,
            },
            'Build Ship'
          )
        )
      )
  );
}
