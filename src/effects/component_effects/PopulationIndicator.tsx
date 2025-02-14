import { TrendingUp, Users } from 'lucide-react';

interface PopulationIndicatorProps {
  population: number;
  maxPopulation: number;
  growthRate: number;
  quality: 'low' | 'medium' | 'high';
}

export function PopulationIndicator({
  population,
  maxPopulation,
  growthRate,
  quality,
}: PopulationIndicatorProps) {
  const particleCount = quality === 'high' ? 12 : quality === 'medium' ? 8 : 4;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Population Wave Effect */}
      <div className="absolute inset-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 border-2 border-cyan-500/20 rounded-full"
            style={{
              transform: `scale(${1 + i * 0.2})`,
              animation: `wave ${3 + i}s infinite ease-out`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Growth Particles */}
      {growthRate > 0 &&
        Array.from({ length: particleCount }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${2 + Math.random()}s infinite`,
              opacity: 0.3 + growthRate * 0.7,
            }}
          />
        ))}

      {/* Population Status */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-2 bg-gray-900/80 rounded-full px-3 py-1.5 backdrop-blur-sm">
          <Users className="w-4 h-4 text-cyan-400" />
          <div className="text-xs">
            <span className="text-cyan-200">{population.toLocaleString()}</span>
            <span className="text-gray-400"> / </span>
            <span className="text-gray-300">{maxPopulation.toLocaleString()}</span>
          </div>
          {growthRate > 0 && (
            <div className="flex items-center text-green-400 text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>+{(growthRate * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
