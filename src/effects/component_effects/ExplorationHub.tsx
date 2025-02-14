import { AlertTriangle, Radar, Rocket } from 'lucide-react';
import { useState } from 'react';

interface ReconShip {
  id: string;
  name: string;
  position: { x: number; y: number };
  status: 'idle' | 'scanning' | 'investigating' | 'returning';
  targetArea?: { x: number; y: number };
  discoveredAnomalies: number;
}

interface ExplorationHubProps {
  tier: 1 | 2 | 3;
  ships: ReconShip[];
  mappedArea: number;
  totalArea: number;
  anomalies: {
    id: string;
    position: { x: number; y: number };
    type: 'artifact' | 'signal' | 'phenomenon';
    severity: 'low' | 'medium' | 'high';
    investigated: boolean;
  }[];
  quality: 'low' | 'medium' | 'high';
  onShipSelect?: (shipId: string) => void;
  onAnomalyClick?: (anomalyId: string) => void;
}

export function ExplorationHub({
  tier,
  ships,
  mappedArea,
  totalArea,
  anomalies,
  quality,
  onShipSelect,
  onAnomalyClick,
}: ExplorationHubProps) {
  const [hoveredShip, setHoveredShip] = useState<string | null>(null);
  const [hoveredAnomaly, setHoveredAnomaly] = useState<string | null>(null);

  const particleCount = quality === 'high' ? 12 : quality === 'medium' ? 8 : 4;

  return (
    <div className="relative w-96 h-96">
      {/* Main Hub Structure */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Central Command */}
          <div className="w-40 h-40 bg-gray-800/80 rounded-lg border-4 border-teal-500/30 flex items-center justify-center transform rotate-45">
            <div className="w-24 h-24 bg-teal-900/50 rounded-lg flex items-center justify-center transform -rotate-45">
              <Radar className="w-12 h-12 text-teal-400" />
            </div>
          </div>

          {/* Scanning Field */}
          <div
            className="absolute inset-0 rounded-full border-2 border-teal-500/20"
            style={{
              transform: `scale(${2 + tier * 0.5})`,
              animation: 'pulse 4s infinite',
            }}
          />

          {/* Scanning Lines */}
          <div className="absolute inset-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 border border-teal-500/10 rounded-full"
                style={{
                  transform: `scale(${1.5 + i * 0.3}) rotate(${i * 45}deg)`,
                  animation: `spin ${10 + i * 5}s linear infinite`,
                }}
              />
            ))}
          </div>

          {/* Mapped Area Indicator */}
          <svg className="absolute inset-0" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgb(20, 184, 166)"
              strokeWidth="2"
              strokeDasharray={`${(mappedArea / totalArea) * 283} 283`}
              transform="rotate(-90 50 50)"
              className="opacity-30"
            />
          </svg>

          {/* Recon Ships */}
          {ships.map(ship => (
            <div
              key={ship.id}
              className="absolute"
              style={{
                left: `${ship.position.x}%`,
                top: `${ship.position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseEnter={() => setHoveredShip(ship.id)}
              onMouseLeave={() => setHoveredShip(null)}
              onClick={() => onShipSelect?.(ship.id)}
            >
              <div
                className={`p-2 rounded-full transition-all duration-300 ${
                  ship.status === 'scanning'
                    ? 'bg-teal-500/20'
                    : ship.status === 'investigating'
                      ? 'bg-yellow-500/20'
                      : 'bg-blue-500/20'
                } ${hoveredShip === ship.id ? 'scale-125' : 'scale-100'}`}
              >
                <Rocket
                  className={`w-4 h-4 ${
                    ship.status === 'scanning'
                      ? 'text-teal-400'
                      : ship.status === 'investigating'
                        ? 'text-yellow-400'
                        : 'text-blue-400'
                  }`}
                />
              </div>

              {/* Ship Path */}
              {ship.targetArea && quality !== 'low' && (
                <svg className="absolute inset-0 pointer-events-none">
                  <line
                    x1="0"
                    y1="0"
                    x2={ship.targetArea.x - ship.position.x}
                    y2={ship.targetArea.y - ship.position.y}
                    stroke="rgba(20, 184, 166, 0.3)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                </svg>
              )}

              {/* Ship Info Tooltip */}
              {hoveredShip === ship.id && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800/90 rounded-lg border border-gray-700 whitespace-nowrap z-10">
                  <div className="text-sm font-medium text-white">{ship.name}</div>
                  <div className="text-xs text-gray-400">
                    Status: {ship.status.charAt(0).toUpperCase() + ship.status.slice(1)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Discoveries: {ship.discoveredAnomalies}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Anomalies */}
          {anomalies.map(anomaly => (
            <div
              key={anomaly.id}
              className="absolute"
              style={{
                left: `${anomaly.position.x}%`,
                top: `${anomaly.position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseEnter={() => setHoveredAnomaly(anomaly.id)}
              onMouseLeave={() => setHoveredAnomaly(null)}
              onClick={() => onAnomalyClick?.(anomaly.id)}
            >
              <div
                className={`p-2 rounded-full transition-all duration-300 ${
                  anomaly.severity === 'high'
                    ? 'bg-red-500/20'
                    : anomaly.severity === 'medium'
                      ? 'bg-yellow-500/20'
                      : 'bg-blue-500/20'
                } ${hoveredAnomaly === anomaly.id ? 'scale-125' : 'scale-100'}`}
              >
                <AlertTriangle
                  className={`w-4 h-4 ${
                    anomaly.severity === 'high'
                      ? 'text-red-400'
                      : anomaly.severity === 'medium'
                        ? 'text-yellow-400'
                        : 'text-blue-400'
                  }`}
                />
              </div>

              {/* Anomaly Info Tooltip */}
              {hoveredAnomaly === anomaly.id && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800/90 rounded-lg border border-gray-700 whitespace-nowrap z-10">
                  <div className="text-sm font-medium text-white capitalize">
                    {anomaly.type} Anomaly
                  </div>
                  <div className="text-xs text-gray-400">
                    Severity: {anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Status: {anomaly.investigated ? 'Investigated' : 'Pending'}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Particle Effects */}
          {Array.from({ length: particleCount }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-teal-400 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.5 + Math.random() * 0.5,
              }}
            />
          ))}
        </div>
      </div>

      {/* Hub Info */}
      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 space-y-2 w-48">
        <div className="text-center">
          <div className="text-teal-200 font-medium">Exploration Hub</div>
          <div className="text-teal-300/70 text-sm">
            Tier {tier} • {ships.length} Ships Active
          </div>
        </div>

        {/* Mapping Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Area Mapped</span>
            <span className="text-gray-300">{Math.round((mappedArea / totalArea) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all"
              style={{ width: `${(mappedArea / totalArea) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
