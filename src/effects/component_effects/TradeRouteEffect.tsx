/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { Database } from 'lucide-react';
import * as React from 'react';

interface TradeRouteEffectProps {
  source: { x: number; y: number };
  target: { x: number; y: number };
  volume: number;
  active: boolean;
  quality: 'low' | 'medium' | 'high';
}

export function TradeRouteEffect({
  source,
  target,
  volume,
  active,
  quality,
}: TradeRouteEffectProps) {
  const particleCount = quality === 'high' ? 8 : quality === 'medium' ? 5 : 3;
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

  return React.createElement(
    'g',
    null,
    /* Base Route */
    React.createElement('path', {
      d: path,
      stroke: 'rgba(99, 102, 241, 0.3)',
      strokeWidth: 2 + volume * 2,
      fill: 'none',
      filter: `blur(${glowIntensity}px)`,
    }),

    /* Animated Flow */
    active &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement('path', {
          d: path,
          stroke: 'url(#route-gradient)',
          strokeWidth: 2 + volume * 2,
          fill: 'none',
          className: 'trade-route',
        }),

        /* Flow Particles */
        Array.from({ length: particleCount }).map((_, i) => {
          const progress = (i / particleCount + Date.now() / 2000) % 1;
          const point = getPointOnPath(path, progress);

          return React.createElement(
            'g',
            {
              key: i,
              transform: `translate(${point.x}, ${point.y})`,
              className: 'animate-pulse',
            },
            React.createElement('circle', {
              r: 2 + volume,
              fill: 'rgba(99, 102, 241, 0.5)',
              filter: `blur(${glowIntensity / 2}px)`,
            })
          );
        })
      ),

    /* Route Indicator */
    React.createElement(
      'g',
      { transform: `translate(${midX}, ${midY - curvature})` },
      React.createElement('circle', {
        r: 8 + volume * 4,
        fill: 'rgba(99, 102, 241, 0.2)',
        className: 'animate-pulse',
      }),
      React.createElement(Database, {
        className: 'h-4 w-4 -translate-x-2 -translate-y-2 transform text-indigo-400',
      })
    )
  );
}

function getPointOnPath(path: string, progress: number): { x: number; y: number } {
  // Simple linear interpolation for demo
  // In production, use proper path interpolation
  const match = path.match(/M ([\d.-]+) ([\d.-]+) Q ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)/);
  if (!match) {
    return { x: 0, y: 0 };
  }

  const [, x1, y1, cx, cy, x2, y2] = match.map(Number);
  const t = progress;
  const u = 1 - t;

  return {
    x: u * u * x1 + 2 * u * t * cx + t * t * x2,
    y: u * u * y1 + 2 * u * t * cy + t * t * y2,
  };
}
