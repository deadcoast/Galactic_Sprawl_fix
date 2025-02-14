import { Crown, Star, Zap } from 'lucide-react';

interface BuildingUpgradeEffectProps {
  tier: 1 | 2 | 3;
  type: 'radar' | 'mining' | 'research' | 'defense';
  upgradeProgress: number;
  quality: 'low' | 'medium' | 'high';
}

export function BuildingUpgradeEffect({
  tier,
  type,
  upgradeProgress,
  quality,
}: BuildingUpgradeEffectProps) {
  const getTypeColor = () => {
    switch (type) {
      case 'radar':
        return 'cyan';
      case 'mining':
        return 'amber';
      case 'research':
        return 'violet';
      case 'defense':
        return 'rose';
      default:
        return 'blue';
    }
  };

  const color = getTypeColor();
  const particleCount = quality === 'high' ? 12 : quality === 'medium' ? 8 : 4;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Tier Indicator */}
      <div
        className={`absolute top-2 right-2 px-3 py-1.5 rounded-full bg-${color}-500/20 border border-${color}-500/30`}
      >
        <div className="flex items-center space-x-2">
          <Crown className={`w-4 h-4 text-${color}-400`} />
          <div className="flex items-center space-x-1">
            {Array.from({ length: tier }).map((_, i) => (
              <Star key={i} className={`w-3 h-3 text-${color}-400`} />
            ))}
          </div>
        </div>
      </div>

      {/* Energy Field Effect */}
      <div className="absolute inset-0">
        <div
          className={`absolute inset-0 bg-gradient-radial from-${color}-500/20 via-${color}-500/10 to-transparent`}
          style={{
            opacity: 0.3 + upgradeProgress * 0.7,
            transform: `scale(${1 + upgradeProgress * 0.3})`,
          }}
        />

        {/* Particle System */}
        {Array.from({ length: particleCount }).map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full bg-${color}-400`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 2}s infinite`,
              opacity: 0.3 + Math.random() * 0.7,
            }}
          />
        ))}

        {/* Energy Arcs */}
        {quality !== 'low' && (
          <svg className="absolute inset-0" viewBox="0 0 100 100">
            {Array.from({ length: tier * 2 }).map((_, i) => (
              <path
                key={i}
                d={`M ${20 + Math.random() * 60} ${20 + Math.random() * 60} Q ${50} ${50} ${20 + Math.random() * 60} ${20 + Math.random() * 60}`}
                stroke={`rgb(var(--color-${color}-400))`}
                strokeWidth="0.5"
                fill="none"
                className="animate-pulse"
                style={{ opacity: 0.3 + Math.random() * 0.4 }}
              />
            ))}
          </svg>
        )}

        {/* Upgrade Progress Ring */}
        <svg className="absolute inset-0" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={`rgb(var(--color-${color}-500))`}
            strokeWidth="2"
            strokeDasharray={`${upgradeProgress * 283} 283`}
            transform="rotate(-90 50 50)"
            className="opacity-30"
          />
        </svg>

        {/* Type-specific Effects */}
        {type === 'radar' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`w-1/2 h-1/2 rounded-full border-2 border-${color}-500/30 animate-ping`}
              style={{ animationDuration: '3s' }}
            />
          </div>
        )}
        {type === 'mining' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className={`w-12 h-12 text-${color}-400 animate-pulse`} />
          </div>
        )}
      </div>

      {/* Tier 3 Special Effects */}
      {tier === 3 && (
        <div className="absolute inset-0">
          {/* Ambient Glow */}
          <div
            className={`absolute inset-0 bg-${color}-500/10 animate-pulse`}
            style={{ filter: `blur(${quality === 'high' ? 20 : 10}px)` }}
          />

          {/* Power Lines */}
          {quality !== 'low' && (
            <svg className="absolute inset-0" viewBox="0 0 100 100">
              {Array.from({ length: 6 }).map((_, i) => (
                <line
                  key={i}
                  x1={10 + Math.random() * 80}
                  y1={10 + Math.random() * 80}
                  x2={10 + Math.random() * 80}
                  y2={10 + Math.random() * 80}
                  stroke={`rgb(var(--color-${color}-400))`}
                  strokeWidth="0.5"
                  className="animate-pulse"
                  style={{
                    opacity: 0.3 + Math.random() * 0.4,
                    strokeDasharray: '4 4',
                  }}
                />
              ))}
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
