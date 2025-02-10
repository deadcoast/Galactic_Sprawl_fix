import React from 'react';
import { Database, TrendingUp, ArrowUpRight, AlertTriangle } from 'lucide-react';

interface EconomicHubProps {
  hubData: {
    id: string;
    level: number;
    tradeRoutes: {
      id: string;
      destination: string;
      efficiency: number;
      volume: number;
      profit: number;
      status: 'active' | 'disrupted' | 'optimizing';
    }[];
    bonuses: {
      type: string;
      value: number;
    }[];
    innovations: {
      id: string;
      name: string;
      progress: number;
      effect: string;
    }[];
  };
}

export function EconomicHub({ hubData }: EconomicHubProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">Economic Hub</h3>
          <div className="text-sm text-gray-400">Level {hubData.level}</div>
        </div>
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Trade Routes */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-medium text-gray-300">Active Trade Routes</h4>
        {hubData.tradeRoutes.map(route => (
          <div
            key={route.id}
            className="p-4 bg-gray-700/50 rounded-lg"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-white">{route.destination}</div>
                <div className="text-xs text-gray-400">
                  Volume: {route.volume.toLocaleString()} units/cycle
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs ${
                route.status === 'active'
                  ? 'bg-emerald-900/50 text-emerald-400'
                  : route.status === 'disrupted'
                  ? 'bg-red-900/50 text-red-400'
                  : 'bg-blue-900/50 text-blue-400'
              }`}>
                {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
              </div>
            </div>

            {/* Efficiency Bar */}
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Route Efficiency</span>
                <span className="text-emerald-400">{Math.round(route.efficiency * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${route.efficiency * 100}%` }}
                />
              </div>
            </div>

            {/* Profit Indicator */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Profit</span>
              <div className="flex items-center text-emerald-400">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                <span>+{route.profit.toLocaleString()}/cycle</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Economic Bonuses */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {hubData.bonuses.map((bonus, index) => (
          <div
            key={index}
            className="p-3 bg-gray-700/50 rounded-lg"
          >
            <div className="text-sm text-gray-300 mb-1">{bonus.type}</div>
            <div className="text-lg font-medium text-emerald-400">
              +{bonus.value}%
            </div>
          </div>
        ))}
      </div>

      {/* Innovations */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Economic Innovations</h4>
        {hubData.innovations.map(innovation => (
          <div
            key={innovation.id}
            className="p-3 bg-gray-700/50 rounded-lg"
          >
            <div className="flex justify-between mb-2">
              <div className="text-sm font-medium text-white">{innovation.name}</div>
              <div className="text-xs text-emerald-400">{Math.round(innovation.progress * 100)}%</div>
            </div>
            <div className="text-xs text-gray-400 mb-2">{innovation.effect}</div>
            <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${innovation.progress * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Warnings for Disrupted Routes */}
      {hubData.tradeRoutes.some(route => route.status === 'disrupted') && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="text-sm text-red-200">
            One or more trade routes are currently disrupted. Check route conditions and adjust accordingly.
          </div>
        </div>
      )}
    </div>
  );
}