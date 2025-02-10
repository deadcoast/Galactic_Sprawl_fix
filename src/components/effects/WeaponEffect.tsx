interface WeaponEffectProps {
  type: 'machineGun' | 'railGun' | 'gaussCannon' | 'rockets';
  color: string;
  position: { x: number; y: number };
  rotation: number;
  firing: boolean;
}

export function WeaponEffect({ type, color, position, rotation, firing }: WeaponEffectProps) {
  const renderEffect = () => {
    switch (type) {
      case 'machineGun':
        return (
          <div
            className={`absolute transition-opacity duration-100 ${firing ? 'opacity-100' : 'opacity-0'}`}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: `rotate(${rotation}deg)`
            }}
          >
            {/* Muzzle Flash */}
            <div
              className="absolute w-4 h-4 rounded-full animate-pulse"
              style={{
                backgroundColor: color,
                filter: 'blur(2px)',
                opacity: 0.8
              }}
            />
            {/* Bullet Trail */}
            <div
              className="absolute h-px animate-shoot"
              style={{
                width: '20px',
                backgroundColor: color,
                transform: 'translateX(16px)'
              }}
            />
          </div>
        );

      case 'railGun':
        return (
          <div
            className={`absolute transition-opacity duration-300 ${firing ? 'opacity-100' : 'opacity-0'}`}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: `rotate(${rotation}deg)`
            }}
          >
            {/* Charge Effect */}
            <div
              className="absolute w-6 h-6 rounded-full animate-ping"
              style={{
                backgroundColor: color,
                filter: 'blur(3px)',
                opacity: 0.6
              }}
            />
            {/* Beam */}
            <div
              className="absolute h-1 animate-beam"
              style={{
                width: '100px',
                background: `linear-gradient(90deg, ${color}, transparent)`,
                transform: 'translateX(24px)'
              }}
            />
          </div>
        );

      case 'gaussCannon':
        return (
          <div
            className={`absolute transition-opacity duration-200 ${firing ? 'opacity-100' : 'opacity-0'}`}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: `rotate(${rotation}deg)`
            }}
          >
            {/* Energy Build-up */}
            <div
              className="absolute w-8 h-8 rounded-full animate-pulse"
              style={{
                backgroundColor: color,
                filter: 'blur(4px)',
                opacity: 0.7
              }}
            />
            {/* Plasma Stream */}
            <div
              className="absolute h-2 animate-plasma"
              style={{
                width: '60px',
                background: `linear-gradient(90deg, ${color}cc, ${color}33)`,
                transform: 'translateX(32px)',
                borderRadius: '4px'
              }}
            />
          </div>
        );

      case 'rockets':
        return (
          <div
            className={`absolute transition-opacity duration-150 ${firing ? 'opacity-100' : 'opacity-0'}`}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: `rotate(${rotation}deg)`
            }}
          >
            {/* Rocket Engine */}
            <div
              className="absolute w-3 h-3 rounded-full animate-flicker"
              style={{
                backgroundColor: color,
                filter: 'blur(2px)',
                opacity: 0.9
              }}
            />
            {/* Exhaust Trail */}
            <div
              className="absolute w-px animate-trail"
              style={{
                height: '30px',
                background: `linear-gradient(${color}, transparent)`,
                transform: 'translateX(6px) rotate(180deg)'
              }}
            />
          </div>
        );
    }
  };

  return renderEffect();
}