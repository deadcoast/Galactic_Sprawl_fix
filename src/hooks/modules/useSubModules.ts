import { useCallback, useEffect, useState } from 'react';
import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { subModuleManager } from '../../managers/module/SubModuleManager';
import {
  SubModule,
  SubModuleConfig,
  SubModuleEffect,
  SubModuleType,
} from '../../types/buildings/ModuleTypes';

/**
 * Hook for managing sub-modules
 * Provides an interface to the SubModuleManager
 */
export function useSubModules(parentModuleId?: string) {
  const [subModules, setSubModules] = useState<SubModule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load sub-modules for parent module
  useEffect(() => {
    if (!parentModuleId) {
      setSubModules([]);
      setIsLoading(false);
      return;
    }

    try {
      const modules = subModuleManager.getSubModulesForParent(parentModuleId);
      setSubModules(modules);
      setIsLoading(false);
    } catch (err) {
      setError(`Error loading sub-modules: ${err}`);
      setIsLoading(false);
    }
  }, [parentModuleId]);

  // Subscribe to sub-module events
  useEffect(() => {
    if (!parentModuleId) {
      return;
    }

    const handleSubModuleCreated = (event: any) => {
      if (event.moduleId === parentModuleId) {
        // Refresh sub-modules
        const modules = subModuleManager.getSubModulesForParent(parentModuleId);
        setSubModules(modules);
      }
    };

    const handleSubModuleAttached = (event: any) => {
      if (event.moduleId === parentModuleId) {
        // Refresh sub-modules
        const modules = subModuleManager.getSubModulesForParent(parentModuleId);
        setSubModules(modules);
      }
    };

    const handleSubModuleDetached = (event: any) => {
      if (event.moduleId === parentModuleId) {
        // Refresh sub-modules
        const modules = subModuleManager.getSubModulesForParent(parentModuleId);
        setSubModules(modules);
      }
    };

    const handleSubModuleUpgraded = (event: any) => {
      if (event.moduleId === parentModuleId) {
        // Refresh sub-modules
        const modules = subModuleManager.getSubModulesForParent(parentModuleId);
        setSubModules(modules);
      }
    };

    const handleSubModuleActivated = (event: any) => {
      if (event.moduleId === parentModuleId) {
        // Refresh sub-modules
        const modules = subModuleManager.getSubModulesForParent(parentModuleId);
        setSubModules(modules);
      }
    };

    const handleSubModuleDeactivated = (event: any) => {
      if (event.moduleId === parentModuleId) {
        // Refresh sub-modules
        const modules = subModuleManager.getSubModulesForParent(parentModuleId);
        setSubModules(modules);
      }
    };

    // Subscribe to events
    const unsubscribeCreated = moduleEventBus.subscribe(
      'SUB_MODULE_CREATED' as ModuleEventType,
      handleSubModuleCreated
    );
    const unsubscribeAttached = moduleEventBus.subscribe(
      'SUB_MODULE_ATTACHED' as ModuleEventType,
      handleSubModuleAttached
    );
    const unsubscribeDetached = moduleEventBus.subscribe(
      'SUB_MODULE_DETACHED' as ModuleEventType,
      handleSubModuleDetached
    );
    const unsubscribeUpgraded = moduleEventBus.subscribe(
      'SUB_MODULE_UPGRADED' as ModuleEventType,
      handleSubModuleUpgraded
    );
    const unsubscribeActivated = moduleEventBus.subscribe(
      'SUB_MODULE_ACTIVATED' as ModuleEventType,
      handleSubModuleActivated
    );
    const unsubscribeDeactivated = moduleEventBus.subscribe(
      'SUB_MODULE_DEACTIVATED' as ModuleEventType,
      handleSubModuleDeactivated
    );

    // Cleanup function
    return () => {
      if (typeof unsubscribeCreated === 'function') {
        unsubscribeCreated();
      }
      if (typeof unsubscribeAttached === 'function') {
        unsubscribeAttached();
      }
      if (typeof unsubscribeDetached === 'function') {
        unsubscribeDetached();
      }
      if (typeof unsubscribeUpgraded === 'function') {
        unsubscribeUpgraded();
      }
      if (typeof unsubscribeActivated === 'function') {
        unsubscribeActivated();
      }
      if (typeof unsubscribeDeactivated === 'function') {
        unsubscribeDeactivated();
      }
    };
  }, [parentModuleId]);

  // Create a sub-module
  const createSubModule = useCallback((type: SubModuleType, parentId: string) => {
    if (!parentId) {
      setError('Parent module ID is required');
      return null;
    }

    const subModule = subModuleManager.createSubModule(type, parentId);
    if (subModule) {
      // Update local state
      setSubModules(prev => [...prev, subModule]);
    }
    return subModule;
  }, []);

  // Attach a sub-module
  const attachSubModule = useCallback((subModuleId: string, parentId: string) => {
    if (!parentId) {
      setError('Parent module ID is required');
      return false;
    }

    const result = subModuleManager.attachSubModule(subModuleId, parentId);
    return result.success;
  }, []);

  // Detach a sub-module
  const detachSubModule = useCallback((subModuleId: string) => {
    const result = subModuleManager.detachSubModule(subModuleId);
    if (result.success) {
      // Update local state
      setSubModules(prev => prev.filter(sm => sm.id !== subModuleId));
    }
    return result.success;
  }, []);

  // Activate a sub-module
  const activateSubModule = useCallback((subModuleId: string) => {
    const success = subModuleManager.activateSubModule(subModuleId);
    if (success) {
      // Update local state
      setSubModules(prev =>
        prev.map(sm => (sm.id === subModuleId ? { ...sm, isActive: true, status: 'active' } : sm))
      );
    }
    return success;
  }, []);

  // Deactivate a sub-module
  const deactivateSubModule = useCallback((subModuleId: string) => {
    const success = subModuleManager.deactivateSubModule(subModuleId);
    if (success) {
      // Update local state
      setSubModules(prev =>
        prev.map(sm =>
          sm.id === subModuleId ? { ...sm, isActive: false, status: 'inactive' } : sm
        )
      );
    }
    return success;
  }, []);

  // Upgrade a sub-module
  const upgradeSubModule = useCallback((subModuleId: string) => {
    const success = subModuleManager.upgradeSubModule(subModuleId);
    if (success) {
      // Update local state
      setSubModules(prev =>
        prev.map(sm => (sm.id === subModuleId ? { ...sm, level: sm.level + 1 } : sm))
      );
    }
    return success;
  }, []);

  // Get a sub-module by ID
  const getSubModule = useCallback((subModuleId: string) => {
    return subModuleManager.getSubModule(subModuleId);
  }, []);

  // Get all sub-modules for a parent module
  const getSubModulesForParent = useCallback((parentId: string) => {
    return subModuleManager.getSubModulesForParent(parentId);
  }, []);

  // Get all sub-modules of a specific type
  const getSubModulesByType = useCallback((type: SubModuleType) => {
    return subModuleManager.getSubModulesByType(type);
  }, []);

  // Get all active sub-modules
  const getActiveSubModules = useCallback(() => {
    return subModuleManager.getActiveSubModules();
  }, []);

  // Register a sub-module configuration
  const registerSubModuleConfig = useCallback((config: SubModuleConfig) => {
    subModuleManager.registerSubModuleConfig(config);
  }, []);

  // Register a custom effect handler
  const registerEffectHandler = useCallback(
    (effectType: string, handler: (effect: SubModuleEffect, moduleId: string) => any) => {
      subModuleManager.registerEffectHandler(effectType, handler);
    },
    []
  );

  return {
    // State
    subModules,
    isLoading,
    error,

    // Actions
    createSubModule,
    attachSubModule,
    detachSubModule,
    activateSubModule,
    deactivateSubModule,
    upgradeSubModule,

    // Queries
    getSubModule,
    getSubModulesForParent,
    getSubModulesByType,
    getActiveSubModules,

    // Registration
    registerSubModuleConfig,
    registerEffectHandler,
  };
}
