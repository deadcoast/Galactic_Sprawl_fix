import React from 'react';
import { Position } from '../../types/core/GameTypes';

interface ShipPathEffectProps {
  source: Position;
  target: Position;
  progress: number;
  quality: 'low' | 'medium' | 'high';
  type: 'recon' | 'mining' | 'war';
}

export function ShipPathEffect({ source, target, progress, quality, type }: ShipPathEffectProps) {
  const particleCount = quality === 'high' ? 12 : quality === 'medium' ? 8 : 4;
  const glowIntensity = quality === 'low' ? 2 : quality === 'medium' ? 4 : 8;

  // Calculate path
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  const curvature = distance * 0.2;

  // Path data for curved line
  const path = `
    M ${source.x} ${source.y}
    Q ${midX} ${midY - curvature} ${target.x} ${target.y}
  `;

  // Get color based on ship type
  const getPathColor = () => {
    switch (type) {
      case 'recon':
        return 'teal';
      case 'mining':
        return 'amber';
      case 'war':
        return 'red';
      default:
        return 'blue';
    }
  };

  const color = getPathColor();

  return (
    <g>
      {/* Base Path */}
      <path
        d={path}
        stroke={`rgb(var(--color-${color}-500) / 0.3)`}
        strokeWidth={2}
        fill="none"
        filter={`blur(${glowIntensity}px)`}
      />

      {/* Progress Path */}
      <path
        d={path}
        stroke={`rgb(var(--color-${color}-400))`}
        strokeWidth={2}
        strokeDasharray={`${progress * distance} ${distance}`}
        fill="none"
        className="transition-all duration-300"
      />

      {/* Particles */}
      {Array.from({ length: particleCount }).map((_, i) => {
        const particleProgress = ((i / particleCount) + (Date.now() / 2000)) % 1;
        const x = source.x + (target.x - source.x) * particleProgress;
        const y = source.y + (target.y - source.y) * particleProgress;

        return (
          <g key={i} transform={`translate(${x}, ${y})`}>
            <circle
              r={2}
              fill={`rgb(var(--color-${color}-400))`}
              className="animate-pulse"
              style={{
                animationDuration: '1s',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          </g>
        );
      })}

      {/* Direction Indicator */}
      <g transform={`translate(${midX}, ${midY - curvature})`}>
        <circle
          r={4}
          fill={`rgb(var(--color-${color}-500) / 0.2)`}
          className="animate-pulse"
        />
      </g>
    </g>
  );
} 