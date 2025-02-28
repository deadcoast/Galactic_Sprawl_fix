import { ArrowRight, Package } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CargoShipProps {
  id: string;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  progress: number;
  resourceType: string;
  amount: number;
}

interface ParticleProps {
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  opacity: number;
  color: string;
}

export function ResourceTransferAnimation({ ships }: { ships: CargoShipProps[] }) {
  const [particles, setParticles] = useState<ParticleProps[]>([]);

  // Particle system
  useEffect(() => {
    const particleCount = 30;
    const newParticles: ParticleProps[] = [];

    ships.forEach(ship => {
      const angle = Math.atan2(
        ship.targetPosition.y - ship.sourcePosition.y,
        ship.targetPosition.x - ship.sourcePosition.x
      );

      for (let i = 0; i < particleCount; i++) {
        const particleProgress = (i / particleCount + Date.now() / 2000) % 1;
        const x =
          ship.sourcePosition.x +
          (ship.targetPosition.x - ship.sourcePosition.x) * particleProgress;
        const y =
          ship.sourcePosition.y +
          (ship.targetPosition.y - ship.sourcePosition.y) * particleProgress;

        newParticles.push({
          x,
          y,
          angle: angle + ((Math.random() - 0.5) * Math.PI) / 4,
          speed: 0.5 + Math.random() * 0.5,
          size: 1 + Math.random() * 2,
          opacity: 0.3 + Math.random() * 0.7,
          color: getResourceColor(ship.resourceType),
        });
      }
    });

    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(particle => ({
            ...particle,
            x: particle.x + Math.cos(particle.angle) * particle.speed,
            y: particle.y + Math.sin(particle.angle) * particle.speed,
            opacity: particle.opacity * 0.95,
          }))
          .filter(p => p.opacity > 0.1)
      );
    }, 50);

    return () => clearInterval(interval);
  }, [ships]);

  const getResourceColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'minerals':
        return 'rgb(251, 191, 36)'; // amber-400
      case 'energy':
        return 'rgb(52, 211, 153)'; // emerald-400
      case 'plasma':
        return 'rgb(167, 139, 250)'; // violet-400
      default:
        return 'rgb(96, 165, 250)'; // blue-400
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Particle Effects */}
      {particles.map((particle, index) => (
        <div
          key={`particle-${index}`}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.05s linear',
          }}
        />
      ))}

      {/* Cargo Ships */}
      {ships.map(ship => {
        const x =
          ship.sourcePosition.x + (ship.targetPosition.x - ship.sourcePosition.x) * ship.progress;
        const y =
          ship.sourcePosition.y + (ship.targetPosition.y - ship.sourcePosition.y) * ship.progress;

        // Calculate angle for arrow rotation
        const angle =
          Math.atan2(
            ship.targetPosition.y - ship.sourcePosition.y,
            ship.targetPosition.x - ship.sourcePosition.x
          ) *
          (180 / Math.PI);

        return (
          <div
            key={ship.id}
            className="absolute transition-all duration-300"
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Resource Label */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <div className="rounded-full border border-amber-500/50 bg-amber-900/80 px-2 py-1 text-xs text-amber-200 backdrop-blur-sm">
                {ship.amount} {ship.resourceType}
              </div>
            </div>

            {/* Cargo Ship Icon */}
            <div className="relative">
              <div className="animate-pulse rounded-full bg-amber-500/20 p-2">
                <Package className="h-5 w-5 text-amber-400" />
              </div>
              {/* Direction Arrow */}
              <div
                className="absolute -right-6 top-1/2 -translate-y-1/2"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <ArrowRight className="h-4 w-4 text-amber-400/70" />
              </div>
            </div>

            {/* Trail Effect */}
            <div
              className="absolute h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent"
              style={{
                width: '50px',
                transform: `translateX(-100%) rotate(${angle}deg)`,
                opacity: ship.progress,
              }}
            />

            {/* Glow Effect */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle at center, ${getResourceColor(ship.resourceType)}66 0%, ${getResourceColor(ship.resourceType)}00 70%)`,
                filter: 'blur(8px)',
                opacity: 0.5,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
