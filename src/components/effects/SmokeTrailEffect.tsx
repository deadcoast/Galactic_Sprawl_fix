interface SmokeTrailProps {
  position: { x: number; y: number };
  direction: number;
  intensity: number;
  color: string;
}

export function SmokeTrailEffect({ position, direction, intensity, color }: SmokeTrailProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: `rotate(${direction}deg)`
      }}
    >
      {/* Smoke Particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-smoke"
          style={{
            width: 4 + i * 2,
            height: 4 + i * 2,
            backgroundColor: color,
            opacity: (1 - i * 0.15) * intensity * 0.5,
            transform: `
              translateX(${-i * 10}px)
              scale(${1 + i * 0.2})
            `,
            filter: `blur(${i * 2}px)`,
            animation: `smoke ${1 + i * 0.5}s infinite`
          }}
        />
      ))}

      {/* Trail Gradient */}
      <div
        className="absolute"
        style={{
          width: '60px',
          height: '4px',
          background: `linear-gradient(90deg, ${color}, transparent)`,
          opacity: intensity * 0.3,
          transform: 'translateX(-60px)',
          filter: 'blur(2px)'
        }}
      />
    </div>
  );
}