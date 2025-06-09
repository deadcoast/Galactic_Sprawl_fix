/**
 * @context: ui-system, component-library, module-registry
 *
 * ModuleControls component for providing common module operation controls
 */
import * as React from 'react';
import { useModuleStatus } from '../../../hooks/modules/useModuleStatus';
import { moduleManager } from '../../../managers/module/ModuleManager';
import { ExtendedModuleStatus } from '../../../managers/module/ModuleStatusManager';
import { BaseModule } from '../../../types/buildings/ModuleTypes';
import { EventType } from '../../../types/events/EventTypes';

// Button variant types
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'info';

interface ModuleControlsProps {
  /**
   * Module ID to control
   */
  moduleId: string;

  /**
   * Whether to show the activate/deactivate toggle
   * @default true
   */
  showActivateToggle?: boolean;

  /**
   * Whether to show the upgrade button
   * @default true
   */
  showUpgrade?: boolean;

  /**
   * Whether to show the maintenance button
   * @default false
   */
  showMaintenance?: boolean;

  /**
   * Whether to show the power mode controls
   * @default false
   */
  showPowerModes?: boolean;

  /**
   * Custom CSS class name
   */
  className?: string;

  /**
   * Button size
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Callback when module status changes
   */
  onStatusChange?: (newStatus: ExtendedModuleStatus) => void;

  /**
   * Callback when upgrade starts
   */
  onUpgradeStart?: () => void;

  /**
   * Custom module data (override for using the hook)
   */
  moduleData?: BaseModule;
}

/**
 * Component that provides controls for module operations
 */
