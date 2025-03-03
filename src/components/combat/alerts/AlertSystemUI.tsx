import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bell, BellOff, Info, Shield, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type AlertLevel = 'info' | 'warning' | 'danger' | 'critical';

export interface Alert {
  id: string;
  level: AlertLevel;
  message: string;
  details?: string;
  source?: string;
  timestamp: number; // Unix timestamp
  acknowledged?: boolean;
  autoExpire?: boolean; // Whether the alert should auto-expire
  expirationTime?: number; // Time in ms after which the alert expires
}

interface AlertSystemUIProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
  onViewDetails?: (alertId: string) => void;
  maxVisibleAlerts?: number;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  className?: string;
}

/**
 * AlertSystemUI component
 *
 * Displays a list of alerts with different severity levels and provides
 * interaction options like acknowledging, dismissing, and viewing details.
 */
export function AlertSystemUI({
  alerts,
  onAcknowledge,
  onDismiss,
  onViewDetails,
  maxVisibleAlerts = 5,
  soundEnabled = true,
  onToggleSound,
  className = '',
}: AlertSystemUIProps) {
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(!soundEnabled);

  // Sort alerts by level (critical first) and then by timestamp (newest first)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const levelOrder = { critical: 0, danger: 1, warning: 2, info: 3 };
    const levelDiff = levelOrder[a.level] - levelOrder[b.level];

    if (levelDiff !== 0) {
      return levelDiff;
    }
    return b.timestamp - a.timestamp;
  });

  // Get visible alerts based on expanded state
  const visibleAlerts = expanded ? sortedAlerts : sortedAlerts.slice(0, maxVisibleAlerts);

  // Count alerts by level
  const alertCounts = sortedAlerts.reduce(
    (counts, alert) => {
      counts[alert.level] = (counts[alert.level] || 0) + 1;
      return counts;
    },
    {} as Record<AlertLevel, number>
  );

  // Play sound effect for new critical or danger alerts
  useEffect(() => {
    if (muted) {
      return;
    }

    const hasCritical = sortedAlerts.some(
      alert => alert.level === 'critical' && !alert.acknowledged
    );

    const hasDanger = sortedAlerts.some(alert => alert.level === 'danger' && !alert.acknowledged);

    if (hasCritical) {
      // Play critical alert sound
      // This would be implemented with actual sound effects in a real app
      console.warn('Playing critical alert sound');
    } else if (hasDanger) {
      // Play danger alert sound
      console.warn('Playing danger alert sound');
    }
  }, [sortedAlerts, muted]);

  // Handle sound toggle
  const handleSoundToggle = () => {
    setMuted(!muted);
    onToggleSound?.();
  };

  // Get icon for alert level
  const getAlertIcon = (level: AlertLevel) => {
    switch (level) {
      case 'critical':
      case 'danger':
        return <AlertTriangle className="text-red-500" size={18} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={18} />;
      case 'info':
        return <Info className="text-blue-500" size={18} />;
      default:
        return <Info className="text-gray-500" size={18} />;
    }
  };

  // Get background color for alert level
  const getAlertBackground = (level: AlertLevel) => {
    switch (level) {
      case 'critical':
        return 'bg-red-800/40';
      case 'danger':
        return 'bg-red-700/40';
      case 'warning':
        return 'bg-yellow-700/40';
      case 'info':
        return 'bg-blue-800/40';
      default:
        return 'bg-gray-800/40';
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-900/80 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-2">
        <div className="flex items-center space-x-2">
          <Shield size={18} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Alert System</h3>

          {/* Alert counts */}
          <div className="ml-2 flex space-x-1">
            {alertCounts.critical && (
              <span className="rounded bg-red-900 px-1.5 py-0.5 text-xs text-white">
                {alertCounts.critical}
              </span>
            )}
            {alertCounts.danger && (
              <span className="rounded bg-red-800 px-1.5 py-0.5 text-xs text-white">
                {alertCounts.danger}
              </span>
            )}
            {alertCounts.warning && (
              <span className="rounded bg-yellow-800 px-1.5 py-0.5 text-xs text-white">
                {alertCounts.warning}
              </span>
            )}
            {alertCounts.info && (
              <span className="rounded bg-blue-800 px-1.5 py-0.5 text-xs text-white">
                {alertCounts.info}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sound toggle button */}
          <button
            onClick={handleSoundToggle}
            className="rounded p-1 transition-colors hover:bg-gray-700"
            title={muted ? 'Enable alert sounds' : 'Disable alert sounds'}
          >
            {muted ? (
              <VolumeX size={16} className="text-gray-400" />
            ) : (
              <Volume2 size={16} className="text-blue-400" />
            )}
          </button>

          {/* Expand/collapse button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1 transition-colors hover:bg-gray-700"
            title={expanded ? 'Collapse alerts' : 'Expand alerts'}
          >
            {expanded ? (
              <BellOff size={16} className="text-gray-400" />
            ) : (
              <Bell size={16} className="text-blue-400" />
            )}
          </button>
        </div>
      </div>

      {/* Alerts list */}
      <div className="max-h-80 overflow-y-auto">
        <AnimatePresence>
          {visibleAlerts.length > 0 ? (
            visibleAlerts.map(alert => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start border-b border-gray-800 p-3 ${getAlertBackground(alert.level)} ${alert.acknowledged ? 'opacity-70' : 'opacity-100'} `}
              >
                <div className="mr-3 mt-0.5 flex-shrink-0">{getAlertIcon(alert.level)}</div>

                <div className="min-w-0 flex-grow">
                  <div className="flex items-start justify-between">
                    <p
                      className={`text-sm font-medium ${alert.acknowledged ? 'text-gray-300' : 'text-white'}`}
                    >
                      {alert.message}
                    </p>
                    <span className="ml-2 whitespace-nowrap text-xs text-gray-400">
                      {formatTime(alert.timestamp)}
                    </span>
                  </div>

                  {alert.source && (
                    <p className="mt-1 text-xs text-gray-400">Source: {alert.source}</p>
                  )}

                  {/* Alert actions */}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex space-x-2">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => onAcknowledge(alert.id)}
                          className="rounded bg-blue-900/50 px-2 py-0.5 text-xs text-blue-300 transition-colors hover:bg-blue-800/50"
                        >
                          Acknowledge
                        </button>
                      )}

                      {onViewDetails && (
                        <button
                          onClick={() => onViewDetails(alert.id)}
                          className="rounded bg-gray-800/50 px-2 py-0.5 text-xs text-gray-300 transition-colors hover:bg-gray-700/50"
                        >
                          Details
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => onDismiss(alert.id)}
                      className="p-1 text-gray-400 transition-colors hover:text-gray-200"
                      title="Dismiss alert"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-gray-400">No active alerts</div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer with alert count and expand button */}
      {sortedAlerts.length > maxVisibleAlerts && !expanded && (
        <div className="border-t border-gray-700 bg-gray-800/50 p-2 text-center">
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-blue-400 transition-colors hover:text-blue-300"
          >
            {sortedAlerts.length - maxVisibleAlerts} more alerts - Show all
          </button>
        </div>
      )}
    </div>
  );
}
