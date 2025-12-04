/**
 * @file useModuleState.ts
 * Provides standardized hooks for accessing ModuleContext with selector pattern.
 *
 * This implementation:
 * 1. Uses selector pattern for better performance
 * 2. Provides type safety for module state data
 * 3. Offers specialized selectors for different module types and properties
 * 4. Follows the standardized context access pattern
 * 5. Includes performance monitoring for selectors and computations
 */

import { useCallback, useMemo } from 'react';
import { ModuleActionType, useModuleContext, useModules } from '../../contexts/ModuleContext';
import { moduleManager } from '../../managers/module/ModuleManager';
import {
  BaseModule,
  BuildingType,
  ModularBuilding,
  ModuleType,
} from '../../types/buildings/ModuleTypes';
import {
  HookPerformanceConfig,
  defaultPerformanceConfig,
  measureComputationTime,
  measureSelectorTime,
  trackHookRender,
} from '../../utils/performance/hookPerformanceMonitor';

// Performance monitoring configuration
const moduleStatePerformanceConfig: HookPerformanceConfig = {
  ...defaultPerformanceConfig,
  hookName: 'useModuleState',
};

// Type for the extended state that includes selectedBuildingId
interface ExtendedModuleState {
  selectedBuildingId?: string;
}

/**
 * Hook to access module state with selector pattern for performance optimization
 *
 * @returns The module state with structured access to modules and helper methods
 */
