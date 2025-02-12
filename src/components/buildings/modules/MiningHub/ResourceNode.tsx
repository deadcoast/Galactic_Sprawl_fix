import { AlertTriangle, Database } from "lucide-react";

interface Resource {
  id: string;
  name: string;
  type: "mineral" | "gas" | "exotic";
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

export function ResourceNode({
  resource,
  isSelected,
  onClick,
}: ResourceNodeProps) {
  const getTypeColor = (type: Resource["type"]) => {
    switch (type) {
      case "mineral":
        return "cyan";
      case "gas":
        return "purple";
      case "exotic":
        return "amber";
      default:
        return "blue";
    }
  };

  const color = getTypeColor(resource.type);

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? `bg-${color}-900/20 border-${color}-500`
          : `bg-gray-800/50 border-gray-700 hover:border-${color}-500/50`
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-white mb-1">
            {resource.name}
          </h3>
          <div className="flex items-center text-xs text-gray-400">
            <Database className="w-3 h-3 mr-1" />
            <span className="capitalize">{resource.type}</span>
            <span className="mx-2">•</span>
            <span>{resource.distance}ly</span>
          </div>
        </div>
        {resource.depletion > 0.5 && (
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
        )}
      </div>

      {/* Resource Bars */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Abundance</span>
            <span className="text-gray-300">
              {Math.round(resource.abundance * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${resource.abundance * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Extraction</span>
            <span className="text-gray-300">{resource.extractionRate}/s</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
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
