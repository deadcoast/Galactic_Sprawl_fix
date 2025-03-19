/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { ArrowUp, Zap } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';

interface ModuleUpgradeTransitionProps {
  fromTier: 1 | 2;
  toTier: 2 | 3;
  moduleType: 'radar' | 'dockingBay' | 'processor';
  duration?: number;
  quality: 'low' | 'medium' | 'high';
  onComplete?: () => void;
}

export function ModuleUpgradeTransition({
  fromTier,
  toTier,
  moduleType,
  duration = 2000,
  quality,
  onComplete,
}: ModuleUpgradeTransitionProps) {
  const [progress, setProgress] = useState(0);
  const particleCount = quality === 'high' ? 16 : quality === 'medium' ? 8 : 4;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(1, elapsed / duration);
      setProgress(newProgress);

      if (newProgress >= 1) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 16);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  const getModuleColor = () => {
    switch (moduleType) {
      case 'radar':
        return 'cyan';
      case 'dockingBay':
        return 'violet';
      case 'processor':
        return 'amber';
      default:
        return 'blue';
    }
  };

  const color = getModuleColor();

  return React.createElement(
    'div',
    { className: 'pointer-events-none absolute inset-0 overflow-hidden' },
    /* Upgrade Energy Field */
    React.createElement('div', {
      className: `bg-gradient-radial absolute inset-0 from-${color}-500/30 via-${color}-500/10 to-transparent`,
      style: {
        opacity: progress,
        transform: `scale(${1 + progress * 0.5})`,
      },
    }),

    /* Expansion Effect */
    React.createElement(
      'div',
      { className: 'absolute inset-0' },
      Array.from({ length: 4 }).map((_, i) =>
        React.createElement('div', {
          key: i,
          className: `absolute inset-0 border-2 border-${color}-500/20 rounded-lg`,
          style: {
            transform: `scale(${1 + progress * 0.3 * (i + 1)}) rotate(${progress * 90}deg)`,
            opacity: 1 - progress * 0.7,
          },
        })
      )
    ),

    /* Upgrade Particles */
    Array.from({ length: Math.ceil(particleCount * progress) }).map((_, i) =>
      React.createElement('div', {
        key: i,
        className: `absolute h-4 w-1 bg-${color}-400 rounded-full`,
        style: {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          transform: `rotate(${Math.random() * 360}deg) scale(${1 + progress})`,
          opacity: 0.5 + progress * 0.5,
        },
      })
    ),

    /* Tier Indicator */
    React.createElement(
      'div',
      { className: 'absolute right-4 top-4 flex items-center space-x-2' },
      React.createElement(
        'div',
        { className: `text-${color}-400 font-medium` },
        `Tier ${fromTier}`
      ),
      React.createElement(ArrowUp, { className: `h-4 w-4 text-${color}-400` }),
      React.createElement('div', { className: `text-${color}-400 font-medium` }, `Tier ${toTier}`)
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
    ),

    /* Module-specific Effects */
    moduleType === 'radar' &&
      quality !== 'low' &&
      React.createElement(
        'div',
        { className: 'absolute inset-0 flex items-center justify-center' },
        React.createElement('div', {
          className: `h-1/2 w-1/2 rounded-full border-2 border-${color}-500/30`,
          style: {
            animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
            animationDelay: `${progress * 0.5}s`,
          },
        })
      ),

    moduleType === 'dockingBay' &&
      React.createElement(
        'div',
        { className: 'absolute inset-0 flex items-center justify-center' },
        React.createElement('div', {
          className: `h-3/4 w-3/4 border-2 border-${color}-500/30`,
          style: {
            clipPath: `inset(0 ${50 - progress * 50}% 0 0)`,
            transform: `scale(${1 + progress * 0.2})`,
          },
        })
      ),

    /* Upgrade Complete Flash */
    progress === 1 &&
      React.createElement(
        'div',
        { className: 'absolute inset-0 flex items-center justify-center' },
        React.createElement(Zap, { className: `h-12 w-12 text-${color}-400 animate-pulse` })
      )
  );
}
