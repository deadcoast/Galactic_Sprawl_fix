/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { AlertTriangle, Database, Truck, Zap } from 'lucide-react';
import * as React from 'react';
import { ResourceType } from './../../../../types/resources/ResourceTypes';
interface Resource {
  id: string;
  name: string;
  type: 'mineral' | ResourceType.GAS | ResourceType.EXOTIC;
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

interface ResourceNodeProps {
  resource: Resource;
  isSelected: boolean;
  techBonuses: {
    extractionRate: number;
    storageCapacity: number;
    efficiency: number;
  };
  onClick: () => void;
  assignedShip: string;
}

export function ResourceNode({
  resource,
  isSelected,
  techBonuses,
  onClick,
  assignedShip,
}: ResourceNodeProps) {
  const getTypeColor = (type: Resource['type']) => {
    switch (type) {
      case 'mineral':
        return 'cyan';
      case ResourceType.GAS:
        return 'purple';
      case ResourceType.EXOTIC:
        return 'amber';
      default:
        return 'blue';
    }
  };

  const color = getTypeColor(resource.type);

  const abundanceColor =
    resource.abundance > 0.7
      ? 'bg-emerald-500'
      : resource.abundance > 0.4
        ? 'bg-amber-500'
        : 'bg-red-500';

  const extractionColor =
    resource.extractionRate > 5
      ? 'bg-emerald-500'
      : resource.extractionRate > 2
        ? 'bg-amber-500'
        : 'bg-red-500';

  // Calculate the effective extraction rate with tech bonuses
  const effectiveExtractionRate = resource.extractionRate * (1 + techBonuses.extractionRate);

  // Determine if a ship is assigned to this resource node
  const hasAssignedShip = assignedShip && assignedShip.length > 0;

  return React.createElement(
    'button',
    {
      className: `w-full rounded-lg border ${
        isSelected
          ? `border-${color}-500 bg-${color}-900/30`
          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
      } p-4 text-left transition-colors`,
      onClick: onClick,
    },
    React.createElement(
      'div',
      { className: 'mb-3 flex items-start justify-between' },
      React.createElement(
        'div',
        null,
        React.createElement(
          'h3',
          { className: 'mb-1 text-sm font-medium text-white' },
          resource.name
        ),
        React.createElement(
          'div',
          { className: 'flex items-center text-xs text-gray-400' },
          React.createElement(Database, { className: `mr-1 h-3 w-3 text-${color}-400` }),
          React.createElement('span', { className: 'capitalize' }, resource.type),
          React.createElement('span', { className: 'mx-2' }, '•'),
          React.createElement('span', null, `${resource.distance}ly`)
        )
      ),
      resource.depletion > 0.5 &&
        React.createElement(AlertTriangle, { className: 'h-5 w-5 text-yellow-500' })
    ),

    React.createElement(
      'div',
      { className: 'space-y-2' },
      React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          { className: 'mb-1 flex justify-between text-xs' },
          React.createElement('span', { className: 'text-gray-400' }, 'Abundance'),
          React.createElement(
            'span',
            { className: 'text-gray-300' },
            `${Math.round(resource.abundance * 100)}%`
          )
        ),
        React.createElement(
          'div',
          { className: 'h-1.5 overflow-hidden rounded-full bg-gray-700' },
          React.createElement('div', {
            className: `h-full ${abundanceColor} transition-all`,
            style: { width: `${resource.abundance * 100}%` },
          })
        )
      ),
      React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          { className: 'mb-1 flex justify-between text-xs' },
          React.createElement('span', { className: 'text-gray-400' }, 'Extraction'),
          React.createElement(
            'span',
            { className: 'text-gray-300' },
            `${effectiveExtractionRate.toFixed(1)}/s ${techBonuses.extractionRate > 0 ? `(+${Math.round(techBonuses.extractionRate * 100)}%)` : ''}`
          )
        ),
        React.createElement(
          'div',
          { className: 'h-1.5 overflow-hidden rounded-full bg-gray-700' },
          React.createElement('div', {
            className: `h-full ${extractionColor} transition-all`,
            style: { width: `${Math.min((effectiveExtractionRate / 10) * 100, 100)}%` },
          })
        )
      ),

      // Display assigned ship information if a ship is assigned
      hasAssignedShip &&
        React.createElement(
          'div',
          {
            className:
              'mt-2 flex items-center justify-between rounded bg-gray-700/30 px-2 py-1 text-xs',
          },
          React.createElement(
            'div',
            { className: 'flex items-center' },
            React.createElement(Truck, { className: 'mr-1 h-3 w-3 text-gray-400' }),
            React.createElement('span', { className: 'text-gray-300' }, 'Mining Ship Assigned')
          ),
          React.createElement(
            'div',
            { className: 'flex items-center' },
            React.createElement(Zap, { className: 'mr-1 h-3 w-3 text-gray-400' }),
            React.createElement(
              'span',
              { className: 'text-gray-300' },
              `Efficiency: +${Math.round(techBonuses.efficiency * 100)}%`
            )
          )
        )
    )
  );
}
