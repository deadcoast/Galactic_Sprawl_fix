/**
 * @context: ui-system, component-bridge
 *
 * Feedback components placeholder.
 * These components need implementation - currently providing stubs to prevent import errors.
 *
 * TODO: Implement these components or source from a component library
 */

import React from 'react';

// Placeholder Alert Component
export interface AlertProps {
  children: React.ReactNode;
  severity?: 'info' | 'warning' | 'error' | 'success';
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ children, severity = 'info', onClose }) => {
  const colors = {
    info: '#2196F3',
    warning: '#FF9800',
    error: '#F44336',
    success: '#4CAF50',
  };
  return React.createElement('div', {
    style: { padding: '12px', borderLeft: `4px solid ${colors[severity]}`, background: '#1a1a2e', marginBottom: '8px' },
    role: 'alert',
  }, children);
};

// Placeholder Spinner Component
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  const sizes = { sm: 16, md: 24, lg: 32 };
  return React.createElement('div', {
    style: {
      width: sizes[size],
      height: sizes[size],
      border: '2px solid transparent',
      borderTop: '2px solid #4a9eff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    'aria-label': 'Loading',
  });
};

// Placeholder Progress Component
export interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, max = 100, label }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return React.createElement('div', { style: { width: '100%' } },
    label && React.createElement('span', { style: { fontSize: '12px', color: '#888' } }, label),
    React.createElement('div', {
      style: { width: '100%', height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' },
    },
      React.createElement('div', {
        style: { width: `${percentage}%`, height: '100%', background: '#4a9eff', transition: 'width 0.3s' },
        role: 'progressbar',
        'aria-valuenow': value,
        'aria-valuemax': max,
      })
    )
  );
};

// Placeholder Skeleton Component
export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = '20px', variant = 'rectangular' }) => {
  const borderRadius = variant === 'circular' ? '50%' : variant === 'text' ? '4px' : '0';
  return React.createElement('div', {
    style: {
      width,
      height,
      background: 'linear-gradient(90deg, #1a1a2e 25%, #2a2a4e 50%, #1a1a2e 75%)',
      backgroundSize: '200% 100%',
      borderRadius,
      animation: 'shimmer 1.5s infinite',
    },
    'aria-hidden': true,
  });
};

// Placeholder Toast Component
export interface ToastProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  return React.createElement('div', {
    style: {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '12px 24px',
      background: '#333',
      color: '#fff',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    },
    role: 'status',
  }, message);
};
