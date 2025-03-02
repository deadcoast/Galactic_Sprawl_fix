/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { AlertTriangle, Database } from 'lucide-react';
import * as React from 'react';

interface StorageData {
  id: string;
  resourceType: string;
  currentAmount: number;
  maxCapacity: number;
  refiningAmount: number;
  refiningProgress: number;
  transferRate: number;
}

interface ResourceStorageProps {
  storageData: StorageData[];
}

export function ResourceStorage({ storageData }: ResourceStorageProps) {
  return React.createElement(
    'div',
    { className: 'rounded-lg bg-gray-800 p-4' },
    React.createElement(
      'h3',
      { className: 'mb-4 text-sm font-medium text-white' },
      'Resource Storage'
    ),
    React.createElement(
      'div',
      { className: 'space-y-4' },
      storageData.map(resource => {
        const usagePercentage = (resource.currentAmount / resource.maxCapacity) * 100;
        const isNearCapacity = usagePercentage > 90;

        return React.createElement(
          'div',
          { key: resource.id, className: 'space-y-2' },
          React.createElement(
            'div',
            { className: 'flex items-center justify-between' },
            React.createElement(
              'div',
              { className: 'flex items-center space-x-2' },
              React.createElement(Database, { className: 'h-4 w-4 text-indigo-400' }),
              React.createElement(
                'span',
                { className: 'text-sm text-gray-200' },
                resource.resourceType
              )
            ),
            React.createElement(
              'div',
              { className: 'flex items-center space-x-2' },
              React.createElement(
                'span',
                { className: 'text-sm text-gray-400' },
                `${resource.currentAmount.toLocaleString()} / ${resource.maxCapacity.toLocaleString()}`
              ),
              isNearCapacity &&
                React.createElement(AlertTriangle, {
                  className: 'h-4 w-4 animate-pulse text-yellow-500',
                })
            )
          ),

          /* Storage Bar */
          React.createElement(
            'div',
            { className: 'relative h-2 overflow-hidden rounded-full bg-gray-700' },
            React.createElement('div', {
              className: `h-full rounded-full transition-all duration-500 ${
                isNearCapacity ? 'bg-yellow-500' : 'bg-indigo-500'
              }`,
              style: { width: `${usagePercentage}%` },
            })
          ),

          /* Refining Progress */
          resource.refiningAmount > 0 &&
            React.createElement(
              'div',
              { className: 'flex items-center space-x-2 text-xs' },
              React.createElement(
                'div',
                { className: 'flex-1' },
                React.createElement(
                  'div',
                  { className: 'mb-1 flex justify-between text-gray-400' },
                  React.createElement('span', null, 'Refining'),
                  React.createElement(
                    'span',
                    null,
                    `${Math.round(resource.refiningProgress * 100)}%`
                  )
                ),
                React.createElement(
                  'div',
                  { className: 'h-1 overflow-hidden rounded-full bg-gray-700' },
                  React.createElement('div', {
                    className: 'h-full rounded-full bg-teal-500 transition-all',
                    style: { width: `${resource.refiningProgress * 100}%` },
                  })
                )
              ),
              React.createElement(
                'span',
                { className: 'text-teal-400' },
                `+${resource.refiningAmount}`
              )
            ),

          /* Transfer Rate */
          resource.transferRate > 0 &&
            React.createElement(
              'div',
              { className: 'text-xs text-gray-400' },
              `Transfer Rate: +${resource.transferRate}/s`
            )
        );
      })
    )
  );
}