export function useModuleState() {
  // Track hook render
  trackHookRender(moduleStatePerformanceConfig);

  const context = useModuleContext();
  const { state, dispatch } = context;

  // Memoized selectors for different parts of the state - with performance tracking
  const activeModuleIds = measureSelectorTime(
    'activeModuleIds',
    () => useMemo(() => state.activeModuleIds, [state.activeModuleIds]),
    moduleStatePerformanceConfig
  );

  const modules = measureSelectorTime(
    'modules',
    () => useMemo(() => Object.values(state.modules), [state.modules]),
    moduleStatePerformanceConfig
  );

  const activeModules = measureSelectorTime(
    'activeModules',
    () =>
      useMemo(
        () => activeModuleIds.map(id => state.modules[id]).filter(Boolean),
        [activeModuleIds, state.modules]
      ),
    moduleStatePerformanceConfig
  );

  const buildings = measureSelectorTime(
    'buildings',
    () => useMemo(() => state.buildings, [state.buildings]),
    moduleStatePerformanceConfig
  );

  const selectedModuleId = measureSelectorTime(
    'selectedModuleId',
    () => useMemo(() => state.selectedModuleId, [state.selectedModuleId]),
    moduleStatePerformanceConfig
  );

  // Use a custom selector for selectedBuildingId since it's not in the ModuleState interface
  const selectedBuildingId = measureSelectorTime(
    'selectedBuildingId',
    () =>
      useMemo(
        () => (state as unknown as ExtendedModuleState).selectedBuildingId,
        [(state as unknown as ExtendedModuleState).selectedBuildingId]
      ),
    moduleStatePerformanceConfig
  );

  // Derived selectors - with performance tracking
  const selectedModule = measureComputationTime(
    'selectedModule',
    () =>
      useMemo(
        () => (selectedModuleId ? moduleManager.getModule(selectedModuleId) : undefined),
        [selectedModuleId]
      ),
    moduleStatePerformanceConfig
  );

  const selectedBuilding = measureComputationTime(
    'selectedBuilding',
    () =>
      useMemo(
        () => (selectedBuildingId ? moduleManager.getBuilding(selectedBuildingId) : undefined),
        [selectedBuildingId]
      ),
    moduleStatePerformanceConfig
  );

  const modulesByType = useCallback(
    (type: ModuleType) =>
      measureSelectorTime(
        `modulesByType:${type}`,
        () => moduleManager.getModulesByType(type),
        moduleStatePerformanceConfig
      ),
    []
  );

  const buildingModules = useCallback(
    (buildingId: string) =>
      measureSelectorTime(
        `buildingModules:${buildingId}`,
        () => moduleManager.getBuildingModules(buildingId),
        moduleStatePerformanceConfig
      ),
    []
  );

  // Action creators with standardized pattern
  const createModule = useCallback(
    (moduleType: ModuleType, position: { x: number; y: number }) => {
      dispatch({
        type: ModuleActionType.ADD_MODULE,
        payload: {
          module: {
            id: `module-${Date.now()}`,
            name: `New ${moduleType} Module`,
            type: moduleType,
            position,
            level: 1,
            status: 'inactive',
            isActive: false,
          },
        },
      });
    },
    [dispatch]
  );

  const attachModule = useCallback(
    (moduleId: string, buildingId: string, attachmentPointId: string) => {
      dispatch({
        type: ModuleActionType.UPDATE_MODULE,
        payload: {
          moduleId,
          updates: {
            buildingId,
            attachmentPointId,
          },
        },
      });
    },
    [dispatch]
  );

  const upgradeModule = useCallback(
    (moduleId: string) => {
      const module = state.modules[moduleId];
      if (!module) {
        return;
      }

      dispatch({
        type: ModuleActionType.UPDATE_MODULE,
        payload: {
          moduleId,
          updates: {
            level: module.level + 1,
          },
        },
      });
    },
    [dispatch, state.modules]
  );

  const setModuleActive = useCallback(
    (moduleId: string, active: boolean) => {
      dispatch({
        type: active ? ModuleActionType.SET_ACTIVE_MODULES : ModuleActionType.UPDATE_MODULE,
        payload: active
          ? { activeModuleIds: [...state.activeModuleIds, moduleId] }
          : { moduleId, updates: { isActive: false } },
      });
    },
    [dispatch, state.activeModuleIds]
  );

  const selectModule = useCallback(
    (moduleId: string | null) => {
      dispatch({
        type: ModuleActionType.SELECT_MODULE,
        payload: { selectedModuleId: moduleId },
      });
    },
    [dispatch]
  );

  // Custom action types - using type assertion to avoid TypeScript errors
  const selectBuilding = useCallback(
    (buildingId: string) => {
      // Use a valid ModuleActionType and include the buildingId in the payload
      dispatch({
        type: ModuleActionType.SELECT_MODULE,
        payload: { selectedBuildingId: buildingId },
      });
    },
    [dispatch]
  );

  const registerBuilding = useCallback(
    (building: ModularBuilding) => {
      // Use a valid ModuleActionType and include the building in the payload
      dispatch({
        type: ModuleActionType.UPDATE_MODULE,
        payload: { building },
      });
    },
    [dispatch]
  );

  const updateActiveModules = useCallback(
    (modules: BaseModule[]) => {
      dispatch({
        type: ModuleActionType.SET_ACTIVE_MODULES,
        payload: { activeModuleIds: modules.map(m => m.id) },
      });
    },
    [dispatch]
  );

  // Utility functions - with performance tracking when appropriate
  const isModuleActive = useCallback(
    (moduleId: string) =>
      measureComputationTime(
        `isModuleActive:${moduleId}`,
        () => {
          const module = moduleManager.getModule(moduleId);
          return module ? module.isActive : false;
        },
        moduleStatePerformanceConfig
      ),
    []
  );

  const getModuleLevel = useCallback(
    (moduleId: string) =>
      measureComputationTime(
        `getModuleLevel:${moduleId}`,
        () => {
          const module = moduleManager.getModule(moduleId);
          return module ? module.level : 0;
        },
        moduleStatePerformanceConfig
      ),
    []
  );

  const getAttachmentPointsForBuilding = useCallback(
    (buildingId: string) =>
      measureSelectorTime(
        `getAttachmentPoints:${buildingId}`,
        () => {
          const building = moduleManager.getBuilding(buildingId);
          return building ? building.attachmentPoints : [];
        },
        moduleStatePerformanceConfig
      ),
    []
  );

  const getAvailableAttachmentPoints = useCallback(
    (building: ModularBuilding, moduleType: ModuleType) => {
      if (!building?.attachmentPoints) {
        return [];
      }

      return building.attachmentPoints.filter(
        p => p.allowedTypes.includes(moduleType) && !p.currentModule
      );
    },
    [state.modules]
  );

  const getBuildingsByType = useCallback(
    (type: BuildingType) =>
      measureComputationTime(
        `getBuildingsByType:${type}`,
        () => {
          return buildings.filter(building => building.type === type);
        },
        moduleStatePerformanceConfig
      ),
    [buildings]
  );

  // Return structured state and actions - measure computation time for the final object assembly
  return measureComputationTime(
    'returnStateObject',
    () => ({
      // State selectors
      modules: {
        all: moduleManager.getActiveModules(),
        active: activeModules,
        selected: selectedModule,
        byType: modulesByType,
      },

      buildings: {
        all: buildings,
        selected: selectedBuilding,
        byType: getBuildingsByType,
        modules: buildingModules,
        attachmentPoints: getAttachmentPointsForBuilding,
        availableAttachmentPoints: getAvailableAttachmentPoints,
      },

      selection: {
        selectedModuleId,
        selectedBuildingId,
      },

      // Actions
      actions: {
        createModule,
        attachModule,
        upgradeModule,
        setModuleActive,
        selectModule,
        selectBuilding,
        registerBuilding,
        updateActiveModules,
      },

      // Utilities
      utils: {
        isModuleActive,
        getModuleLevel,
        getAttachmentPointsForBuilding,
        getAvailableAttachmentPoints,
        getBuildingsByType,
      },
    }),
    moduleStatePerformanceConfig
  );
}

