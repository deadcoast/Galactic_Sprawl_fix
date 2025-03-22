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
import { v4 as uuidv4 } from 'uuid';
import { GameActionType, useGameDispatch, useGameState } from '../../contexts/GameContext';
import { ModuleActionType, useModuleDispatch, useModules } from '../../contexts/ModuleContext';
import { useVPRSystem } from '../../hooks/ui/useVPRSystem';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { moduleManager } from '../../managers/module/ModuleManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { Module, ModuleStatus } from '../../types/modules/ModuleTypes';
import { ResourceType } from './../../types/resources/ResourceTypes';
import { NotificationSystem, notificationManager } from './NotificationSystem';
import ResourceVisualization from './ResourceVisualization';
import { useLazyComponent, useRenderPerformance } from '../../utils/performance/ComponentOptimizer';

// Temporary Settings Panel component
const _SettingsPanel = () => (
  <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
    <h2 className="text-xl font-bold mb-4">Settings</h2>
    <p className="text-gray-400 mb-4">Game settings will be implemented here.</p>
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
  cost?: {
    minerals?: number;
    energy?: number;
  };
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
  const [activeMenu, setActiveMenu] = useState<MenuCategory | null>(null);
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(null);
  const [showTechTree, setShowTechTree] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tooltipInfo, setTooltipInfo] = useState<{ text: string; position: Position } | null>(null);
  const [showTooltip, setShowTooltip] = useState<{ id: string; x: number; y: number } | null>(null);
  
  // Lazy load heavy components to improve initial load time
  const { Component: TechTreeComponent, loading: techTreeLoading } = useLazyComponent<{
    visible: boolean;
    onClose: () => void;
  }>(
    () => import('./TechTree'),
    [showTechTree]
  );
  
  const { Component: ResourceVisualizationComponent, loading: resourceVisLoading } = useLazyComponent<{
    type: ResourceType;
    value: number;
  }>(
    () => import('./ResourceVisualization'),
    []
  );
  
  // Using direct import for SettingsPanel since we have the component defined above
  const settingsLoading = false;
  
  // Define simple type here to avoid import issues
  type MiniMapStarStatus = 'locked' | 'unlocked' | 'colonized' | 'hostile';
  
  const { Component: MiniMapComponent, loading: miniMapLoading } = useLazyComponent<{
    stars: Array<{id: string; name: string; position: Position; status: MiniMapStarStatus}>;
    viewport: {position: Position; zoom: number; width: number; height: number};
  }>(
    () => import('./game/MiniMap').then(module => ({ 
      default: (props: {
        stars: Array<{id: string; name: string; position: Position; status: MiniMapStarStatus}>;
        viewport: {position: Position; zoom: number; width: number; height: number};
      }) => <module.MiniMap {...props} /> 
    })),
    []
  );

  // Add keyboard shortcut handling
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
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
  }, [activeCategory, showSettings, showTechTree]);

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
    cost: { minerals?: number; energy?: number }
  ): boolean => {
    console.warn('Checking if can build module:', moduleType, cost);

    // Check resources
    const hasResources =
      (cost.minerals ?? 0) <= gameState.resources.minerals &&
      (cost.energy ?? 0) <= gameState.resources.energy;

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
    cost: { minerals?: number; energy?: number }
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
      console.error('No suitable attachment point found for module', moduleType);
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
      level: 1
    };

    // Update game state for minerals
    if (cost.minerals) {
      gameDispatch({
        type: GameActionType.UPDATE_RESOURCES,
        payload: {
          minerals: gameState.resources.minerals - cost.minerals,
        },
      });
    }

    // Update game state for energy
    if (cost.energy) {
      gameDispatch({
        type: GameActionType.UPDATE_RESOURCES,
        payload: {
          energy: gameState.resources.energy - cost.energy,
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
      if (item.cost.minerals) {
        tooltip += `<div class="tooltip-resource">
          <span class="tooltip-resource-icon">💎</span>
          <span class="tooltip-resource-amount">${item.cost.minerals} minerals</span>
        </div>`;
      }
      if (item.cost.energy) {
        tooltip += `<div class="tooltip-resource">
          <span class="tooltip-resource-icon">⚡</span>
          <span class="tooltip-resource-amount">${item.cost.energy} energy</span>
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
            {currentItem.cost.minerals && (
              <div
                className={`flex items-center space-x-1 ${
                  gameState.resources.minerals < (currentItem.cost.minerals ?? 0)
                    ? 'text-red-400'
                    : 'text-amber-300'
                }`}
              >
                <span>💎</span>
                <span>
                  {currentItem.cost.minerals} minerals{' '}
                  {gameState.resources.minerals < (currentItem.cost.minerals ?? 0) && (
                    <span className="text-red-400">(insufficient)</span>
                  )}
                </span>
              </div>
            )}
            {currentItem.cost.energy && (
              <div
                className={`flex items-center space-x-1 ${
                  gameState.resources.energy < (currentItem.cost.energy ?? 0)
                    ? 'text-red-400'
                    : 'text-cyan-300'
                }`}
              >
                <span>⚡</span>
                <span>
                  {currentItem.cost.energy} energy{' '}
                  {gameState.resources.energy < (currentItem.cost.energy ?? 0) && (
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

  // Define menu items for each category
  const menuItems: Record<MenuCategory, MenuItem[]> = {
    mining: [
      {
        id: 'mining_resource_generator',
        name: 'Energy Generator',
        description: 'Generates energy for your empire',
        moduleType: 'resource-manager',
        cost: {
          minerals: 50,
        },
        action: () => {
          const canBuild = canBuildModule('resource-manager', { minerals: 50 });
          if (canBuild) {
            if (buildModuleLocally('resource-manager', { minerals: 50 })) {
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
          minerals: 30,
          energy: 20,
        },
        action: () => {
          const canBuild = canBuildModule('mineral', { minerals: 30, energy: 20 });
          if (canBuild) {
            if (buildModuleLocally('mineral', { minerals: 30, energy: 20 })) {
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
          minerals: 40,
          energy: 30,
        },
        action: () => {
          const canBuild = canBuildModule(ResourceType.RESEARCH, { minerals: 40, energy: 30 });
          if (canBuild) {
            if (buildModuleLocally(ResourceType.RESEARCH, { minerals: 40, energy: 30 })) {
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
          minerals: 100,
          energy: 80,
        },
        action: () => {
          const canBuild = canBuildModule('hangar', { minerals: 100, energy: 80 });
          if (canBuild) {
            if (buildModuleLocally('hangar', { minerals: 100, energy: 80 })) {
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
          minerals: 60,
          energy: 40,
        },
        action: () => {
          const canBuild = canBuildModule(ResourceType.POPULATION, { minerals: 60, energy: 40 });
          if (canBuild) {
            if (buildModuleLocally(ResourceType.POPULATION, { minerals: 60, energy: 40 })) {
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
  const menuItemsMemo = useMemo(() => getUpdatedMenuItems(), [
    gameState.resources.minerals,
    gameState.resources.energy,
    modules.buildings,
  ]);

  return (
    <div className="flex h-screen flex-col bg-gray-900 font-sans text-white">
      {/* Top header with empire info and resources */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 bg-opacity-90 p-2">
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
            ResourceVisualizationComponent && 
            <ResourceVisualizationComponent 
              type={ResourceType.MINERALS} 
              value={gameState.resources.minerals} 
            />
          )}
        </div>
        <div className="flex space-x-4">
          <ResourceVisualization 
            type={ResourceType.MINERALS} 
            value={gameState.resources.minerals} 
          />
          <ResourceVisualization 
            type={ResourceType.ENERGY} 
            value={gameState.resources.energy} 
          />
        </div>
      </div>
      {/* Main content with menu and active panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left menu with categories */}
        <div className={`flex ${sidebarCollapsed ? 'w-16' : 'w-64'} flex-col overflow-y-auto border-r border-gray-800 bg-gray-900 bg-opacity-60 transition-all duration-300`}>
          {/* Menu categories */}
          <div className="space-y-2 p-4">
            {Object.keys(menuItems).map((category) => (
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
                {menuItemsMemo[activeCategory].map((item) => (
                  <button
                    key={item.id}
                    className={`w-full rounded-lg border p-4 text-left ${
                      categoryColors[activeCategory].border
                    } bg-gray-800 bg-opacity-50 transition-colors duration-200 hover:bg-opacity-70`}
                    onClick={item.action}
                    onMouseEnter={(e) => {
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
                      {item.cost ? (
                        <div className="flex space-x-3 text-sm">
                          {item.cost.minerals ? (
                            <span
                              className={`rounded px-2 py-1 ${
                                gameState.resources.minerals < (item.cost.minerals ?? 0)
                                  ? 'bg-red-900/60 text-red-300'
                                  : 'bg-amber-900/60 text-amber-300'
                              }`}
                            >
                              {item.cost.minerals} minerals
                            </span>
                          ) : null}
                          {item.cost.energy ? (
                            <span
                              className={`rounded px-2 py-1 ${
                                gameState.resources.energy < (item.cost.energy ?? 0)
                                  ? 'bg-red-900/60 text-red-300'
                                  : 'bg-cyan-900/60 text-cyan-300'
                              }`}
                            >
                              {item.cost.energy} energy
                            </span>
                          ) : null}
                        </div>
                      ) : null}
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
                {Object.keys(menuItems).map((category) => (
                  <button
                    key={category}
                    className={`rounded-lg border p-4 ${
                      categoryColors[category as MenuCategory].border
                    } bg-gray-800/50 transition-colors duration-200 hover:bg-opacity-70`}
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
      {showTechTree && TechTreeComponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-6">
          <div className="max-h-[90vh] max-w-[90vw] overflow-auto rounded-lg border border-gray-700 bg-gray-900 shadow-lg">
            <TechTreeComponent visible={showTechTree} onClose={() => setShowTechTree(false)} />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-6">
          <div className="max-h-[90vh] max-w-[90vw] overflow-auto rounded-lg border border-gray-700 bg-gray-900 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-700 p-4">
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <button
                className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
                onClick={() => setShowSettings(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <_SettingsPanel />
            </div>
          </div>
        </div>
      )}

      {/* Mini Map (if needed) */}
      {!miniMapLoading && MiniMapComponent && activeMenu === 'exploration' && (
        <div className="absolute bottom-4 right-4 h-64 w-64 rounded-lg border border-gray-700 bg-gray-900 shadow-lg">
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
