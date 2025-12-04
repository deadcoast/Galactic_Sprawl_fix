import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { ResourceType } from './../../types/resources/ResourceTypes';

interface ResourceFlowVisualizationProps {
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  resourceType:
    | ResourceType.ENERGY
    | ResourceType.MINERALS
    | ResourceType.RESEARCH
    | ResourceType.POPULATION;
  flowRate: number; // 0-100
  quality: 'low' | 'medium' | 'high';
}

/**
 * ResourceFlowVisualization component
 *
 * Renders an animated flow of resources between two points.
 * The flow rate and appearance changes based on the resource type and flow rate.
 */
export function ResourceFlowVisualization({
  sourcePosition,
  targetPosition,
  resourceType,
  flowRate,
  quality,
}: ResourceFlowVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate path properties
  const dx = targetPosition.x - sourcePosition.x;
  const dy = targetPosition.y - sourcePosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Determine particle count based on quality and flow rate
  const baseParticleCount = quality === 'high' ? 20 : quality === 'medium' ? 12 : 6;
  const particleCount = Math.max(1, Math.floor(baseParticleCount * (flowRate / 100)));

  // Determine particle speed based on flow rate
  const baseSpeed = 2 + flowRate / 20; // 2-7 seconds based on flow rate

  // Resource type specific properties
  const resourceColors = {
    [ResourceType.ENERGY]: {
      primary: '#FFD700',
      secondary: '#B8860B',
      glow: 'rgba(255, 215, 0, 0.6)',
    },
    [ResourceType.MINERALS]: {
      primary: '#A0522D',
      secondary: '#8B4513',
      glow: 'rgba(160, 82, 45, 0.6)',
    },
    [ResourceType.RESEARCH]: {
      primary: '#9370DB',
      secondary: '#4B0082',
      glow: 'rgba(147, 112, 219, 0.6)',
    },
    [ResourceType.POPULATION]: {
      primary: '#32CD32',
      secondary: '#006400',
      glow: 'rgba(50, 205, 50, 0.6)',
    },
  } as const;

  const colors = resourceColors[resourceType];

  // Draw the flow path
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const ctx = (container.querySelector('canvas')!).getContext('2d');

    if (!ctx) {
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, container.clientWidth, container.clientHeight);

    // Don't draw path if flow rate is too low
    if (flowRate < 5) {
      return;
    }

    // Draw flow path
    const startX = 0;
    const startY = container.clientHeight / 2;
    const endX = container.clientWidth;
    const endY = container.clientHeight / 2;

    // Create gradient
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, colors.primary);
    gradient.addColorStop(1, colors.secondary);

    // Draw path
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Create a slightly curved path
    const controlPointX = container.clientWidth / 2;
    const controlPointY = container.clientHeight / 2 + (Math.random() * 20 - 10);

    ctx.quadraticCurveTo(controlPointX, controlPointY, endX, endY);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = Math.max(1, flowRate / 20);
    ctx.globalAlpha = Math.min(0.7, flowRate / 100);
    ctx.stroke();

    // Add glow effect for high quality
    if (quality === 'high' && flowRate > 30) {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [sourcePosition, targetPosition, resourceType, flowRate, quality, colors]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute"
      style={{
        left: sourcePosition.x,
        top: sourcePosition.y,
        width: distance,
        height: 20,
        transform: `rotate(${angle}deg)`,
        transformOrigin: '0 50%',
      }}
    >
      {/* Canvas for the flow path */}
      <canvas width={distance} height={20} className="absolute inset-0" />

      {/* Particles */}
      {Array.from({ length: particleCount }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full"
          style={{
            backgroundColor: i % 2 === 0 ? colors.primary : colors.secondary,
            width: Math.max(2, Math.min(6, flowRate / 20)),
            height: Math.max(2, Math.min(6, flowRate / 20)),
            top: '50%',
            boxShadow:
              quality !== 'low' ? `0 0 ${quality === 'high' ? 8 : 4}px ${colors.glow}` : 'none',
          }}
          animate={{
            x: [0, distance],
            y: [0, Math.sin(i) * 10],
          }}
          transition={{
            duration: baseSpeed - (i % 3) * 0.5,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'linear',
            delay: (i / particleCount) * baseSpeed,
          }}
        />
      ))}

      {/* Flow rate indicator (only for high flow rates) */}
      {flowRate > 50 && quality !== 'low' && (
        <motion.div
          className="absolute text-xs font-bold"
          style={{
            color: colors.primary,
            top: -15,
            left: distance / 2,
            textShadow: `0 0 4px ${colors.glow}`,
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {flowRate.toFixed(0)}
        </motion.div>
      )}
    </div>
  );
}
