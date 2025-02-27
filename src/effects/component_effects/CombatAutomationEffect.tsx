import React, { useEffect, useState } from 'react';
import { Shield, Crosshair, AlertTriangle, Zap } from 'lucide-react';
import { Position } from '../../types/core/GameTypes';

interface CombatAutomationEffectProps {
  type: 'formation' | 'engagement' | 'repair' | 'shield' | 'attack' | 'retreat';
  position: Position;
  duration?: number;
  intensity?: number;
  quality?: 'low' | 'medium' | 'high';
}

export function CombatAutomationEffect({
  type,
  position,
  duration = 2000,
  intensity = 1,
  quality = 'high',
}: CombatAutomationEffectProps) {
  const [isActive, setIsActive] = useState(true);
  const [particles, setParticles] = useState<Position[]>([]);

  useEffect(() => {
    // Initialize particles based on quality
    const particleCount = quality === 'low' ? 5 : quality === 'medium' ? 10 : 20;
    const newParticles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));
    setParticles(newParticles);

    // Auto-cleanup after duration
    const timer = setTimeout(() => {
      setIsActive(false);
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [quality, duration]);

  const getEffectColor = () => {
    switch (type) {
      case 'formation':
        return 'blue';
      case 'engagement':
        return 'red';
      case 'repair':
        return 'green';
      case 'shield':
        return 'cyan';
      case 'attack':
        return 'yellow';
      case 'retreat':
        return 'purple';
      default:
        return 'white';
    }
  };

  const getEffectIcon = () => {
    switch (type) {
      case 'formation':
        return <Shield className={`w-8 h-8 text-${getEffectColor()}-400`} />;
      case 'engagement':
        return <Crosshair className={`w-8 h-8 text-${getEffectColor()}-400`} />;
      case 'repair':
        return <Zap className={`w-8 h-8 text-${getEffectColor()}-400`} />;
      case 'shield':
        return <Shield className={`w-8 h-8 text-${getEffectColor()}-400`} />;
      case 'attack':
        return <Crosshair className={`w-8 h-8 text-${getEffectColor()}-400`} />;
      case 'retreat':
        return <AlertTriangle className={`w-8 h-8 text-${getEffectColor()}-400`} />;
    }
  };

  if (!isActive) return null;

  const color = getEffectColor();

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Core Effect */}
      <div
        className={`relative w-32 h-32 rounded-full bg-${color}-500/20 animate-pulse`}
        style={{
          animation: `pulse ${1 / intensity}s infinite`,
        }}
      >
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {getEffectIcon()}
        </div>

        {/* Particles */}
        {quality !== 'low' &&
          particles.map((particle, index) => (
            <div
              key={index}
              className={`absolute w-1 h-1 rounded-full bg-${color}-400`}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                opacity: 0.5 + Math.random() * 0.5,
                animation: `float ${1 + Math.random()}s infinite`,
              }}
            />
          ))}

        {/* Glow Effect */}
        <div
          className={`absolute inset-0 rounded-full`}
          style={{
            background: `radial-gradient(circle, ${color}33 0%, ${color}00 70%)`,
            filter: 'blur(8px)',
            animation: `pulse ${1.5 / intensity}s infinite`,
          }}
        />
      </div>

      {/* Effect Label */}
      <div
        className={`mt-2 px-3 py-1 rounded-full bg-${color}-900/80 border border-${color}-500/50 text-${color}-200 text-xs text-center uppercase tracking-wider`}
      >
        {type}
      </div>
    </div>
  );
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }
  
  @keyframes float {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(3px, -3px); }
  }
`;
document.head.appendChild(style); 