import { AlertTriangle, ChevronRight, Map, Rocket, X } from "lucide-react";

interface Sector {
  id: string;
  name: string;
  status: "unmapped" | "mapped" | "scanning";
  coordinates: { x: number; y: number };
  resourcePotential: number;
  habitabilityScore: number;
  anomalies: Anomaly[];
  lastScanned?: number;
}

interface Anomaly {
  id: string;
  type: "artifact" | "signal" | "phenomenon";
  severity: "low" | "medium" | "high";
  description: string;
  investigated: boolean;
}

interface ExplorationControlsProps {
  sector: Sector;
  onClose: () => void;
}

export function ExplorationControls({
  sector,
  onClose,
}: ExplorationControlsProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{sector.name}</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Sector Status */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white">Sector Status</h3>
          <div
            className={`px-2 py-1 rounded text-sm ${
              sector.status === "mapped"
                ? "bg-green-900/50 text-green-400"
                : sector.status === "scanning"
                  ? "bg-teal-900/50 text-teal-400"
                  : "bg-gray-700 text-gray-400"
            }`}
          >
            {sector.status.charAt(0).toUpperCase() + sector.status.slice(1)}
          </div>
        </div>

        {sector.status !== "unmapped" && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Resource Potential</span>
                <span className="text-teal-400">
                  {Math.round(sector.resourcePotential * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${sector.resourcePotential * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Habitability Score</span>
                <span className="text-teal-400">
                  {Math.round(sector.habitabilityScore * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${sector.habitabilityScore * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Anomalies */}
      {sector.anomalies.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-white mb-3">
            Detected Anomalies
          </h3>
          <div className="space-y-2">
            {sector.anomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className={`p-3 rounded-lg ${
                  anomaly.severity === "high"
                    ? "bg-red-900/20 border border-red-700/30"
                    : anomaly.severity === "medium"
                      ? "bg-yellow-900/20 border border-yellow-700/30"
                      : "bg-blue-900/20 border border-blue-700/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        anomaly.severity === "high"
                          ? "text-red-400"
                          : anomaly.severity === "medium"
                            ? "text-yellow-400"
                            : "text-blue-400"
                      }`}
                    />
                    <span className="text-sm font-medium text-white">
                      {anomaly.type.charAt(0).toUpperCase() +
                        anomaly.type.slice(1)}
                    </span>
                  </div>
                  {anomaly.investigated ? (
                    <span className="text-xs text-green-400">Investigated</span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Pending Investigation
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-300">{anomaly.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-auto">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>Quick Actions</span>
          <ChevronRight className="w-4 h-4" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="px-4 py-2 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 rounded-lg text-teal-200 text-sm transition-colors flex items-center justify-center space-x-2">
            <Rocket className="w-4 h-4" />
            <span>Deploy Recon Ship</span>
          </button>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm transition-colors flex items-center justify-center space-x-2">
            <Map className="w-4 h-4" />
            <span>View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}
