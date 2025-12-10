/**
 * @context: ui-system, component-bridge
 *
 * Data display components placeholder.
 * These components need implementation - currently providing stubs to prevent import errors.
 *
 * TODO: Implement these components or source from a component library
 */

import React from 'react';

// Placeholder DataTable Component
export interface Column<T> {
  key: keyof T;
  header: string;
  width?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, unknown>>({ columns, data, onRowClick }: DataTableProps<T>) {
  return React.createElement('table', {
    style: { width: '100%', borderCollapse: 'collapse', background: '#1a1a2e' },
  },
    React.createElement('thead', null,
      React.createElement('tr', null,
        columns.map(col =>
          React.createElement('th', {
            key: String(col.key),
            style: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #333', color: '#888' },
          }, col.header)
        )
      )
    ),
    React.createElement('tbody', null,
      data.map((row, rowIndex) =>
        React.createElement('tr', {
          key: rowIndex,
          onClick: onRowClick ? () => onRowClick(row) : undefined,
          style: { cursor: onRowClick ? 'pointer' : 'default' },
        },
          columns.map(col =>
            React.createElement('td', {
              key: String(col.key),
              style: { padding: '12px', borderBottom: '1px solid #222', color: '#fff' },
            }, col.render ? col.render(row[col.key], row) : String(row[col.key] ?? ''))
          )
        )
      )
    )
  );
}

// Placeholder StatusCard Component
export interface StatusCardProps {
  title: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  children?: React.ReactNode;
}

export const StatusCard: React.FC<StatusCardProps> = ({ title, status, children }) => {
  const statusColors = {
    online: '#4CAF50',
    offline: '#666',
    warning: '#FF9800',
    error: '#F44336',
  };

  return React.createElement('div', {
    style: {
      background: '#1a1a2e',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '16px',
    },
  },
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' } },
      React.createElement('span', {
        style: { width: '8px', height: '8px', borderRadius: '50%', background: statusColors[status] },
      }),
      React.createElement('h3', { style: { margin: 0, color: '#fff', fontSize: '14px' } }, title)
    ),
    children
  );
};

// Placeholder Metric Component
export interface MetricProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string | number;
}

export const Metric: React.FC<MetricProps> = ({ label, value, unit, trend, trendValue }) => {
  const trendColors = { up: '#4CAF50', down: '#F44336', stable: '#888' };
  const trendArrows = { up: '\u2191', down: '\u2193', stable: '\u2192' };

  return React.createElement('div', {
    style: { background: '#1a1a2e', padding: '16px', borderRadius: '8px' },
  },
    React.createElement('div', { style: { color: '#888', fontSize: '12px', marginBottom: '4px' } }, label),
    React.createElement('div', { style: { display: 'flex', alignItems: 'baseline', gap: '4px' } },
      React.createElement('span', { style: { color: '#fff', fontSize: '24px', fontWeight: 'bold' } }, value),
      unit && React.createElement('span', { style: { color: '#666', fontSize: '14px' } }, unit)
    ),
    trend && React.createElement('div', {
      style: { color: trendColors[trend], fontSize: '12px', marginTop: '4px' }
    }, `${trendArrows[trend]} ${trendValue ?? ''}`)
  );
};

// Placeholder Timeline Component
export interface TimelineItem {
  timestamp: Date | string;
  title: string;
  description?: string;
  status?: 'completed' | 'active' | 'pending';
}

export interface TimelineProps {
  items: TimelineItem[];
}

export const Timeline: React.FC<TimelineProps> = ({ items }) => {
  const statusColors = { completed: '#4CAF50', active: '#4a9eff', pending: '#666' };

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '0' } },
    items.map((item, index) =>
      React.createElement('div', {
        key: index,
        style: { display: 'flex', gap: '16px', position: 'relative' },
      },
        React.createElement('div', {
          style: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
        },
          React.createElement('div', {
            style: {
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: statusColors[item.status || 'pending'],
            },
          }),
          index < items.length - 1 && React.createElement('div', {
            style: { width: '2px', flexGrow: 1, background: '#333', minHeight: '40px' },
          })
        ),
        React.createElement('div', { style: { paddingBottom: '24px' } },
          React.createElement('div', { style: { color: '#888', fontSize: '12px' } },
            typeof item.timestamp === 'string' ? item.timestamp : item.timestamp.toLocaleString()
          ),
          React.createElement('div', { style: { color: '#fff', fontWeight: 'bold' } }, item.title),
          item.description && React.createElement('div', { style: { color: '#666', fontSize: '14px' } }, item.description)
        )
      )
    )
  );
};
