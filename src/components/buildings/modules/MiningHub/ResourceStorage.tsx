import { AlertTriangle, Database } from 'lucide-react';

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
  return (
    <div className="rounded-lg bg-gray-800 p-4">
      <h3 className="mb-4 text-sm font-medium text-white">Resource Storage</h3>
      <div className="space-y-4">
        {storageData.map(resource => {
          const usagePercentage = (resource.currentAmount / resource.maxCapacity) * 100;
          const isNearCapacity = usagePercentage > 90;

          return (
            <div key={resource.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm text-gray-200">{resource.resourceType}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {resource.currentAmount.toLocaleString()} /{' '}
                    {resource.maxCapacity.toLocaleString()}
                  </span>
                  {isNearCapacity && (
                    <AlertTriangle className="h-4 w-4 animate-pulse text-yellow-500" />
                  )}
                </div>
              </div>

              {/* Storage Bar */}
              <div className="relative h-2 overflow-hidden rounded-full bg-gray-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isNearCapacity ? 'bg-yellow-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>

              {/* Refining Progress */}
              {resource.refiningAmount > 0 && (
                <div className="flex items-center space-x-2 text-xs">
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-gray-400">
                      <span>Refining</span>
                      <span>{Math.round(resource.refiningProgress * 100)}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-gray-700">
                      <div
                        className="h-full rounded-full bg-teal-500 transition-all"
                        style={{ width: `${resource.refiningProgress * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-teal-400">+{resource.refiningAmount}</span>
                </div>
              )}

              {/* Transfer Rate */}
              {resource.transferRate > 0 && (
                <div className="text-xs text-gray-400">
                  Transfer Rate: +{resource.transferRate}/s
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
