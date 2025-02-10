import { Users, Heart, Star, Zap } from 'lucide-react';

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
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">{centerData.name}</h3>
          <div className="text-sm text-gray-400">Level {centerData.level}</div>
        </div>
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Heart className="w-6 h-6 text-purple-400" />
        </div>
      </div>

      {/* Happiness Meter */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Colony Happiness</span>
          <span className="text-purple-400">{Math.round(centerData.happiness * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${centerData.happiness * 100}%` }}
          />
        </div>
      </div>

      {/* Active Events */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-medium text-gray-300">Active Cultural Events</h4>
        {centerData.events.map(event => (
          <div
            key={event.id}
            className="p-3 bg-gray-700/50 rounded-lg"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-sm font-medium text-white">{event.name}</div>
                <div className="text-xs text-purple-400">{event.effect}</div>
              </div>
              <div className="text-xs text-gray-400">
                {Math.ceil(event.duration * (1 - event.progress))}s
              </div>
            </div>
            <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${event.progress * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Active Bonuses */}
      <div className="grid grid-cols-2 gap-3">
        {centerData.bonuses.map((bonus, index) => (
          <div
            key={index}
            className="p-3 bg-gray-700/50 rounded-lg"
          >
            <div className="flex items-center space-x-2 mb-1">
              {bonus.type.includes('Growth') ? (
                <Users className="w-4 h-4 text-purple-400" />
              ) : bonus.type.includes('Production') ? (
                <Zap className="w-4 h-4 text-purple-400" />
              ) : (
                <Star className="w-4 h-4 text-purple-400" />
              )}
              <span className="text-sm text-gray-300">{bonus.type}</span>
            </div>
            <div className="text-lg font-medium text-white">
              +{bonus.value}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}