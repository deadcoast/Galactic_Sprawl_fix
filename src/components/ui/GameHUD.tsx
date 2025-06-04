import {
  AlertTriangle,
  Crown,
  Database,
  Info,
  Map as MapIcon,
  Rocket,
  Settings,
  Terminal,
  X,
} from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GameActionType, useGameDispatch, useGameState } from '../../contexts/GameContext';
import { ModuleActionType, useModuleDispatch, useModules } from '../../contexts/ModuleContext';
import { useVPRSystem } from '../../hooks/ui/useVPRSystem';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../services/logging/ErrorLoggingService';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { Module, ModuleStatus } from '../../types/modules/ModuleTypes';
import { useLazyComponent, useRenderPerformance } from '../../utils/performance/ComponentOptimizer';
import { ResourceType } from './../../types/resources/ResourceTypes';
import { notificationManager, NotificationSystem } from './NotificationSystem';
import ResourceVisualization from './visualization/ResourceVisualization';

// Temporary Settings Panel component
const _SettingsPanel = () => (
  <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
    <h2 className="mb-4 text-xl font-bold">Settings</h2>
    <p className="mb-4 text-gray-400">Game settings will be implemented here.</p>
  </div>
);

interface GameHUDProps {
  empireName: string;
  onToggleSprawlView: () => void;
  onToggleVPRView: () => void;
}

type MenuCategory = 'mining' | 'exploration' | 'mothership' | 'colony';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  action: () => void;
  moduleType?: ModuleType;
  cost?: Partial<Record<ResourceType, number>>;
}

/**
 * Custom notification interface for future implementation
 *
 * This interface will be used in future implementations to:
 * 1. Create a custom notification system with more advanced features
 * 2. Support different notification types beyond the current system
 * 3. Enable notification grouping and prioritization
 * 4. Add interactive elements to notifications
 * 5. Support notification persistence and history
 *
 * @deprecated This interface is not currently used but will be implemented
 * in the upcoming notification system upgrade. It is kept here for reference.
 */
interface _Notification {
  id: string;
  type: 'success' | 'error';
  message: string;
}

// Use the _Notification interface in a function to prevent "unused" error
/**
 * Creates a notification object using the _Notification interface.
 * This function will be used in the future notification system upgrade.
 *
 * @param type - The type of notification ('success' or 'error')
 * @param message - The notification message
 * @returns A notification object conforming to the _Notification interface
 * @deprecated This function is not currently used but will be implemented
 * in the upcoming notification system upgrade. It is kept here for reference.
 */

// Prefixed with underscore to indicate it's intentionally unused
function _createNotification(type: 'success' | 'error', message: string): _Notification {
  return {
    id: `notification-${Date.now()}`,
    type,
    message,
  };
}

// Category color mapping
const categoryColors: Record<MenuCategory, { bg: string; border: string; hover: string }> = {
  mining: {
    bg: 'from-amber-900/90 to-amber-800/80',
    border: 'border-amber-700/50',
    hover: 'hover:bg-amber-800/50 hover:border-amber-600/50',
  },
  exploration: {
    bg: 'from-blue-900/90 to-blue-800/80',
    border: 'border-blue-700/50',
    hover: 'hover:bg-blue-800/50 hover:border-blue-600/50',
  },
  mothership: {
    bg: 'from-indigo-900/90 to-indigo-800/80',
    border: 'border-indigo-700/50',
    hover: 'hover:bg-indigo-800/50 hover:border-indigo-600/50',
  },
  colony: {
    bg: 'from-green-900/90 to-green-800/80',
    border: 'border-green-700/50',
    hover: 'hover:bg-green-800/50 hover:border-green-600/50',
  },
};

// Category icons
const categoryIcons: Record<MenuCategory, React.ReactNode> = {
  mining: <Database size={18} />,
  exploration: <MapIcon size={18} />,
  mothership: <Rocket size={18} />,
  colony: <Crown size={18} />,
};

/**
 * GameHUD component for displaying game interface
 * @context: ui-system, game-hud, performance-optimization
 */
