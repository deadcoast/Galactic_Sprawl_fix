import React, { useEffect, useState } from 'react';
import { useModuleStatus, useModulesWithStatus } from '../../../hooks/modules/useModuleStatus';
import { moduleManager } from '../../../managers/module/ModuleManager';
import { ExtendedModuleStatus } from '../../../managers/module/ModuleStatusManager';
import { BaseModule } from '../../../types/buildings/ModuleTypes';

interface ModuleStatusDisplayProps {
  moduleId: string;
  showDetails?: boolean;
  showHistory?: boolean;
  showAlerts?: boolean;
  showMetrics?: boolean;
  onStatusChange?: (status: ExtendedModuleStatus) => void;
  onAlertAcknowledge?: (alertIndex: number) => void;
}

/**
 * Component for displaying module status
 */
export const ModuleStatusDisplay = React.memo<ModuleStatusDisplayProps>(
  ({
    moduleId,
    showDetails = true,
    showHistory = false,
    showAlerts = true,
    showMetrics = true,
    onStatusChange,
    onAlertAcknowledge,
  }) => {
    const {
      statusDetails,
      isLoading,
      error,
      currentStatus,
      previousStatus,
      history,
      metrics,
      alerts,
      updateStatus,
      acknowledgeAlert,
      getStatusColor,
      getAlertColor,
      formatUptime,
    } = useModuleStatus(moduleId);

    const [module, setModule] = useState<BaseModule | null>(null);

    // Load module data
    useEffect(() => {
      const moduleData = moduleManager.getModule(moduleId);
      setModule(moduleData || null);
    }, [moduleId]);

    // Handle status change
    const handleStatusChange = (status: ExtendedModuleStatus) => {
      updateStatus(status);
      if (onStatusChange) {
        onStatusChange(status);
      }
    };

    // Handle alert acknowledge
    const handleAlertAcknowledge = (alertIndex: number) => {
      acknowledgeAlert(alertIndex);
      if (onAlertAcknowledge) {
        onAlertAcknowledge(alertIndex);
      }
    };

    // Render loading state
    if (isLoading) {
      return (
        <div className="module-status-display module-status-display--loading">
          Loading status data...
        </div>
      );
    }

    // Render error state
    if (error) {
      return <div className="module-status-display module-status-display--error">{error}</div>;
    }

    // Render empty state
    if (!statusDetails || !module) {
      return (
        <div className="module-status-display module-status-display--empty">
          No status data available
        </div>
      );
    }

    return (
      <div className="module-status-display">
        {/* Module Header */}
        <div className="module-status-display__header">
          <h3 className="module-status-display__title">{module.name}</h3>
          <div
            className="module-status-display__status"
            style={{ backgroundColor: getStatusColor(currentStatus) }}
          >
            {currentStatus}
          </div>
        </div>

        {/* Module Details */}
        {showDetails && (
          <div className="module-status-display__details">
            <div className="module-status-display__detail">
              <span className="module-status-display__detail-label">Type:</span>
              <span className="module-status-display__detail-value">{module.type}</span>
            </div>
            <div className="module-status-display__detail">
              <span className="module-status-display__detail-label">Level:</span>
              <span className="module-status-display__detail-value">{module.level}</span>
            </div>
            <div className="module-status-display__detail">
              <span className="module-status-display__detail-label">Uptime:</span>
              <span className="module-status-display__detail-value">
                {formatUptime(metrics?.uptime || 0)}
              </span>
            </div>
          </div>
        )}

        {/* Status History */}
        {showHistory && history.length > 0 && (
          <div className="module-status-display__history">
            <h4 className="module-status-display__section-title">Status History</h4>
            <ul className="module-status-display__history-list">
              {history.map((entry, index) => (
                <li key={index} className="module-status-display__history-item">
                  <div
                    className="module-status-display__history-status"
                    style={{ backgroundColor: getStatusColor(entry.status) }}
                  >
                    {entry.status}
                  </div>
                  <div className="module-status-display__history-time">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Add a section to display status changes */}
        {showHistory && (
          <div className="module-status-display__status-transition">
            <h4 className="module-status-display__section-title">Status Transition</h4>
            <div className="module-status-display__transition-container">
              {previousStatus && (
                <>
                  <div
                    className="module-status-display__previous-status"
                    style={{ backgroundColor: getStatusColor(previousStatus) }}
                  >
                    {previousStatus}
                  </div>
                  <div className="module-status-display__transition-arrow">→</div>
                </>
              )}
              <div
                className="module-status-display__current-status"
                style={{ backgroundColor: getStatusColor(currentStatus) }}
              >
                {currentStatus}
              </div>
            </div>
          </div>
        )}

        {/* Add status control buttons to allow changing the module status */}
        <div className="module-status-display__controls">
          <h4 className="module-status-display__section-title">Status Controls</h4>
          <div className="module-status-display__status-buttons">
            {['offline', 'standby', 'active', 'error', 'maintenance'].map(status => (
              <button
                key={status}
                className={`module-status-display__status-button ${
                  currentStatus === status ? 'module-status-display__status-button--active' : ''
                }`}
                style={{ borderColor: getStatusColor(status as ExtendedModuleStatus) }}
                onClick={() => handleStatusChange(status as ExtendedModuleStatus)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Module Alerts */}
        {showAlerts && alerts.length > 0 && (
          <div className="module-status-display__alerts">
            <h4 className="module-status-display__section-title">Alerts</h4>
            <ul className="module-status-display__alert-list">
              {alerts.map((alert, index) => (
                <li key={index} className="module-status-display__alert-item">
                  <div
                    className="module-status-display__alert-level"
                    style={{ backgroundColor: getAlertColor(alert.level) }}
                  >
                    {alert.level}
                  </div>
                  <div className="module-status-display__alert-message">{alert.message}</div>
                  <div className="module-status-display__alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                  {!alert.acknowledged && (
                    <button
                      className="module-status-display__alert-acknowledge"
                      onClick={() => handleAlertAcknowledge(index)}
                    >
                      Acknowledge
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Performance Metrics */}
        {showMetrics && metrics && (
          <div className="module-status-display__metrics">
            <h4 className="module-status-display__section-title">Performance Metrics</h4>
            <div className="module-status-display__metric-grid">
              {Object.entries(metrics || {}).map(([key, value]) => (
                <div key={key} className="module-status-display__metric">
                  <div className="module-status-display__metric-label">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="module-status-display__metric-value">
                    {typeof value === 'number' ? value.toFixed(2) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Compare props to determine if re-render is needed
    return (
      prevProps.moduleId === nextProps.moduleId &&
      prevProps.showDetails === nextProps.showDetails &&
      prevProps.showHistory === nextProps.showHistory &&
      prevProps.showAlerts === nextProps.showAlerts &&
      prevProps.showMetrics === nextProps.showMetrics &&
      prevProps.onStatusChange === nextProps.onStatusChange &&
      prevProps.onAlertAcknowledge === nextProps.onAlertAcknowledge
    );
  }
);

interface ModuleStatusSummaryProps {
  moduleIds: string[];
  onSelectModule?: (moduleId: string) => void;
}

/**
 * Component for displaying a summary of multiple module statuses
 */
export const ModuleStatusSummary = React.memo<ModuleStatusSummaryProps>(
  ({ moduleIds, onSelectModule }) => {
    return (
      <div className="module-status-summary">
        <h4 className="module-status-summary__title">Module Status Summary</h4>

        <div className="module-status-summary__list">
          {moduleIds.map(moduleId => (
            <ModuleStatusSummaryItem
              key={moduleId}
              moduleId={moduleId}
              onClick={() => onSelectModule?.(moduleId)}
            />
          ))}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Compare props to determine if re-render is needed
    return (
      prevProps.moduleIds.length === nextProps.moduleIds.length &&
      prevProps.moduleIds.every((id, index) => id === nextProps.moduleIds[index]) &&
      prevProps.onSelectModule === nextProps.onSelectModule
    );
  }
);

interface ModuleStatusSummaryItemProps {
  moduleId: string;
  onClick?: () => void;
}

/**
 * Component for displaying a summary of a single module's status
 */
const ModuleStatusSummaryItem = React.memo<ModuleStatusSummaryItemProps>(
  ({ moduleId, onClick }) => {
    const { currentStatus, metrics, alerts, getStatusColor } = useModuleStatus(moduleId);

    const [module, setModule] = useState<BaseModule | null>(null);

    // Load module data
    useEffect(() => {
      const moduleData = moduleManager.getModule(moduleId);
      setModule(moduleData || null);
    }, [moduleId]);

    if (!module) {
      return null;
    }

    const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);

    return (
      <div className="module-status-summary-item" onClick={onClick}>
        <div className="module-status-summary-item__header">
          <div className="module-status-summary-item__name">{module.name}</div>
          <div
            className="module-status-summary-item__status"
            style={{ backgroundColor: getStatusColor(currentStatus) }}
          >
            {currentStatus}
          </div>
        </div>

        {metrics && (
          <div className="module-status-summary-item__metrics">
            <div className="module-status-summary-item__metric">
              <span className="module-status-summary-item__metric-label">Efficiency:</span>
              <span className="module-status-summary-item__metric-value">
                {Math.round(metrics.efficiency * 100)}%
              </span>
            </div>
            <div className="module-status-summary-item__metric">
              <span className="module-status-summary-item__metric-label">Performance:</span>
              <span className="module-status-summary-item__metric-value">
                {Math.round(metrics.performance * 100)}%
              </span>
            </div>
          </div>
        )}

        {unacknowledgedAlerts.length > 0 && (
          <div className="module-status-summary-item__alerts">
            <span className="module-status-summary-item__alert-count">
              {unacknowledgedAlerts.length} Alert{unacknowledgedAlerts.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Compare props to determine if re-render is needed
    return prevProps.moduleId === nextProps.moduleId && prevProps.onClick === nextProps.onClick;
  }
);

interface ModuleAlertListProps {
  alertLevel?: 'info' | 'warning' | 'error' | 'critical';
  onSelectModule?: (moduleId: string) => void;
}

/**
 * Component for displaying a list of module alerts
 */
export const ModuleAlertList = React.memo<ModuleAlertListProps>(
  ({ alertLevel, onSelectModule }) => {
    const { moduleIds, isLoading, error } = useModulesWithStatus(undefined, alertLevel);

    // Render loading state
    if (isLoading) {
      return <div className="module-alert-list module-alert-list--loading">Loading alerts...</div>;
    }

    // Render error state
    if (error) {
      return <div className="module-alert-list module-alert-list--error">{error}</div>;
    }

    // Render empty state
    if (moduleIds.length === 0) {
      return <div className="module-alert-list module-alert-list--empty">No alerts</div>;
    }

    return (
      <div className="module-alert-list">
        <h4 className="module-alert-list__title">
          Module Alerts {alertLevel ? `(${alertLevel})` : ''}
        </h4>

        <div className="module-alert-list__list">
          {moduleIds.map(moduleId => (
            <ModuleAlertItem
              key={moduleId}
              moduleId={moduleId}
              alertLevel={alertLevel}
              onClick={() => onSelectModule?.(moduleId)}
            />
          ))}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Compare props to determine if re-render is needed
    return (
      prevProps.alertLevel === nextProps.alertLevel &&
      prevProps.onSelectModule === nextProps.onSelectModule
    );
  }
);

interface ModuleAlertItemProps {
  moduleId: string;
  alertLevel?: 'info' | 'warning' | 'error' | 'critical';
  onClick?: () => void;
}

/**
 * Component for displaying a single module's alerts
 */
const ModuleAlertItem = React.memo<ModuleAlertItemProps>(
  ({ moduleId, alertLevel, onClick }) => {
    const { currentStatus, alerts, getStatusColor, getAlertColor } = useModuleStatus(moduleId);

    const [module, setModule] = useState<BaseModule | null>(null);

    // Load module data
    useEffect(() => {
      const moduleData = moduleManager.getModule(moduleId);
      setModule(moduleData || null);
    }, [moduleId]);

    if (!module) {
      return null;
    }

    // Filter alerts by level and acknowledgement
    const filteredAlerts = alerts.filter(
      alert => !alert.acknowledged && (!alertLevel || alert.level === alertLevel)
    );

    if (filteredAlerts.length === 0) {
      return null;
    }

    return (
      <div className="module-alert-item" onClick={onClick}>
        <div className="module-alert-item__header">
          <div className="module-alert-item__name">{module.name}</div>
          <div
            className="module-alert-item__status"
            style={{ backgroundColor: getStatusColor(currentStatus) }}
          >
            {currentStatus}
          </div>
        </div>

        <ul className="module-alert-item__alert-list">
          {filteredAlerts.map((alert, index) => (
            <li key={index} className="module-alert-item__alert">
              <div
                className="module-alert-item__alert-level"
                style={{ backgroundColor: getAlertColor(alert.level) }}
              >
                {alert.level}
              </div>
              <div className="module-alert-item__alert-message">{alert.message}</div>
              <div className="module-alert-item__alert-time">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Compare props to determine if re-render is needed
    return (
      prevProps.moduleId === nextProps.moduleId &&
      prevProps.alertLevel === nextProps.alertLevel &&
      prevProps.onClick === nextProps.onClick
    );
  }
);
