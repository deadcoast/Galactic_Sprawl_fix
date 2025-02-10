import React from 'react';
import { Leaf, Zap, Users, AlertTriangle, Star } from 'lucide-react';

interface HabitableWorldProps {
  planetData: {
    id: string;
    name: string;
    type: 'standard' | 'resource-rich' | 'agricultural';
    population: number;
    maxPopulation: number;
    growthRate: number;
    resources: string[];
    developmentLevel: number;
    cityLightIntensity: number;
    alerts?: { type: 'warning' | 'info'; message: string }[];
  };
}

export function HabitableWorld({ planetData }: HabitableWorldProps) {
  const getPlanetTypeColor = (type: string) => {
    switch (type) {
      case 'standard': return 'cyan';
      case 'resource-rich': return 'amber';
      case 'agricultural': return 'emerald';
      default: return 'blue';
    }
  };

  const color = getPlanetTypeColor(planetData.type);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">{planetData.name}</h2>
          <div className="flex items-center text-sm text-gray-400">
            <span className="capitalize">{planetData.type.replace('-', ' ')}</span>
            <span className="mx-2">•</span>
            <span>{planetData.population.toLocaleString()} Citizens</span>
          </div>
        </div>
        <div className={`p-2 rounded-lg bg-${color}-500/20`}>
          <Star className={`w-6 h-6 text-${color}-400`} />
        </div>
      </div>

      {/* Population & Growth */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Population Capacity</span>
            <span className="text-gray-300">
              {planetData.population.toLocaleString()} / {planetData.maxPopulation.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${color}-500 rounded-full transition-all`}
              style={{ width: `${(planetData.population / planetData.maxPopulation) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Growth Rate</span>
            <span className={`text-${color}-400`}>+{planetData.growthRate}%/cycle</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${color}-500 rounded-full transition-all`}
              style={{ width: `${planetData.growthRate * 2}%` }}
            />
          </div>
        </div>
      </div>

      {/* Development Visualization */}
      <div className="relative h-32 mb-6 overflow-hidden rounded-lg">
        {/* Planet Surface */}
        <div 
          className={`absolute inset-0 bg-${color}-900/50 backdrop-blur-sm`}
          style={{
            backgroundImage: `radial-gradient(circle at 50% 120%, ${
              color === 'cyan' ? 'rgb(34, 211, 238)' :
              color === 'amber' ? 'rgb(245, 158, 11)' :
              'rgb(16, 185, 129)'
            }, transparent)`
          }}
        />

        {/* City Lights */}
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070')] bg-cover opacity-50"
          style={{
            opacity: planetData.cityLightIntensity * 0.7
          }}
        />

        {/* Development Overlay */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-${color}-500/20 to-transparent`}
          style={{
            opacity: planetData.developmentLevel
          }}
        />
      </div>

      {/* Resources & Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Growth Potential</span>
          </div>
          <div className="text-lg font-medium text-white">
            {Math.round(planetData.growthRate * 100)}%
          </div>
        </div>
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Development</span>
          </div>
          <div className="text-lg font-medium text-white">
            {Math.round(planetData.developmentLevel * 100)}%
          </div>
        </div>
      </div>

      {/* Resources */}
      {planetData.resources.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Available Resources</h3>
          <div className="flex flex-wrap gap-2">
            {planetData.resources.map(resource => (
              <span
                key={resource}
                className={`px-2 py-1 bg-${color}-900/30 border border-${color}-500/30 rounded text-${color}-300 text-sm`}
              >
                {resource}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {planetData.alerts && planetData.alerts.length > 0 && (
        <div className="space-y-2">
          {planetData.alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg flex items-start space-x-2 ${
                alert.type === 'warning'
                  ? 'bg-yellow-900/20 border border-yellow-700/30'
                  : 'bg-blue-900/20 border border-blue-700/30'
              }`}
            >
              <AlertTriangle className={`w-5 h-5 ${
                alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
              }`} />
              <span className={`text-sm ${
                alert.type === 'warning' ? 'text-yellow-200' : 'text-blue-200'
              }`}>
                {alert.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}