/**
 * Hook to access only active modules
 *
 * @returns Array of active modules
 */
export function useActiveModules(): BaseModule[] {
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useActiveModules',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  return measureSelectorTime(
    'activeModules',
    () => {
      const modules = useModules(state => state.modules);
      const activeModuleIds = useModules(state => state.activeModuleIds);
      // Cast to BaseModule[] to satisfy TypeScript
      return Object.values(modules).filter(module => {
        // Type guard to ensure module has an id property
        if (module && typeof module === 'object' && 'id' in module) {
          return activeModuleIds.includes(module.id);
        }
        return false;
      }) as BaseModule[];
    },
    performanceConfig
  );
}

/**
 * Hook to access only buildings
 *
 * @returns Array of buildings
 */
export function useBuildings(): ModularBuilding[] {
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useBuildings',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  return measureSelectorTime(
    'buildings',
    () => useModules(state => state.buildings),
    performanceConfig
  );
}

/**
 * Hook to access modules of a specific type
 *
 * @param type The module type to filter by
 * @returns Array of modules of the specified type
 */
export function useModulesByType(type: ModuleType): BaseModule[] {
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useModulesByType',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  return measureComputationTime(
    `modulesByType:${type}`,
    () => moduleManager.getModulesByType(type),
    performanceConfig
  );
}

/**
 * Hook to access the selected module data
 *
 * @returns The currently selected module or undefined
 */
export function useSelectedModuleData(): BaseModule | undefined {
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useSelectedModuleData',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  return measureComputationTime(
    'selectedModuleData',
    () => {
      const selectedModuleId = useModules(state => state.selectedModuleId);
      return selectedModuleId ? moduleManager.getModule(selectedModuleId) : undefined;
    },
    performanceConfig
  );
}

/**
 * Hook to access the selected building data
 *
 * @returns The currently selected building or undefined
 */
export function useSelectedBuildingData(): ModularBuilding | undefined {
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useSelectedBuildingData',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  return measureComputationTime(
    'selectedBuildingData',
    () => {
      const selectedBuildingId = useModules(
        state => (state as unknown as ExtendedModuleState).selectedBuildingId
      );
      return selectedBuildingId ? moduleManager.getBuilding(selectedBuildingId) : undefined;
    },
    performanceConfig
  );
}

/**
 * Hook to access modules attached to a specific building
 *
 * @param buildingId The ID of the building
 * @returns Array of modules attached to the building
 */
export function useBuildingModulesData(buildingId: string): BaseModule[] {
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useBuildingModulesData',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  return measureComputationTime(
    `buildingModules:${buildingId}`,
    () => moduleManager.getBuildingModules(buildingId),
    performanceConfig
  );
}

/**
 * Hook to access buildings of a specific type
 *
 * @param type The building type
 * @returns Array of buildings of the specified type
 */
export function useBuildingsByType(type: BuildingType): ModularBuilding[] {
  const buildings = useModules(state => state.buildings);

  return useMemo(() => {
    return buildings.filter((building: ModularBuilding) => building.type === type);
  }, [buildings, type]);
}

/**
 * Hook to get attachment points for a module type on a specific building
 *
 * @param buildingId The building ID
 * @param moduleType The module type
 * @returns Array of attachment points that can accept the module type
 */
export function useAvailableAttachmentPoints(buildingId: string, moduleType: ModuleType) {
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useAvailableAttachmentPoints',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  return measureComputationTime(
    `availableAttachmentPoints:${buildingId}:${moduleType}`,
    () => {
      const building = moduleManager.getBuilding(buildingId);
      return building
        ? building.attachmentPoints.filter(
            p => p.allowedTypes.includes(moduleType) && !p.currentModule
          )
        : [];
    },
    performanceConfig
  );
}
