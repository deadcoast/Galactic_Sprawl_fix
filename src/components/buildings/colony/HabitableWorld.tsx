import { AlertTriangle, Leaf, Ship, Star, Users, Wheat, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    biodomeLevel?: number;
    agriculturalBonus?: number;
    activeFestivals?: { name: string; remainingTime: number }[];
    tradeRoutes?: { destination: string; resourceFlow: number }[];
    satellites?: number;
  };
  onUpgradeBiodome?: () => void;
}

export function HabitableWorld({ planetData, onUpgradeBiodome }: HabitableWorldProps) {
  const [showTradeShip, setShowTradeShip] = useState(false);
  const [satellitePositions, setSatellitePositions] = useState<Array<{ angle: number }>>([]);

  useEffect(() => {
    const satCount = planetData.satellites || 0;
    if (satCount > 0) {
      setSatellitePositions(
        Array.from({ length: satCount }, (_, i) => ({
          angle: (i * 360) / satCount,
        }))
      );
    }
  }, [planetData.satellites]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSatellitePositions(prev =>
        prev.map(sat => ({
          angle: (sat.angle + 1) % 360,
        }))
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const routes = planetData.tradeRoutes || [];
    if (routes.length > 0) {
      const interval = setInterval(() => {
        setShowTradeShip(prev => !prev);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [planetData.tradeRoutes]);

  const getPlanetTypeColor = (type: string) => {
    switch (type) {
      case 'standard':
        return 'cyan';
      case 'resource-rich':
        return 'amber';
      case 'agricultural':
        return 'emerald';
      default:
        return 'blue';
    }
  };

  const color = getPlanetTypeColor(planetData.type);

  return (
    <div className="rounded-lg bg-gray-800 p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="mb-1 text-xl font-bold text-white">{planetData.name}</h2>
          <div className="flex items-center text-sm text-gray-400">
            <span className="capitalize">{planetData.type.replace('-', ' ')}</span>
            <span className="mx-2">•</span>
            <span>{planetData.population.toLocaleString()} Citizens</span>
          </div>
        </div>
        <div className={`rounded-lg p-2 bg-${color}-500/20`}>
          <Star className={`h-6 w-6 text-${color}-400`} />
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Population Capacity</span>
            <span className="text-gray-300">
              {planetData.population.toLocaleString()} / {planetData.maxPopulation.toLocaleString()}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full bg-${color}-500 rounded-full transition-all`}
              style={{
                width: `${(planetData.population / planetData.maxPopulation) * 100}%`,
              }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Growth Rate</span>
            <span className={`text-${color}-400`}>+{planetData.growthRate}%/cycle</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full bg-${color}-500 rounded-full transition-all`}
              style={{ width: `${planetData.growthRate * 2}%` }}
            />
          </div>
        </div>
      </div>

      <div className="relative mb-6 h-32 overflow-hidden rounded-lg">
        <div
          className={`absolute inset-0 bg-${color}-900/50 backdrop-blur-sm`}
          style={{
            backgroundImage: `radial-gradient(circle at 50% 120%, ${
              color === 'cyan'
                ? 'rgb(34, 211, 238)'
                : color === 'amber'
                  ? 'rgb(245, 158, 11)'
                  : 'rgb(16, 185, 129)'
            }, transparent)`,
          }}
        />

        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070')] bg-cover"
          style={{
            opacity: planetData.cityLightIntensity * 0.7,
            animation: 'pulse 4s infinite',
          }}
        />

        {satellitePositions.map((sat, index) => (
          <div
            key={index}
            className="absolute h-1 w-1 rounded-full bg-blue-400"
            style={{
              left: `calc(50% + ${Math.cos((sat.angle * Math.PI) / 180) * 60}px)`,
              top: `calc(50% + ${Math.sin((sat.angle * Math.PI) / 180) * 60}px)`,
              boxShadow: '0 0 4px rgba(96, 165, 250, 0.5)',
            }}
          />
        ))}

        {showTradeShip &&
          (planetData.tradeRoutes || []).map((route, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${index * (360 / (planetData.tradeRoutes || []).length)}deg) translateX(80px)`,
                animation: `tradeShip ${10 + route.resourceFlow}s linear infinite`,
              }}
            >
              <Ship className="h-3 w-3 text-yellow-400" />
            </div>
          ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-700/50 p-3">
          <div className="mb-2 flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">Growth Potential</span>
          </div>
          <div className="text-lg font-medium text-white">
            {Math.round(planetData.growthRate * 100)}%
          </div>
        </div>
        <div className="rounded-lg bg-gray-700/50 p-3">
          <div className="mb-2 flex items-center space-x-2">
            <Zap className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">Development</span>
          </div>
          <div className="text-lg font-medium text-white">
            {Math.round(planetData.developmentLevel * 100)}%
          </div>
        </div>
      </div>

      {planetData.resources.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-gray-400">Available Resources</h3>
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

      {planetData.alerts && planetData.alerts.length > 0 && (
        <div className="space-y-2">
          {planetData.alerts.map((alert, index) => (
            <div
              key={index}
              className={`flex items-start space-x-2 rounded-lg p-3 ${
                alert.type === 'warning'
                  ? 'border border-yellow-700/30 bg-yellow-900/20'
                  : 'border border-blue-700/30 bg-blue-900/20'
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 ${
                  alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                }`}
              />
              <span
                className={`text-sm ${
                  alert.type === 'warning' ? 'text-yellow-200' : 'text-blue-200'
                }`}
              >
                {alert.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {(planetData.type === 'agricultural' || planetData.biodomeLevel) && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-emerald-400">Agricultural Systems</h3>
            {onUpgradeBiodome && (
              <button
                onClick={onUpgradeBiodome}
                className="rounded border border-emerald-700/30 bg-emerald-900/30 px-2 py-1 text-sm text-emerald-400 hover:bg-emerald-900/50"
              >
                Upgrade Biodome
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-700/50 p-3">
              <div className="mb-2 flex items-center space-x-2">
                <Wheat className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-gray-300">Biodome Level</span>
              </div>
              <div className="text-lg font-medium text-emerald-400">
                {planetData.biodomeLevel || 0}
              </div>
            </div>

            {planetData.agriculturalBonus && (
              <div className="rounded-lg bg-gray-700/50 p-3">
                <div className="mb-2 flex items-center space-x-2">
                  <Leaf className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-gray-300">Growth Bonus</span>
                </div>
                <div className="text-lg font-medium text-emerald-400">
                  +{planetData.agriculturalBonus}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(planetData.activeFestivals || []).length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-gray-400">Active Events</h3>
          <div className="space-y-2">
            {(planetData.activeFestivals || []).map(festival => (
              <div
                key={festival.name}
                className="rounded-lg border border-indigo-700/30 bg-indigo-900/20 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-indigo-300">{festival.name}</span>
                  <span className="text-sm text-indigo-400">
                    {Math.ceil(festival.remainingTime / 60)}m
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const style = document.createElement('style');
style.textContent = `
  @keyframes tradeShip {
    0% { transform: translate(-50%, -50%) rotate(0deg) translateX(80px); }
    100% { transform: translate(-50%, -50%) rotate(360deg) translateX(80px); }
  }
`;
document.head.appendChild(style);
