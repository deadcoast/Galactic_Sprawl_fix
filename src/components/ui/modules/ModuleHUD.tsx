/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from "react";
import { useCallback, useEffect, useState } from 'react';
import { ModuleEvent, moduleEventBus, ModuleEventType } from '../../../lib/modules/ModuleEvents';
import { moduleManager } from '../../../managers/module/ModuleManager';
import { BaseModule, ModuleConfig } from '../../../types/buildings/ModuleTypes';
import {
  calculateModuleCrew,
  calculateModulePower,
  calculateModuleUpkeep,
} from '../../../utils/modules/moduleValidation';

interface ModuleHUDProps {
  moduleId: string;
  showDetails?: boolean;
  showControls?: boolean;
  onActivate?: (moduleId: string) => void;
  onDeactivate?: (moduleId: string) => void;
  onUpgrade?: (moduleId: string) => void;
}

interface ModuleStats {
  power: number;
  crew: number;
  upkeep: number;
}

/**
 * Dynamic HUD component for modules
 * Displays module information, status, and controls
 */
export const ModuleHUD: React.FC<ModuleHUDProps> = ({
  moduleId,
  showDetails = true,
  showControls = true,
  onActivate,
  onDeactivate,
  onUpgrade,
}) => {
  const [module, setModule] = useState<BaseModule | null>(null);
  const [config, setConfig] = useState<ModuleConfig | null>(null);
  const [stats, setStats] = useState<ModuleStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load module data
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      const moduleData = moduleManager.getModule(moduleId);
      if (!moduleData) {
        setError(`Module ${moduleId} not found`);
        setIsLoading(false);
        return;
      }

      setModule(moduleData);

      // Get module configs from manager
      const moduleConfigs = (moduleManager as unknown as { configs: Map<string, ModuleConfig> })
        .configs;
      if (moduleConfigs && moduleConfigs instanceof Map) {
        const configData = moduleConfigs.get(moduleData.type);
        if (configData) {
          setConfig(configData);

          // Calculate module stats
          setStats({
            power: calculateModulePower(moduleData, configData),
            crew: calculateModuleCrew(moduleData, configData),
            upkeep: calculateModuleUpkeep(moduleData, configData),
          });
        }
      }

      setIsLoading(false);
    } catch (err) {
      setError(`Error loading module data: ${err}`);
      setIsLoading(false);
    }
  }, [moduleId]);

  // Subscribe to module events
  useEffect(() => {
    const handleModuleUpdated = (event: ModuleEvent) => {
      if (event?.moduleId === moduleId) {
        // Refresh module data
        const moduleData = moduleManager.getModule(moduleId);
        if (moduleData) {
          setModule(moduleData);

          // Update stats if config is available
          if (config) {
            setStats({
              power: calculateModulePower(moduleData, config),
              crew: calculateModuleCrew(moduleData, config),
              upkeep: calculateModuleUpkeep(moduleData, config),
            });
          }
        }
      }
    };

    // Subscribe to relevant events
    const unsubscribeUpgraded = moduleEventBus.subscribe('MODULE_UPGRADED', handleModuleUpdated);
    const unsubscribeActivated = moduleEventBus.subscribe('MODULE_ACTIVATED', handleModuleUpdated);
    const unsubscribeDeactivated = moduleEventBus.subscribe(
      'MODULE_DEACTIVATED',
      handleModuleUpdated
    );
    const unsubscribeStatusChanged = moduleEventBus.subscribe(
      'STATUS_CHANGED',
      handleModuleUpdated
    );

    return () => {
      // Unsubscribe from events
      if (typeof unsubscribeUpgraded === 'function') {
        unsubscribeUpgraded();
      }
      if (typeof unsubscribeActivated === 'function') {
        unsubscribeActivated();
      }
      if (typeof unsubscribeDeactivated === 'function') {
        unsubscribeDeactivated();
      }
      if (typeof unsubscribeStatusChanged === 'function') {
        unsubscribeStatusChanged();
      }
    };
  }, [moduleId, config]);

  // Handle module activation
  const handleActivate = useCallback(() => {
    if (module && !module.isActive && onActivate) {
      onActivate(moduleId);
    }
  }, [module, moduleId, onActivate]);

  // Handle module deactivation
  const handleDeactivate = useCallback(() => {
    if (module && module.isActive && onDeactivate) {
      onDeactivate(moduleId);
    }
  }, [module, moduleId, onDeactivate]);

  // Handle module upgrade
  const handleUpgrade = useCallback(() => {
    if (module && onUpgrade) {
      onUpgrade(moduleId);
    }
  }, [module, moduleId, onUpgrade]);

  // Render loading state
  if (isLoading) {
    return <div className="module-hud module-hud--loading">Loading module data?...</div>;
  }

  // Render error state
  if (error) {
    return <div className="module-hud module-hud--error">{error}</div>;
  }

  // Render empty state
  if (!module || !config || !stats) {
    return <div className="module-hud module-hud--empty">No module data available</div>;
  }

  // Get status color
  const getStatusColor = () => {
    switch (module.status) {
      case 'active':
        return 'green';
      case 'constructing':
        return 'yellow';
      case 'inactive':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <div className={`module-hud module-hud--${module.type} module-hud--${module.status}`}>
      {/* Module header */}
      <div className="module-hud__header">
        <h3 className="module-hud__title">{module.name}</h3>
        <div className="module-hud__status" style={{ backgroundColor: getStatusColor() }}>
          {module.status}
        </div>
        <div className="module-hud__level">Level {module.level}</div>
      </div>

      {/* Module details */}
      {showDetails && (
        <div className="module-hud__details">
          <div className="module-hud__description">{config.description}</div>

          <div className="module-hud__stats">
            <div className="module-hud__stat">
              <span className="module-hud__stat-label">Power:</span>
              <span className="module-hud__stat-value">{stats.power}</span>
            </div>
            <div className="module-hud__stat">
              <span className="module-hud__stat-label">Crew:</span>
              <span className="module-hud__stat-value">{stats.crew}</span>
            </div>
            <div className="module-hud__stat">
              <span className="module-hud__stat-label">Upkeep:</span>
              <span className="module-hud__stat-value">{stats.upkeep}</span>
            </div>
          </div>

          {/* Construction progress */}
          {module.status === 'constructing' && module.progress !== undefined && (
            <div className="module-hud__progress">
              <div className="module-hud__progress-label">Construction Progress</div>
              <div className="module-hud__progress-bar">
                <div
                  className="module-hud__progress-fill"
                  style={{ width: `${module.progress * 100}%` }}
                />
              </div>
              <div className="module-hud__progress-value">{Math.round(module.progress * 100)}%</div>
            </div>
          )}
        </div>
      )}

      {/* Module controls */}
      {showControls && (
        <div className="module-hud__controls">
          {module.isActive ? (
            <button
              className="module-hud__button module-hud__button--deactivate"
              onClick={handleDeactivate}
              disabled={module.status !== 'active'}
            >
              Deactivate
            </button>
          ) : (
            <button
              className="module-hud__button module-hud__button--activate"
              onClick={handleActivate}
              disabled={module.status !== 'inactive'}
            >
              Activate
            </button>
          )}

          <button
            className="module-hud__button module-hud__button--upgrade"
            onClick={handleUpgrade}
            disabled={module.status !== 'active'}
          >
            Upgrade
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Module HUD List component
 * Displays a list of module HUDs
 */
export const ModuleHUDList: React.FC<{
  moduleIds: string[];
  showDetails?: boolean;
  showControls?: boolean;
  onActivate?: (moduleId: string) => void;
  onDeactivate?: (moduleId: string) => void;
  onUpgrade?: (moduleId: string) => void;
}> = ({
  moduleIds,
  showDetails = true,
  showControls = true,
  onActivate,
  onDeactivate,
  onUpgrade,
}) => {
  return (
    <div className="module-hud-list">
      {moduleIds.map(moduleId => (
        <ModuleHUD
          key={moduleId}
          moduleId={moduleId}
          showDetails={showDetails}
          showControls={showControls}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
          onUpgrade={onUpgrade}
        />
      ))}
    </div>
  );
};

/**
 * Building Modules HUD component
 * Displays HUDs for all modules in a building
 */
export const BuildingModulesHUD: React.FC<{
  buildingId: string;
  showDetails?: boolean;
  showControls?: boolean;
  onActivate?: (moduleId: string) => void;
  onDeactivate?: (moduleId: string) => void;
  onUpgrade?: (moduleId: string) => void;
}> = ({
  buildingId,
  showDetails = true,
  showControls = true,
  onActivate,
  onDeactivate,
  onUpgrade,
}) => {
  const [moduleIds, setModuleIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load building modules
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      const building = moduleManager.getBuilding(buildingId);
      if (!building) {
        setError(`Building ${buildingId} not found`);
        setIsLoading(false);
        return;
      }

      setModuleIds(building.modules.map(module => module.id));
      setIsLoading(false);
    } catch (err) {
      setError(`Error loading building modules: ${err}`);
      setIsLoading(false);
    }
  }, [buildingId]);

  // Subscribe to module events
  useEffect(() => {
    const handleModuleAttached = (event: ModuleEvent) => {
      if (event?.data?.buildingId === buildingId) {
        // Refresh module list
        const building = moduleManager.getBuilding(buildingId);
        if (building) {
          setModuleIds(building.modules.map(module => module.id));
        }
      }
    };

    const handleModuleDetached = (event: ModuleEvent) => {
      if (event?.data?.buildingId === buildingId) {
        // Refresh module list
        const building = moduleManager.getBuilding(buildingId);
        if (building) {
          setModuleIds(building.modules.map(module => module.id));
        }
      }
    };

    /**
     * Handler for module status changes - will be implemented in future updates
     * This function will be used to:
     * 1. Update module status indicators in real-time
     * 2. Trigger visual feedback for status transitions
     * 3. Update performance metrics based on status changes
     * 4. Notify connected systems about status changes
     * 5. Log status changes for analytics and debugging
     */
    const handleModuleStatusChanged = (event: ModuleEvent) => {
      if (event?.data?.buildingId === buildingId) {
        // Future implementation will:
        // - Update status indicators with animation
        // - Trigger status-specific effects
        // - Update resource consumption based on new status
        // - Notify connected modules of status change
        console.warn('Module status changed handler to be implemented');
      }
    };

    /**
     * Handler for module alerts - will be implemented in future updates
     * This function will be used to:
     * 1. Display visual alert indicators on modules
     * 2. Categorize alerts by severity (warning, critical, info)
     * 3. Aggregate similar alerts to prevent UI clutter
     * 4. Provide interactive alert resolution options
     * 5. Track alert history for troubleshooting
     */
    const handleModuleAlertAdded = (event: ModuleEvent) => {
      if (event?.data?.buildingId === buildingId) {
        // Future implementation will:
        // - Create alert notification with appropriate styling
        // - Add alert to module's alert history
        // - Provide resolution options based on alert type
        // - Update module status if alert is critical
        console.warn('Module alert handler to be implemented');
      }
    };

    // Subscribe to relevant events
    const unsubscribeAttached = moduleEventBus.subscribe(
      'MODULE_ATTACHED' as ModuleEventType,
      handleModuleAttached
    );
    const unsubscribeDetached = moduleEventBus.subscribe(
      'MODULE_DETACHED' as ModuleEventType,
      handleModuleDetached
    );

    // Subscribe to module status changed events
    const unsubscribeStatusChanged = moduleEventBus.subscribe(
      'MODULE_STATUS_CHANGED' as ModuleEventType,
      handleModuleStatusChanged
    );

    // Subscribe to module alert events
    const unsubscribeAlertAdded = moduleEventBus.subscribe(
      'MODULE_ALERT_ADDED' as ModuleEventType,
      handleModuleAlertAdded
    );

    // Cleanup subscriptions
    return () => {
      if (typeof unsubscribeAttached === 'function') {
        unsubscribeAttached();
      }
      if (typeof unsubscribeDetached === 'function') {
        unsubscribeDetached();
      }
      if (typeof unsubscribeStatusChanged === 'function') {
        unsubscribeStatusChanged();
      }
      if (typeof unsubscribeAlertAdded === 'function') {
        unsubscribeAlertAdded();
      }
    };
  }, [buildingId]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="building-modules-hud building-modules-hud--loading">
        Loading building modules...
      </div>
    );
  }

  // Render error state
  if (error) {
    return <div className="building-modules-hud building-modules-hud--error">{error}</div>;
  }

  // Render empty state
  if (moduleIds.length === 0) {
    return (
      <div className="building-modules-hud building-modules-hud--empty">No modules installed</div>
    );
  }

  return (
    <div className="building-modules-hud">
      <h2 className="building-modules-hud__title">Building Modules</h2>
      <ModuleHUDList
        moduleIds={moduleIds}
        showDetails={showDetails}
        showControls={showControls}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
        onUpgrade={onUpgrade}
      />
    </div>
  );
};
