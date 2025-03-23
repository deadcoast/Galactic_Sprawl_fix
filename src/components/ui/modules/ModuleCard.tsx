import * as React from 'react';
import { memo, useEffect, useState } from 'react';
import { useModuleStatus } from '../../../hooks/modules/useModuleStatus';
import { moduleManager } from '../../../managers/module/ModuleManager';
import { BaseEvent, EventType } from '../../../types/events/EventTypes';
import { Badge } from '../common/Badge';
import './ModuleCard.css';

interface ModuleCardProps {
  moduleId: string;
  onSelect?: (moduleId: string) => void;
  isSelected?: boolean;
  showControls?: boolean;
  compact?: boolean;
}

// Add MODULE_UPGRADE_PROGRESS to event types if not already defined
const MODULE_UPGRADE_PROGRESS = 'MODULE_UPGRADE_PROGRESS';

// Fix useEventSubscription implementation
const useUpgradeProgressTracking = (moduleId: string): number => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleUpgradeProgress = (event: BaseEvent) => {
      if (!event) return;
      
      // Check moduleId match
      if (event.moduleId !== moduleId) return;
      
      // Validate data structure
      if (!event.data || typeof event.data !== 'object') return;
      
      const data = event.data;
      if (!('progress' in data) || typeof data.progress !== 'number') return;
      
      // Set progress from validated data
      setProgress(data.progress);
    };

    // Subscribe to module events
    const unsubscribe = moduleManager.subscribeToEvent(
      MODULE_UPGRADE_PROGRESS as EventType,
      handleUpgradeProgress
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [moduleId]);

  return progress;
};

/**
 * ModuleCard component for displaying module information
 *
 * Standardized component for displaying module information across the application
 * with consistent styling, update patterns, and event subscription handling.
 */
