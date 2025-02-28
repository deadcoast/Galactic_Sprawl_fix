import { AlertTriangle, Database } from 'lucide-react';
import { useState } from 'react';

interface HabitableWorldProps {
  name: string;
  type: 'terran' | 'oceanic' | 'desert' | 'arctic';
  population: number;
  maxPopulation: number;
  resources: string[];
  developmentLevel: number;
  cityLightIntensity: number;
  anomalies?: { type: 'warning' | 'info'; message: string }[];
  quality: 'low' | 'medium' | 'high';
  onClick?: () => void;
}

export function HabitableWorld({
  name,
  type,
  population,
  maxPopulation,
  resources,
  developmentLevel,
  cityLightIntensity,
  anomalies,
  quality,
  onClick,
}: HabitableWorldProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getPlanetColor = () => {
    switch (type) {
      case 'terran':
        return 'emerald';
      case 'oceanic':
        return 'cyan';
      case 'desert':
        return 'amber';
      case 'arctic':
        return 'blue';
      default:
        return 'indigo';
    }
  };

  const color = getPlanetColor();
  const particleCount = quality === 'high' ? 16 : quality === 'medium' ? 8 : 4;

  return (
    <div
      className="relative h-64 w-64 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Planet Body */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`relative h-48 w-48 rounded-full bg-gradient-to-br from-${color}-700 to-${color}-900 overflow-hidden`}
          >
            {/* Atmosphere Effect */}
            <div
              className={`absolute inset-0 bg-${color}-500/20 backdrop-blur-sm`}
              style={{
                opacity: 0.3 + developmentLevel * 0.4,
              }}
            />

            {/* Surface Features */}
            {quality !== 'low' && (
              <div className="absolute inset-0">
                {/* Terrain Patterns */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={`absolute bg-${color}-600/30 rounded-full`}
                    style={{
                      width: 20 + Math.random() * 40,
                      height: 20 + Math.random() * 40,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* City Lights */}
            {Array.from({ length: particleCount }).map((_, i) => (
              <div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-yellow-300"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: cityLightIntensity * (0.3 + Math.random() * 0.7),
                  animation: `pulse ${1 + Math.random() * 2}s infinite`,
                }}
              />
            ))}

            {/* Development Ring */}
            <div
              className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
                isHovered ? 'scale-110' : 'scale-100'
              }`}
              style={{
                borderColor: `rgb(var(--color-${color}-500))`,
                opacity: 0.3,
              }}
            />
          </div>
        </div>

        {/* Resource Indicators */}
        {resources.map((resource, index) => {
          const angle = (index / resources.length) * Math.PI * 2;
          const radius = 80;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <div
              key={resource}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
              }}
            >
              <div className={`rounded-full p-1 bg-${color}-900/80 backdrop-blur-sm`}>
                <Database className={`h-4 w-4 text-${color}-400`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Planet Info */}
      <div className="absolute -bottom-12 left-1/2 w-48 -translate-x-1/2 transform space-y-2">
        <div className="text-center">
          <div className={`text-${color}-200 font-medium`}>{name}</div>
          <div className={`text-${color}-300/70 text-sm capitalize`}>{type} World</div>
        </div>

        {/* Population Bar */}
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-gray-400">Population</span>
            <span className="text-gray-300">{Math.round((population / maxPopulation) * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full bg-${color}-500 rounded-full transition-all`}
              style={{ width: `${(population / maxPopulation) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Anomaly Warnings */}
      {anomalies && anomalies.length > 0 && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 transform">
          {anomalies.map((anomaly, index) => (
            <div
              key={index}
              className={`mb-1 flex items-center space-x-1 rounded-full px-3 py-1 ${
                anomaly.type === 'warning'
                  ? 'border border-red-700 bg-red-900/80'
                  : 'border border-blue-700 bg-blue-900/80'
              }`}
            >
              <AlertTriangle
                className={`h-3 w-3 ${
                  anomaly.type === 'warning' ? 'text-red-400' : 'text-blue-400'
                }`}
              />
              <span
                className={`text-xs ${
                  anomaly.type === 'warning' ? 'text-red-200' : 'text-blue-200'
                }`}
              >
                {anomaly.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
