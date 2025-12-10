/**
 * @context: ui-system, component-library, game-system
 *
 * Index file for game-specific UI components
 */

import React from 'react';

// Export game UI components
export { FactionBadge } from './FactionBadge';
export { MiniMap } from './MiniMap';
export { ShipDisplay } from './ShipDisplay';

// Export types
export type { MiniMapStar, ViewportConfig } from './MiniMap';

// Re-export TechTree from parent directory (default export)
export { default as TechTree } from '../TechTree';

// Placeholder AlertPanel Component
// TODO: Implement full AlertPanel functionality
export interface AlertPanelProps {
  alerts?: Array<{ id: string; message: string; severity: 'info' | 'warning' | 'error' }>;
  onDismiss?: (id: string) => void;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts = [], onDismiss }) => {
  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 1000,
      maxWidth: '400px',
    },
  },
    alerts.map(alert => {
      const colors = { info: '#2196F3', warning: '#FF9800', error: '#F44336' };
      return React.createElement('div', {
        key: alert.id,
        style: {
          padding: '12px 16px',
          background: '#1a1a2e',
          borderLeft: `4px solid ${colors[alert.severity]}`,
          borderRadius: '4px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
      },
        React.createElement('span', null, alert.message),
        onDismiss && React.createElement('button', {
          onClick: () => onDismiss(alert.id),
          style: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '16px' },
        }, '\u00D7')
      );
    })
  );
};

// Placeholder CommandConsole Component
// TODO: Implement full CommandConsole functionality
export interface CommandConsoleProps {
  onCommand?: (command: string) => void;
  history?: string[];
}

export const CommandConsole: React.FC<CommandConsoleProps> = ({ onCommand, history = [] }) => {
  const [input, setInput] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && onCommand) {
      onCommand(input.trim());
      setInput('');
    }
  };

  return React.createElement('div', {
    style: {
      background: '#0a0a15',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '16px',
      fontFamily: 'monospace',
    },
  },
    React.createElement('div', {
      style: {
        maxHeight: '200px',
        overflowY: 'auto',
        marginBottom: '8px',
      },
    },
      history.map((line, i) =>
        React.createElement('div', {
          key: i,
          style: { color: line.startsWith('>') ? '#4a9eff' : '#888', fontSize: '12px' },
        }, line)
      )
    ),
    React.createElement('form', { onSubmit: handleSubmit },
      React.createElement('input', {
        type: 'text',
        value: input,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value),
        placeholder: 'Enter command...',
        style: {
          width: '100%',
          background: '#1a1a2e',
          border: '1px solid #333',
          color: '#fff',
          padding: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
        },
      })
    )
  );
};
