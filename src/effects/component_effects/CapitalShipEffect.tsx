/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { Crosshair, Zap } from 'lucide-react';
import * as React from 'react';

interface CapitalShipEffectProps {
  type: 'harbringerGalleon' | 'midwayCarrier' | 'motherEarthRevenge';
  status: 'idle' | 'engaging' | 'damaged';
  shieldStrength: number;
  weaponCharge: number;
  quality: 'low' | 'medium' | 'high';
}

export function CapitalShipEffect({
  type,
  status,
  shieldStrength,
  weaponCharge,
  quality,
}: CapitalShipEffectProps) {
  const getShipColor = () => {
    switch (type) {
      case 'harbringerGalleon':
        return 'purple';
      case 'midwayCarrier':
        return 'fuchsia';
      case 'motherEarthRevenge':
        return 'rose';
      default:
        return 'blue';
    }
  };

  const color = getShipColor();
  const particleCount = quality === 'high' ? 16 : quality === 'medium' ? 10 : 6;

  return React.createElement(
    'div',
    { className: 'pointer-events-none absolute inset-0 overflow-hidden' },
    /* Shield Effect */
    React.createElement(
      'div',
      { className: 'absolute inset-0' },
      React.createElement('div', {
        className: `absolute inset-0 rounded-full border-2 border-${color}-500/30`,
        style: {
          transform: `scale(${1 + shieldStrength * 0.2})`,
          opacity: shieldStrength,
          filter: `blur(${quality === 'high' ? 8 : 4}px)`,
        },
      }),

      quality !== 'low' &&
        React.createElement('div', {
          className: `absolute inset-0 bg-${color}-500/10 animate-pulse rounded-full`,
          style: {
            transform: `scale(${1 + shieldStrength * 0.1})`,
            animationDuration: '3s',
          },
        })
    ),

    /* Weapon Charge Effect */
    weaponCharge > 0 &&
      React.createElement(
        'div',
        { className: 'absolute inset-0' },
        /* Energy Build-up */
        React.createElement('div', {
          className: `absolute inset-0 bg-${color}-500/20`,
          style: {
            clipPath: `polygon(0 ${100 - weaponCharge * 100}%, 100% ${100 - weaponCharge * 100}%, 100% 100%, 0 100%)`,
          },
        }),

        /* Charge Particles */
        Array.from({ length: Math.ceil(particleCount * weaponCharge) }).map((_, i) =>
          React.createElement('div', {
            key: i,
            className: `absolute h-1 w-1 bg-${color}-400 rounded-full`,
            style: {
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${1 + Math.random()}s infinite`,
              opacity: 0.5 + Math.random() * 0.5,
            },
          })
        )
      ),

    /* Status Effects */
    status === 'engaging' &&
      React.createElement(
        'div',
        { className: 'absolute inset-0 flex items-center justify-center' },
        React.createElement(Crosshair, { className: `h-8 w-8 text-${color}-400 animate-pulse` })
      ),

    status === 'damaged' &&
      React.createElement(
        'div',
        { className: 'absolute inset-0' },
        /* Damage Sparks */
        Array.from({ length: particleCount }).map((_, i) =>
          React.createElement('div', {
            key: i,
            className: 'absolute h-4 w-1 rounded-full bg-yellow-500',
            style: {
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `spark ${0.5 + Math.random()}s infinite`,
            },
          })
        )
      ),

    /* Ship-specific Effects */
    type === 'harbringerGalleon' &&
      React.createElement(
        'div',
        { className: 'absolute inset-0 flex items-center justify-center' },
        React.createElement('div', {
          className: `h-3/4 w-3/4 rounded-full border-2 border-${color}-500/30 animate-spin-slow`,
        })
      ),

    type === 'midwayCarrier' &&
      React.createElement(
        'div',
        { className: 'absolute inset-0' },
        /* Carrier Bay Indicators */
        Array.from({ length: 4 }).map((_, i) =>
          React.createElement('div', {
            key: i,
            className: `absolute h-2 w-8 bg-${color}-500/30`,
            style: {
              left: '50%',
              top: `${25 + i * 20}%`,
              transform: 'translateX(-50%)',
              animation: `pulse ${1 + i * 0.5}s infinite`,
            },
          })
        )
      ),

    type === 'motherEarthRevenge' &&
      quality !== 'low' &&
      React.createElement(
        'div',
        { className: 'absolute inset-0' },
        /* Energy Field */
        React.createElement('div', {
          className: `bg-gradient-radial absolute inset-0 from-${color}-500/30 animate-pulse via-transparent to-transparent`,
          style: { animationDuration: '4s' },
        }),

        /* Power Core */
        React.createElement(
          'div',
          { className: 'absolute inset-0 flex items-center justify-center' },
          React.createElement(Zap, { className: `h-12 w-12 text-${color}-400 animate-pulse` })
        )
      )
  );
}
