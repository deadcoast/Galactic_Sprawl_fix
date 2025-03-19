/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { Crown, Star, Zap } from 'lucide-react';
import * as React from 'react';
import { ResourceType } from './../../types/resources/ResourceTypes';
interface BuildingUpgradeEffectProps {
  tier: 1 | 2 | 3;
  type: 'radar' | 'mining' | ResourceType.RESEARCH | 'defense';
  upgradeProgress: number;
  quality: 'low' | 'medium' | 'high';
}

export function BuildingUpgradeEffect({
  tier,
  type,
  upgradeProgress,
  quality,
}: BuildingUpgradeEffectProps) {
  const getTypeColor = () => {
    switch (type) {
      case 'radar':
        return 'cyan';
      case 'mining':
        return 'amber';
      case ResourceType.RESEARCH:
        return 'violet';
      case 'defense':
        return 'rose';
      default:
        return 'blue';
    }
  };

  const color = getTypeColor();
  const particleCount = quality === 'high' ? 12 : quality === 'medium' ? 8 : 4;

  return React.createElement(
    'div',
    { className: 'pointer-events-none absolute inset-0 overflow-hidden' },
    /* Tier Indicator */
    React.createElement(
      'div',
      {
        className: `absolute right-2 top-2 rounded-full px-3 py-1.5 bg-${color}-500/20 border border-${color}-500/30`,
      },
      React.createElement(
        'div',
        { className: 'flex items-center space-x-2' },
        React.createElement(Crown, { className: `h-4 w-4 text-${color}-400` }),
        React.createElement(
          'div',
          { className: 'flex items-center space-x-1' },
          Array.from({ length: tier }).map((_, i) =>
            React.createElement(Star, { key: i, className: `h-3 w-3 text-${color}-400` })
          )
        )
      )
    ),

    /* Energy Field Effect */
    React.createElement(
      'div',
      { className: 'absolute inset-0' },
      React.createElement('div', {
        className: `bg-gradient-radial absolute inset-0 from-${color}-500/20 via-${color}-500/10 to-transparent`,
        style: {
          opacity: 0.3 + upgradeProgress * 0.7,
          transform: `scale(${1 + upgradeProgress * 0.3})`,
        },
      }),

      /* Particle System */
      Array.from({ length: particleCount }).map((_, i) =>
        React.createElement('div', {
          key: i,
          className: `absolute h-2 w-2 rounded-full bg-${color}-400`,
          style: {
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${3 + Math.random() * 2}s infinite`,
            opacity: 0.3 + Math.random() * 0.7,
          },
        })
      ),

      /* Energy Arcs */
      quality !== 'low' &&
        React.createElement(
          'svg',
          { className: 'absolute inset-0', viewBox: '0 0 100 100' },
          Array.from({ length: tier * 2 }).map((_, i) =>
            React.createElement('path', {
              key: i,
              d: `M ${20 + Math.random() * 60} ${20 + Math.random() * 60} Q ${50} ${50} ${20 + Math.random() * 60} ${20 + Math.random() * 60}`,
              stroke: `rgb(var(--color-${color}-400))`,
              strokeWidth: '0.5',
              fill: 'none',
              className: 'animate-pulse',
              style: { opacity: 0.3 + Math.random() * 0.4 },
            })
          )
        ),

      /* Upgrade Progress Ring */
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
          strokeDasharray: `${upgradeProgress * 283} 283`,
          transform: 'rotate(-90 50 50)',
          className: 'opacity-30',
        })
      ),

      /* Type-specific Effects */
      type === 'radar' &&
        React.createElement(
          'div',
          { className: 'absolute inset-0 flex items-center justify-center' },
          React.createElement('div', {
            className: `h-1/2 w-1/2 rounded-full border-2 border-${color}-500/30 animate-ping`,
            style: { animationDuration: '3s' },
          })
        ),
      type === 'mining' &&
        React.createElement(
          'div',
          { className: 'absolute inset-0 flex items-center justify-center' },
          React.createElement(Zap, { className: `h-12 w-12 text-${color}-400 animate-pulse` })
        )
    ),

    /* Tier 3 Special Effects */
    tier === 3 &&
      React.createElement(
        'div',
        { className: 'absolute inset-0' },
        /* Ambient Glow */
        React.createElement('div', {
          className: `absolute inset-0 bg-${color}-500/10 animate-pulse`,
          style: { filter: `blur(${quality === 'high' ? 20 : 10}px)` },
        }),

        /* Power Lines */
        quality !== 'low' &&
          React.createElement(
            'svg',
            { className: 'absolute inset-0', viewBox: '0 0 100 100' },
            Array.from({ length: 6 }).map((_, i) =>
              React.createElement('line', {
                key: i,
                x1: 10 + Math.random() * 80,
                y1: 10 + Math.random() * 80,
                x2: 10 + Math.random() * 80,
                y2: 10 + Math.random() * 80,
                stroke: `rgb(var(--color-${color}-400))`,
                strokeWidth: '0.5',
                className: 'animate-pulse',
                style: {
                  opacity: 0.3 + Math.random() * 0.4,
                  strokeDasharray: '4 4',
                },
              })
            )
          )
      )
  );
}
