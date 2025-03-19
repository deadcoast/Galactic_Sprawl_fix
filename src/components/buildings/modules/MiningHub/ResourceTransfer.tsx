import { ResourceType } from './../../../../types/resources/ResourceTypes';
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { ArrowRight } from 'lucide-react';
import * as React from 'react';

interface TransferAnimation {
  id: string;
  sourceId: string;
  targetId: string;
  resourceType: ResourceType;
  amount: number;
  progress: number;
}

interface ResourceTransferProps {
  transfers: TransferAnimation[];
}

export function ResourceTransfer({ transfers }: ResourceTransferProps) {
  return React.createElement(
    'div',
    { className: 'pointer-events-none absolute inset-0' },
    transfers.map(transfer =>
      React.createElement(
        'div',
        {
          key: transfer.id,
          className: 'absolute',
          style: {
            left: `${transfer.progress * 100}%`,
            top: '50%',
            transform: `translate(-50%, -50%)`,
          },
        },
        React.createElement(
          'div',
          {
            className:
              'flex items-center space-x-1 rounded-full border border-indigo-500/50 bg-indigo-900/80 px-2 py-1 backdrop-blur-sm',
          },
          React.createElement(
            'span',
            { className: 'text-xs text-indigo-200' },
            `+${transfer.amount}`
          ),
          React.createElement(ArrowRight, { className: 'h-3 w-3 text-indigo-400' })
        )
      )
    )
  );
}
