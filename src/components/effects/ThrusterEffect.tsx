import React from 'react';

interface ThrusterEffectProps {
  size: 'small' | 'medium' | 'large';
  color: string;
  intensity: number;
}

export function ThrusterEffect({ size, color, intensity }: ThrusterEffectProps) {
  const getSize = () => {
    switch (size) {
      case 'small': return 'w-2 h-4';
      case 'medium': return 'w-3 h-6';
      case 'large': return 'w-4 h-8';
    }
  };

  return (
    <div className="relative">
      {/* Main Thruster Glow */}
      <div
        className={`${getSize()} rounded-full animate-pulse`}
        style={{
          backgroundColor: color,
          opacity: 0.6 * intensity,
          filter: `blur(${intensity * 4}px)`,
          animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}
      />

      {/* Inner Core */}
      <div
        className={`absolute inset-0 ${getSize()} rounded-full`}
        style={{
          backgroundColor: 'white',
          opacity: 0.8 * intensity,
          filter: `blur(${intensity * 2}px)`,
          transform: 'scale(0.6)'
        }}
      />

      {/* Particle Trail */}
      <div
        className="absolute top-full left-1/2 -translate-x-1/2"
        style={{
          width: '2px',
          height: `${intensity * 20}px`,
          background: `linear-gradient(to bottom, ${color}, transparent)`,
          opacity: 0.4
        }}
      />
    </div>
  );
}