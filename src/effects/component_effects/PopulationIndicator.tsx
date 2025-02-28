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
    <div className="pointer-events-none absolute inset-0">
      {/* Population Wave Effect */}
      <div className="absolute inset-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-cyan-500/20"
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
            className="absolute h-1 w-1 rounded-full bg-cyan-400"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${2 + Math.random()}s infinite`,
              opacity: 0.3 + growthRate * 0.7,
            }}
          />
        ))}

      {/* Population Status */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform">
        <div className="flex items-center space-x-2 rounded-full bg-gray-900/80 px-3 py-1.5 backdrop-blur-sm">
          <Users className="h-4 w-4 text-cyan-400" />
          <div className="text-xs">
            <span className="text-cyan-200">{population.toLocaleString()}</span>
            <span className="text-gray-400"> / </span>
            <span className="text-gray-300">{maxPopulation.toLocaleString()}</span>
          </div>
          {growthRate > 0 && (
            <div className="flex items-center text-xs text-green-400">
              <TrendingUp className="mr-1 h-3 w-3" />
              <span>+{(growthRate * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