export const ModuleCard = memo(function ModuleCard({
  moduleId,
  onSelect,
  isSelected = false,
  showControls = true,
  compact = false,
}: ModuleCardProps) {
  const { module, currentStatus, metrics, alerts, getStatusColor, updateStatus, isLoading, error } =
    useModuleStatus(moduleId);

  // Use the upgrade progress tracking hook
  const upgradeProgress = useUpgradeProgressTracking(moduleId);

  // Use updateStatus to track status changes
  useEffect(() => {
    if (module && typeof updateStatus === 'function') {
      // We don't have direct access to current status update events,
      // but we can leverage the current status in our component to refresh it
      if (currentStatus) {
        // Create a small interval to check if module needs status refresh
        const statusCheckInterval = setInterval(() => {
          // Only update if module exists and has a status
          if (module) {
            // Refresh with current status
            updateStatus(currentStatus);
          }
        }, 30000); // Check every 30 seconds
        
        return () => clearInterval(statusCheckInterval);
      }
    }
  }, [moduleId, module, updateStatus, currentStatus]);

  // Handle module selection
  const handleSelect = () => {
    if (onSelect) {
      onSelect(moduleId);
    }
  };

  // Handle module activation/deactivation
  const handleToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (module) {
      moduleManager.setModuleActive(moduleId, !module.isActive);
    }
  };

  // Handle module upgrade
  const handleUpgrade = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (module) {
      moduleManager.upgradeModule(moduleId);
    }
  };

  // Return loading state
  if (isLoading) {
    return (
      <div className={`module-card module-card--loading ${compact ? 'module-card--compact' : ''}`}>
        <div className="module-card__loading">Loading module data?...</div>
      </div>
    );
  }

  // Return error state
  if (error || !module) {
    return (
      <div className={`module-card module-card--error ${compact ? 'module-card--compact' : ''}`}>
        <div className="module-card__error">{error || 'Module not found'}</div>
      </div>
    );
  }

  // Determine efficiency class based on metrics
  const getEfficiencyClass = () => {
    if (!metrics || !metrics.efficiency) return '';

    if (metrics.efficiency >= 0.9) return 'module-card--high-efficiency';
    if (metrics.efficiency >= 0.7) return 'module-card--medium-efficiency';
    return 'module-card--low-efficiency';
  };

  return (
    <div
      className={`module-card ${isSelected ? 'module-card--selected' : ''} ${compact ? 'module-card--compact' : ''} ${getEfficiencyClass()} `}
      onClick={handleSelect}
      data-module-id={moduleId}
      data-module-type={module.type}
      data-module-level={module.level}
    >
      <div className="module-card__header">
        <h3 className="module-card__title">{module.name}</h3>
        <Badge
          text={currentStatus}
          color={getStatusColor(currentStatus)}
          className="module-card__status-badge"
        />
      </div>

      {!compact && (
        <div className="module-card__content">
          <div className="module-card__details">
            <div className="module-card__detail">
              <span className="module-card__detail-label">Type:</span>
              <span className="module-card__detail-value">{module.type}</span>
            </div>
            <div className="module-card__detail">
              <span className="module-card__detail-label">Level:</span>
              <span className="module-card__detail-value">{module.level}</span>
            </div>
            {metrics && (
              <div className="module-card__detail">
                <span className="module-card__detail-label">Efficiency:</span>
                <span className="module-card__detail-value">
                  {(metrics.efficiency * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Show alerts if any */}
          {alerts && alerts.length > 0 && (
            <div className="module-card__alerts">
              <h4 className="module-card__section-title">Alerts ({alerts.length})</h4>
              <ul className="module-card__alert-list">
                {alerts.slice(0, 2).map((alert, index) => (
                  <li
                    key={index}
                    className={`module-card__alert module-card__alert--${alert.level}`}
                  >
                    {alert.message}
                  </li>
                ))}
                {alerts.length > 2 && (
                  <li className="module-card__alert module-card__alert--more">
                    +{alerts.length - 2} more alerts
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Show upgrade progress if module is being upgraded */}
          {upgradeProgress > 0 && upgradeProgress < 100 && (
            <div className="module-card__upgrade-progress">
              <div className="module-card__progress-label">Upgrading: {upgradeProgress}%</div>
              <div className="module-card__progress-bar">
                <div
                  className="module-card__progress-fill"
                  style={{ width: `${upgradeProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls for activating/deactivating and upgrading */}
      {showControls && (
        <div className="module-card__controls">
          <button
            className={`module-card__control-btn ${module.isActive ? 'module-card__control-btn--active' : ''}`}
            onClick={handleToggleActive}
          >
            {module.isActive ? 'Deactivate' : 'Activate'}
          </button>

          <button
            className="module-card__control-btn module-card__control-btn--upgrade"
            onClick={handleUpgrade}
            disabled={currentStatus === 'upgrading' || upgradeProgress > 0}
          >
            Upgrade
          </button>
        </div>
      )}
    </div>
  );
});

/**
 * CSS for the ModuleCard component
 */
const styles = `
.module-card {
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 16px;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  border-left: 4px solid #adb5bd;
}

.module-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.module-card--selected {
  border-color: #007bff;
  background-color: #f0f7ff;
}

.module-card--compact {
  padding: 8px;
}

.module-card--loading,
.module-card--error {
  text-align: center;
  padding: 24px;
  color: #6c757d;
}

.module-card--error {
  color: #dc3545;
}

.module-card--high-efficiency {
  border-color: #28a745;
}

.module-card--medium-efficiency {
  border-color: #ffc107;
}

.module-card--low-efficiency {
  border-color: #dc3545;
}

.module-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.module-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.module-card__status-badge {
  font-size: 12px;
  padding: 4px 8px;
}

.module-card__content {
  margin-bottom: 16px;
}

.module-card__details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.module-card__detail {
  display: flex;
  flex-direction: column;
}

.module-card__detail-label {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 2px;
}

.module-card__detail-value {
  font-weight: 500;
}

.module-card__alerts {
  margin-top: 12px;
}

.module-card__section-title {
  font-size: 14px;
  margin-bottom: 8px;
  color: #495057;
}

.module-card__alert-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.module-card__alert {
  padding: 6px 8px;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 12px;
}

.module-card__alert--info {
  background-color: #cfe2ff;
  color: #084298;
}

.module-card__alert--warning {
  background-color: #fff3cd;
  color: #664d03;
}

.module-card__alert--error {
  background-color: #f8d7da;
  color: #842029;
}

.module-card__alert--critical {
  background-color: #f8d7da;
  color: #842029;
  font-weight: bold;
}

.module-card__alert--more {
  text-align: center;
  background-color: #e9ecef;
  color: #495057;
}

.module-card__upgrade-progress {
  margin-top: 12px;
}

.module-card__progress-label {
  font-size: 12px;
  margin-bottom: 4px;
  color: #495057;
}

.module-card__progress-bar {
  height: 6px;
  background-color: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.module-card__progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s ease;
}

.module-card__controls {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.module-card__control-btn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  background-color: #e9ecef;
  color: #495057;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.module-card__control-btn:hover {
  background-color: #dee2e6;
}

.module-card__control-btn--active {
  background-color: #cfe2ff;
  color: #084298;
}

.module-card__control-btn--upgrade {
  background-color: #d1e7dd;
  color: #0f5132;
}

.module-card__control-btn--upgrade:hover {
  background-color: #a3cfbb;
}

.module-card__control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

// Add the styles to the document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
