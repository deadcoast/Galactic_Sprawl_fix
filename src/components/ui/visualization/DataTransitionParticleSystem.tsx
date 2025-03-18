import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useComponentLifecycle } from '../../../hooks/ui/useComponentLifecycle';
import { useComponentRegistration } from '../../../hooks/ui/useComponentRegistration';
import { ParticleSystemManager } from '../../../managers/effects/ParticleSystemManager';
import { Position } from '../../../types/core/Position';
import { ResourceType } from './../../../types/resources/ResourceTypes';

export interface DataPoint {
  id: string;
  position: Position;
  value: number;
  resourceType?: ResourceType;
  size?: number;
  opacity?: number;
}

interface DataTransitionConfig {
  sourceData: DataPoint[];
  targetData: DataPoint[];
  duration?: number;
  easing?: (t: number) => number;
  staggerDelay?: number;
  trailEffect?: boolean;
  blendMode?: 'normal' | 'additive';
  onTransitionComplete?: () => void;
  onTransitionProgress?: (progress: number) => void;
}

interface DataTransitionParticleSystemProps {
  width: number;
  height: number;
  quality?: 'low' | 'medium' | 'high';
  className?: string;
  sourceData: DataPoint[];
  targetData: DataPoint[];
  onTransitionComplete?: () => void;
  onTransitionProgress?: (progress: number) => void;
  duration?: number;
  easing?: (t: number) => number;
  staggerDelay?: number;
  trailEffect?: boolean;
  blendMode?: 'normal' | 'additive';
}

/**
 * DataTransitionParticleSystem
 *
 * A specialized particle system for animating data transitions in visualizations.
 * Extends the base ParticleSystemManager with data-specific transition features.
 */
export const DataTransitionParticleSystem: React.FC<DataTransitionParticleSystemProps> = ({
  width,
  height,
  quality = 'medium',
  className = '',
  sourceData,
  targetData,
  onTransitionComplete,
  onTransitionProgress,
  duration = 1000,
  easing = t => t,
  staggerDelay = 20,
  trailEffect = false,
  blendMode = 'additive',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystemRef = useRef<ParticleSystemManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Register with component registry
  useComponentRegistration({
    type: 'DataTransitionParticleSystem',
    eventSubscriptions: ['RESOURCE_UPDATED', 'RESOURCE_FLOW_UPDATED', 'RESOURCE_THRESHOLD_CHANGED'],
    updatePriority: 'high',
  });

  // Initialize particle system
  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;

    particleSystemRef.current = ParticleSystemManager.getInstance();
    setIsInitialized(true);

    return () => {
      if (particleSystemRef.current) {
        particleSystemRef.current.cleanup();
      }
    };
  }, [isInitialized]);

  // Handle component lifecycle
  useComponentLifecycle({
    onMount: () => {
      console.warn('DataTransitionParticleSystem mounted');
    },
    onUnmount: () => {
      console.warn('DataTransitionParticleSystem unmounted');
    },
  });

  // Start transition when data changes
  useEffect(() => {
    if (!particleSystemRef.current || !isInitialized) return;

    // Create particle configuration
    const particleConfig = {
      maxParticles: Math.max(sourceData.length, targetData.length),
      spawnRate: 0,
      position: { x: 0, y: 0 },
      spread: 0,
      initialVelocity: {
        min: { x: 0, y: 0 },
        max: { x: 0, y: 0 },
      },
      acceleration: { x: 0, y: 0 },
      size: {
        min: 2,
        max: 8,
      },
      life: {
        min: duration,
        max: duration,
      },
      color: '#ffffff',
      blendMode: blendMode as 'normal' | 'additive',
      quality,
    };

    // Create transition particles
    sourceData.forEach((source, index) => {
      const target = targetData[index] || targetData[targetData.length - 1];
      const delay = index * staggerDelay;

      particleSystemRef.current?.createParticleSystem(`transition-${index}`, {
        ...particleConfig,
        position: source.position,
        color: getResourceColor(source.resourceType),
        size: {
          min: source.size || 2,
          max: target.size || 8,
        },
      });
    });

    // Start animation loop
    const startTime = performance.now();
    let animationFrame: number;

    const animate = () => {
      const currentTime = performance.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Update particle positions
      sourceData.forEach((source, index) => {
        const target = targetData[index] || targetData[targetData.length - 1];
        const particleProgress = easing(progress);

        const currentPosition = {
          x: source.position.x + (target.position.x - source.position.x) * particleProgress,
          y: source.position.y + (target.position.y - source.position.y) * particleProgress,
        };

        particleSystemRef.current?.update(1 / 60);
      });

      // Report progress
      onTransitionProgress?.(progress);

      // Continue animation or complete
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        onTransitionComplete?.();
      }
    };

    animationFrame = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrame);
      sourceData.forEach((_, index) => {
        particleSystemRef.current?.removeSystem(`transition-${index}`);
      });
    };
  }, [
    sourceData,
    targetData,
    duration,
    easing,
    staggerDelay,
    trailEffect,
    blendMode,
    quality,
    onTransitionComplete,
    onTransitionProgress,
  ]);

  return (
    <div
      ref={containerRef}
      className={`data-transition-particle-system ${className}`}
      style={{ width, height, position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

// Helper function to get color for resource type
const getResourceColor = (resourceType?: ResourceType): string => {
  if (!resourceType) return '#ffffff';

  switch (resourceType) {
    case ResourceType.MINERALS:
      return '#4CAF50';
    case ResourceType.ENERGY:
      return '#FFC107';
    case ResourceType.PLASMA:
      return '#9C27B0';
    case ResourceType.GAS:
      return '#03A9F4';
    case ResourceType.RESEARCH:
      return '#3F51B5';
    default:
      return '#9E9E9E';
  }
};

export default DataTransitionParticleSystem;
