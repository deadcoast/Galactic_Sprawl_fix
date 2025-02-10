import React, { useEffect, useState } from 'react';

interface ExplosionEffectProps {
  position: { x: number; y: number };
  size: 'small' | 'medium' | 'large';
  color: string;
  onComplete: () => void;
}

export function ExplosionEffect({ position, size, color, onComplete }: ExplosionEffectProps) {
  const [frame, setFrame] = useState(0);
  const totalFrames = 12;

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(prev => {
        if (prev >= totalFrames - 1) {
          clearInterval(interval);
          onComplete();
          return prev;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  const getSize = () => {
    switch (size) {
      case 'small': return 40;
      case 'medium': return 80;
      case 'large': return 120;
    }
  };

  const baseSize = getSize();
  const currentSize = baseSize * (1 + frame * 0.2);
  const opacity = 1 - (frame / totalFrames);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        width: currentSize,
        height: currentSize,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Core Explosion */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: color,
          opacity: opacity * 0.8,
          transform: `scale(${0.8 + frame * 0.1})`,
          filter: `blur(${frame * 2}px)`
        }}
      />

      {/* Shockwave */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `${2 + frame}px solid ${color}`,
          opacity: opacity * 0.4,
          transform: `scale(${1 + frame * 0.15})`,
          filter: `blur(${frame}px)`
        }}
      />

      {/* Particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: color,
            opacity: opacity * 0.6,
            left: '50%',
            top: '50%',
            transform: `
              rotate(${i * 45}deg)
              translateX(${frame * 10}px)
              scale(${1 - frame * 0.05})
            `,
            filter: `blur(${frame}px)`
          }}
        />
      ))}
    </div>
  );
}