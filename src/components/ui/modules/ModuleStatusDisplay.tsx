import React, { useState, useEffect } from 'react';
import { useModuleStatus, useModulesWithStatus } from '../../../hooks/modules/useModuleStatus';
import { ExtendedModuleStatus, StatusHistoryEntry } from '../../../managers/module/ModuleStatusManager';
import { moduleManager } from '../../../managers/module/ModuleManager';

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
export const ModuleStatusDisplay: React.FC<ModuleStatusDisplayProps> = ({
  moduleId,
  showDetails = true,
  showHistory = false,
  showAlerts = true,
  showMetrics = true,
  onStatusChange,
  onAlertAcknowledge
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
    formatUptime
  } = useModuleStatus(moduleId);

  const [module, setModule] = useState<any>(null);

  // Load module data
  useEffect(() => {
    const moduleData = moduleManager.getModule(moduleId);
    setModule(moduleData);
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
    return <div className="module-status-display module-status-display--loading">Loading status data...</div>;
  }

  // Render error state
  if (error) {
    return <div className="module-status-display module-status-display--error">{error}</div>;
  }

  // Render empty state
  if (!statusDetails || !module) {
    return <div className="module-status-display module-status-display--empty">No status data available</div>;
  }

  return (
    <div className="module-status-display">
      {/* Status header */}
      <div className="module-status-display__header">
        <h4 className="module-status-display__title">
          {module.name} Status
        </h4>
        <div 
          className="module-status-display__status-badge"
          style={{ backgroundColor: getStatusColor(currentStatus) }}
        >
          {currentStatus}
        </div>
      </div>

      {/* Status details */}
      {showDetails && (
        <div className="module-status-display__details">
          <div className="module-status-display__detail">
            <span className="module-status-display__detail-label">Current Status:</span>
            <span 
              className="module-status-display__detail-value"
              style={{ color: getStatusColor(currentStatus) }}
            >
              {currentStatus}
            </span>
          </div>
          
          {previousStatus && (
            <div className="module-status-display__detail">
              <span className="module-status-display__detail-label">Previous Status:</span>
              <span 
                className="module-status-display__detail-value"
                style={{ color: getStatusColor(previousStatus) }}
              >
                {previousStatus}
              </span>
            </div>
          )}
          
          <div className="module-status-display__detail">
            <span className="module-status-display__detail-label">Last Updated:</span>
            <span className="module-status-display__detail-value">
              {new Date(statusDetails.lastUpdated).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Metrics */}
      {showMetrics && metrics && (
        <div className="module-status-display__metrics">
          <h5 className="module-status-display__section-title">Metrics</h5>
          
          <div className="module-status-display__metric">
            <span className="module-status-display__metric-label">Uptime:</span>
            <span className="module-status-display__metric-value">
              {formatUptime(metrics.uptime)}
            </span>
          </div>
          
          <div className="module-status-display__metric">
            <span className="module-status-display__metric-label">Efficiency:</span>
            <div className="module-status-display__progress-bar">
              <div 
                className="module-status-display__progress-fill"
                style={{ 
                  width: `${metrics.efficiency * 100}%`,
                  backgroundColor: metrics.efficiency >= 1 ? 'green' : 'orange'
                }}
              />
            </div>
            <span className="module-status-display__metric-value">
              {Math.round(metrics.efficiency * 100)}%
            </span>
          </div>
          
          <div className="module-status-display__metric">
            <span className="module-status-display__metric-label">Reliability:</span>
            <div className="module-status-display__progress-bar">
              <div 
                className="module-status-display__progress-fill"
                style={{ 
                  width: `${metrics.reliability * 100}%`,
                  backgroundColor: metrics.reliability >= 0.9 ? 'green' : 
                                  metrics.reliability >= 0.7 ? 'yellow' : 'red'
                }}
              />
            </div>
            <span className="module-status-display__metric-value">
              {Math.round(metrics.reliability * 100)}%
            </span>
          </div>
          
          <div className="module-status-display__metric">
            <span className="module-status-display__metric-label">Performance:</span>
            <div className="module-status-display__progress-bar">
              <div 
                className="module-status-display__progress-fill"
                style={{ 
                  width: `${metrics.performance * 100}%`,
                  backgroundColor: metrics.performance >= 0.8 ? 'green' : 
                                  metrics.performance >= 0.5 ? 'yellow' : 'red'
                }}
              />
            </div>
            <span className="module-status-display__metric-value">
              {Math.round(metrics.performance * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Alerts */}
      {showAlerts && alerts.length > 0 && (
        <div className="module-status-display__alerts">
          <h5 className="module-status-display__section-title">Alerts</h5>
          
          <ul className="module-status-display__alert-list">
            {alerts.map((alert, index) => (
              <li 
                key={index}
                className={`module-status-display__alert ${alert.acknowledged ? 'module-status-display__alert--acknowledged' : ''}`}
              >
                <div 
                  className="module-status-display__alert-level"
                  style={{ backgroundColor: getAlertColor(alert.level) }}
                >
                  {alert.level}
                </div>
                <div className="module-status-display__alert-message">
                  {alert.message}
                </div>
                <div className="module-status-display__alert-time">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
                {!alert.acknowledged && (
                  <button 
                    className="module-status-display__alert-ack-button"
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

      {/* Status history */}
      {showHistory && history.length > 0 && (
        <div className="module-status-display__history">
          <h5 className="module-status-display__section-title">Status History</h5>
          
          <ul className="module-status-display__history-list">
            {history.slice().reverse().map((entry, index) => (
              <li 
                key={index}
                className="module-status-display__history-entry"
              >
                <div 
                  className="module-status-display__history-status"
                  style={{ backgroundColor: getStatusColor(entry.status) }}
                >
                  {entry.status}
                </div>
                <div className="module-status-display__history-time">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
                {entry.duration && (
                  <div className="module-status-display__history-duration">
                    {formatUptime(entry.duration)}
                  </div>
                )}
                {entry.reason && (
                  <div className="module-status-display__history-reason">
                    {entry.reason}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Status controls */}
      <div className="module-status-display__controls">
        <h5 className="module-status-display__section-title">Change Status</h5>
        
        <div className="module-status-display__status-buttons">
          <button 
            className="module-status-display__status-button module-status-display__status-button--active"
            onClick={() => handleStatusChange('active')}
            disabled={currentStatus === 'active'}
          >
            Active
          </button>
          
          <button 
            className="module-status-display__status-button module-status-display__status-button--inactive"
            onClick={() => handleStatusChange('inactive')}
            disabled={currentStatus === 'inactive'}
          >
            Inactive
          </button>
          
          <button 
            className="module-status-display__status-button module-status-display__status-button--maintenance"
            onClick={() => handleStatusChange('maintenance')}
            disabled={currentStatus === 'maintenance'}
          >
            Maintenance
          </button>
          
          <button 
            className="module-status-display__status-button module-status-display__status-button--optimized"
            onClick={() => handleStatusChange('optimized')}
            disabled={currentStatus === 'optimized'}
          >
            Optimize
          </button>
          
          <button 
            className="module-status-display__status-button module-status-display__status-button--powersave"
            onClick={() => handleStatusChange('powersave')}
            disabled={currentStatus === 'powersave'}
          >
            Power Save
          </button>
        </div>
      </div>
    </div>
  );
};

interface ModuleStatusSummaryProps {
  moduleIds: string[];
  onSelectModule?: (moduleId: string) => void;
}

/**
 * Component for displaying a summary of multiple module statuses
 */
export const ModuleStatusSummary: React.FC<ModuleStatusSummaryProps> = ({
  moduleIds,
  onSelectModule
}) => {
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
};

interface ModuleStatusSummaryItemProps {
  moduleId: string;
  onClick?: () => void;
}

/**
 * Component for displaying a summary of a single module's status
 */
const ModuleStatusSummaryItem: React.FC<ModuleStatusSummaryItemProps> = ({
  moduleId,
  onClick
}) => {
  const {
    currentStatus,
    metrics,
    alerts,
    getStatusColor
  } = useModuleStatus(moduleId);
  
  const [module, setModule] = useState<any>(null);

  // Load module data
  useEffect(() => {
    const moduleData = moduleManager.getModule(moduleId);
    setModule(moduleData);
  }, [moduleId]);

  if (!module) {
    return null;
  }

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);

  return (
    <div 
      className="module-status-summary-item"
      onClick={onClick}
    >
      <div className="module-status-summary-item__header">
        <div className="module-status-summary-item__name">
          {module.name}
        </div>
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
            <div className="module-status-summary-item__progress-bar">
              <div 
                className="module-status-summary-item__progress-fill"
                style={{ 
                  width: `${metrics.efficiency * 100}%`,
                  backgroundColor: metrics.efficiency >= 1 ? 'green' : 'orange'
                }}
              />
            </div>
          </div>
          
          <div className="module-status-summary-item__metric">
            <span className="module-status-summary-item__metric-label">Reliability:</span>
            <div className="module-status-summary-item__progress-bar">
              <div 
                className="module-status-summary-item__progress-fill"
                style={{ 
                  width: `${metrics.reliability * 100}%`,
                  backgroundColor: metrics.reliability >= 0.9 ? 'green' : 
                                  metrics.reliability >= 0.7 ? 'yellow' : 'red'
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {unacknowledgedAlerts.length > 0 && (
        <div className="module-status-summary-item__alerts">
          <div className="module-status-summary-item__alert-count">
            {unacknowledgedAlerts.length} alert{unacknowledgedAlerts.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

interface ModuleAlertListProps {
  alertLevel?: 'info' | 'warning' | 'error' | 'critical';
  onSelectModule?: (moduleId: string) => void;
}

/**
 * Component for displaying a list of module alerts
 */
export const ModuleAlertList: React.FC<ModuleAlertListProps> = ({
  alertLevel,
  onSelectModule
}) => {
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
};

interface ModuleAlertItemProps {
  moduleId: string;
  alertLevel?: 'info' | 'warning' | 'error' | 'critical';
  onClick?: () => void;
}

/**
 * Component for displaying a single module's alerts
 */
const ModuleAlertItem: React.FC<ModuleAlertItemProps> = ({
  moduleId,
  alertLevel,
  onClick
}) => {
  const {
    currentStatus,
    alerts,
    getStatusColor,
    getAlertColor
  } = useModuleStatus(moduleId);
  
  const [module, setModule] = useState<any>(null);

  // Load module data
  useEffect(() => {
    const moduleData = moduleManager.getModule(moduleId);
    setModule(moduleData);
  }, [moduleId]);

  if (!module) {
    return null;
  }

  // Filter alerts by level and acknowledgement
  const filteredAlerts = alerts.filter(alert => 
    !alert.acknowledged && (!alertLevel || alert.level === alertLevel)
  );

  if (filteredAlerts.length === 0) {
    return null;
  }

  return (
    <div 
      className="module-alert-item"
      onClick={onClick}
    >
      <div className="module-alert-item__header">
        <div className="module-alert-item__name">
          {module.name}
        </div>
        <div 
          className="module-alert-item__status"
          style={{ backgroundColor: getStatusColor(currentStatus) }}
        >
          {currentStatus}
        </div>
      </div>
      
      <ul className="module-alert-item__alert-list">
        {filteredAlerts.map((alert, index) => (
          <li 
            key={index}
            className="module-alert-item__alert"
          >
            <div 
              className="module-alert-item__alert-level"
              style={{ backgroundColor: getAlertColor(alert.level) }}
            >
              {alert.level}
            </div>
            <div className="module-alert-item__alert-message">
              {alert.message}
            </div>
            <div className="module-alert-item__alert-time">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}; 