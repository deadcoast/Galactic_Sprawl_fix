import { useCallback, useEffect, useState } from 'react';
import { moduleEventBus } from '../../lib/events/ModuleEventBus';
import { moduleManager } from '../../managers/module/ModuleManager';
import {
  ModuleUpgradeEffect,
  moduleUpgradeManager,
  ModuleUpgradeStatus,
} from '../../managers/module/ModuleUpgradeManager';
import { EventType } from '../../types/events/EventTypes';
import { StandardizedEvent } from '../../types/events/StandardizedEvents';

/**
 * Hook for managing module upgrades
 * @param moduleId The ID of the module to manage upgrades for
 */
export function useModuleUpgrade(moduleId?: string) {
  const [upgradeStatus, setUpgradeStatus] = useState<ModuleUpgradeStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load upgrade status
  useEffect(() => {
    if (!moduleId) {
      setUpgradeStatus(null);
      setIsLoading(false);
      return;
    }

    try {
      const status = moduleUpgradeManager.getUpgradeStatus(moduleId);
      setUpgradeStatus(status || null);
      setIsLoading(false);
    } catch (err) {
      setError(`Error loading upgrade status: ${err}`);
      setIsLoading(false);
    }
  }, [moduleId]);

  // Subscribe to module events
  useEffect(() => {
    if (!moduleId) {
      return;
    }

    const handleModuleEvent = (event: StandardizedEvent) => {
      if (event?.moduleId === moduleId) {
        try {
          const status = moduleUpgradeManager.getUpgradeStatus(moduleId);
          setUpgradeStatus(status || null);
        } catch (err) {
          setError(`Error updating upgrade status: ${err}`);
        }
      }
    };

    // Subscribe to events with filtering by moduleId
    const unsubscribeUpgraded = moduleEventBus.subscribe(
      EventType.MODULE_UPGRADED,
      handleModuleEvent,
      { moduleId }
    );
    const unsubscribeStarted = moduleEventBus.subscribe(
      EventType.MODULE_STATUS_CHANGED,
      handleModuleEvent,
      { moduleId }
    );
    const unsubscribeUpdated = moduleEventBus.subscribe(
      EventType.MODULE_UPDATED,
      handleModuleEvent,
      { moduleId }
    );

    // Set up progress update interval for active upgrades
    const progressInterval = setInterval(() => {
      if (upgradeStatus?.upgradeProgress !== undefined) {
        try {
          const status = moduleUpgradeManager.getUpgradeStatus(moduleId);
          setUpgradeStatus(status || null);
        } catch (_err) {
          // Silently ignore errors during progress updates
        }
      }
    }, 1000); // Update every second

    return () => {
      // Unsubscribe from events
      unsubscribeUpgraded();
      unsubscribeStarted();
      unsubscribeUpdated();

      // Clear interval
      clearInterval(progressInterval);
    };
  }, [moduleId, upgradeStatus?.upgradeProgress]);

  // Start upgrade
  const startUpgrade = useCallback(() => {
    if (!moduleId) {
      return false;
    }
    return moduleUpgradeManager.startUpgrade(moduleId);
  }, [moduleId]);

  // Cancel upgrade
  const cancelUpgrade = useCallback(() => {
    if (!moduleId) {
      return false;
    }
    return moduleUpgradeManager.cancelUpgrade(moduleId);
  }, [moduleId]);

  // Format time remaining
  const formatTimeRemaining = useCallback((milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }

    return `${seconds}s`;
  }, []);

  // Get effect description
  const getEffectDescription = useCallback((effect: ModuleUpgradeEffect): string => {
    const sign = effect.value >= 0 ? '+' : '';
    const valueStr = effect.isPercentage ? `${sign}${effect.value}%` : `${sign}${effect.value}`;

    return `${effect.description} (${valueStr})`;
  }, []);

  return {
    // State
    upgradeStatus,
    isLoading,
    error,

    // Current status
    currentLevel: upgradeStatus?.currentLevel,
    maxLevel: upgradeStatus?.maxLevel,
    nextLevel: upgradeStatus?.nextLevel,
    upgradeAvailable: upgradeStatus?.upgradeAvailable,
    requirementsMet: upgradeStatus?.requirementsMet,
    missingRequirements: upgradeStatus?.missingRequirements,
    upgradeProgress: upgradeStatus?.upgradeProgress,
    estimatedTimeRemaining: upgradeStatus?.estimatedTimeRemaining,
    effects: upgradeStatus?.effects,

    // Actions
    startUpgrade,
    cancelUpgrade,

    // Utilities
    formatTimeRemaining,
    getEffectDescription,
  };
}

/**
 * Hook for tracking modules with available upgrades
 */
export function useModulesWithAvailableUpgrades() {
  const [moduleIds, setModuleIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load modules with available upgrades
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all modules
      const modules = moduleManager.getActiveModules();

      // Filter modules with available upgrades
      const availableUpgrades = modules.filter(module => {
        const status = moduleUpgradeManager.getUpgradeStatus(module.id);
        return status?.upgradeAvailable && status?.requirementsMet;
      });

      setModuleIds(availableUpgrades.map(module => module.id));
      setIsLoading(false);
    } catch (err) {
      setError(`Error loading modules with available upgrades: ${err}`);
      setIsLoading(false);
    }
  }, []);

  // Subscribe to module events
  useEffect(() => {
    const updateAvailableUpgrades = () => {
      try {
        // Get all modules
        const modules = moduleManager.getActiveModules();

        // Filter modules with available upgrades
        const availableUpgrades = modules.filter(module => {
          const status = moduleUpgradeManager.getUpgradeStatus(module.id);
          return status?.upgradeAvailable && status?.requirementsMet;
        });

        setModuleIds(availableUpgrades.map(module => module.id));
      } catch (err) {
        setError(`Error updating available upgrades: ${err}`);
      }
    };

    // Subscribe to relevant events
    const unsubscribeUpgraded = moduleEventBus.subscribe(
      EventType.MODULE_UPGRADED,
      updateAvailableUpgrades
    );
    const unsubscribeResources = moduleEventBus.subscribe(
      EventType.RESOURCE_UPDATED,
      updateAvailableUpgrades
    );

    return () => {
      unsubscribeUpgraded();
      unsubscribeResources();
    };
  }, []);

  return {
    moduleIds,
    isLoading,
    error,
  };
}
