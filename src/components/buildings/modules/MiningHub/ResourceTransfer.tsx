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
    <div className="pointer-events-none absolute inset-0">
      {transfers.map(transfer => (
        <div
          key={transfer.id}
          className="absolute"
          style={{
            left: `${transfer.progress * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="flex items-center space-x-1 rounded-full border border-indigo-500/50 bg-indigo-900/80 px-2 py-1 backdrop-blur-sm">
            <span className="text-xs text-indigo-200">+{transfer.amount}</span>
            <ArrowRight className="h-3 w-3 text-indigo-400" />
          </div>
        </div>
      ))}
    </div>
  );
}
