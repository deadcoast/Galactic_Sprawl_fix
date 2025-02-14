import { Crown, Zap } from 'lucide-react';

interface CentralMothershipProps {
  tier: 1 | 2 | 3;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  power: number;
  maxPower: number;
  quality: 'low' | 'medium' | 'high';
  onHover?: () => void;
  onClick?: () => void;
}

export function CentralMothership({
  tier,
  health,
  maxHealth,
  shield,
  maxShield,
  power,
  maxPower,
  quality,
  onHover,
  onClick,
}: CentralMothershipProps) {
  const particleCount = quality === 'high' ? 16 : quality === 'medium' ? 8 : 4;
  const glowIntensity = quality === 'low' ? 4 : quality === 'medium' ? 8 : 12;

  return (
    <div className="relative w-96 h-96 cursor-pointer" onMouseEnter={onHover} onClick={onClick}>
      {/* Base Structure */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Core Structure */}
          <div className="w-48 h-48 bg-gray-800/80 rounded-full border-4 border-indigo-500/30 flex items-center justify-center">
            <div className="w-32 h-32 bg-indigo-900/50 rounded-full flex items-center justify-center">
              <Crown className="w-16 h-16 text-indigo-400" />
            </div>
          </div>

          {/* Rotating Rings */}
          {Array.from({ length: tier }).map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 border-2 border-indigo-500/20 rounded-full"
              style={{
                animation: `spin ${20 + i * 10}s linear infinite`,
                transform: `scale(${1.2 + i * 0.2}) rotate(${i * 30}deg)`,
              }}
            />
          ))}

          {/* Shield Effect */}
          {shield > 0 && (
            <div
              className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
              style={{
                transform: `scale(${1.5})`,
                opacity: shield / maxShield,
                filter: `blur(${glowIntensity}px)`,
              }}
            />
          )}

          {/* Power Indicators */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 90}deg) translateY(-80px)`,
                opacity: power / maxPower,
              }}
            >
              <Zap className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
          ))}

          {/* Particle Effects */}
          {Array.from({ length: particleCount }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-indigo-400 rounded-full animate-float"
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

      {/* Status Indicators */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 space-y-2">
        {/* Health Bar */}
        <div className="w-48">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Hull Integrity</span>
            <span className={health < maxHealth * 0.3 ? 'text-red-400' : 'text-gray-300'}>
              {Math.round((health / maxHealth) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                health < maxHealth * 0.3 ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${(health / maxHealth) * 100}%` }}
            />
          </div>
        </div>

        {/* Shield Bar */}
        <div className="w-48">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Shield Power</span>
            <span className="text-gray-300">{Math.round((shield / maxShield) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all"
              style={{ width: `${(shield / maxShield) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tier Indicator */}
      <div className="absolute top-0 right-0 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">
        <div className="flex items-center space-x-1">
          {Array.from({ length: tier }).map((_, i) => (
            <Crown key={i} className="w-4 h-4 text-indigo-400" />
          ))}
        </div>
      </div>
    </div>
  );
}
