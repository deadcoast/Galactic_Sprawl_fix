import { Heart, Star, Users, Zap } from 'lucide-react';

interface CulturalCenterProps {
  centerData: {
    id: string;
    name: string;
    level: number;
    happiness: number;
    events: {
      id: string;
      name: string;
      effect: string;
      duration: number;
      progress: number;
    }[];
    bonuses: {
      type: string;
      value: number;
    }[];
  };
}

export function CulturalCenter({ centerData }: CulturalCenterProps) {
  return (
    <div className="rounded-lg bg-gray-800 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">{centerData.name}</h3>
          <div className="text-sm text-gray-400">Level {centerData.level}</div>
        </div>
        <div className="rounded-lg bg-purple-500/20 p-2">
          <Heart className="h-6 w-6 text-purple-400" />
        </div>
      </div>

      {/* Happiness Meter */}
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-gray-400">Colony Happiness</span>
          <span className="text-purple-400">{Math.round(centerData.happiness * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-700">
          <div
            className="h-full rounded-full bg-purple-500 transition-all"
            style={{ width: `${centerData.happiness * 100}%` }}
          />
        </div>
      </div>

      {/* Active Events */}
      <div className="mb-6 space-y-4">
        <h4 className="text-sm font-medium text-gray-300">Active Cultural Events</h4>
        {centerData.events.map(event => (
          <div key={event.id} className="rounded-lg bg-gray-700/50 p-3">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-white">{event.name}</div>
                <div className="text-xs text-purple-400">{event.effect}</div>
              </div>
              <div className="text-xs text-gray-400">
                {Math.ceil(event.duration * (1 - event.progress))}s
              </div>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-gray-600">
              <div
                className="h-full rounded-full bg-purple-500 transition-all"
                style={{ width: `${event.progress * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Active Bonuses */}
      <div className="grid grid-cols-2 gap-3">
        {centerData.bonuses.map((bonus, index) => (
          <div key={index} className="rounded-lg bg-gray-700/50 p-3">
            <div className="mb-1 flex items-center space-x-2">
              {bonus.type.includes('Growth') ? (
                <Users className="h-4 w-4 text-purple-400" />
              ) : bonus.type.includes('Production') ? (
                <Zap className="h-4 w-4 text-purple-400" />
              ) : (
                <Star className="h-4 w-4 text-purple-400" />
              )}
              <span className="text-sm text-gray-300">{bonus.type}</span>
            </div>
            <div className="text-lg font-medium text-white">+{bonus.value}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
