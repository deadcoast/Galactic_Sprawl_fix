import React from "react";
import { useMemo } from 'react';

interface FormationVisualizerProps {
  pattern: string;
  type: 'offensive' | 'defensive' | 'balanced';
  facing: number;
  spacing: number;
  width: number;
  height: number;
}

/**
 * FormationVisualizer - Renders a visual representation of a fleet formation
 */
export function FormationVisualizer({
  pattern,
  type,
  facing,
  spacing,
  width,
  height,
}: FormationVisualizerProps) {
  // Calculate the number of ship indicators to show based on spacing and container size
  const shipCount = useMemo(
    () => Math.max(3, Math.min(10, Math.floor(width / (spacing / 3)))),
    [width, spacing]
  );

  // Generate ship positions based on formation pattern
  const shipPositions = useMemo(() => {
    const positions = [];
    const centerX = width / 2;
    const centerY = height / 2;

    // Formation pattern calculations
    switch (pattern) {
      case 'spearhead':
        for (let i = 0; i < shipCount; i++) {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const offsetX = (col - 1) * (spacing / 4);
          const offsetY = row * (spacing / 4);
          positions.push({ x: centerX + offsetX, y: centerY - offsetY - 20 });
        }
        break;

      case 'shield':
        for (let i = 0; i < shipCount; i++) {
          const angle = Math.PI * 0.8 * (i / (shipCount - 1)) + Math.PI * 0.1;
          const radius = height / 2.5;
          positions.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
          });
        }
        break;

      case 'diamond':
        for (let i = 0; i < shipCount; i++) {
          const angle = Math.PI * 2 * (i / shipCount);
          const radius = i === 0 ? 0 : height / 3;
          positions.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
          });
        }
        break;

      case 'arrow':
        for (let i = 0; i < shipCount; i++) {
          if (i === 0) {
            positions.push({ x: centerX, y: centerY - 20 });
          } else {
            const side = i % 2 === 0 ? 1 : -1;
            const row = Math.floor((i + 1) / 2);
            positions.push({
              x: centerX + side * spacing * 0.4 * row,
              y: centerY + spacing * 0.3 * row,
            });
          }
        }
        break;

      case 'circle':
        for (let i = 0; i < shipCount; i++) {
          const angle = Math.PI * 2 * (i / shipCount);
          const radius = height / 3;
          positions.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
          });
        }
        break;

      case 'wedge':
        for (let i = 0; i < shipCount; i++) {
          if (i === 0) {
            positions.push({ x: centerX, y: centerY - 20 });
          } else {
            const side = i % 2 === 0 ? 1 : -1;
            const row = Math.floor((i + 1) / 2);
            const offset = row * (spacing / 5);
            positions.push({
              x: centerX + side * offset,
              y: centerY + offset,
            });
          }
        }
        break;

      case 'line':
        for (let i = 0; i < shipCount; i++) {
          positions.push({
            x: centerX - width / 2 + width * (i / (shipCount - 1)),
            y: centerY,
          });
        }
        break;

      case 'scattered':
        for (let i = 0; i < shipCount; i++) {
          positions.push({
            x: centerX - width / 3 + (Math.random() * width) / 1.5,
            y: centerY - height / 3 + (Math.random() * height) / 1.5,
          });
        }
        break;

      default:
        // Default to line formation
        for (let i = 0; i < shipCount; i++) {
          positions.push({
            x: centerX - width / 2 + width * (i / (shipCount - 1)),
            y: centerY,
          });
        }
    }

    return positions;
  }, [pattern, shipCount, width, height, spacing]);

  // Determine color based on formation type
  const formationColor = useMemo(() => {
    switch (type) {
      case 'offensive':
        return 'rgb(239, 68, 68)'; // red-500
      case 'defensive':
        return 'rgb(59, 130, 246)'; // blue-500
      case 'balanced':
        return 'rgb(168, 85, 247)'; // purple-500
      default:
        return 'rgb(255, 255, 255)';
    }
  }, [type]);

  return (
    <div className="relative" style={{ width, height }}>
      {/* Background Grid */}
      <div className="absolute inset-0 overflow-hidden rounded-lg border border-gray-700 bg-gray-900/20">
        <svg width={width} height={height} className="opacity-25">
          <defs>
            <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Formation Shape Outline */}
      <div
        className="absolute border-2 transition-all duration-500"
        style={{
          width: width * 0.6,
          height: height * 0.6,
          top: height * 0.2,
          left: width * 0.2,
          borderColor: `${formationColor}50`,
          clipPath: getFormationClipPath(pattern),
          transform: `rotate(${facing}rad)`,
          transformOrigin: 'center',
        }}
      />

      {/* Ship Positions */}
      {shipPositions.map((pos, index) => (
        <div
          key={index}
          className="absolute transition-all duration-300"
          style={{
            width: index === 0 ? 12 : 10,
            height: index === 0 ? 12 : 10,
            borderRadius: '50%',
            backgroundColor: index === 0 ? formationColor : `${formationColor}80`,
            border: `1px solid ${formationColor}`,
            transform: 'translate(-50%, -50%)',
            top: pos.y,
            left: pos.x,
            boxShadow: index === 0 ? `0 0 10px ${formationColor}` : 'none',
          }}
        />
      ))}

      {/* Direction Indicator */}
      <div
        className="absolute h-0 w-0 transition-all duration-500"
        style={{
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: `12px solid ${formationColor}`,
          transform: `rotate(${facing}rad) translateX(-50%)`,
          transformOrigin: 'center bottom',
          bottom: height * 0.1,
          left: width / 2,
        }}
      />
    </div>
  );
}

/**
 * Helper function to get CSS clip-path for formation patterns
 */
function getFormationClipPath(pattern: string): string {
  switch (pattern) {
    case 'spearhead':
      return 'polygon(50% 0%, 100% 100%, 0% 100%)';
    case 'shield':
      return 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)';
    case 'diamond':
      return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    case 'arrow':
      return 'polygon(0% 0%, 100% 50%, 0% 100%, 25% 50%)';
    case 'circle':
      return 'circle(50% at 50% 50%)';
    case 'wedge':
      return 'polygon(0% 0%, 100% 50%, 0% 100%)';
    case 'line':
      return 'polygon(0% 40%, 100% 40%, 100% 60%, 0% 60%)';
    case 'scattered':
      return 'polygon(20% 20%, 80% 20%, 80% 80%, 20% 80%)';
    default:
      return 'none';
  }
}
