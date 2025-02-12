import React from 'react';
import { ArrowRight } from 'lucide-react';

interface TransferAnimation {
  id: string;
  sourceId: string;
  targetId: string;
  resourceType: string;
  amount: number;
  progress: number;
}

interface ResourceTransferProps {
  transfers: TransferAnimation[];
}

export function ResourceTransfer({ transfers }: ResourceTransferProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {transfers.map(transfer => (
        <div
          key={transfer.id}
          className="absolute"
          style={{
            left: `${transfer.progress * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="flex items-center space-x-1 bg-indigo-900/80 backdrop-blur-sm px-2 py-1 rounded-full border border-indigo-500/50">
            <span className="text-xs text-indigo-200">+{transfer.amount}</span>
            <ArrowRight className="w-3 h-3 text-indigo-400" />
          </div>
        </div>
      ))}
    </div>
  );
}