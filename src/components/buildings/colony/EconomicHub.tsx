import { AlertTriangle, ArrowUpRight, TrendingUp } from 'lucide-react';

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
    <div className="rounded-lg bg-gray-800 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Economic Hub</h3>
          <div className="text-sm text-gray-400">Level {hubData.level}</div>
        </div>
        <div className="rounded-lg bg-emerald-500/20 p-2">
          <TrendingUp className="h-6 w-6 text-emerald-400" />
        </div>
      </div>

      {/* Trade Routes */}
      <div className="mb-6 space-y-4">
        <h4 className="text-sm font-medium text-gray-300">Active Trade Routes</h4>
        {hubData.tradeRoutes.map(route => (
          <div key={route.id} className="rounded-lg bg-gray-700/50 p-4">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-white">{route.destination}</div>
                <div className="text-xs text-gray-400">
                  Volume: {route.volume.toLocaleString()} units/cycle
                </div>
              </div>
              <div
                className={`rounded-full px-2 py-1 text-xs ${
                  route.status === 'active'
                    ? 'bg-emerald-900/50 text-emerald-400'
                    : route.status === 'disrupted'
                      ? 'bg-red-900/50 text-red-400'
                      : 'bg-blue-900/50 text-blue-400'
                }`}
              >
                {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
              </div>
            </div>

            {/* Efficiency Bar */}
            <div className="mb-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Route Efficiency</span>
                <span className="text-emerald-400">{Math.round(route.efficiency * 100)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-600">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${route.efficiency * 100}%` }}
                />
              </div>
            </div>

            {/* Profit Indicator */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Profit</span>
              <div className="flex items-center text-emerald-400">
                <ArrowUpRight className="mr-1 h-4 w-4" />
                <span>+{route.profit.toLocaleString()}/cycle</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Economic Bonuses */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {hubData.bonuses.map((bonus, index) => (
          <div key={index} className="rounded-lg bg-gray-700/50 p-3">
            <div className="mb-1 text-sm text-gray-300">{bonus.type}</div>
            <div className="text-lg font-medium text-emerald-400">+{bonus.value}%</div>
          </div>
        ))}
      </div>

      {/* Innovations */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Economic Innovations</h4>
        {hubData.innovations.map(innovation => (
          <div key={innovation.id} className="rounded-lg bg-gray-700/50 p-3">
            <div className="mb-2 flex justify-between">
              <div className="text-sm font-medium text-white">{innovation.name}</div>
              <div className="text-xs text-emerald-400">
                {Math.round(innovation.progress * 100)}%
              </div>
            </div>
            <div className="mb-2 text-xs text-gray-400">{innovation.effect}</div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-600">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${innovation.progress * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Warnings for Disrupted Routes */}
      {hubData.tradeRoutes.some(route => route.status === 'disrupted') && (
        <div className="mt-4 flex items-start space-x-2 rounded-lg border border-red-700/30 bg-red-900/20 p-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />
          <div className="text-sm text-red-200">
            One or more trade routes are currently disrupted. Check route conditions and adjust
            accordingly.
          </div>
        </div>
      )}
    </div>
  );
}
