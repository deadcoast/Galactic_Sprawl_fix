import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface Range {
  id: string;
  distance: number; // Normalized distance (0-1)
  color: string;
  label: string;
  type: 'detection' | 'weapons' | 'communication' | 'custom';
  dashPattern?: number[]; // Optional dash pattern for the circle
  pulseEffect?: boolean; // Whether to add a pulse effect
}

interface RangeIndicatorsProps {
  size: number;
  ranges: Range[];
  centerX?: number; // Optional center X offset (normalized 0-1)
  centerY?: number; // Optional center Y offset (normalized 0-1)
  quality?: 'low' | 'medium' | 'high';
  showLabels?: boolean;
  activeRangeId?: string; // Currently active/highlighted range
  onRangeClick?: (rangeId: string) => void;
}

/**
 * RangeIndicators component
 *
 * Visualizes different detection, weapon, and communication ranges
 * with customizable appearance and interactive elements.
 */
export function RangeIndicators({
  size,
  ranges,
  centerX = 0.5,
  centerY = 0.5,
  quality = 'medium',
  showLabels = true,
  activeRangeId,
  onRangeClick,
}: RangeIndicatorsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate actual center position
  const actualCenterX = size * centerX;
  const actualCenterY = size * centerY;

  // Sort ranges by distance (largest first) to ensure proper drawing order
  const sortedRanges = [...ranges].sort((a, b) => b.distance - a.distance);

  // Draw range indicators
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

    // Set line width based on quality
    const lineWidth = quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1;

    // Draw each range circle
    sortedRanges.forEach(range => {
      const isActive = range.id === activeRangeId;
      const radius = range.distance * (size / 2);

      // Set line style
      ctx.beginPath();
      ctx.lineWidth = isActive ? lineWidth * 1.5 : lineWidth;
      ctx.strokeStyle = isActive ? 'white' : range.color;

      // Apply dash pattern if specified
      if (range.dashPattern && range.dashPattern.length > 0) {
        ctx.setLineDash(range.dashPattern);
      } else {
        ctx.setLineDash([]);
      }

      // Draw circle
      ctx.arc(actualCenterX, actualCenterY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Reset dash pattern
      ctx.setLineDash([]);

      // Draw label if enabled
      if (showLabels) {
        // Determine text position
        const labelAngle = Math.PI / 4; // 45 degrees
        const labelX = actualCenterX + Math.cos(labelAngle) * radius;
        const labelY = actualCenterY + Math.sin(labelAngle) * radius;

        // Draw label background for better readability
        const labelText = `${range.label}`;
        ctx.font = isActive ? 'bold 10px monospace' : '10px monospace';
        const textMetrics = ctx.measureText(labelText);
        const textWidth = textMetrics.width;
        const textHeight = 10; // Approximate height

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(
          labelX - textWidth / 2 - 3,
          labelY - textHeight / 2 - 1,
          textWidth + 6,
          textHeight + 2
        );

        // Draw text
        ctx.fillStyle = isActive ? 'white' : range.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, labelX, labelY);

        // Draw type indicator for high quality
        if (quality === 'high') {
          let typeSymbol = '';
          switch (range.type) {
            case 'detection':
              typeSymbol = '👁️';
              break;
            case 'weapons':
              typeSymbol = '🎯';
              break;
            case 'communication':
              typeSymbol = '📡';
              break;
            case 'custom':
              typeSymbol = '⚙️';
              break;
          }

          if (typeSymbol) {
            ctx.fillText(typeSymbol, labelX, labelY + 15);
          }
        }
      }
    });
  }, [size, sortedRanges, actualCenterX, actualCenterY, quality, showLabels, activeRangeId]);

  // Render pulse effects for ranges with pulseEffect enabled
  const renderPulseEffects = () => {
    return sortedRanges
      .filter(range => range.pulseEffect)
      .map(range => {
        const radius = range.distance * (size / 2);
        const isActive = range.id === activeRangeId;

        return (
          <motion.div
            key={`pulse-${range.id}`}
            className="absolute rounded-full border-2 border-solid"
            style={{
              left: actualCenterX,
              top: actualCenterY,
              width: radius * 2,
              height: radius * 2,
              borderColor: isActive ? 'white' : range.color,
              transform: 'translate(-50%, -50%)',
              opacity: 0,
            }}
            animate={{
              scale: [0.9, 1.1, 0.9],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      });
  };

  // Render clickable areas for each range
  const renderClickableAreas = () => {
    if (!onRangeClick) {
      return null;
    }

    return sortedRanges.map(range => {
      const radius = range.distance * (size / 2);
      const innerRadius = radius - 10;
      const outerRadius = radius + 10;

      return (
        <div
          key={`clickable-${range.id}`}
          className="absolute cursor-pointer"
          style={{
            left: actualCenterX - outerRadius,
            top: actualCenterY - outerRadius,
            width: outerRadius * 2,
            height: outerRadius * 2,
            borderRadius: '50%',
            pointerEvents: 'auto',
            // Use clip-path to create a ring shape
            clipPath: `circle(${outerRadius}px) exclude circle(${innerRadius}px)`,
          }}
          onClick={() => onRangeClick(range.id)}
        />
      );
    });
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} width={size} height={size} className="absolute left-0 top-0" />

      {/* Pulse Effects */}
      {renderPulseEffects()}

      {/* Clickable Areas */}
      {renderClickableAreas()}
    </div>
  );
}
