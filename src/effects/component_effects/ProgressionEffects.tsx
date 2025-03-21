/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { Star, Zap } from 'lucide-react';
import * as React from 'react';

interface ProgressionEffectsProps {
  tier: 1 | 2 | 3;
  type: 'building' | 'ship' | 'technology';
  progress: number;
  quality: 'low' | 'medium' | 'high';
}

export function ProgressionEffects({ tier, type, progress, quality }: ProgressionEffectsProps) {
  const getEffectColor = () => {
    switch (tier) {
      case 1:
        return 'cyan';
      case 2:
        return 'violet';
      case 3:
        return 'amber';
      default:
        return 'blue';
    }
  };

  const color = getEffectColor();
  const particleCount = quality === 'high' ? 8 : quality === 'medium' ? 5 : 3;

  return React.createElement(
    'div',
    { className: 'pointer-events-none absolute inset-0 overflow-hidden' },
    /* Tier Indicator */
    React.createElement(
      'div',
      {
        className: `absolute right-2 top-2 rounded-full px-2 py-1 bg-${color}-500/20 border border-${color}-500/30`,
      },
      React.createElement(
        'div',
        { className: 'flex items-center space-x-1' },
        Array.from({ length: tier }).map((_, i) =>
          React.createElement(Star, { key: i, className: `h-3 w-3 text-${color}-400` })
        )
      )
    ),

    /* Progress Effects */
    React.createElement(
      'div',
      { className: 'absolute inset-0' },
      /* Energy Field */
      React.createElement('div', {
        className: `bg-gradient-radial absolute inset-0 from-${color}-500/20 to-transparent`,
        style: {
          opacity: progress,
          transform: `scale(${1 + progress * 0.2})`,
        },
      }),

      /* Particle Effects */
      Array.from({ length: particleCount }).map((_, i) =>
        React.createElement('div', {
          key: i,
          className: `absolute h-2 w-2 rounded-full bg-${color}-400`,
          style: {
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${3 + Math.random() * 2}s infinite`,
            opacity: 0.5 + Math.random() * 0.5,
          },
        })
      ),

      /* Type-specific Effects */
      type === 'building' &&
        React.createElement('div', {
          className: `absolute inset-0 border-2 border-${color}-500/30 rounded-lg`,
        }),
      type === 'ship' &&
        React.createElement('div', {
          className: `absolute inset-0 bg-${color}-500/10 rounded-lg backdrop-blur-sm`,
        }),
      type === 'technology' &&
        React.createElement(
          'div',
          { className: 'absolute inset-0 flex items-center justify-center' },
          React.createElement(Zap, { className: `h-8 w-8 text-${color}-400 animate-pulse` })
        )
    ),

    /* Progress Ring */
    React.createElement(
      'svg',
      { className: 'absolute inset-0', viewBox: '0 0 100 100' },
      React.createElement('circle', {
        cx: '50',
        cy: '50',
        r: '45',
        fill: 'none',
        stroke: `rgb(var(--color-${color}-500))`,
        strokeWidth: '2',
        strokeDasharray: `${progress * 283} 283`,
        transform: 'rotate(-90 50 50)',
        className: 'opacity-30',
      })
    )
  );
}
