import * as React from "react";
import { AlertTriangle, ChevronRight, Map, Rocket, X } from 'lucide-react';

interface Sector {
  id: string;
  name: string;
  status: 'unmapped' | 'mapped' | 'scanning';
  coordinates: { x: number; y: number };
  resourcePotential: number;
  habitabilityScore: number;
  anomalies: Anomaly[];
  lastScanned?: number;
}

interface Anomaly {
  id: string;
  type: 'artifact' | 'signal' | 'phenomenon';
  severity: 'low' | 'medium' | 'high';
  description: string;
  investigated: boolean;
}

interface ExplorationControlsProps {
  sector: Sector;
  onClose: () => void;
}

export function ExplorationControls({ sector, onClose }: ExplorationControlsProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{sector.name}</h2>
        <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-gray-800">
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Sector Status */}
      <div className="mb-4 rounded-lg bg-gray-800 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Sector Status</h3>
          <div
            className={`rounded px-2 py-1 text-sm ${
              sector.status === 'mapped'
                ? 'bg-green-900/50 text-green-400'
                : sector.status === 'scanning'
                  ? 'bg-teal-900/50 text-teal-400'
                  : 'bg-gray-700 text-gray-400'
            }`}
          >
            {sector.status.charAt(0).toUpperCase() + sector.status.slice(1)}
          </div>
        </div>

        {sector.status !== 'unmapped' && (
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-400">Resource Potential</span>
                <span className="text-teal-400">{Math.round(sector.resourcePotential * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-teal-500"
                  style={{ width: `${sector.resourcePotential * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-400">Habitability Score</span>
                <span className="text-teal-400">{Math.round(sector.habitabilityScore * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-teal-500"
                  style={{ width: `${sector.habitabilityScore * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Anomalies */}
      {sector.anomalies.length > 0 && (
        <div className="mb-4 rounded-lg bg-gray-800 p-4">
          <h3 className="mb-3 text-sm font-medium text-white">Detected Anomalies</h3>
          <div className="space-y-2">
            {sector.anomalies.map(anomaly => (
              <div
                key={anomaly.id}
                className={`rounded-lg p-3 ${
                  anomaly.severity === 'high'
                    ? 'border border-red-700/30 bg-red-900/20'
                    : anomaly.severity === 'medium'
                      ? 'border border-yellow-700/30 bg-yellow-900/20'
                      : 'border border-blue-700/30 bg-blue-900/20'
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle
                      className={`h-4 w-4 ${
                        anomaly.severity === 'high'
                          ? 'text-red-400'
                          : anomaly.severity === 'medium'
                            ? 'text-yellow-400'
                            : 'text-blue-400'
                      }`}
                    />
                    <span className="text-sm font-medium text-white">
                      {anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)}
                    </span>
                  </div>
                  {anomaly.investigated ? (
                    <span className="text-xs text-green-400">Investigated</span>
                  ) : (
                    <span className="text-xs text-gray-400">Pending Investigation</span>
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
        <div className="mb-2 flex items-center justify-between text-sm text-gray-400">
          <span>Quick Actions</span>
          <ChevronRight className="h-4 w-4" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center space-x-2 rounded-lg border border-teal-500/30 bg-teal-600/20 px-4 py-2 text-sm text-teal-200 transition-colors hover:bg-teal-600/30">
            <Rocket className="h-4 w-4" />
            <span>Deploy Recon Ship</span>
          </button>
          <button className="flex items-center justify-center space-x-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700">
            <Map className="h-4 w-4" />
            <span>View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}
