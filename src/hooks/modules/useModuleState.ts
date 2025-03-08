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
import { useModules } from '../../contexts/ModuleContext';
import { moduleManager } from '../../managers/module/ModuleManager';
import {
  BaseModule,
  BuildingType,
  ModularBuilding,
  ModuleType,
} from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
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

/**
 * Hook to access module state with selector pattern for performance optimization
 *
 * @returns The module state with structured access to modules and helper methods
 */
export function useModuleState() {
  // Track hook render
  trackHookRender(moduleStatePerformanceConfig);

  const { state, dispatch } = useModules();

  // Memoized selectors for different parts of the state - with performance tracking
  const activeModules = measureSelectorTime(
    'activeModules',
    () => useMemo(() => state.activeModules, [state.activeModules]),
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

  const selectedBuildingId = measureSelectorTime(
    'selectedBuildingId',
    () => useMemo(() => state.selectedBuildingId, [state.selectedBuildingId]),
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
    (moduleType: ModuleType, position: Position) => {
      dispatch({
        type: 'CREATE_MODULE',
        moduleType,
        position,
      });
    },
    [dispatch]
  );

  const attachModule = useCallback(
    (moduleId: string, buildingId: string, attachmentPointId: string) => {
      dispatch({
        type: 'ATTACH_MODULE',
        moduleId,
        buildingId,
        attachmentPointId,
      });
    },
    [dispatch]
  );

  const upgradeModule = useCallback(
    (moduleId: string) => {
      dispatch({
        type: 'UPGRADE_MODULE',
        moduleId,
      });
    },
    [dispatch]
  );

  const setModuleActive = useCallback(
    (moduleId: string, active: boolean) => {
      dispatch({
        type: 'SET_MODULE_ACTIVE',
        moduleId,
        active,
      });
    },
    [dispatch]
  );

  const selectModule = useCallback(
    (moduleId: string) => {
      dispatch({
        type: 'SELECT_MODULE',
        moduleId,
      });
    },
    [dispatch]
  );

  const selectBuilding = useCallback(
    (buildingId: string) => {
      dispatch({
        type: 'SELECT_BUILDING',
        buildingId,
      });
    },
    [dispatch]
  );

  const registerBuilding = useCallback(
    (building: ModularBuilding) => {
      dispatch({
        type: 'REGISTER_BUILDING',
        building,
      });
    },
    [dispatch]
  );

  const updateActiveModules = useCallback(
    (modules: BaseModule[]) => {
      dispatch({
        type: 'UPDATE_ACTIVE_MODULES',
        modules,
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
    (buildingId: string, moduleType: ModuleType) =>
      measureComputationTime(
        `getAvailableAttachmentPoints:${buildingId}:${moduleType}`,
        () => {
          const building = moduleManager.getBuilding(buildingId);
          return building
            ? building.attachmentPoints.filter(
                p => p.allowedTypes.includes(moduleType) && !p.currentModule
              )
            : [];
        },
        moduleStatePerformanceConfig
      ),
    []
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
      const { state } = useModules();
      return state.activeModules;
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
    () => {
      const { state } = useModules();
      return state.buildings;
    },
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
      const { state } = useModules();
      return state.selectedModuleId ? moduleManager.getModule(state.selectedModuleId) : undefined;
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
      const { state } = useModules();
      return state.selectedBuildingId
        ? moduleManager.getBuilding(state.selectedBuildingId)
        : undefined;
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
  // Performance tracking configuration
  const performanceConfig: HookPerformanceConfig = {
    ...defaultPerformanceConfig,
    hookName: 'useBuildingsByType',
  };

  // Track hook render
  trackHookRender(performanceConfig);

  return measureComputationTime(
    `buildingsByType:${type}`,
    () => {
      const { state } = useModules();
      return state.buildings.filter(building => building.type === type);
    },
    performanceConfig
  );
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
