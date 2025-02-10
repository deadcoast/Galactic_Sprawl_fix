import React from 'react';
import { Rocket, Users, ArrowRight, Settings, AlertTriangle } from 'lucide-react';

interface ExpansionData {
  id: string;
  targetSystem: string;
  status: 'preparing' | 'launching' | 'colonizing' | 'complete';
  progress: number;
  population: number;
  resources: { type: string; amount: number }[];
  estimatedTime: number;
  thresholds: {
    population: number;
    resources: { type: string; amount: number }[];
  };
}

interface AutomatedExpansionProps {
  expansions: ExpansionData[];
  onCancelExpansion: (id: string) => void;
  onModifyThresholds: (thresholds: ExpansionData['thresholds']) => void;
}

export function AutomatedExpansion({ expansions, onCancelExpansion, onModifyThresholds }: AutomatedExpansionProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Rocket className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-lg font-medium text-white">Automated Expansion</h3>
        </div>
        <button
          onClick={() => {}}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Active Expansions */}
      <div className="space-y-4">
        {expansions.map(expansion => (
          <div
            key={expansion.id}
            className="p-4 bg-gray-700/50 rounded-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-white font-medium mb-1">
                  {expansion.targetSystem}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{expansion.population.toLocaleString()} Colonists</span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${
                expansion.status === 'preparing'
                  ? 'bg-blue-900/50 text-blue-400'
                  : expansion.status === 'launching'
                  ? 'bg-yellow-900/50 text-yellow-400'
                  : expansion.status === 'colonizing'
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-gray-900/50 text-gray-400'
              }`}>
                {expansion.status.charAt(0).toUpperCase() + expansion.status.slice(1)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-gray-300">{Math.round(expansion.progress * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${expansion.progress * 100}%` }}
                />
              </div>
            </div>

            {/* Resource Requirements */}
            <div className="space-y-2 mb-4">
              <div className="text-sm text-gray-400">Required Resources</div>
              <div className="flex flex-wrap gap-2">
                {expansion.resources.map(resource => (
                  <div
                    key={resource.type}
                    className="px-2 py-1 bg-gray-800 rounded-lg text-sm flex items-center space-x-2"
                  >
                    <span className="text-gray-300">{resource.type}</span>
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">{resource.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Estimate */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Estimated Time</span>
              <span className="text-gray-300">{Math.ceil(expansion.estimatedTime / 60)}m</span>
            </div>

            {/* Cancel Button */}
            {expansion.status !== 'complete' && (
              <button
                onClick={() => onCancelExpansion(expansion.id)}
                className="mt-4 w-full px-4 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-700/30 rounded-lg text-red-400 text-sm transition-colors"
              >
                Cancel Expansion
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Threshold Settings */}
      <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-gray-300">Expansion Thresholds</div>
          <button
            onClick={() => {}}
            className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
          >
            Modify
          </button>
        </div>

        {/* Population Threshold */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Population Trigger</span>
            <span className="text-gray-300">90%</span>
          </div>
          <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500/50 rounded-full"
              style={{ width: '90%' }}
            />
          </div>
        </div>

        {/* Resource Thresholds */}
        <div className="text-sm text-gray-400 mb-2">Resource Triggers</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg">
            <span className="text-gray-300">Storage Capacity</span>
            <span className="text-gray-400">{'>'} 85%</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg">
            <span className="text-gray-300">Production Rate</span>
            <span className="text-gray-400">{'>'} 150/s</span>
          </div>
        </div>
      </div>

      {/* Warnings */}
      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg flex items-start space-x-2">
        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
        <div className="text-sm text-yellow-200">
          Automated expansion requires stable resource production and population growth. Monitor your colony's status to ensure successful expansion.
        </div>
      </div>
    </div>
  );
}