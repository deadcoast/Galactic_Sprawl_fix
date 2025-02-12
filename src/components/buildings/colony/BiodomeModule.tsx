import { AlertTriangle, ArrowUp, Leaf, Zap } from "lucide-react";

interface BiodomeModuleProps {
  moduleData: {
    id: string;
    tier: 1 | 2 | 3;
    foodProduction: number;
    efficiency: number;
    growthBonus: number;
    resourceConversion: number;
    status: "active" | "upgrading" | "maintenance";
    nextCycle: number;
    alerts?: string[];
  };
}

export function BiodomeModule({ moduleData }: BiodomeModuleProps) {
  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1:
        return "emerald";
      case 2:
        return "teal";
      case 3:
        return "cyan";
      default:
        return "green";
    }
  };

  const color = getTierColor(moduleData.tier);

  return (
    <div
      className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 bg-${color}-500/20 rounded-lg`}>
            <Leaf className={`w-6 h-6 text-${color}-400`} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Biodome Module</h3>
            <div className="text-sm text-gray-400">Tier {moduleData.tier}</div>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full bg-${color}-500/20 text-${color}-300 text-sm`}
        >
          {moduleData.status.charAt(0).toUpperCase() +
            moduleData.status.slice(1)}
        </div>
      </div>

      {/* Production Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-400 mb-1">Food Production</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">
              {moduleData.foodProduction}
            </span>
            <span className="text-sm text-gray-400">units/cycle</span>
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Efficiency</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">
              {Math.round(moduleData.efficiency * 100)}
            </span>
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Growth Bonus</span>
            <span className={`text-${color}-400`}>
              +{moduleData.growthBonus}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${moduleData.growthBonus}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Resource Conversion</span>
            <span className={`text-${color}-400`}>
              {Math.round(moduleData.resourceConversion * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${moduleData.resourceConversion * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Next Cycle</span>
            <span className={`text-${color}-400`}>{moduleData.nextCycle}s</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${color}-500 rounded-full animate-pulse`}
              style={{ width: `${(moduleData.nextCycle / 60) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className={`px-4 py-2 bg-${color}-500/20 hover:bg-${color}-500/30 border border-${color}-500/30 rounded-lg text-${color}-200 text-sm transition-colors flex items-center justify-center space-x-2`}
        >
          <ArrowUp className="w-4 h-4" />
          <span>Upgrade Module</span>
        </button>
        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-sm transition-colors flex items-center justify-center space-x-2">
          <Zap className="w-4 h-4" />
          <span>Boost Production</span>
        </button>
      </div>

      {/* Alerts */}
      {moduleData.alerts && moduleData.alerts.length > 0 && (
        <div className="mt-6 space-y-2">
          {moduleData.alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 text-sm text-yellow-300"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