export function ModuleControls({
  moduleId,
  showActivateToggle = true,
  showUpgrade = true,
  showMaintenance = false,
  showPowerModes = false,
  className = '',
  size = 'medium',
  onStatusChange,
  onUpgradeStart,
  moduleData,
}: ModuleControlsProps) {
  // Get module data from hook or override
  const { module, currentStatus, isLoading, error } = useModuleStatus(moduleId);

  // Use provided module data if available, otherwise use from hook
  const activeModule = moduleData ?? module;

  // Get size-based class
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'module-controls__button--small';
      case 'large':
        return 'module-controls__button--large';
      default:
        return '';
    }
  };

  // Handle module activation/deactivation
  const handleToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling

    if (activeModule) {
      const newActive = !activeModule.isActive;
      moduleManager.setModuleActive(moduleId, newActive);

      // Call status change callback if provided
      if (onStatusChange) {
        onStatusChange(newActive ? 'active' : 'inactive');
      }
    }
  };

  // Handle module upgrade
  const handleUpgrade = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling

    if (activeModule) {
      moduleManager.upgradeModule(moduleId);

      // Call upgrade start callback if provided
      if (onUpgradeStart) {
        onUpgradeStart();
      }

      // Call status change callback if provided
      if (onStatusChange) {
        onStatusChange('upgrading');
      }
    }
  };

  // Handle maintenance mode toggle
  const handleMaintenanceToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling

    if (activeModule) {
      const isInMaintenance = currentStatus === 'maintenance';
      const newStatus: ExtendedModuleStatus = isInMaintenance ? 'active' : 'maintenance';

      moduleManager.publishEvent({
        type: EventType.MODULE_STATUS_CHANGED,
        moduleId,
        moduleType: activeModule.type,
        timestamp: Date.now(),
        data: {
          status: newStatus,
          previousStatus: currentStatus,
        },
      });

      // Call status change callback if provided
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    }
  };

  // Handle power mode change
  const handlePowerModeChange =
    (mode: 'normal' | 'powersave' | 'boost') => (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent event bubbling

      if (activeModule) {
        let newStatus: ExtendedModuleStatus = 'active';

        if (mode === 'powersave') {
          newStatus = 'powersave';
        } else if (mode === 'boost') {
          newStatus = 'boost';
        }

        moduleManager.publishEvent({
          type: EventType.MODULE_STATUS_CHANGED,
          moduleId,
          moduleType: activeModule.type,
          timestamp: Date.now(),
          data: {
            status: newStatus,
            previousStatus: currentStatus,
          },
        });

        // Call status change callback if provided
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      }
    };

  // Display loading state
  if (isLoading && !moduleData) {
    return (
      <div className={`module-controls module-controls--loading ${className}`}>
        <span className="module-controls__loading">Loading...</span>
      </div>
    );
  }

  // Display error state
  if ((error || !activeModule) && !moduleData) {
    return (
      <div className={`module-controls module-controls--error ${className}`}>
        <span className="module-controls__error">Error loading module controls</span>
      </div>
    );
  }

  // Determine button states
  const isActive = activeModule?.isActive ?? false;
  const isUpgrading = currentStatus === 'upgrading';
  const isInMaintenance = currentStatus === 'maintenance';
  const currentPowerMode =
    currentStatus === 'powersave' ? 'powersave' : currentStatus === 'boost' ? 'boost' : 'normal';

  return (
    <div className={`module-controls ${className}`} data-testid="module-controls">
      {/* Activate/Deactivate Toggle */}
      {showActivateToggle && (
        <button
          className={`module-controls__button ${getSizeClass()} ${isActive ? 'module-controls__button--active' : 'module-controls__button--inactive'}`}
          onClick={handleToggleActive}
          disabled={isUpgrading}
          data-testid="module-toggle-active"
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
      )}

      {/* Upgrade Button */}
      {showUpgrade && (
        <button
          className={`module-controls__button module-controls__button--upgrade ${getSizeClass()}`}
          onClick={handleUpgrade}
          disabled={isUpgrading || currentStatus === 'inactive'}
          data-testid="module-upgrade"
        >
          {isUpgrading ? 'Upgrading...' : 'Upgrade'}
        </button>
      )}

      {/* Maintenance Button */}
      {showMaintenance && (
        <button
          className={`module-controls__button ${isInMaintenance ? 'module-controls__button--active' : ''} ${getSizeClass()}`}
          onClick={handleMaintenanceToggle}
          disabled={!isActive || isUpgrading}
          data-testid="module-maintenance"
        >
          {isInMaintenance ? 'Exit Maintenance' : 'Maintenance'}
        </button>
      )}

      {/* Power Mode Controls */}
      {showPowerModes && isActive && !isUpgrading && (
        <div className="module-controls__power-modes">
          <button
            className={`module-controls__button ${currentPowerMode === 'powersave' ? 'module-controls__button--active' : ''} ${getSizeClass()}`}
            onClick={handlePowerModeChange('powersave')}
            disabled={currentPowerMode === 'powersave'}
            data-testid="module-powersave"
          >
            Power Save
          </button>

          <button
            className={`module-controls__button ${currentPowerMode === 'normal' ? 'module-controls__button--active' : ''} ${getSizeClass()}`}
            onClick={handlePowerModeChange('normal')}
            disabled={currentPowerMode === 'normal'}
            data-testid="module-normal-power"
          >
            Normal
          </button>

          <button
            className={`module-controls__button ${currentPowerMode === 'boost' ? 'module-controls__button--active' : ''} ${getSizeClass()}`}
            onClick={handlePowerModeChange('boost')}
            disabled={currentPowerMode === 'boost'}
            data-testid="module-boost"
          >
            Boost
          </button>
        </div>
      )}
    </div>
  );
}

// Styles for the component
const styles = `
.module-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.module-controls__button {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #ced4da;
  background-color: #f8f9fa;
  color: #495057;
  transition: all 0.2s ease-in-out;
}

.module-controls__button:hover:not(:disabled) {
  background-color: #e9ecef;
}

.module-controls__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.module-controls__button--active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.module-controls__button--inactive {
  background-color: #f8f9fa;
  color: #495057;
}

.module-controls__button--upgrade {
  background-color: #6f42c1;
  color: white;
  border-color: #6f42c1;
}

.module-controls__button--small {
  padding: 4px 8px;
  font-size: 12px;
}

.module-controls__button--large {
  padding: 10px 16px;
  font-size: 16px;
}

.module-controls__power-modes {
  display: flex;
  gap: 4px;
}

.module-controls--loading,
.module-controls--error {
  color: #6c757d;
  font-style: italic;
}
`;

// Add the styles to the document head if we're in a browser environment
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = styles;
  document.head.appendChild(styleElement);
}
