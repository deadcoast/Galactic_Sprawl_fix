/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { Crown, Zap } from 'lucide-react';
import * as React from 'react';

interface CentralMothershipProps {
  tier: 1 | 2 | 3;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  power: number;
  maxPower: number;
  quality: 'low' | 'medium' | 'high';
  onHover?: () => void;
  onClick?: () => void;
}

export function CentralMothership({
  tier,
  health,
  maxHealth,
  shield,
  maxShield,
  power,
  maxPower,
  quality,
  onHover,
  onClick,
}: CentralMothershipProps) {
  const particleCount = quality === 'high' ? 16 : quality === 'medium' ? 8 : 4;
  const glowIntensity = quality === 'low' ? 4 : quality === 'medium' ? 8 : 12;

  return React.createElement(
    'div',
    { className: 'relative h-96 w-96 cursor-pointer', onMouseEnter: onHover, onClick: onClick },
    /* Base Structure */
    React.createElement(
      'div',
      { className: 'absolute inset-0 flex items-center justify-center' },
      React.createElement(
        'div',
        { className: 'relative' },
        /* Core Structure */
        React.createElement(
          'div',
          {
            className:
              'flex h-48 w-48 items-center justify-center rounded-full border-4 border-indigo-500/30 bg-gray-800/80',
          },
          React.createElement(
            'div',
            {
              className: 'flex h-32 w-32 items-center justify-center rounded-full bg-indigo-900/50',
            },
            React.createElement(Crown, { className: 'h-16 w-16 text-indigo-400' })
          )
        ),

        /* Rotating Rings */
        Array.from({ length: tier }).map((_, i) =>
          React.createElement('div', {
            key: i,
            className: 'absolute inset-0 rounded-full border-2 border-indigo-500/20',
            style: {
              animation: `spin ${20 + i * 10}s linear infinite`,
              transform: `scale(${1.2 + i * 0.2}) rotate(${i * 30}deg)`,
            },
          })
        ),

        /* Shield Effect */
        shield > 0 &&
          React.createElement('div', {
            className: 'absolute inset-0 rounded-full border-2 border-cyan-500/30',
            style: {
              transform: `scale(${1.5})`,
              opacity: shield / maxShield,
              filter: `blur(${glowIntensity}px)`,
            },
          }),

        /* Power Indicators */
        Array.from({ length: 4 }).map((_, i) =>
          React.createElement(
            'div',
            {
              key: i,
              className: 'absolute',
              style: {
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 90}deg) translateY(-80px)`,
                opacity: power / maxPower,
              },
            },
            React.createElement(Zap, { className: 'h-6 w-6 animate-pulse text-indigo-400' })
          )
        ),

        /* Particle Effects */
        Array.from({ length: particleCount }).map((_, i) =>
          React.createElement('div', {
            key: i,
            className: 'animate-float absolute h-2 w-2 rounded-full bg-indigo-400',
            style: {
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: 0.5 + Math.random() * 0.5,
            },
          })
        )
      )
    ),

    /* Status Indicators */
    React.createElement(
      'div',
      { className: 'absolute -bottom-8 left-1/2 -translate-x-1/2 transform space-y-2' },
      /* Health Bar */
      React.createElement(
        'div',
        { className: 'w-48' },
        React.createElement(
          'div',
          { className: 'mb-1 flex justify-between text-xs' },
          React.createElement('span', { className: 'text-gray-400' }, 'Hull Integrity'),
          React.createElement(
            'span',
            { className: health < maxHealth * 0.3 ? 'text-red-400' : 'text-gray-300' },
            `${Math.round((health / maxHealth) * 100)}%`
          )
        ),
        React.createElement(
          'div',
          { className: 'h-1.5 overflow-hidden rounded-full bg-gray-700' },
          React.createElement('div', {
            className: `h-full rounded-full transition-all ${
              health < maxHealth * 0.3 ? 'bg-red-500' : 'bg-green-500'
            }`,
            style: { width: `${(health / maxHealth) * 100}%` },
          })
        )
      ),

      /* Shield Bar */
      React.createElement(
        'div',
        { className: 'w-48' },
        React.createElement(
          'div',
          { className: 'mb-1 flex justify-between text-xs' },
          React.createElement('span', { className: 'text-gray-400' }, 'Shield Power'),
          React.createElement(
            'span',
            { className: 'text-gray-300' },
            `${Math.round((shield / maxShield) * 100)}%`
          )
        ),
        React.createElement(
          'div',
          { className: 'h-1.5 overflow-hidden rounded-full bg-gray-700' },
          React.createElement('div', {
            className: 'h-full rounded-full bg-cyan-500 transition-all',
            style: { width: `${(shield / maxShield) * 100}%` },
          })
        )
      )
    ),

    /* Tier Indicator */
    React.createElement(
      'div',
      {
        className:
          'absolute right-0 top-0 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-3 py-1.5',
      },
      React.createElement(
        'div',
        { className: 'flex items-center space-x-1' },
        Array.from({ length: tier }).map((_, i) =>
          React.createElement(Crown, { key: i, className: 'h-4 w-4 text-indigo-400' })
        )
      )
    )
  );
}
