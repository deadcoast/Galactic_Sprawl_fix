import * as React from "react";
import { AlertTriangle, ArrowUp, Leaf, Zap } from 'lucide-react';

interface BiodomeModuleProps {
  moduleData: {
    id: string;
    tier: 1 | 2 | 3;
    foodProduction: number;
    efficiency: number;
    growthBonus: number;
    resourceConversion: number;
    status: 'active' | 'upgrading' | 'maintenance';
    nextCycle: number;
    alerts?: string[];
  };
}

export function BiodomeModule({ moduleData }: BiodomeModuleProps) {
  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1:
        return 'emerald';
      case 2:
        return 'teal';
      case 3:
        return 'cyan';
      default:
        return 'green';
    }
  };

  const color = getTierColor(moduleData.tier);

  return (
    <div className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6`}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 bg-${color}-500/20 rounded-lg`}>
            <Leaf className={`h-6 w-6 text-${color}-400`} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Biodome Module</h3>
            <div className="text-sm text-gray-400">Tier {moduleData.tier}</div>
          </div>
        </div>
        <div className={`rounded-full px-3 py-1 bg-${color}-500/20 text-${color}-300 text-sm`}>
          {moduleData.status.charAt(0).toUpperCase() + moduleData.status.slice(1)}
        </div>
      </div>

      {/* Production Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 text-sm text-gray-400">Food Production</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">{moduleData.foodProduction}</span>
            <span className="text-sm text-gray-400">units/cycle</span>
          </div>
        </div>
        <div>
          <div className="mb-1 text-sm text-gray-400">Efficiency</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">
              {Math.round(moduleData.efficiency * 100)}
            </span>
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="mb-6 space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Growth Bonus</span>
            <span className={`text-${color}-400`}>+{moduleData.growthBonus}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${moduleData.growthBonus}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Resource Conversion</span>
            <span className={`text-${color}-400`}>
              {Math.round(moduleData.resourceConversion * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${moduleData.resourceConversion * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Next Cycle</span>
            <span className={`text-${color}-400`}>{moduleData.nextCycle}s</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full bg-${color}-500 animate-pulse rounded-full`}
              style={{ width: `${(moduleData.nextCycle / 60) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className={`px-4 py-2 bg-${color}-500/20 hover:bg-${color}-500/30 border border-${color}-500/30 rounded-lg text-${color}-200 flex items-center justify-center space-x-2 text-sm transition-colors`}
        >
          <ArrowUp className="h-4 w-4" />
          <span>Upgrade Module</span>
        </button>
        <button className="flex items-center justify-center space-x-2 rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-600">
          <Zap className="h-4 w-4" />
          <span>Boost Production</span>
        </button>
      </div>

      {/* Alerts */}
      {moduleData.alerts && moduleData.alerts.length > 0 && (
        <div className="mt-6 space-y-2">
          {moduleData.alerts.map((alert, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-yellow-300">
              <AlertTriangle className="h-4 w-4" />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
