import { AlertTriangle, Zap, Shield } from 'lucide-react';

interface Hazard {
  id: string;
  type: 'asteroids' | 'debris' | 'radiation' | 'anomaly';
  position: { x: number; y: number };
  radius: number;
  severity: 'low' | 'medium' | 'high';
  effect: {
    type: 'damage' | 'slow' | 'shield' | 'weapon';
    value: number;
  };
}

interface BattleEnvironmentProps {
  hazards: Hazard[];
  onHazardEffect: (hazardId: string, shipId: string) => void;
}

export function BattleEnvironment({ hazards, onHazardEffect }: BattleEnvironmentProps) {
  const getHazardColor = (type: Hazard['type']) => {
    switch (type) {
      case 'asteroids': return 'amber';
      case 'debris': return 'gray';
      case 'radiation': return 'green';
      case 'anomaly': return 'purple';
      default: return 'blue';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {hazards.map(hazard => (
        <div
          key={hazard.id}
          className="absolute"
          style={{
            left: `${hazard.position.x}%`,
            top: `${hazard.position.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Hazard Visualization */}
          <div
            className={`rounded-full animate-pulse bg-${getHazardColor(hazard.type)}-500/20`}
            style={{
              width: `${hazard.radius * 2}px`,
              height: `${hazard.radius * 2}px`
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {hazard.type === 'asteroids' && <AlertTriangle className={`w-8 h-8 text-${getHazardColor(hazard.type)}-400`} />}
              {hazard.type === 'radiation' && <Zap className={`w-8 h-8 text-${getHazardColor(hazard.type)}-400`} />}
              {hazard.type === 'anomaly' && <Shield className={`w-8 h-8 text-${getHazardColor(hazard.type)}-400`} />}
            </div>
          </div>

          {/* Effect Indicator */}
          <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-full bg-${getHazardColor(hazard.type)}-900/80 border border-${getHazardColor(hazard.type)}-500/50 text-${getHazardColor(hazard.type)}-200 text-xs whitespace-nowrap`}>
            {hazard.effect.type.charAt(0).toUpperCase() + hazard.effect.type.slice(1)}: {hazard.effect.value}
          </div>
        </div>
      ))}
    </div>
  );
}