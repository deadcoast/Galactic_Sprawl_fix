import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface DetectedObject {
  id: string;
  position: { x: number; y: number }; // Normalized position (0-1)
  size: number; // Size factor (0-1)
  type: 'friendly' | 'hostile' | 'neutral' | 'unknown';
  confidence: number; // Detection confidence (0-1)
  velocity?: { x: number; y: number }; // Optional velocity vector
  name?: string; // Optional name/identifier
  distance?: number; // Optional distance in light years or other unit
}

interface DetectionVisualizationProps {
  size: number;
  detectedObjects: DetectedObject[];
  selectedObjectId?: string;
  quality?: 'low' | 'medium' | 'high';
  onObjectClick?: (objectId: string) => void;
  onObjectHover?: (objectId: string | null) => void;
  showLabels?: boolean;
  showVelocity?: boolean;
}

/**
 * DetectionVisualization component
 *
 * Visualizes detected objects on a radar display with different visual representations
 * based on object type, confidence level, and selection state.
 */
export function DetectionVisualization({
  size,
  detectedObjects,
  selectedObjectId,
  quality = 'medium',
  onObjectClick,
  onObjectHover,
  showLabels = true,
  showVelocity = true,
}: DetectionVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);

  // Draw detection visualization
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

    // Draw detected objects
    detectedObjects.forEach(object => {
      const center = size / 2;

      // Calculate position on canvas
      const x = center + (object.position.x - 0.5) * size;
      const y = center + (object.position.y - 0.5) * size;

      // Calculate object size based on size factor
      const objectSize = 4 + object.size * 8;

      // Determine if object is selected or hovered
      const isSelected = object.id === selectedObjectId;
      const isHovered = object.id === hoveredObjectId;

      // Draw object based on type
      ctx.beginPath();

      // Different shapes for different types
      switch (object.type) {
        case 'friendly':
          // Draw a circle for friendly objects
          ctx.arc(x, y, objectSize, 0, Math.PI * 2);
          break;
        case 'hostile':
          // Draw a diamond for hostile objects
          ctx.moveTo(x, y - objectSize);
          ctx.lineTo(x + objectSize, y);
          ctx.lineTo(x, y + objectSize);
          ctx.lineTo(x - objectSize, y);
          ctx.closePath();
          break;
        case 'neutral':
          // Draw a square for neutral objects
          ctx.rect(x - objectSize / 2, y - objectSize / 2, objectSize, objectSize);
          break;
        case 'unknown':
          // Draw a triangle for unknown objects
          ctx.moveTo(x, y - objectSize);
          ctx.lineTo(x + objectSize, y + objectSize);
          ctx.lineTo(x - objectSize, y + objectSize);
          ctx.closePath();
          break;
      }

      // Fill based on confidence and type
      let fillColor;
      switch (object.type) {
        case 'friendly':
          fillColor = `rgba(0, 255, 0, ${0.3 + object.confidence * 0.7})`;
          break;
        case 'hostile':
          fillColor = `rgba(255, 0, 0, ${0.3 + object.confidence * 0.7})`;
          break;
        case 'neutral':
          fillColor = `rgba(0, 150, 255, ${0.3 + object.confidence * 0.7})`;
          break;
        case 'unknown':
          fillColor = `rgba(255, 255, 0, ${0.3 + object.confidence * 0.7})`;
          break;
        default:
          fillColor = `rgba(150, 150, 150, ${0.3 + object.confidence * 0.7})`;
      }

      ctx.fillStyle = fillColor;
      ctx.fill();

      // Draw stroke for selected or hovered objects
      if (isSelected || isHovered) {
        ctx.strokeStyle = isSelected ? 'white' : 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // Draw selection ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(x, y, objectSize + 5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      } else {
        // Normal stroke
        ctx.strokeStyle = fillColor.replace('rgba', 'rgba').replace(')', ', 0.8)');
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw velocity vector if available and enabled
      if (showVelocity && object.velocity && (object.velocity.x !== 0 || object.velocity.y !== 0)) {
        const velocityScale = 20; // Scale factor for velocity vector
        const vx = x + object.velocity.x * velocityScale;
        const vy = y + object.velocity.y * velocityScale;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(vx, vy);
        ctx.strokeStyle = fillColor.replace('rgba', 'rgba').replace(')', ', 0.6)');
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(vy - y, vx - x);
        const arrowSize = 5;

        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(
          vx - arrowSize * Math.cos(angle - Math.PI / 6),
          vy - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          vx - arrowSize * Math.cos(angle + Math.PI / 6),
          vy - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = fillColor.replace('rgba', 'rgba').replace(')', ', 0.6)');
        ctx.fill();
      }

      // Draw confidence indicator (only for medium and high quality)
      if (quality !== 'low') {
        const confidenceRadius = objectSize + 3;
        const confidenceAngle = object.confidence * Math.PI * 2;

        ctx.beginPath();
        ctx.arc(x, y, confidenceRadius, 0, confidenceAngle);
        ctx.strokeStyle = fillColor.replace('rgba', 'rgba').replace(')', ', 0.5)');
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw labels if enabled and either high quality or object is selected/hovered
      if (showLabels && (quality === 'high' || isSelected || isHovered) && object.name) {
        ctx.fillStyle = 'white';
        ctx.font = isSelected ? 'bold 12px monospace' : '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(object.name, x, y - objectSize - 5);

        // Draw distance if available (only for high quality or selected/hovered)
        if (object.distance !== undefined) {
          ctx.font = '9px monospace';
          ctx.fillText(`${object.distance.toFixed(1)} LY`, x, y - objectSize - 18);
        }
      }
    });
  }, [size, detectedObjects, selectedObjectId, hoveredObjectId, quality, showLabels, showVelocity]);

  // Create clickable areas for each object
  const renderClickableAreas = () => {
    return detectedObjects.map(object => {
      const center = size / 2;
      const x = center + (object.position.x - 0.5) * size;
      const y = center + (object.position.y - 0.5) * size;
      const objectSize = 4 + object.size * 8;
      const clickAreaSize = objectSize * 2; // Larger clickable area

      return (
        <div
          key={object.id}
          className="absolute cursor-pointer rounded-full"
          style={{
            left: x - clickAreaSize / 2,
            top: y - clickAreaSize / 2,
            width: clickAreaSize,
            height: clickAreaSize,
            opacity: 0, // Invisible but clickable
          }}
          onClick={() => onObjectClick?.(object.id)}
          onMouseEnter={() => {
            setHoveredObjectId(object.id);
            onObjectHover?.(object.id);
          }}
          onMouseLeave={() => {
            setHoveredObjectId(null);
            onObjectHover?.(null);
          }}
        />
      );
    });
  };

  // Render detection confidence pulses for selected object
  const renderConfidencePulse = () => {
    if (!selectedObjectId) {
      return null;
    }

    const selectedObject = detectedObjects.find(obj => obj.id === selectedObjectId);
    if (!selectedObject) {
      return null;
    }

    const center = size / 2;
    const x = center + (selectedObject.position.x - 0.5) * size;
    const y = center + (selectedObject.position.y - 0.5) * size;

    let pulseColor;
    switch (selectedObject.type) {
      case 'friendly':
        pulseColor = 'rgba(0, 255, 0, 0.2)';
        break;
      case 'hostile':
        pulseColor = 'rgba(255, 0, 0, 0.2)';
        break;
      case 'neutral':
        pulseColor = 'rgba(0, 150, 255, 0.2)';
        break;
      case 'unknown':
        pulseColor = 'rgba(255, 255, 0, 0.2)';
        break;
      default:
        pulseColor = 'rgba(150, 150, 150, 0.2)';
    }

    return (
      <motion.div
        className="absolute rounded-full"
        style={{
          left: x,
          top: y,
          width: 10,
          height: 10,
          backgroundColor: pulseColor,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: [1, 3, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    );
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} width={size} height={size} className="absolute top-0 left-0" />

      {/* Confidence Pulse for Selected Object */}
      {renderConfidencePulse()}

      {/* Clickable Areas */}
      {renderClickableAreas()}
    </div>
  );
}