export function GameHUD({ empireName, onToggleSprawlView, onToggleVPRView }: GameHUDProps) {
  // Track render performance in development
  useRenderPerformance('GameHUD');

  // Game state
  const gameState = useGameState(state => state);
  const gameDispatch = useGameDispatch();

  // Module state
  const modules = useModules(state => state);
  const moduleDispatch = useModuleDispatch();

  // VPR state
  const vprSystem = useVPRSystem();

  // Local state
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(null);
  const [showTechTree, setShowTechTree] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTooltip, setShowTooltip] = useState<{ id: string; x: number; y: number } | null>(null);

  // Lazy load heavy components to improve initial load time
  const { Component: TechTreeComponent, loading: techTreeLoading } = useLazyComponent<{
    visible: boolean;
    onClose: () => void;
  }>(() => import('./TechTree'), [showTechTree]);

  const { Component: ResourceVisualizationComponent, loading: resourceVisLoading } =
    useLazyComponent<{
      type: ResourceType;
      value: number;
    }>(() => import('./visualization/ResourceVisualization'), []);

  // Define simple type here to avoid import issues
  type MiniMapStarStatus = 'locked' | 'unlocked' | 'colonized' | 'hostile';

  const { Component: MiniMapComponent, loading: miniMapLoading } = useLazyComponent<{
    stars: Array<{ id: string; name: string; position: Position; status: MiniMapStarStatus }>;
    viewport: { position: Position; zoom: number; width: number; height: number };
  }>(
    () =>
      import('./game/MiniMap').then(module => ({
        default: (props: {
          stars: Array<{ id: string; name: string; position: Position; status: MiniMapStarStatus }>;
          viewport: { position: Position; zoom: number; width: number; height: number };
        }) => <module.MiniMap {...props} />,
      })),
    []
  );

  // Add keyboard shortcut handling
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Function keys for special actions
      if (event.key === 'F1') {
        event.preventDefault();
        setShowTechTree(prev => !prev);
      } else if (event.key === 'F2') {
        event.preventDefault();
        setShowSettings(prev => !prev);
      } else if (event.key === 'Escape') {
        if (showTechTree) {
          setShowTechTree(false);
        } else if (showSettings) {
          setShowSettings(false);
        } else if (activeCategory) {
          setActiveCategory(null);
        }
      }

      // Alt + key combinations for menu categories
      if (event.altKey) {
        if (event.key === 'm') {
          event.preventDefault();
          setActiveCategory('mining');
        } else if (event.key === 'e') {
          event.preventDefault();
          setActiveCategory('exploration');
        } else if (event.key === 's') {
          event.preventDefault();
          setActiveCategory('mothership');
        } else if (event.key === 'c') {
          event.preventDefault();
          setActiveCategory('colony');
        }
      }
    },
    [activeCategory, showSettings, showTechTree]
  );

  // Set up keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Toggle sidebar collapsed state
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Ensure contexts are available
  if (!gameState || !modules) {
    return null;
  }

  // Check if a module can be built based on resources and available attachment points
  const canBuildModule = (
    moduleType: ModuleType,
    cost: Partial<Record<ResourceType, number>>
  ): boolean => {
    console.warn('Checking if can build module:', moduleType, cost);

    // Check resources using enum keys
    const hasResources =
      (cost[ResourceType.MINERALS] ?? 0) <= (gameState.resources[ResourceType.MINERALS] ?? 0) &&
      (cost[ResourceType.ENERGY] ?? 0) <= (gameState.resources[ResourceType.ENERGY] ?? 0);

    if (!hasResources) {
      console.warn('Not enough resources to build module');
      return false;
    }

    // Find a suitable building and attachment point
    for (const building of modules.buildings) {
      for (const point of building.attachmentPoints) {
        if (point.allowedTypes.includes(moduleType) && !point.currentModule) {
          console.warn('Found suitable attachment point for module');
          return true;
        }
      }
    }

    console.warn('No suitable attachment point found for module');
    return false;
  };

  // Build a module
  const buildModuleLocally = (
    moduleType: ModuleType,
    cost: Partial<Record<ResourceType, number>>
  ): boolean => {
    const existingModules = Object.values(modules.modules);
    const totalModulesOfType = existingModules.filter(m => m.type === moduleType).length;

    // Set module ID with a counter for easy identification
    const moduleId = `${moduleType.toLowerCase()}_${totalModulesOfType + 1}_${Date.now()}`;

    // Find a building to attach to
    let buildingId: string | null = null;
    let attachmentPointId: string | null = null;

    buildingLoop: for (const building of modules.buildings) {
      for (const point of building.attachmentPoints) {
        if (point.allowedTypes.includes(moduleType) && !point.currentModule) {
          buildingId = building.id;
          attachmentPointId = point.id;
          break buildingLoop;
        }
      }
    }

    if (!buildingId || !attachmentPointId) {
      errorLoggingService.logError(
        new Error(`No suitable attachment point found for module ${moduleType}`),
        ErrorType.CONFIGURATION,
        ErrorSeverity.MEDIUM,
        {
          componentName: 'GameHUD',
          action: 'buildModuleLocally',
          moduleType,
          availableBuildings: modules.buildings.map(b => b.id).join(','),
        }
      );
      return false;
    }

    // Create the module
    const module: Module = {
      id: moduleId,
      name: `${moduleType} Module ${totalModulesOfType + 1}`,
      type: moduleType,
      status: ModuleStatus.ACTIVE,
      buildingId,
      attachmentPointId,
      position: { x: 0, y: 0 }, // Default position, will be updated based on attachment point
      isActive: true,
      level: 1,
    };

    // Update game state for minerals using enum keys
    if (cost[ResourceType.MINERALS]) {
      gameDispatch({
        type: GameActionType.UPDATE_RESOURCES,
        payload: {
          [ResourceType.MINERALS]:
            (gameState.resources[ResourceType.MINERALS] ?? 0) - (cost[ResourceType.MINERALS] ?? 0),
        },
      });
    }

    // Update game state for energy using enum keys
    if (cost[ResourceType.ENERGY]) {
      gameDispatch({
        type: GameActionType.UPDATE_RESOURCES,
        payload: {
          [ResourceType.ENERGY]:
            (gameState.resources[ResourceType.ENERGY] ?? 0) - (cost[ResourceType.ENERGY] ?? 0),
        },
      });
    }

    // Register with module system
    moduleDispatch({
      type: ModuleActionType.ADD_MODULE,
      payload: {
        module,
      },
    });

    // Register with the VPR system for visualization
    vprSystem.addModule(
      moduleId,
      moduleType === 'resource-manager'
        ? 'mining'
        : moduleType === 'radar'
          ? 'exploration'
          : moduleType === 'hangar'
            ? 'mothership'
            : 'colony'
    );

    // Emit module created event for the event system
    moduleEventBus.emit({
      type: 'MODULE_CREATED',
      moduleId,
      moduleType,
      timestamp: Date.now(),
      data: module as unknown as Record<string, unknown>,
    });

    console.warn('New module built:', module); // Changed from console.log to console.warn
    return true;
  };

  // Add notification to the notification system
  const addNotification = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string
  ): void => {
    notificationManager.show({
      type,
      title,
      message,
    });
  };

  // Toggle tech tree display
  const toggleTechTree = () => {
    setShowTechTree(prev => !prev);
  };

  // Toggle settings panel
  const toggleSettings = () => {
    setShowSettings(prev => !prev);
  };

  // Function to format tooltip display
  const _formatTooltip = (item: MenuItem): string => {
    let tooltip = `<div class="tooltip-content">
      <h3 class="tooltip-title">${item.name}</h3>
      <p class="tooltip-desc">${item.description}</p>`;

    if (item.cost) {
      tooltip += '<div class="tooltip-cost">';
      if (item.cost[ResourceType.MINERALS]) {
        tooltip += `<div class="tooltip-resource">
          <span class="tooltip-resource-icon">💎</span>
          <span class="tooltip-resource-amount">${item.cost[ResourceType.MINERALS]} minerals</span>
        </div>`;
      }
      if (item.cost[ResourceType.ENERGY]) {
        tooltip += `<div class="tooltip-resource">
          <span class="tooltip-resource-icon">⚡</span>
          <span class="tooltip-resource-amount">${item.cost[ResourceType.ENERGY]} energy</span>
        </div>`;
      }
      tooltip += '</div>';
    }

    tooltip += '</div>';
    return tooltip;
  };

  // Render tooltip content
  const renderTooltip = () => {
    if (!showTooltip) {
      return null;
    }

    const activeItems = menuItems[activeCategory as MenuCategory];
    if (!activeItems) {
      return null;
    }

    const currentItem = activeItems.find(item => item.id === showTooltip.id);
    if (!currentItem) {
      return null;
    }

    return (
      <div
        className="absolute z-50 w-64 rounded-lg border border-gray-800 bg-gray-900 p-3 shadow-lg"
        style={{
          left: `${showTooltip.x}px`,
          top: `${showTooltip.y}px`,
        }}
      >
        <h3 className="mb-1 text-lg font-bold text-white">{currentItem.name}</h3>
        <p className="mb-2 text-sm text-gray-300">{currentItem.description}</p>
        {currentItem.cost && (
          <div className="mt-2 flex flex-col space-y-1 text-sm">
            {currentItem.cost[ResourceType.MINERALS] && (
              <div
                className={`flex items-center space-x-1 ${
                  (gameState.resources[ResourceType.MINERALS] ?? 0) <
                  (currentItem.cost[ResourceType.MINERALS] ?? 0)
                    ? 'text-red-400'
                    : 'text-amber-300'
                }`}
              >
                <span>💎</span>
                <span>
                  {currentItem.cost[ResourceType.MINERALS]} minerals{' '}
                  {(gameState.resources[ResourceType.MINERALS] ?? 0) <
                    (currentItem.cost[ResourceType.MINERALS] ?? 0) && (
                    <span className="text-red-400">(insufficient)</span>
                  )}
                </span>
              </div>
            )}
            {currentItem.cost[ResourceType.ENERGY] && (
              <div
                className={`flex items-center space-x-1 ${
                  (gameState.resources[ResourceType.ENERGY] ?? 0) <
                  (currentItem.cost[ResourceType.ENERGY] ?? 0)
                    ? 'text-red-400'
                    : 'text-cyan-300'
                }`}
              >
                <span>⚡</span>
                <span>
                  {currentItem.cost[ResourceType.ENERGY]} energy{' '}
                  {(gameState.resources[ResourceType.ENERGY] ?? 0) <
                    (currentItem.cost[ResourceType.ENERGY] ?? 0) && (
                    <span className="text-red-400">(insufficient)</span>
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Define menu items using enum keys for cost
  const menuItems: Record<MenuCategory, MenuItem[]> = {
    mining: [
      {
        id: 'mining_resource_generator',
        name: 'Energy Generator',
        description: 'Generates energy for your empire',
        moduleType: 'resource-manager',
        cost: {
          [ResourceType.MINERALS]: 50,
        },
        action: () => {
          const cost = { [ResourceType.MINERALS]: 50 };
          const canBuild = canBuildModule('resource-manager', cost);
          if (canBuild) {
            if (buildModuleLocally('resource-manager', cost)) {
              addNotification(
                'success',
                'Module Built',
                'Energy Generator has been successfully constructed.'
              );
            }
          } else {
            addNotification(
              'error',
              'Cannot Build',
              'Insufficient resources or no suitable attachment point.'
            );
          }
        },
      },
      {
        id: 'mining_mineral_extractor',
        name: 'Mineral Extractor',
        description: 'Extracts minerals from nearby sources',
        moduleType: 'mineral',
        cost: {
          [ResourceType.MINERALS]: 30,
          [ResourceType.ENERGY]: 20,
        },
        action: () => {
          const cost = { [ResourceType.MINERALS]: 30, [ResourceType.ENERGY]: 20 };
          const canBuild = canBuildModule('mineral', cost);
          if (canBuild) {
            if (buildModuleLocally('mineral', cost)) {
              addNotification(
                'success',
                'Module Built',
                'Mineral Extractor has been successfully constructed.'
              );
            }
          } else {
            addNotification(
              'error',
              'Cannot Build',
              'Insufficient resources or no suitable attachment point.'
            );
          }
        },
      },
    ],
    exploration: [
      {
        id: 'exploration_research_lab',
        name: 'Research Laboratory',
        description: 'Conducts research to unlock new technologies',
        moduleType: ResourceType.RESEARCH,
        cost: {
          [ResourceType.MINERALS]: 40,
          [ResourceType.ENERGY]: 30,
        },
        action: () => {
          const cost = { [ResourceType.MINERALS]: 40, [ResourceType.ENERGY]: 30 };
          const canBuild = canBuildModule(ResourceType.RESEARCH, cost);
          if (canBuild) {
            if (buildModuleLocally(ResourceType.RESEARCH, cost)) {
              addNotification(
                'success',
                'Module Built',
                'Research Laboratory has been successfully constructed.'
              );
            }
          } else {
            addNotification(
              'error',
              'Cannot Build',
              'Insufficient resources or no suitable attachment point.'
            );
          }
        },
      },
    ],
    mothership: [
      {
        id: 'mothership_command_center',
        name: 'Command Center',
        description: 'Central hub for managing empire operations',
        moduleType: 'hangar',
        cost: {
          [ResourceType.MINERALS]: 100,
          [ResourceType.ENERGY]: 80,
        },
        action: () => {
          const cost = { [ResourceType.MINERALS]: 100, [ResourceType.ENERGY]: 80 };
          const canBuild = canBuildModule('hangar', cost);
          if (canBuild) {
            if (buildModuleLocally('hangar', cost)) {
              addNotification(
                'success',
                'Module Built',
                'Command Center has been successfully constructed.'
              );
            }
          } else {
            addNotification(
              'error',
              'Cannot Build',
              'Insufficient resources or no suitable attachment point.'
            );
          }
        },
      },
    ],
    colony: [
      {
        id: 'colony_habitat',
        name: 'Habitat Module',
        description: 'Living quarters for your colonists',
        moduleType: ResourceType.POPULATION,
        cost: {
          [ResourceType.MINERALS]: 60,
          [ResourceType.ENERGY]: 40,
        },
        action: () => {
          const cost = { [ResourceType.MINERALS]: 60, [ResourceType.ENERGY]: 40 };
          const canBuild = canBuildModule(ResourceType.POPULATION, cost);
          if (canBuild) {
            if (buildModuleLocally(ResourceType.POPULATION, cost)) {
              addNotification(
                'success',
                'Module Built',
                'Habitat Module has been successfully constructed.'
              );
            }
          } else {
            addNotification(
              'error',
              'Cannot Build',
              'Insufficient resources or no suitable attachment point.'
            );
          }
        },
      },
    ],
  };

  // Get updated menu items based on current game state
  const getUpdatedMenuItems = () => {
    return {
      ...menuItems,
    };
  };

  // Get dynamic style for category button based on state
  const getCategoryStyle = (category: MenuCategory) => {
    return `flex items-center rounded-lg border p-3 transition-colors duration-200 ${
      categoryColors[category].border
    } ${categoryColors[category].bg} ${
      category === activeCategory ? 'ring-2 ring-white/20' : categoryColors[category].hover
    }`;
  };

  // Memoized menu items
  const menuItemsMemo = useMemo(
    () => getUpdatedMenuItems(),
    [
      gameState.resources[ResourceType.MINERALS],
      gameState.resources[ResourceType.ENERGY],
      modules.buildings,
    ]
  );

  return (
    <div className="flex h-screen flex-col bg-gray-900 font-sans text-white">
      {/* Top header with empire info and resources */}
      <div className="bg-opacity-90 flex items-center justify-between border-b border-gray-800 bg-gray-900 p-2">
        <div className="flex items-center space-x-4">
          <button
            className="flex items-center rounded border border-gray-700 bg-gray-800 px-3 py-1 text-xs"
            onClick={onToggleSprawlView}
          >
            <span className="mr-1">⚡</span>
            {empireName}
          </button>
          <button
            className="flex items-center rounded border border-purple-900 bg-purple-950 px-3 py-1 text-xs text-purple-200"
            onClick={onToggleVPRView}
          >
            <Info size={12} className="mr-1" />
            Toggle VPR Mode
          </button>
          <div className="flex items-center rounded-lg border border-gray-800 bg-gray-800 px-3 py-1 text-xs">
            <AlertTriangle size={12} className="mr-1 text-yellow-400" />
            <span className="text-yellow-300">Alert Level: Normal</span>
          </div>
          {/* Add sidebar collapse toggle */}
          <button
            className="flex items-center rounded border border-gray-700 bg-gray-800 px-3 py-1 text-xs"
            onClick={toggleSidebar}
          >
            <span className="mr-1">{sidebarCollapsed ? '→' : '←'}</span>
            {sidebarCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
        <div className="game-hud__resources-container">
          {resourceVisLoading ? (
            <div className="loading-placeholder">Loading resources...</div>
          ) : (
            ResourceVisualizationComponent && (
              <ResourceVisualizationComponent
                type={ResourceType.MINERALS}
                value={gameState.resources[ResourceType.MINERALS] ?? 0}
              />
            )
          )}
        </div>
        <div className="flex space-x-4">
          <ResourceVisualization
            type={ResourceType.MINERALS}
            value={gameState.resources[ResourceType.MINERALS] ?? 0}
          />
          <ResourceVisualization
            type={ResourceType.ENERGY}
            value={gameState.resources[ResourceType.ENERGY] ?? 0}
          />
        </div>
      </div>
      {/* Main content with menu and active panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left menu with categories */}
        <div
          className={`flex ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-opacity-60 flex-col overflow-y-auto border-r border-gray-800 bg-gray-900 transition-all duration-300`}
        >
          {/* Menu categories */}
          <div className="space-y-2 p-4">
            {Object.keys(menuItems).map(category => (
              <button
                key={category}
                className={getCategoryStyle(category as MenuCategory)}
                onClick={() => setActiveCategory(category as MenuCategory)}
              >
                {categoryIcons[category as MenuCategory]}
                {!sidebarCollapsed && (
                  <>
                    <span className="ml-2 font-medium">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">Alt+{category.charAt(0)}</span>
                  </>
                )}
              </button>
            ))}
          </div>
          {/* Action buttons at the bottom */}
          <div className="mt-auto space-y-2 border-t border-gray-800 p-4">
            <button
              className="flex w-full items-center rounded-lg border border-indigo-700/50 bg-indigo-900/30 px-4 py-2 transition-colors duration-200 hover:bg-indigo-800/40"
              onClick={toggleTechTree}
            >
              <Terminal size={18} />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-2 font-medium text-white">Tech Tree</span>
                  <span className="ml-auto text-xs text-gray-400">F1</span>
                </>
              )}
            </button>
            <button
              className="flex w-full items-center rounded-lg border border-gray-700/50 bg-gray-900/30 px-4 py-2 transition-colors duration-200 hover:bg-gray-800/40"
              onClick={toggleSettings}
            >
              <Settings size={18} />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-2 font-medium text-white">Settings</span>
                  <span className="ml-auto text-xs text-gray-400">F2</span>
                </>
              )}
            </button>
          </div>
        </div>
        {/* Right panel with active category content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeCategory ? (
            <div>
              {/* Category header */}
              <div
                className={`mb-6 border-b pb-4 ${
                  categoryColors[activeCategory].border
                } flex items-center justify-between`}
              >
                <h2 className="flex items-center text-2xl font-bold text-white">
                  {categoryIcons[activeCategory]}
                  <span className="ml-2">
                    {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
                  </span>
                </h2>
                <button
                  className="rounded-full p-1 transition-colors duration-200 hover:bg-gray-800"
                  onClick={() => setActiveCategory(null)}
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              {/* Category items */}
              <div className="space-y-3">
                {menuItemsMemo[activeCategory].map(item => (
                  <button
                    key={item.id}
                    className={`w-full rounded-lg border p-4 text-left ${
                      categoryColors[activeCategory].border
                    } bg-opacity-50 hover:bg-opacity-70 bg-gray-800 transition-colors duration-200`}
                    onClick={item.action}
                    onMouseEnter={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setShowTooltip({
                        id: item.id,
                        x: rect.right,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setShowTooltip(null)}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-medium text-white">{item.name}</h3>
                      {item.cost && (
                        <div className="flex space-x-3 text-sm">
                          {item.cost[ResourceType.MINERALS] && (
                            <span
                              className={`rounded px-2 py-1 ${
                                (gameState.resources[ResourceType.MINERALS] ?? 0) <
                                (item.cost[ResourceType.MINERALS] ?? 0)
                                  ? 'bg-red-900/60 text-red-300'
                                  : 'bg-amber-900/60 text-amber-300'
                              }`}
                            >
                              {item.cost[ResourceType.MINERALS]} minerals
                            </span>
                          )}
                          {item.cost[ResourceType.ENERGY] && (
                            <span
                              className={`rounded px-2 py-1 ${
                                (gameState.resources[ResourceType.ENERGY] ?? 0) <
                                (item.cost[ResourceType.ENERGY] ?? 0)
                                  ? 'bg-red-900/60 text-red-300'
                                  : 'bg-cyan-900/60 text-cyan-300'
                              }`}
                            >
                              {item.cost[ResourceType.ENERGY]} energy
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-gray-300">{item.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Welcome screen when no category is selected */
            <div className="flex h-full flex-col items-center justify-center text-center">
              <h2 className="mb-4 text-2xl font-bold text-white">Welcome to {empireName}</h2>
              <p className="mb-8 max-w-md text-gray-300">
                Select a category from the left menu to manage your empire. Build modules to expand
                your capabilities.
              </p>
              <div className="grid w-full max-w-md grid-cols-2 gap-4">
                {Object.keys(menuItems).map(category => (
                  <button
                    key={category}
                    className={`rounded-lg border p-4 ${
                      categoryColors[category as MenuCategory].border
                    } hover:bg-opacity-70 bg-gray-800/50 transition-colors duration-200`}
                    onClick={() => setActiveCategory(category as MenuCategory)}
                  >
                    <div className="flex flex-col items-center justify-center">
                      {categoryIcons[category as MenuCategory]}
                      <span className="mt-2 font-medium text-white">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </span>
                      <span className="mt-1 text-xs text-gray-400">Alt+{category.charAt(0)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tech Tree Modal */}
      {showTechTree && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-8 backdrop-blur-sm">
          {techTreeLoading ? (
            <div className="text-white">Loading Tech Tree...</div>
          ) : (
            TechTreeComponent && (
              <TechTreeComponent visible={showTechTree} onClose={toggleTechTree} />
            )
          )}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-8 backdrop-blur-sm">
          <_SettingsPanel />
          <button
            onClick={toggleSettings}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
      )}

      {/* Mini Map (if needed) */}
      {!miniMapLoading && MiniMapComponent && activeCategory === 'exploration' && (
        <div className="absolute right-4 bottom-4 h-64 w-64 rounded-lg border border-gray-700 bg-gray-900 shadow-lg">
          <MiniMapComponent
            stars={[
              { id: '1', name: 'Alpha', position: { x: 10, y: 10 }, status: 'colonized' },
              { id: '2', name: 'Beta', position: { x: 50, y: 30 }, status: 'unlocked' },
              { id: '3', name: 'Gamma', position: { x: 30, y: 60 }, status: 'locked' },
            ]}
            viewport={{ position: { x: 0, y: 0 }, zoom: 1, width: 64, height: 64 }}
          />
        </div>
      )}

      {/* Tooltips */}
      {renderTooltip()}
      {/* Notification system */}
      <NotificationSystem />
    </div>
  );
}
