import { AlertTriangle, Database } from "lucide-react";

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
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-white mb-4">Resource Storage</h3>
      <div className="space-y-4">
        {storageData.map((resource) => {
          const usagePercentage =
            (resource.currentAmount / resource.maxCapacity) * 100;
          const isNearCapacity = usagePercentage > 90;

          return (
            <div key={resource.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-gray-200">
                    {resource.resourceType}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {resource.currentAmount.toLocaleString()} /{" "}
                    {resource.maxCapacity.toLocaleString()}
                  </span>
                  {isNearCapacity && (
                    <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Storage Bar */}
              <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isNearCapacity ? "bg-yellow-500" : "bg-indigo-500"
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>

              {/* Refining Progress */}
              {resource.refiningAmount > 0 && (
                <div className="flex items-center space-x-2 text-xs">
                  <div className="flex-1">
                    <div className="flex justify-between text-gray-400 mb-1">
                      <span>Refining</span>
                      <span>
                        {Math.round(resource.refiningProgress * 100)}%
                      </span>
                    </div>
                    <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all"
                        style={{ width: `${resource.refiningProgress * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-teal-400">
                    +{resource.refiningAmount}
                  </span>
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
