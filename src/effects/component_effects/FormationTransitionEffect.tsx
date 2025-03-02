/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from 'react';
import { Position } from '../../types/core/GameTypes';

interface FormationTransitionEffectProps {
  sourcePositions: Position[];
  targetPositions: Position[];
  duration: number;
  easingFunction: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
  quality: 'low' | 'medium' | 'high';
  pattern: 'offensive' | 'defensive' | 'balanced';
  onComplete?: () => void;
}

interface ParticleProps {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
}

export function FormationTransitionEffect({
  sourcePositions,
  targetPositions,
  duration,
  easingFunction,
  quality,
  pattern,
  onComplete,
}: FormationTransitionEffectProps) {
  const [progress, setProgress] = React.useState(0);
  const [particles, setParticles] = React.useState<ParticleProps[]>([]);

  // Quality-based settings
  const _particleCount = quality === 'high' ? 16 : quality === 'medium' ? 8 : 4;
  const trailLength = quality === 'high' ? 8 : quality === 'medium' ? 4 : 2;
  const glowIntensity = quality === 'high' ? '12px' : quality === 'medium' ? '8px' : '4px';

  // Pattern-based colors
  const getPatternColor = () => {
    switch (pattern) {
      case 'offensive':
        return 'rgb(239, 68, 68)'; // red-500
      case 'defensive':
        return 'rgb(59, 130, 246)'; // blue-500
      case 'balanced':
        return 'rgb(168, 85, 247)'; // purple-500
    }
  };

  // Easing functions
  const getEasedProgress = (p: number) => {
    switch (easingFunction) {
      case 'easeIn':
        return p * p;
      case 'easeOut':
        return 1 - (1 - p) * (1 - p);
      case 'easeInOut':
        return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      default:
        return p;
    }
  };

  React.useEffect(() => {
    const startTime = Date.now();
    const color = getPatternColor();

    const updateFrame = () => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(1, elapsed / duration);
      const easedProgress = getEasedProgress(rawProgress);
      setProgress(easedProgress);

      // Update particle effects
      const newParticles: ParticleProps[] = [];

      sourcePositions.forEach((source, index) => {
        const target = targetPositions[index];
        if (!target) {
          return;
        }

        // Calculate current position
        const _currentX = source.x + (target.x - source.x) * easedProgress;
        const _currentY = source.y + (target.y - source.y) * easedProgress;

        // Add trail particles
        for (let i = 0; i < trailLength; i++) {
          const trailProgress = Math.max(0, easedProgress - (i / trailLength) * 0.2);
          const trailX = source.x + (target.x - source.x) * trailProgress;
          const trailY = source.y + (target.y - source.y) * trailProgress;

          newParticles.push({
            x: trailX,
            y: trailY,
            size: 4 * (1 - i / trailLength),
            opacity: 0.3 * (1 - i / trailLength),
            color,
          });
        }

        // Add additional particles based on quality setting
        for (let i = 0; i < _particleCount; i++) {
          // Calculate random position along the path
          const randomProgress = Math.random() * easedProgress;
          const particleX = source.x + (target.x - source.x) * randomProgress;
          const particleY = source.y + (target.y - source.y) * randomProgress;

          // Add some randomness to particle position
          const jitter = 5;
          const jitterX = (Math.random() - 0.5) * jitter;
          const jitterY = (Math.random() - 0.5) * jitter;

          newParticles.push({
            x: particleX + jitterX,
            y: particleY + jitterY,
            size: 3 * Math.random() + 1,
            opacity: 0.2 * Math.random() + 0.1,
            color,
          });
        }

        // Add a particle at the current position for better visualization
        newParticles.push({
          x: _currentX,
          y: _currentY,
          size: 6,
          opacity: 0.5,
          color,
        });
      });

      setParticles(newParticles);

      if (rawProgress < 1) {
        requestAnimationFrame(updateFrame);
      } else {
        onComplete?.();
      }
    };

    const frameId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(frameId);
  }, [
    sourcePositions,
    targetPositions,
    duration,
    easingFunction,
    quality,
    pattern,
    onComplete,
    trailLength,
    _particleCount,
  ]);

  // Create formation lines
  const formationLines = sourcePositions.map((source, index) => {
    const target = targetPositions[index];
    if (!target) {
      return null;
    }

    const _currentX = source.x + (target.x - source.x) * progress;
    const _currentY = source.y + (target.y - source.y) * progress;

    return React.createElement('line', {
      key: index,
      x1: source.x,
      y1: source.y,
      x2: _currentX,
      y2: _currentY,
      stroke: getPatternColor(),
      strokeWidth: '2',
      strokeDasharray: '4 4',
      className: 'opacity-30',
    });
  });

  // Create particles
  const particleElements = particles.map((particle, index) => {
    return React.createElement('div', {
      key: `particle-${index}`,
      className: 'absolute rounded-full transition-all duration-100',
      style: {
        left: particle.x,
        top: particle.y,
        width: particle.size,
        height: particle.size,
        backgroundColor: particle.color,
        opacity: particle.opacity,
        transform: 'translate(-50%, -50%)',
        filter: `blur(${glowIntensity})`,
      },
    });
  });

  return React.createElement('div', { className: 'pointer-events-none absolute inset-0' }, [
    // Formation Lines
    React.createElement('svg', { className: 'absolute inset-0', key: 'svg' }, formationLines),
    // Particles
    ...particleElements,
  ]);
}
