/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { Rocket, ShieldAlert, Wrench } from 'lucide-react';
import * as React from 'react';
import { hangarRules } from '../../../../config/automation/hangarRules';
import { automationManager } from '../../../../managers/game/AutomationManager';
import { BaseModule } from '../../../../types/buildings/ModuleTypes';

interface HangarModuleProps {
  module: BaseModule;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onOpenShipyard?: () => void;
  onOpenRepairBay?: () => void;
  stats?: {
    shipsInProduction: number;
    shipsNeedingRepair: number;
    maxCapacity: number;
    currentCapacity: number;
  };
}

export function HangarModule({
  module,
  onActivate,
  onDeactivate,
  onOpenShipyard,
  onOpenRepairBay,
  stats = {
    shipsInProduction: 0,
    shipsNeedingRepair: 0,
    maxCapacity: 10,
    currentCapacity: 0,
  },
}: HangarModuleProps) {
  // Register automation rules on mount
  React.useEffect(() => {
    // Register each automation rule
    hangarRules.forEach(rule => {
      automationManager.registerRule(rule);
    });

    // Cleanup on unmount
    return () => {
      hangarRules.forEach(rule => {
        automationManager.removeRule(rule.id);
      });
    };
  }, []);

  return React.createElement(
    'div',
    { className: 'rounded-lg bg-gray-800 p-6' },
    React.createElement(
      'div',
      { className: 'mb-4 flex items-center justify-between' },
      React.createElement(
        'div',
        { className: 'flex items-center space-x-3' },
        React.createElement(
          'div',
          { className: 'rounded-lg bg-indigo-900/50 p-2' },
          React.createElement(Rocket, { className: 'h-6 w-6 text-indigo-400' })
        ),
        React.createElement(
          'div',
          null,
          React.createElement('h3', { className: 'text-lg font-medium text-white' }, module.name),
          React.createElement('div', { className: 'text-sm text-gray-400' }, 'Level ', module.level)
        )
      ),
      React.createElement(
        'button',
        {
          onClick: module.isActive ? onDeactivate : onActivate,
          className: `rounded-lg px-4 py-2 text-sm ${
            module.isActive
              ? 'bg-red-900/50 text-red-400 hover:bg-red-900/70'
              : 'bg-indigo-900/50 text-indigo-400 hover:bg-indigo-900/70'
          }`,
        },
        module.isActive ? 'Deactivate' : 'Activate'
      )
    ),
    React.createElement(
      'div',
      { className: 'space-y-4' },
      React.createElement(
        'div',
        { className: 'rounded-lg bg-gray-900/50 p-4' },
        React.createElement(
          'div',
          { className: 'mb-2 flex items-center justify-between' },
          React.createElement('div', { className: 'text-sm text-gray-400' }, 'Hangar Capacity'),
          React.createElement(
            'div',
            { className: 'text-sm text-gray-300' },
            stats.currentCapacity,
            ' / ',
            stats.maxCapacity
          )
        ),
        React.createElement(
          'div',
          { className: 'h-2 overflow-hidden rounded-full bg-gray-700' },
          React.createElement('div', {
            className: 'h-full bg-indigo-500 transition-all',
            style: {
              width: `${(stats.currentCapacity / stats.maxCapacity) * 100}%`,
            },
          })
        )
      ),
      React.createElement(
        'div',
        { className: 'grid grid-cols-2 gap-4' },
        React.createElement(
          'button',
          {
            onClick: onOpenShipyard,
            disabled: !module.isActive,
            className:
              'group rounded-lg bg-gray-900/50 p-4 hover:bg-gray-900/70 disabled:cursor-not-allowed disabled:opacity-50',
          },
          React.createElement(
            'div',
            { className: 'mb-2 flex items-center space-x-3' },
            React.createElement(Wrench, { className: 'h-5 w-5 text-indigo-400' }),
            React.createElement('div', { className: 'text-sm font-medium text-white' }, 'Shipyard')
          ),
          React.createElement(
            'div',
            { className: 'text-xs text-gray-400' },
            stats.shipsInProduction,
            ' ships in production'
          )
        ),
        React.createElement(
          'button',
          {
            onClick: onOpenRepairBay,
            disabled: !module.isActive,
            className:
              'group rounded-lg bg-gray-900/50 p-4 hover:bg-gray-900/70 disabled:cursor-not-allowed disabled:opacity-50',
          },
          React.createElement(
            'div',
            { className: 'mb-2 flex items-center space-x-3' },
            React.createElement(ShieldAlert, { className: 'h-5 w-5 text-indigo-400' }),
            React.createElement(
              'div',
              { className: 'text-sm font-medium text-white' },
              'Repair Bay'
            )
          ),
          React.createElement(
            'div',
            { className: 'text-xs text-gray-400' },
            stats.shipsNeedingRepair,
            ' ships need repair'
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'rounded-lg bg-gray-900/50 p-4' },
        React.createElement('div', { className: 'mb-2 text-sm text-gray-400' }, 'Production Speed'),
        React.createElement(
          'div',
          { className: 'text-2xl font-bold text-white' },
          100 + module.level * 25,
          '%'
        )
      )
    )
  );
}
