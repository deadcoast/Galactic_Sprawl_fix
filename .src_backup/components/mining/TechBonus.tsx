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
    <div className="absolute top-4 right-4 px-4 py-2 bg-indigo-900/30 border border-indigo-500/30 rounded-lg backdrop-blur-sm">
      <div className="flex items-center space-x-2 text-sm">
        <Zap className="w-4 h-4 text-indigo-400" />
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