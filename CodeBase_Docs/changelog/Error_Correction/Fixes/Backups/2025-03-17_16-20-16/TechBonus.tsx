/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { Zap } from 'lucide-react';
import * as React from "react";

interface TechBonusProps {
  bonuses: {
    extractionRate: number;
    storageCapacity: number;
    efficiency: number;
  };
}

export function TechBonus({ bonuses }: TechBonusProps) {
  return React.createElement(
    'div',
    {
      className:
        'absolute right-4 top-4 rounded-lg border border-indigo-500/30 bg-indigo-900/30 px-4 py-2 backdrop-blur-sm',
    },
    React.createElement(
      'div',
      { className: 'flex items-center space-x-2 text-sm' },
      React.createElement(Zap, { className: 'h-4 w-4 text-indigo-400' }),
      React.createElement('span', { className: 'text-indigo-200' }, 'Tech Bonuses Active')
    ),
    React.createElement(
      'div',
      { className: 'mt-2 space-y-1 text-xs' },
      React.createElement(
        'div',
        { className: 'flex items-center justify-between text-indigo-300/70' },
        React.createElement('span', null, 'Extraction Rate'),
        React.createElement('span', null, `+${Math.round((bonuses.extractionRate - 1) * 100)}%`)
      ),
      React.createElement(
        'div',
        { className: 'flex items-center justify-between text-indigo-300/70' },
        React.createElement('span', null, 'Storage Capacity'),
        React.createElement('span', null, `+${Math.round((bonuses.storageCapacity - 1) * 100)}%`)
      ),
      React.createElement(
        'div',
        { className: 'flex items-center justify-between text-indigo-300/70' },
        React.createElement('span', null, 'Mining Efficiency'),
        React.createElement('span', null, `+${Math.round((bonuses.efficiency - 1) * 100)}%`)
      )
    )
  );
}
