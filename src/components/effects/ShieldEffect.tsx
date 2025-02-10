import React from 'react';

interface ShieldEffectProps {
  active: boolean;
  health: number;
  color: string;
  size: number;
  impact?: {
    x: number;
    y: number;
    intensity: number;
  };
}

export function ShieldEffect({ active, health, color, size, impact }: ShieldEffectProps) {
  return (
    <div
      className="absolute inset-0 rounded-full transition-opacity duration-300"
      style={{
        opacity: active ? 0.2 + (health * 0.3) : 0,
        background: `radial-gradient(circle at center, ${color}33, ${color}11)`,
        width: `${size}px`,
        height: `${size}px`
      }}
    >
      {/* Shield Border */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `2px solid ${color}`,
          opacity: health * 0.5,
          animation: active ? 'pulse 2s infinite' : 'none'
        }}
      />

      {/* Impact Effect */}
      {impact && (
        <div
          className="absolute rounded-full animate-ripple"
          style={{
            left: `${impact.x}%`,
            top: `${impact.y}%`,
            width: `${impact.intensity * 40}px`,
            height: `${impact.intensity * 40}px`,
            border: `2px solid ${color}`,
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 1s cubic-bezier(0, 0, 0.2, 1)'
          }}
        />
      )}

      {/* Shield Hexagon Pattern */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23${color.slice(1)}' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }}
      />
    </div>
  );
}