import { AlertTriangle, Database } from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  type: 'mineral' | 'gas' | 'exotic';
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
  onClick: () => void;
  techBonuses: {
    extractionRate: number;
    storageCapacity: number;
    efficiency: number;
  };
}

export function ResourceNode({ resource, isSelected, onClick }: ResourceNodeProps) {
  const getTypeColor = (type: Resource['type']) => {
    switch (type) {
      case 'mineral':
        return 'cyan';
      case 'gas':
        return 'purple';
      case 'exotic':
        return 'amber';
      default:
        return 'blue';
    }
  };

  const color = getTypeColor(resource.type);

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border-2 p-4 transition-all ${
        isSelected
          ? `bg-${color}-900/20 border-${color}-500`
          : `border-gray-700 bg-gray-800/50 hover:border-${color}-500/50`
      }`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="mb-1 text-sm font-medium text-white">{resource.name}</h3>
          <div className="flex items-center text-xs text-gray-400">
            <Database className="mr-1 h-3 w-3" />
            <span className="capitalize">{resource.type}</span>
            <span className="mx-2">•</span>
            <span>{resource.distance}ly</span>
          </div>
        </div>
        {resource.depletion > 0.5 && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
      </div>

      {/* Resource Bars */}
      <div className="space-y-2">
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-gray-400">Abundance</span>
            <span className="text-gray-300">{Math.round(resource.abundance * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${resource.abundance * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-gray-400">Extraction</span>
            <span className="text-gray-300">{resource.extractionRate}/s</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full bg-${color}-400 rounded-full`}
              style={{ width: `${(resource.extractionRate / 30) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
