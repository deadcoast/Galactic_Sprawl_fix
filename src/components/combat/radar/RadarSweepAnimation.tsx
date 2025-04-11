import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface RadarSweepAnimationProps {
  size: number;
  speed?: number; // Rotation speed in seconds per revolution
  color?: string;
  pulseColor?: string;
  backgroundColor?: string;
  quality?: 'low' | 'medium' | 'high';
  isActive?: boolean;
  onSweepComplete?: () => void;
}

/**
 * RadarSweepAnimation component
 *
 * Renders an animated radar sweep effect with customizable appearance and behavior.
 * The sweep rotates around the center and can trigger a callback on each revolution.
 */
export function RadarSweepAnimation({
  size,
  speed = 3,
  color = 'rgba(0, 255, 0, 0.7)',
  pulseColor = 'rgba(0, 255, 0, 0.2)',
  backgroundColor = 'rgba(0, 20, 0, 0.2)',
  quality = 'medium',
  isActive = true,
  onSweepComplete,
}: RadarSweepAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  // Calculate particle count based on quality
  const getParticleCount = () => {
    switch (quality) {
      case 'high':
        return 30;
      case 'medium':
        return 15;
      case 'low':
        return 5;
      default:
        return 15;
    }
  };

  // Animation loop for the sweep
  const animate = (time: number) => {
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = time;
    }

    const deltaTime = time - previousTimeRef.current;
    previousTimeRef.current = time;

    // Calculate new rotation based on speed
    const newRotation = (rotation + (deltaTime * 0.0006) / speed) % 360;
    setRotation(newRotation);

    // Trigger onSweepComplete when a full rotation is completed
    if (Math.floor(rotation / 360) < Math.floor(newRotation / 360)) {
      onSweepComplete?.();
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  // Set up animation loop
  useEffect(() => {
    if (isActive) {
      requestRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isActive, rotation, speed]);

  // Draw radar background and grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    const center = size / 2;
    const radius = size / 2 - 2;

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw outer circle
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw concentric circles
    const circleCount = quality === 'high' ? 4 : quality === 'medium' ? 3 : 2;
    for (let i = 1; i <= circleCount; i++) {
      const circleRadius = (radius * i) / circleCount;
      ctx.beginPath();
      ctx.arc(center, center, circleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 255, 0, ${0.2 + (0.2 / circleCount) * i})`;
      ctx.stroke();
    }

    // Draw grid lines
    ctx.strokeStyle = `rgba(0, 255, 0, 0.3)`;
    ctx.beginPath();
    ctx.moveTo(center, 0);
    ctx.lineTo(center, size);
    ctx.moveTo(0, center);
    ctx.lineTo(size, center);
    ctx.stroke();

    // Draw diagonal grid lines if quality is medium or high
    if (quality !== 'low') {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size, size);
      ctx.moveTo(size, 0);
      ctx.lineTo(0, size);
      ctx.stroke();
    }

    // Draw cardinal directions if quality is high
    if (quality === 'high') {
      ctx.fillStyle = color;
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', center, 15);
      ctx.fillText('E', size - 15, center);
      ctx.fillText('S', center, size - 15);
      ctx.fillText('W', 15, center);
    }
  }, [size, color, backgroundColor, quality]);

  // Render particles based on quality
  const renderParticles = () => {
    if (!isActive) {
      return null;
    }

    const particleCount = getParticleCount();
    const particles = [];
    const center = size / 2;
    const angleRad = (rotation * Math.PI) / 180;
    const angleWidth = Math.PI / 8; // Width of the sweep

    for (let i = 0; i < particleCount; i++) {
      const distance = Math.random() * center;
      const particleAngle = angleRad - Math.random() * angleWidth;
      const x = center + Math.cos(particleAngle) * distance;
      const y = center + Math.sin(particleAngle) * distance;
      const opacity = Math.random() * 0.7 + 0.3;
      const size = Math.random() * 3 + 1;

      particles.push(
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full"
          style={{
            left: x,
            top: y,
            width: size,
            height: size,
            backgroundColor: color,
            opacity,
          }}
          initial={{ opacity }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1 }}
        />
      );
    }

    return particles;
  };

  return (
    <div className="relative overflow-hidden rounded-full" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} width={size} height={size} className="absolute top-0 left-0" />

      {/* Radar Sweep */}
      {isActive && (
        <div
          className="absolute top-0 left-0 h-full w-full"
          style={{
            background: `conic-gradient(from ${rotation}deg, ${color} 0deg, ${color} 30deg, transparent 60deg, transparent 360deg)`,
            opacity: 0.7,
          }}
        />
      )}

      {/* Pulse Effect */}
      {isActive && (
        <motion.div
          className="absolute top-0 left-0 h-full w-full rounded-full"
          style={{ backgroundColor: pulseColor }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Particles */}
      {renderParticles()}

      {/* Center Dot */}
      <div
        className="absolute rounded-full"
        style={{
          left: size / 2 - 2,
          top: size / 2 - 2,
          width: 4,
          height: 4,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
