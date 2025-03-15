/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { AlertTriangle, Bell, Settings } from 'lucide-react';
import * as React from "react";
import { useThreshold } from '../../../../contexts/ThresholdContext';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
}

export function AutomationMonitor() {
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { state } = useThreshold();

  React.useEffect(() => {
    // Monitor thresholds and generate alerts
    const checkThresholds = () => {
      const newAlerts: Alert[] = [];

      Object.entries(state.resources).forEach(([resourceId, resource]) => {
        if (resource.currentAmount < resource.thresholds.min) {
          newAlerts.push({
            id: `${resourceId}-low-${Date.now()}`,
            type: 'warning',
            message: `${resource.name} below minimum threshold (${resource.currentAmount}/${resource.thresholds.min})`,
            timestamp: Date.now(),
          });
        } else if (resource.currentAmount > resource.thresholds.max) {
          newAlerts.push({
            id: `${resourceId}-high-${Date.now()}`,
            type: 'warning',
            message: `${resource.name} above maximum threshold (${resource.currentAmount}/${resource.thresholds.max})`,
            timestamp: Date.now(),
          });
        }
      });

      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Keep last 10 alerts
      }
    };

    const interval = setInterval(checkThresholds, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [state]);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return React.createElement(AlertTriangle, { className: 'text-yellow-500', size: 16 });
      case 'error':
        return React.createElement(AlertTriangle, { className: 'text-red-500', size: 16 });
      case 'info':
        return React.createElement(Bell, { className: 'text-blue-500', size: 16 });
    }
  };

  return React.createElement(
    'div',
    { className: 'rounded-lg bg-gray-800 p-4' },
    React.createElement(
      'div',
      { className: 'mb-4 flex items-center justify-between' },
      React.createElement(
        'div',
        { className: 'flex items-center space-x-2' },
        React.createElement(Settings, { className: 'text-cyan-500', size: 20 }),
        React.createElement('h3', { className: 'text-lg font-semibold' }, 'Automation Monitor')
      ),
      React.createElement(
        'button',
        {
          onClick: () => setIsExpanded(!isExpanded),
          className: 'text-gray-400 hover:text-white',
        },
        isExpanded ? 'Collapse' : 'Expand'
      )
    ),
    isExpanded &&
      React.createElement(
        'div',
        { className: 'space-y-2' },
        alerts.length === 0
          ? React.createElement('p', { className: 'text-gray-400' }, 'No active alerts')
          : alerts.map(alert =>
              React.createElement(
                'div',
                {
                  key: alert.id,
                  className: `flex items-center space-x-2 rounded p-2 ${
                    alert.type === 'warning'
                      ? 'bg-yellow-900/20'
                      : alert.type === 'error'
                        ? 'bg-red-900/20'
                        : 'bg-blue-900/20'
                  }`,
                },
                getAlertIcon(alert.type),
                React.createElement('span', { className: 'flex-1' }, alert.message),
                React.createElement(
                  'span',
                  { className: 'text-sm text-gray-400' },
                  new Date(alert.timestamp).toLocaleTimeString()
                )
              )
            )
      ),
    !isExpanded &&
      alerts.length > 0 &&
      React.createElement(
        'div',
        { className: 'flex items-center space-x-2 text-sm text-gray-400' },
        React.createElement(AlertTriangle, { size: 16 }),
        React.createElement('span', null, alerts.length, ' active alerts')
      )
  );
}
