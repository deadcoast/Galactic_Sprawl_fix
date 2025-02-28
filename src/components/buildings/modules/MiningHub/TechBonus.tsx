import { Zap } from 'lucide-react';

interface TechBonusProps {
  bonuses: {
    extractionRate: number;
    storageCapacity: number;
    efficiency: number;
  };
}

export function TechBonus({ bonuses }: TechBonusProps) {
  return (
    <div className="absolute right-4 top-4 rounded-lg border border-indigo-500/30 bg-indigo-900/30 px-4 py-2 backdrop-blur-sm">
      <div className="flex items-center space-x-2 text-sm">
        <Zap className="h-4 w-4 text-indigo-400" />
        <span className="text-indigo-200">Tech Bonuses Active</span>
      </div>
      <div className="mt-2 space-y-1 text-xs">
        <div className="flex items-center justify-between text-indigo-300/70">
          <span>Extraction Rate</span>
          <span>+{Math.round((bonuses.extractionRate - 1) * 100)}%</span>
        </div>
        <div className="flex items-center justify-between text-indigo-300/70">
          <span>Storage Capacity</span>
          <span>+{Math.round((bonuses.storageCapacity - 1) * 100)}%</span>
        </div>
        <div className="flex items-center justify-between text-indigo-300/70">
          <span>Mining Efficiency</span>
          <span>+{Math.round((bonuses.efficiency - 1) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
