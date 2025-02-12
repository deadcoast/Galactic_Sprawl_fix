import { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Settings } from 'lucide-react';
import { useThreshold } from '../../contexts/ThresholdContext';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
}

export function AutomationMonitor() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { state } = useThreshold();

  useEffect(() => {
    // Monitor thresholds and generate alerts
    const checkThresholds = () => {
      const newAlerts: Alert[] = [];
      
      Object.entries(state.resources).forEach(([resourceId, resource]) => {
        if (resource.currentAmount < resource.thresholds.min) {
          newAlerts.push({
            id: `${resourceId}-low-${Date.now()}`,
            type: 'warning',
            message: `${resource.name} below minimum threshold (${resource.currentAmount}/${resource.thresholds.min})`,
            timestamp: Date.now()
          });
        } else if (resource.currentAmount > resource.thresholds.max) {
          newAlerts.push({
            id: `${resourceId}-high-${Date.now()}`,
            type: 'warning',
            message: `${resource.name} above maximum threshold (${resource.currentAmount}/${resource.thresholds.max})`,
            timestamp: Date.now()
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
        return <AlertTriangle className="text-yellow-500" size={16} />;
      case 'error':
        return <AlertTriangle className="text-red-500" size={16} />;
      case 'info':
        return <Bell className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Settings className="text-cyan-500" size={20} />
          <h3 className="text-lg font-semibold">Automation Monitor</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {alerts.length === 0 ? (
            <p className="text-gray-400">No active alerts</p>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                className={`flex items-center space-x-2 p-2 rounded ${
                  alert.type === 'warning'
                    ? 'bg-yellow-900/20'
                    : alert.type === 'error'
                    ? 'bg-red-900/20'
                    : 'bg-blue-900/20'
                }`}
              >
                {getAlertIcon(alert.type)}
                <span className="flex-1">{alert.message}</span>
                <span className="text-sm text-gray-400">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {!isExpanded && alerts.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <AlertTriangle size={16} />
          <span>{alerts.length} active alerts</span>
        </div>
      )}
    </div>
  );
} 