import {
  AlertTriangle,
  Battery,
  Beaker,
  CheckCircle,
  Cpu,
  Leaf,
  Package,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { ResourceType } from './../../../types/resources/ResourceTypes';

interface ResourceData {
  type:
    | ResourceType.ENERGY
    | 'materials'
    | ResourceType.FOOD
    | ResourceType.RESEARCH
    | 'technology'
    | ResourceType.POPULATION;
  name: string;
  production: number;
  consumption: number;
  storage: number;
  capacity: number;
}

interface ResourceDashboardProps {
  colonyId: string;
  resources: ResourceData[];
  onResourceClick?: (resourceType: ResourceData['type']) => void;
}

export function ResourceDashboard({ resources, onResourceClick }: ResourceDashboardProps) {
  // Get resource icon
  const getResourceIcon = (type: ResourceData['type']) => {
    switch (type) {
      case ResourceType.ENERGY:
        return <Battery className="h-5 w-5 text-yellow-400" />;
      case 'materials':
        return <Package className="h-5 w-5 text-amber-400" />;
      case ResourceType.FOOD:
        return <Leaf className="h-5 w-5 text-green-400" />;
      case ResourceType.RESEARCH:
        return <Beaker className="h-5 w-5 text-blue-400" />;
      case 'technology':
        return <Cpu className="h-5 w-5 text-purple-400" />;
      case ResourceType.POPULATION:
        return <Users className="h-5 w-5 text-indigo-400" />;
      default:
        return <Package className="h-5 w-5 text-gray-400" />;
    }
  };

  // Calculate net change
  const getNetChange = (resource: ResourceData) => {
    return resource.production - resource.consumption;
  };

  // Get status indicator
  const getStatusIndicator = (resource: ResourceData) => {
    const netChange = getNetChange(resource);
    const storagePercentage = (resource.storage / resource.capacity) * 100;

    if (netChange < 0 && resource.storage < Math.abs(netChange) * 10) {
      // Critical: Negative change and less than 10 cycles of resources left
      return (
        <div className="flex items-center space-x-1 text-red-400">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs">Critical</span>
        </div>
      );
    } else if (netChange < 0) {
      // warning: Negative change
      return (
        <div className="flex items-center space-x-1 text-amber-400">
          <TrendingDown className="h-4 w-4" />
          <span className="text-xs">Depleting</span>
        </div>
      );
    } else if (storagePercentage > 90) {
      // warning: Almost full
      return (
        <div className="flex items-center space-x-1 text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs">Storage Full</span>
        </div>
      );
    } else if (netChange > 0) {
      // Good: Positive change
      return (
        <div className="flex items-center space-x-1 text-green-400">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs">Growing</span>
        </div>
      );
    } else {
      // Neutral: No change
      return (
        <div className="flex items-center space-x-1 text-gray-400">
          <CheckCircle className="h-4 w-4" />
          <span className="text-xs">Stable</span>
        </div>
      );
    }
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <h3 className="mb-4 text-lg font-medium text-white">Resource Dashboard</h3>

      <div className="space-y-4">
        {resources.map(resource => (
          <div
            key={resource.type}
            className="rounded-md border border-gray-700 bg-gray-900 p-3 transition-colors hover:bg-gray-800"
            onClick={() => onResourceClick?.(resource.type)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getResourceIcon(resource.type)}
                <span className="text-sm font-medium text-white">{resource.name}</span>
              </div>
              {getStatusIndicator(resource)}
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-gray-400">Storage</div>
                <div className="text-sm font-medium text-white">
                  {resource.storage.toLocaleString()} / {resource.capacity.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400">Production</div>
                <div className="text-sm font-medium text-green-400">
                  +{resource.production.toLocaleString()}/cycle
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400">Consumption</div>
                <div className="text-sm font-medium text-red-400">
                  -{resource.consumption.toLocaleString()}/cycle
                </div>
              </div>
            </div>

            {/* Storage Bar */}
            <div className="mt-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                <div
                  className={`h-full ${
                    resource.storage / resource.capacity > 0.9
                      ? 'bg-amber-500'
                      : resource.storage / resource.capacity > 0.5
                        ? 'bg-green-500'
                        : resource.storage / resource.capacity < 0.2
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                  }`}
                  style={{ width: `${(resource.storage / resource.capacity) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Net Change */}
            <div className="mt-2 flex items-center justify-end">
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-400">Net:</span>
                <span
                  className={`text-xs font-medium ${
                    getNetChange(resource) > 0
                      ? 'text-green-400'
                      : getNetChange(resource) < 0
                        ? 'text-red-400'
                        : 'text-gray-400'
                  }`}
                >
                  {getNetChange(resource) > 0 ? '+' : ''}
                  {getNetChange(resource).toLocaleString()}/cycle
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
